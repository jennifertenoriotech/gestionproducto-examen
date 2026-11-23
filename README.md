# Gestión de Productos — catálogo y CRUD

Aplicación web con dos páginas en HTML, CSS y JavaScript puro. El catálogo muestra los productos guardados en MongoDB; el panel de administración permite crear, consultar, editar y eliminar productos, además de subir o quitar su imagen.

## Requisitos

- Node.js y npm
- Una base de datos MongoDB local o un clúster de MongoDB Atlas

## Instalación y ejecución

```bash
npm install
npm start
```

Para desarrollo, usa `npm run dev`. El servidor espera a que MongoDB se conecte antes de aceptar peticiones.

Crea un archivo `.env` en la raíz con tus propios valores:

```env
PORT=3000
MONGO_URI=mongodb+srv://USUARIO:CLAVE@CLUSTER.mongodb.net/gestionprodcutos?retryWrites=true&w=majority
```

- Catálogo: `http://localhost:3000/`
- Administración: `http://localhost:3000/admin.html`
- Estado de la API: `http://localhost:3000/api`

## Estructura

- `models/Producto.js`: esquema de producto.
- `controllers/productoController.js`: operaciones y validación de imágenes.
- `routes/productoRoutes.js`: rutas de la API.
- `config/database.js`: conexión a MongoDB.
- `public/index.html` y `public/js/catalogo.js`: catálogo público, búsqueda, categorías y detalle.
- `public/admin.html` y `public/js/admin.js`: formulario e inventario con CRUD.
- `public/css/styles.css`: diseño adaptable.
- `public/assets/hero-catalogo.png`: imagen de portada.
- `public/uploads/`: imágenes subidas por el administrador; se crea automáticamente.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/productos` | Lista todos los productos |
| GET | `/api/productos/:id` | Obtiene un producto |
| POST | `/api/productos` | Crea un producto (JSON) |
| PUT | `/api/productos/:id` | Actualiza un producto (JSON) |
| DELETE | `/api/productos/:id` | Elimina un producto y su imagen local |
| POST | `/api/productos/:id/imagen` | Sube o reemplaza la imagen del producto |
| DELETE | `/api/productos/:id/imagen` | Quita la imagen del producto |

Ejemplo para `POST` y `PUT`:

```json
{
  "nombre": "Audífonos inalámbricos",
  "descripcion": "Sonido claro y conexión Bluetooth.",
  "precio": 49990,
  "categoria": "Tecnología",
  "stock": 15,
  "estado": "Disponible"
}
```

La imagen se envía como cuerpo binario a `POST /api/productos/:id/imagen` con `Content-Type: image/jpeg`, `image/png` o `image/webp`. El tamaño máximo es 5 MB. La API guarda el archivo en `public/uploads/` y solo almacena su ruta en MongoDB. El formulario de administración realiza este paso automáticamente después de guardar el producto.

## Alcance

El proyecto implementa un catálogo de productos y un CRUD. No incluye pagos ni pedidos. El panel y las rutas de escritura aún no tienen autenticación: antes de publicar el servicio como tienda abierta en internet hay que protegerlos. Las imágenes se guardan en el disco del servidor; un alojamiento que borre archivos al reiniciarse necesitará almacenamiento persistente para imágenes.

## Trabajo realizado por

### JENNIFER PATRICIA TENORIO GASPAR
