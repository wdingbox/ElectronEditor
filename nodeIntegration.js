const electron = require('electron');
const path = require('path');
const fs = require('fs');

const exec = require('child_process').exec;
const child_process = require('child_process');
const { assert } = require('console');

const { utils } = require('anyproxy');

const Store = require('electron-store');
//const { ipcRenderer } = require('electron');
const store_auto_launch = new Store();

// Importing dialog module using remote 
const dialog = electron.remote.dialog;

const { MASTER_SVR, SVR_API } = require("../config/config.mod") ;//path is based on page localtion.

// SVR API
// const MingSvrApi = "http://ec2-54-146-65-28.compute-1.amazonaws.com:3000/get_http_proxy_info"



////////////////////////////////////
$("body").keydown(function (evt) {
  console.log("evt", evt.keyCode)
  if (evt.keyCode == 67 && (evt.ctrlKey || evt.metaKey) && evt.shiftKey) {
    //it was Ctrl + C (Cmd + C)
    console.log("evt dbg win open:", evt.keyCode)
    ipcRenderer.send(Web2Main_IDS.OPEN_DBG_WIN, "openDebugger");
  }
  //renderer_uti.ipcSend("","")
});
//////////////////////////////////






