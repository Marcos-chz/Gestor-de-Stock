const db = require("../database");

// CREATE - Crear nueva categoría (con soporte para reactivar inactivas)
exports.create = (req, res) => {
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      ok: false, 
      error: "El nombre es requerido" 
    });
  }

  try {
    // Verificar si existe una categoría INACTIVA con el mismo nombre
    const existingInactive = db
      .prepare("SELECT * FROM categories WHERE name = ? AND active = 0")
      .get(name);

    if (existingInactive) {
      // Reactivar la existente
      const result = db
        .prepare("UPDATE categories SET active = 1 WHERE id = ?")
        .run(existingInactive.id);

      res.json({ 
        ok: true, 
        id: existingInactive.id,
        reactivado: true,
        message: "Categoría reactivada"
      });
    } else {
      // Crear nueva categoría activa
      const result = db
        .prepare("INSERT INTO categories (name, active) VALUES (?, 1)")
        .run(name);

      res.json({
        ok: true,
        id: result.lastInsertRowid,
        message: "Categoría creada"
      });
    }
  } catch (error) {
    console.error(error);
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ 
        ok: false, 
        error: "Ya existe una categoría activa con ese nombre" 
      });
    } else {
      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
};

// GET ALL - Obtener categorías (con filtro por active)
exports.getAll = (req, res) => {
  try {
    const { active = 1 } = req.query; // Por defecto trae activas
    
    let categories;
    if (active === 'all') {
      // Traer TODAS (para admin)
      categories = db
        .prepare("SELECT * FROM categories ORDER BY active DESC, name")
        .all();
    } else {
      // Traer solo activas o inactivas según el parámetro
      categories = db
        .prepare("SELECT * FROM categories WHERE active = ? ORDER BY name")
        .all(active);
    }
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// GET ONE - Obtener una categoría por ID
exports.getOne = (req, res) => {
  const { id } = req.params;
  try {
    const category = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id);
      
    if (!category) {
      return res.status(404).json({ 
        ok: false, 
        error: "No existe" 
      });
    }
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// UPDATE - Actualizar nombre
exports.update = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      ok: false, 
      error: "El nombre es requerido" 
    });
  }

  try {
    // Verificar si existe otra categoría activa con el mismo nombre
    const existing = db
      .prepare("SELECT * FROM categories WHERE name = ? AND active = 1 AND id != ?")
      .get(name, id);

    if (existing) {
      return res.status(400).json({ 
        ok: false, 
        error: "Ya existe otra categoría activa con ese nombre" 
      });
    }

    const result = db
      .prepare("UPDATE categories SET name = ? WHERE id = ?")
      .run(name, id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "No existe" 
      });
    }

    res.json({ 
      ok: true,
      message: "Categoría actualizada"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// SOFT DELETE - Desactivar categoría (en lugar de eliminar)
exports.softDelete = (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si hay PRODUCTOS usando esta categoría
    const productsUsing = db
      .prepare("SELECT COUNT(*) as count FROM products WHERE category_id = ? AND active = 1")
      .get(id);

    let result;
    
    if (productsUsing.count > 0) {
      // Tiene productos activos - solo desactivar la categoría
      result = db
        .prepare("UPDATE categories SET active = 0 WHERE id = ?")
        .run(id);
      
      if (result.changes === 0) {
        return res.status(404).json({ 
          ok: false, 
          error: "No existe" 
        });
      }

      res.json({ 
        ok: true, 
        message: "Categoría desactivada (tiene productos asociados)",
        softDelete: true
      });
    } else {
      // No tiene productos - podemos eliminar físicamente
      result = db
        .prepare("DELETE FROM categories WHERE id = ?")
        .run(id);

      if (result.changes === 0) {
        return res.status(404).json({ 
          ok: false, 
          error: "No existe" 
        });
      }

      res.json({ 
        ok: true, 
        message: "Categoría eliminada físicamente (sin productos asociados)",
        physicalDelete: true
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// REACTIVATE - Reactivar categoría
exports.reactivate = (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si existe otra categoría activa con el mismo nombre
    const category = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id);

    if (!category) {
      return res.status(404).json({ 
        ok: false, 
        error: "No existe" 
      });
    }

    const existingActive = db
      .prepare("SELECT * FROM categories WHERE name = ? AND active = 1 AND id != ?")
      .get(category.name, id);

    if (existingActive) {
      return res.status(400).json({ 
        ok: false, 
        error: "Ya existe una categoría activa con ese nombre" 
      });
    }

    const result = db
      .prepare("UPDATE categories SET active = 1 WHERE id = ?")
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "No existe" 
      });
    }

    res.json({ 
      ok: true,
      message: "Categoría reactivada"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};