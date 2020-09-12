

//////////////////////////////////////////////////////////////////////////////
// https://nodejs.org/api/https.html

//////////////////////////////////////////
// openssl genrsa -out key.pem
// openssl req -new -key key.pem -out csr.pem
// openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
// rm csr.pem

//const MASTER_IP = 'ec2-54-146-65-28.compute-1.amazonaws.com';
//const PORT = 3001;
//const MASTER_HTTPS_SVR_PORT = 3001

const fs = require('fs')

const {
    MASTER_SVR,
   
    SVR_API, 
    APP_VERSIONS
} = require("../../config/config.mod")

const NodeCache = require("node-cache");
const https = require('https');
const { clear } = require('console');

const HttpsRequestOnSlaveObj = require("./HttpsRequestOnSlaveObj.mod")
// const querystring = require('querystring');

function tim(useID) {
    return (new Date()).toISOString() + (!useID ? "" : " " + useID)
}



var HttpsRequesOnMaster = {
    get_balanced_slave_info: function (masterAddr, cbf, cbf_err) {
        console.log(tim("HttpsRequesOnMaster"), "masterAddr:", masterAddr)
        // //
        //var ip = "ec2-54-146-65-28.compute-1.amazonaws.com"
        //var url = "https://ec2-54-146-65-28.compute-1.amazonaws.com:3001/get_http_proxy_info?uuname=wdingsoft@gmail.com&intervalTimems=3001&sid=1"
        //var url2 = "https://ec2-54-146-65-28.compute-1.amazonaws.com:3001/balanced_slave_info?a=a"
        const options = {
            hostname: `${masterAddr.ip}`,
            port: `${masterAddr.port}`,
            path: SVR_API.MASTER_ONLY.balanced_slave_svr, //'/balanced_slave_info', //?uuname=wdingsoft@gmail.com&intervalTimems=3001&sid=1',
            method: 'POST',
            json: true,
            headers: { 'Content-Type': 'application/json' },

            rejectUnauthorized: false, //==required for web
            requestCert: true,//==required for web
            agent: false,//==required for web

            timeout: 0, //request timeout.
        };

        var req = https.request(options, (res) => {
            console.log('master statusCode:', res.statusCode);
            console.log('master headers:', res.headers);

            res.setEncoding('utf8');
            res.on('data', (d) => {
                var str = d.toString()
                console.log(tim("HttpsRequesOnMaster[balanced_slave_svr], rcv:"), str)
                if(str.indexOf("<")===0) {
                    console.log("Return Error Resp")
                    return;
                }

                var obj = null
                try {
                    obj = JSON.parse(str)
                } catch (e) {
                    console.log(e)
                }
                //resolve(str)
                if (cbf) {
                    //console.log("availabe slave address", obj)
                    //var slaveAddr = { ip: slaveInf.ip, port: slaveInf.port }
                    cbf(obj)
                }
            });
        });

        //req.end();
        req.on('error', function (e) {
            console.error(tim("HttpsRequesOnMaster"), 'master errr', e);
            if (true === req.m_bConntected) {
                return console.log(" already know error. prevent to call multiple times")
            }
            // req.m_bConntected = true

            //  if (!cbf_err) { return console.log(" FATAL ERROR: cbf_err cannot be null.") }
            //  var bStop = cbf_err(e)
            //  if (bStop) return
        });

        req.on('close', function () {
            console.error(tim("HttpsRequesOnMaster"), 'master close.');
        });

        req.on('timeout', function (e) {
            console.error(tim("HttpsRequesOnMaster"), 'master timeout. err', e);
        });

        req.flushHeaders()
        req.end();
    },
}
var HttpsRequestOnMasterHandler = {
    masterAddr: { ip: "", port: 0 },
    slaveAddr: { ip: "", port: 0 },
    m_cacheClient: null,
    m_id_cbf: { Start: null, Stop: null, connecting: null, connected: null, disconnected: null },
    m_clientData: {},
    bStar: false,
    bStop: true,
    init_masterAddr: function (host, port) {
        console.log("--- HttpsRequestOnMasterHandler.init_masterAddr", host, port)
        this.masterAddr.ip = host
        this.masterAddr.port = port
    },
    set_client: function (arg) {
        Object.assign(this.m_clientData, arg)
        return this.m_clientData
    },
    set_svrAddr: function (arg) {
        Object.assign(this.slaveAddr, arg)
        return this.slaveAddr
    },
    destroy_client_life: function () {
        if (this.m_cacheClient) {
            this.m_cacheClient.abort()
            delete this.m_cacheClient
            this.m_cacheClient = null
        }
    },
    create_a_new_life: function () {
        let _THIS = this
        if (_THIS.bStop) return console.log("set to stop.1")
        //console.log("=================== a new life")
        _THIS.m_cacheClient = new HttpsRequestOnSlaveObj(this.slaveAddr, this.m_clientData.email, this.m_clientData.iCheckPeriod)
        var idar = Object.keys(this.m_id_cbf)
        for (var i = 0; i < idar.length; i++) {
            var id = idar[i]
            _THIS.m_cacheClient.on(id, this.m_id_cbf[id])
        }
        _THIS.m_cacheClient.start_heart_beat()

        //  _THIS.m_cacheClient.on("died", function () {
        //      if (_THIS.bStop) return console.log("set to stop.2")
        //  })
        return
    },
    resurrect: function () {
        let _THIS = this
        if (!_THIS.bStar) {
            if (_THIS.m_cacheClient) {
                if (_THIS.m_id_cbf.Start) _THIS.m_id_cbf.Start(_THIS.m_cacheClient.m_commObj)
            }
            _THIS.bStar = true; //toggle turn on.
            _THIS.bStop = false; //toggle turn on. the only place to allow to change.
        }
        if (_THIS.bStop) return console.log("set to stop.")


        console.log("\n~~~~~~~~ start resurrection engine ~~~~~")

        HttpsRequesOnMaster.get_balanced_slave_info(
            _THIS.masterAddr,
            function (slaveAddr) { //netwrok ok
                if (_THIS.bStop) { return }
                //console.log("~~~~~~~~ resurvive start~~~~~ slaveAddr", slaveAddr)
                _THIS.destroy_client_life()
                _THIS.set_svrAddr(slaveAddr)
                _THIS.create_a_new_life()
            },
            function () { //for network down to stop to loop try
                _THIS.destroy_client_life()
                return false;//_THIS.bStop
            }
        )
    },
    start: function () {
        var _THIS = this
        if(this.resurrect_intvID) {
            console.log("already started.")
            return
        }
        this.resurrect_intvID = setInterval(function () {
            if (_THIS.isRunning()) return
            _THIS.resurrect()
        }, 3777)

    },
    stop: function () {
        this.bStar = false //state of started.
        this.bStop = true // to stop the staring flow.
        clearInterval(this.resurrect_intvID)
        this.resurrect_intvID = null
        if (this.m_cacheClient) {
            this.m_cacheClient.abort()
            delete this.m_cacheClient
            this.m_cacheClient = null
        }
        this.m_id_cbf.Stop()

        // if (this.m_id_cbf.Stop) {
        //     setTimeout(function () {
        //     }, 3210 + 1000)
        // }
    },
    on: function (id, cbcf) {
        this.m_id_cbf[id] = cbcf
    },
    isRunning: function () {
        if (!this.m_cacheClient) return false
        return this.m_cacheClient.isAlive()
    }
}



///////////////////////////////////
// sample usage
// var cln = new HttpsRequestOnMasterHandler(MASTER_IP, PORT)
// 
// cln.set_email({ email: "e@m.com" })
// cln.start()
// 
// setTimeout(function () {
//     cln.stop()
// }, 20000000)

module.exports = HttpsRequestOnMasterHandler