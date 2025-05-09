import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent {
  carrito: any[] = [];
  recibo: string = '';

  constructor(private carritoService: CarritoService) {
    this.carrito = this.carritoService.obtenerCarrito();
  }

  aumentarCantidad(productoId: number) {
    const item = this.carrito.find(i => i.producto.id === productoId);
    if (item && item.producto.stock > 0) {
      this.carritoService.agregarProducto(item.producto);
    }
  }

  disminuirCantidad(productoId: number) {
    this.carritoService.quitarCantidadProducto(productoId);
    this.carrito = this.carritoService.obtenerCarrito(); // Actualizar el carrito
  }

  eliminarProducto(productoId: number) {
    this.carritoService.eliminarProducto(productoId);
    this.carrito = this.carritoService.obtenerCarrito(); // Actualizar el carrito
  }

  procesarCompra() {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío.'); // O manejar de otra forma
      return;
    }
    this.carritoService.realizarPedido().subscribe({
      next: (respuesta) => {
        if (respuesta && respuesta.pedidoId) {
          alert(`¡Pedido realizado con éxito! ID: ${respuesta.pedidoId}`);
          // this.carritoService.vaciarCarrito(); // Asegúrate que esto se llame si es necesario
          this.carrito = this.carritoService.obtenerCarrito();
        } else if (respuesta && respuesta.message) {
           alert(respuesta.message);
        } else if (!respuesta && this.carrito.length > 0) { // Si la respuesta es null debido a un error manejado en el servicio
          // La alerta de error ya se mostró en el servicio
        }
      },
      error: (err) => {
        console.error('Error inesperado al procesar compra en el componente:', err);
        alert('Ocurrió un error inesperado al procesar la compra.');
      }
    });
  }


  descargarRecibo() {
    const blob = new Blob([this.recibo], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'recibo.xml';
    link.click();
  }

  calcularSubtotal() {
    return this.carrito.reduce((subtotal, item) => subtotal + item.producto.precio * item.cantidad, 0);
  }

  calcularIVA() {
    const subtotal = this.calcularSubtotal();
    return subtotal * 0.16;
  }

  calcularTotal() {
    const subtotal = this.calcularSubtotal();
    const iva = this.calcularIVA();
    return subtotal + iva;
  }
}
