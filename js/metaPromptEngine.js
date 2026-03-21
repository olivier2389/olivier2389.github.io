/**
 * ═══════════════════════════════════════════════════════════
 * META PROMPT ENGINE  v3.0 — DOBLE FASE
 * EduPrompt NEE · MEP Costa Rica
 * ═══════════════════════════════════════════════════════════
 * Genera un prompt de DOS FASES para mayor precisión:
 *
 * FASE 1 — Claude parsea los datos del formulario
 *          y devuelve SOLO un JSON estructurado.
 *          El docente lo revisa y confirma.
 *
 * FASE 2 — Con el JSON validado, Claude genera
 *          la actividad completa en formato MEP.
 *
 * Interfaz pública idéntica a v2 — app.js no requiere cambios.
 * ═══════════════════════════════════════════════════════════
 */

class MetaPromptEngine {

  // ─────────────────────────────────────────────────────────
  //  Schema de Fase 1 — estructura de parseo
  // ─────────────────────────────────────────────────────────
  static get SCHEMA_FASE1() {
    return {
      nivel:          "string — ej: Segundo grado",
      materia:        "string — ej: Matemáticas",
      habilidad_id:   "string — ej: M-2-HAB-04",
      habilidad_texto:"string — texto completo de la habilidad MEP",
      indicadores:    ["string — indicador de logro"],
      duracion:       "string — ej: 45 min",
      organizacion:   "string — ej: Pequeños grupos (3-4)",
      recursos:       "string — ej: Material concreto + impreso",
      adecuacion:     "string — tipo de adecuación curricular o 'Sin adecuación'",
      nee:            ["string — cada NEE seleccionada"],
      plantilla:      "string — tipo de actividad pedagógica",
      complejidad:    "string — nivel de detalle solicitado",
      obs_grupo:      "string — observaciones del docente (puede ser vacío)"
    };
  }

  // ─────────────────────────────────────────────────────────
  //  normalize — igual a v2, sin cambios
  // ─────────────────────────────────────────────────────────
  static normalize(input) {
    if (typeof input === 'string') {
      try { input = JSON.parse(input); }
      catch { input = { topic: input }; }
    }

    return {
      system:       input.system       || 'MEP Costa Rica',
      level:        input.level        || 'Nivel no especificado',
      subject:      input.subject      || 'Matemáticas',
      topic:        input.topic        || input.tema      || 'Tema',
      skill:        input.skill        || input.habilidad || '',
      skillId:      input.skillId      || '',
      indicators:   input.indicators   || [],
      nee:          input.nee          || [],
      neeType:      input.neeType      || '',
      duration:     input.duration     || '45 min',
      organization: input.organization || 'Pequeños grupos',
      resources:    input.resources    || 'Material básico',
      template:     input.template     || null,
      extra:        input.extra        || '',
      complexity:   input.complexity   || 'Estándar (balanceado)'
    };
  }

  // ─────────────────────────────────────────────────────────
  //  buildPrompt — ahora genera el prompt de DOBLE FASE
  // ─────────────────────────────────────────────────────────
  static buildPrompt(data) {
    const neeStr = data.nee.length > 0
      ? data.nee.join(', ')
      : 'Sin NEE específicas';

    const indStr = data.indicators.length > 0
      ? data.indicators.map(i => `  • ${i}`).join('\n')
      : 'No especificados';

    const templateStructure = (data.template && window.TEMPLATE_REGISTRY?.[data.template]?.estructura)
      ? window.TEMPLATE_REGISTRY[data.template].estructura
      : 'Genera una actividad educativa completa con inicio, desarrollo y cierre, aplicable directamente en el aula.';

    const complexityNote = {
      'Básico (prompt corto)':      'Responde de forma concisa (máximo 400 palabras).',
      'Estándar (balanceado)':      'Responde con detalle moderado (600-900 palabras).',
      'Detallado (máximo detalle)': 'Responde con máximo detalle y ejemplos concretos (1000+ palabras).'
    }[data.complexity] || '';

    const extraBlock = data.extra
      ? `\nCONTEXTO ADICIONAL DEL DOCENTE\n${data.extra}\n`
      : '';

    const schema1 = JSON.stringify(this.SCHEMA_FASE1, null, 2);

    return `════════════════════════════════════════════════════════
MODO: DOBLE FASE — lee todo antes de responder
════════════════════════════════════════════════════════

ROL
Actúa como arquitecto experto en pedagogía y diseño curricular para el sistema educativo ${data.system}. Especialista en inclusión educativa y adecuaciones curriculares según lineamientos CENAREC-MEP.

════════════════════════════════════════════
FASE 1 — PARSEO Y VALIDACIÓN (ejecutar ahora)
════════════════════════════════════════════
Lee los datos del formulario a continuación y devuelve ÚNICAMENTE un objeto JSON con la siguiente estructura. Sin texto antes ni después. Sin bloques de código ni comillas de markdown.

SCHEMA DE FASE 1:
${schema1}

REGLAS DE FASE 1:
1. Devolver SOLO el JSON. Nada más.
2. Todos los campos de tipo string deben tener contenido real, nunca vacíos.
3. El array "nee" debe listar cada NEE exactamente como se indica en los datos.
4. El campo "habilidad_texto" debe contener el texto completo de la habilidad MEP.
5. NO generes la actividad todavía. Solo el JSON de parseo.

Cuando el docente revise el JSON y responda "ejecutar" o "aceptar", pasás a FASE 2.

════════════════════════════════════════════
FASE 2 — GENERACIÓN (solo cuando el docente confirme)
════════════════════════════════════════════
Usando EXACTAMENTE los datos del JSON que devolviste en Fase 1, genera la actividad completa.

PROCESO COGNITIVO — ejecutar antes de escribir:
  1. INTERPRETAR — analiza la habilidad MEP e identifica el nivel taxonómico de Bloom.
  2. PLANIFICAR   — determina la estrategia metodológica más pertinente para el nivel y área.
  3. CREAR        — diseña la actividad alineada con la habilidad e indicadores.
  4. ADAPTAR      — incorpora variantes CONCRETAS para cada NEE (no genéricas).
  5. VERIFICAR    — confirma alineación actividad-indicadores. Ajusta si hay desalineación.

ESTRUCTURA DE SALIDA EN FASE 2:
${templateStructure}

REGLAS DE CALIDAD:
- Actividad directamente aplicable en el aula, sin preparación adicional.
- Lenguaje adaptado al nivel ${data.level}, sin jerga innecesaria.
- Preguntas que promuevan razonamiento, no memorización.
- Criterios de evaluación observables y medibles.
- Cada adaptación NEE debe ser específica para esta actividad, no genérica.
${complexityNote}

════════════════════════════════════════════
DATOS DEL FORMULARIO
════════════════════════════════════════════
• Sistema educativo : ${data.system}
• Nivel / Grado     : ${data.level}
• Materia           : ${data.subject}
• Habilidad MEP     : [${data.skillId || '—'}] ${data.skill}
• Indicadores logro :
${indStr}
• Duración          : ${data.duration}
• Organización      : ${data.organization}
• Recursos          : ${data.resources}
• Tipo adecuación   : ${data.neeType || 'Sin adecuación curricular específica'}
• NEE presentes     : ${neeStr}
${extraBlock}
════════════════════════════════════════════
Comenzá ahora con FASE 1 — devolvé el JSON:`;
  }

  // ─────────────────────────────────────────────────────────
  //  generate — método público, interfaz idéntica a v2
  // ─────────────────────────────────────────────────────────
  static generate(input) {
    const data = this.normalize(input);
    return this.buildPrompt(data)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

}

// Exportar para uso en módulos (futuro Node.js / bundler)
if (typeof module !== 'undefined') module.exports = { MetaPromptEngine };
