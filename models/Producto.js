const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [120, "El nombre no puede superar 120 caracteres"]
    },
    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      maxlength: [1000, "La descripción no puede superar 1000 caracteres"]
    },
    precio: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0, "El precio debe ser mayor o igual a 0"]
    },
    categoria: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      trim: true,
      maxlength: [60, "La categoría no puede superar 60 caracteres"]
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock debe ser mayor o igual a 0"],
      validate: {
        validator: Number.isInteger,
        message: "El stock debe ser un número entero"
      }
    },
    estado: {
      type: String,
      enum: ["Disponible", "Agotado", "Descontinuado"],
      default: "Disponible"
    },
    imagenUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Producto", productoSchema);
