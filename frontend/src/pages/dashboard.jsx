import { useState, useEffect, useMemo } from "react";
import { formatearFechaHora, formatearFecha } from "../utils/dateFormatters";
import { useLocation } from 'react-router-dom';

export default function Dashboard() {
  // ==================== ESTADOS VACÍOS ====================
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [products, setProducts] = useState([]);
  const [movimientosRecientes, setMovimientosRecientes] = useState([]);
  const [cantStockCrit, setCantStockCrit] = useState([])

  const location = useLocation()

  useEffect(() => {
    getSales();
    getProducts()
    getStock_movements()

  }, [location.pathname]);


  const getSales = async () =>{
    try {
        const res = await fetch("http://localhost:3000/sales")
        const data = await res.json()
        setVentasRecientes(data)
    } catch (error) {
        console.error(error)
    }
  }

  const getProducts = async () =>{
    try {
        const res = await fetch("http://localhost:3000/products")
        const data = await res.json()
        setProducts(data)

        const criticos = data.filter(p => p.stock <= 5).length;
        setCantStockCrit(criticos);

    } catch (error) {
        console.error(error)
    }
  }


  const getStock_movements = async () => {
  try {
    setMovimientosRecientes([]);
    
    const timestamp = Date.now();
    const res = await fetch(`http://localhost:3000/stock_movements/recent?limite=10&_=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const data = await res.json();

    setTimeout(() => {
      console.log("⏰ Seteando datos...");
      setMovimientosRecientes([...data]);
    }, 100);
    
  } catch (error) {
    console.error("💥 Error:", error);
  }
};

  // ==================== FUNCIÓN PARA FORMATEAR NÚMEROS ====================
  const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-AR').format(numero);
  };

  // FILTROS
  const ventasHoy = ventasRecientes
  .filter(ventasRecientes => {
    const fechaVenta = new Date(ventasRecientes.date).toDateString();
    const fechaHoy = new Date().toDateString();
    return fechaVenta === fechaHoy;
  })
  .reduce((sum, venta) => sum + venta.total, 0);


  const productosStockBajo = products.filter(p => p.stock <= 5);

  const totalProductos = products.length

  const topProducts = useMemo(() => {
  const ventasPorProducto = {};
  
  // Recorrer todas las ventas
  ventasRecientes.forEach(venta => {
    // Si la venta tiene items (después de la modificación del backend)
    if (venta.items && Array.isArray(venta.items)) {
      venta.items.forEach(item => {
        const key = item.variant_id;
        if (!ventasPorProducto[key]) {
          ventasPorProducto[key] = {
            variant_id: item.variant_id,
            product_name: item.product_name || 'Producto',
            size_name: item.size_name || '',
            color_name: item.color_name || '',
            total_vendido: 0
          };
        }
        ventasPorProducto[key].total_vendido += item.quantity;
      });
    }
  });
  
  // Convertir a array, ordenar y tomar top 5
  return Object.values(ventasPorProducto)
    .sort((a, b) => b.total_vendido - a.total_vendido)
    .slice(0, 5);
    }, [ventasRecientes]);


    const valorStockTotal = useMemo(() => {
        return products.reduce((total, p) => total + (p.stock * p.cost_price), 0);
    }, [products]);

  // ==================== RENDER ====================
  return (
    <div className="container-fluid py-5 px-5 bg-white" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h2 className="fw-bold text-dark mb-0">
          <i className="bi bi-house-door text-primary me-2 fs-3"></i>
          Inicio
        </h2>
        <div>
          <span className="text-secondary me-3">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <button className="btn btn-outline-primary btn-sm" onClick={() => {
            getSales();
            getProducts();
            getStock_movements();
          }}>
            <i className="bi bi-arrow-repeat me-1"></i>
            Actualizar
          </button>
        </div>
      </div>

      {false ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-secondary">Cargando dashboard...</p>
        </div>
      ) : (
        <>
            {/* Fila 1: Tarjetas de resumen */}
            <div className="row g-3 mb-4">
            {/* Tarjeta Ventas Hoy */}
            <div className="col-md-3">
                <div className="card border-0 shadow-sm bg-primary text-white">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 className="card-title opacity-75 mb-1">Ventas Hoy</h6>
                        <h3 className="mb-0" style={{ fontSize: "1.5rem" }}>
                        ${formatearNumero(ventasHoy)}
                        </h3>
                    </div>
                    <i className="bi bi-cash-stack fs-1 opacity-50 ms-3"></i>
                    </div>
                </div>
                </div>
            </div>

            {/* Tarjeta Stock Crítico */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm bg-warning">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="overflow-hidden">
                      <h6 className="card-title opacity-75 mb-1 text-truncate">Stock Crítico</h6>
                      <h3 className="mb-0">{cantStockCrit}</h3>
                    </div>
                    <i className="bi bi-exclamation-triangle fs-1 opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Productos Totales */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="overflow-hidden">
                      <h6 className="card-title opacity-75 mb-1 text-truncate">Productos</h6>
                      <h3 className="mb-0">{totalProductos}</h3>
                    </div>
                    <i className="bi bi-box-seam fs-1 opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Valor total del stock */}
            <div className="col-md-3">
                <div className="card border-0 shadow-sm bg-info text-white">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 className="card-title opacity-75 mb-1">Valor del Stock</h6>
                        <h3 className="mb-0" style={{ fontSize: "1.5rem" }}>
                        ${formatearNumero(valorStockTotal)}
                        </h3>
                    </div>
                    <i className="bi bi-piggy-bank fs-1 opacity-50 ms-3"></i>
                    </div>
                </div>
                </div>
            </div>
            </div>

          {/* Fila 2: Gráficos y tablas */}
          <div className="row g-3">
            {/* Columna izquierda: Stock Crítico */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-semibold text-dark mb-0">
                      <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                      Productos por reponer
                    </h5>
                    <span className="badge bg-warning text-dark px-3 py-2">{productosStockBajo.length}</span>
                  </div>
                </div>
                <div className="card-body p-0">
                  {productosStockBajo.length === 0 ? (
                    <p className="text-secondary text-center py-4 mb-0">
                      <i className="bi bi-emoji-smile fs-1 d-block mb-2"></i>
                      ¡Todo en orden! Stock suficiente
                    </p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {productosStockBajo.map(producto => (
                        <div key={producto.product_id} className="list-group-item border-0 border-bottom px-4 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-truncate" style={{ maxWidth: "180px" }}>
                              <span className="fw-medium text-dark d-block text-truncate" title={producto.product_name}>
                                {producto.product_name}
                              </span>
                              <small className="text-secondary d-block text-truncate">
                                {producto.size_name && `Talle: ${producto.size_name}`} 
                                {producto.color_name && ` - Color: ${producto.color_name}`}
                              </small>
                            </div>
                            <span className={`badge px-3 py-2 flex-shrink-0 ${
                              producto.stock <= 0 ? 'bg-danger' : 'bg-warning text-dark'
                            }`}>
                              <i className={`bi ${
                                producto.stock <= 0 ? 'bi-x-circle' : 'bi-exclamation-triangle'
                              } me-1`}></i>
                              {producto.stock <= 0 ? 'Sin stock' : producto.stock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna central: Ventas Recientes */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-4">
                  <h5 className="fw-semibold text-dark mb-0">
                    <i className="bi bi-cart-check text-primary me-2"></i>
                    Ventas Recientes
                  </h5>
                </div>
                <div className="card-body p-0">
                  {ventasRecientes.length === 0 ? (
                    <p className="text-secondary text-center py-4 mb-0">
                      <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                      No hay ventas recientes
                    </p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {ventasRecientes.slice(0, 5).map(venta => (
                        <div key={venta.id} className="list-group-item border-0 border-bottom px-4 py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div style={{ maxWidth: "200px" }}>
                              <div className="d-flex align-items-center gap-1 mb-1 flex-wrap">
                                <span className="fw-medium text-dark">#{venta.id}</span>
                                <span className={`badge ${
                                  venta.payment_method === 'cash' ? 'bg-success' : 
                                  venta.payment_method === 'card' ? 'bg-primary' : 
                                  'bg-info'
                                }`}>
                                  <i className={`bi ${
                                    venta.payment_method === 'cash' ? 'bi-cash me-1' : 
                                    venta.payment_method === 'card' ? 'bi-credit-card me-1' : 
                                    'bi-phone me-1'
                                  }`}></i>
                                  {venta.payment_method === 'cash' ? 'Efectivo' : 
                                   venta.payment_method === 'card' ? 'Tarjeta' : 
                                   'Mercado Pago'}
                                </span>
                              </div>
                              <small className="text-secondary d-block text-truncate">
                                <i className="bi bi-clock me-1"></i>
                                {formatearFechaHora(venta.date)}
                              </small>
                            </div>
                            <div className="text-end flex-shrink-0">
                              <span className="fw-bold text-success d-block">${formatearNumero(venta.total)}</span>
                              <small className="text-secondary">
                                {venta.items?.length || 0} productos
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna derecha: Productos Más Vendidos */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-4">
                  <h5 className="fw-semibold text-dark mb-0">
                    <i className="bi bi-fire text-danger me-2"></i>
                    Productos Más Vendidos
                  </h5>
                </div>
                <div className="card-body p-0">
                  {topProducts.length === 0 ? (
                    <p className="text-secondary text-center py-4 mb-0">
                      <i className="bi bi-bar-chart fs-1 d-block mb-2"></i>
                      Sin datos de ventas
                    </p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {topProducts.map((producto, index) => (
                        <div key={producto.variant_id} className="list-group-item border-0 border-bottom px-4 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2" style={{ maxWidth: "200px" }}>
                              <span className={`
                                badge rounded-circle d-flex align-items-center justify-content-center p-0
                                ${index === 0 ? 'bg-warning' : 
                                  index === 1 ? 'bg-secondary' : 
                                  index === 2 ? 'bg-danger' : 'text-dark'}
                              `} style={{ width: "28px", height: "28px" }}>
                                {index + 1}
                              </span>
                              <div className="text-truncate">
                                <span className="fw-medium text-dark d-block text-truncate" title={producto.product_name}>
                                  {producto.product_name}
                                </span>
                                <small className="text-secondary d-block text-truncate">
                                  {producto.size_name} {producto.color_name}
                                </small>
                              </div>
                            </div>
                            <div className="text-end flex-shrink-0">
                              <span className="fw-bold text-primary">
                                {producto.total_vendido}
                              </span>
                              <small className="text-secondary d-block">unidades</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fila 3: Movimientos Recientes */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-4">
                  <h5 className="fw-semibold text-dark mb-0">
                    <i className="bi bi-arrow-left-right text-info me-2"></i>
                    Movimientos de Stock Recientes
                  </h5>
                </div>
                <div className="card-body p-0">
                  {movimientosRecientes.length === 0 ? (
                    <p className="text-secondary text-center py-4 mb-0">
                      <i className="bi bi-arrow-left-right fs-1 d-block mb-2"></i>
                      No hay movimientos recientes
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="px-4 py-3 text-dark fw-semibold">Fecha</th>
                            <th className="py-3 text-dark fw-semibold">Producto</th>
                            <th className="py-3 text-dark fw-semibold">Tipo</th>
                            <th className="py-3 text-dark fw-semibold">Cantidad</th>
                            <th className="py-3 text-dark fw-semibold">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientosRecientes.map(movimiento => (
                            <tr key={movimiento.id} className="border-bottom">
                              <td className="px-4 text-secondary">{formatearFechaHora(movimiento.created_at)}</td>
                              <td>
                                <span className="fw-medium text-dark">
                                  {movimiento.product_name}
                                </span>
                                <small className="text-secondary d-block">
                                  {movimiento.size_name} {movimiento.color_name}
                                </small>
                              </td>
                              <td>
                                <span className={`badge px-3 py-2 ${
                                  movimiento.type === 'sale' ? 'bg-danger' : 
                                  movimiento.type === 'adjustment' ? 'bg-primary' : 
                                  movimiento.type === 'initial' ? 'bg-success' : 
                                  'bg-secondary'
                                }`}>
                                  {movimiento.type === 'sale' ? 'Venta' : 
                                   movimiento.type === 'adjustment' ? 'Ajuste' : 
                                   movimiento.type === 'initial' ? 'Inicial' :  
                                   movimiento.type}
                                </span>
                              </td>
                              <td className={movimiento.quantity < 0 ? 'text-danger fw-medium' : 'text-success fw-medium'}>
                                {movimiento.quantity > 0 ? `+${movimiento.quantity}` : movimiento.quantity}
                              </td>
                              <td className="fw-medium">
                                <span className="text-secondary">{movimiento.stock_anterior}</span>
                                <span className="mx-2">→</span>
                                <span className={movimiento.stock_actual > movimiento.stock_anterior ? 'text-success' : 'text-danger'}>
                                  {movimiento.stock_actual}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}