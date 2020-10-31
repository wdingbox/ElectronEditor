
const url = require('url');
const express = require('express')
const bodyParser = require('body-parser')
const cors = require("cors");

var formidable = require('formidable');
var fs = require('fs');
const path = require('path');

const { formatWithOptions } = require('util');

var Uti = {
    GetFilesAryFromDir: function (startPath, deep, cb) {//startPath, filter
        function recursiveDir(startPath, deep, outFilesArr) {
            var files = fs.readdirSync(startPath);
            for (var i = 0; i < files.length; i++) {
                var filename = path.join(startPath, files[i]);
                //console.log(filename);
                var stat = fs.lstatSync(filename);
                if (stat.isDirectory()) {
                    if (deep) {
                        recursiveDir(filename, deep, outFilesArr); //recurse
                    }
                    continue;
                }/////////////////////////
                else if (cb) {
                    //console.log("file:",filename)
                    if (!cb(filename)) continue
                }
                outFilesArr.push(filename);
            };
        };/////////////////////////////////////

        var outFilesArr = [];
        recursiveDir(startPath, deep, outFilesArr);
        return outFilesArr;
    }
}
var express_http = {
    cors_issues_fix_sample: function (expr) {

        ////////////////////////////////////
        //  ToFix:
        //  Access to XMLHttpRequest at 'file:///Users/weiding/Sites/weidroot/weidroot_2017-01-06/app/github/wdingbox/ElectronEditor/pages/ckeditor/doc.html' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, chrome-untrusted, https.
        //
        /* -------------------------------------------------------------------------- */
        /*     https://github.com/troygoode/node-cors-server/blob/master/server.js    */
        /* -------------------------------------------------------------------------- */

        expr.get("/no-cors", (req, res) => {
            console.info("GET /no-cors");
            res.json({
                text: "You should not see this via a CORS request."
            });
        });

        /* -------------------------------------------------------------------------- */

        expr.head("/simple-cors", cors(), (req, res) => {
            console.info("HEAD /simple-cors");
            res.sendStatus(204);
        });
        expr.get("/simple-cors", cors(), (req, res) => {
            console.info("GET /simple-cors");
            res.json({
                text: "Simple CORS requests are working. [GET]"
            });
        });
        expr.post("/simple-cors", cors(), (req, res) => {
            console.info("POST /simple-cors");
            res.json({
                text: "Simple CORS requests are working. [POST]"
            });
        });

        /* -------------------------------------------------------------------------- */

        expr.options("/complex-cors", cors());
        expr.delete("/complex-cors", cors(), (req, res) => {
            console.info("DELETE /complex-cors");
            res.json({
                text: "Complex CORS requests are working. [DELETE]"
            });
        });

        /* -------------------------------------------------------------------------- */

        const issue2options = {
            origin: true,
            methods: ["POST"],
            credentials: true,
            maxAge: 3600
        };
        expr.options("/issue-2", cors(issue2options));
        expr.post("/issue-2", cors(issue2options), (req, res) => {
            console.info("POST /issue-2");
            res.json({
                text: "Issue #2 is fixed."
            });
        });

        /* -------------------------------------------------------------------------- */
        /* -------------------------------------------------------------------------- */

        return issue2options
    },

    fileupload: function (http) {
        http.get("/uploadform", (req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            var sform = `
            <htm><body>
            <form action="fileupload" method="post" enctype="multipart/form-data">
            <input type="file" id="pname" name="filetoupload" onclick='f1()' onchange='f2()'><br>
            <input type="text" id="fpath" name="path"><br>
            <input type="text" id="fname" name="name"><br>
            <input type="submit">
            </form> 
            <script>
            function f1(){
                document.getElementById("pname").value='';
            }
            function f2(){
                var files = document.getElementById("pname").files[0];
                console.log(files)
                document.getElementById("fpath").value = files.size;
            }
            </script>
            `
            console.log(sform)
            res.write(sform);
            return res.end();
        });

        http.post("/fileupload", (req, res) => {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                console.log(fields)
                console.log(files)
                var oldpath = files.filetoupload.path;
                var newpath = '/tmp/' + files.filetoupload.name;
                fs.rename(oldpath, newpath, function (err) {
                    if (err) throw err;
                    var msg = `File uploaded:${oldpath}\nTo:${newpath}`
                    console.log(msg)
                    res.write(msg);
                    res.end();
                });
            });
        });
    },

    access_dir: function (http, dir) {
        function writebin(pathfile, contentType, res) {
            var content = fs.readFileSync(pathfile)
            //console.log("read:", pathfile)
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content, 'binary')
            res.end()
        }
        function writetxt(pathfile, contentType, res) {
            var content = fs.readFileSync(pathfile, "utf8")
            //console.log("read:", pathfile)
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content, 'utf-8')
            res.end()
        }
        // ./assets/ckeditor/ckeditor.js"
        // var dir = "./assets/ckeditor/"
        console.log("lib svr:", dir)
        var ftypes = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.eot': 'appliaction/vnd.ms-fontobject',
            '.ttf': 'aplication/font-sfnt'
        }
        var binaries = [".png", ".jpg", ".wav", ".mp3", ".svg", ".pdf", ".eot"]
        Uti.GetFilesAryFromDir(dir, true, function (fname) {
            var ext = path.parse(fname).ext;
            //console.log("ext:",ext)
            if (ftypes[ext]) {
                console.log("api:", fname)
                http.use("/" + fname, async (req, res) => {
                    console.log('[post] resp save :', req.body, fname)
                    if (binaries.indexOf(ext) >= 0) {
                        writebin(fname, ftypes[ext], res)
                    } else {
                        writetxt(fname, ftypes[ext], res)
                    }
                })
                return true
            }
        });
    },


    start: function () {
        const expr = express()
        const HTTP_PORT = 7878

        expr.set('trust proxy', true) //:return client req.ip
        //expr.use(express.bodyParser())
        expr.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); //:return req.query; //Error: request entity too large
        // Parse JSON bodies (as sent by API clients)
        expr.use(bodyParser.json({ extended: true, limit: '50mb' }));////Error: request entity too large



        this.fileupload(expr)
        this.access_dir(expr, "./assets/ckeditor/")


        expr.get('/', async (req, res) => {
            var ItemKeyNames = ["firstname", "lastname"]
            var url = `http://localhost:${HTTP_PORT}/save`
            var html = `
                 <html>
                     <body>
                        <p>[post] ${url}</p>
                         <form method="post" action="${url}">
                             ${ItemKeyNames[0]}:<input type="text" name="${ItemKeyNames[0]}" value="Mordencai" />
                             ${ItemKeyNames[1]}:<input type="text" name="${ItemKeyNames[1]}" value="Jair" />
                             <input type="submit" value="Submit" />
                         </form>
                         <hr>
                         <p>[get] ${url}</p>
                         <form method="get" action="${url}">
                             ${ItemKeyNames[0]}:<input type="text" name="${ItemKeyNames[0]}" value="Mordencai" />
                             ${ItemKeyNames[1]}:<input type="text" name="${ItemKeyNames[1]}" value="Jair" />
                             <input type="submit" value="Submit" />
                         </form>
                     </body>
                 </html>\n`
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(html)
            console.log(html)
        })


        var issue2options = this.cors_issues_fix_sample(expr)
        expr.get('/save', cors(issue2options), async (req, res) => {
            console.log('[get] resp save :', req.query)
            //console.log('resp save :', req)
            //res.send(data); 
            req.query.method_type = "get"
            res.status(200).send(req.query)
            res.end()
        })
        expr.post('/save', cors(issue2options), async (req, res) => {
            console.log('[post] resp save :', req.body)
            req.body.method_type = "post"
            fs.writeFileSync(req.body.pathname, req.body.htm, "utf8")
            req.body.len = req.body.htm.length

            res.status(200).send(req.body)
            console.log("saved file size:", req.body.htm.length, req.body.pathname)
            res.end()
        })





        //  this is another way for http.
        expr.listen(HTTP_PORT, () => {
            console.log(`\n\n http svr listening at http://localhost:${HTTP_PORT}\n\n`);
        })
    }
}


module.exports = {
    //For Client site.
    express_http: express_http,


}
