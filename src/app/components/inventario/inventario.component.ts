import { Component, inject } from '@angular/core';
import { InventarioService } from '../../services/inventario.service';
import { Producto } from '../../models/producto';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent {
  inventarioService = inject(InventarioService);
  productos: Producto[] = [];
  productoEditar: Producto | null = null;
  nuevoProducto: Producto = new Producto(0, '', 0, '', 0); // agregue stock (el ultimo 0)

    constructor(
      private router: Router
    ) {}

  ngOnInit() {
    this.inventarioService.obtenerProductos().subscribe(productos => {
      this.productos = productos;
    });
  }

  agregarProducto() {
    if (this.nuevoProducto.stock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }
    this.inventarioService.agregarProducto(this.nuevoProducto);
    this.nuevoProducto = new Producto(0, '', 0, '', 0); // Reset con stock
  }

  editarProducto(producto: Producto) {
    this.productoEditar = { ...producto };
  }

  guardarEdicion() {
    if (this.productoEditar) {
      if (this.productoEditar.stock < 0) {
        alert('El stock no puede ser negativo');
        return;
      }
      this.inventarioService.actualizarProducto(this.productoEditar);
      this.productoEditar = null;
    }
  }

  eliminarProducto(id: number) {
    this.inventarioService.eliminarProducto(id);
  }


  irACatalogo(): void {
    this.router.navigate(['/productos']);
  }
}