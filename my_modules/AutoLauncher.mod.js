// This is shared by client and server site.
const fs = require('fs')
const path = require('path')


////////////////////////////////////////////////
// https://github.com/Teamwork/node-auto-launch
// Test Cmds : ./tmp/auto_launch_test.sh
// npm run build.
// cd [buildpath]
// ./BungeeMingAppPkg
//
// On iMac, SystemPreference->User/Group->login: check autoluanch item. 
var AutoLaunch = require('auto-launch');
var AutoLauncher = {
  minecraftAutoLauncher: null,
  isEnabled: false,

  init: function (pkgName, cbfun) {
    if (AutoLauncher.minecraftAutoLauncher) return;
    //const pkgName = 'BungeeMiningAppPkg' //////==>from package.json {script:build}
   
    //var buildpath = `/ElectronCkEditorAppPkg-darwin-x64/ElectronCkEditorAppPkg.app/Contents/MacOS/ElectronCkEditorAppPkg`
    var buildpath=`/${pkgName}-darwin-x64/${pkgName}.app/Contents/MacOS/` ;;//Path without filename.
    const pathnam = process.cwd() + `/${buildpath}`; //path.join(__dirname, pkgName);

    console.log("\n\n* buildpath:", buildpath)
    console.log("* pkgName:", pkgName)
    console.log("* pathnam:", pathnam)
    if (!fs.existsSync(pathnam)) {
      console.log("\n\n*********\n* autolaunch pathnam not exists.")
      console.log("*********\n\n\n")
    }
    AutoLauncher.minecraftAutoLauncher = new AutoLaunch({
      name: pkgName, // filename only.
      path: pathnam, // fullpath only. no filename.
    });
    AutoLauncher.minecraftAutoLauncher.isEnabled()
      .then(function (isEnabled) {
        console.log("minecraftAutoLauncher::isEnabled()then===", isEnabled)
        AutoLauncher.isEnabled = isEnabled;

        if (cbfun) {
          cbfun(isEnabled)
        }
      })
      .catch(function (err) {
        // handle error
        console.log("auto-launch err", err)
      });

    console.log("minecraftAutoLauncher.isEnabled", AutoLauncher.isEnabled)
  },

  set_auto_launch: function (bEnableAutoLaunch) {
    //this.init();
    if (true === bEnableAutoLaunch) {
      AutoLauncher.minecraftAutoLauncher.enable(true);
      //minecraftAutoLauncher.disable();
      AutoLauncher.minecraftAutoLauncher.isEnabled()
        .then(function (isEnabled) {
          if (isEnabled) {
            return;
          }
          AutoLauncher.minecraftAutoLauncher.enable(true);
          console.log("*** auto-launch is enabled.")
        })
        .catch(function (err) {
          // handle error
          console.log("auto-launch err", err)
        });
    }
    else {
      AutoLauncher.minecraftAutoLauncher.disable();
      AutoLauncher.minecraftAutoLauncher.isEnabled()
        .then(function (isEnabled) {
          if (!isEnabled) {
            return;
          }
          AutoLauncher.minecraftAutoLauncher.disable();
          console.log("*** auto-launch is disabled.")
        })
        .catch(function (err) {
          // handle error
          console.log("auto-launch err", err)
        });
    }//else
  }
}


/*---------sample usage-----------
var pkgname="ElectronCkEditorAppPkg" 
// from package.json  .script:{build: packegname}
//
AutoLauncher.init(pkgname, function (bAutolaunch) {
  get_template_item_by_id("Autolaunch",function(item){
    item.checked = bAutolaunch
  })
})
AutoLauncher.set_auto_launch(itm.checked)
// 
-------------------*/

module.exports = {
  //For Client site.
  AutoLauncher: AutoLauncher,
}
