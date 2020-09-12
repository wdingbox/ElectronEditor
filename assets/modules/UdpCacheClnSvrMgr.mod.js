// This is shared by client and server site.


const dgram = require('dgram');
const { send } = require('process');

const NodeCache = require("node-cache");


const HOST = 'ec2-54-146-65-28.compute-1.amazonaws.com';
const PORT = 30000;

//const HOST = 'ec2-54-146-65-28.compute-1.amazonaws.com';
//const PORT = 30000;
//////////////////////////////////////////
// 
// UDP SVR Testing Cases:
// 1) reboot/interrupt client
// 2) turn off/on client wifi




var SvrSite_ProxyCacheMgmnt = {
    uunameipTTL: 5,  //:Must be greater than client pooling interval time.
    myCache_PrxyipPort: new NodeCache(),
    myCache_ClientUsage: new NodeCache(),
    setup_PrxyipPortMapCache: function () {
        //sampe init cache
        var svr1 = "ubuntu@ec2-100-25-14-124.compute-1.amazonaws.com";
        var svr2 = "100.25.14.124";
        for (var i = 0; i < 2; i++) {
            this.myCache_PrxyipPort.set(i, { idx: i, ip: svr1, port: 9000 + i });
        }
        for (i = i; i < 20; i++) {
            this.myCache_PrxyipPort.set(i, { idx: i, ip: svr2, port: 9000 + i });
        }
        console.log("init keys:", JSON.stringify(this.myCache_PrxyipPort.keys()))
        console.log(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.getStats())
    },
    UpdateUsage: function (usageID, ttl) {
        var prxy = this.myCache_ClientUsage.get(usageID)
        if (prxy === undefined) { //ever disconnected.
            prxy = this.TakeFreeProxyInfo();
            console.log(" - NewPrxy: ", usageID, JSON.stringify(prxy))
        } else {
            //console.log("~ alive", uunameip, prxy)
            prxy.bNew = 0;
        }
        this.myCache_ClientUsage.set(usageID, prxy, ttl) //update ttl in seconds.
        return prxy;
    },
    TakeFreeProxyInfo: function () {
        var keys = this.myCache_PrxyipPort.keys();
        if (keys.length === 0) {
            console.log("FATAL ERROR: no proxy")
        }
        keys.sort(function (a, b) { return parseInt(a) - parseInt(b) });
        console.log(" - 0 keys", JSON.stringify(keys));
        var key = keys[0];
        var obj = this.myCache_PrxyipPort.take(key);
        obj.bNew = 1;
        console.log(" - 1 keys", JSON.stringify(this.myCache_PrxyipPort.keys()))
        return obj
    },
    Reshuffle: function () {
        setInterval(() => {
            console.log("\n********Reshuffle********\n* myCache_PrxyipPort")
            console.log(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.getStats())
            console.log("* keys:", JSON.stringify(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.keys()))

            console.log("\n* myCache_Usage")
            console.log("* stats:\n* ", SvrSite_ProxyCacheMgmnt.myCache_ClientUsage.getStats())
            console.log("* keys:", JSON.stringify(SvrSite_ProxyCacheMgmnt.myCache_ClientUsage.keys()))
            SvrSite_ProxyCacheMgmnt.myCache_ClientUsage.keys().forEach(function (skey, i) {
                console.log(`* ${i}`, skey, JSON.stringify(SvrSite_ProxyCacheMgmnt.myCache_ClientUsage.get(skey)))
            })
            console.log("*************************\n\n")
        }, 10000)
    },
    init: function () {
        SvrSite_ProxyCacheMgmnt.setup_PrxyipPortMapCache()
        SvrSite_ProxyCacheMgmnt.myCache_ClientUsage.on("expired", function (key, value) {
            // ... do something ... 
            console.log("\n* myCache_ClientUsage expired\n", key, JSON.stringify(value));
            console.log("0", JSON.stringify(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.keys()))
            console.log(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.getStats())

            var idx = value.idx;
            SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.set(idx, value)

            console.log("1", JSON.stringify(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.keys()))
            console.log(SvrSite_ProxyCacheMgmnt.myCache_PrxyipPort.getStats())
            console.log("---\n")
        });
    },
    start: function () {
        this.init()
        this.Reshuffle()
    }
}



/////////////////////
var udpCacheSvr = {
    server: null,
    start: function () {
        SvrSite_ProxyCacheMgmnt.start()
        this.startup()
    },
    startup: () => {
        udpCacheSvr.server = dgram.createSocket('udp4')
        udpCacheSvr.server.on('error', (err) => {
            console.log(`server error:\n${err.stack}\n`);
            udpCacheSvr.server.close();
        });

        udpCacheSvr.server.on('message', (msg, rinfo) => {
            var obj = udpCacheSvr.msg2obj(msg)
            if (null === obj) return
            udpCacheSvr.onRcvObj(obj, rinfo)
        });

        udpCacheSvr.server.on('listening', () => {
            //server.setTTL(3) //1-255
            const address = udpCacheSvr.server.address();
            console.log(`udpCacheSvr listening: ${address.address}:${address.port}\n...`);
        });

        udpCacheSvr.server.bind({
            address: HOST,
            port: PORT,
            exclusive: true
        });
        console.log(`server bind: ${HOST}:${PORT}`);
    },
    msg2obj: function (msg) {
        var str = msg.toString()
        if (!str) return null
        //= console.log("*onMsg:", str)
        try {
            var obj = JSON.parse(str)
            return obj
        }
        catch (e) {
            console.log("invalid json str", e)
        }
        return null
    },
    onRcvObj: (obj, rinfo) => {
        var useID = udpCacheSvr.get_useID(obj, rinfo);
        var ttl = parseInt(obj.icommDelay) * 2
        var prxyInfo = SvrSite_ProxyCacheMgmnt.UpdateUsage(useID, ttl)
        obj._svrDat = { useID: useID, prxyInfo: prxyInfo }

        //console.log("onRcvMsg")
        var msg = JSON.stringify(obj);
        udpCacheSvr.server.send(msg, rinfo.port, rinfo.address, (err, bytes) => {
            //=: console.log("- Resp:", msg, bytes)
        })
    },
    get_useID: (obj, rinfo) => {
        var uuname = `${obj.email}^${rinfo.address}^${rinfo.port}`;
        return uuname
    },
}



///////////////////////////////////////////////
//
//
//
//          Client Site
//
//
//
////////////////////////////////////////////////
var udpCacheClnt = {
    PrxKey: "ProxyInfo",
    myCache_PrxyInfo: null,
    client: null,
    itvID: null,
    OnConnected: null,
    OnDisconnected: null,
    commObj: { idx: -1, nDwn: 0, nNew: 0, icommDelay: 5, isoStart: "", email: "" },
    create_client: () => {
        udpCacheClnt.client = dgram.createSocket('udp4');

        udpCacheClnt.client.on("message", (msg, rinfo) => {
            msg = msg.toString()
            /// console.log("onMsgResp:", msg, JSON.stringify(rinfo))
            var obj = JSON.parse(msg);
            udpCacheClnt.onRcvMsg(obj, rinfo)
        });

        udpCacheClnt.client.on("close", () => {
            console.log("client is closed");//, udpCacheClnt.client)
        });
        udpCacheClnt.client.on("error", (e) => {
            console.log("error", e)
        });
        //udpCacheClnt.startProbe()
    },
    startProbe: () => {
        if (!udpCacheClnt.client) return console.log("udpCacheClnt.client=null")
        if (!udpCacheClnt.commObj.email) {
            return console.log("email is empty", udpCacheClnt.commObj)
        }
        udpCacheClnt.commObj.idx = 0
        var msg = JSON.stringify(udpCacheClnt.commObj);
        udpCacheClnt.client.send([msg], PORT, HOST, (err, bytes) => {
            console.log("*** startProbe:", msg, bytes)
        });
    },
    onRcvMsg: (obj, rinfo) => {
        if (!udpCacheClnt.myCache_PrxyInfo) return console.log("udpCacheClnt.myCache_PrxyInfo=null")
        if (!udpCacheClnt.client) return console.log("udpCacheClnt.client=null")
        if (!obj._svrDat) return console.log("obj._svrDat=null")

        var prxNew = obj._svrDat.prxyInfo
        if (!prxNew) {
            return console.log("*ERROR: _svrDat error")
        }

        if (!udpCacheClnt.commObj._svrDat) {
            udpCacheClnt.commObj._svrDat = obj._svrDat
        }
        var prxOld = udpCacheClnt.commObj._svrDat.prxyInfo
        //in case: reshuffle on svr. 
        var bNeedResetup = false
        if (prxOld.ip !== prxNew.ip || prxOld.port !== prxNew.port) {
            obj.nNew++
            bNeedResetup = true; //// cbf need to reset ssh -R. 
        }

        if (obj.idx === 0 || bNeedResetup) {
            //console.log("begin a new probe handshack after dangling", obj.prxyInfo)
            if (udpCacheClnt.OnConnected) udpCacheClnt.OnConnected(obj, rinfo)
        } else {
            if (udpCacheClnt.OnTiktok) udpCacheClnt.OnTiktok(obj, rinfo)
        }

        var ttl = udpCacheClnt.getCacheTTL();
        udpCacheClnt.myCache_PrxyInfo.set(udpCacheClnt.PrxKey, prxNew, ttl);

        obj.idx++
        udpCacheClnt.commObj = obj
        //delete obj._svrDat

        var itvms = 1000 * obj.icommDelay //in ms. 
        setTimeout(() => {
            if (!udpCacheClnt.client) return console.log("udpCacheClnt.client=null-0")
            var msg = JSON.stringify(obj);
            udpCacheClnt.client.send([msg], PORT, HOST, (err, bytes) => {
                ///= console.log(`delay(${itvms})-send:`, msg, bytes)
            });
        }, itvms)
    },
    getCacheTTL: function () {
        return udpCacheClnt.commObj.icommDelay * 2;
    },
    create_cache: () => {
        if (udpCacheClnt.myCache_PrxyInfo) return
        var ttl = udpCacheClnt.getCacheTTL();
        console.log("Default Cache ttl", ttl)
        udpCacheClnt.myCache_PrxyInfo = new NodeCache({ stdTTL: ttl, checkperiod: ttl })
        ////NOTE: 
        udpCacheClnt.myCache_PrxyInfo.on("expired", (key, val) => {
            console.log("\n***********\n on expired", key, val, "\n********")
        });
        udpCacheClnt.myCache_PrxyInfo.on("del", (key, val) => {
            console.log("\n************\n on del", key, val, "\n********\n")
            udpCacheClnt.commObj.nDwn++
            //for client event
            if (udpCacheClnt.OnDisconnected) {
                udpCacheClnt.OnDisconnected(key, val)
            }
            if (!udpCacheClnt.client) return console.log("* WARN: udpCacheClnt.client=null")

            //udpCacheClnt.startProbe() //let loop to restart probe communication.
        });
    },

    stop: function () {
        if (udpCacheClnt.itvID) {
            console.log("udpCacheClnt.stop: udpCacheClnt.itvID:");//,udpCacheClnt.itvID)
            clearInterval(udpCacheClnt.itvID)
            udpCacheClnt.itvID = null
        }

        if (udpCacheClnt.client) {
            console.log("udpCacheClnt.stop: udpCacheClnt.client:");//,udpCacheClnt.client)
            udpCacheClnt.client.close()
            udpCacheClnt.client = null
        }

        if (udpCacheClnt.myCache_PrxyInfo) {
            console.log("udpCacheClnt.stop: udpCacheClnt.myCache_PrxyInfo.del")
            udpCacheClnt.myCache_PrxyInfo.del(udpCacheClnt.PrxKey)
            udpCacheClnt.myCache_PrxyInfo = null
        }


        console.log("udpCacheClnt.stop: closed out and quit.")
    },
    isRunning: function () {
        if (!udpCacheClnt.itvID || !udpCacheClnt.client || !udpCacheClnt.myCache_PrxyInfo) {
            return false
        }
        return true
    },
    resume:function(){
        if(!udpCacheClnt.commObj.email){
            return
        }
        udpCacheClnt.start(null)
    },
    start: function (parm) {
        udpCacheClnt.stop()
        udpCacheClnt.create_cache()
        udpCacheClnt.create_client()
        if(!parm){
        }else{
            udpCacheClnt.commObj.email = parm.email
        }
        udpCacheClnt.commObj.isoStart = (new Date()).toISOString()
        udpCacheClnt.run_loop()
    },
    run_loop: function () {
        clearInterval(udpCacheClnt.itvID)
        udpCacheClnt.itvID = null
        if (!udpCacheClnt.commObj.email) {
            console.log("email is empty.")
            return;
        }
        function routine_check() {
            var ret = udpCacheClnt.myCache_PrxyInfo.get(udpCacheClnt.PrxKey)
            if (ret) {
                ///= console.log("\n~~~ routine check cache:", JSON.stringify(ret), udpCacheClnt.myCache_PrxyInfo.getStats())
            } else {
                ///= console.log("\n~~~ routine startProbe ... ")
                udpCacheClnt.startProbe()
            }
        }
        routine_check()
        udpCacheClnt.itvID = setInterval(routine_check, 5000)
    },
    on: function (id, cbf) {
        switch (id) {
            case "connected":
                udpCacheClnt.OnConnected = cbf
                break;
            case "disconnected":
                udpCacheClnt.OnDisconnected = cbf
                break;
            case "tiktok":
                udpCacheClnt.OnTiktok = cbf
                break;
            default:
                console.log("*** ERROR ID:", id)
                break;
        }
    }
}



module.exports = {
    //For Client site.
    udpCacheClnt: udpCacheClnt,

    //For Server site.
    udpCacheSvr: udpCacheSvr,
    SvrSite_ProxyCacheMgmnt: SvrSite_ProxyCacheMgmnt

}
