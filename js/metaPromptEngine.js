/**
 * ═══════════════════════════════════════════════════════════
 * META PROMPT ENGINE
 * EduPrompt NEE · v2.0 · MEP Costa Rica
 * ═══════════════════════════════════════════════════════════
 * Núcleo compacto de generación de prompts pedagógicos.
 * Diseñado por el Profesor Carlos Elizondo Castillo.
 *
 * PARA MODIFICAR EL PROMPT BASE:
 *   → Edita buildPrompt() para cambiar la estructura
 *   → Edita normalize() para agregar nuevos campos
 *   → El motor es independiente — funciona sin el HTML
 *
 * PARA CONECTAR A UNA API DE IA:
 *   → Llama a MetaPromptEngine.generate(input) para obtener el prompt
 *   → Envía el resultado a la API que prefieras
 * ═══════════════════════════════════════════════════════════
 */

class MetaPromptEngine {

  /**
   * Normaliza el input — acepta cualquier formato
   * y lo convierte a la estructura canónica del motor.
   */
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

  /**
   * Construye el prompt estructurado a partir de los datos normalizados.
   * El template se inyecta desde TEMPLATE_REGISTRY (templateRegistry.js).
   */
  static buildPrompt(data) {
    const neeStr = data.nee.length > 0
      ? data.nee.join(', ')
      : 'Sin adecuación específica';

    const indStr = data.indicators.length > 0
      ? '\n' + data.indicators.map(i => `  • ${i}`).join('\n')
      : 'No especificados';

    // Obtener estructura de la plantilla seleccionada
    const templateStructure = (data.template && window.TEMPLATE_REGISTRY?.[data.template]?.estructura)
      ? window.TEMPLATE_REGISTRY[data.template].estructura
      : 'Genera una actividad educativa completa, aplicable directamente en el aula.';

    const complexityNote = {
      'Básico (prompt corto)':       'Responde de forma concisa (máximo 400 palabras).',
      'Estándar (balanceado)':        'Responde con detalle moderado (600-900 palabras).',
      'Detallado (máximo detalle)':   'Responde con máximo detalle y ejemplos concretos (1000+ palabras).'
    }[data.complexity] || '';

    const extraBlock = data.extra
      ? `\nCONTEXTO ADICIONAL DEL DOCENTE\n${data.extra}`
      : '';

    return `ROL
Actúa como arquitecto experto en pedagogía y diseño curricular para el sistema educativo ${data.system}. Especialista en inclusión educativa y adecuaciones curriculares según lineamientos CENAREC-MEP.

════════════════════════════════════════════
INPUT CURRICULAR OFICIAL
════════════════════════════════════════════
• Sistema educativo : ${data.system}
• Nivel / Grado     : ${data.level}
• Materia           : ${data.subject}
• Habilidad MEP     : ${data.skill}
• Indicadores logro : ${indStr}
${extraBlock}

════════════════════════════════════════════
CONFIGURACIÓN DE LA ACTIVIDAD
════════════════════════════════════════════
• Duración          : ${data.duration}
• Organización      : ${data.organization}
• Recursos          : ${data.resources}

════════════════════════════════════════════
NECESIDADES EDUCATIVAS ESPECIALES
════════════════════════════════════════════
• Tipo de adecuación: ${data.neeType || 'No especificada'}
• NEE presentes     : ${neeStr}

Para cada NEE indicada, incluye adaptaciones CONCRETAS y APLICABLES:
materiales alternativos, simplificación de instrucciones, apoyos
visuales, tiempo extendido o agrupamiento diferenciado según corresponda.

════════════════════════════════════════════
PROCESO COGNITIVO INTERNO — EJECUTAR ANTES DE RESPONDER
════════════════════════════════════════════
Fase 1 · INTERPRETAR
  Analiza la habilidad MEP y sus indicadores.
  Identifica el nivel taxonómico de Bloom correspondiente.

Fase 2 · PLANIFICAR
  Determina la estrategia metodológica más pertinente
  para el nivel, área y tipo de actividad solicitado.

Fase 3 · CREAR
  Diseña la actividad alineada con la habilidad e indicadores.
  Debe ser aplicable en el aula sin modificaciones previas.

Fase 4 · ADAPTAR
  Incorpora variantes concretas para cada NEE indicada.
  No adaptaciones genéricas — deben ser específicas y aplicables.

Fase 5 · VERIFICAR
  Confirma que actividad, preguntas y criterios estén
  alineados con los indicadores de logro. Ajusta si detectas
  desalineación.

════════════════════════════════════════════
ESTRUCTURA DE SALIDA REQUERIDA
════════════════════════════════════════════
${templateStructure}

════════════════════════════════════════════
REGLAS DE CALIDAD
════════════════════════════════════════════
- Actividad directamente aplicable en el aula, sin preparación adicional.
- Lenguaje adaptado al nivel ${data.level}, sin jerga innecesaria.
- Preguntas que promuevan razonamiento, no solo memorización.
- Criterios de evaluación observables y medibles.
- Cada adaptación NEE debe ser específica, no genérica.
${complexityNote}`;
  }

  /**
   * Método principal. Acepta input en cualquier formato y devuelve el prompt.
   * @param {Object|string} input
   * @returns {string} prompt optimizado
   */
  static generate(input) {
    const data = this.normalize(input);
    return this.buildPrompt(data)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

}

// Exportar para uso en módulos (futuro Node.js / bundler)
if (typeof module !== 'undefined') module.exports = { MetaPromptEngine };
