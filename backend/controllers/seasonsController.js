const db = require("../database");

exports.getAll = (req, res) => {
  try {
    const seasons = db.prepare("SELECT * FROM seasons").all();
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

exports.create = (req, res) => {
  const { name } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO seasons (name)
      VALUES (?)
    `).run(name);

    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};


exports.update = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    db.prepare(`
      UPDATE seasons
      SET name = ?
      WHERE id = ?
    `).run(name, id);

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};


exports.delete = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare(`DELETE FROM seasons WHERE id = ?`).run(id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
