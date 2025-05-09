// src/app/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import { Producto } from '../models/producto';
import { Observable } from 'rxjs';
import { InventarioService } from './inventario.service'; // Sigue usando InventarioService

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private inventarioService = inject(InventarioService);

  // Obtiene el Observable del inventarioService, que ahora se carga desde la API
  obtenerProducto(): Observable<Producto[]> {
    return this.inventarioService.productos$;
  }

   // Podrías añadir un método para obtener un producto específico por ID desde la API
  // obtenerProductoPorId(id: number): Observable<Producto> {
  //   return this.http.get<Producto>(`/api/productos/${id}`);
  // }
}