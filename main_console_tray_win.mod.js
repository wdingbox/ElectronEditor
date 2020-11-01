// Modules to control application life and create native browser window
//const {app, BrowserWindow} = require('electron')
const fs = require('fs')
const path = require('path')
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, ipcRenderer } = require('electron')

const Store = require('electron-store');
const store_auto_launch = new Store();


const { AutoLauncher } = require("./my_modules/AutoLauncher.mod")

//////////////////////////////////////////////////

const icon_init = path.join(__dirname, "assets/img/files/20x20/edit.png")
const icon_pressed = path.join(__dirname, "assets/img/files/20x20/edit.png")







function Main_Window() {

}
Main_Window.prototype.createWindow = function () {
  if (this.mainWindow) return
  //var x = win_tray_uti.tray.getBounds().x - 250;
  // Create the browser window.
  this.mainWindow = new BrowserWindow({
    width: 1050,
    height: 750,
    //x: -1, //centered
    //y: -1, //centered
    show: false,
    frame: true, //not dragable.
    fullscreenable: true,
    alwaysOnTop: false,
    transparent: false, //frame opacity
    resizable: true,
    closable: true, //disable close button.
    maximizable: true,
    frame: true,
    webPreferences: {
      //minimumFontSize: 12,
      //defaultFontSize: 12,
      //defaultMonospaceFontSize: 12, 

      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, //allow client js and nodejs work together in nodeIntegration.js
      //nodeIntegrationInWorker: true
    }
  })


  this.mainWindow.on("blur", () => {
    if (this.mainWindow.m_isAnimation) {
      return;
    }
    if (!this.mainWindow.webContents.isDevToolsOpened()) {
      // win_tray_uti.mainWindow.hide();
    }
  });
  this.mainWindow.on("close", () => {
    console.log("win close")
    this.mainWindow = null
  });

  //win_tray_uti.win.documentEdited(true)

  this.mainWindow.webContents.on('did-finish-load', () => {
    console.log("main window did-finish-load.")
    if (!this.mainWindow.webContents) return "webConents null"
    //ipcRenderer.send("test","msg")
    this.mainWindow.webContents.send('test', __dirname + '\\')
  })
}
Main_Window.prototype.openWindow = function (filename, bforceReload) {
  if (bforceReload) this.m_loadfile = bforceReload
  if (this.mainWindow) {
    if (this.m_loadfile === filename) {
      this.mainWindow.show()
    } else {
      this.mainWindow.loadFile(filename)
      this.m_loadfile = filename
      this.mainWindow.show()
    }
    return
  }
  this.createWindow()
  this.mainWindow.loadFile(filename)
  this.m_loadfile = filename
  this.mainWindow.show()
}
var g_Window = null


////////////////////////
function Main_Tray() {
  console.log("iconPath icon_init=", icon_init)

  //console.log(template)
  this.tray = new Tray(icon_init)
  this.tray.setImage(icon_init)
  this.tray.setPressedImage(icon_pressed)
  this.tray.setToolTip("Bungee Coin Mining")
  this.tray.g_menu_show = false
  //this.tray.setContextMenu(menu);

  this.tray.displayBalloon({ title: "fffff", content: "dd" })

  console.log('HI, tray');
  this.tray.on("click", () => {
    console.log('HI, tray click');
  })
}
Main_Tray.prototype.setMenu = function (menu) {
  this.tray.setContextMenu(menu)
}
var g_Tray = null


//Tray Menu Template 
function Main_Menu() {
  var _THIS = this;
  this.template =
    [
      {
        idx: 10, id: "EditCustomHtmlFileOnsite", label: 'Edit Custom Html File Onsite', toolTip: 'Save', accelerator: 'CmdOrCtrl+S',
        click: (itm) => {
          console.log(itm)
          var filename = "./pages/ckeditor/setup_custom_ckeditor.html"
          win_tray_uti.openWindow(filename)
          if (g_Window) {
            //g_Window.webContents.openDevTools({ mode: 'detach' })
          }

        },
      },
      { idx: 9, type: "separator" },

      {
        idx: 11, id: "devTool", label: 'Open DevTool', toolTip: 'open DevTool.', enabled: true,
        accelerator: 'Shift+CmdOrCtrl+C',
        click: () => {
          console.log("DevTool")
          //win_tray_uti.openWindow("./pages/debug_board_dev.html")
          //win_tray_uti.openWindow("./_ckeditor/_app/index.html")
          //win_tray_uti.openWindow("./pages/ckeditor/_fullpage_ckeditor_abs.html")
          if (g_Window && g_Window.webContents) {
            g_Window.webContents.openDevTools({ "defaultFontSize": 28 })
          } else {
            console.log("DevTool opne Failed.")
          }
          ////////
          //win_tray_uti.signal2web({ id: "ssh_status", msg: out })
        },
      },
      { idx: 9, type: "separator" },


      {
        idx: 10, id: "SAA", label: 'doc.html.ckeditor.htm', toolTip: '--=',
        click: () => {
          var filename = "/Users/weiding/Sites/weidroot/weidroot_2017-01-06/app/bitbucket/wdingsoft/weid/htmdoc/proj1/TheMeaningOfSon/doc.html.ckeditor.htm"
          win_tray_uti.openWindow(filename)
          if (g_Window) {
            g_Window.webContents.openDevTools({ mode: 'detach' })
          }

        },
      },

      {
        idx: 10, id: "SAA", label: '_fullpage_ckeditor_tmp2', toolTip: '--',
        click: () => {
          var filename = "./pages/ckeditor/_fullpage_ckeditor_tmp2.html"
          win_tray_uti.openWindow(filename)
          if (g_Window) {
            g_Window.webContents.openDevTools({ mode: 'detach' })
          }

        },
      },

      {
        idx: 10, id: "Autolaunch", label: 'Autolaunch', toolTip: 'Autolaunch after reboot', type: 'checkbox', checked: true,
        click: (itm) => {
          console.log("itm.checked", itm.checked)
          var tmpitm = _THIS.get_template_item_by_id(itm.id, function (item) {
            console.log("find item", item)
            item.checked = itm.checked
            AutoLauncher.set_auto_launch(itm.checked)
          })
          _THIS.genMenu();
          g_Tray.setMenu(_THIS.m_menu)
        },
      },

      { idx: 9, type: "separator" },
      {
        idx: 10, id: "quit", label: 'Quit', toolTip: 'Terminate Mining-coin-app.', accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.exit();
        },
      },
      {
        idx: 12, id: "version", label: "0.0", toolTip: 'first trial version.', enabled: false,
        accelerator: 'CmdOrCtrl+D',
        click: (itm) => {
          console.log(itm)
        },
      }
    ];//// template
}
Main_Menu.prototype.get_template_item_by_id = function (id, cb) {
  for (var i = 0; i < this.template.length; i++) {
    if (this.template[i].id === id) {
      if (cb) cb(this.template[i])
      return this.template[i]
    }
  }
  console.log("menu id is not correct:", id)
  return null
}
Main_Menu.prototype.genMenu = function () {
  this.m_menu = Menu.buildFromTemplate(this.template)
  this.m_menu.addListener('menu-will-show', () => {
    console.log('menu-will-show');
    //this.tray.g_menu_show = 1;
    //var rec1 = this.tray.getBounds();
    /// console.log("rec1", rec1)
  });
  this.m_menu.addListener('menu-will-close', () => {
    console.log('menu-will-close');
    //win_thistray_uti.tray.g_menu_show = 0;
  });

  //this.tray.setContextMenu(win_tray_uti.trayMenu)
  // if (bShow) {
  //   //win_tray_uti.tray.focus();
  //   console.log("tray bound", rec);
  //   //win_tray_uti.trayMenu.popup({ x: 1, y: 1 });//ISSUES Incorrect.
  // }
  return this.m_menu;
}
Main_Menu.prototype.onclick = function (id, cb) {
}
var g_Menu = null






///////////////////
///////////////////////
var win_tray_uti = {
 
  signal2web: function (obj) {
    ///= console.log("console send:", obj)
    if (!g_Window) return
    g_Window.webContents.send("Main2Web", obj);
  },

  launch: function () {

    g_Menu = new Main_Menu()
    g_Window = new Main_Window()
    g_Tray = new Main_Tray()

    // main entry
    AutoLauncher.init("ElectronCkEditorAppPkg", function (bAutolaunch) {
      g_Menu.get_template_item_by_id("Autolaunch", function (item) {
        item.checked = bAutolaunch
      })
    })
    
    g_Tray.setMenu(g_Menu.genMenu());
    g_Window.createWindow();


  }
}











module.exports = {
  win_tray_uti: win_tray_uti,
}
