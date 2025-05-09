
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/productos",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/productos"
  },
  {
    "renderMode": 2,
    "route": "/carrito"
  },
  {
    "renderMode": 2,
    "route": "/inventario"
  },
  {
    "renderMode": 2,
    "redirectTo": "/productos",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 38926, hash: 'ea51f93122934aa14a71146d629979df3c25764efbdedff18ca427341329f179', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 20823, hash: 'b06139d9eaecbf2e9fdcd030e56e109910a25f622f43f7133071cd2c5dc6c9c4', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'carrito/index.html': {size: 41891, hash: 'e25c144dfd326d61d22439ca721fc0b03a9a560b0d67ede2323aa3736e62737c', text: () => import('./assets-chunks/carrito_index_html.mjs').then(m => m.default)},
    'productos/index.html': {size: 42589, hash: '8733391b1a356e0cc53871460ed52e620d611b5a1fc39b5e5a4cf7dc9ed07399', text: () => import('./assets-chunks/productos_index_html.mjs').then(m => m.default)},
    'inventario/index.html': {size: 41939, hash: 'b85f2b0dff3723c88fba02b092ee76a4da7a92df73d6a4d19bdc40b45f46ae08', text: () => import('./assets-chunks/inventario_index_html.mjs').then(m => m.default)},
    'styles-WXJOY2XL.css': {size: 18492, hash: 'cY+9lED3WqQ', text: () => import('./assets-chunks/styles-WXJOY2XL_css.mjs').then(m => m.default)}
  },
};
