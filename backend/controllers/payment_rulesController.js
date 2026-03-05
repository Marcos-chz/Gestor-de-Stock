const db = require("../database");

// ==================== OBTENER TODAS LAS REGLAS ====================
exports.getAll = (req, res) => {
  try {
    const rules = db.prepare("SELECT * FROM payment_rules ORDER BY metodo").all();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== OBTENER REGLA POR MÉTODO ====================
exports.getByMetodo = (req, res) => {
  const { metodo } = req.params;
  
  try {
    const rule = db.prepare("SELECT * FROM payment_rules WHERE metodo = ?").get(metodo);
    
    if (!rule) {
      return res.status(404).json({ 
        ok: false, 
        error: "Método de pago no encontrado" 
      });
    }
    
    res.json(rule);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== ACTUALIZAR REGLA (por método) ====================
exports.update = (req, res) => {
  const { metodo } = req.params;
  const { descuento, recargo, activo } = req.body;

  // Validaciones básicas
  if (descuento === undefined && recargo === undefined && activo === undefined) {
    return res.status(400).json({ 
      ok: false, 
      error: "Debe enviar al menos un valor a actualizar" 
    });
  }

  // Validar porcentajes
  if (descuento !== undefined && (isNaN(descuento) || descuento < 0 || descuento > 100)) {
    return res.status(400).json({ 
      ok: false, 
      error: "El descuento debe ser un número entre 0 y 100" 
    });
  }

  if (recargo !== undefined && (isNaN(recargo) || recargo < 0 || recargo > 100)) {
    return res.status(400).json({ 
      ok: false, 
      error: "El recargo debe ser un número entre 0 y 100" 
    });
  }

  try {
    // Verificar si existe el método
    const exists = db.prepare("SELECT id FROM payment_rules WHERE metodo = ?").get(metodo);
    
    if (!exists) {
      return res.status(404).json({ 
        ok: false, 
        error: "Método de pago no encontrado" 
      });
    }

    // Construir query dinámica
    let query = "UPDATE payment_rules SET updated_at = CURRENT_TIMESTAMP";
    const params = [];
    
    if (descuento !== undefined) {
      query += ", descuento = ?";
      params.push(descuento);
    }
    
    if (recargo !== undefined) {
      query += ", recargo = ?";
      params.push(recargo);
    }
    
    if (activo !== undefined) {
      query += ", activo = ?";
      params.push(activo ? 1 : 0);
    }
    
    query += " WHERE metodo = ?";
    params.push(metodo);
    
    db.prepare(query).run(...params);
    
    // Obtener el método actualizado
    const updated = db.prepare("SELECT * FROM payment_rules WHERE metodo = ?").get(metodo);
    
    res.json({ ok: true, data: updated });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== ACTUALIZAR MÚLTIPLES REGLAS (BULK) ====================
exports.updateBulk = (req, res) => {
  const rules = req.body; // Array de reglas
  
  if (!Array.isArray(rules)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Debe enviar un array de reglas" 
    });
  }

  const transaction = db.transaction(() => {
    for (const rule of rules) {
      const { metodo, descuento, recargo, activo } = rule;
      
      // Verificar si existe
      const exists = db.prepare("SELECT id FROM payment_rules WHERE metodo = ?").get(metodo);
      
      if (exists) {
        // Actualizar
        db.prepare(`
          UPDATE payment_rules 
          SET descuento = ?, recargo = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
          WHERE metodo = ?
        `).run(descuento || 0, recargo || 0, activo ? 1 : 0, metodo);
      } else {
        // Insertar 
        db.prepare(`
          INSERT INTO payment_rules (metodo, descuento, recargo, activo)
          VALUES (?, ?, ?, ?)
        `).run(metodo, descuento || 0, recargo || 0, activo ? 1 : 0);
      }
    }
  });

  try {
    transaction();
    
    // Devolver todas las reglas actualizadas
    const updatedRules = db.prepare("SELECT * FROM payment_rules ORDER BY metodo").all();
    res.json({ ok: true, data: updatedRules });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== RESETEAR A VALORES PREDETERMINADOS ====================
exports.reset = (req, res) => {
  try {
    db.prepare(`
      UPDATE payment_rules 
      SET descuento = 0, recargo = 0, activo = 1, updated_at = CURRENT_TIMESTAMP
    `).run();
    
    const rules = db.prepare("SELECT * FROM payment_rules ORDER BY metodo").all();
    res.json({ ok: true, data: rules });
    
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ==================== APLICAR REGLAS A UN MONTO ====================
exports.apply = (req, res) => {
  const { amount, payment_method } = req.body;

  if (!amount || !payment_method) {
    return res.status(400).json({ 
      ok: false, 
      error: "Debe enviar amount y payment_method" 
    });
  }

  try {
    // Mapeo de métodos del frontend a la BD
    const metodoMap = {
      'cash': 'efectivo',
      'card': 'tarjeta',
      'wallet': 'billetera'
    };
    
    const metodoBD = metodoMap[payment_method] || payment_method;
    
    const rule = db.prepare("SELECT * FROM payment_rules WHERE metodo = ? AND activo = 1").get(metodoBD);
    
    let finalAmount = amount;
    let discount = 0;
    let surcharge = 0;

    if (rule) {
      if (rule.descuento > 0) {
        discount = amount * (rule.descuento / 100);
        finalAmount = amount - discount;
      } else if (rule.recargo > 0) {
        surcharge = amount * (rule.recargo / 100);
        finalAmount = amount + surcharge;
      }
    }

    res.json({
      original_amount: amount,
      payment_method,
      discount,
      surcharge,
      final_amount: finalAmount,
      rule_applied: rule || null
    });
    
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};