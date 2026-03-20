/**
 * metaEngine.js — Motor de dos capas · EduPrompt NEE + PlanEdu
 * ─────────────────────────────────────────────────────────────
 * CAPA 1: buildPrompt(tipo, datos) → prompt que pide JSON estricto a Claude
 * CAPA 2: callClaude(prompt)       → llama API → parsea JSON
 *         render(json, tipo)        → renderiza el JSON en pantalla
 *
 * Tipos soportados: "actividad" | "planeamiento"
 */

// ═══════════════════════════════════════════════════════════════
//  SCHEMAS — definen la estructura exacta que Claude debe devolver
// ═══════════════════════════════════════════════════════════════

const SCHEMA_ACTIVIDAD = {
  tipo: "actividad",
  habilidad: { id: "string", texto: "string" },
  ciclo: "string",
  area: "string",
  nivel: "string",
  duracion: "string",
  organizacion: "string",
  actividad: {
    titulo: "string",
    objetivo: "string — aprendizaje esperado en términos de habilidad observable",
    inicio: {
      descripcion: "string — descripción detallada de la activación de conocimientos previos",
      duracion: "string — ej: 10 min"
    },
    desarrollo: {
      descripcion: "string — descripción detallada del cuerpo de la actividad",
      duracion: "string",
      pasos: ["string — cada paso numerado de la actividad"]
    },
    cierre: {
      descripcion: "string — síntesis, metacognición o evaluación formativa",
      duracion: "string"
    },
    materiales: ["string — lista de materiales necesarios"],
    adecuaciones_nee: [
      {
        nee: "string — tipo de NEE",
        estrategia: "string — adecuación específica para esta NEE en esta actividad"
      }
    ],
    evaluacion: {
      instrumento: "string — tipo de instrumento de evaluación",
      indicadores: ["string — indicador observable y medible"]
    }
  }
};

const SCHEMA_PLANEAMIENTO = {
  tipo: "planeamiento",
  encabezado: {
    direccion_regional: "string",
    centro_educativo: "string",
    docente: "string",
    asignatura: "string",
    ciclo: "string",
    anio_escolar: "string",
    mes: "string",
    tipo_planeamiento: "string"
  },
  semanas: [
    {
      numero: "number — 1, 2, 3 o 4",
      titulo: "string — tema central de la semana",
      aprendizajes_esperados: ["string — habilidad o aprendizaje concreto"],
      estrategias_metodologicas: ["string — estrategia específica con DUA integrado"],
      indicadores_evaluacion: ["string — indicador observable"],
      recursos: ["string — material o recurso"],
      tiempo: "string — distribución del tiempo en la semana"
    }
  ],
  dua: {
    representacion: "string — cómo se implementa la representación múltiple en este mes",
    accion_expresion: "string — cómo se implementa la expresión y acción múltiple",
    motivacion: "string — cómo se implementa la motivación e implicación"
  },
  mediacion_pedagogica: "string — descripción general de la metodología del mes",
  pei: null
};

// ═══════════════════════════════════════════════════════════════
//  CAPA 1 — buildPrompt
// ═══════════════════════════════════════════════════════════════

/**
 * buildPrompt(tipo, datos)
 * @param {string} tipo - "actividad" | "planeamiento"
 * @param {object} datos - datos del formulario + contexto curricular
 * @returns {string} prompt listo para enviar a Claude
 */
function buildPrompt(tipo, datos) {
  if (tipo === "actividad") return _buildPromptActividad(datos);
  if (tipo === "planeamiento") return _buildPromptPlaneamiento(datos);
  throw new Error("Tipo de prompt no reconocido: " + tipo);
}

function _buildPromptActividad(d) {
  const schema = JSON.stringify(SCHEMA_ACTIVIDAD, null, 2);
  const neeTexto = d.nee && d.nee.length > 0
    ? d.nee.map(n => "- " + n).join("\n")
    : "- Sin NEE específicas";

  return `Sos un experto en didáctica de la matemática y educación inclusiva según el programa oficial MEP de Costa Rica.

Tu tarea es generar una actividad didáctica completa y devolverla ÚNICAMENTE como un objeto JSON válido.

REGLAS ABSOLUTAS:
1. Respondé SOLO con el JSON. Sin texto antes, sin texto después.
2. Sin bloques de código, sin comillas de markdown, sin explicaciones.
3. El JSON debe tener exactamente la estructura del schema.
4. Todos los campos de tipo "string" deben tener contenido real, nunca vacíos.
5. Los arrays deben tener al menos 2 elementos cada uno.
6. El campo "pasos" debe tener entre 4 y 7 pasos detallados.
7. El campo "adecuaciones_nee" debe tener una entrada por cada NEE listada.

DATOS DEL FORMULARIO:
- Habilidad MEP: [${d.habilidad_id}] ${d.habilidad_texto}
- Ciclo: ${d.ciclo}
- Área: ${d.area}
- Nivel/Grado: ${d.nivel}
- Duración: ${d.duracion}
- Organización: ${d.organizacion}
- Recursos disponibles: ${d.recursos}
- Tipo de adecuación: ${d.adecuacion || "Sin adecuación curricular específica"}
- NEE del grupo:
${neeTexto}
${d.obs_grupo ? "- Observaciones del grupo: " + d.obs_grupo : ""}

CONTEXTO CURRICULAR MEP:
- Introducción del área: ${d.ctx_introduccion || ""}
- Propósito de la enseñanza: ${d.ctx_proposito || ""}
- Orientaciones metodológicas: ${d.ctx_metodologicas || ""}
- Orientaciones de evaluación: ${d.ctx_evaluacion || ""}

PLANTILLA PEDAGÓGICA SELECCIONADA: ${d.plantilla || "resolución de problemas"}
${d.ctx_adicional ? "CONTEXTO ADICIONAL: " + d.ctx_adicional : ""}

SCHEMA JSON QUE DEBÉS RESPETAR EXACTAMENTE:
${schema}

IMPORTANTE sobre adecuaciones_nee:
Cada entrada debe ser una estrategia CONCRETA y ESPECÍFICA para esa NEE dentro de esta actividad en particular — no una descripción genérica. Por ejemplo: "En el paso 3, proveer material manipulativo ampliado para el estudiante con discapacidad visual" es específico. "Adaptar para el estudiante" no lo es.

Respondé ahora con el JSON:`;
}

function _buildPromptPlaneamiento(d) {
  const schema = JSON.stringify(SCHEMA_PLANEAMIENTO, null, 2);

  const habilidadesTexto = d.habilidades && d.habilidades.length > 0
    ? d.habilidades.map(h => `- [${h.id}] ${h.texto}`).join("\n")
    : "- (Inferir habilidades apropiadas para el mes según el contexto curricular)";

  const duaTexto = d.estrategias_dua && d.estrategias_dua.length > 0
    ? d.estrategias_dua.map(e => "- " + e).join("\n")
    : "- Representación visual, concreta y simbólica\n- Expresión oral y escrita\n- Motivación por contexto real";

  const peiBloque = d.pei_activo ? `
ADECUACIÓN PEI REQUERIDA:
- Tipo: ${d.pei_tipo}
- Área de NEE: ${d.pei_area}
${d.pei_obs ? "- Nota: " + d.pei_obs : ""}
El campo "pei" del JSON NO debe ser null. Debe ser un objeto con:
{
  "tipo": "${d.pei_tipo}",
  "area_nee": "${d.pei_area}",
  "habilidades_adaptadas": ["string — habilidad original y cómo se adapta"],
  "estrategias_diferenciadas": ["string — estrategia específica para este estudiante"],
  "criterios_evaluacion_adaptados": ["string — criterio adaptado a las capacidades del estudiante"],
  "observacion": "string"
}` : `El campo "pei" del JSON debe ser null.`;

  return `Sos un experto en planificación didáctica según el programa oficial de Matemática del MEP de Costa Rica.

Tu tarea es generar un planeamiento mensual completo y devolverlo ÚNICAMENTE como un objeto JSON válido.

REGLAS ABSOLUTAS:
1. Respondé SOLO con el JSON. Sin texto antes, sin texto después.
2. Sin bloques de código, sin comillas de markdown, sin explicaciones.
3. El JSON debe tener exactamente la estructura del schema.
4. El array "semanas" debe tener exactamente ${d.semanas} elementos.
5. Cada semana debe tener contenido DIFERENTE y PROGRESIVO — no repetir estrategias.
6. Todos los arrays deben tener entre 2 y 4 elementos.
7. Las estrategias metodológicas deben integrar los principios DUA seleccionados.

DATOS DEL FORMULARIO:
- Ciclo: ${d.ciclo}
- Área: ${d.area}
- Año escolar: ${d.anio}
- Mes: ${d.mes}
- Semanas: ${d.semanas}
- Docente: ${d.docente}
- Centro educativo: ${d.centro}
- Dirección regional: ${d.dir_regional}
- Tipo de planeamiento: ${d.tipo_plan}

HABILIDADES SELECCIONADAS PARA EL MES:
${habilidadesTexto}

ESTRATEGIAS DUA SELECCIONADAS:
${duaTexto}

CONTEXTO CURRICULAR MEP:
- Introducción del área: ${d.ctx_introduccion || ""}
- Propósito de la enseñanza: ${d.ctx_proposito || ""}
- Orientaciones metodológicas generales: ${d.ctx_met_generales || ""}
- Orientaciones metodológicas para ${d.anio}: ${d.ctx_met_anio || ""}
- Orientaciones de evaluación: ${d.ctx_evaluacion || ""}

${peiBloque}

SCHEMA JSON QUE DEBÉS RESPETAR EXACTAMENTE:
${schema}

IMPORTANTE sobre progresión semanal:
Las semanas deben mostrar una secuencia pedagógica coherente: exploración → conceptualización → aplicación → consolidación/evaluación. No todas las semanas son iguales.

Respondé ahora con el JSON:`;
}

// ═══════════════════════════════════════════════════════════════
//  CAPA 2A — callClaude
// ═══════════════════════════════════════════════════════════════

/**
 * callClaude(prompt, apiKey?)
 * Llama a la API de Claude y devuelve el JSON parseado.
 * @returns {Promise<object>} — objeto JSON del planeamiento o actividad
 */
async function callClaude(prompt, apiKey = null) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content?.map(b => b.text || "").join("") || "";

  // Limpiar posibles artefactos de markdown
  const clean = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    // Intento de rescate: buscar el primer { } balanceado
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) {}
    }
    throw new Error("Claude no devolvió JSON válido. Respuesta: " + clean.slice(0, 200));
  }
}

// ═══════════════════════════════════════════════════════════════
//  CAPA 2B — render
// ═══════════════════════════════════════════════════════════════

/**
 * render(json, tipo, contenedorId)
 * Renderiza el JSON en el contenedor indicado.
 * @param {object} json - objeto parseado de la API
 * @param {string} tipo - "actividad" | "planeamiento"
 * @param {string} contenedorId - ID del elemento DOM donde renderizar
 */
function render(json, tipo, contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) throw new Error("Contenedor no encontrado: " + contenedorId);

  if (tipo === "actividad")    cont.innerHTML = _renderActividad(json);
  if (tipo === "planeamiento") cont.innerHTML = _renderPlaneamiento(json);

  cont.style.display = "block";
  cont.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Renderer: Actividad ───────────────────────────────────────
function _renderActividad(j) {
  const a = j.actividad;
  if (!a) return "<p>Error: estructura JSON incompleta.</p>";

  const adecuaciones = (a.adecuaciones_nee || []).map(n => `
    <div class="me-nee-item">
      <span class="me-nee-tag">${n.nee}</span>
      <span class="me-nee-texto">${n.estrategia}</span>
    </div>
  `).join("");

  const pasos = (a.desarrollo?.pasos || []).map((p, i) => `
    <div class="me-paso">
      <span class="me-paso-num">${i + 1}</span>
      <span class="me-paso-texto">${p}</span>
    </div>
  `).join("");

  const materiales = (a.materiales || []).map(m => `<span class="me-tag">${m}</span>`).join("");
  const indicadores = (a.evaluacion?.indicadores || []).map(i => `<li>${i}</li>`).join("");

  return `
    <div class="me-actividad">
      <div class="me-act-header">
        <div class="me-act-titulo">${a.titulo || "Actividad"}</div>
        <div class="me-act-meta">
          <span class="me-tag">${j.duracion}</span>
          <span class="me-tag">${j.organizacion}</span>
          <span class="me-tag me-tag-id">${j.habilidad?.id || ""}</span>
        </div>
      </div>

      <div class="me-objetivo">
        <div class="me-section-label">Objetivo</div>
        <p>${a.objetivo}</p>
      </div>

      <div class="me-fases">
        <div class="me-fase me-fase-inicio">
          <div class="me-fase-header">
            <span class="me-fase-dot"></span>
            <span class="me-fase-nombre">Inicio</span>
            <span class="me-fase-tiempo">${a.inicio?.duracion || ""}</span>
          </div>
          <p>${a.inicio?.descripcion || ""}</p>
        </div>

        <div class="me-fase me-fase-desarrollo">
          <div class="me-fase-header">
            <span class="me-fase-dot"></span>
            <span class="me-fase-nombre">Desarrollo</span>
            <span class="me-fase-tiempo">${a.desarrollo?.duracion || ""}</span>
          </div>
          <p>${a.desarrollo?.descripcion || ""}</p>
          <div class="me-pasos">${pasos}</div>
        </div>

        <div class="me-fase me-fase-cierre">
          <div class="me-fase-header">
            <span class="me-fase-dot"></span>
            <span class="me-fase-nombre">Cierre</span>
            <span class="me-fase-tiempo">${a.cierre?.duracion || ""}</span>
          </div>
          <p>${a.cierre?.descripcion || ""}</p>
        </div>
      </div>

      ${materiales ? `
      <div class="me-section">
        <div class="me-section-label">Materiales</div>
        <div class="me-tags">${materiales}</div>
      </div>` : ""}

      ${adecuaciones ? `
      <div class="me-section">
        <div class="me-section-label">Adecuaciones NEE</div>
        <div class="me-nee-lista">${adecuaciones}</div>
      </div>` : ""}

      <div class="me-section">
        <div class="me-section-label">Evaluación · ${a.evaluacion?.instrumento || ""}</div>
        <ul class="me-indicadores">${indicadores}</ul>
      </div>

      <div class="me-acciones">
        <button class="me-btn-copy" onclick="metaEngine.copiarActividad()">Copiar texto</button>
        <button class="me-btn-json" onclick="metaEngine.verJSON()">Ver JSON</button>
      </div>
    </div>
  `;
}

// ─── Renderer: Planeamiento ────────────────────────────────────
function _renderPlaneamiento(j) {
  const enc = j.encabezado || {};

  const semanasHTML = (j.semanas || []).map(s => {
    const aprendizajes = (s.aprendizajes_esperados || []).map(a => `<li>${a}</li>`).join("");
    const estrategias  = (s.estrategias_metodologicas || []).map(e => `<li>${e}</li>`).join("");
    const indicadores  = (s.indicadores_evaluacion || []).map(i => `<li>${i}</li>`).join("");
    const recursos     = (s.recursos || []).map(r => `<span class="me-tag">${r}</span>`).join("");

    return `
      <tr class="me-semana-row">
        <td class="me-semana-num">
          <div class="me-num-badge">S${s.numero}</div>
          <div class="me-semana-titulo">${s.titulo || ""}</div>
          ${s.tiempo ? `<div class="me-semana-tiempo">${s.tiempo}</div>` : ""}
        </td>
        <td><ul class="me-lista-plan">${aprendizajes}</ul></td>
        <td><ul class="me-lista-plan">${estrategias}</ul></td>
        <td><ul class="me-lista-plan">${indicadores}</ul></td>
      </tr>
    `;
  }).join("");

  const peiHTML = j.pei ? `
    <div class="me-section me-pei-section">
      <div class="me-section-label me-pei-label">Adecuación Curricular PEI · ${j.pei.tipo} · ${j.pei.area_nee}</div>
      <div class="me-pei-grid">
        <div>
          <div class="me-subsection-label">Habilidades adaptadas</div>
          <ul class="me-lista-plan">${(j.pei.habilidades_adaptadas || []).map(h => `<li>${h}</li>`).join("")}</ul>
        </div>
        <div>
          <div class="me-subsection-label">Estrategias diferenciadas</div>
          <ul class="me-lista-plan">${(j.pei.estrategias_diferenciadas || []).map(e => `<li>${e}</li>`).join("")}</ul>
        </div>
        <div>
          <div class="me-subsection-label">Criterios de evaluación adaptados</div>
          <ul class="me-lista-plan">${(j.pei.criterios_evaluacion_adaptados || []).map(c => `<li>${c}</li>`).join("")}</ul>
        </div>
      </div>
      ${j.pei.observacion ? `<p class="me-pei-obs">${j.pei.observacion}</p>` : ""}
    </div>
  ` : "";

  return `
    <div class="me-planeamiento">

      <div class="me-encabezado-tabla">
        <table class="me-enc-table">
          <tr>
            <td><span class="me-enc-label">Dirección Regional</span><br>${enc.direccion_regional || "—"}</td>
            <td><span class="me-enc-label">Centro Educativo</span><br>${enc.centro_educativo || "—"}</td>
            <td><span class="me-enc-label">Docente</span><br>${enc.docente || "—"}</td>
          </tr>
          <tr>
            <td><span class="me-enc-label">Asignatura</span><br>${enc.asignatura || "—"}</td>
            <td><span class="me-enc-label">Año Escolar</span><br>${enc.anio_escolar || "—"}</td>
            <td><span class="me-enc-label">Mes / Tipo</span><br>${enc.mes || "—"} · ${enc.tipo_planeamiento || "Regular"}</td>
          </tr>
        </table>
      </div>

      <div class="me-tabla-wrap">
        <table class="me-tabla-semanas">
          <thead>
            <tr>
              <th style="width:120px">Semana</th>
              <th>Aprendizajes esperados</th>
              <th>Estrategias metodológicas</th>
              <th>Indicadores de evaluación</th>
            </tr>
          </thead>
          <tbody>${semanasHTML}</tbody>
        </table>
      </div>

      <div class="me-dua-section">
        <div class="me-section-label">Estrategias DUA</div>
        <div class="me-dua-grid">
          <div class="me-dua-principio">
            <div class="me-dua-titulo">I. Representación</div>
            <p>${j.dua?.representacion || ""}</p>
          </div>
          <div class="me-dua-principio">
            <div class="me-dua-titulo">II. Acción y Expresión</div>
            <p>${j.dua?.accion_expresion || ""}</p>
          </div>
          <div class="me-dua-principio">
            <div class="me-dua-titulo">III. Motivación</div>
            <p>${j.dua?.motivacion || ""}</p>
          </div>
        </div>
      </div>

      <div class="me-section">
        <div class="me-section-label">Mediación Pedagógica</div>
        <p>${j.mediacion_pedagogica || ""}</p>
      </div>

      ${peiHTML}

      <div class="me-acciones">
        <button class="me-btn-copy" onclick="metaEngine.copiarPlaneamiento()">Copiar texto</button>
        <button class="me-btn-json" onclick="metaEngine.verJSON()">Ver JSON</button>
        <button class="me-btn-export" onclick="metaEngine.exportar()">Exportar .docx</button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
//  API PÚBLICA — metaEngine
// ═══════════════════════════════════════════════════════════════

let _ultimoJSON = null;

const metaEngine = {

  /**
   * ejecutar(tipo, datos, contenedorId, apiKey?)
   * Función principal — ejecuta las dos capas completas
   */
  async ejecutar(tipo, datos, contenedorId, apiKey = null) {
    const prompt = buildPrompt(tipo, datos);
    const json   = await callClaude(prompt, apiKey);
    _ultimoJSON  = json;
    render(json, tipo, contenedorId);
    return json;
  },

  /** Devuelve el último JSON generado (para exportar, editar, etc.) */
  getJSON() { return _ultimoJSON; },

  /** Muestra el JSON crudo en un modal simple */
  verJSON() {
    if (!_ultimoJSON) return;
    const ventana = window.open("", "_blank");
    ventana.document.write(`<pre style="font-family:monospace;font-size:13px;padding:20px;background:#1a1e2a;color:#e8eaf0;min-height:100vh">${JSON.stringify(_ultimoJSON, null, 2)}</pre>`);
  },

  /** Copia el texto plano de la actividad */
  copiarActividad() {
    if (!_ultimoJSON || _ultimoJSON.tipo !== "actividad") return;
    const a = _ultimoJSON.actividad;
    const texto = [
      `ACTIVIDAD: ${a.titulo}`,
      `Habilidad MEP: [${_ultimoJSON.habilidad?.id}] ${_ultimoJSON.habilidad?.texto}`,
      `Duración: ${_ultimoJSON.duracion} · ${_ultimoJSON.organizacion}`,
      "",
      `OBJETIVO: ${a.objetivo}`,
      "",
      `INICIO (${a.inicio?.duracion}):`,
      a.inicio?.descripcion,
      "",
      `DESARROLLO (${a.desarrollo?.duracion}):`,
      a.desarrollo?.descripcion,
      ...(a.desarrollo?.pasos || []).map((p, i) => `  ${i + 1}. ${p}`),
      "",
      `CIERRE (${a.cierre?.duracion}):`,
      a.cierre?.descripcion,
      "",
      `MATERIALES: ${(a.materiales || []).join(", ")}`,
      "",
      `EVALUACIÓN (${a.evaluacion?.instrumento}):`,
      ...(a.evaluacion?.indicadores || []).map(i => `  • ${i}`),
      "",
      `ADECUACIONES NEE:`,
      ...(a.adecuaciones_nee || []).map(n => `  [${n.nee}] ${n.estrategia}`)
    ].join("\n");

    navigator.clipboard.writeText(texto).then(() => {
      metaEngine._flashBtn(".me-btn-copy", "¡Copiado!");
    });
  },

  /** Copia el texto plano del planeamiento */
  copiarPlaneamiento() {
    if (!_ultimoJSON || _ultimoJSON.tipo !== "planeamiento") return;
    const j = _ultimoJSON;
    const enc = j.encabezado || {};
    const lineas = [
      "PLANEAMIENTO MENSUAL MEP",
      `Dirección Regional: ${enc.direccion_regional}`,
      `Centro Educativo: ${enc.centro_educativo}`,
      `Docente: ${enc.docente}`,
      `Asignatura: ${enc.asignatura} · ${enc.anio_escolar} · ${enc.mes}`,
      ""
    ];
    (j.semanas || []).forEach(s => {
      lineas.push(`── SEMANA ${s.numero}: ${s.titulo} (${s.tiempo || ""}) ──`);
      lineas.push("Aprendizajes esperados:");
      (s.aprendizajes_esperados || []).forEach(a => lineas.push(`  • ${a}`));
      lineas.push("Estrategias metodológicas:");
      (s.estrategias_metodologicas || []).forEach(e => lineas.push(`  • ${e}`));
      lineas.push("Indicadores de evaluación:");
      (s.indicadores_evaluacion || []).forEach(i => lineas.push(`  • ${i}`));
      lineas.push("");
    });
    lineas.push("DUA — Representación: " + (j.dua?.representacion || ""));
    lineas.push("DUA — Acción y Expresión: " + (j.dua?.accion_expresion || ""));
    lineas.push("DUA — Motivación: " + (j.dua?.motivacion || ""));
    lineas.push("");
    lineas.push("MEDIACIÓN PEDAGÓGICA: " + (j.mediacion_pedagogica || ""));

    navigator.clipboard.writeText(lineas.join("\n")).then(() => {
      metaEngine._flashBtn(".me-btn-copy", "¡Copiado!");
    });
  },

  /** Exporta el resultado (por ahora .txt, preparado para docx.js) */
  exportar() {
    if (!_ultimoJSON) return;
    const enc = _ultimoJSON.encabezado || {};
    const nombre = `planeamiento_${enc.mes || "mes"}_${enc.anio_escolar || ""}.txt`
      .replace(/\s+/g, "_").toLowerCase();

    // Reutiliza copiarPlaneamiento pero escribe archivo
    const j = _ultimoJSON;
    const lineas = [];
    lineas.push("PLANEAMIENTO MENSUAL MEP\n");
    if (enc) {
      Object.entries(enc).forEach(([k, v]) => lineas.push(`${k}: ${v}`));
      lineas.push("");
    }
    (j.semanas || []).forEach(s => {
      lineas.push(`\n── SEMANA ${s.numero}: ${s.titulo} ──`);
      lineas.push("Aprendizajes: " + (s.aprendizajes_esperados || []).join(" | "));
      lineas.push("Estrategias: " + (s.estrategias_metodologicas || []).join(" | "));
      lineas.push("Indicadores: " + (s.indicadores_evaluacion || []).join(" | "));
    });
    if (j.dua) {
      lineas.push("\nDUA");
      lineas.push("Representación: " + j.dua.representacion);
      lineas.push("Acción y Expresión: " + j.dua.accion_expresion);
      lineas.push("Motivación: " + j.dua.motivacion);
    }
    if (j.mediacion_pedagogica) lineas.push("\nMediación pedagógica: " + j.mediacion_pedagogica);

    const blob = new Blob([lineas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  },

  _flashBtn(selector, texto) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = texto;
    setTimeout(() => btn.textContent = orig, 2000);
  }
};

// ═══════════════════════════════════════════════════════════════
//  ESTILOS DEL RENDERER (inyectados una sola vez)
// ═══════════════════════════════════════════════════════════════
(function injectStyles() {
  if (document.getElementById("me-styles")) return;
  const s = document.createElement("style");
  s.id = "me-styles";
  s.textContent = `
    /* ── Actividad ── */
    .me-actividad, .me-planeamiento {
      font-family: 'Literata', Georgia, serif;
      font-size: 14px;
      line-height: 1.7;
      color: var(--text, #e8eaf0);
    }
    .me-act-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .me-act-titulo {
      font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
      color: var(--text, #e8eaf0);
    }
    .me-act-meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .me-objetivo { margin-bottom: 20px; }
    .me-section-label {
      font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
      color: var(--accent, #3ecfb2); margin-bottom: 8px;
    }
    .me-fases { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .me-fase { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 14px 16px; border-left: 3px solid transparent; }
    .me-fase-inicio   { border-left-color: var(--accent, #3ecfb2); }
    .me-fase-desarrollo { border-left-color: var(--purple, #8b6ff5); }
    .me-fase-cierre   { border-left-color: var(--amber, #f0a832); }
    .me-fase-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .me-fase-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .me-fase-inicio .me-fase-dot   { background: var(--accent, #3ecfb2); }
    .me-fase-desarrollo .me-fase-dot { background: var(--purple, #8b6ff5); }
    .me-fase-cierre .me-fase-dot   { background: var(--amber, #f0a832); }
    .me-fase-nombre { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; }
    .me-fase-tiempo { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted, #7a7f96); margin-left: auto; }
    .me-pasos { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
    .me-paso { display: flex; gap: 10px; align-items: flex-start; }
    .me-paso-num {
      font-family: 'DM Mono', monospace; font-size: 11px;
      background: rgba(139,111,245,0.15); color: var(--purple, #8b6ff5);
      border-radius: 4px; padding: 2px 7px; flex-shrink: 0; margin-top: 2px;
    }
    .me-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .me-tag {
      font-family: 'DM Mono', monospace; font-size: 11px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px; padding: 3px 8px; color: var(--muted, #7a7f96);
    }
    .me-tag-id { background: rgba(62,207,178,0.08); border-color: rgba(62,207,178,0.2); color: var(--accent, #3ecfb2); }
    .me-nee-lista { display: flex; flex-direction: column; gap: 8px; }
    .me-nee-item { display: flex; gap: 10px; align-items: flex-start; }
    .me-nee-tag {
      font-family: 'DM Mono', monospace; font-size: 11px;
      background: rgba(240,168,50,0.1); border: 1px solid rgba(240,168,50,0.25);
      color: var(--amber, #f0a832); border-radius: 4px; padding: 2px 8px;
      flex-shrink: 0; white-space: nowrap;
    }
    .me-indicadores { padding-left: 18px; }
    .me-indicadores li { margin-bottom: 4px; }
    .me-section { margin-top: 20px; }

    /* ── Planeamiento ── */
    .me-encabezado-tabla { margin-bottom: 20px; }
    .me-enc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .me-enc-table td {
      padding: 10px 14px; border: 1px solid rgba(255,255,255,0.07);
      vertical-align: top; background: rgba(255,255,255,0.02);
    }
    .me-enc-label { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--accent, #3ecfb2); display: block; margin-bottom: 4px; }
    .me-tabla-wrap { overflow-x: auto; margin-bottom: 24px; }
    .me-tabla-semanas { width: 100%; border-collapse: collapse; font-size: 13px; }
    .me-tabla-semanas th {
      font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: .05em; text-transform: uppercase; color: var(--accent, #3ecfb2);
      padding: 10px 14px; border-bottom: 2px solid rgba(62,207,178,0.2);
      background: rgba(62,207,178,0.04); text-align: left;
    }
    .me-tabla-semanas td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
    .me-semana-num { min-width: 90px; }
    .me-num-badge {
      font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500;
      color: var(--accent, #3ecfb2); background: rgba(62,207,178,0.1);
      border: 1px solid rgba(62,207,178,0.2); border-radius: 6px;
      padding: 3px 10px; display: inline-block; margin-bottom: 6px;
    }
    .me-semana-titulo { font-size: 12px; font-weight: 600; color: var(--text, #e8eaf0); }
    .me-semana-tiempo { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted, #7a7f96); margin-top: 4px; }
    .me-lista-plan { padding-left: 16px; margin: 0; }
    .me-lista-plan li { margin-bottom: 5px; line-height: 1.5; }
    .me-dua-section { margin-top: 24px; }
    .me-dua-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 10px; }
    @media (max-width: 640px) { .me-dua-grid { grid-template-columns: 1fr; } }
    .me-dua-principio { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 14px; }
    .me-dua-titulo { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--purple, #8b6ff5); margin-bottom: 8px; }
    .me-pei-section { border: 1px solid rgba(240,168,50,0.25); border-radius: 10px; padding: 16px; background: rgba(240,168,50,0.04); }
    .me-pei-label { color: var(--amber, #f0a832) !important; }
    .me-pei-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 10px; }
    @media (max-width: 640px) { .me-pei-grid { grid-template-columns: 1fr; } }
    .me-subsection-label { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; color: var(--muted, #7a7f96); margin-bottom: 6px; letter-spacing: .04em; text-transform: uppercase; }
    .me-pei-obs { margin-top: 12px; font-style: italic; color: var(--muted, #7a7f96); font-size: 13px; }

    /* ── Acciones ── */
    .me-acciones { display: flex; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); flex-wrap: wrap; }
    .me-btn-copy, .me-btn-json, .me-btn-export {
      font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
      border: none; border-radius: 8px; padding: 9px 18px; cursor: pointer; transition: all .2s;
    }
    .me-btn-copy   { background: var(--accent, #3ecfb2); color: #0d0f14; }
    .me-btn-copy:hover { opacity: .85; }
    .me-btn-json   { background: rgba(255,255,255,0.07); color: var(--muted, #7a7f96); border: 1px solid rgba(255,255,255,0.1); }
    .me-btn-json:hover { color: var(--text, #e8eaf0); }
    .me-btn-export { background: rgba(139,111,245,0.15); color: var(--purple, #8b6ff5); border: 1px solid rgba(139,111,245,0.25); }
    .me-btn-export:hover { background: rgba(139,111,245,0.25); }
  `;
  document.head.appendChild(s);
})();
