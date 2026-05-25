import http.server, functools

DIR = '/Users/bocchi/Desktop/디콘디 2026년 1학기 수업/웹디자인I/code'
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIR)
httpd = http.server.HTTPServer(('', 5500), handler)
print("Serving at http://localhost:5500")
httpd.serve_forever()
