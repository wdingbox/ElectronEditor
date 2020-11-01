const electron = require('electron');
const path = require('path');
const fs = require('fs');

const exec = require('child_process').exec;
const child_process = require('child_process');
const { assert } = require('console');

//const { utils } = require('anyproxy');

const Store = require('electron-store');
//const { ipcRenderer } = require('electron');
const electronStore = new Store();

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
const CKEsuffix = "___fullpage_ckeditor.htm"
function EditorHistory() {
  this.m_key = "EditingHistory"
  var obj = electronStore.get(this.m_key)
  if (!obj) {
    electronStore.set(this.m_key, {})
  }
  this.popTRs()
}
EditorHistory.prototype.set = function (key) {
  var obj = electronStore.get(this.m_key)
  obj[key] = (new Date()).toISOString()
  electronStore.set(this.m_key, obj)
}
EditorHistory.prototype.popTRs = function () {
  var obj = electronStore.get(this.m_key)
  console.log("histore", obj)
  var trs = ""
  Object.keys(obj).forEach(function (key, i) {
    trs += `<tr><td>${i}</td><td class='pfname'>${key}</td><td>${obj[key]}</td></tr>`
  })
  $("#histbody").html(trs).find(".pfname").bind("click", function () {
    $("#histbody").find(".pfname").css("background-color", "")
    var destfname = $(this).css("background-color", "grey").text() + CKEsuffix
    $("#destpath").text(destfname).attr("href",destfname)
    $("#form1").attr("action", destfname)
    $("input[type='submit']").css("visibility", "visible")
  })
  return trs;
}
var editorHistory = new EditorHistory()


function setup_editor_config() {
  //alert($(this).val());
  var files = document.getElementById("fname").files[0];//.name; 
  //alert(files.path)
  console.log("files", files)

  editorHistory.set(files.path)
  editorHistory.popTRs()

  $("#fname_histoory").append(`<option>${files.path}</option>`)

  var ckeditor_abs = "./pages/ckeditor/_fullpage_ckeditor_independent_template.html"
  //var suffix = "___fullpage_ckeditor.htm"
  var destfname = `${files.path}${CKEsuffix}`

  var svr_site_clientfile = `/tmp/backupfile.html`

  $("#fname_histoory").append(`<option>${ckeditor_abs}</option>`)
  $("#fname_histoory").append(`<option>${destfname}</option>`)
  $("#fname_histoory").append(`<option>${svr_site_clientfile}</option>`)

  fs.copyFile(ckeditor_abs, destfname, (err) => {
    if (err) throw err;
    console.log(ckeditor_abs, ' was copied to', destfname);
  });

  fs.copyFile(files.path, svr_site_clientfile, (err) => {
    if (err) throw err;
    console.log(files.path, ' was copied to', svr_site_clientfile);
  });

  $("#destpath").text(destfname).attr("href",destfname)
  $("#form1").attr("action", destfname)
  $("input[type='submit']").css("visibility", "visible")

}


$(function () {

  $("input[type=file]").click(function () {
    $(this).val("");
  }).change(function () {
    setup_editor_config()
  });
})




