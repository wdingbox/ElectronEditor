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
  this.m_winAry = []
}
Main_Window.prototype.createNewWindow = function (arg) {
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
    console.log("win on blur")
    if (!win.webContents.isDevToolsOpened()) {
      // win_tray_uti.mainWindow.hide();
    }
  });
  win.on("focus", function () {
    console.log("win on focus ")
  });
  win.on("close", () => {
    console.log("win on close", arg)
    if (arg && undefined !== arg.onclose) {
      arg.onclose()
    }
    win.getChildWindows().forEach(function(childwin){
      childwin.close()
      console.log("win on close, allchildwindows")
    })
  });

 

  win.webContents.on('did-finish-load', () => {
    console.log("webContents on  did-finish-load.")
    if (!win.webContents) return "webConents null"
    //ipcRenderer.send("test","msg")
    win.send('test', __dirname + '\\')
  })
  win.webContents.on('before-input-event', (event, input) => {
    console.log("webContents on  before-input-event.")
    if (input.control && input.key.toLowerCase() === 'i') {
      console.log('Pressed Control+I')
      event.preventDefault()
    }
  })
  ////////////////////////////////////////////////////////////
  win.webContents.on('found-in-page', (event, result) => {
    console.log("find result:", result)
    var output = { input: arg, result: result }
    electronStore_findInPage.set("findInPage_output", output)
    win.webContents.m_output = output
    win.getChildWindows().forEach(function(childwin){
      childwin.webContents.send('webContents_findInPage', output);
    })
    //if (result.finalUpdate) webContents.stopFindInPage('clearSelection')
  })

  win.m_parm = arg
  if (arg.loadfile) {
    win.loadFile(arg.loadfile)
    win.show()
  }
  //console.log("crreated win:",win)


  return win;
}


Main_Window.prototype.openFocusedWindowFindInPageDialog = function () {
  let focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) {
    console.log("no foucsed window.")
    return
  }

  var _THIS = this
  var arg = {
    width: 300, height: 300,
    show: true,
    frame: true, //not dragable.
    fullscreenable: false,
    alwaysOnTop: true,
    transparent: false, //frame opacity
    resizable: true,
    closable: true, //disable close button.
    maximizable: false,
    minimizable: false
  }

  var findInPageWin = this.createNewWindow(arg);
  findInPageWin.setParentWindow(focusedWindow)
  findInPageWin.on("close", function () {
    console.log("on close findinpage.")
    var parentWin = findInPageWin.getParentWindow()
    if (parentWin && parentWin.webContents) {
      var obj = electronStore_findInPage.get("findInPage_input")
      var action = obj.stopFindInPage_action
      console.log("stopFindInPage", obj)
      parentWin.webContents.stopFindInPage(action); //'clearSelection')
    }
  })

  findInPageWin.loadFile("./pages/find_in_page_dialog.html")
  return findInPageWin
}


Main_Window.prototype.openFocusedWindowDevTool = function () {

  let focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    focusedWindow.webContents.openDevTools({ mode: 'detach' })
  }
  else {
    console.log("no focused win to open devtool.")
  }
  return
}
Main_Window.prototype.IncFocusedWindowZoomFactor = function (dlt) {

  let focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    var dlt = focusedWindow.webContents.getZoomFactor() + dlt
    focusedWindow.webContents.setZoomFactor(dlt)
  }
  else {
    console.log("no focused win to zoom factor.", dlt)
  }
  return
}
Main_Window.prototype.GoBackFocusedWindow = function () {

  let focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    focusedWindow.webContents.goBack()
  }
  else {
    console.log("no focused win to go back .")
  }
}
Main_Window.prototype.GoForwardFocusedWindow = function () {

  let focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow && focusedWindow.webContents) {
    focusedWindow.webContents.goForward()
  }
  else {
    console.log("no focused win to go forward .")
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

    var winary = BrowserWindow.getAllWindows()

    g_Menu.set_enabled_by_id("OpenDevTool", !!winary.length)
    g_Menu.set_enabled_by_id("SubMenuBroswer", !!winary.length)
    g_Menu.set_enabled_by_id("MenuItem_findInPage", !!winary.length)
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
          g_Window.createNewWindow({ loadfile: filename })
    

        },
      },


      { type: "separator" },

      {
        id: "MenuItem_findInPage", label: 'Search', toolTip: 'Search string in page', accelerator: 'CmdOrCtrl+F',
        click: () => {
          g_Window.openFocusedWindowFindInPageDialog()
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
          g_Window.createNewWindow({loadfile:"./pages/help_info.html"})
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
      console.log("msg from webContent:",arg)
      var focusedwin = BrowserWindow.getFocusedWindow();
      if(!focusedwin) return console.log("no focused win.")
      var parentwin = focusedwin.getParentWindow()
      if(!parentwin) return console.log("no focused parentwin.")
      console.log("val=", arg.val)
      parentwin.webContents.findInPage(arg.val, arg.opt)
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


  }
}











module.exports = {
  win_tray_uti: win_tray_uti,
  Web2Main_IDs: Webcontent2MainConsole.Web2Main_IDs
}
