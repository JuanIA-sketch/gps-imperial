/**
 * Servidor estático para desarrollo.
 *
 * Existe por dos razones: `file://` no sirve (el navegador bloquea los módulos
 * ES por CORS) y un puerto fijo choca con lo que ya tengas corriendo. Pide el
 * puerto 0, así que el sistema operativo entrega uno libre en cada corrida y
 * el script imprime la URL exacta que quedó arriba.
 *
 * Sin dependencias: el proyecto no tiene ni una sola dependencia de runtime y
 * esto no la va a agregar.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const servidor = http.createServer(async (peticion, respuesta) => {
  const { pathname } = new URL(peticion.url, 'http://localhost');
  const relativo = pathname === '/' ? '/index.html' : pathname;
  const archivo = path.resolve(RAIZ, `.${decodeURIComponent(relativo)}`);

  // Nadie sale de la carpeta del proyecto por más ../ que ponga en la URL.
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + path.sep)) {
    respuesta.writeHead(403).end('fuera del proyecto');
    return;
  }

  try {
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[path.extname(archivo)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404).end(`no encontrado: ${relativo}`);
  }
});

// Puerto 0 = "dame cualquiera que esté libre".
servidor.listen(0, '127.0.0.1', () => {
  const { port } = servidor.address();
  console.log(`\n  GPS Imperial corriendo en:  http://localhost:${port}\n`);
  console.log('  Ctrl+C para detenerlo.\n');
});
