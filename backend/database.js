
const Database = require("better-sqlite3");
const fs = require('fs');
const path = require('path');

const initSqlPath = "C:\\Users\\chave\\OneDrive\\Desktop\\Gestor de Stock\\backend\\db\\init.sql";
const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
const basePath = path.join(appData, 'GestorStock');

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

const dbPath = path.join(basePath, 'stock.db');
console.log(' Base de datos:', dbPath);
console.log(' Buscando init.sql en:', initSqlPath);

const db = new Database(dbPath);

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  if (tables.length === 0) {
    console.log(' Base de datos vacía');
    
    if (fs.existsSync(initSqlPath)) {
      console.log(' init.sql ENCONTRADO');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      const statements = initSql.split(';').filter(s => s.trim());
      
      statements.forEach(stmt => {
        if (stmt.trim()) {
          try {
            db.exec(stmt);
          } catch (err) {
            console.error(' Error:', stmt.substring(0, 50));
          }
        }
      });
      console.log(' Base de datos inicializada');
    } else {
      console.error('NO EXISTE init.sql');
    }
  } else {
    console.log(' Base de datos lista con', tables.length, 'tablas');
  }
} catch (error) {
  console.error(' Error:', error.message);
}

module.exports = db;