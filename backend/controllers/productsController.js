const db = require("../database");


exports.createWithVariant = (req, res) => {
  const { 
    name, category_id, season_id,
    barcode, size_id, color_id, stock, cost_price, sale_price 
  } = req.body;

  const transaction = db.transaction(() => {

    const existe = db.prepare("SELECT id FROM variants WHERE barcode = ?").get(barcode);
    if (existe) {
      throw new Error("Ese código de barras ya existe");
    }

    const productResult = db.prepare(`
      INSERT INTO products (name, category_id, season_id, active)
      VALUES (?, ?, ?, 1)
    `).run(name, category_id, season_id);

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

    // REGISTRAR MOVIMIENTO DE STOCK INICIAL 
    db.prepare(`
      INSERT INTO stock_movements (variant_id, type, quantity, note)
      VALUES (?, 'initial', ?, ?)
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

// CREATE
exports.create = (req, res) => {
    const {name, category_id, season_id} = req.body
    try {

        const result = db.prepare(`
            INSERT INTO products (name, category_id, season_id, active)
            VALUES (?, ?, ?, ?)
        `).run(name, category_id, season_id, 1)


        res.json({
            ok: true,
            id: result.lastInsertRowid
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
}

// READ ALL
exports.getAll = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        s.id AS season_id,
        s.name AS season,
        c.id AS category_id,
        c.name AS category,
        v.id AS variant_id,
        v.barcode,
        v.stock,
        v.cost_price,
        v.sale_price,
        sz.id AS size_id,
        sz.name AS size_name,
        co.id AS color_id,
        co.name AS color_name
      FROM variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN seasons s ON p.season_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sizes sz ON v.size_id = sz.id
      LEFT JOIN colors co ON v.color_id = co.id
      WHERE p.active = 1
    `).all();

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
        ok: false,
        error: error.message
    });
  }
};



// READ ONE
exports.getOne = (req, res) => {
  try {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
        ok: false,
        error: error.message
    });
  }
};

// UPDATE
exports.update = (req, res) => {
  try {
    const { name, category_id, season_id } = req.body;
    
    db.prepare(`
      UPDATE products
      SET name = ?, category_id = ?, season_id = ?
      WHERE id = ?
    `).run(name, category_id, season_id, req.params.id);

    res.json({ ok: true });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// DELETE
exports.delete = (req, res) => {
  try {
    db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
        ok: false,
        error: error.message
    });
  }
};

