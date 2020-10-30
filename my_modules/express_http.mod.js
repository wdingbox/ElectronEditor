
const url = require('url');
const express = require('express')
const bodyParser = require('body-parser')

var express_http = {
    start: function () {
        const expr = express()
        const HTTP_PORT = 7878

        expr.set('trust proxy', true) //:return client req.ip
        //expr.use(express.bodyParser())
        expr.use(bodyParser.urlencoded({ extended: true, limit: '50mb'  })); //:return req.query; //Error: request entity too large
        // Parse JSON bodies (as sent by API clients)
        expr.use(bodyParser.json({ extended: true, limit: '50mb'  }));////Error: request entity too large
                
        var ItemKeyNames = ["firstname", "lastname"]

        expr.get('/', async (req, res) => {
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


        expr.get('/save', async (req, res) => {
            console.log('[get] resp save :', req.query)
            //console.log('resp save :', req)
            //res.send(data); 
            req.query.method_type = "get"
            res.status(200).send(req.query)
        })
        expr.post('/save', async (req, res) => {
            console.log('[post] resp save :', req.body)
            req.body.method_type = "post"
            res.status(200).send(req.body)
            res.end("html")
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
