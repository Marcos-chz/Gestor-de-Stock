const db = require("../database");

exports.getAll = (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT v.id, v.barcode, v.stock, v.cost_price, v.sale_price, v.product_id, v.size_id, v.color_id,
             p.name AS product_name, c.name AS category_name,
             s.name AS size_name, co.name AS color_name
      FROM variants v
      LEFT JOIN products p ON v.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sizes s ON v.size_id = s.id
      LEFT JOIN colors co ON v.color_id = co.id
    `);

    const variants = stmt.all();
    res.json(variants);
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};


exports.getById = (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare(`SELECT * FROM variants WHERE id = ?`);
    const variant = stmt.get(id);
    if (!variant) return res.status(404).json({ ok: false, error: "No encontrado" });
    res.json(variant);
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};


// En productsController.js
exports.createWithVariant = (req, res) => {
  const { 
    name, category_id, season_id,
    barcode, size_id, color_id, stock, cost_price, sale_price 
  } = req.body;

  const transaction = db.transaction(() => {
    // 1. Verificar código de barras
    const existe = db.prepare("SELECT id FROM variants WHERE barcode = ?").get(barcode);
    if (existe) {
      throw new Error("Ese código de barras ya existe");
    }

    // 2. Crear producto
    const productResult = db.prepare(`
      INSERT INTO products (name, category_id, season_id, active)
      VALUES (?, ?, ?, 1)
    `).run(name, category_id, season_id);

    // 3. Crear variante
    const variantResult = db.prepare(`
      INSERT INTO variants (product_id, barcode, size_id, color_id, stock, cost_price, sale_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      productResult.lastInsertRowid,
      barcode,
      size_id,
      color_id,
      stock,
      cost_price,
      sale_price || 0
    );


    db.prepare(`
      INSERT INTO stock_movements (variant_id, type, quantity, note)
      VALUES (?, 'adjustment', ?, ?)
    `).run(
      variantResult.lastInsertRowid,
      stock,
      'Stock inicial'
    );

    return productResult.lastInsertRowid;
  });

  try {
    const productId = transaction();
    res.json({ ok: true, id: productId });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
};

exports.create = (req, res) => {
  const { product_id, barcode, size_id, color_id, stock, cost_price, sale_price } = req.body;
  try {

    const exists = db
      .prepare("SELECT id FROM variants WHERE barcode = ?")
      .get(barcode);

    if (exists) {
      return res.status(400).json({
        ok: false,
        error: "Ese código de barras ya existe"
      });
    }

    const stmt = db.prepare(`
      INSERT INTO variants (product_id, barcode, size_id, color_id, stock, cost_price, sale_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(product_id, barcode, size_id, color_id, stock, cost_price, sale_price || 0);

    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};


exports.update = (req, res) => {
  const { id } = req.params;
  const {size_id, color_id, stock, cost_price, sale_price } = req.body;
  try {
    const currentVariant = db.prepare(`
      SELECT stock FROM variants WHERE id = ?
    `).get(id);
    
    if (!currentVariant) {
      return res.status(404).json({ ok: false, error: "Variante no encontrada" });
    }

    const stockAnterior = currentVariant.stock;
    const diferencia = stock - stockAnterior; 

    const stmt = db.prepare(`
      UPDATE variants
      SET size_id = ?, color_id = ?, stock = ?, cost_price = ?, sale_price = ?
      WHERE id = ?
    `);
    const result = stmt.run(size_id, color_id, stock, cost_price, sale_price || 0, id);
    if (result.changes === 0) return res.status(404).json({ ok: false, error: "No encontrado" });

    if (diferencia !== 0) {
      db.prepare(`
        INSERT INTO stock_movements (variant_id, type, quantity)
        VALUES (?, 'adjustment', ?)
      `).run(
        id,
        diferencia
      );
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};


exports.delete = (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare(`DELETE FROM variants WHERE id = ?`);
    const result = stmt.run(id);
    if (result.changes === 0) return res.status(404).json({ ok: false, error: "No encontrado" });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};
