const electron = require('electron');
const path = require('path');
const fs = require('fs');

const exec = require('child_process').exec;
const child_process = require('child_process');
const { assert } = require('console');



const Store = require('electron-store');
const electronStore = new Store();

//const { ipcRenderer } = require('electron');

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



  //ckeditor_save2disk()

});
//////////////////////////////////
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
  this.popTRs()
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
    var destfname = $(this).css("background-color", "grey").text()
    var ipos = 1 + destfname.lastIndexOf("/")
    const editor_url = "___maverick.editor.html?fname="
    var url = destfname.substr(0, ipos) + editor_url + destfname.substr(ipos)
    console.log(url)

    $("#destpath").text(url).attr("href", url)
    $("#form1").attr("action", url)
    $("input[type='submit']").css("visibility", "visible")
  })
  return trs;
}
var editorHistory = new EditorHistory()


function get_custom_cmd_sh(rootpath) {
  return `#!/bin/bash

# goto customer folder.
cd ${rootpath}

#################################################################
echo "================= git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=. ================================"
git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.





################################################################
echo "================= git status ================================"
git status

################################################################
echo "================= git branch ================================"
git branch


#################################################################
echo "================= ls -al ================================"
ls -al
`}


function setup_maverick_editor() {
  //alert($(this).val());
  var files = document.getElementById("fname").files[0];//.name; 
  console.log("files", files)

  editorHistory.set(files.path)


  const maverick_htm = "___maverick.editor.html"
  const maverick_sh = "___maverick.git_cmd.sh"
  //var suffix = "___fullpage_ckeditor.htm"
  var svr_bkup = `/tmp/backupfile.html`
  var src = `./pages/ckeditor/${maverick_htm}`
  var regx = new RegExp(`/${files.name}$`)
  var destpath = files.path.replace(regx, "")
  var destfname = `${destpath}/${maverick_htm}`
  var destcshname = `./tmp/${maverick_sh}`


  $("#fname_histoory").append(`<option>${files.path}</option>`)
  $("#fname_histoory").append(`<option>${src}</option>`)
  $("#fname_histoory").append(`<option>${destfname}</option>`)
  $("#fname_histoory").append(`<option>${svr_bkup}</option>`)

  console.log("copyFile:\n", src, '\n', destfname)
  fs.copyFile(src, destfname, (err) => {
    if (err) throw err;
    console.log(src, ' was copied to', destfname);
  });

  fs.copyFile(files.path, svr_bkup, (err) => {
    if (err) throw err;
    console.log(files.path, ' was copied to', svr_bkup);
  });

  var txt = get_custom_cmd_sh(destpath)
  fs.writeFileSync(destcshname, txt, "utf8", function (er) {
    if (er) console.log("sh cmd:", er)
    console.log("sh cmd:", destcshname, "\n", txt)
  })


  var url = `${destfname}?fname=${files.name}`
  $("#destpath").text(url).attr("href", url)
  $("#form1").attr("action", url)
  $("input[type='submit']").css("visibility", "visible")

}


$(function () {

  $("input[type=file]").click(function () {
    $(this).val("");
  }).change(function () {
    //setup_editor_config()
    setup_maverick_editor()
  });
})




