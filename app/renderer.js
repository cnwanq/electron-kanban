const fs = require("fs");
const { dialog } = require("electron").remote;

const SerialPort = require("serialport");
const Store = require("electron-store");
const store = new Store();

let isConnected = false;
let connectedSerialPath = "";

let currentPort = null;

function getElementById(id) {
  return document.getElementById(id);
}

function hex2int(hex) {
  var len = hex.length,
    a = new Array(len),
    code;
  for (var i = 0; i < len; i++) {
    code = hex.charCodeAt(i);
    if (48 <= code && code < 58) {
      code -= 48;
    } else {
      code = (code & 0xdf) - 65 + 10;
    }
    a[i] = code;
  }

  return a.reduce(function (acc, c) {
    acc = 16 * acc + c;
    return acc;
  }, 0);
}

function unicode2string(unicode) {
  return eval("'" + unicode + "'");
}

let allPorts = [];
function initPorts() {
  SerialPort.list().then((ports) => {
    let list = [];
    for (let i in ports) {
      let port = ports[i];
      // console.log(port);
      list.push(port.path);
    }
    allPorts = list;
    updateSelectSerialPathUI(allPorts);
  });
}

function connectPort(portPath) {
  currentPort = null;
  let port = new SerialPort(portPath, {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
  });

  port.on("open", function () {
    // open logic
    connectedSerialPath = portPath;
    currentPort = port;
    getElementById("labelConnectStatus").innerText = "已连接";
  });

  port.on("data", function (data) {
    if (data.length > 0 && data.length == 41) {
      // 4，5 年
      // let year = '' + data[4]+data[5];
      let yearHex = data[3].toString(16) + data[4].toString(16);
      let year = 2000 + hex2int(yearHex);
      // console.log('年:'+ year);
      // 6, 7 月
      let monthHex = data[5].toString(16) + data[6].toString(16);
      let month = hex2int(monthHex);
      // console.log('月:'+ month);
      // 8, 9 日
      let dayHex = data[7].toString(16) + data[8].toString(16);
      let day = hex2int(dayHex);
      // console.log('日:'+ hex2int(dayHex));
      // 10, 11 时
      let hourHex = data[9].toString(16) + data[10].toString(16);
      let hour = hex2int(hourHex);
      // console.log('时:'+ hex2int(hourHex));
      // 12, 13 分
      let minuteHex = data[11].toString(16) + data[12].toString(16);
      let minute = hex2int(minuteHex);
      // console.log('分:'+ hex2int(minuteHex));
      // 14, 15 秒
      let secondHex = data[13].toString(16) + data[14].toString(16);
      let second = hex2int(secondHex);
      // console.log('秒:'+ hex2int(secondHex));

      // updateDateTimeUI(year, month, day, hour, minute, second);

      let model1Hex = data[15].toString(16) + data[16].toString(16);
      let model1 =
        String.fromCharCode(data[15]) + String.fromCharCode(data[16]);
      // console.log('model1:'+ model1);
      let model2Hex = data[17].toString(16) + data[18].toString(16);
      let model2 =
        String.fromCharCode(data[17]) + String.fromCharCode(data[18]);
      // console.log('model1:'+ model1);
      let model3Hex = data[19].toString(16) + data[20].toString(16);
      let model3 =
        String.fromCharCode(data[19]) + String.fromCharCode(data[20]);
      let model4Hex = data[21].toString(16) + data[22].toString(16);
      let model4 =
        String.fromCharCode(data[21]) + String.fromCharCode(data[22]);
      let model = "" + model1 + model2 + model3 + model4;

      // 24, 25 线
      let lineHex = data[23].toString(16) + data[24].toString(16);
      let line = hex2int(lineHex);
      // console.log('线:'+ hex2int(lineHex));
      // 26, 27 计划产量
      let planHex = data[23].toString(25) + data[26].toString(16);
      let plan = hex2int(planHex);
      // console.log('计划产量:'+ hex2int(planHex));
      // 28, 29 实际产量
      let actualHex = data[23].toString(27) + data[28].toString(16);
      let actual = hex2int(actualHex);
      // console.log('实际产量:'+ actualHex + "-"+ actual);

      getElementById("labelLine").innerHTML = line;

      getElementById("labeValue1").innerHTML = model;
      getElementById("labeValue2").innerHTML = plan;
      getElementById("labeValue3").innerHTML = actual;
      getElementById("labeValue4").innerHTML = (
        ((actual * 100.0) / plan) *
        1.0
      ).toFixed(2);

      let key = "" + year + "-" + month + "-" + day + " " + hour;
      let value = {
        line: line,
        model: model,
        plan: plan,
        actual: actual,
      };

      store.set(key, value);
    }
  });
}

function sendPortData() {
  if (currentPort != null) {
    let datas = [0x01, 0x03, 0x00, 0x00, 0x00, 0x12, 0xc5, 0xc7];
    currentPort.write(datas);
  }
}

function updateSelectSerialPathUI(paths) {
  let select = getElementById("selectSerialPortPath");
  let items = paths.map(function (path, i) {
    let item = '<option value ="' + path + '">' + path + "</option>";
    return item;
  });
  select.innerHTML = items;
}

function refreshDateUI() {
  let date = new Date();

  // console.log(date.toLocaleDateString(), date.toTimeString());

  let year = date.getFullYear();
  let month = date.getMonth();

  let day = date.getDay();

  let hour = date.getHours();

  let minute = date.getMinutes();

  let second = date.getSeconds();

  updateDateTimeUI(year, month, day, hour, minute, second);
}

function updateDateTimeUI(year, month, day, hour, minute, second) {
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  if (hour < 10) {
    hour = "0" + hour;
  }
  if (minute < 10) {
    minute = "0" + minute;
  }
  if (second < 10) {
    second = "0" + second;
  }

  getElementById("labelYear").innerHTML = year;
  getElementById("labelMonth").innerHTML = month;
  getElementById("labelDay").innerHTML = day;

  getElementById("labelHour").innerHTML = hour;
  getElementById("labelMinute").innerHTML = minute;
  getElementById("labelSecond").innerHTML = second;
}

function tapConnectSerialPort(serialPath) {
  // 连接 port
  // alert(serialPath);
  if (serialPath.length > 0) {
    connectPort(serialPath);
  } else {
    alert("无效的选择, 无法连接");
  }
}

function disConnectPort() {
  if (currentPort != null) {
    currentPort = null;
    connectedSerialPath = "";
    isConnected = false;
  }
  getElementById("labelConnectStatus").innerText = "未连接";
}

function exportData() {
  console.log(dialog);
  dialog
    .showSaveDialog({
      title: "选择保存的路径",
      // buttonLabel: "走你",
      // filters: [
      //   // { name: "Custom File Type", extensions: ["js", "html", "json"] },
      // ],
    })
    .then((result) => {
      if (!result.canceled) {
        let storePath = store.path;
        console.log(storePath, result);
        let newFilePath = result.filePath;

        fs.copyFile(store.path, newFilePath, function (err) {
          if (err) console.log("something wrong was happened");
          else console.log("copy file succeed");

          alert('导出完成');
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function appStart() {
  initPorts();
  const intervaler = setInterval(() => {
    refreshDateUI();
    sendPortData();
  }, 1000);

  getElementById("buttonConnect").addEventListener("click", () => {
    let select = getElementById("selectSerialPortPath");
    var index = select.selectedIndex;

    let s = select.options[index].value;

    tapConnectSerialPort(s);
  });

  getElementById("buttonRefresh").addEventListener("click", () => {
    disConnectPort();
    initPorts();
  });

  getElementById("buttonExport").addEventListener("click", () => {
    exportData();
  });

  getElementById("labelConnectStatus").innerText = "未连接";
}

appStart();
