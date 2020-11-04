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





