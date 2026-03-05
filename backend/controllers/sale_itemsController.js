const db = require("../database");
// ==================== OBTENER TODOS LOS ITEMS ====================
exports.getAll = (req, res) => {
  try {
    const items = db.prepare(`
      SELECT 
        si.*,
        s.id as sale_id,
        s.date as sale_date,
        s.payment_method,
        p.name as product_name,
        sz.name as size_name,
        c.name as color_name,
        v.barcode
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN variants v ON si.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN sizes sz ON v.size_id = sz.id
      LEFT JOIN colors c ON v.color_id = c.id
      ORDER BY s.date DESC
    `).all();

    res.json(items);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== OBTENER ITEMS DE UNA VENTA ====================
exports.getBySaleId = (req, res) => {
  const { saleId } = req.params;
  try {
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
      ORDER BY si.id
    `).all(saleId);

    res.json(items);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== OBTENER UN ITEM POR ID ====================
exports.getOne = (req, res) => {
  const { id } = req.params;
  try {
    const item = db.prepare(`
      SELECT 
        si.*,
        s.id as sale_id,
        s.date as sale_date,
        p.name as product_name,
        sz.name as size_name,
        c.name as color_name,
        v.barcode
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN variants v ON si.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN sizes sz ON v.size_id = sz.id
      LEFT JOIN colors c ON v.color_id = c.id
      WHERE si.id = ?
    `).get(id);

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item no encontrado" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== CREAR ITEM ====================
exports.create = (req, res) => {
  const { sale_id, variant_id, quantity, unit_price, commission_pct } = req.body;

  // Validaciones básicas
  if (!sale_id || !variant_id || !quantity || !unit_price) {
    return res.status(400).json({ 
      ok: false, 
      error: "Faltan datos requeridos (sale_id, variant_id, quantity, unit_price)" 
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({ 
      ok: false, 
      error: "La cantidad debe ser mayor a 0" 
    });
  }

  // Verificar que la venta existe
  const sale = db.prepare("SELECT id FROM sales WHERE id = ?").get(sale_id);
  if (!sale) {
    return res.status(404).json({ ok: false, error: "Venta no encontrada" });
  }

  // Verificar que la variante existe y tiene stock
  const variant = db.prepare("SELECT stock FROM variants WHERE id = ?").get(variant_id);
  if (!variant) {
    return res.status(404).json({ ok: false, error: "Variante no encontrada" });
  }

  if (variant.stock < quantity) {
    return res.status(400).json({ 
      ok: false, 
      error: `Stock insuficiente. Disponible: ${variant.stock}` 
    });
  }

  // Usar transacción para crear item y actualizar stock
  const createItem = db.transaction(() => {
    // Insertar item
    const result = db.prepare(`
      INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, commission_pct)
      VALUES (?, ?, ?, ?, ?)
    `).run(sale_id, variant_id, quantity, unit_price, commission_pct || 0);

    // Actualizar stock (restar)
    db.prepare(`
      UPDATE variants 
      SET stock = stock - ? 
      WHERE id = ?
    `).run(quantity, variant_id);

    // Registrar movimiento de stock
    db.prepare(`
      INSERT INTO stock_movements (variant_id, type, quantity, note)
      VALUES (?, 'sale', ?, ?)
    `).run(variant_id, -quantity, `Item de venta #${sale_id}`);

    return result.lastInsertRowid;
  });

  try {
    const itemId = createItem();
    res.json({ ok: true, id: itemId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== ACTUALIZAR ITEM ====================
exports.update = (req, res) => {
  const { id } = req.params;
  const { quantity, unit_price, commission_pct } = req.body;

  // Verificar que el item existe
  const item = db.prepare(`
    SELECT si.*, v.stock as current_stock, v.id as variant_id
    FROM sale_items si
    JOIN variants v ON si.variant_id = v.id
    WHERE si.id = ?
  `).get(id);

  if (!item) {
    return res.status(404).json({ ok: false, error: "Item no encontrado" });
  }

  // Si se actualiza la cantidad, verificar stock
  if (quantity !== undefined && quantity !== item.quantity) {
    const stockAfterRevert = item.current_stock + item.quantity; // Stock si devolvemos el original
    
    if (stockAfterRevert < quantity) {
      return res.status(400).json({ 
        ok: false, 
        error: `Stock insuficiente. Disponible: ${stockAfterRevert}` 
      });
    }
  }

  // Usar transacción para actualizar item y stock
  const updateItem = db.transaction(() => {
    // Si cambia la cantidad, ajustar stock
    if (quantity !== undefined && quantity !== item.quantity) {
      const stockDiff = item.quantity - quantity; // Positivo = devolver stock, Negativo = restar más
      
      db.prepare(`
        UPDATE variants 
        SET stock = stock + ? 
        WHERE id = ?
      `).run(stockDiff, item.variant_id);

      // Registrar movimiento de ajuste
      db.prepare(`
        INSERT INTO stock_movements (variant_id, type, quantity, note)
        VALUES (?, 'adjustment', ?, ?)
      `).run(
        item.variant_id, 
        stockDiff, 
        `Ajuste por modificación item #${id}`
      );
    }

    // Actualizar item
    db.prepare(`
      UPDATE sale_items
      SET quantity = ?,
          unit_price = ?,
          commission_pct = ?
      WHERE id = ?
    `).run(
      quantity !== undefined ? quantity : item.quantity,
      unit_price !== undefined ? unit_price : item.unit_price,
      commission_pct !== undefined ? commission_pct : item.commission_pct,
      id
    );

    // Recalcular totales de la venta
    const saleItems = db.prepare(`
      SELECT SUM(quantity * unit_price) as new_subtotal
      FROM sale_items
      WHERE sale_id = ?
    `).get(item.sale_id);

    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(item.sale_id);
    
    // Actualizar subtotal y total de la venta (manteniendo descuentos/recargos)
    const newSubtotal = saleItems.new_subtotal;
    const newTotal = sale.payment_method === 'cash' 
      ? newSubtotal * (1 - (sale.discount / newSubtotal || 0))
      : newSubtotal * (1 + (sale.card_surcharge / newSubtotal || 0));

    db.prepare(`
      UPDATE sales
      SET subtotal = ?,
          total = ?
      WHERE id = ?
    `).run(newSubtotal, newTotal, item.sale_id);
  });

  try {
    updateItem();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== ELIMINAR ITEM ====================
exports.delete = (req, res) => {
  const { id } = req.params;

  // Verificar que el item existe y obtener datos
  const item = db.prepare(`
    SELECT si.*, v.id as variant_id
    FROM sale_items si
    JOIN variants v ON si.variant_id = v.id
    WHERE si.id = ?
  `).get(id);

  if (!item) {
    return res.status(404).json({ ok: false, error: "Item no encontrado" });
  }

  // Usar transacción para eliminar item y revertir stock
  const deleteItem = db.transaction(() => {
    // Devolver stock
    db.prepare(`
      UPDATE variants 
      SET stock = stock + ? 
      WHERE id = ?
    `).run(item.quantity, item.variant_id);

    // Registrar movimiento de devolución
    db.prepare(`
      INSERT INTO stock_movements (variant_id, type, quantity, note)
      VALUES (?, 'return', ?, ?)
    `).run(
      item.variant_id, 
      item.quantity, 
      `Devolución por eliminación item #${id}`
    );

    // Eliminar item
    db.prepare("DELETE FROM sale_items WHERE id = ?").run(id);

    // Recalcular totales de la venta
    const saleItems = db.prepare(`
      SELECT SUM(quantity * unit_price) as new_subtotal
      FROM sale_items
      WHERE sale_id = ?
    `).get(item.sale_id);

    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(item.sale_id);
    
    if (saleItems.new_subtotal) {
      // Si quedan items, actualizar totales
      const newSubtotal = saleItems.new_subtotal;
      const newTotal = sale.payment_method === 'cash' 
        ? newSubtotal * (1 - (sale.discount / newSubtotal || 0))
        : newSubtotal * (1 + (sale.card_surcharge / newSubtotal || 0));

      db.prepare(`
        UPDATE sales
        SET subtotal = ?,
            total = ?
        WHERE id = ?
      `).run(newSubtotal, newTotal, item.sale_id);
    } else {
      // Si no quedan items, podríamos eliminar la venta o dejarla con total 0
      db.prepare(`
        UPDATE sales
        SET subtotal = 0,
            total = 0
        WHERE id = ?
      `).run(item.sale_id);
    }
  });

  try {
    deleteItem();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== ELIMINAR TODOS LOS ITEMS DE UNA VENTA ====================
exports.deleteBySaleId = (req, res) => {
  const { saleId } = req.params;

  // Verificar que la venta existe
  const sale = db.prepare("SELECT id FROM sales WHERE id = ?").get(saleId);
  if (!sale) {
    return res.status(404).json({ ok: false, error: "Venta no encontrada" });
  }

  // Obtener items para revertir stock
  const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(saleId);

  // Usar transacción
  const deleteAll = db.transaction(() => {
    // Revertir stock de cada item
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
        `Devolución por eliminación de venta #${saleId}`
      );
    }

    // Eliminar todos los items
    db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(saleId);

    // Actualizar venta a 0
    db.prepare(`
      UPDATE sales
      SET subtotal = 0,
          total = 0
      WHERE id = ?
    `).run(saleId);
  });

  try {
    deleteAll();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== OBTENER RESUMEN DE ITEMS VENDIDOS ====================
exports.getSummary = (req, res) => {
  const { start, end } = req.query;
  try {
    let query = `
      SELECT 
        v.id as variant_id,
        p.name as product_name,
        sz.name as size_name,
        c.name as color_name,
        v.barcode,
        SUM(si.quantity) as total_quantity,
        SUM(si.quantity * si.unit_price) as total_revenue,
        COUNT(DISTINCT si.sale_id) as times_sold,
        AVG(si.unit_price) as avg_price
      FROM sale_items si
      JOIN variants v ON si.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN sizes sz ON v.size_id = sz.id
      LEFT JOIN colors c ON v.color_id = c.id
      JOIN sales s ON si.sale_id = s.id
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
    
    query += ` GROUP BY v.id ORDER BY total_quantity DESC`;
    
    const summary = db.prepare(query).all(...params);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};