const electron = require('electron');
const path = require('path');
const fs = require('fs');

const exec = require('child_process').exec;
const child_process = require('child_process');
const { assert } = require('console');

//const { utils } = require('anyproxy');

//const Store = require('electron-store');
//const { ipcRenderer } = require('electron');
//const store_auto_launch = new Store();

// Importing dialog module using remote 
//const dialog = electron.remote.dialog;

//const { MASTER_SVR, SVR_API } = require("../config/config.mod") ;//path is based on page localtion.

// SVR API
// const MingSvrApi = "http://ec2-54-146-65-28.compute-1.amazonaws.com:3000/get_http_proxy_info"


function ckeditor_save2disk() {
  var fname = "_test.htm";
  var dat = CKEDITOR.instances.editor1.getData()
  fs.writeFileSync(fname, dat, "utf8")
  console.log("save2disk:", fname)
}

////////////////////////////////////
$("body").keydown(function (evt) {
  console.log("evt", evt.keyCode)
  if (evt.keyCode == 67 && (evt.ctrlKey || evt.metaKey) && evt.shiftKey) {
    //it was Ctrl + C (Cmd + C)
    console.log("evt dbg win open:", evt.keyCode)
    ipcRenderer.send(Web2Main_IDS.OPEN_DBG_WIN, "openDebugger");
  }
  //renderer_uti.ipcSend("","")



  ckeditor_save2disk()

});
//////////////////////////////////

$(function(){
  $("input[type=file]").click(function () {
    $(this).val("");
  });

  $("input[type=file]").change(function () {
    //alert($(this).val());
    var files = document.getElementById("fname").files[0];//.name; 
    alert(files.path)
    console.log("files",files)

    $("#fname_histoory").append(`<option>${files.path}</option>`)

    var ckeditor_abs = "./pages/ckeditor/_fullpage_ckeditor_abs.html"
    var destfname = `${files.path}.ckeditor.htm`
    fs.copyFile(ckeditor_abs, destfname, (err) => {
      if (err) throw err;
      console.log(ckeditor_abs, ' was copied to', destfname);
    });

    $("#form1").attr("action", destfname)
    //window.open(destfname)
  });
})




