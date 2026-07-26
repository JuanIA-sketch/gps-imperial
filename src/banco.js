/**
 * Banco de proyectos: vitrina estática, curada a mano.
 *
 * No es un portafolio ni parte del diagnóstico — son ejemplos reales para
 * calibrar qué significa "terminado". El envío automático de proyectos está
 * fuera del alcance de esta versión (no hay backend), así que esta lista se
 * edita a mano en este archivo.
 *
 * Cada entrada lleva `link` o `estado`, nunca los dos ni ninguno: una
 * herramienta sin URL pública se pinta con su estado en vez de un link muerto.
 */

export const BANCO = Object.freeze([
  Object.freeze({
    nombre: 'El Arquitecto',
    descripcion:
      'Diagnóstico pre-mortem de proyectos sobre 10 arquetipos, antes de construir.',
    link: 'https://el-arquitecto.vercel.app',
    estado: null,
  }),
  Object.freeze({
    nombre: 'Las Llantas',
    descripcion:
      'Un solo comando que empaqueta build + deploy + verificación + rollback.',
    link: 'https://github.com/JuanIA-sketch/las-llantas',
    estado: null,
  }),
  Object.freeze({
    nombre: 'El Filtro',
    descripcion:
      'Audita dependencias vulnerables o abandonadas en npm y pip, sin jerga técnica.',
    link: 'https://github.com/JuanIA-sketch/el-filtro',
    estado: null,
  }),
  Object.freeze({
    nombre: 'El Doctor',
    descripcion: 'Puntúa la salud de un proyecto sobre 100 puntos con 14 chequeos.',
    link: 'https://github.com/JuanIA-sketch/el-doctor',
    estado: null,
  }),
]);
