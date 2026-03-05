const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let backendProcess;

function startBackend() {
  return new Promise((resolve, reject) => {
    try {
      // En desarrollo: usar node index.js
      // En producción: usar backend.exe
      const backendPath = isDev 
        ? path.join(__dirname, '../../backend')
        : path.join(process.resourcesPath, 'backend');

      const backendExecutable = isDev
        ? 'node'
        : path.join(backendPath, 'backend.exe');

      const args = isDev
        ? [path.join(backendPath, 'index.js')]
        : [];

      console.log(' Iniciando backend desde:', backendExecutable);
      
      // Verificar que el ejecutable existe (en producción)
      if (!isDev && !fs.existsSync(backendExecutable)) {
        console.error(' No se encontró backend.exe en:', backendExecutable);
        reject(new Error('Backend no encontrado'));
        return;
      }

      backendProcess = spawn(backendExecutable, args, {
        cwd: backendPath,
        stdio: 'pipe', // Cambiado a pipe para ver logs
        shell: false,
        env: { ...process.env }
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(` Backend: ${data}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(` Backend error: ${data}`);
      });

      backendProcess.on('error', (err) => {
        console.error(' Error al iniciar backend:', err);
        reject(err);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend cerrado con código: ${code}`);
      });

      console.log('Backend iniciado correctamente');
      
      // Esperar 3 segundos para que el backend arranque
      setTimeout(resolve, 3000);
    } catch (error) {
      console.error('Error en startBackend:', error);
      reject(error);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, '../public/icon.ico'),
    show: false 
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    if (!isDev) {
      await startBackend();
    }
    createWindow();
  } catch (error) {
    console.error(' Error al iniciar la aplicación:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});