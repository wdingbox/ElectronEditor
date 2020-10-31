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


//Tray Menu Template 
var template =
  [
    {
      idx: 10, id: "SCC", label: 'Setup a custom ckeditor', toolTip: 'Save', accelerator: 'CmdOrCtrl+S',
      click: (itm) => {
        console.log(itm)
        var filename = "./pages/ckeditor/setup_custom_ckeditor.html"
        win_tray_uti.openWindow(filename)
        if (win_tray_uti.mainWindow) {
          //win_tray_uti.mainWindow.webContents.openDevTools({ mode: 'detach' })
        }

      },
    },


    {
      idx: 11, id: "devTool", label: 'Open devTool', toolTip: 'open DevTool.', enabled: true,
      accelerator: 'Shift+CmdOrCtrl+C',
      click: () => {
        console.log("DevTool")
        //win_tray_uti.openWindow("./pages/debug_board_dev.html")
        //win_tray_uti.openWindow("./_ckeditor/_app/index.html")
        //win_tray_uti.openWindow("./pages/ckeditor/_fullpage_ckeditor_abs.html")
        if (win_tray_uti.mainWindow && win_tray_uti.mainWindow.webContents) {
          win_tray_uti.mainWindow.webContents.openDevTools({ "defaultFontSize": 28 })
        } else {
          console.log("DevTool opne Failed.")
        }
        ////////
        //win_tray_uti.signal2web({ id: "ssh_status", msg: out })
      },
    },



    {
      idx: 10, id: "SAA", label: 'doc.html.ckeditor.htm', toolTip: 'Save', accelerator: 'CmdOrCtrl+S',
      click: () => {
        var filename = "/Users/weiding/Sites/weidroot/weidroot_2017-01-06/app/bitbucket/wdingsoft/weid/htmdoc/proj1/TheMeaningOfSon/doc.html.ckeditor.htm"
        win_tray_uti.openWindow(filename)
        if (win_tray_uti.mainWindow) {
          win_tray_uti.mainWindow.webContents.openDevTools({ mode: 'detach' })
        }

      },
    },

    {
      idx: 10, id: "SAA", label: '_fullpage_ckeditor_tmp2', toolTip: 'Save', accelerator: 'CmdOrCtrl+S',
      click: () => {
        var filename = "./pages/ckeditor/_fullpage_ckeditor_tmp2.html"
        win_tray_uti.openWindow(filename)
        if (win_tray_uti.mainWindow) {
          win_tray_uti.mainWindow.webContents.openDevTools({ mode: 'detach' })
        }

      },
    },

    {
      idx: 10, id: "Autolaunch", label: 'Autolaunch', toolTip: 'Autolaunch after reboot', type: 'checkbox', checked: true,
      click: (itm) => {
        console.log(itm)
        var tmpitm = get_template_item_by_id(itm.id,function(item){
          console.log("find item",item)
          item.checked = itm.checked
          AutoLauncher.set_auto_launch(itm.checked)
        })
        win_tray_uti.updateTrayMenu();
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
////////////////////////////////////////////////////////
///////////////////////

function get_template_item_by_id(id, cb) {
  for (var i = 0; i < template.length; i++) {
    if (template[i].id === id) {
      if (cb) cb(template[i])
      return template[i]
    }
  }
  console.log("menu id is not correct:",id)
  return null
}


function ckeditor_pathfile() { }
ckeditor_pathfile.prototype.page_ckeditor_localPath2absPath = function () {
  var localPath2workPath = {
    "../../assets/ckeditor/ckeditor.js": "./assets/ckeditor/ckeditor.js",
    "../../assets/ckeditor/samples/old/sample.js": "./assets/ckeditor/samples/old/sample.js",
    "../../assets/ckeditor/samples/old/sample.css": "./assets/ckeditor/samples/old/sample.css",
    "../../assets/ckeditor/samples/old/index.html": "./assets/ckeditor/samples/old/index.html",
    "../../assets/ckeditor/samples/old/assets/sample.jpg": "./assets/ckeditor/samples/old/assets/sample.jpg",
    "../../assets/libs/jquery/dist/jquery-2_1_3.min.js": "./assets/libs/jquery/dist/jquery-2_1_3.min.js",
    "../renderer.js": "./renderer.js",
    "../nodeIntegration.js": "./nodeIntegration.js"
  }
  var ckeditor_tmp = "./pages/ckeditor/_fullpage_ckeditor_tmp.html"
  var ckeditor_abs = "./pages/ckeditor/_fullpage_ckeditor_abs.html"
  var tmp_txt = fs.readFileSync(ckeditor_tmp, "utf8")
  console.log(tmp_txt)
  for (var locpath in localPath2workPath) {
    var wkpath = localPath2workPath[locpath]
    if (!fs.existsSync(wkpath)) {
      console.log("File Not exist:", wkpath)
    }
    var abspath = path.join(__dirname, wkpath)
    console.log("loc", locpath)
    console.log("abs", abspath)

    var reg = new RegExp(`${locpath}`, "g")
    tmp_txt = tmp_txt.replace(reg, `${abspath}`)
  }
  fs.writeFileSync(ckeditor_abs, tmp_txt, "utf8")
  return ckeditor_abs
}
var cke = new ckeditor_pathfile()
//cke.page_ckeditor_localPath2absPath()

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
      console.log('HI, tray click');
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

    //win_tray_uti.win.documentEdited(true)

    win_tray_uti.mainWindow.webContents.on('did-finish-load', () => {
      console.log("main window did-finish-load.")
      if (!win_tray_uti.mainWindow.webContents) return "webConents null"
      //ipcRenderer.send("test","msg")
      win_tray_uti.mainWindow.webContents.send('test', __dirname + '\\')
    })

  },

  launch: function () {
    // main entry
    AutoLauncher.init("ElectronCkEditorAppPkg",function (bAutolaunch) {
      get_template_item_by_id("Autolaunch",function(item){
        item.checked = bAutolaunch
      })
    })
    this.createTray();
    this.createWindow();

 
  }
}











module.exports = {
  win_tray_uti: win_tray_uti,
}
