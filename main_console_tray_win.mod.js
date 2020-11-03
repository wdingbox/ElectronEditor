// Modules to control application life and create native browser window
//const {app, BrowserWindow} = require('electron')
const fs = require('fs')
const path = require('path')
const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, screen, ipcRenderer } = require('electron')


const Store = require('electron-store');
const store_auto_launch = new Store();


const { AutoLauncher } = require("./my_modules/AutoLauncher.mod")

//////////////////////////////////////////////////

const icon_init = path.join(__dirname, "assets/img/files/20x20/edit.png")
const icon_pressed = path.join(__dirname, "assets/img/files/20x20/edit.png")





var g_Tray = null
var g_Window = null
var g_Menu = null


function Main_Window() {
  this.mainWindow = null
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
      enablePreferredSizeMode: true,
      //minimumFontSize: 12,
      //defaultFontSize: 12,
      //defaultMonospaceFontSize: 12, 

      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, //allow client js and nodejs work together in nodeIntegration.js
      //nodeIntegrationInWorker: true
    }
  })

  var _THIS = this

  this.mainWindow.on("blur", () => {
    if (_THIS.mainWindow.m_isAnimation) {
      return;
    }
    if (!_THIS.mainWindow.webContents.isDevToolsOpened()) {
      // win_tray_uti.mainWindow.hide();
    }
  });
  this.mainWindow.on("close", () => {
    console.log("win close")
    _THIS.mainWindow = null
  });

  //win_tray_uti.win.documentEdited(true)

  this.mainWindow.webContents.on('did-finish-load', () => {
    console.log("main window did-finish-load.")
    if (!_THIS.mainWindow.webContents) return "webConents null"
    //ipcRenderer.send("test","msg")
    _THIS.mainWindow.webContents.send('test', __dirname + '\\')
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

    g_Menu.set_enabled_by_id("OpenDevTool", !!g_Window.mainWindow)
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
        id: "EditCustomHtmlFileOnsite", label: 'Choose File', toolTip: 'Choose a HTML File to edit.', accelerator: 'CmdOrCtrl+S',
        click: (itm) => {
          console.log(itm)
          var filename = "./pages/ckeditor/setup_custom_ckeditor.html"
          g_Window.openWindow(filename)
          if (g_Window) {
            //g_Window.webContents.openDevTools({ mode: 'detach' })
          }

        },
      },

      {
        id: "OpenDevTool", label: 'Open DevTool', toolTip: 'open DevTool.', enabled: false,
        accelerator: 'Shift+CmdOrCtrl+C',
        click: (itm) => {
          console.log("DevTool")
          //win_tray_uti.openWindow("./_ckeditor/_app/index.html")
          if (g_Window.mainWindow && g_Window.mainWindow.webContents) {
            console.log("to open DevTool")
            g_Window.mainWindow.webContents.openDevTools({ mode: 'detach', "defaultFontSize": 28 })
          } else {
            console.log("DevTool cannot opne: no window")
          }
          ////////
          //win_tray_uti.signal2web({ id: "ssh_status", msg: out })
        },
      },

      { type: "separator" },

      {
        id: "SubMenuBroswer", label: 'Broswer', toolTip: 'Broswer',
        submenu: [
          {
            id: "goBackward", label: 'goBackward', toolTip: 'goBackward',
            click: () => {
              Webcontent2MainConsole.Web2Main_func.webContents_goBack(null, { val: -0.1 })
            },
          },
          
          {
            id: "goForward", label: 'goForward', toolTip: 'goForward',
            click: () => {
              Webcontent2MainConsole.Web2Main_func.webContents_goForward(null, { val: -0.1 })
            },
          },
         
          { type: "separator" },

          {
            id: "ZoomIn", label: 'ZoomIn', toolTip: 'ZoomIn',
            click: () => {

              Webcontent2MainConsole.Web2Main_func.webContents_ZoomFactor(null, { val: 0.1 })
            },
          },

          {
            id: "ZoomOut", label: 'ZoomOut', toolTip: 'ZoomOut',
            click: () => {
              Webcontent2MainConsole.Web2Main_func.webContents_ZoomFactor(null, { val: -0.1 })
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
        id: "quit", label: 'Quit', toolTip: 'Terminate Mining-coin-app.', accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.exit();
        },
      },

      {
        id: "MenuItem_Help", label: 'Help', toolTip: 'Help',
        click: () => {
          var filename = "./pages/config_electron_broswer.html"
          g_Window.openWindow(filename, true)
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
      console.log(arg) // prints "ping"
      if (!g_Window.mainWindow) return
      arg.val = g_Window.mainWindow.webContents.getZoomFactor() + arg.val
      g_Window.mainWindow.webContents.setZoomFactor(arg.val)
      console.log("changed val=", arg.val)
    },
    webContents_ZoomLevel: (evt, arg) => {
      console.log(arg) // prints "ping"
      if (!g_Window.mainWindow) return
      console.log("val=", arg.val) // prints "ping"
      g_Window.mainWindow.webContents.setZoomLevel(arg.val)

    },
    webContents_findInPage: (evt, arg) => {
      console.log(arg) // prints "ping"
      if (!g_Window.mainWindow) return
      console.log("val=", arg.val) // prints "ping"
      g_Window.mainWindow.webContents.findInPage(arg.val, arg.opt)

    },
    webContents_goBack: (evt, arg) => {
      console.log(arg)
      if (!g_Window.mainWindow) return
      g_Window.mainWindow.webContents.goBack()
    },
    webContents_goForward: (evt, arg) => {
      console.log(arg)
      if (!g_Window.mainWindow) return
      g_Window.mainWindow.webContents.goForward()
    },
    webContents_printToPDF: (evt, arg) => {
      console.log(arg)
      if (!g_Window.mainWindow) return
      g_Window.mainWindow.webContents.printToPDF({}).then(data => {
        const pdfPath = "/tmp/aaa.pgf";//path.join(os.homedir(), 'Desktop', 'temp.pdf')
        fs.writeFile(pdfPath, data, (error) => {
          if (error) throw error
          console.log(`Wrote PDF successfully to ${pdfPath}`)
        })
      }).catch(error => {
        console.log(`Failed to write PDF to ${pdfPath}: `, error)
      })
    },




    LOGIN_OK: function (evt, arg) {
      win_tray_uti.m_loadfile = "./pages/settings_session.html" //From sign-in page. 
      if (httpsReq.isRunning()) {
        console.log("udpCacheClnt isRunning")
        return
      }
      console.log("LOGIN_OK", arg)
      var cln = httpsReq.set_client(arg)
      store_auto_launch.set("auto_login_user_obj", cln)
      menu_uti.set_login_mode(arg.email); //-> httpsReq.start()
    },
    SET_CHECKPERIOD: function (evt, arg) {
      console.log("SET_CHECKPERIOD", arg)
      //store_auto_launch.set("lauto_ogin_user_obj", arg) //no email info.
      var cln = httpsReq.set_client(arg)
      store_auto_launch.set("auto_login_user_obj", cln) //no email info.
      console.log("SET_CHECKPERIOD", arg, cln)
      if (httpsReq.isRunning()) {
        httpsReq.stop()
      }
      httpsReq.start()
    },
    LOGIN_OUT: function (evt, email) {
      //template[id2idx.login].click(template[id2idx.login])
    }
  }
}
Webcontent2MainConsole.init_IDs()



///////////////////
///////////////////////
var win_tray_uti = {

  signal2web: function (obj) {
    ///= console.log("console send:", obj)
    if (!g_Window.mainWindow) return
    g_Window.mainWindow.webContents.send("Main2Web", obj);
  },

  launch: function () {
    Webcontent2MainConsole.init_ipc();

    g_Menu = new Main_Menu()
    g_Window = new Main_Window()
    g_Tray = new Main_Tray()



    app.whenReady().then(() => {
      globalShortcut.register('Alt+CommandOrControl+I', () => {
        console.log('Electron loves global shortcuts!')
        Webcontent2MainConsole.Web2Main_func.ZoomFactor(null, { val: 0.1 })
      })
      globalShortcut.register('Alt+CommandOrControl+O', () => {
        console.log('Electron loves global shortcuts! Alt+CommandOrControl+O: ZoomFactor')
        Webcontent2MainConsole.Web2Main_func.ZoomFactor(null, { val: -0.1 })
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
