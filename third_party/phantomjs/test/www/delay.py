import cStringIO as StringIO
import urlparse
import time

def handle_request(req):
    url = urlparse.urlparse(req.path)
    delay = float(int(url.query))
    time.sleep(delay / 1000) # argument is in milliseconds

    body = "OK ({}ms delayed)\n".format(delay)
    req.send_response(200)
    req.send_header('Content-Type', 'text/plain')
    req.send_header('Content-Length', str(len(body)))
    req.end_headers()
    return StringIO.StringIO(body)
