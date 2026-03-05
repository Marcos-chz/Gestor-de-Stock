const fs = require('fs');
const path = require('path');

// ==================== CONFIGURACIÓN ====================
const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
const basePath = path.join(appData, 'GestorStock');
const backupsDir = path.join(basePath, 'backups');
const dbPath = path.join(basePath, 'stock.db');

// Asegurar que la carpeta de backups existe
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// ==================== FUNCIONES ====================
function hacerBackup() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'Base de datos no encontrada' };
    }
    
    const fecha = new Date().toISOString().split('T')[0];
    let backupPath = path.join(backupsDir, `backup-${fecha}.db`);
    
    // Si ya existe, agregar número
    let contador = 1;
    while (fs.existsSync(backupPath)) {
      backupPath = path.join(backupsDir, `backup-${fecha}-${contador}.db`);
      contador++;
    }
    
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup creado: ${path.basename(backupPath)}`);
    
    // Limpiar backups viejos (opcional)
    limpiarBackupsAntiguos(30);
    
    return { success: true, nombre: path.basename(backupPath) };
  } catch (error) {
    console.error('❌ Error backup:', error.message);
    return { success: false, error: error.message };
  }
}

function limpiarBackupsAntiguos(dias = 30) {
  try {
    const files = fs.readdirSync(backupsDir);
    const ahora = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      const edad = (ahora - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      
      if (edad > dias) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Backup antiguo eliminado: ${file}`);
      }
    });
  } catch (error) {
    console.error('❌ Error limpiando backups:', error.message);
  }
}

// ==================== ENDPOINTS ====================
exports.listar = (req, res) => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .map(f => {
        const stats = fs.statSync(path.join(backupsDir, f));
        return {
          nombre: f,
          fecha: stats.mtime,
          tamaño: stats.size
        };
      })
      .sort((a, b) => b.fecha - a.fecha);
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = (req, res) => {
  const resultado = hacerBackup();
  res.json(resultado);
};

exports.restaurar = (req, res) => {
  try {
    const { nombre } = req.params;
    const backupPath = path.join(backupsDir, nombre);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup no encontrado' });
    }
    
    // Backup de seguridad antes de restaurar
    const fecha = new Date().toISOString().split('T')[0];
    const safetyPath = path.join(backupsDir, `backup-antes-restauracion-${fecha}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, safetyPath);
    }
    
    // Restaurar
    fs.copyFileSync(backupPath, dbPath);
    res.json({ success: true, message: 'Backup restaurado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = (req, res) => {
  try {
    const { nombre } = req.params;
    const backupPath = path.join(backupsDir, nombre);
    
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.iniciarBackupAutomatico = () => {
  console.log('🔄 Backup automático cada 24 horas');
  hacerBackup();
  setInterval(hacerBackup, 86400000);
};