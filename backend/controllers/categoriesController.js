const db = require("../database");

exports.create = (req, res) => {
  const { name } = req.body;
  try {
    const result = db
      .prepare("INSERT INTO categories (name) VALUES (?)")
      .run(name);

    res.json({
      ok: true,
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};


exports.getAll = (req, res) => {
  try {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};

exports.getOne = (req, res) => {
  const { id } = req.params;
  try {
    const category = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id);
    if (!category) return res.status(404).json({ ok: false, error: "No existe" });
    res.json(category);
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
  const { name } = req.body;
  try {
    const result = db
      .prepare("UPDATE categories SET name = ? WHERE id = ?")
      .run(name, id);

    if (result.changes === 0)
      return res.status(404).json({ ok: false, error: "No existe" });

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
    const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);

    if (result.changes === 0)
      return res.status(404).json({ ok: false, error: "No existe" });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
  }
};
