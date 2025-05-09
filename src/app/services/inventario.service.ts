// src/app/services/inventario.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../models/producto';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private apiUrl = '/api/productos'; 

  // Usaremos un BehaviorSubject para mantener el estado y notificar cambios
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  productos$ = this.productosSubject.asObservable();

  constructor() {
    this.cargarProductosIniciales(); // Cargar al inicio
  }

  private cargarProductosIniciales() {
    this.http.get<Producto[]>(this.apiUrl).pipe(
      tap(productos => console.log('Productos recibidos de la API en el servicio:', productos)),
      catchError(this.handleError<Producto[]>('cargarProductos', []))
    ).subscribe(productos => this.productosSubject.next(productos));
  }

  // Método público para obtener el observable
  obtenerProductos(): Observable<Producto[]> {
    // Refrescar datos cada vez que se suscriba (o decidir otra estrategia)
    this.http.get<Producto[]>(this.apiUrl).pipe(
        catchError(this.handleError<Producto[]>('obtenerProductos', []))
    ).subscribe(productos => this.productosSubject.next(productos));
    return this.productos$;
  }

   // Obtener el valor actual directamente (puede estar desactualizado si no se ha refrescado)
    obtenerProductosInstantaneo(): Producto[] {
        return this.productosSubject.value;
    }


  agregarProducto(producto: Omit<Producto, 'id'>): Observable<Producto> { // Omitir 'id' si es autogenerado
    return this.http.post<Producto>(this.apiUrl, producto).pipe(
      tap((nuevoProducto) => {
        const productosActuales = this.productosSubject.value;
        this.productosSubject.next([...productosActuales, nuevoProducto]);
      }),
      catchError(this.handleError<Producto>('agregarProducto'))
    );
  }

  actualizarProducto(producto: Producto): Observable<any> {
    return this.http.put(`<span class="math-inline">\{this\.apiUrl\}/</span>{producto.id}`, producto).pipe(
      tap(() => {
        const productosActuales = this.productosSubject.value.map(p =>
          p.id === producto.id ? producto : p
        );
        this.productosSubject.next(productosActuales);
      }),
      catchError(this.handleError<any>('actualizarProducto'))
    );
  }

  eliminarProducto(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`<span class="math-inline">\{this\.apiUrl\}/</span>{id}`).pipe(
      tap(() => {
        const productosActuales = this.productosSubject.value.filter(p => p.id !== id);
        this.productosSubject.next(productosActuales);
      }),
      catchError(this.handleError<Producto>('eliminarProducto'))
    );
  }

   // Este método ahora solo necesitaría llamar a actualizarProducto
   // La lógica de negocio de si se puede o no decrementar stock
   // debería estar en el backend o en el servicio del carrito
   // al momento de confirmar la compra.
    actualizarStock(id: number, cambio: number): Observable<any> {
        const producto = this.productosSubject.value.find(p => p.id === id);
        if (!producto) {
            return of(null); // O manejar el error como prefieras
        }
        const productoActualizado = { ...producto, stock: producto.stock + cambio };
         // Validar stock >= 0 si es necesario aquí o en el backend
         if (productoActualizado.stock < 0) {
            console.error("Stock no puede ser negativo");
            return of(null); // O lanzar un error
        }
        return this.actualizarProducto(productoActualizado);
    }


  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Devolver un resultado seguro para que la app siga funcionando
      return of(result as T);
    };
  }

}