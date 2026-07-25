import { describe, it, expect } from 'vitest';
import {
  CATEGORIAS,
  IDS_CATEGORIAS,
  CAMPOS_CATEGORIA,
  obtenerCategoria,
} from '../src/categorias.js';

// El copy de abajo está transcrito del prototipo validado en vivo
// (gps-imperial-mvp.html). Es intencionalmente una segunda copia: si alguien
// "mejora" una frase en src/categorias.js, este fixture lo caza.
//
// Tres textos se apartan del prototipo por decisión explícita de Charly, y van
// marcados donde toca: el `resultado` de B (prometía consolidar varias fuentes
// cuando el MVP las excluye) y el paso 1 de C y de F (ahora condicionales,
// para no mandar a la casilla de salida a quien ya tiene cliente).
const COPY_DEL_PROTOTIPO = {
  A: {
    tag: 'Automatización interna',
    title: 'Automatiza algo que ya haces a mano',
    usuario: 'Tú mismo, o alguien con tu mismo rol operativo',
    problema:
      'Hay una tarea que repites cada semana con las mismas reglas siempre — no necesitas criterio distinto cada vez, solo ejecutar los mismos pasos rápido y sin error',
    resultado:
      'Dejas de hacerlo a mano: el tiempo que hoy le dedicas cada semana se recorta a minutos de revisión',
    mvp: 'Un script o CLI que hace esa tarea de punta a punta — entra el insumo, sale el resultado, sin que tú intervengas en medio',
    fuera:
      'Interfaz gráfica, configuración para casos distintos al tuyo, manejo de excepciones raras que casi nunca pasan',
    validacion:
      'Reemplaza la tarea manual por el script durante una semana completa, antes de mostrárselo a nadie',
    pasos: [
      'Escribe en una frase exacta qué entra y qué sale de la tarea hoy, a mano',
      'Automatiza solo esa tarea — nada más, aunque se te ocurran mejoras',
      'Corre el script en paralelo a tu proceso manual una semana, comparando resultados',
      'Si coincide siempre, retira el proceso manual',
    ],
  },
  B: {
    tag: 'Agente de datos',
    title: 'Organiza información que hoy está dispersa',
    usuario:
      'Alguien que hoy pierde tiempo buscando o cruzando datos manualmente, empezando por ti mismo',
    problema:
      'La información que necesitas ya existe, pero está repartida en varios lugares y nadie la consulta sin esfuerzo',
    // Reescrito: el original prometía una "fuente única" que el MVP excluye.
    resultado:
      'Le preguntas en lenguaje simple a la fuente que hoy más te cuesta consultar, y te contesta al momento — en vez de abrirla y buscar a mano',
    mvp: 'Un agente que lee una sola fuente de datos (no varias) y responde preguntas puntuales sobre ella',
    fuera:
      'Conectar múltiples fuentes a la vez, editar los datos desde el agente, permisos distintos por usuario',
    validacion:
      'Que alguien que no seas tú le haga 10 preguntas reales y anota dónde falla',
    pasos: [
      'Elige UNA fuente de datos concreta, no todas las que se te ocurran',
      'Haz una lista de las 10 preguntas que la gente hace más seguido sobre esos datos',
      'Construye solo para responder esas 10, nada más',
      'Prueba con alguien ajeno antes de agregar una segunda fuente',
    ],
  },
  C: {
    tag: 'Captación de leads',
    title: 'Ayuda a conseguir o calificar clientes',
    usuario: 'Un negocio que necesita más clientes o mejores prospectos',
    problema:
      'Encontrar o filtrar prospectos hoy se hace a mano, revisando uno por uno',
    resultado:
      'Un flujo que entrega una lista de prospectos ya filtrados, sin que alguien pase horas buscando',
    mvp: 'Una automatización que busca o filtra prospectos según reglas fijas que tú defines — sin IA generativa todavía',
    fuera:
      'CRM completo, outreach automático con IA, pagos o integraciones complejas',
    validacion:
      'Consigue que un negocio real lo use con una lista real y te diga si los prospectos sirven',
    pasos: [
      // Condicional: quien ya tiene el negocio no empieza de cero.
      'Si ya tienes un negocio real esperando esto, siéntate con él a definir las 3 a 5 reglas que usa hoy para decidir si un prospecto sirve. Si no, consíguelo antes de programar: sin un negocio concreto no sabes qué filtrar',
      'Automatiza solo el filtro, no el contacto',
      'Entrégale la primera lista filtrada a un negocio real',
      'Ajusta las reglas según lo que digan que sí sirvió',
    ],
  },
  D: {
    tag: 'Vertical de sector',
    title: 'Resuelve el problema de tu propio oficio',
    usuario: 'Colegas de tu misma industria o profesión',
    problema:
      'Un dolor específico que solo alguien de tu mismo oficio reconoce de inmediato — para cualquier otra persona pasa desapercibido',
    resultado:
      'Una herramienta que tu gremio adopta porque le habla en su propio lenguaje, no en jerga genérica de software',
    mvp: 'Una aplicación web simple enfocada en un solo caso de uso de tu sector, nada genérico',
    fuera:
      'Soporte para otras industrias, personalización profunda, integraciones con sistemas externos',
    validacion:
      'Pruébalo con 3 colegas reales antes de seguir construyendo cualquier función nueva',
    pasos: [
      'Nombra a las 3 personas concretas de tu sector que lo usarían primero',
      'Pregúntales qué parte del problema les duele más, no asumas',
      'Construye solo esa parte',
      'Vuelve con ellos antes de agregar la siguiente función',
    ],
  },
  E: {
    tag: 'Asistente de atención',
    title: 'Responde o atiende a usuarios reales',
    usuario: 'Un negocio o comunidad con volumen de preguntas repetidas',
    problema:
      'Las mismas preguntas se responden una y otra vez a mano, y nadie lleva registro de cuáles son',
    resultado:
      'Respuestas consistentes e inmediatas para las preguntas frecuentes, sin esperar a que una persona esté disponible',
    mvp: 'Un asistente que cubre las 10 preguntas más frecuentes de un caso concreto, nada más',
    fuera:
      'Cobertura de todas las preguntas posibles, escalamiento automático a un humano, soporte multi-idioma',
    validacion:
      'Déjalo responder preguntas reales durante una semana y revisa cada vez que falló',
    pasos: [
      'Reúne las 10 preguntas que más se repiten hoy (revisa chats o correos pasados)',
      'Escribe la respuesta correcta para cada una, a tu manera, no genérica',
      'Conecta el asistente solo a esas 10',
      'Cada pregunta nueva que falle, agrégala a la lista para la siguiente versión',
    ],
  },
  F: {
    tag: 'Micro-SaaS',
    title: 'Construye algo que un tercero pagaría por usar',
    usuario: 'Un cliente externo con un problema puntual y presupuesto para resolverlo',
    problema:
      'Un dolor específico que hoy resuelven a mano, pagando de más, o simplemente aguantando',
    resultado:
      'Una herramienta pequeña y cobrable que resuelve un solo trabajo, bien hecho',
    mvp: 'Una función única, con acceso básico (login simple) y una forma de cobrar, aunque sea manual al inicio',
    fuera:
      'Planes múltiples, panel de administración completo, escalar antes de tener el primer cliente pagando',
    validacion:
      'Consigue que una persona ajena a ti pague o se comprometa a pagar antes de seguir construyendo',
    pasos: [
      // Condicional: quien ya tiene a alguien pagando no repite el paso.
      'Si ya tienes a alguien dispuesto a pagar, salta directo al paso 2. Si no, consíguelo antes de programar la primera línea',
      'Cóbrale manualmente (transferencia, no un sistema de pagos) la primera vez',
      'Construye solo la función que le resuelve el problema a esa persona',
      'Automatiza el cobro solo cuando tengas 2 o 3 clientes reales',
    ],
  },
};

// Del brief. Idénticos a los del prototipo — verificado a mano.
const RANGOS_DEL_BRIEF = {
  A: { min: 3, max: 7 },
  B: { min: 7, max: 14 },
  C: { min: 10, max: 14 },
  D: { min: 7, max: 14 },
  E: { min: 7, max: 10 },
  F: { min: 14, max: 21 },
};

const todas = () => IDS_CATEGORIAS.map((id) => [id, CATEGORIAS[id]]);

describe('categorías', () => {
  // Test 1
  it('son exactamente 6, con ids A–F', () => {
    expect(IDS_CATEGORIAS).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(Object.keys(CATEGORIAS)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  // Test 2
  it.each(todas())('%s tiene los 7 campos, ninguno ausente', (_id, cat) => {
    expect(CAMPOS_CATEGORIA).toHaveLength(7);
    for (const campo of CAMPOS_CATEGORIA) {
      expect(cat[campo], `falta el campo "${campo}"`).toBeDefined();
    }
  });

  // Test 3
  it.each(todas())('%s no tiene ningún campo de texto vacío', (_id, cat) => {
    const camposDeTexto = CAMPOS_CATEGORIA.filter((c) => c !== 'tiempoBase');
    for (const campo of camposDeTexto) {
      expect(typeof cat[campo], `"${campo}" debería ser texto`).toBe('string');
      expect(cat[campo].trim(), `"${campo}" está vacío`).not.toBe('');
    }
  });

  // Test 4
  it.each(todas())('%s tiene exactamente 4 pasos, ninguno vacío', (_id, cat) => {
    expect(cat.pasos).toHaveLength(4);
    for (const paso of cat.pasos) {
      expect(typeof paso).toBe('string');
      expect(paso.trim()).not.toBe('');
    }
  });

  // Test 5
  it.each(todas())('%s tiene tag y title no vacíos', (_id, cat) => {
    expect(cat.tag.trim()).not.toBe('');
    expect(cat.title.trim()).not.toBe('');
  });

  // Test 6 — el candado del copy
  it.each(todas())('%s tiene el copy literal del prototipo', (id, cat) => {
    const esperado = COPY_DEL_PROTOTIPO[id];
    for (const [campo, texto] of Object.entries(esperado)) {
      expect(cat[campo], `el copy de "${campo}" cambió`).toEqual(texto);
    }
  });

  // Test 7
  it.each(todas())('%s tiene un rango de tiempo válido y el del brief', (id, cat) => {
    expect(cat.tiempoBase.min).toBeLessThan(cat.tiempoBase.max);
    expect(cat.tiempoBase.unidad).toBe('días');
    expect(cat.tiempoBase.min).toBe(RANGOS_DEL_BRIEF[id].min);
    expect(cat.tiempoBase.max).toBe(RANGOS_DEL_BRIEF[id].max);
  });

  it('no se puede mutar en caliente', () => {
    expect(Object.isFrozen(CATEGORIAS)).toBe(true);
    expect(Object.isFrozen(CATEGORIAS.A)).toBe(true);
    expect(Object.isFrozen(CATEGORIAS.A.pasos)).toBe(true);
  });

  describe('obtenerCategoria', () => {
    it('devuelve la categoría pedida', () => {
      expect(obtenerCategoria('D').tag).toBe('Vertical de sector');
    });

    it('rechaza un id que no existe en vez de devolver undefined', () => {
      expect(() => obtenerCategoria('Z')).toThrow(/categoría desconocida/i);
      expect(() => obtenerCategoria(null)).toThrow(/categoría desconocida/i);
    });
  });
});
