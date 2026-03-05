const db = require("../database");

// ==================== OBTENER TODAS LAS VENTAS ====================
exports.getAll = (req, res) => {
  try {
    const sales = db.prepare(`
      SELECT 
        s.*,
        (
          SELECT json_group_array(
            json_object(
              'variant_id', si.variant_id,
              'quantity', si.quantity,
              'unit_price', si.unit_price,
              'product_name', p.name,
              'size_name', sz.name,
              'color_name', c.name
            )
          )
          FROM sale_items si
          JOIN variants v ON si.variant_id = v.id
          JOIN products p ON v.product_id = p.id
          LEFT JOIN sizes sz ON v.size_id = sz.id
          LEFT JOIN colors c ON v.color_id = c.id
          WHERE si.sale_id = s.id
        ) as items,
        (
          SELECT COUNT(*) 
          FROM sale_items 
          WHERE sale_id = s.id
        ) as items_count  
      FROM sales s
      ORDER BY s.date DESC
    `).all();

    const salesConItems = sales.map(venta => ({
      ...venta,
      items: venta.items ? JSON.parse(venta.items) : []
    }));
    
    res.json(salesConItems);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== OBTENER UNA VENTA CON SUS ITEMS ====================
exports.getOne = (req, res) => {
  const { id } = req.params;
  try {
    const sale = db.prepare(`
      SELECT * FROM sales WHERE id = ?
    `).get(id);

    if (!sale) {
      return res.status(404).json({ ok: false, error: "Venta no encontrada" });
    }

    const items = db.prepare(`
      SELECT 
        si.*,
        p.name as product_name,
        sz.name as size_name,
        c.name as color_name,
        v.barcode
      FROM sale_items si
      JOIN variants v ON si.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN sizes sz ON v.size_id = sz.id
      LEFT JOIN colors c ON v.color_id = c.id
      WHERE si.sale_id = ?
    `).all(id);

    res.json({
      ...sale,
      items
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== CREAR VENTA ====================
exports.create = (req, res) => {
  const { 
    subtotal, 
    discount, 
    card_surcharge, 
    total, 
    payment_method,
    items 
  } = req.body;

  // Validaciones básicas
  if (!subtotal || !total || !payment_method || !items || !items.length) {
    return res.status(400).json({ 
      ok: false, 
      error: "Faltan datos requeridos (subtotal, total, payment_method, items)" 
    });
  }

  if (!['cash', 'card', 'wallet'].includes(payment_method)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Método de pago inválido (debe ser 'cash, 'card' o 'wallet')" 
    });
  }

  // Usar transacción para asegurar que todo se guarde correctamente
  const createSale = db.transaction(() => {
    // 1. Insertar la venta
    const saleResult = db.prepare(`
      INSERT INTO sales (subtotal, discount, card_surcharge, total, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      subtotal, 
      discount || 0, 
      card_surcharge || 0, 
      total, 
      payment_method
    );

    const saleId = saleResult.lastInsertRowid;

    // 2. Insertar cada item y actualizar stock
    for (const item of items) {
      // Insertar item
      db.prepare(`
        INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, commission_pct)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        saleId,
        item.variant_id,
        item.quantity,
        item.unit_price,
        item.commission_pct || 0
      );

      // Actualizar stock (restar)
      db.prepare(`
        UPDATE variants 
        SET stock = stock - ? 
        WHERE id = ? AND stock >= ?
      `).run(item.quantity, item.variant_id, item.quantity);

      // Registrar movimiento de stock
      db.prepare(`
        INSERT INTO stock_movements (variant_id, type, quantity)
        VALUES (?, 'sale', ?)
      `).run(
        item.variant_id,
        -item.quantity
      );
    }

    return saleId;
  });

  try {
    const saleId = createSale();
    res.json({ ok: true, id: saleId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};


// ==================== ELIMINAR VENTA ====================
exports.delete = (req, res) => {
  const { id } = req.params;

  // Verificar que la venta existe
  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  if (!sale) {
    return res.status(404).json({ ok: false, error: "Venta no encontrada" });
  }

  // Usar transacción para revertir stock
  const deleteSale = db.transaction(() => {

    const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(id);

    for (const item of items) {
      db.prepare(`
        UPDATE variants 
        SET stock = stock + ? 
        WHERE id = ?
      `).run(item.quantity, item.variant_id);

      db.prepare(`
        INSERT INTO stock_movements (variant_id, type, quantity, note)
        VALUES (?, 'return', ?, ?)
      `).run(
        item.variant_id,
        item.quantity,
        `Devolución venta #${id}`
      );
    }

    db.prepare("DELETE FROM sales WHERE id = ?").run(id);
  });

  try {
    deleteSale();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};


exports.getByDate = (req, res) => {
  const { start, end } = req.query;
  try {
    let query = `
      SELECT 
        s.*,
        COUNT(si.id) as items_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
    `;
    
    const params = [];
    
    if (start && end) {
      query += ` WHERE date(s.date) BETWEEN date(?) AND date(?)`;
      params.push(start, end);
    } else if (start) {
      query += ` WHERE date(s.date) >= date(?)`;
      params.push(start);
    } else if (end) {
      query += ` WHERE date(s.date) <= date(?)`;
      params.push(end);
    }
    
    query += ` GROUP BY s.id ORDER BY s.date DESC`;
    
    const sales = db.prepare(query).all(...params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};



exports.getSummary = (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_sales,
        SUM(total) as total_revenue,
        SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_total,
        SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_total,
        AVG(total) as average_ticket,
        MAX(total) as max_sale,
        MIN(total) as min_sale,
        SUM(discount) as total_discounts,
        SUM(card_surcharge) as total_surcharges
      FROM sales
      WHERE date(date) = date('now')
    `).get();

    res.json(summary);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};