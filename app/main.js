const { app, BrowserWindow } = require('electron');
app.allowRendererProcessReuse = false;
let mainWindow = null;

app.on('ready', () => {
  console.log('Electron start.');
  mainWindow = new BrowserWindow({width:800, height:600, minWidth:400, minHeight:300, webPreferences:{ nodeIntegration:true, enableRemoteModule:true
  }});

  mainWindow.webContents.loadFile('./app/index.html');
  // 打开开发者工具
  mainWindow.webContents.openDevTools();

});
