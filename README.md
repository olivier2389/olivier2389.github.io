# EduPrompt NEE · MEP Costa Rica

Motor de generación de prompts pedagógicos con adecuaciones curriculares para el sistema educativo costarricense.

## 🚀 Uso

1. Abrir `index.html` en el navegador (o publicar en GitHub Pages)
2. Seleccionar ciclo → nivel → área → habilidad
3. Configurar NEE con los chips
4. Elegir plantilla pedagógica
5. Generar y copiar el prompt

## 📁 Estructura

```
eduprompt-nee/
├── index.html                  # Página principal
├── css/styles.css              # Diseño
├── js/
│   ├── metaPromptEngine.js     # Núcleo de prompts
│   ├── templateRegistry.js     # Plantillas pedagógicas
│   └── app.js                  # Lógica principal
└── data/
    └── curriculo_matematica.json  # 854 habilidades MEP 2014
```

## 🔌 Expandir el proyecto

### Agregar nueva plantilla
Editar `js/templateRegistry.js` y agregar objeto con `{id, icon, nombre, desc, estructura}`.

### Agregar nueva materia
1. Generar JSON con el extractor Python
2. Colocar en `data/curriculo_[materia].json`
3. Descomentar entrada en `MATERIAS_CONFIG` de `js/app.js`

### Conectar a API de IA
Descomentar `sendToAPI()` en `js/app.js` y agregar API key.

## 👨‍🏫 Autor
Profesor Carlos Elizondo Castillo · MEP Costa Rica
