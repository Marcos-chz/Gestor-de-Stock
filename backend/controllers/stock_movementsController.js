const db = require("../database");
exports.getRecent = (req, res) =>{
    const { limite = 10 } = req.query
    try {
        const movements = db.prepare(`
            SELECT 
                sm.*,
                p.name as product_name,
                sz.name as size_name,
                c.name as color_name,
                (
                    SELECT SUM(quantity) 
                    FROM stock_movements sm2 
                    WHERE sm2.variant_id = sm.variant_id 
                    AND sm2.created_at <= sm.created_at
                ) as stock_actual,
                COALESCE((
                    SELECT SUM(quantity) 
                    FROM stock_movements sm2 
                    WHERE sm2.variant_id = sm.variant_id 
                    AND sm2.created_at < sm.created_at
                ), 0) as stock_anterior
            FROM stock_movements sm
            JOIN variants v ON sm.variant_id = v.id
            JOIN products p ON v.product_id = p.id
            LEFT JOIN sizes sz ON v.size_id = sz.id
            LEFT JOIN colors c ON v.color_id = c.id
            ORDER BY sm.created_at DESC
            LIMIT ?
        `).all(limite);

        res.json(movements)
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
}