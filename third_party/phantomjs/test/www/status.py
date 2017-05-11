import cStringIO as StringIO
import urlparse

def html_esc(s):
    return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def handle_request(req):
    url = urlparse.urlparse(req.path)
    headers = []
    body = ""

    try:
        query = urlparse.parse_qsl(url.query, strict_parsing=True)
        status = None
        for key, value in query:
            if key == 'status':
                if status is not None:
                    raise ValueError("status can only be specified once")
                status = int(value)
            elif key == 'Content-Type' or key == 'Content-Length':
                raise ValueError("cannot override " + key)
            else:
                headers.append((key, value))

        if status is None:
            status = 200

        body = "<!doctype html><h1>Status: {}</h1>".format(status)
        if headers:
            body += "<pre>"
            for key, value in headers:
                body += html_esc("{}: {}\n".format(key, value))
            body += "</pre>"

    except Exception as e:
        try:
            status = int(url.query)
            body = "<!doctype html><h1>Status: {}</h1>".format(status)
        except:
            status = 400
            body = "<!doctype html><h1>Status: 400</h1>"
            body += "<pre>" + html_esc(str(e)) + "</pre>"

    req.send_response(status)
    req.send_header('Content-Type', 'text/html')
    req.send_header('Content-Length', str(len(body)))
    for key, value in headers:
        req.send_header(key, value)
    req.end_headers()
    return StringIO.StringIO(body)
