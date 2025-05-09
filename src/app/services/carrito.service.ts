// src/app/services/carrito.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http"; // Importar HttpClient
import { Producto } from "../models/producto";
import { InventarioService } from "./inventario.service"; // Aún útil para obtener datos del producto
import { Observable, catchError, of, tap } from 'rxjs'; // Importar Observable y operadores

interface CarritoItem {
    producto: Producto;
    cantidad: number;
}

@Injectable({
    providedIn: 'root'
})
export class CarritoService {
    private carrito: CarritoItem[] = []; // Mantenido en memoria del frontend
    private tiendaNombre: string = 'Retro FC';
    private http = inject(HttpClient); // Inyectar HttpClient
    private inventarioService = inject(InventarioService); // Inyectar InventarioService

    // Agregar producto al carrito (solo frontend)
    agregarProducto(producto: Producto) {
        // Verificar stock disponible ANTES de agregar al carrito visualmente
         const productoActual = this.inventarioService.obtenerProductosInstantaneo().find(p => p.id === producto.id);
          const stockDisponible = productoActual ? productoActual.stock : 0;

        const itemEnCarrito = this.carrito.find(i => i.producto.id === producto.id);
        const cantidadActualEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;


         if (stockDisponible > cantidadActualEnCarrito) {
            if (itemEnCarrito) {
                itemEnCarrito.cantidad++;
            } else {
                // Importante: Usar una copia del producto para no modificar el original del inventarioService
                this.carrito.push({ producto: { ...producto }, cantidad: 1 });
            }
        } else {
             alert('No hay suficiente stock disponible para agregar más de este producto.');
        }
    }

    // Quitar cantidad (solo frontend)
    quitarCantidadProducto(productoId: number) {
        const itemIndex = this.carrito.findIndex(i => i.producto.id === productoId);
        if (itemIndex > -1) {
            this.carrito[itemIndex].cantidad--;
            if (this.carrito[itemIndex].cantidad <= 0) {
                this.carrito.splice(itemIndex, 1); // Eliminar si la cantidad es 0
            }
        }
    }

    // Eliminar producto (solo frontend)
    eliminarProducto(productoId: number) {
        this.carrito = this.carrito.filter(i => i.producto.id !== productoId);
    }

    obtenerCarrito(): CarritoItem[] {
        return this.carrito;
    }

     // Realizar pedido (enviar al backend)
    realizarPedido(): Observable<any> {
        if (this.carrito.length === 0) {
        return of({ message: 'El carrito está vacío' }); // O manejar como error
        }

        const subtotal = this.calcularSubtotal();
        const iva = this.calcularIVA();
        const total = this.calcularTotal();

        const pedidoData = {
        // usuario_id: obtenerIdDeUsuarioLogueado(), // Necesitarías lógica de autenticación
        subtotal: subtotal,
        iva: parseFloat(iva.toFixed(2)), // Asegurar formato numérico
        total: parseFloat(total.toFixed(2)), // Asegurar formato numérico
        items: this.carrito.map(item => ({
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.producto.precio // Precio al momento de la compra
        }))
        };

        return this.http.post<any>('/api/pedidos', pedidoData).pipe(
        tap(respuesta => {
            console.log('Pedido realizado:', respuesta);
            this.vaciarCarrito(); // Vaciar carrito local si el pedido fue exitoso
             // Opcional: Forzar recarga de productos para actualizar stock visualmente
            // this.inventarioService.cargarProductosIniciales(); // Asumiendo que tienes este método
        }),
        catchError(error => {
            console.error('Error al realizar pedido:', error);
            alert(`Error al realizar pedido: ${error.error?.message || error.message}`);
            // Podrías no vaciar el carrito si falla
            return of(null); // O manejar el error de otra forma
        })
        );
    }

    vaciarCarrito() {
        this.carrito = [];
    }


    // Ya no genera XML, se debe interactuar con la API para crear el pedido
    // El backend podría devolver un ID de pedido o confirmación

    private calcularSubtotal(): number {
        return this.carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
    }
     calcularIVA() { // Hacer público si se usa en el componente
        const subtotal = this.calcularSubtotal();
        return subtotal * 0.16;
    }

     calcularTotal() { // Hacer público si se usa en el componente
        const subtotal = this.calcularSubtotal();
        const iva = this.calcularIVA();
        return subtotal + iva;
    }
}