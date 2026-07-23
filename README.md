# Cycling Manager Tour v0.26 · Stage Lab + salto de temporada

Esta versión conserva íntegramente la integración de **Grand Tour Stage Lab** de v0.25 y añade un planificador de calendario para el modo temporada.

Ahora puedes decidir qué carreras quieres disputar manualmente y cuáles deben simularse automáticamente para avanzar directamente hacia las grandes vueltas, monumentos, Mundial u otros objetivos prioritarios.

## Flujo de temporada v0.26

```text
Modo temporada
→ seleccionar carreras manuales/automáticas
→ seleccionar equipo
→ simulación automática de eventos no prioritarios
→ Grand Tour Stage Lab en la siguiente carrera manual
→ selección de 8 corredores
→ desarrollo normal de la competición
→ planificador entre carreras
```

Las pruebas marcadas como **JUGAR** conservan el flujo completo:

```text
Stage Lab → GPX → perfil Radial → convocatoria → carrera con física a 250 m
```

Las pruebas marcadas como **AUTO** se resuelven en segundo plano y el calendario continúa automáticamente.

---

## Funciones nuevas v0.26

### Planificador de calendario

En la pantalla inicial del modo temporada aparece un panel con las 36 carreras. Cada evento puede configurarse como:

- **JUGAR:** abre Grand Tour Stage Lab y continúa con la convocatoria y carrera normal.
- **AUTO:** se simula automáticamente sin abrir Stage Lab ni detener el calendario.

### Presets incluidos

- Todo el calendario.
- Solo grandes vueltas.
- Grandes vueltas + monumentos + Mundial.
- Todas las vueltas por etapas.
- Selección personalizada.
- Marcar todas las carreras restantes.
- Simular todas las carreras restantes.

### Salto directo desde “Entre carreras”

Después de terminar un evento puedes seleccionar cualquier competición futura y pulsar:

```text
Simular hasta este evento
```

El juego procesa automáticamente todas las carreras intermedias y abre Grand Tour Stage Lab en el objetivo seleccionado.

### Simular la carrera actual desde Stage Lab

La cabecera de Stage Lab incorpora el botón:

```text
Simular esta carrera y continuar
```

Permite cambiar de decisión sin volver al menú inicial.

### Progreso y parada segura

Durante el salto se muestra:

- carrera que se está simulando;
- objetivo final;
- carreras completadas;
- porcentaje de progreso;
- resultados recientes;
- botón para detenerse después de la carrera actual.

---

## Modelo de simulación automática

Las carreras omitidas utilizan un **motor deportivo condensado v0.26** diseñado para avanzar el calendario rápidamente sin ejecutar cada kilómetro de forma visual.

El resultado de cada etapa sigue considerando:

- atributos específicos del terreno;
- rol del corredor;
- forma y fatiga;
- CP relativo y W′;
- durabilidad fisiológica;
- readiness y objetivos A/B/C;
- material y neumáticos;
- clima, pavé y riesgo técnico;
- CRI y CRE;
- penalización de sprinters en montaña;
- agrupamiento y diferencias por tipo de etapa.

También se conservan y actualizan:

- clasificaciones y tiempos acumulados;
- victorias de etapa y carrera;
- puntos UCI;
- fatiga, forma, moral y días de competición;
- objetivos del sponsor;
- contratos y promesas;
- scouting y mentoría;
- palmarés y récords;
- entrenamiento entre carreras;
- historial de temporada.

Las carreras jugadas manualmente siguen utilizando el motor GPX completo de v0.25, con subpasos físicos de **250 m**, CP/W′, grupos, ataques, viento, drafting, nutrición y telemetría.

---

## Grand Tour Stage Lab

Stage Lab sigue conectado a los **36 eventos** del calendario y mantiene:

- generación y edición de recorridos;
- rutas GPX;
- enrutado opcional OpenStreetMap/Valhalla;
- mapa 2D y terreno 3D;
- perfil interactivo;
- puertos y sectores;
- exportación GPX y ZIP;
- transferencia directa al motor del manager.

La colorimetría Radial se conserva sin cambios:

| Pendiente | Color |
|---:|---|
| ≤ −9 % | `#1a4bff` |
| −9 a −6 % | `#2c7cff` |
| −6 a −3 % | `#2bb2ff` |
| −3 a −1 % | `#24c6c6` |
| −1 a 1,5 % | `#14b81f` |
| 1,5 a 3 % | `#63cf15` |
| 3 a 5 % | `#b5c718` |
| 5 a 7 % | `#e4c625` |
| 7 a 9 % | `#ee9430` |
| > 9 % | `#dd5a22` |

---

## Instalación en GitHub Pages

1. Descomprime el ZIP.
2. Sube **todo el contenido** a la raíz del repositorio.
3. Mantén intacta la carpeta `stage-lab/`.
4. Activa GitHub Pages desde la rama principal y la carpeta raíz.
5. Realiza una recarga forzada después de sustituir la versión anterior.

Ejecución local:

```bash
python -m http.server 8080
```

Después abre:

```text
http://localhost:8080
```

No se recomienda abrir directamente con `file://` porque el iframe y los mapas pueden quedar restringidos por el navegador.

---

## Archivos principales

```text
index.html
styles.css
v024.css
gpx.css
stage-lab-integration.css
v026.css

data.js
v024-data.js
gpx-stage-data.js
gpx-engine.js
game.js
v024-expansion.js
gpx-integration.js
v024-plus-fix.js
stage-lab-integration.js
v026-season-skip.js

stage-lab/
```

`v026-season-skip.js` debe cargarse el último, ya que amplía los flujos de inicio, calendario, Stage Lab, pantalla entre carreras, guardado y final de temporada.

---

## Guardado y compatibilidad

La versión declarada es:

```text
v0.26
```

Se mantiene la clave histórica:

```text
cyclingManager_v024
```

El cargador acepta partidas de v0.24, v0.24+, v0.25 y v0.26. Para una prueba completamente limpia se recomienda pulsar **Borrar guardado** al sustituir la versión anterior.
