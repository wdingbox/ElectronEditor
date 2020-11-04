
//var request = require("request");
const fs = require('fs');
var path = require('path');
var cheerio = require("cheerio")
////var Uti = require("./Uti.module").Uti;




/////




///////////////////////////////////////////
var Uti = {
    sort_val_of_obj: function (wdfrobj) {
        var sortable = [];
        for (var wd in wdfrobj) {
            sortable.push([wd, wdfrobj[wd]]);
        }

        sortable.sort(function (a, b) {
            return b[1] - a[1];
        });

        var WordFrq = {}
        for (var i = 0; i < sortable.length; i++) {
            WordFrq[sortable[i][0]] = sortable[i][1]
        }
        return WordFrq
    },
    get_WordGrpFrqObj : function (wdfrobj, wdsynOb) {
        ////////////
        var wdgrpObj = {}
        for (var wd in wdsynOb) {
            var ar = wdsynOb[wd]
            if (typeof (ar) === 'number') continue
    
            ar.unshift(wd)
            //console.log(wd, ar, ar.length, typeof (ar))
            if (!wdgrpObj[wd]) {
                wdgrpObj[wd] = { "tot": 0 }
            }
    
            for (var i = 0; i < ar.length; i++) {
                var kwd = ar[i]
                //console.log(wdfrobj, wdfrobj[kwd])
                wdgrpObj[wd]["tot"] += wdfrobj[kwd]
                wdgrpObj[wd][kwd] = wdfrobj[kwd]
            }
        }
        return wdgrpObj
    },
    merge_regular_word_to_root : function (WdFrObj) {
        ////////////
        function restore_by(wdfrobj, suffix) {
            function wsufx_ar(wd) {
                var wsfxary = [], lacha = wd.substr(wd.length - 1), firstpart = wd.substr(0, wd.length - 1)
    
                wsfxary.push(`${wd}${suffix}`)
                wsfxary.push(`${wd}${lacha}${suffix}`) //getting
                switch (lacha) {
                    case "y": wsfxary.push(`${wd}i${suffix}`) //studies
                    case "e": wsfxary.push(`${firstpart}${suffix}`) //taking
                }
                //console.log(wd, wsfxary)
                return wsfxary
            }
            for (var word in wdfrobj) {
                wsufx_ar(word).forEach(function (wchn) {
                    if (wdfrobj.hasOwnProperty(wchn)) {
                        wdfrobj[word] += wdfrobj[wchn]
                        if (word.indexOf("construct") >= 0) console.log(word, wchn, wdfrobj[word])
                        delete wdfrobj[wchn]
                    }
                })
            }
        }
        ["s", "es", "ing", "d", "ed", "er", "r", "or", "ers", "ors", "rs", "ly", "y", "ity", "est", "ion", "ions", "able", "ous", "ously", "ic", "ation", "ations", "cation", "cations", "ant", "ent", "ary", "ence", "ences", "ive", "iveness", , "itive"].forEach(function (sufix) {
            restore_by(WdFrObj, sufix)
        })
        return WdFrObj
    }
}

function EngTxt2WordFrq() {
}


EngTxt2WordFrq.prototype.Run = function (txfile, txt) {
    const outdir="./tmp", lib="./lib"
    var ignore_word = fs.readFileSync(`${lib}/ignore.json`, "utf8")
    var IgnoreWords = JSON.parse(ignore_word)


    //var txt = fs.readFileSync(`${txfile}.txt`, "utf8")
    txt = txt.toLowerCase()
    var warr = txt.match(/([a-zA-Z]+)/g)
    console.log("tot words count=", warr.length)
    fs.writeFileSync(`${outdir}/${txfile}.out.1.wordlist.json`, JSON.stringify(warr, null, 4), 'utf8')

    var WdFrqObj = {}
    for (var i = 0; i < warr.length; i++) {
        var word = warr[i].trim();
        if (!!IgnoreWords[word]) continue
        if (word.length <= 2) continue
        if (!WdFrqObj[word]) {
            WdFrqObj[word] = 0
        }
        WdFrqObj[word]++
        //if (word.indexOf("construct") >= 0) console.log(word, WdFrqObj[word])
    }
    fs.writeFileSync(`${outdir}/${txfile}.out.2.wordfrqRaw.json`, JSON.stringify(WdFrqObj, null, 4), 'utf8')


    var group = fs.readFileSync(`${lib}/group.json`, "utf8")
    var grpObj = JSON.parse(group)
    var wdg = Uti.get_WordGrpFrqObj(WdFrqObj, grpObj)
    //fs.writeFileSync(`${outdir}/${txfile}.out.3.wordgrp.json`, JSON.stringify(wdg, null, 4), 'utf8')

    Uti.merge_regular_word_to_root(WdFrqObj)

    var distar = Object.keys(WdFrqObj)
    console.log("tot distinct count=", distar.length)

    var sortedWFObj = Uti.sort_val_of_obj(WdFrqObj)
    var out = `${outdir}/${txfile}.out.wordfrqMerged.json`
    fs.writeFileSync(`${outdir}/${txfile}.out.wordfrqMerged.json`, JSON.stringify(sortedWFObj, null, 4), 'utf8')
    //console.log(sortedWFObj)
    console.log("out", out)
}

///////////////////////////////////////////
var myArgs = process.argv.slice(2);
var wfq = new EngTxt2WordFrq();

var outdir = "/Users/weiding/Sites/weidroot/weidroot_2017-01-06/app/github/wdingbox/jslibs/data/txt/darwin_species"
var txfile = "EngTxt2FrqTable"
var txt = fs.readFileSync(`${txfile}.txt`, "utf8")
wfq.Run(txfile, txt);

return;


