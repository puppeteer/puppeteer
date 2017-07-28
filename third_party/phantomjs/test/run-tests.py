#!/usr/bin/env python

import argparse
import collections
import errno
import glob
import imp
import os
import platform
import posixpath
import re
import shlex
import SimpleHTTPServer
import socket
import SocketServer
import ssl
import string
import cStringIO as StringIO
import subprocess
import sys
import threading
import time
import traceback
import urllib

# All files matching one of these glob patterns will be run as tests.
TESTS = [
    'basics/*.js',
    'module/*/*.js',
    'standards/*/*.js',
    'regression/*.js',
]

TIMEOUT    = 7     # Maximum duration of PhantomJS execution (in seconds).
                   # This is a backstop; testharness.js imposes a shorter
                   # timeout.  Both can be increased if necessary.

#
# Utilities
#

# FIXME: assumes ANSI/VT100 escape sequences
# properly this should use curses, but that's an awful lot of work
# One of colors 30 ("black" -- usually a dark gray) and 37 ("white" --
# usually a very light gray) will almost certainly be illegible
# against the terminal background, so we provide neither.
# The colorization mode is global because so is sys.stdout.
_COLOR_NONE = {
    "_": "", "^": "",
    "r": "", "R": "",
    "g": "", "G": "",
    "y": "", "Y": "",
    "b": "", "B": "",
    "m": "", "M": "",
    "c": "", "C": "",
}
_COLOR_ON = {
    "_": "\033[0m",  "^": "\033[1m",
    "r": "\033[31m", "R": "\033[1;31m",
    "g": "\033[32m", "G": "\033[1;32m",
    "y": "\033[33m", "Y": "\033[1;33m",
    "b": "\033[34m", "B": "\033[1;34m",
    "m": "\033[35m", "M": "\033[1;35m",
    "c": "\033[36m", "C": "\033[1;36m",
}
_COLOR_BOLD = {
    "_": "\033[0m", "^": "\033[1m",
    "r": "\033[0m", "R": "\033[1m",
    "g": "\033[0m", "G": "\033[1m",
    "y": "\033[0m", "Y": "\033[1m",
    "b": "\033[0m", "B": "\033[1m",
    "m": "\033[0m", "M": "\033[1m",
    "c": "\033[0m", "C": "\033[1m",
}
_COLORS = None
def activate_colorization(options):
    global _COLORS
    if options.color == "always":
        _COLORS = _COLOR_ON
    elif options.color == "never":
        _COLORS = _COLOR_NONE
    else:
        if sys.stdout.isatty() and platform.system() != "Windows":
            try:
                n = int(subprocess.check_output(["tput", "colors"]))
                if n >= 8:
                    _COLORS = _COLOR_ON
                else:
                    _COLORS = _COLOR_BOLD
            except subprocess.CalledProcessError:
                _COLORS = _COLOR_NONE
        else:
            _COLORS = _COLOR_NONE

def colorize(color, message):
    return _COLORS[color] + message + _COLORS["_"]

# create_default_context and SSLContext were only added in 2.7.9,
# which is newer than the python2 that ships with OSX :-(
# The fallback tries to mimic what create_default_context(CLIENT_AUTH)
# does.  Security obviously isn't important in itself for a test
# server, but making sure the PJS client can talk to a server
# configured according to modern TLS best practices _is_ important.
# Unfortunately, there is no way to set things like OP_NO_SSL2 or
# OP_CIPHER_SERVER_PREFERENCE prior to 2.7.9.
CIPHERLIST_2_7_9 = (
    'ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:ECDH+HIGH:'
    'DH+HIGH:ECDH+3DES:DH+3DES:RSA+AESGCM:RSA+AES:RSA+HIGH:RSA+3DES:!aNULL:'
    '!eNULL:!MD5:!DSS:!RC4'
)
def wrap_socket_ssl(sock, base_path):
    crtfile = os.path.join(base_path, 'certs/https-snakeoil.crt')
    keyfile = os.path.join(base_path, 'certs/https-snakeoil.key')

    try:
        ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ctx.load_cert_chain(crtfile, keyfile)
        return ctx.wrap_socket(sock, server_side=True)

    except AttributeError:
        return ssl.wrap_socket(sock,
                               keyfile=keyfile,
                               certfile=crtfile,
                               server_side=True,
                               ciphers=CIPHERLIST_2_7_9)

# This should be in the standard library somewhere, but as far as I
# can tell, it isn't.
class ResponseHookImporter(object):
    def __init__(self, www_path):
        # All Python response hooks, no matter how deep below www_path,
        # are treated as direct children of the fake "test_www" package.
        if 'test_www' not in sys.modules:
            imp.load_source('test_www', www_path + '/__init__.py')

        self.tr = string.maketrans('-./%', '____')

    def __call__(self, path):
        modname = 'test_www.' + path.translate(self.tr)
        try:
            return sys.modules[modname]
        except KeyError:
            return imp.load_source(modname, path)

# This should also be in the standard library somewhere, and
# definitely isn't.
#
# FIXME: This currently involves *three* threads for every process,
# and a fourth if the process takes input.  (On Unix, clever use of
# select() might be able to get that down to one, but zero is Hard.
# On Windows, we're hosed.  3.4's asyncio module would make everything
# better, but 3.4 is its own can of worms.)
try:
    devnull = subprocess.DEVNULL
except:
    devnull = os.open(os.devnull, os.O_RDONLY)

def do_call_subprocess(command, verbose, stdin_data, timeout):

    def read_thread(linebuf, fp):
        while True:
            line = fp.readline().rstrip()
            if not line: break # EOF
            line = line.rstrip()
            if line:
                linebuf.append(line)
                if verbose >= 3:
                    sys.stdout.write(line + '\n')

    def write_thread(data, fp):
        fp.writelines(data)
        fp.close()

    def reap_thread(proc, timed_out):
        if proc.returncode is None:
            proc.terminate()
            timed_out[0] = True

    class DummyThread:
        def start(self): pass
        def join(self):  pass

    if stdin_data:
        stdin = subprocess.PIPE
    else:
        stdin = devnull

    proc = subprocess.Popen(command,
                            stdin=stdin,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)

    if stdin_data:
        sithrd = threading.Thread(target=write_thread,
                                  args=(stdin_data, proc.stdin))
    else:
        sithrd = DummyThread()

    stdout = []
    stderr = []
    timed_out = [False]
    sothrd = threading.Thread(target=read_thread, args=(stdout, proc.stdout))
    sethrd = threading.Thread(target=read_thread, args=(stderr, proc.stderr))
    rpthrd = threading.Timer(timeout, reap_thread, args=(proc, timed_out))

    sithrd.start()
    sothrd.start()
    sethrd.start()
    rpthrd.start()

    proc.wait()
    if not timed_out[0]: rpthrd.cancel()

    sithrd.join()
    sothrd.join()
    sethrd.join()
    rpthrd.join()

    if timed_out[0]:
        stderr.append("TIMEOUT: Process terminated after {} seconds."
                      .format(timeout))
        if verbose >= 3:
            sys.stdout.write(stderr[-1] + "\n")

    rc = proc.returncode
    if verbose >= 3:
        if rc < 0:
            sys.stdout.write("## killed by signal {}\n".format(-rc))
        else:
            sys.stdout.write("## exit {}\n".format(rc))
    return proc.returncode, stdout, stderr

#
# HTTP/HTTPS server, presented on localhost to the tests
#

class FileHandler(SimpleHTTPServer.SimpleHTTPRequestHandler, object):

    def __init__(self, *args, **kwargs):
        self._cached_untranslated_path = None
        self._cached_translated_path = None
        self.postdata = None
        super(FileHandler, self).__init__(*args, **kwargs)

    # silent, do not pollute stdout nor stderr.
    def log_message(self, format, *args):
        return

    # accept POSTs, read the postdata and stash it in an instance variable,
    # then forward to do_GET; handle_request hooks can vary their behavior
    # based on the presence of postdata and/or the command verb.
    def do_POST(self):
        try:
            ln = int(self.headers.get('content-length'))
        except TypeError, ValueError:
            self.send_response(400, 'Bad Request')
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write("No or invalid Content-Length in POST (%r)"
                             % self.headers.get('content-length'))
            return

        self.postdata = self.rfile.read(ln)
        self.do_GET()

    # allow provision of a .py file that will be interpreted to
    # produce the response.
    def send_head(self):
        path = self.translate_path(self.path)

        # do not allow direct references to .py(c) files,
        # or indirect references to __init__.py
        if (path.endswith('.py') or path.endswith('.pyc') or
            path.endswith('__init__')):
            self.send_error(404, 'File not found')
            return None

        if os.path.exists(path):
            return super(FileHandler, self).send_head()

        py = path + '.py'
        if os.path.exists(py):
            try:
                mod = self.get_response_hook(py)
                return mod.handle_request(self)
            except:
                self.send_error(500, 'Internal Server Error in '+py)
                raise

        self.send_error(404, 'File not found')
        return None

    # modified version of SimpleHTTPRequestHandler's translate_path
    # to resolve the URL relative to the www/ directory
    # (e.g. /foo -> test/www/foo)
    def translate_path(self, path):

        # Cache for efficiency, since our send_head calls this and
        # then, in the normal case, the parent class's send_head
        # immediately calls it again.
        if (self._cached_translated_path is not None and
            self._cached_untranslated_path == path):
            return self._cached_translated_path

        orig_path = path

        # Strip query string and/or fragment, if present.
        x = path.find('?')
        if x != -1: path = path[:x]
        x = path.find('#')
        if x != -1: path = path[:x]

        # Ensure consistent encoding of special characters, then
        # lowercase everything so that the tests behave consistently
        # whether or not the local filesystem is case-sensitive.
        path = urllib.quote(urllib.unquote(path)).lower()

        # Prevent access to files outside www/.
        # At this point we want specifically POSIX-like treatment of 'path'
        # because it is still a URL component and not a filesystem path.
        # SimpleHTTPRequestHandler.send_head() expects us to preserve the
        # distinction between paths with and without a trailing slash, but
        # posixpath.normpath() discards that distinction.
        trailing_slash = path.endswith('/')
        path = posixpath.normpath(path)
        while path.startswith('/'):
            path = path[1:]
        while path.startswith('../'):
            path = path[3:]

        # Now resolve the normalized, clamped path relative to the www/
        # directory, according to local OS conventions.
        path = os.path.normpath(os.path.join(self.www_path, *path.split('/')))
        if trailing_slash:
            # it must be a '/' even on Windows
            path += '/'

        self._cached_untranslated_path = orig_path
        self._cached_translated_path = path
        return path

class TCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    # This is how you are officially supposed to set SO_REUSEADDR per
    # https://docs.python.org/2/library/socketserver.html#SocketServer.BaseServer.allow_reuse_address
    allow_reuse_address = True

    def __init__(self, use_ssl, handler, base_path, signal_error):
        SocketServer.TCPServer.__init__(self, ('localhost', 0), handler)
        if use_ssl:
            self.socket = wrap_socket_ssl(self.socket, base_path)
        self._signal_error = signal_error

    def handle_error(self, request, client_address):
        # Ignore errors which can occur naturally if the client
        # disconnects in the middle of a request.  EPIPE and
        # ECONNRESET *should* be the only such error codes
        # (according to the OSX manpage for send()).
        _, exval, _ = sys.exc_info()
        if getattr(exval, 'errno', None) in (errno.EPIPE, errno.ECONNRESET):
            return

        # Otherwise, report the error to the test runner.
        self._signal_error(sys.exc_info())

class HTTPTestServer(object):
    def __init__(self, base_path, signal_error, verbose):
        self.httpd        = None
        self.httpsd       = None
        self.base_path    = base_path
        self.www_path     = os.path.join(base_path, 'www')
        self.signal_error = signal_error
        self.verbose      = verbose

    def __enter__(self):
        handler = FileHandler
        handler.extensions_map.update({
            '.htm': 'text/html',
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json'
        })
        handler.www_path = self.www_path
        handler.get_response_hook = ResponseHookImporter(self.www_path)

        self.httpd  = TCPServer(False, handler,
                                self.base_path, self.signal_error)
        os.environ['TEST_HTTP_BASE'] = \
            'http://localhost:{}/'.format(self.httpd.server_address[1])
        httpd_thread = threading.Thread(target=self.httpd.serve_forever)
        httpd_thread.daemon = True
        httpd_thread.start()
        if self.verbose >= 3:
            sys.stdout.write("## HTTP server at {}\n".format(
                os.environ['TEST_HTTP_BASE']))

        self.httpsd = TCPServer(True, handler,
                                self.base_path, self.signal_error)
        os.environ['TEST_HTTPS_BASE'] = \
            'https://localhost:{}/'.format(self.httpsd.server_address[1])
        httpsd_thread = threading.Thread(target=self.httpsd.serve_forever)
        httpsd_thread.daemon = True
        httpsd_thread.start()
        if self.verbose >= 3:
            sys.stdout.write("## HTTPS server at {}\n".format(
                os.environ['TEST_HTTPS_BASE']))

        return self

    def __exit__(self, *dontcare):
        self.httpd.shutdown()
        del os.environ['TEST_HTTP_BASE']
        self.httpsd.shutdown()
        del os.environ['TEST_HTTPS_BASE']

#
# Running tests and interpreting their results
#
class TestDetailCode(collections.namedtuple("TestDetailCode", (
        "idx", "color", "short_label", "label", "long_label"))):
    def __index__(self): return self.idx
    def __hash__(self): return self.idx
    def __eq__(self, other): return self.idx == other.idx
    def __ne__(self, other): return self.idx != other.idx

class T(object):
    PASS  = TestDetailCode(0, "g", ".", "pass",  "passed")
    FAIL  = TestDetailCode(1, "R", "F", "FAIL",  "failed")
    XFAIL = TestDetailCode(2, "y", "f", "xfail", "failed as expected")
    XPASS = TestDetailCode(3, "Y", "P", "XPASS", "passed unexpectedly")
    ERROR = TestDetailCode(4, "R", "E", "ERROR", "had errors")
    SKIP  = TestDetailCode(5, "m", "s", "skip",  "skipped")
    UNSUPPORTED  = TestDetailCode(6, "y", "u", "unsupported",  "unsupported")
    MAX   = 7

class TestDetail(object):
    """Holds one block of details about a test that failed."""
    # types of details:

    def __init__(self, message, test_id, detail_type):
        if not isinstance(message, list):
            message = [message]
        self.message = [line.rstrip()
                        for chunk in message
                        for line in chunk.split("\n")]

        self.dtype   = detail_type
        self.test_id = test_id

    def report(self, fp):
        col, label = self.dtype.color, self.dtype.label
        if self.test_id:
            fp.write("{:>5}: {}\n".format(colorize(col, label),
                                          self.test_id))
            lo = 0
        else:
            fp.write("{:>5}: {}\n".format(colorize(col, label),
                                          self.message[0]))
            lo = 1
        for line in self.message[lo:]:
            fp.write("  {}\n".format(colorize("b", line)))

class TestGroup(object):
    """Holds the result of one group of tests (that is, one .js file),
       parsed from the output of run_phantomjs (see below).
       Subclasses specify what the output means.
       A test with zero details is considered to be successful.
    """

    def __init__(self, name):
        self.name    = name
        self.n       = [0]*T.MAX
        self.details = []

    def parse(self, rc, out, err):
        raise NotImplementedError

    def _add_d(self, message, test_id, dtype):
        self.n[dtype] += 1
        self.details.append(TestDetail(message, test_id, dtype))

    def add_pass (self, m, t): self._add_d(m, t, T.PASS)
    def add_fail (self, m, t): self._add_d(m, t, T.FAIL)
    def add_xpass(self, m, t): self._add_d(m, t, T.XPASS)
    def add_xfail(self, m, t): self._add_d(m, t, T.XFAIL)
    def add_error(self, m, t): self._add_d(m, t, T.ERROR)
    def add_skip (self, m, t): self._add_d(m, t, T.SKIP)
    def add_unsupported (self, m, t): self._add_d(m, t, T.UNSUPPORTED)

    def default_interpret_exit_code(self, rc):
        if rc == 0:
            if not self.is_successful() and not self.n[T.ERROR]:
                self.add_error([],
                    "PhantomJS exited successfully when test failed")

        # Exit code -15 indicates a timeout.
        elif rc == 1 or rc == -15:
            if self.is_successful():
                self.add_error([], "PhantomJS exited unsuccessfully")

        elif rc >= 2:
            self.add_error([], "PhantomJS exited with code {}".format(rc))
        else:
            self.add_error([], "PhantomJS killed by signal {}".format(-rc))

    def is_successful(self):
        return self.n[T.FAIL] + self.n[T.XPASS] + self.n[T.ERROR] == 0

    def worst_code(self):
        # worst-to-best ordering
        for code in (T.ERROR, T.FAIL, T.XPASS, T.SKIP, T.XFAIL, T.PASS, T.UNSUPPORTED):
            if self.n[code] > 0:
                return code
        return T.PASS

    def one_char_summary(self, fp):
        code = self.worst_code()
        fp.write(colorize(code.color, code.short_label))
        fp.flush()

    def line_summary(self, fp):
        code = self.worst_code()
        fp.write("{}: {}\n".format(colorize("^", self.name),
                                   colorize(code.color, code.label)))

    def report(self, fp, show_all):
        self.line_summary(fp)
        need_blank_line = False
        for detail in self.details:
            if show_all or detail.dtype not in (T.PASS, T.XFAIL, T.SKIP):
                detail.report(fp)
                need_blank_line = True
        if need_blank_line:
            fp.write("\n")

    def report_for_verbose_level(self, fp, verbose):
        if verbose == 0:
            self.one_char_summary(sys.stdout)
        elif verbose == 1:
            self.report(sys.stdout, False)
        else:
            self.report(sys.stdout, True)

class UnsupportedTestGroup(TestGroup):
    """Test group which is currently unsupported and should
       be skipped altogether.
    """
    def __init__(self, name):
        TestGroup.__init__(self, name)
        self.add_unsupported('', 'Skipping the whole file');


class ExpectTestGroup(TestGroup):
    """Test group whose output must be exactly as specified by directives
       in the file.  This is how you test for an _unsuccessful_ exit code,
       or for output appearing on a specific one of stdout/stderr.
    """
    def __init__(self, name, rc_exp, stdout_exp, stderr_exp,
                 rc_xfail, stdout_xfail, stderr_xfail):
        TestGroup.__init__(self, name)
        if rc_exp is None: rc_exp = 0
        self.rc_exp = rc_exp
        self.stdout_exp = stdout_exp
        self.stderr_exp = stderr_exp
        self.rc_xfail = rc_xfail
        self.stdout_xfail = stdout_xfail
        self.stderr_xfail = stderr_xfail

    def parse(self, rc, out, err):
        self.parse_output("stdout", self.stdout_exp, out, self.stdout_xfail)
        self.parse_output("stderr", self.stderr_exp, err, self.stderr_xfail)

        exit_msg = ["expected exit code {} got {}"
                    .format(self.rc_exp, rc)]

        if rc != self.rc_exp:
            exit_desc = "did not exit as expected"
            if self.rc_xfail:
                self.add_xfail(exit_msg, exit_desc)
            else:
                self.add_fail(exit_msg, exit_desc)
        else:
            exit_desc = "exited as expected"
            if self.rc_xfail:
                self.add_xpass(exit_msg, exit_desc)
            else:
                self.add_pass(exit_msg, exit_desc)

    def parse_output(self, what, exp, got, xfail):
        diff = []
        le = len(exp)
        lg = len(got)
        for i in range(max(le, lg)):
            e = ""
            g = ""
            if i < le: e = exp[i]
            if i < lg: g = got[i]
            if e != g:
                diff.extend(("{}: line {} not as expected".format(what, i+1),
                             "-" + repr(e)[1:-1],
                             "+" + repr(g)[1:-1]))

        if diff:
            desc = what + " not as expected"
            if xfail:
                self.add_xfail(diff, desc)
            else:
                self.add_fail(diff, desc)
        else:
            desc = what + " as expected"
            if xfail:
                self.add_xpass(diff, desc)
            else:
                self.add_pass(diff, desc)


class TAPTestGroup(TestGroup):
    """Test group whose output is interpreted according to a variant of the
       Test Anything Protocol (http://testanything.org/tap-specification.html).

       Relative to that specification, these are the changes:

         * Plan-at-the-end, explanations for directives, and "Bail out!"
           are not supported.  ("1..0 # SKIP: explanation" *is* supported.)
         * "Anything else" lines are an error.
         * Repeating a test point number, or using one outside the plan
           range, is an error (this is unspecified in TAP proper).
         * Diagnostic lines beginning with # are taken as additional
           information about the *next* test point.  Diagnostic lines
           beginning with ## are ignored.
         * Directives are case sensitive.

    """

    diag_r = re.compile(r"^#(#*)\s*(.*)$")
    plan_r = re.compile(r"^1..(\d+)(?:\s*\#\s*SKIP(?::\s*(.*)))?$")
    test_r = re.compile(r"^(not ok|ok)\s*"
                        r"([0-9]+)?\s*"
                        r"([^#]*)(?:# (TODO|SKIP))?$")

    def parse(self, rc, out, err):
        self.parse_tap(out, err)
        self.default_interpret_exit_code(rc)

    def parse_tap(self, out, err):
        points_already_used = set()
        messages = []

        # Look for the plan.
        # Diagnostic lines are allowed to appear above the plan, but not
        # test lines.
        for i in range(len(out)):
            line = out[i]
            m = self.diag_r.match(line)
            if m:
                if not m.group(1):
                    messages.append(m.group(2))
                continue

            m = self.plan_r.match(line)
            if m:
                break

            messages.insert(0, line)
            self.add_error(messages, "Plan line not interpretable")
            if i + 1 < len(out):
                self.add_skip(out[(i+1):], "All further output ignored")
            return
        else:
            self.add_error(messages, "No plan line detected in output")
            return

        max_point = int(m.group(1))
        if max_point == 0:
            if any(msg.startswith("ERROR:") for msg in messages):
                self.add_error(messages, m.group(2) or "Test group skipped")
            else:
                self.add_skip(messages, m.group(2) or "Test group skipped")
            if i + 1 < len(out):
                self.add_skip(out[(i+1):], "All further output ignored")
            return

        prev_point = 0

        for i in range(i+1, len(out)):
            line = out[i]
            m = self.diag_r.match(line)
            if m:
                if not m.group(1):
                    messages.append(m.group(2))
                continue
            m = self.test_r.match(line)
            if m:
                status = m.group(1)
                point  = m.group(2)
                desc   = m.group(3)
                dirv   = m.group(4)

                if point:
                    point = int(point)
                else:
                    point = prev_point + 1

                if point in points_already_used:
                    # A reused test point is an error.
                    self.add_error(messages, desc + " [test point repeated]")
                else:
                    points_already_used.add(point)
                    # A point above the plan limit is an automatic *fail*.
                    # The test suite relies on this in testing exit().
                    if point > max_point:
                        status = "not ok"

                    if status == "ok":
                        if not dirv:
                            self.add_pass(messages, desc)
                        elif dirv == "TODO":
                            self.add_xpass(messages, desc)
                        elif dirv == "SKIP":
                            self.add_skip(messages, desc)
                        else:
                            self.add_error(messages, desc +
                                " [ok, with invalid directive "+dirv+"]")
                    else:
                        if not dirv:
                            self.add_fail(messages, desc)
                        elif dirv == "TODO":
                            self.add_xfail(messages, desc)
                        else:
                            self.add_error(messages, desc +
                                " [not ok, with invalid directive "+dirv+"]")

                del messages[:]
                prev_point = point

            else:
                self.add_error([line], "neither a test nor a diagnostic")

        # Any output on stderr is an error, with one exception: the timeout
        # message added by record_process_output, which is treated as an
        # unnumbered "not ok".
        if err:
            if len(err) == 1 and err[0].startswith("TIMEOUT: "):
                points_already_used.add(prev_point + 1)
                self.add_fail(messages, err[0][len("TIMEOUT: "):])
            else:
                self.add_error(err, "Unexpected output on stderr")

        # Any missing test points are fails.
        for pt in range(1, max_point+1):
            if pt not in points_already_used:
                self.add_fail([], "test {} did not report status".format(pt))

class TestRunner(object):
    def __init__(self, base_path, phantomjs_exe, options):
        self.base_path       = base_path
        self.cert_path       = os.path.join(base_path, 'certs')
        self.harness         = os.path.join(base_path, 'testharness.js')
        self.phantomjs_exe   = phantomjs_exe
        self.verbose         = options.verbose
        self.debugger        = options.debugger
        self.to_run          = options.to_run
        self.run_unsupported = options.run_unsupported
        self.server_errs     = []

    def signal_server_error(self, exc_info):
        self.server_errs.append(exc_info)

    def get_base_command(self, debugger):
        if debugger is None:
            return ["node", self.phantomjs_exe]
        elif debugger == "gdb":
            return ["gdb", "--args", "node", self.phantomjs_exe]
        elif debugger == "lldb":
            return ["lldb", "--", "node", self.phantomjs_exe]
        elif debugger == "valgrind":
            return ["valgrind", "node", self.phantomjs_exe]
        else:
            raise RuntimeError("Don't know how to invoke " + self.debugger)

    def run_phantomjs(self, script,
                      script_args=[], pjs_args=[], stdin_data=[],
                      timeout=TIMEOUT, silent=False):
        verbose  = self.verbose
        debugger = self.debugger
        if silent:
            verbose = False
            debugger = None

        output = []
        command = self.get_base_command(debugger)
        command.extend(pjs_args)
        command.append(script)
        if verbose:
            command.append('--verbose={}'.format(verbose))
        command.extend(script_args)

        if verbose >= 3:
            sys.stdout.write("## running {}\n".format(" ".join(command)))

        if debugger:
            # FIXME: input-feed mode doesn't work with a debugger,
            # because how do you tell the debugger that the *debuggee*
            # needs to read from a pipe?
            subprocess.call(command)
            return 0, [], []
        else:
            return do_call_subprocess(command, verbose, stdin_data, timeout)

    def run_test(self, script, name):
        script_args = []
        pjs_args = []
        use_harness = True
        use_snakeoil = False
        stdin_data = []
        stdout_exp = []
        stderr_exp = []
        rc_exp = None
        stdout_xfail = False
        stderr_xfail = False
        rc_xfail = False
        timeout = TIMEOUT
        unsupported = False

        def require_args(what, i, tokens):
            if i+1 == len(tokens):
                raise ValueError(what + "directive requires an argument")

        if self.verbose >= 3:
            sys.stdout.write(colorize("^", name) + ":\n")
        # Parse any directives at the top of the script.
        try:
            with open(script, "rt") as s:
                for line in s:
                    if not line.startswith("//!"):
                        break
                    tokens = shlex.split(line[3:], comments=True)

                    skip = False
                    for i in range(len(tokens)):
                        if skip:
                            skip = False
                            continue
                        tok = tokens[i]
                        if tok == "unsupported":
                            unsupported = True
                        elif tok == "no-harness":
                            use_harness = False
                        elif tok == "snakeoil":
                            use_snakeoil = True
                        elif tok == "expect-exit-fails":
                            rc_xfail = True
                        elif tok == "expect-stdout-fails":
                            stdout_xfail = True
                        elif tok == "expect-stderr-fails":
                            stderr_xfail = True
                        elif tok == "timeout:":
                            require_args(tok, i, tokens)
                            timeout = float(tokens[i+1])
                            if timeout <= 0:
                                raise ValueError("timeout must be positive")
                            skip = True
                        elif tok == "expect-exit:":
                            require_args(tok, i, tokens)
                            rc_exp = int(tokens[i+1])
                            skip = True
                        elif tok == "phantomjs:":
                            require_args(tok, i, tokens)
                            pjs_args.extend(tokens[(i+1):])
                            break
                        elif tok == "script:":
                            require_args(tok, i, tokens)
                            script_args.extend(tokens[(i+1):])
                            break
                        elif tok == "stdin:":
                            require_args(tok, i, tokens)
                            stdin_data.append(" ".join(tokens[(i+1):]) + "\n")
                            break
                        elif tok == "expect-stdout:":
                            require_args(tok, i, tokens)
                            stdout_exp.append(" ".join(tokens[(i+1):]))
                            break
                        elif tok == "expect-stderr:":
                            require_args(tok, i, tokens)
                            stderr_exp.append(" ".join(tokens[(i+1):]))
                            break
                        else:
                            raise ValueError("unrecognized directive: " + tok)

        except Exception as e:
            grp = TestGroup(name)
            if hasattr(e, 'strerror') and hasattr(e, 'filename'):
                grp.add_error([], '{} ({}): {}\n'
                              .format(name, e.filename, e.strerror))
            else:
                grp.add_error([], '{} ({}): {}\n'
                              .format(name, script, str(e)))
            return grp

        if use_harness:
            script_args.insert(0, script)
            script = self.harness

        if use_snakeoil:
            pjs_args.insert(0, '--ssl-certificates-path=' + self.cert_path)

        if unsupported and not self.run_unsupported:
            return UnsupportedTestGroup(name)
        rc, out, err = self.run_phantomjs(script, script_args, pjs_args,
                                          stdin_data, timeout)

        if rc_exp or stdout_exp or stderr_exp:
            grp = ExpectTestGroup(name,
                                  rc_exp, stdout_exp, stderr_exp,
                                  rc_xfail, stdout_xfail, stderr_xfail)
        else:
            grp = TAPTestGroup(name)
        grp.parse(rc, out, err)
        return grp

    def run_tests(self):
        start = time.time()
        base = self.base_path
        nlen = len(base) + 1

        results = []

        for test_glob in TESTS:
            test_glob = os.path.join(base, test_glob)

            for test_script in sorted(glob.glob(test_glob)):
                tname = os.path.splitext(test_script)[0][nlen:]
                if self.to_run:
                    for to_run in self.to_run:
                        if to_run in tname:
                            break
                    else:
                        continue

                any_executed = True
                grp = self.run_test(test_script, tname)
                grp.report_for_verbose_level(sys.stdout, self.verbose)
                results.append(grp)

        grp = TestGroup("HTTP server errors")
        for ty, val, tb in self.server_errs:
            grp.add_error(traceback.format_tb(tb, 5),
                          traceback.format_exception_only(ty, val)[-1])
        grp.report_for_verbose_level(sys.stdout, self.verbose)
        results.append(grp)

        sys.stdout.write("\n")
        return self.report(results, time.time() - start)

    def report(self, results, elapsed):
        # There is always one test group, for the HTTP server errors.
        if len(results) == 1:
            sys.stderr.write("No tests selected for execution.\n")
            return 1

        n = [0] * T.MAX

        for grp in results:
            if self.verbose == 0 and not grp.is_successful():
                grp.report(sys.stdout, False)
            for i, x in enumerate(grp.n): n[i] += x

        sys.stdout.write("{:6.3f}s elapsed\n".format(elapsed))
        for s in (T.PASS, T.FAIL, T.XPASS, T.XFAIL, T.ERROR, T.SKIP, T.UNSUPPORTED):
            if n[s]:
                sys.stdout.write(" {:>4} {}\n".format(n[s], s.long_label))

        if n[T.FAIL] == 0 and n[T.XPASS] == 0 and n[T.ERROR] == 0:
            return 0
        else:
            return 1

def init():
    base_path = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
    phantomjs_exe = os.path.normpath(base_path + '/../../../phantom_shim/runner.js')
    if not os.path.isfile(phantomjs_exe):
        sys.stdout.write("{} is unavailable, cannot run tests.\n"
                         .format(phantomjs_exe))
        sys.exit(1)

    parser = argparse.ArgumentParser(description='Run PhantomJS tests.')
    parser.add_argument('-v', '--verbose', action='count', default=0,
                        help='Increase verbosity of logs (repeat for more)')
    parser.add_argument('to_run', nargs='*', metavar='test',
                        help='tests to run (default: all of them)')
    parser.add_argument('--debugger', default=None,
                        help="Run PhantomJS under DEBUGGER")
    parser.add_argument('--run-unsupported', action='count', default=0,
                        help='Run unsupported tests.')
    parser.add_argument('--color', metavar="WHEN", default='auto',
                        choices=['always', 'never', 'auto'],
                        help="colorize the output; can be 'always',"
                        " 'never', or 'auto' (the default)")

    options = parser.parse_args()
    activate_colorization(options)
    runner = TestRunner(base_path, phantomjs_exe, options)
    if options.verbose:
        rc, ver, err = runner.run_phantomjs('--version', silent=True)
        if rc != 0 or len(ver) != 1 or len(err) != 0:
            sys.stdout.write(colorize("R", "FATAL")+": Version check failed\n")
            for l in ver:
                sys.stdout.write(colorize("b", "## " + l) + "\n")
            for l in err:
                sys.stdout.write(colorize("b", "## " + l) + "\n")
            sys.stdout.write(colorize("b", "## exit {}".format(rc)) + "\n")
            sys.exit(1)

        sys.stdout.write(colorize("b", "## Testing PhantomJS "+ver[0])+"\n")

    # Run all the tests in Chatham Islands Standard Time, UTC+12:45.
    # This timezone is deliberately chosen to be unusual: it's not a
    # whole number of hours offset from UTC *and* it's more than twelve
    # hours offset from UTC.
    #
    # The Chatham Islands do observe daylight savings, but we don't
    # implement that because testsuite issues only reproducible on two
    # particular days out of the year are too much tsuris.
    #
    # Note that the offset in a TZ value is the negative of the way it's
    # usually written, e.g. UTC+1 would be xxx-1:00.
    os.environ["TZ"] = "CIST-12:45:00"

    return runner

def main():
    runner = init()
    try:
        with HTTPTestServer(runner.base_path,
                            runner.signal_server_error,
                            runner.verbose):
            sys.exit(runner.run_tests())

    except Exception:
        trace = traceback.format_exc(5).split("\n")
        # there will be a blank line at the end of 'trace'
        sys.stdout.write(colorize("R", "FATAL") + ": " + trace[-2] + "\n")
        for line in trace[:-2]:
            sys.stdout.write(colorize("b", "## " + line) + "\n")

        sys.exit(1)

    except KeyboardInterrupt:
        sys.exit(2)

main()
