import { useState } from 'react'
import './App.css'
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Productos from './pages/productos'
import Ventas from './pages/ventas';
import Dashboard from './pages/dashboard';
import Configuracion from './pages/configuracion';
import Sidebar from './components/SideBar';
import AdministrarCatalogo from './pages/catalogo';
import HistorialVentas from './pages/historialVentas';

function AppContent() {
  const location = useLocation();
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1" style={{ marginLeft: "100px", padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard key={location.pathname} />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/config" element={<Configuracion />} />
          <Route path="/catalogo" element={<AdministrarCatalogo />} />
          <Route path="/historial" element={<HistorialVentas />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;