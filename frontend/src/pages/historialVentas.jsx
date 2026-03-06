import { useState, useEffect } from "react";
import { formatearFechaHora, formatearFecha } from "../utils/dateFormatters";

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  // Cargar ventas
  useEffect(() => {
    getVentas();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    filtrarVentas();
  }, [ventas, filtroNumero, filtroFecha, filtroMetodo]);

  const getVentas = async () => {
    try {
      const res = await fetch("http://localhost:3000/sales");
      const data = await res.json();
      setVentas(data);
      setVentasFiltradas(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const filtrarVentas = () => {
    let filtradas = [...ventas];

    // Filtrar por número de venta
    if (filtroNumero) {
      filtradas = filtradas.filter(venta => 
        venta.id.toString() === filtroNumero.toString()
      );
    }

    // Filtrar por fecha
    if (filtroFecha) {
      filtradas = filtradas.filter(venta => {
        const fechaVenta = new Date(venta.date).toISOString().split('T')[0];
        return fechaVenta === filtroFecha;
      });
    }

    // Filtrar por método de pago
    if (filtroMetodo !== 'todos') {
      filtradas = filtradas.filter(venta => venta.payment_method === filtroMetodo);
    }

    setVentasFiltradas(filtradas);
  };

  const verDetalleVenta = async (venta) => {
    try {
      const res = await fetch(`http://localhost:3000/sales/${venta.id}`);
      const data = await res.json();
      setVentaSeleccionada(data);
      setModalDetalle(true);
    } catch (error) {
      console.error(error);
    }
  };

  const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-AR').format(numero);
  };

  const getMetodoBadge = (metodo) => {
    const metodos = {
      'cash': { color: 'bg-success', icono: 'bi-cash', texto: 'Efectivo' },
      'card': { color: 'bg-primary', icono: 'bi-credit-card', texto: 'Tarjeta' },
      'wallet': { color: 'bg-info', icono: 'bi-phone', texto: 'Mercado Pago' },
      'efectivo': { color: 'bg-success', icono: 'bi-cash', texto: 'Efectivo' },
      'tarjeta': { color: 'bg-primary', icono: 'bi-credit-card', texto: 'Tarjeta' }
    };
    return metodos[metodo] || { color: 'bg-secondary', icono: 'bi-question', texto: metodo };
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 px-4 bg-white" style={{ minHeight: "100vh" }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-secondary">Cargando historial de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5 px-5 bg-white" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h2 className="fw-bold text-dark mb-0">
          <i className="bi bi-clock-history text-primary me-2 fs-3"></i>
          Historial de Ventas
        </h2>
        <span className="text-secondary">
          <i className="bi bi-receipt me-2"></i>
          {ventasFiltradas.length} ventas
        </span>
      </div>

      {/* Filtros */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label text-secondary fw-semibold small">N° de Venta</label>
          <input
            type="number"
            className="form-control"
            value={filtroNumero}
            onChange={(e) => setFiltroNumero(e.target.value)}
            placeholder="Ej: 45"
            min="1"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label text-secondary fw-semibold small">Fecha</label>
          <input
            type="date"
            className="form-control"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label text-secondary fw-semibold small">Método de pago</label>
          <select
            className="form-select"
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
          >
            <option value="todos">Todos los métodos</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="wallet">Billetera</option>
          </select>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button 
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setFiltroNumero('');
              setFiltroFecha('');
              setFiltroMetodo('todos');
            }}
          >
            <i className="bi bi-eraser me-2"></i>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-dark fw-semibold">#</th>
                  <th className="py-3 text-dark fw-semibold">Fecha</th>
                  <th className="py-3 text-dark fw-semibold">Método</th>
                  <th className="py-3 text-dark fw-semibold">Productos</th>
                  <th className="py-3 text-dark fw-semibold">Subtotal</th>
                  <th className="py-3 text-dark fw-semibold">Descuento</th>
                  <th className="py-3 text-dark fw-semibold">Recargo</th>
                  <th className="py-3 text-dark fw-semibold text-end pe-4">Total</th>
                  <th className="py-3 text-dark fw-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.length > 0 ? (
                  ventasFiltradas.map((venta) => {
                    const metodo = getMetodoBadge(venta.payment_method);
                    return (
                      <tr key={venta.id} className="border-bottom">
                        <td className="px-4">
                          <span className="badge text-dark fs-6 px-3 py-2">
                            #{venta.id}
                          </span>
                        </td>
                        <td className="text-secondary">
                          <i className="bi bi-clock me-2"></i>
                          {new Date(venta.date).toLocaleString('es-AR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <span className={`badge ${metodo.color} px-3 py-2`}>
                            <i className={`bi ${metodo.icono} me-1`}></i>
                            {metodo.texto}
                          </span>
                        </td>
                        <td className="fw-medium text-center">
                          <span className="badge text-dark px-3 py-2">
                            {venta.items_count || 0}
                          </span>
                        </td>
                        <td className="fw-medium">${formatearNumero(venta.subtotal)}</td>
                        <td className="text-success">${formatearNumero(venta.discount)}</td>
                        <td className="text-warning">${formatearNumero(venta.card_surcharge)}</td>
                        <td className="fw-bold text-success text-end pe-4">${formatearNumero(venta.total)}</td>
                        <td className="text-center">
                          <button 
                            className="btn btn-sm btn-outline-primary border-0"
                            onClick={() => verDetalleVenta(venta)}
                            title="Ver detalle"
                          >
                            <i className="bi bi-eye fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-secondary d-block mb-3"></i>
                      <p className="text-secondary mb-0">No hay ventas que coincidan con los filtros</p>
                      {(filtroNumero || filtroFecha || filtroMetodo !== 'todos') && (
                        <button 
                          className="btn btn-link text-primary mt-2"
                          onClick={() => {
                            setFiltroNumero('');
                            setFiltroFecha('');
                            setFiltroMetodo('todos');
                          }}
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de detalle de venta */}
      {modalDetalle && ventaSeleccionada && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-0 pt-4">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-receipt text-primary me-2"></i>
                  Detalle de Venta #{ventaSeleccionada.id}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalDetalle(false)}
                />
              </div>
              <div className="modal-body">
                {/* Info general */}
                <div className="bg-light p-3 rounded-3 mb-4">
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <i className="bi bi-calendar me-2 text-secondary"></i>
                        <span className="fw-medium">Fecha:</span> {formatearFechaHora(ventaSeleccionada.date)}
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-tag me-2 text-secondary"></i>
                        <span className="fw-medium">N° Venta:</span> #{ventaSeleccionada.id}
                      </p>
                      <p className="mb-0">
                        <i className="bi bi-credit-card me-2 text-secondary"></i>
                        <span className="fw-medium">Método:</span>{' '}
                        <span className={`badge ${getMetodoBadge(ventaSeleccionada.payment_method).color} px-3 py-2`}>
                          <i className={`bi ${getMetodoBadge(ventaSeleccionada.payment_method).icono} me-1`}></i>
                          {getMetodoBadge(ventaSeleccionada.payment_method).texto}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6 text-end">
                      <p className="mb-2">
                        <span className="fw-medium">Subtotal:</span> ${formatearNumero(ventaSeleccionada.subtotal)}
                      </p>
                      {ventaSeleccionada.discount > 0 && (
                        <p className="mb-2 text-success">
                          <span className="fw-medium">Descuento:</span> -${formatearNumero(ventaSeleccionada.discount)}
                        </p>
                      )}
                      {ventaSeleccionada.card_surcharge > 0 && (
                        <p className="mb-2 text-warning">
                          <span className="fw-medium">Recargo:</span> +${formatearNumero(ventaSeleccionada.card_surcharge)}
                        </p>
                      )}
                      <p className="fw-bold text-success fs-5 mb-0">
                        Total: ${formatearNumero(ventaSeleccionada.total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabla de productos */}
                <h6 className="fw-semibold text-secondary mb-3">
                  <i className="bi bi-box-seam me-2"></i>
                  Productos vendidos
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-3 py-2">Producto</th>
                        <th className="py-2">Talle</th>
                        <th className="py-2">Color</th>
                        <th className="py-2 text-center">Cant.</th>
                        <th className="py-2 text-end">P. Unit.</th>
                        <th className="py-2 text-end pe-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventaSeleccionada.items?.map(item => (
                        <tr key={item.id}>
                          <td className="px-3">{item.product_name}</td>
                          <td>{item.size_name || '-'}</td>
                          <td>{item.color_name || '-'}</td>
                          <td className="text-center fw-medium">{item.quantity}</td>
                          <td className="text-end">${formatearNumero(item.unit_price)}</td>
                          <td className="text-end pe-3 fw-medium">${formatearNumero(item.quantity * item.unit_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-light">
                      <tr>
                        <td colSpan="5" className="text-end fw-semibold">Total productos:</td>
                        <td className="text-end pe-3 fw-bold">
                          {ventaSeleccionada.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setModalDetalle(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}