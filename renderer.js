// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//const electron = require('electron');
//const path = require('path');
//const fs = require('fs');

//////////////////////////////////////////
// Web send data to main
//      ipcRenderer.send(Web2Main_IDS.DBG_WIN, msg)
// 
// main recieve data fr web:
//      win_tray_uti.ipcMain.on(id, (evt, arg)=>{
//            //todo ...
//      });
// 
// ====================================================
// main send data to web:
//     mainWindow.webContents.send('chan', obj);
// web receive data from main:
//     ipcRenderer.on('asynchronous-reply', (event, arg) => {
//        console.log(arg) // prints "pong"
//     })



const ipcRenderer = require('electron').ipcRenderer;
const { Web2Main_IDs } = require('../main_console_tray_win.mod');
console.log("Web2Main_IDs:",Web2Main_IDs)
const Main2Web_func = {
    connectionStatus: function (arg) {
        // <b style="color: ${colr};">${str}</b>
        if (arg.obj) {
            $("#testinfo").text(JSON.stringify(arg, null, 4))
        }

        if (arg.val === "running") {
            var str = ". . . . . . . . . . . . . ."
            arg.val += " " + str.substr(0, 2 * (arg.obj._svr.idx % 4))
            $("#checkPeriod").val(arg.obj._cln.iCheckPeriod)
        }
        
        var str = `<b style="color:${arg.clr}">${arg.val}</b>`
        $("#connectionStatus").html(str)
        
    },
    ssh_status: function (arg) {
        var str = JSON.stringify(arg)
        var out = arg.msg.replace(/\n/g, "<br><br>")
        $("#ssh_status").html(out)
    }
}
ipcRenderer.on("Main2Web", (event, arg) => {
    //FROM: win_tray_uti.mainWindow.webContents.send('Main2Web', obj);
    console.log("web rcv signal fr main:") // prints "pong"
    if (Main2Web_func[arg.id]) {
        Main2Web_func[arg.id](arg)
    } else {
        console.error("Error id:", arg)
    }
})





//for testing only
ipcRenderer.on('asynchronous-reply', (event, arg) => {
    console.log(arg) // prints "pong"
})




