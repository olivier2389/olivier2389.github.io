/**
 * APP.JS — Lógica principal de EduPrompt NEE
 * v3.1 · MEP Costa Rica
 */

const MATERIAS_CONFIG = {
  matematica: {
    id:      'matematica',
    nombre:  '📐 Matemáticas',
    archivo: 'data/curriculo_matematica.json',
    loaded:  false,
    data:    null
  },
};

const AppState = {
  materiaActual:    'matematica',
  curriculumData:   null,
  selectedNEE:      [],
  selectedTemplate: 'indagacion',
};

const Adapter = {
  getCycles(data) {
    return data?.cycles || [];
  },
  cycleName(cycle) {
    return cycle.name || cycle.ciclo || '';
  },
  getLevels(cycle) {
    return cycle.levels || cycle.niveles || [];
  },
  levelName(level) {
    return level.name || level.nivel || '';
  },
  getAreas(level) {
    return level.areas || [];
  },
  areaName(area) {
    return area.name || area.nombre || '';
  },
  getHabilidades(area) {
    if (Array.isArray(area.habilidades) && area.habilidades.length > 0) {
      return area.habilidades.filter(h => {
        const tipo = h.tipo || 'habilidad';
        return tipo === 'habilidad';
      });
    }
    const skills = area.core_concepts?.flatMap(cc => cc.skills || [])
                   || area.skills
                   || [];
    return skills.filter(sk => {
      const desc = sk.description || sk.descripcion || '';
      return (
        sk.code !== 'HG' &&
        desc.length > 10 &&
        !_esNotaDocente(desc)
      );
    });
  },
  skillDesc(skill) {
    return skill.descripcion || skill.description || '';
  },
  skillCode(skill) {
    return skill.id || skill.id_global || skill.code || '';
  },
  skillIndicators(skill) {
    if (Array.isArray(skill.indicadores_logro)) {
      return skill.indicadores_logro.map(i =>
        typeof i === 'string' ? i : (i.descripcion || i.description || '')
      );
    }
    if (Array.isArray(skill.indicators)) {
      return skill.indicators.map(i =>
        typeof i === 'string' ? i : (i.description || '')
      ).filter(Boolean);
    }
    return [];
  },
  skillEjes(skill) {
    return skill.ejes_curriculares || skill.ejes || [];
  },
};

const _PATRONES_NOTA = [
  /^Es importante/i,
  /^Con respecto a/i,
  /^Para (el desarrollo|facilitar|trabajar|abordar|introducir)/i,
  /^Al (usar|trabajar|comparar|comenzar|ordenar|analizar)/i,
  /^Uno de los resultados/i,
  /^Nótese que/i,
  /^Cabe destacar/i,
  /^Desde el punto de vista/i,
  /^Nota:/i,
  /^NOTA:/i,
  /^Propuesta de un problema/i,
  /^Trabajo estudiantil independiente/i,
  /^Discusión interactiva/i,
  /^Clausura o cierre/i,
  /(se recomienda|se sugiere|es conveniente|es pertinente)/i,
  /(reseña histórica|historia de las matemáticas)/i,
];

function _esNotaDocente(desc) {
  return _PATRONES_NOTA.some(re => re.test(desc));
}

function truncarTexto(texto, limite = 80) {
  if (!texto || texto.length <= limite) return texto;
  const corte = texto.lastIndexOf(' ', limite);
  return texto.substring(0, corte > 0 ? corte : limite) + '…';
}

document.addEventListener('DOMContentLoaded', () => {
  renderMaterias();
  renderTemplates();
  loadMateria('matematica');
});

function renderMaterias() {
  const sel = document.getElementById('sel_materia_header');
  if (!sel) return;
  sel.innerHTML = '';
  Object.values(MATERIAS_CONFIG).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nombre;
    sel.appendChild(opt);
  });
}

function cambiarMateria() {
  const sel = document.getElementById('sel_materia_header');
  loadMateria(sel.value);
}

async function loadMateria(materiaId) {
  const materia = MATERIAS_CONFIG[materiaId];
  if (!materia) return;

  AppState.materiaActual = materiaId;
  showLoading(`Cargando ${materia.nombre}...`);

  try {
    if (materia.loaded && materia.data) {
      AppState.curriculumData = materia.data;
      hideLoading();
      populateCiclos();
      return;
    }

    const res = await fetch(materia.archivo);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    materia.data   = data;
    materia.loaded = true;
    AppState.curriculumData = data;

    hideLoading();
    populateCiclos();

    const stats = data.extraction_stats || data.metadata || {};
    const total = stats.total_habilidades || stats.total_habilidades_reales || stats.total_skills || '—';
    console.log(`✅ ${materia.nombre} cargada: ${total} habilidades`);

  } catch (err) {
    hideLoading();
    console.error('Error cargando materia:', err);
    showError(`No se pudo cargar ${materia.nombre}. Verifica que el archivo JSON existe en data/.`);
  }
}

function showLoading(msg) {
  const el  = document.getElementById('loadingScreen');
  const txt = document.getElementById('loadingText');
  if (el)  el.classList.remove('hidden');
  if (txt) txt.textContent = msg || 'Cargando...';
}

function hideLoading() {
  const el = document.getElementById('loadingScreen');
  if (el) el.classList.add('hidden');
}

function showError(msg) {
  const hint = document.getElementById('hintMsg');
  if (hint) { hint.textContent = msg; hint.style.display = 'block'; }
  else alert(msg);
}

function populateCiclos() {
  const sel = document.getElementById('sel_ciclo');
  if (!sel || !AppState.curriculumData) return;

  sel.innerHTML = '<option value="">— Elige un ciclo —</option>';

  const names = {
    'PRIMER_CICLO':        '📚 Primer Ciclo (1° – 3°)',
    'TERCER_CICLO':        '📚 Tercer Ciclo (7° – 9°)',
    'CICLO_DIVERSIFICADO': '📚 Ciclo Diversificado (10° – 11°)',
  };

  Adapter.getCycles(AppState.curriculumData).forEach(cycle => {
    const name = Adapter.cycleName(cycle);
    const opt  = document.createElement('option');
    opt.value       = name;
    opt.textContent = names[name] || name;
    sel.appendChild(opt);
  });

  sel.disabled = false;
  resetSelectores(['sel_nivel', 'sel_area', 'sel_habilidad']);
  document.getElementById('infoBox')?.classList.remove('visible');
}

function updateNiveles() {
  const cicloName = document.getElementById('sel_ciclo').value;
  const sel       = document.getElementById('sel_nivel');
  sel.innerHTML   = '<option value="">— Elige un nivel —</option>';

  if (!cicloName) { sel.disabled = true; return; }

  const cycles = Adapter.getCycles(AppState.curriculumData);
  const cycle  = cycles.find(c => Adapter.cycleName(c) === cicloName);
  if (!cycle) return;

  const levelLabels = {
    '1':'1° año','2':'2° año','3':'3° año',
    '4':'4° año','5':'5° año','6':'6° año',
    '7':'7° año','8':'8° año','9':'9° año',
    '10':'10° año','11':'11° año',
    '1-3':'1°, 2° y 3° año (todos)',
    '7-9':'7°, 8° y 9° año (todos)',
  };

  [...Adapter.getLevels(cycle)]
    .forEach(level => {
      const n   = Adapter.levelName(level);
      const opt = document.createElement('option');
      opt.value       = n;
      opt.textContent = levelLabels[n] || `${n}° año`;
      sel.appendChild(opt);
    });

  sel.disabled = false;
  resetSelectores(['sel_area', 'sel_habilidad']);
}

function updateAreas() {
  const cicloName = document.getElementById('sel_ciclo').value;
  const nivelName = document.getElementById('sel_nivel').value;
  const sel       = document.getElementById('sel_area');
  sel.innerHTML   = '<option value="">— Elige un área —</option>';

  if (!nivelName) { sel.disabled = true; return; }

  const cycles = Adapter.getCycles(AppState.curriculumData);
  const cycle  = cycles.find(c => Adapter.cycleName(c) === cicloName);
  const levels = Adapter.getLevels(cycle || {});
  const level  = levels.find(l => Adapter.levelName(l) === nivelName);
  if (!level) return;

  Adapter.getAreas(level).forEach(area => {
    const nombre = Adapter.areaName(area);
    const opt    = document.createElement('option');
    opt.value       = nombre;
    opt.textContent = nombre;
    sel.appendChild(opt);
  });

  sel.disabled = false;
  resetSelectores(['sel_habilidad']);
}

function updateHabilidades() {
  const cicloName = document.getElementById('sel_ciclo').value;
  const nivelName = document.getElementById('sel_nivel').value;
  const areaName  = document.getElementById('sel_area').value;
  const sel       = document.getElementById('sel_habilidad');
  sel.innerHTML   = '<option value="">— Elige una habilidad —</option>';

  if (!areaName) { sel.disabled = true; return; }

  const cycles = Adapter.getCycles(AppState.curriculumData);
  const cycle  = cycles.find(c => Adapter.cycleName(c) === cicloName);
  const levels = Adapter.getLevels(cycle || {});
  const level  = levels.find(l => Adapter.levelName(l) === nivelName);
  const areas  = Adapter.getAreas(level || {});
  const area   = areas.find(a => Adapter.areaName(a) === areaName);
  if (!area) return;

  const habilidades = Adapter.getHabilidades(area);

  if (habilidades.length === 0) {
    const opt = document.createElement('option');
    opt.value       = '';
    opt.textContent = '— Sin habilidades en esta área —';
    opt.disabled    = true;
    sel.appendChild(opt);
    sel.disabled = false;
    return;
  }

  habilidades.forEach((skill, i) => {
    const desc = Adapter.skillDesc(skill);
    const code = Adapter.skillCode(skill);
    const opt  = document.createElement('option');
    opt.value  = i;
    const label = code ? `${code}. ${truncarTexto(desc, 75)}` : truncarTexto(desc, 80);
    opt.textContent = label;
    opt.dataset.skill = JSON.stringify({
      code:        code,
      description: desc,
      indicators:  Adapter.skillIndicators(skill),
      ejes:        Adapter.skillEjes(skill),
    });
    sel.appendChild(opt);
  });

  sel.disabled = false;
  document.getElementById('infoBox')?.classList.remove('visible');
}

function showSkillInfo() {
  const sel     = document.getElementById('sel_habilidad');
  const opt     = sel?.options[sel.selectedIndex];
  const infoBox = document.getElementById('infoBox');
  const content = document.getElementById('infoBoxContent');

  if (!opt?.dataset.skill || !infoBox || !content) return;

  const skill      = JSON.parse(opt.dataset.skill);
  const indicators = skill.indicators || [];
  const ejes       = skill.ejes || [];

  let html = `<div class="ib-tag">📌 Habilidad seleccionada</div>`;
  html    += `<div class="ib-skill"><b>${skill.code ? skill.code + '. ' : ''}${skill.description}</b></div>`;

  if (ejes.length > 0) {
    html += `<div class="ib-tag" style="margin-top:.5rem">🎯 Ejes curriculares</div>`;
    html += ejes.map(e => `<div class="ib-ind">${e.replace(/_/g, ' ')}</div>`).join('');
  }

  html += `<div class="ib-tag" style="margin-top:.5rem">📋 Indicadores de logro</div>`;
  if (indicators.length > 0) {
    html += indicators.map(ind =>
      `<div class="ib-ind">${typeof ind === 'string' ? ind : ind.description}</div>`
    ).join('');
  } else {
    html += '<div class="ib-ind" style="color:var(--text-muted)">Sin indicadores en esta versión del JSON</div>';
  }

  content.innerHTML = html;
  infoBox.classList.add('visible');
  markStepDone('num1');
}

function resetSelectores(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">— Elige primero el campo anterior —</option>`;
    el.disabled  = true;
  });
}

function toggleNEE(chip) {
  chip.classList.toggle('selected');
  const nee = chip.dataset.nee;
  if (chip.classList.contains('selected')) {
    AppState.selectedNEE.push(nee);
  } else {
    AppState.selectedNEE = AppState.selectedNEE.filter(n => n !== nee);
  }
}

function renderTemplates() {
  const grid = document.getElementById('templateGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.values(TEMPLATE_REGISTRY).forEach(tpl => {
    const card       = document.createElement('div');
    card.className   = `tpl-card${tpl.id === AppState.selectedTemplate ? ' selected' : ''}`;
    card.dataset.id  = tpl.id;
    card.onclick     = () => selectTemplate(tpl.id);
    card.innerHTML   = `
      <div class="tpl-icon">${tpl.icon}</div>
      <div class="tpl-name">${tpl.nombre}</div>
      <div class="tpl-desc">${tpl.desc}</div>
    `;
    grid.appendChild(card);
  });
}

function selectTemplate(id) {
  AppState.selectedTemplate = id;
  document.querySelectorAll('.tpl-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });
}

function generatePrompt() {
  const cicloName   = document.getElementById('sel_ciclo').value;
  const nivelName   = document.getElementById('sel_nivel').value;
  const areaName    = document.getElementById('sel_area').value;
  const habSel      = document.getElementById('sel_habilidad');
  const habOpt      = habSel?.options[habSel.selectedIndex];
  const adecuacion  = document.getElementById('sel_adecuacion')?.value  || '';
  const duracion    = document.getElementById('sel_duracion')?.value    || '45 minutos';
  const grupo       = document.getElementById('sel_grupo')?.value       || 'Pequeños grupos';
  const recursos    = document.getElementById('sel_recursos')?.value    || 'Material básico';
  const complejidad = document.getElementById('sel_complejidad')?.value || 'Estándar (balanceado)';
  const extra       = document.getElementById('ctx_adicional')?.value?.trim() || '';

  if (!AppState.curriculumData) {
    showError('⚠️ El currículo no está cargado. Recarga la página.'); return;
  }
  if (!nivelName) {
    showError('⚠️ Selecciona ciclo, nivel y área en el Paso 1.'); return;
  }

  let skill      = areaName ? `Área: ${areaName}` : 'No especificada';
  let indicators = [];

  if (habOpt?.dataset.skill) {
    const skillObj = JSON.parse(habOpt.dataset.skill);
    skill          = skillObj.code
                       ? `${skillObj.code}. ${skillObj.description}`
                       : skillObj.description;
    indicators     = skillObj.indicators || [];
  }

  const levelLabels = {
    '1':'1er año','2':'2do año','3':'3er año','4':'4to año',
    '5':'5to año','6':'6to año','7':'7mo año','8':'8vo año',
    '9':'9no año','10':'10mo año','11':'11mo año',
    '1-3':'1°, 2° y 3° año','7-9':'7°, 8° y 9° año',
  };
  const cicloLabels = {
    'PRIMER_CICLO':        'Primer Ciclo',
    'TERCER_CICLO':        'Tercer Ciclo (Educación General Básica)',
    'CICLO_DIVERSIFICADO': 'Ciclo Diversificado',
  };

  const materia = MATERIAS_CONFIG[AppState.materiaActual];

  const prompt = MetaPromptEngine.generate({
    system:       'MEP Costa Rica',
    level:        `${levelLabels[nivelName] || nivelName} — ${cicloLabels[cicloName] || cicloName}`,
    subject:      `${materia?.nombre?.replace(/📐|🔬|📚/g,'').trim() || 'Matemáticas'} — ${areaName || 'Área no especificada'}`,
    skill,
    indicators,
    nee:          AppState.selectedNEE,
    neeType:      adecuacion,
    duration:     duracion,
    organization: grupo,
    resources:    recursos,
    complexity:   complejidad,
    template:     AppState.selectedTemplate,
    extra
  });

  const output   = document.getElementById('promptOutput');
  const textarea = document.getElementById('promptText');
  const stats    = document.getElementById('promptStats');
  const hint     = document.getElementById('hintMsg');

  if (textarea) textarea.value = prompt;
  if (output)   output.classList.add('visible');
  if (hint)     hint.style.display = 'none';

  if (stats) {
    const words = prompt.split(/\s+/).length;
    stats.textContent = `${words} palabras · ${prompt.length} chars`;
  }

  document.getElementById('btnCopy')?.style.setProperty('display', 'inline-flex');
  document.getElementById('btnClear')?.style.setProperty('display', 'inline-flex');

  markStepDone('num2');
  markStepDone('num3');
  markStepDone('num4');

  output?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyPrompt() {
  const text = document.getElementById('promptText')?.value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btnCopy');
    if (btn) {
      btn.textContent = '✅ Copiado';
      setTimeout(() => btn.innerHTML = '📋 Copiar prompt', 1800);
    }
  });
}

function clearPrompt() {
  document.getElementById('promptOutput')?.classList.remove('visible');
  document.getElementById('btnCopy')?.style.setProperty('display', 'none');
  document.getElementById('btnClear')?.style.setProperty('display', 'none');
  const ta = document.getElementById('promptText');
  if (ta) ta.value = '';
}

function copyDevPrompt() {
  const blocks = document.querySelectorAll('.dev-body .code-block');
  const last   = blocks[blocks.length - 1];
  if (!last) return;
  navigator.clipboard.writeText(last.textContent).then(() => {
    alert('Prompt de continuación copiado ✅');
  });
}

function toggleStep(id) {
  document.getElementById(id)?.classList.toggle('open');
}

function toggleDev() {
  const panel = document.getElementById('devPanel');
  panel?.classList.toggle('open');
  const tog = document.getElementById('devToggle');
  if (tog) tog.textContent = panel?.classList.contains('open') ? '▲' : '▼';
}

function markStepDone(numId) {
  const el = document.getElementById(numId);
  if (el) { el.classList.add('done'); el.textContent = '✓'; }
}

// async function sendToAPI(prompt) { ... }
// const EduStorage = { ... }