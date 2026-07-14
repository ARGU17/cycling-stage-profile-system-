# Cycling Stage Profile System

Sistema independiente, listo para integrarse más tarde en tu proyecto **Cycling Manager**, para:

- cargar archivos GPX de etapas,
- generar perfiles altimétricos tipo **Radial**,
- colorearlos por pendiente con alta frecuencia,
- inspeccionar el perfil de forma interactiva,
- sincronizar un cursor de perfil con una vista del recorrido.

---

## Qué incluye

### Frontend estático
- `index.html`
- `styles.css`
- `js/app.js`
- `js/profile-viewer.js`
- `js/route-mini-map.js`
- `js/colors.js`

### Datos generados
- `data/manifest.json`
- `data/stage-*.json`

### Fuente y build
- `gpx/*.gpx`
- `scripts/build_stage_data.py`

---

## Cómo arrancarlo

### Opción rápida local
Desde la carpeta del proyecto:

```bash
python -m http.server 8080
```

Y abre:

```text
http://localhost:8080
```

### Opción GitHub Pages
Sube esta carpeta tal cual a tu repo y publícala como sitio estático.

---

## Cómo regenerar los datos si añades más GPX

1. Mete los nuevos archivos en `gpx/`.
2. Ejecuta:

```bash
python scripts/build_stage_data.py
```

Esto regenerará:
- `data/manifest.json`
- todos los `data/stage-*.json`

---

## Pipeline técnico actual

1. Lee el GPX.
2. Calcula distancia acumulada.
3. Remuestrea la etapa cada **20 m**.
4. Aplica filtrado de elevación:
   - mediana de 5 muestras
   - media móvil de 9 muestras
5. Calcula pendiente en ventana centrada de **100 m**.
6. Guarda un JSON optimizado para visualización.

---

## Reglas de coloreado de pendiente

Inspiradas en la captura de Radial:

- descenso fuerte: azules
- descenso moderado: celeste / turquesa
- llano: verde
- subida suave: verde lima
- subida media: amarillo
- subida dura: naranja
- muy dura: naranja oscuro

La lógica está en:

- `js/colors.js`

Si luego quieres afinar más el parecido visual con Radial, basta con ajustar esos bins.

---

## Interacción actual

- mover ratón sobre el perfil -> muestra km, km a meta, altitud y pendiente
- arrastrar sobre el perfil -> desplaza el cursor
- rueda del ratón -> avanza/retrocede sobre el perfil
- slider inferior -> scrub manual de la etapa
- sincronización con el mapa de recorrido

---

## Integración futura con Cycling Manager

Este sistema está preparado para desacoplarse en módulos:

### Módulos principales
- `ProfileViewer`
- `RouteMiniMap`
- `StageStore` implícito vía `manifest + stage json`

### Siguiente paso recomendado
Cuando lo metas en el simulador, lo ideal es separar:

- `core/stage-data/`
- `ui/profile/`
- `ui/map/`
- `simulation/position-sync/`

Y conectar el perfil a una variable maestra del simulador, por ejemplo:

```js
raceState.distanceMeters
```

Así podrás:

- mover automáticamente el cursor del perfil según el avance real de carrera,
- poner corredores/gupos sobre el mapa,
- calcular gradiente local para la física,
- disparar lógica táctica según terreno.

---

## Mejoras siguientes que te recomiendo

1. **MapLibre + mapa real** en vez de mini-mapa abstracto.
2. **Marcado automático de puertos, sprints y cotas**.
3. **Zoom horizontal en perfil**.
4. **Simplificación multi-resolución** para perfiles muy largos.
5. **Cálculo de pendiente por varias ventanas**: 50m, 100m, 500m.
6. **Exportación de segmentos tácticos** para el motor del simulador.
7. **Integración 3D** con terreno real.

---

## Etapas incluidas ahora

Se han generado los datos para los GPX que me pasaste:

- Stage 1
- Stage 2
- Stage 6
- Stage 7
- Stage 8
- Stage 9
- Stage 10
- Stage 11
- Stage 12
- Stage 13
- Stage 14
- Stage 15
- Stage 16
- Stage 17
- Stage 18
- Stage 19
- Stage 20
- Stage 21

Si me pasas también las etapas 3, 4 y 5, te dejo el bloque completo del Tour preparado igual.
