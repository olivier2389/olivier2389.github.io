/**
 * ═══════════════════════════════════════════════════════════
 * TEMPLATE REGISTRY
 * EduPrompt NEE · v2.0 · MEP Costa Rica
 * ═══════════════════════════════════════════════════════════
 * Registro de plantillas pedagógicas reutilizables.
 *
 * 🔌 CÓMO AGREGAR UNA NUEVA PLANTILLA:
 *   1. Agrega un objeto con la estructura: { id, icon, nombre, desc, estructura }
 *   2. La clave del objeto es el ID único de la plantilla
 *   3. No necesitas modificar nada más — se renderiza automáticamente
 *
 * EJEMPLO:
 *   mi_plantilla: {
 *     id: 'mi_plantilla',
 *     icon: '🎯',
 *     nombre: 'Mi nueva plantilla',
 *     desc: 'Descripción corta de para qué sirve',
 *     estructura: `Instrucciones para la IA sobre la estructura de salida...`
 *   }
 * ═══════════════════════════════════════════════════════════
 */

const TEMPLATE_REGISTRY = {

  /* ─ Indagación ─────────────────────────────────────── */
  indagacion: {
    id: 'indagacion', icon: '🔍',
    nombre: 'Indagación',
    desc: 'El estudiante investiga y construye conocimiento a partir de preguntas',
    estructura: `Genera la actividad con esta estructura:
1. TÍTULO con pregunta detonadora
2. CONTEXTO pedagógico (2-3 líneas)
3. INSTRUCCIONES DOCENTE: preparación → desarrollo → cierre
4. ACTIVIDAD ESTUDIANTE: paso a paso en segunda persona
5. PREGUNTA CENTRAL de indagación (abierta y provocadora)
6. SUBPREGUNTAS DE ANDAMIAJE (3-5, de menor a mayor complejidad cognitiva)
7. PRODUCTO ESPERADO: qué debe entregar o demostrar
8. CRITERIOS DE EVALUACIÓN (tabla: criterio | descriptor | nivel de logro)
9. ADAPTACIONES NEE específicas para cada necesidad indicada`
  },

  /* ─ Resolución de problemas ──────────────────────── */
  resolucion: {
    id: 'resolucion', icon: '⚙️',
    nombre: 'Resolución de problemas',
    desc: 'Aplica conocimientos para resolver situaciones reales o simuladas',
    estructura: `Genera la actividad con esta estructura:
1. TÍTULO descriptivo del problema a resolver
2. SITUACIÓN PROBLEMA: narrativa contextualizada y realista para el nivel
3. DATOS DISPONIBLES: información con la que cuenta el estudiante
4. INSTRUCCIONES DOCENTE: mediación, pistas permitidas, tiempo sugerido
5. PASOS ESTUDIANTE: guía estructurada sin revelar la solución
6. PREGUNTA PRINCIPAL: ¿Qué debes resolver y por qué importa?
7. SUBPREGUNTAS DE PROCESO (3-5): descomponen el problema en partes manejables
8. CRITERIOS DE EVALUACIÓN: proceso (razonamiento) + resultado (respuesta)
9. ADAPTACIONES NEE concretas para el tipo de problema`
  },

  /* ─ Proyecto colaborativo ────────────────────────── */
  proyecto: {
    id: 'proyecto', icon: '🏗️',
    nombre: 'Proyecto colaborativo',
    desc: 'Equipos diseñan, crean o producen algo aplicando los aprendizajes',
    estructura: `Genera la actividad con esta estructura:
1. TÍTULO con verbo de acción (Diseña, Crea, Construye, Investiga...)
2. DESAFÍO: descripción del reto que el equipo debe asumir
3. ROLES DEL EQUIPO: sugerencias de distribución de responsabilidades
4. INSTRUCCIONES DOCENTE: fases del proyecto, acompañamiento, plazos
5. ETAPAS DEL EQUIPO: planificación → desarrollo → presentación
6. PREGUNTA GUÍA DEL PROYECTO: orienta todo el proceso
7. SUBPREGUNTAS POR ETAPA (2 mínimo por etapa): andamian cada fase
8. CRITERIOS DE EVALUACIÓN: producto + proceso + trabajo en equipo
9. ADAPTACIONES NEE para trabajo grupal inclusivo`
  },

  /* ─ Juego matemático ─────────────────────────────── */
  juego: {
    id: 'juego', icon: '🎮',
    nombre: 'Juego matemático',
    desc: 'Aprende mediante mecánicas de juego, retos y competencia sana',
    estructura: `Genera la actividad con esta estructura:
1. TÍTULO del juego con nombre creativo y atractivo
2. OBJETIVO DE APRENDIZAJE disfrazado como reto del juego
3. MATERIALES Y PREPARACIÓN del docente
4. REGLAS DEL JUEGO (claras, máximo 6 reglas)
5. DESARROLLO: cómo se juega paso a paso
6. VARIANTES DE DIFICULTAD: fácil / normal / desafiante
7. PREGUNTAS DE METACOGNICIÓN al finalizar (3-4 preguntas)
8. EVALUACIÓN: qué observar durante el juego (lista de indicadores)
9. ADAPTACIONES NEE para participación plena de todos`
  },

  /* ─ Evaluación formativa ─────────────────────────── */
  evaluacion: {
    id: 'evaluacion', icon: '📊',
    nombre: 'Evaluación formativa',
    desc: 'Verifica el aprendizaje con retroalimentación inmediata',
    estructura: `Genera la actividad con esta estructura:
1. PROPÓSITO de la evaluación (diagnóstica / formativa / sumativa)
2. INSTRUCCIONES GENERALES para el estudiante
3. SECCIÓN A — Selección única (4-5 ítems con 4 opciones cada uno)
4. SECCIÓN B — Respuesta corta (3-4 ítems)
5. SECCIÓN C — Problema aplicado (1-2 situaciones contextualizadas)
6. RÚBRICA DE CALIFICACIÓN con puntaje por sección
7. RETROALIMENTACIÓN sugerida por nivel de logro (alto/medio/bajo)
8. ADAPTACIONES NEE para la evaluación (tiempo, formato, apoyos)`
  },

  /* ─ Clase invertida ──────────────────────────────── */
  clase_invertida: {
    id: 'clase_invertida', icon: '🔄',
    nombre: 'Clase invertida',
    desc: 'Exploración previa en casa + aplicación profunda en el aula',
    estructura: `Genera la actividad con esta estructura:
PARTE 1 — TAREA PREVIA (para realizar en casa, 15-20 min):
1. VIDEO / LECTURA sugerida con indicaciones concretas
2. ACTIVIDAD DE EXPLORACIÓN: 3-4 ejercicios básicos de preparación
3. PREGUNTA DE REFLEXIÓN para traer al aula

PARTE 2 — EN EL AULA (aplicación y profundización):
4. VERIFICACIÓN RÁPIDA: cómo retomar la tarea previa (5 min)
5. ACTIVIDAD CENTRAL: aplicación de alto nivel del concepto
6. TRABAJO EN GRUPOS: problema desafiante que requiere la preparación previa
7. CIERRE Y SÍNTESIS: conclusiones del grupo
8. CRITERIOS DE EVALUACIÓN: participación + producto en aula
9. ADAPTACIONES NEE para ambas partes (tarea y aula)`
  },

  /* ─ Laboratorio de exploración ───────────────────── */
  laboratorio: {
    id: 'laboratorio', icon: '🧪',
    nombre: 'Laboratorio de exploración',
    desc: 'Descubre patrones y propiedades a través de la manipulación concreta',
    estructura: `Genera la actividad con esta estructura:
1. PREGUNTA DE INVESTIGACIÓN que guía el laboratorio
2. MATERIALES: lista detallada de lo que necesitan los grupos
3. HIPÓTESIS: qué predice el estudiante antes de comenzar
4. PROCEDIMIENTO PASO A PASO: instrucciones numeradas y claras
5. TABLA DE REGISTRO: formato para anotar observaciones y datos
6. ANÁLISIS: preguntas para interpretar los resultados obtenidos
7. CONCLUSIONES: conectar hallazgos con el concepto matemático
8. ERROR Y REFLEXIÓN: ¿qué salió diferente a lo esperado y por qué?
9. ADAPTACIONES NEE para el trabajo manipulativo`
  }

};
