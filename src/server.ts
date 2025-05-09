// src/server.ts
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db_config';
import bodyParser from 'body-parser';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
// Esta es la ruta a la carpeta 'browser' DENTRO de tu carpeta 'dist/mi-proyecto/server'
// Cuando se compila, server.mjs está en dist/mi-proyecto/server/,
// y los archivos del cliente están en dist/mi-proyecto/browser/
const browserDistFolder = resolve(serverDistFolder, '../browser');

// Si tienes archivos estáticos adicionales en una carpeta 'public' que se copia a 'dist/mi-proyecto/public'
const publicFolder = resolve(serverDistFolder, '../public');


const app = express();
const angularApp = new AngularNodeAppEngine();

// Middleware para parsear JSON en las peticiones
app.use(bodyParser.json());

/**
 * API endpoints - Estas deben ir ANTES del middleware de Angular
 */

// --- API para Productos (Inventario) ---
app.get('/api/productos', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    res.json(rows);
    // return; // Opcional aquí si es el final del bloque try
  } catch (error) {
    console.error('Error fetching productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
    // return; // Opcional aquí si es el final del bloque catch
  }
});

app.post('/api/productos', async (req: Request, res: Response) => {
    const { nombre, precio, imagen, stock } = req.body;
    if (stock < 0) { // Validación básica
        res.status(400).json({ message: 'El stock no puede ser negativo.' });
        return;
    }
    try {
        const [result] = await pool.execute(
            'INSERT INTO productos (nombre, precio, imagen, stock) VALUES (?, ?, ?, ?)',
            [nombre, precio, imagen, stock]
        );
        res.status(201).json({ message: 'Producto agregado', id: (result as any).insertId });
        // return; // Opcional
    } catch (error) {
        console.error('Error adding producto:', error);
        res.status(500).json({ message: 'Error al agregar producto' });
        // return; // Opcional
    }
});

app.put('/api/productos/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, precio, imagen, stock } = req.body;
     if (stock < 0) { // Validación básica
        res.status(400).json({ message: 'El stock no puede ser negativo.' });
        return;
    }
    try {
        const [result] = await pool.execute(
            'UPDATE productos SET nombre = ?, precio = ?, imagen = ?, stock = ? WHERE id = ?',
            [nombre, precio, imagen, stock, id]
        );
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado para actualizar' }); // Cambié el mensaje para claridad
            return; // Termina aquí si no se encontró
        }
        res.json({ message: 'Producto actualizado' });
        return; // Termina aquí después de la respuesta exitosa
    } catch (error) {
        console.error('Error updating producto:', error);
        res.status(500).json({ message: 'Error al actualizar producto' });
        return; // Termina aquí después de la respuesta de error
    }
});

app.delete('/api/productos/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado para eliminar' }); // Cambié el mensaje
            return; // Termina aquí si no se encontró
        }
        res.json({ message: 'Producto eliminado' });
        return; // Termina aquí después de la respuesta exitosa
    } catch (error) {
        console.error('Error deleting producto:', error);
        res.status(500).json({ message: 'Error al eliminar producto' });
        return; // Termina aquí después de la respuesta de error
    }
});

// --- API para Pedidos ---
app.post('/api/pedidos', async (req: Request, res: Response) => {
  const { items, subtotal, iva, total /*, usuario_id */ } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [pedidoResult] = await connection.execute(
      'INSERT INTO pedidos (subtotal, iva, total /*, usuario_id */) VALUES (?, ?, ? /*, ? */)',
      [subtotal, iva, total /*, usuario_id */]
    );
    const pedidoId = (pedidoResult as any).insertId;

    for (const item of items) {
      const [productoRows]: any[] = await connection.execute('SELECT stock FROM productos WHERE id = ? FOR UPDATE', [item.producto_id]);
      if (!productoRows || productoRows.length === 0 || productoRows[0].stock < item.cantidad) {
        await connection.rollback();
        res.status(400).json({ message: `Stock insuficiente para el producto ID: ${item.producto_id}` });
        if (connection) connection.release(); // Asegúrate de liberar la conexión
        return; // Termina la ejecución
      }

      await connection.execute(
        'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario]
      );
      await connection.execute(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Pedido creado', pedidoId });
    // return; // Opcional
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating pedido:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el pedido';
    res.status(500).json({ message: 'Error al crear pedido', error: errorMessage });
    // return; // Opcional
  } finally {
    if (connection) connection.release();
  }
});

/**
 * Serve static files from /browser
 * ESTO DEBE IR ANTES DEL MANEJADOR DE RUTAS DE ANGULAR
 */
// Servir archivos de la carpeta 'public' (si existe y la configuraste en angular.json para que se copie a dist)
app.use(express.static(publicFolder)); // Ejemplo: dist/mi-proyecto/public

// Servir los archivos del cliente Angular (los bundles JS, CSS, etc.)
// La ruta es relativa a donde se ejecuta server.mjs (dist/mi-proyecto/server/)
app.use(express.static(browserDistFolder, {
  maxAge: '1y', // Opcional: caché para los assets
  index: false, // Importante: no queremos que sirva index.html desde aquí directamente
}));


/**
 * Handle all other requests by rendering the Angular application.
 * ESTE DEBE SER EL ÚLTIMO MANEJADOR DE RUTAS NO API.
 */
app.use('/**', (req, res, next) => { // Cambiado de app.get() a app.use() para mayor generalidad
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);