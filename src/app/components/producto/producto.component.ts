import { Component, OnDestroy, OnInit } from '@angular/core';
import { Producto } from '../../models/producto'; 
import { ProductoService } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InventarioService } from '../../services/inventario.service';
import { InventarioComponent } from '../inventario/inventario.component';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.css'] // Cambiado a styleUrls
})
export class ProductoComponent implements OnInit, OnDestroy {

  productos: Producto[] = [];
  mensajeExito: boolean = false;
  private subscription!: Subscription;


  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.productoService.obtenerProducto().subscribe({
      next: (productos) => {
        this.productos = productos.filter(p => p.stock > 0); // <- Filtrar
      },
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }


  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  agregarAlCarrito(producto: Producto): void {
    if (producto.stock > 0) {
        this.carritoService.agregarProducto(producto);

        this.mensajeExito = true;

        setTimeout(() => {
            this.mensajeExito = false;
        }, 4000);
    } else {
        alert('No hay suficiente stock para este producto.');
    }
  }

  irAlCarrito(): void {
    this.router.navigate(['/carrito']);
  }

  irAInventario(): void {
    this.router.navigate(['/inventario']);
  }
}