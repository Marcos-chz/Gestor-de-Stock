# Gestor de Stock

Aplicación de escritorio para gestión de stock en tiendas de ropa. Desarrollada con **React + Node.js + Electron**.

## Características

- **Dashboard** con métricas de ventas, stock crítico y movimientos
- **CRUD de productos** con variantes (talle, color) y categorías
- **Punto de venta** con carrito, múltiples métodos de pago e impresión de tickets
- **Historial de ventas** completo
- **Configuración** de descuentos/recargos por método de pago

## Tecnologías

- **Frontend:** React, Bootstrap, Vite
- **Backend:** Node.js, Express, SQLite
- **Desktop:** Electron, Electron Builder

## Instalación

### Requisitos
- Node.js 18+

### Desarrollo
```bash
# Clonar repo
git clone https://github.com/tu-usuario/gestor-stock.git
cd gestor-stock

# Instalar dependencias
npm install
cd backend && npm install
cd ..

# Iniciar app
npm run electron:dev

# Produccion
npm run electron:build
```

### Uso
La base de datos se crea automaticamente en %APPDATA%/GestorStock/
El backend corre en http://localhost:3000

### Autor
Marcos Chavez


