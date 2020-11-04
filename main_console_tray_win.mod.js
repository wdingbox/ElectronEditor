// Modules to control application life and create native browser window
//const {app, BrowserWindow} = require('electron')
const fs = require('fs')
const path = require('path')
const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, dialog, screen, ipcRenderer } = require('electron')


const Store = require('electron-store');
const store_auto_launch = new Store();
const electronStore_findInPage = new Store();

const { AutoLauncher } = require("./my_modules/AutoLauncher.mod")

//////////////////////////////////////////////////

const icon_init = path.join(__dirname, "assets/img/files/20x20/edit.png")
const icon_pressed = path.join(__dirname, "assets/img/files/20x20/edit.png")





var g_Tray = null
var g_Window = null
var g_Menu = null


function Main_Window() {
  this.mainWindow = null
  this.m_findInPageWin = null
}
Main_Window.prototype.createWindow = function (arg) {
  console.log("preload:", path.join(__dirname, 'preload.js'))
  // Create a browser window.
  var parm = {
    width: 1050,
    height: 750,
    //x: -1, //centered
    //y: -1, //centered
    show: true,
    frame: true, //not dragable.
    fullscreenable: true,
    alwaysOnTop: false,
    transparent: false, //frame opacity
    resizable: true,
    closable: true, //disable close button.
    maximizable: true,
    minimizable: true,

    webPreferences: {
      enablePreferredSizeMode: true,
      //minimumFontSize: 12,
      //defaultFontSize: 12,
      //defaultMonospaceFontSize: 12, 

      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, //allow client js and nodejs work together in nodeIntegration.js
      nodeIntegrationInWorker: true
    }
  }
  if (arg) {
    Object.keys(parm).forEach(function (key) {
      if (undefined !== arg[key]) {
        parm[key] = arg[key]
        console.log(key, arg[key])
      }
    })
  }
  console.log(parm)
  var win = new BrowserWindow(parm)

  win.on("blur", () => {
    if (!win.webContents.isDevToolsOpened()) {
      // win_tray_uti.mainWindow.hide();
    }
  });
  win.on("close", () => {
    console.log("win close", arg)
    if (arg && undefined !== arg.onclose) {
      arg.onclose()
    }
  });

  //win_tray_uti.win.documentEdited(true)

  win.webContents.on('did-finish-load', () => {
    console.log("main window did-finish-load.")
    if (!win.webContents) return "webConents null"
    //ipcRenderer.send("test","msg")
    win.send('test', __dirname + '\\')
  })
  return win;
}

Main_Window.prototype.openMainWindow = function (filename, bforceReload) {
  if (bforceReload) this.m_loadfile = bforceReload
  if (this.mainWindow) {
    if (this.m_loadfile !== filename) {
      this.mainWindow.loadFile(filename)
      this.m_loadfile = filename
    }
    this.mainWindow.show()
    return
  }
  var _THIS = this
  this.mainWindow = this.createWindow({
    onclose: function () {
      _THIS.mainWindow = null
      if (_THIS.m_findInPageWin) {
        _THIS.m_findInPageWin.close()
        delete _THIS.m_findInPageWin
        _THIS.m_findInPageWin = null
      }
    }
  })
  this.mainWindow.loadFile(filename)
  this.m_loadfile = filename
  this.mainWindow.show()
}
Main_Window.prototype.openFindInPageDialog = function () {
  if (this.m_findInPageWin) return

  var _THIS = this
  var arg = {
    width: 300, height: 300,
    show: true,
    frame: true, //not dragable.
    fullscreenable: false,
    alwaysOnTop: true,
    transparent: false, //frame opacity
    resizable: false,
    closable: true, //disable close button.
    maximizable: false,
    minimizable: false,
    onclose: function () {
      console.log("close findinpage.")
      if (_THIS.mainWindow && _THIS.mainWindow.webContents) {
        var obj = electronStore_findInPage.get("findInPage_input")
        var action = obj.stopFindInPage_action
        console.log("stopFindInPage", obj)
        _THIS.mainWindow.webContents.stopFindInPage(action); //'clearSelection')
      }
      _THIS.m_findInPageWin = null
    }
  }

  this.m_findInPageWin = this.createWindow(arg);
  this.m_findInPageWin.loadFile("./pages/find_in_page_dialog.html")

  //this.m_findInPageWin.webContents.openDevTools({ mode: 'detach', "defaultFontSize": 28 })
  return this.m_findInPageWin
}
Main_Window.prototype.openFocusedWindowDevTool = function () {
  const window = require('electron').BrowserWindow;
  let focusedWindow = window.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    focusedWindow.webContents.openDevTools({ mode: 'detach' })
  }
  else {
    console.log("cannot open devtool.")
  }
  return
}
Main_Window.prototype.IncFocusedWindowZoomFactor = function (dlt) {
  const window = require('electron').BrowserWindow;
  let focusedWindow = window.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    var dlt = focusedWindow.webContents.getZoomFactor() + dlt
    focusedWindow.webContents.setZoomFactor(dlt)
  }
  else {
    console.log("cannot zoom.", dlt)
  }
  return
}
Main_Window.prototype.GoBackFocusedWindow = function () {
  const window = require('electron').BrowserWindow;
  let focusedWindow = window.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    focusedWindow.webContents.goBack()
  }
  else {
    console.log("cannot.", dlt)
  }
}
Main_Window.prototype.GoForwardFocusedWindow = function () {
  const window = require('electron').BrowserWindow;
  let focusedWindow = window.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    focusedWindow.webContents.goForward()
  }
  else {
    console.log("cannot.", dlt)
  }
}


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
    console.log('HI, tray click, check menu item enabled');

    g_Menu.set_enabled_by_id("OpenDevTool", !!g_Window.mainWindow)
    g_Menu.set_enabled_by_id("SubMenuBroswer", !!g_Window.mainWindow)
    g_Menu.set_enabled_by_id("MenuItem_findInPage", !!g_Window.mainWindow)
  })
}
Main_Tray.prototype.setMenu = function (menu) {
  this.tray.setContextMenu(menu)
}



//Tray Menu Template 
function Main_Menu() {
  var _THIS = this;
  this.template =
    [
      {
        id: "EditCustomHtmlFileOnsite", label: 'Open HTML File', toolTip: 'Select a HTML File to edit.', accelerator: 'CmdOrCtrl+S',
        click: (itm) => {
          console.log(itm)
          var filename = "./pages/find_htm_file_to_edit.html"
          g_Window.openMainWindow(filename)
          if (g_Window) {
            //g_Window.webContents.openDevTools({ mode: 'detach' })
          }

        },
      },


      { type: "separator" },

      {
        id: "MenuItem_findInPage", label: 'Search String', toolTip: 'find text in page', accelerator: 'CmdOrCtrl+F',
        click: () => {
          var win = g_Window.openFindInPageDialog()
        },
      },

      {
        id: "OpenDevTool", label: 'Open DevTool', toolTip: 'open DevTool.', enabled: false,
        accelerator: 'Alt+CmdOrCtrl+C',
        click: (itm) => {
          console.log("open DevTool for current window")
          g_Window.openFocusedWindowDevTool()
        },
      },

      {
        id: "SubMenuBroswer", label: 'Broswer', toolTip: 'Broswer',
        submenu: [
          {
            id: "goBackward", label: 'goBackward', toolTip: 'goBackward',
            click: () => {
              g_Window.GoBackFocusedWindow()
            },
          },

          {
            id: "goForward", label: 'goForward', toolTip: 'goForward',
            click: () => {
              g_Window.GoForwardFocusedWindow()
            },
          },

          { type: "separator" },

          {
            id: "ZoomIn", label: 'ZoomIn', toolTip: 'ZoomIn',
            click: () => {
              g_Window.IncFocusedWindowZoomFactor(0.1)
            },
          },

          {
            id: "ZoomOut", label: 'ZoomOut', toolTip: 'ZoomOut',
            click: () => {
              g_Window.IncFocusedWindowZoomFactor(-0.1)
            },
          },

          { type: "separator" },


          {
            id: "webContents_printToPDF", label: 'printToPDF', toolTip: 'webContents_printToPDF',
            click: () => {
              Webcontent2MainConsole.Web2Main_func.webContents_printToPDF(null, { val: -0.1 })
            },
          },

        ]
      },

      { type: "separator" },

      {
        id: "Autolaunch", label: 'Autolaunch', toolTip: 'Autolaunch after reboot', type: 'checkbox', checked: true,
        click: (itm) => {
          _THIS.toggle_checked(itm, function (pBeforeClickedItem) {
            AutoLauncher.set_auto_launch(itm.checked)
          })
        },
      },

      { type: "separator" },


      {
        id: "MenuItem_Help", label: 'Help', toolTip: 'Help',
        click: () => {
          g_Window.createWindow().loadFile("./pages/help_info.html")
        },
      },

      {
        id: "quit", label: 'Quit', toolTip: 'Terminate Mining-coin-app.', accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.exit();
        },
      },


      {
        id: "version", label: "0.0", toolTip: 'first trial version.', enabled: false,
        accelerator: 'CmdOrCtrl+D',
        click: (itm) => {
          console.log(itm)
        },
      }
    ];//// template

  this.check_id_unique()
}
Main_Menu.prototype.set_enabled_by_id = function (id, bEnabled, cbf) {
  console.log("set_enabled_by_id: id, bEnabled:", id, bEnabled)
  var tmpitm = this.get_template_item_by_id(id, function (pItem) {
    console.log("found item before clicked:", pItem)
    pItem.enabled = bEnabled
    if (cbf) cbf(pItem)
  })
  g_Tray.setMenu(this.genMenu())
}
Main_Menu.prototype.toggle_checked = function (itm, cbf) {
  console.log("itm.checked", itm.checked)
  var tmpitm = this.get_template_item_by_id(itm.id, function (item) {
    console.log("found item before clicked:", item)
    item.checked = itm.checked
    //AutoLauncher.set_auto_launch(itm.checked)
    if (cbf) cbf(item)
  })
  g_Tray.setMenu(this.genMenu())
}
Main_Menu.prototype.check_id_unique = function () {
  var idary = [], ret = true
  for (var i = 0; i < this.template.length; i++) {
    if ("separator" === this.template[i].type) continue
    var id = this.template[i].id
    if (idary.indexOf(id) >= 0) {
      console.log("\n\n **** ERROR *****")
      console.log(" Menu template has duplicated id:", id)
      console.log(" **** ERROR *****\n\n\n")
      ret = false
    }
    idary.push(id)
  }
  return ret
}
Main_Menu.prototype.get_template_item_by_id = function (id, cb) {
  if (false == this.check_id_unique()) return
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


  return this.m_menu;
}
Main_Menu.prototype.onclick = function (id, cb) {
}



var Webcontent2MainConsole = {
  init_IDs: function () {
    let _THIS = this;
    Object.keys(_THIS.Web2Main_func).forEach(function (id) {
      //console.log("id:", id)
      if (_THIS.Web2Main_func[id]) {
        _THIS.Web2Main_IDs[id] = id;
      } else {
        console.log("ERROR id not define:", id)
      }
    });
    console.log(_THIS.Web2Main_IDs)
  },
  init_ipc: function () {
    let _THIS = this;
    Object.keys(_THIS.Web2Main_func).forEach(function (id) {
      //console.log("id:", id)
      if (_THIS.Web2Main_func[id]) {
        _THIS.Web2Main_IDs[id] = id;
        ipcMain.on(id, _THIS.Web2Main_func[id]);
      } else {
        console.log("ERROR id not define:", id)
      }
    });
    console.log(_THIS.Web2Main_IDs)
  },
  ////////////////////
  Web2Main_IDs: {},
  Web2Main_func: {
    webContents_ZoomFactor: (evt, arg) => {
      console.log(arg)
      g_Window.IncFocusedWindowZoomFactor(arg.val)
      // if (!g_Window.mainWindow) return
      // arg.val = g_Window.mainWindow.webContents.getZoomFactor() + arg.val
      // g_Window.mainWindow.webContents.setZoomFactor(arg.val)
      // console.log("changed val=", arg.val)
    },
    webContents_ZoomLevel: (evt, arg) => {
      console.log(arg)
      if (!g_Window.mainWindow) return
      console.log("val=", arg.val)
      g_Window.mainWindow.webContents.setZoomLevel(arg.val)
    },

    webContents_goBack: (evt, arg) => {
      g_Window.GoBackFocusedWindow()
    },
    webContents_goForward: (evt, arg) => {
      g_Window.GoForwareFocusedWindow()
    },
    webContents_printToPDF: (evt, arg) => {
      console.log(arg)
      if (!g_Window.mainWindow) return
      g_Window.mainWindow.webContents.printToPDF({}).then(data => {
        const pdfPath = "/tmp/htm.pgf";//path.join(os.homedir(), 'Desktop', 'temp.pdf')
        fs.writeFile(pdfPath, data, (error) => {
          if (error) throw error
          console.log(`Wrote PDF successfully to ${pdfPath}`)
        })
      }).catch(error => {
        console.log(`Failed to write PDF to ${pdfPath}: `, error)
      })
    },
    webContents_findInPage: (evt, arg) => {
      console.log(arg)
      if (!g_Window.mainWindow) return
      console.log("val=", arg.val)
      g_Window.mainWindow.webContents.findInPage(arg.val, arg.opt)
      if (undefined !== g_Window.mainWindow.webContents.m_output) return
      g_Window.mainWindow.webContents.on('found-in-page', (event, result) => {
        console.log("find result:", result)
        var output = { input: arg, result: result }
        electronStore_findInPage.set("findInPage_output", output)
        g_Window.mainWindow.webContents.m_output = output
        g_Window.m_findInPageWin.webContents.send('webContents_findInPage', output);
        //if (result.finalUpdate) webContents.stopFindInPage('clearSelection')
      })
    },
  }
}
Webcontent2MainConsole.init_IDs()



///////////////////
///////////////////////
var win_tray_uti = {


  launch: function () {
    Webcontent2MainConsole.init_ipc();

    g_Menu = new Main_Menu()
    g_Window = new Main_Window()
    g_Tray = new Main_Tray()



    app.whenReady().then(() => {
      globalShortcut.register('Alt+CommandOrControl+I', () => {
        console.log('Electron loves global shortcuts!')
        g_Window.IncFocusedWindowZoomFactor(0.1)
      })
      globalShortcut.register('Alt+CommandOrControl+O', () => {
        console.log('Electron loves global shortcuts! Alt+CommandOrControl+O: ZoomFactor')
        g_Window.IncFocusedWindowZoomFactor(-0.1)
      })

      globalShortcut.register('Alt+CommandOrControl+C', () => {
        console.log('Electron loves global shortcuts! Alt+CommandOrControl+C: open devtool')
        g_Window.openFocusedWindowDevTool()
      })
    })



    //// 
    AutoLauncher.init("ElectronCkEditorAppPkg", function (bAutolaunch) {
      g_Menu.get_template_item_by_id("Autolaunch", function (item) {
        item.checked = bAutolaunch
      })
    })

    g_Tray.setMenu(g_Menu.genMenu());
    //g_Window.createWindow();


  }
}











module.exports = {
  win_tray_uti: win_tray_uti,
  Web2Main_IDs: Webcontent2MainConsole.Web2Main_IDs
}
