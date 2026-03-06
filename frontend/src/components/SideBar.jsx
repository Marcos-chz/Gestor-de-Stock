import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
    { path: "/", icon: "bi-house-door", label: "Inicio" },
    { path: "/ventas", icon: "bi-cart", label: "Ventas" },
    { path: "/productos", icon: "bi-box", label: "Productos" },
    { path: "/historial", icon: "bi-clock-history", label: "Historial" },
    { path: "/catalogo", icon: "bi-grid-3x3-gap-fill", label: "Catálogo" },
    { path: "/config", icon: "bi-percent", label: "Pagos" },
  ];

  return (
    <div 
      className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white vh-100" 
      style={{ 
        width: "200px", 
        position: "fixed", 
        left: 0, 
        top: 0,
        zIndex: 1000,
        boxShadow: "2px 0 8px rgba(0,0,0,0.15)"
      }}
    >
      {/* Logo */}
      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom border-secondary">
        <i className="bi bi-shop fs-3 text-primary"></i>
        <span className="fs-5 fw-semibold">Gestor Stock</span>
      </div>

      {/* Menú */}
      <ul className="nav nav-pills flex-column gap-1">
        {menuItems.map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3
                ${isActive 
                  ? 'active bg-primary text-white' 
                  : 'text-white-50 hover-bg-secondary'
                }`
              }
            >
              <i className={`bi ${item.icon} fs-5`}></i>
              <span className="fw-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer*/}
      <div className="mt-auto pt-4 small text-white-50">
        © 2026
      </div>
    </div>
  );
}