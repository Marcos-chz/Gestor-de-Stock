const db = require("../database");
// CREATE
exports.create = (req, res) => {
    try {
        const { name } = req.body;

        const result = db.prepare(`
            INSERT INTO sizes (name)
            VALUES (?)
        `).run(name);

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

// READ ALL
exports.getAll = (req, res) => {
    try {
        const sizes = db.prepare("SELECT * FROM sizes").all();
        res.json(sizes);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// READ ONE
exports.getOne = (req, res) => {
    try {
        const size = db.prepare("SELECT * FROM sizes WHERE id = ?").get(req.params.id);
        res.json(size);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// UPDATE
exports.update = (req, res) => {
    try {
        const { name } = req.body;
        db.prepare("UPDATE sizes SET name = ? WHERE id = ?").run(name, req.params.id);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// DELETE
exports.delete = (req, res) => {
    try {
        db.prepare("DELETE FROM sizes WHERE id = ?").run(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};
