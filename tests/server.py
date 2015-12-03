import SimpleHTTPServer
import SocketServer
import os

PORT = 8000


class Allow(SimpleHTTPServer.SimpleHTTPRequestHandler):
        
    def send_head(self):
            """Common code for GET and HEAD commands.

            This sends the response code and MIME headers.

            Return value is either a file object (which has to be copied
            to the outputfile by the caller unless the command was HEAD,
            and must be closed by the caller under all circumstances), or
            None, in which case the caller has nothing further to do.

            """
            path = self.translate_path(self.path)
            f = None
            if os.path.isdir(path):
                for index in "index.html", "index.htm":
                    index = os.path.join(path, index)
                    if os.path.exists(index):
                        path = index
                        break
                else:
                    return self.list_directory(path)
            ctype = self.guess_type(path)
            if ctype.startswith('text/'):
                mode = 'r'
            else:
                mode = 'rb'
            try:
                f = open(path, mode)
            except IOError:
                self.send_error(404, "File not found")
                return None
            self.send_response(200)
            self.send_header("Content-type", ctype)
            self.send_header("Access-Control-Allow-Origin", "*")
            if path.endswith("png") or path.endswith("gif") or path.endswith("jpg"):
                # 2 minutes cache
                self.send_header("Cache-Control", "max-age=120");
            self.end_headers()
            return f


SocketServer.ThreadingTCPServer.allow_reuse_address = True
httpd = SocketServer.TCPServer(("", PORT), Allow)

print "serving at port", PORT
httpd.serve_forever()
