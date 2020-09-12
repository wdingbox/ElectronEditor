// Modules to control application life and create native browser window
//const {app, BrowserWindow} = require('electron')
const fs = require('fs')
const path = require('path')
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, ipcRenderer } = require('electron')

const Store = require('electron-store');
const store_auto_launch = new Store();








//////////////////////////////////////////////////

const icon_init = path.join(__dirname, "assets/img/files/20x20/edit.png")
const icon_pressed = path.join(__dirname, "assets/img/files/20x20/edit.png")


//Tray Menu Template 
var template =
  [
    { idx: 9, type: "separator" },
    {
      idx: 10, id: "quit", label: 'Quit', toolTip: 'Terminate Mining-coin-app.', accelerator: 'CmdOrCtrl+Q',
      click: () => {
        app.exit();
      },
    },
    { idx: 10, type: "separator" },
    {
      idx: 11, id: "debug", label: 'Open DevTool', toolTip: 'open DevTool.', enabled: true,
      accelerator: 'Shift+CmdOrCtrl+C',
      click: () => {
        console.log("DevTool")
        win_tray_uti.openWindow("./pages/debug_board_dev.html")
        if (win_tray_uti.mainWindow) {
          win_tray_uti.mainWindow.webContents.openDevTools({ mode: 'detach' })
        }
        ////////
        win_tray_uti.signal2web({ id: "ssh_status", msg: out })
      },
    },
    {
      idx: 12, id: "version", label: "0.0", toolTip: 'first trial version.', enabled: false,
      accelerator: 'CmdOrCtrl+D',
      click: () => {
      },
    }
  ];//// template
////////////////////////////////////////////////////////
///////////////////////

///////////////////
///////////////////////
var win_tray_uti = {
  tray: null,
  mainWindow: null,
  trayMenu: null, //Menu.buildFromTemplate(template),

  signal2web: function (obj) {
    ///= console.log("console send:", obj)
    if (!win_tray_uti.mainWindow) return
    win_tray_uti.mainWindow.webContents.send("Main2Web", obj);
  },

  updateTrayMenu: function () {
    var bShow = win_tray_uti.tray.g_menu_show;
    var rec = win_tray_uti.tray.getBounds();
    console.log("updateTrayMenu tray bound", rec);

    win_tray_uti.trayMenu = Menu.buildFromTemplate(template)
    //var m = win_tray_uti.trayMenu.items[1].label = "unregistered"
    //win_tray_uti.trayMenu = Menu.buildFromTemplate(m);
    win_tray_uti.trayMenu.addListener('menu-will-show', () => {
      //console.log('menu-will-show');
      win_tray_uti.tray.g_menu_show = 1;
      var rec1 = win_tray_uti.tray.getBounds();
      /// console.log("rec1", rec1)
    });
    win_tray_uti.trayMenu.addListener('menu-will-close', () => {
      //console.log('menu-will-close');
      win_tray_uti.tray.g_menu_show = 0;
    });

    win_tray_uti.tray.setContextMenu(win_tray_uti.trayMenu)
    if (bShow) {
      //win_tray_uti.tray.focus();
      console.log("tray bound", rec);
      //win_tray_uti.trayMenu.popup({ x: 1, y: 1 });//ISSUES Incorrect.
    }
    return bShow;
  },
  createTray: function () {
    console.log("iconPath icon_init=", icon_init)

    //console.log(template)
    win_tray_uti.tray = new Tray(icon_init)
    win_tray_uti.tray.setImage(icon_init)
    win_tray_uti.tray.setPressedImage(icon_pressed)
    win_tray_uti.tray.setToolTip("Bungee Coin Mining")
    win_tray_uti.tray.g_menu_show = false
    win_tray_uti.updateTrayMenu();

    win_tray_uti.tray.displayBalloon({ title: "fffff", content: "dd" })

    console.log('HI, tray');
    win_tray_uti.tray.on("click", () => {

    })
  },

  openWindow: function (filename, bforceReload) {
    if (bforceReload) win_tray_uti.m_loadfile = bforceReload
    if (win_tray_uti.mainWindow) {
      if (win_tray_uti.m_loadfile === filename) {
        win_tray_uti.mainWindow.show()
      } else {
        win_tray_uti.mainWindow.loadFile(filename)
        win_tray_uti.m_loadfile = filename
        win_tray_uti.mainWindow.show()
      }
      return
    }
    win_tray_uti.createWindow()
    win_tray_uti.mainWindow.loadFile(filename)
    win_tray_uti.m_loadfile = filename
    win_tray_uti.mainWindow.show()
  },
  createWindow: function () {
    if (win_tray_uti.mainWindow) return
    var x = win_tray_uti.tray.getBounds().x - 250;
    // Create the browser window.
    win_tray_uti.mainWindow = new BrowserWindow({
      width: 650,
      height: 750,
      //x: -1, //centered
      //y: -1, //centered
      show: false,
      frame: true, //not dragable.
      fullscreenable: false,
      alwaysOnTop: true,
      transparent: false, //frame opacity
      resizable: false,
      closable: true, //disable close button.
      maximizable: false,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true, //allow client js and nodejs work together in nodeIntegration.js
        //nodeIntegrationInWorker: true
      }
    })
    
    
    win_tray_uti.mainWindow.on("blur", () => {
      if (win_tray_uti.mainWindow.m_isAnimation) {
        return;
      }
      if (!win_tray_uti.mainWindow.webContents.isDevToolsOpened()) {
        // win_tray_uti.mainWindow.hide();
      }
    });
    win_tray_uti.mainWindow.on("close", () => {
      console.log("win close")
      win_tray_uti.mainWindow = null
    });


    win_tray_uti.mainWindow.webContents.on('did-finish-load', () => {
      console.log("main window did-finish-load.")
      if (!win_tray_uti.mainWindow.webContents) return "webConents null"
      //ipcRenderer.send("test","msg")
      win_tray_uti.mainWindow.webContents.send('test', __dirname + '\\')
    })

  },
 

  launch: function () {
    // main entry
    this.createTray();
    this.createWindow();
  }
}











module.exports = {
  win_tray_uti: win_tray_uti,
}