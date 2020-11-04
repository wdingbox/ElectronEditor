
//var request = require("request");
const fs = require('fs');
var path = require('path');
////var Uti = require("./Uti.module").Uti;




/////




///////////////////////////////////////////


var EngTxt2WordFrq = function () {
}
EngTxt2WordFrq.prototype.merge_regular_word = function (WdFrObj) {
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
    ["s", "es", "ing", "d", "ed", "er", "r", "or", "ers", "ors", "rs", "ly", "y", "ity", "est", "ion", "ions", "able", "ous","ously", "ic","ation","ations","cation","cations","ant","ent","ary","ence","ences","ive","iveness",,"itive"].forEach(function (sufix) {
        restore_by(WdFrObj, sufix)
    })
    return WdFrObj
}
EngTxt2WordFrq.prototype.get_WordGrpFrqObj = function (wdfrobj, wdsynOb) {
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
}
EngTxt2WordFrq.prototype.sort_by_frq = function (wdfrobj) {
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
}
EngTxt2WordFrq.prototype.Run = function (txfile, outdir) {
    var ignore_word = fs.readFileSync(`${txfile}.lib.ignore.json`, "utf8")
    var IgnoreWords = JSON.parse(ignore_word)


    var txt = fs.readFileSync(`${txfile}.txt`, "utf8")
    //var arr = txt.split(/[0-9\s\,\.\;\-\=\[\]\{\}\(\)\!\@\#\$\%\^\&\*\~\`\|\\\"\'\?\<\>\?\/\:\—\’\“\”\‘\'\æ\ë]/g);
    var arr = txt.match(/([a-zA-Z]+)/g)
    console.log("tot words count=", arr.length)
    fs.writeFileSync(`${outdir}/${txfile}.out.wordlist.json`, JSON.stringify(arr, null, 4), 'utf8')

    var WdFrqObj = {}
    for (var i = 0; i < arr.length; i++) {
        var word = arr[i].toLowerCase().trim();
        if (!!IgnoreWords[word]) continue
        if (word.length <= 2) continue
        if (!WdFrqObj[word]) {
            WdFrqObj[word] = 0
        }
        WdFrqObj[word]++
        //if (word.indexOf("construct") >= 0) console.log(word, WdFrqObj[word])
    }
    fs.writeFileSync(`${outdir}/${txfile}.out.wordfrqRaw.json`, JSON.stringify(WdFrqObj, null, 4), 'utf8')


    var synotxt = fs.readFileSync(`${txfile}.lib.group.json`, "utf8")
    var grpObj = JSON.parse(synotxt)
    var wdg = this.get_WordGrpFrqObj(WdFrqObj, grpObj)
    fs.writeFileSync(`${outdir}/${txfile}.out.wordgrp.json`, JSON.stringify(wdg, null, 4), 'utf8')




    this.merge_regular_word(WdFrqObj)
    var distar = Object.keys(WdFrqObj)
    console.log("tot distinct count=", distar.length)

    var sortedWFObj = this.sort_by_frq(WdFrqObj)
    fs.writeFileSync(`${outdir}/${txfile}.out.wordfrqMerged.json`, JSON.stringify(sortedWFObj, null, 4), 'utf8')
    //console.log(sortedWFObj)
    console.log("end")
}

///////////////////////////////////////////
var myArgs = process.argv.slice(2);
var ps = new EngTxt2WordFrq();

var outdir="/Users/weiding/Sites/weidroot/weidroot_2017-01-06/app/github/wdingbox/jslibs/data/txt/darwin_species"
ps.Run("EngTxt2FrqTable",outdir);

return;


