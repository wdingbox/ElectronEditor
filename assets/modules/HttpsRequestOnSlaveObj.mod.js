

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
    APP_VERSIONS,
} = require("../../config/config.mod")

const NodeCache = require("node-cache");
const https = require('https');
const { clear } = require('console');

// const querystring = require('querystring');

function tim(useID) {
    return (new Date()).toISOString() + (!useID ? "" : " " + useID)
}

//Common Obj used between client and server communication.
var CommonObj = {
    _cln: {
        idx: -1, //counter of probe. filled by clnt
        iCheckPeriod: 1,  //the period time btw the probes. configured by client, affect the server. 
        lastStart: "", // last start timestamp. filled by client
        lastWrite: "",
        email: "", //client user email. // filled by client
        version: APP_VERSIONS[0].v
    },
    _svr: {
        idx: -1,  //counter of svr feedback. filled by svr.
        useID: "useID", //filled by svr. 
        useTTL: 0, //svr calc fr iCheckPeriod. filled by svr.
        prxyInfo: { idx: -1, prx: "usr@0.0.0.0", port: 0, isNew: 1 },//filled by svr
        remoteInfo: { ip: "0.0.0.0", port: 0 },//filled by svr
        prxyHistory: {}, //for debug.filled by svr.
    },
    slave_addr: { ip: null, port: 0 },//filled by client user
    stat: {
        nReq: -1, nRes: 0, nNewPrx: 0, timestamp: (new Date()).toISOString()
    }
}



function HttpsRequestOnSlaveObj(slaveAddr, email, iCheckPeriod) {
    this.m_req = null
    this.m_commObj = JSON.parse(JSON.stringify(CommonObj));// Object.assign({}, CommonObj) not work for deep.
    this.m_commObj.slave_addr = slaveAddr
    this.m_commObj._cln.lastStart = (new Date).toISOString()
    this.m_commObj._cln.email = email
    this.m_commObj._cln.iCheckPeriod = iCheckPeriod
    this.m_prxyInfoCache = null
}

HttpsRequestOnSlaveObj.prototype.create_new_prxyCache = function () {
    if (this.m_prxyInfoCache) delete this.m_prxyInfoCache
    var _THIS = this
    var ttl = this.get_TTL()
    this.m_prxyInfoCache = new NodeCache({ stdTTL: ttl, checkperiod: ttl })
    //
    this.m_prxyInfoCache.on("del", function (key, obj) {
        var currentUseId = _THIS.m_commObj._svr.useID

        if (key !== currentUseId) {
            return console.log(tim(key), "on del to ignore.")
        } else {
            console.log(tim(currentUseId), " on del -- died.")
        }
        if (_THIS.OnDisconnected) _THIS.OnDisconnected(_THIS.m_commObj)

        _THIS.abort()
    })
    this.m_prxyInfoCache.on("expired", function (key, obj) {
        console.log(tim(key), "expired")
    })
}
HttpsRequestOnSlaveObj.prototype.update_commCache = function () {
    if (!this.m_prxyInfoCache) {
        return console.log("***  ERROR: prxyCache is null")
    }
    //this.init_prxyCache()
    var useID = this.m_commObj._svr.useID;
    var ttl = this.get_TTL()
    var obj = this.m_prxyInfoCache.get(useID)
    if ("useID" === useID) console.log("init client.")
    if (!obj) console.log(tim(useID), " *** new useID is set in cache. ***")
    let _THIS = this
    try {
        _THIS.m_prxyInfoCache.set(useID, this.m_commObj, ttl) //crash for null.set
    } catch (e) {
        console.log("\n\n cache set errr", e)
        console.log("cache set errr _THIS.m_prxyInfoCache=", _THIS.m_prxyInfoCache)
        console.log("cache set errr useID=", useID)
    }
    return ttl
}
HttpsRequestOnSlaveObj.prototype.get_TTL = function () {
    if (!this.m_commObj._cln.iCheckPeriod) {
        this.m_commObj._cln.iCheckPeriod = 1
    }
    var ttl = 3 + parseInt(this.m_commObj._cln.iCheckPeriod * 3)
    if (ttl < 3) ttl = 3
    //console.log("ttl=",ttl)
    return ttl
}
HttpsRequestOnSlaveObj.prototype.get_comm_intvTime = function () {
    if (!this.m_commObj._cln.iCheckPeriod) {
        this.m_commObj._cln.iCheckPeriod = 1
    }
    var itvtms = 1000 * parseInt(this.m_commObj._cln.iCheckPeriod)
    if (itvtms < 1) itvtms = 1000
    //console.log("itvtm=",itvtms)
    return itvtms
}


HttpsRequestOnSlaveObj.prototype.create_new_request = function () {
    if (this.m_req) {
        this.m_req.end()
        delete this.m_req
        this.m_req = null
        //console.log("* force to re-connect to svr")
    }
    console.log(tim("HttpsRequestOnSlaveObj"), "...connecting to slave addr:", this.m_commObj.slave_addr)

    var _THIS = this

    // // https://ec2-54-146-65-28.compute-1.amazonaws.com:8000/get_http_proxy_info?uuname=wdingsoft@gmail.com&intervalTimems=3001&sid=1
    const options = {
        hostname: this.m_commObj.slave_addr.ip,
        port: this.m_commObj.slave_addr.port,
        path: SVR_API.SLAVE_SVC.get_http_proxy_info,  //'/get_http_proxy_info', //?uuname=wdingsoft@gmail.com&intervalTimems=3001&sid=1',
        method: 'POST',

        json: true,
        headers: { 'Content-Type': 'application/json' },

        rejectUnauthorized: false, //==required for web
        requestCert: true,//==required for web
        agent: false,//==required for web

        timeout: 0, //request never timeout.
    };

    this.m_req = https.request(options, (res) => {
        console.log('cln statusCode:', res.statusCode);
        console.log('cln headers:', res.headers);

        res.setEncoding('utf8');
        res.on('data', (d) => {
            if(!d) return console.log(tim("HttpsRequestOnSlaveObj d=null"))
            var str = d.toString()
            //console.log("res", str)
            if(!str) return console.log(tim("HttpsRequestOnSlaveObj str=null"))
            
            var obj = null
            try {
                obj = JSON.parse(str)
            }
            catch (err) {
                return console.log(tim("HttpsRequestOnSlaveObj"),"* * * JSON.parse err=", err.message, str)
            }

            var ret = _THIS.rcvOnData(obj)
            if (false === ret) {
                if (_THIS.m_req) {
                    _THIS.m_req.end() //no writing allowed.
                    //setTimeout(() => {
                    //_THIS.abort()
                    //}, 1000)
                }
            }
        });
    });

    //req.end();
    this.m_req.on('error', function (e) {
        _THIS.abort()
        if (e.code === 'ECONNRESET') {//caused by svr restart.
            console.error(tim("HttpsRequestOnSlaveObj"),'- caused by svr restart. err:', e);
            //if (_THIS.OnDied) _THIS.OnDied() //cause to resurvive.
        } else {
            console.error(tim("HttpsRequestOnSlaveObj"),'- cassed by cln op m_req, err:', e);
        }
    });

    this.m_req.on('timeout', function (e) {
        console.error('- timeout. eer', e.toString());
    });

    this.m_req.on('reset', function (e) {
        console.error(tim("HttpsRequestOnSlaveObj"),'- reset. eer', e);
    });
}
HttpsRequestOnSlaveObj.prototype.rcvOnData = function (obj) {
    if (!this.m_prxyInfoCache || !this.m_req || !this.heart_beat_intvID) {
        console.log(tim(obj._svr.useID), obj._svr.idx, "--- rcv in zombie wolrd", this.heart_beat_intvID)
        return false
    }
    if (!obj || !obj._cln || !obj._svr || !obj._svr.prxyInfo) {
        console.log("--- corrupted data")
        return false
    }

    if (obj._svr.prxyInfo.port <= 0) {
        if (this.OnConnected) this.OnConnected(obj)
        console.log("--- initial connected but prxy is empty.")
        return false;  //req.end();nomore write;sign error;abort; heatbeat stop.
    }
    if (obj._svr.idx === -1) {
        if (this.OnConnected) this.OnConnected(obj)
        console.log("--- initial connected but svr failed to fill _svr data.")
        return false;  //req.end();nomore write;sign error;abort; heatbeat stop.
    }

    // For valid initial recieved  _svr:{idx:0}

    this.m_commObj._svr = obj._svr
    this.m_commObj._cln.idx++
    this.update_commCache()

    if (obj._svr.prxyInfo.isNew || obj._svr.idx === 0) {
        //obj._svr.prxyInfo.isNew totally determined by svr. 
        console.log(tim(this.m_commObj._svr.useID), this.m_commObj._svr.idx, "rcv *** 1st | isNew port ***")
        if (this.OnConnecting) this.OnConnecting(obj)
    } else {
        if (this.OnConnected) this.OnConnected(obj)
        //else 
        console.log(tim(this.m_commObj._svr.useID), this.m_commObj._svr.idx, "rcv@",this.m_commObj.slave_addr.ip)
        if (this.m_commObj._svr.useID !== obj._svr.useID) {
            console.log(tim("HttpsRequestOnSlaveObj"),"FATAL ERROR---")
        }
    }
    return true //continue to write to svr after intval time. 
}
HttpsRequestOnSlaveObj.prototype.send2svr = function () {
    if (!this.m_req) return
    this.m_commObj._cln.lastWrite = (new Date()).toISOString()
    this.m_req.flushHeaders()  //clear buffer
    this.m_req.write(JSON.stringify(this.m_commObj))
    this.m_req.flushHeaders()  //clear buffer
}
HttpsRequestOnSlaveObj.prototype.start_heart_beat = function () {
    //console.log("HttpsRequestOnSlaveObj.start ")
    this.create_new_request()
    this.create_new_prxyCache()

    var _THIS = this
    var itvtms = this.get_comm_intvTime()

    _THIS.send2svr()
    _THIS.heart_beat_intvID = setInterval(function () {
        //console.log("heart_beat_intvID", _THIS.heart_beat_intvID._idleTimeout = 30000)
        _THIS.send2svr()
    }, itvtms)

    console.log(tim("HttpsRequestOnSlaveObj"), "=================== a new life heart-beat period:", itvtms)
}
HttpsRequestOnSlaveObj.prototype.abort = function () {

    console.log(tim(this.m_commObj._svr.useID), "HttpsRequestOnSlaveObj.abort")

    if (this.heart_beat_intvID) {
        clearInterval(this.heart_beat_intvID)
        this.heart_beat_intvID = null
    }

    if (this.m_req) {
        this.m_req.flushHeaders()  //clear buffer
        this.m_req.end()
        delete this.m_req
        this.m_req = null
    }

    if (this.m_prxyInfoCache) {
        delete this.m_prxyInfoCache
        this.m_prxyInfoCache = null
    }

    this.OnConnecting = null
    this.OnConnected = null
    this.OnDisconnected = null

    //this.OnDied = null
}
HttpsRequestOnSlaveObj.prototype.isAlive = function () {
    if (this.m_req && this.heart_beat_intvID) return true
    return false
}
HttpsRequestOnSlaveObj.prototype.on = function (evtID, cbf) {
    switch (evtID) {
        case "connecting": //do action
            this.OnConnecting = cbf
            break;
        case "connected": //indicating only
            this.OnConnected = cbf
            break;
        case "disconnected": //do and indicating
            this.OnDisconnected = cbf
            break;
        // case "died":
        //     this.OnDied = cbf
        //     break;
        default:
            //console.log("* not supported evt:", evtID)
            break;
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

module.exports = HttpsRequestOnSlaveObj