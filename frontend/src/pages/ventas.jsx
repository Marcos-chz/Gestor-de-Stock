import { useState, useEffect } from "react";

export default function Ventas() {
  // ==================== ESTADOS ====================
  const [modalPago, setModalPago] = useState(false);
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); 

  // PRODUCTOS DISPONIBLES
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // CARRITO
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  // DATOS DE PAGO
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [cashReceived, setCashReceived] = useState("");
  const [cardSurcharge, setCardSurcharge] = useState(0);
  const [cashDiscount, setCashDiscount] = useState(0);

  // ESTADOS PARA IMPRESIÓN
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [ventaParaImprimir, setVentaParaImprimir] = useState(null);

  // ==================== EFFECTS ====================
  useEffect(() => {
    getProducts();
    getPaymentRules();
  }, []);

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
    setCartTotal(total);
  }, [cart]);

  // ==================== FUNCIONES ====================
  const getProducts = async () => {
    try {
      const res = await fetch("http://localhost:3000/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getPaymentRules = async () => {
    try {
        const res = await fetch("http://localhost:3000/payment_rules");
        if (!res.ok) {
        console.log("❌ Error:", res.status, res.statusText);
        return;
        }

        const data = await res.json();
        
        const efectivo = data.find(r => r.metodo === 'efectivo');
        const tarjeta = data.find(r => r.metodo === 'tarjeta');
        
        setCashDiscount(efectivo?.descuento || 0);
        setCardSurcharge(tarjeta?.recargo || 0);
        
    } catch (error) {
        console.error(error);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError("Producto sin stock");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.variant_id === product.variant_id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setError("Stock insuficiente");
          setTimeout(() => setError(""), 3000);
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.variant_id === product.variant_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          variant_id: product.variant_id,
          product_id: product.product_id,
          barcode: product.barcode,
          product_name: product.product_name,
          size_name: product.size_name,
          color_name: product.color_name,
          sale_price: product.sale_price,
          quantity: 1,
          max_stock: product.stock
        }];
      }
    });
  };

  const removeFromCart = (variant_id) => {
    setCart(prevCart => prevCart.filter(item => item.variant_id !== variant_id));
  };

  const updateQuantity = (variant_id, newQuantity) => {
    const item = cart.find(i => i.variant_id === variant_id);
    
    if (newQuantity <= 0) {
      removeFromCart(variant_id);
      return;
    }
    
    if (newQuantity > item.max_stock) {
      setError(`Stock máximo: ${item.max_stock}`);
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.variant_id === variant_id
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    let total = cartTotal;
    if (paymentMethod === "cash") {
        total = total * (1 - cashDiscount / 100);
    } else if (paymentMethod === "card") {
        total = total * (1 + cardSurcharge / 100);
    }
    return total;
  };

  const calculateChange = () => {
    if (!cashReceived || paymentMethod !== "cash") return 0;
    const total = calculateTotal();
    return Math.max(0, parseFloat(cashReceived) - total);
  };

  const processSale = async () => {
    try {
        const total = calculateTotal();
        const subtotal = cartTotal;

        const items = cart.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          commission_pct: 0
        }));

        // 🔥 IMPORTANTE: El backend espera 'wallet', 'cash', 'card' (en inglés)
        const paymentMethodMap = {
          'wallet': 'wallet',  // ← Cambiado de 'billetera' a 'wallet'
          'cash': 'cash',      // ← Cambiado de 'efectivo' a 'cash'
          'card': 'card'       // ← Cambiado de 'tarjeta' a 'card'
        };

        const resSale = await fetch("http://localhost:3000/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtotal,
            discount: paymentMethod === "cash" ? subtotal * (cashDiscount / 100) : 0,
            card_surcharge: paymentMethod === "card" ? subtotal * (cardSurcharge / 100) : 0,
            total,
            payment_method: paymentMethodMap[paymentMethod], // ← Ahora envía 'wallet', 'cash' o 'card'
            items: items
          })
        });

        if (!resSale.ok) {
          const errorData = await resSale.json();
          throw new Error(errorData.error || "Error al procesar la venta");
        }

        const saleData = await resSale.json();
        const saleId = saleData.id;

        const ventaCompleta = {
          id: saleId,
          subtotal: cartTotal,
          discount: paymentMethod === "cash" ? cartTotal * (cashDiscount / 100) : 0,
          card_surcharge: paymentMethod === "card" ? cartTotal * (cardSurcharge / 100) : 0,
          total: calculateTotal(),
          payment_method: paymentMethod
        };

        setVentaParaImprimir({ venta: ventaCompleta, items: cart });
        setShowPrintModal(true);

    } catch (error) {
        console.error(error);
        setError(error.message || "Error al procesar la venta");
        setTimeout(() => setError(""), 3000);
    }
  };

  // Función para finalizar la venta (limpiar todo)
  const finalizarVenta = () => {
    setShowPrintModal(false);
    setCart([]);
    setModalPago(false);
    setVentaParaImprimir(null);
    setCashReceived("");
    setSuccessMessage("✅ Venta realizada con éxito");
    setTimeout(() => setSuccessMessage(""), 3000);
    getProducts();
  };

  // Función para imprimir ticket
  const imprimirTicket = (venta, items) => {
    const ticketWindow = window.open('', '_blank');
    
    const fecha = new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subtotal = venta.subtotal || venta.total || 0;
    const descuento = venta.discount || 0;
    const recargo = venta.card_surcharge || 0;
    const total = venta.total || 0;

    ticketWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Venta #${venta.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 80mm; 
              margin: 0 auto; 
              padding: 5mm;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
            }
            .header h2 { 
              margin: 0; 
              font-size: 16px; 
            }
            .separator { 
              border-top: 1px dashed #000; 
              margin: 10px 0; 
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              margin-top: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>TU PRENDA IDEAL</h2>
            <p>${fecha}</p>
            <p>Venta #${venta.id}</p>
          </div>
          
          <div class="separator"></div>
          
          ${items.map(item => `
            <div class="item">
              <span>${item.product_name} ${item.size_name || ''} ${item.color_name || ''} x${item.quantity}</span>
              <span>$${(item.sale_price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          
          <div class="total-row">
            <span>SUBTOTAL:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          
          ${descuento > 0 ? `
            <div class="total-row" style="color: green;">
              <span>DESCUENTO:</span>
              <span>-$${descuento.toFixed(2)}</span>
            </div>` : ''}
          
          ${recargo > 0 ? `
            <div class="total-row" style="color: orange;">
              <span>RECARGO:</span>
              <span>+$${recargo.toFixed(2)}</span>
            </div>` : ''}
          
          <div class="total-row">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          
          <div class="footer" style="text-align: center; margin-top: 20px;">
            <p>¡Gracias por su compra!</p>
          </div>
        </body>
      </html>
    `);
    
    ticketWindow.document.close();
    ticketWindow.print();
  };

  // ==================== FILTRO ====================
  const filteredProducts = products.filter(product => {
    if (searchTerm.trim() === "") return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      product.product_name?.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.size_name?.toLowerCase().includes(term) ||
      product.color_name?.toLowerCase().includes(term)
    );
  });

  // ==================== RENDER ====================
  return (
    <div className="container-fluid py-5 px-5 bg-white" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h2 className="fw-bold text-dark mb-0">
          <i className="bi bi-cart text-primary me-2 fs-3"></i>
          Punto de Venta
        </h2>
        {cart.length > 0 && (
          <div className="d-flex align-items-center gap-3">
            <span className="text-secondary">
              <i className="bi bi-basket me-2"></i>
              {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3 border-0 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <span className="fw-medium">{error}</span>
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show mb-3 border-0 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <span className="fw-medium">{successMessage}</span>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
        </div>
      )}

      {/* MODAL PARA IMPRIMIR */}
      {showPrintModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="bi bi-printer me-2"></i>
                  Imprimir comprobante
                </h5>
              </div>
              <div className="modal-body">
                <p>¿Querés imprimir el comprobante de la venta?</p>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={finalizarVenta}
                >
                  No, gracias
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    imprimirTicket(ventaParaImprimir.venta, ventaParaImprimir.items);
                    finalizarVenta();
                  }}
                >
                  <i className="bi bi-printer me-2"></i>
                  Sí, imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="row mb-4 align-items-center">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-secondary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar producto por nombre, código, talle o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6 text-end">
          <span className="text-secondary">
            <i className="bi bi-grid-3x3-gap-fill me-2"></i>
            {filteredProducts.length} productos disponibles
          </span>
        </div>
      </div>

      {/* Dos columnas */}
      <div className="row g-4">
        {/* Productos */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3 text-dark fw-semibold">Producto</th>
                      <th className="py-3 text-dark fw-semibold">Código</th>
                      <th className="py-3 text-dark fw-semibold">Talle</th>
                      <th className="py-3 text-dark fw-semibold">Color</th>
                      <th className="py-3 text-dark fw-semibold">Precio</th>
                      <th className="py-3 text-dark fw-semibold">Stock</th>
                      <th className="py-3 text-end pe-4 text-dark fw-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.variant_id} className="border-bottom">
                        <td className="px-4">
                          <div className="fw-medium text-dark">{product.product_name}</div>
                        </td>
                        <td>
                          <span className="font-monospace text-primary">{product.barcode || "-"}</span>
                        </td>
                        <td className="text-secondary">{product.size_name || "-"}</td>
                        <td>
                          {product.color_name ? (
                            <span className="d-flex align-items-center text-secondary">
                              {product.color_name}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="fw-medium text-success">${product.sale_price}</td>
                        <td>
                          <span className={`badge px-3 py-2 fw-medium ${
                            product.stock > 5 ? 'bg-success text-white' : 
                            product.stock > 0 ? 'bg-warning text-dark' : 
                            'bg-danger text-white'
                          }`}>
                            <i className={`bi ${
                              product.stock > 5 ? 'bi-check-circle me-1' : 
                              product.stock > 0 ? 'bi-exclamation-triangle me-1' : 
                              'bi-x-circle me-1'
                            }`}></i>
                            {product.stock}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                          >
                            <i className="bi bi-cart-plus me-1"></i>
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-secondary d-block mb-3"></i>
                  <p className="text-secondary mb-0">No hay productos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: "20px" }}>
            <div className="card-header bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-basket text-primary me-2"></i>
                  Carrito
                </h5>
                {cart.length > 0 && (
                  <button
                    className="btn btn-sm btn-outline-danger border-0"
                    onClick={clearCart}
                  >
                    <i className="bi bi-trash3 me-1"></i>
                    Vaciar
                  </button>
                )}
              </div>
            </div>
            <div className="card-body pt-0">
              {cart.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cart fs-1 text-secondary d-block mb-3"></i>
                  <p className="text-secondary mb-0">Carrito vacío</p>
                  <p className="text-secondary small mt-2">Agregá productos para comenzar</p>
                </div>
              ) : (
                <>
                  <div className="list-group list-group-flush mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {cart.map(item => (
                      <div key={item.variant_id} className="list-group-item border-0 border-bottom px-0">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-medium text-dark mb-1">{item.product_name}</h6>
                            <small className="text-secondary">
                              <i className="bi bi-rulers me-1"></i>{item.size_name} 
                              <span className="mx-2">•</span>
                              <i className="bi bi-palette me-1"></i>{item.color_name}
                            </small>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger border-0 p-0"
                            onClick={() => removeFromCart(item.variant_id)}
                          >
                            <i className="bi bi-x-lg fs-5"></i>
                          </button>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center border rounded">
                            <button
                              className="btn btn-sm btn-outline-secondary border-0"
                              onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                            <span className="px-3 fw-medium">{item.quantity}</span>
                            <button
                              className="btn btn-sm btn-outline-secondary border-0"
                              onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                              disabled={item.quantity >= item.max_stock}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                          <span className="fw-bold text-success">
                            ${(item.sale_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-light p-3 rounded-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-secondary">Subtotal:</span>
                      <span className="fw-medium">${cartTotal.toFixed(2)}</span>
                    </div>
                    {paymentMethod === "cash" && cashDiscount > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                        <span>Descuento ({cashDiscount}%):</span>
                        <span className="fw-medium">-${(cartTotal * cashDiscount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {paymentMethod === "card" && cardSurcharge > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-2 text-warning">
                        <span>Recargo ({cardSurcharge}%):</span>
                        <span className="fw-medium">+${(cartTotal * cardSurcharge / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="fw-bold">Total:</span>
                      <span className="fw-bold fs-5 text-success">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-success w-100 py-3 fw-medium"
                    onClick={() => setModalPago(true)}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    Proceder al Pago
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PAGO */}
      {modalPago && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-credit-card text-success me-2"></i>
                  Finalizar Venta
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setModalPago(false);
                    setCashReceived("");
                  }}
                />
              </div>

              <div className="modal-body pt-3">
                {/* Resumen */}
                <div className="bg-light p-3 rounded-3 mb-3">
                  <h6 className="fw-semibold text-secondary mb-3">Resumen de la venta</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Subtotal:</span>
                    <span className="fw-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  {paymentMethod === "cash" && cashDiscount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Descuento efectivo ({cashDiscount}%):</span>
                      <span className="fw-medium">-${(cartTotal * cashDiscount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {paymentMethod === "card" && cardSurcharge > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-warning">
                      <span>Recargo tarjeta ({cardSurcharge}%):</span>
                      <span className="fw-medium">+${(cartTotal * cardSurcharge / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between fw-bold pt-2 mt-2 border-top">
                    <span>Total a pagar:</span>
                    <span className="text-success fs-5">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="mb-3">
                  <label className="form-label fw-medium text-secondary mb-2">Método de pago</label>
                  <div className="d-flex gap-3 flex-wrap">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="wallet"
                        value="wallet"
                        checked={paymentMethod === "wallet"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="wallet">
                        <i className="bi bi-phone me-1 text-info"></i>
                        Mercado Pago
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="cash"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="cash">
                        <i className="bi bi-cash me-1 text-success"></i>
                        Efectivo
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="card"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="card">
                        <i className="bi bi-credit-card me-1 text-primary"></i>
                        Tarjeta
                      </label>
                    </div>
                  </div>
                </div>

                {/* Efectivo */}
                {paymentMethod === "cash" && (
                  <div className="mb-3">
                    <label className="form-label fw-medium text-secondary mb-2">Monto recibido</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    {cashReceived && parseFloat(cashReceived) >= calculateTotal() && (
                      <div className="alert alert-success mt-2 mb-0 py-2">
                        <i className="bi bi-arrow-return-left me-2"></i>
                        Vuelto: ${calculateChange().toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-light px-4"
                  onClick={() => {
                    setModalPago(false);
                    setCashReceived("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-success px-4"
                  onClick={processSale} 
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Cobrar ${calculateTotal().toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}