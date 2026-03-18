const db = require("../database");

// CREATE - Modificado para soportar reactivación
exports.create = (req, res) => {
    try {
        const { name, type } = req.body;
        const typeValue = type || 'clothing';

        // 1️⃣ Verificar si existe un talle INACTIVO con mismo nombre y tipo
        const existingInactive = db.prepare(`
            SELECT * FROM sizes 
            WHERE name = ? AND type = ? AND active = 0
        `).get(name, typeValue);

        if (existingInactive) {
            // 2️⃣ Si existe inactivo, lo REACTIVAMOS
            db.prepare(`
                UPDATE sizes 
                SET active = 1 
                WHERE id = ?
            `).run(existingInactive.id);

            return res.json({
                ok: true,
                id: existingInactive.id,
                reactivado: true,
                message: `Talle "${name}" reactivado`
            });
        }

        // 3️⃣ Si no existe inactivo, creamos uno NUEVO (activo)
        const result = db.prepare(`
            INSERT INTO sizes (name, type, active)  // 👈 AGREGAMOS active=1
            VALUES (?, ?, 1)
        `).run(name, typeValue);

        res.json({
            ok: true,
            id: result.lastInsertRowid,
            message: "Talle creado"
        });

    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                ok: false,
                error: `El talle "${name}" ya existe ACTIVO en ${type === 'clothing' ? 'Ropa' : type === 'footwear' ? 'Calzado' : 'Pantalón'}`
            });
        }
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

// READ ALL - Modificado para filtrar por activos/inactivos
exports.getAll = (req, res) => {
    try {
        const { active = 1, type } = req.query;  // 👈 Parámetro para filtrar

        let query = "SELECT * FROM sizes WHERE active = ?";
        const params = [active];

        if (type) {
            query += " AND type = ?";
            params.push(type);
        }

        query += " ORDER BY type, name";
        
        const sizes = db.prepare(query).all(...params);
        res.json(sizes);
        
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// READ ONE - Modificado para incluir active
exports.getOne = (req, res) => {
    try {
        const size = db.prepare(`
            SELECT * FROM sizes WHERE id = ?
        `).get(req.params.id);
        
        if (!size) {
            return res.status(404).json({ 
                ok: false, 
                error: "Talle no encontrado" 
            });
        }
        
        res.json(size);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// UPDATE - Modificado para mantener consistencia
exports.update = (req, res) => {
    try {
        const { name, type } = req.body;
        const { id } = req.params;

        // Verificar si ya existe otro talle ACTIVO con mismo nombre y tipo
        const existing = db.prepare(`
            SELECT * FROM sizes 
            WHERE name = ? AND type = ? AND active = 1 AND id != ?
        `).get(name, type, id);

        if (existing) {
            return res.status(400).json({
                ok: false,
                error: `Ya existe otro talle activo con ese nombre y tipo`
            });
        }

        const result = db.prepare(`
            UPDATE sizes 
            SET name = ?, type = ? 
            WHERE id = ?
        `).run(name, type, id);

        if (result.changes === 0) {
            return res.status(404).json({ 
                ok: false, 
                error: "Talle no encontrado" 
            });
        }

        res.json({ 
            ok: true,
            message: "Talle actualizado"
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// SOFT DELETE - NUEVO (reemplaza al delete anterior)
exports.softDelete = (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay VARIANTES usando este talle
        const variantsUsing = db.prepare(`
            SELECT COUNT(*) as count 
            FROM variants 
            WHERE size_id = ? AND active = 1
        `).get(id);

        let result;
        
        if (variantsUsing.count > 0) {
            // Tiene variantes activas → SOFT DELETE (solo desactivar)
            result = db.prepare(`
                UPDATE sizes 
                SET active = 0 
                WHERE id = ?
            `).run(id);
            
            res.json({ 
                ok: true, 
                message: "Talle desactivado (tiene variantes asociadas)",
                softDelete: true
            });
        } else {
            // No tiene variantes → PHYSICAL DELETE (eliminar físicamente)
            result = db.prepare(`
                DELETE FROM sizes 
                WHERE id = ?
            `).run(id);
            
            res.json({ 
                ok: true, 
                message: "Talle eliminado físicamente (sin variantes)",
                physicalDelete: true
            });
        }

        if (result.changes === 0) {
            return res.status(404).json({ 
                ok: false, 
                error: "Talle no encontrado" 
            });
        }

    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// REACTIVATE - NUEVO
exports.reactivate = (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el talle existe
        const size = db.prepare(`
            SELECT * FROM sizes WHERE id = ?
        `).get(id);

        if (!size) {
            return res.status(404).json({ 
                ok: false, 
                error: "Talle no encontrado" 
            });
        }

        // Verificar si ya existe otro talle ACTIVO con mismo nombre y tipo
        const existingActive = db.prepare(`
            SELECT * FROM sizes 
            WHERE name = ? AND type = ? AND active = 1 AND id != ?
        `).get(size.name, size.type, id);

        if (existingActive) {
            return res.status(400).json({
                ok: false,
                error: `Ya existe un talle activo con ese nombre y tipo`
            });
        }

        // Reactivar
        db.prepare(`
            UPDATE sizes 
            SET active = 1 
            WHERE id = ?
        `).run(id);

        res.json({ 
            ok: true,
            message: "Talle reactivado"
        });

    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};