export class Producto{
    constructor(
        public id:number,
        public nombre: string,
        public precio: number,
        public imagen:string,
        public stock: number //Añadi el stock al modelo del inventario
    ){}
}