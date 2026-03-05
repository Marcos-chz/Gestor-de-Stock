const express = require("express");
const cors = require("cors");
const backupController = require('./controllers/backupController'); 

// rutas
const productsRoutes = require("./routes/products");
const sizesRoutes = require("./routes/sizes");
const colorsRoutes = require("./routes/colors");
const categoriesRoutes = require("./routes/categories");
const variantsRoutes = require("./routes/variants");
const seasonsRouter = require("./routes/seasons");
const salesRouter = require("./routes/sales");
const payment_rulesRouter = require("./routes/payment_rules");
const sale_itemsRouter = require("./routes/sale_items");
const stock_movementsRouter = require("./routes/stock_movements");
const backupRoutes = require("./routes/backup"); 

const app = express();
app.use(cors());
app.use(express.json());

// Rutas existentes
app.use("/products", productsRoutes);
app.use("/sizes", sizesRoutes);
app.use("/colors", colorsRoutes);
app.use("/categories", categoriesRoutes);
app.use("/variants", variantsRoutes);
app.use("/seasons", seasonsRouter);
app.use("/sales", salesRouter);
app.use("/sale_items", sale_itemsRouter);
app.use("/payment_rules", payment_rulesRouter);
app.use("/stock_movements", stock_movementsRouter);

app.use("/api/backups", backupRoutes);

backupController.iniciarBackupAutomatico();

app.listen(3000, () => {
  console.log("Backend corriendo en http://localhost:3000");
});