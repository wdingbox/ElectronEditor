// Modules to control application life and create native browser window
const process = require('process')
const fs = require('fs')
const path = require('path')



const { win_tray_uti, } = require("./main_console_tray_win.mod")
const { express_http, } = require("./my_modules/express_http.mod")


express_http.start()



/////////////////////
////////
//////
////
//
const electron = require("electron")
const app = electron.app;

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log("Prevent multiple app to launch")
  //app.quit()
  //return
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  win_tray_uti.launch();
  //createTray();
  //const trayBounds = tray.getBounds();
  //console.log("trayBounds", trayBounds)
  //createWindow(trayBounds.x);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== 'darwin') app.quit()
})

app.on('browser-window-focus', (event, win) => {
  ///win_tray_uti.m_Window.set_foused_win()
  console.log('app browser-window-focus', win.webContents.id)
})
app.on('browser-window-blur', (event, win) => {
  console.log('app browser-window-blur', win.webContents.id)
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  //if (BrowserWindow.getAllWindows().length === 0) createWindow()
})



