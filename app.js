const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const productoRoutes = require("./routes/productoRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/api", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "API RESTful de Gestión de Productos funcionando correctamente"
  });
});

app.use("/api/productos", productoRoutes);

app.use("/api", (_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Ruta de API no encontrada"
  });
});

app.use((error, _req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "La imagen supera el límite de 5 MB" });
  }
  return next(error);
});

module.exports = app;
