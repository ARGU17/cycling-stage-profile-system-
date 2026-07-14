# Cycling Manager Tour v0.24 · Integración GPX real

Esta versión integra los recorridos GPX proporcionados dentro del simulador completo v0.24, conservando el motor de corredores, CP/W′, formaciones, ataques, grupos, nutrición, material, IA rival, telemetría, contratos, staff y temporada.

## Arranque

No abras `index.html` directamente con `file://`, porque algunos navegadores restringen recursos locales. Ejecuta un servidor estático:

```bash
python -m http.server 8080
```

Después abre:

```text
http://localhost:8080
```

También puedes subir todos los archivos a la raíz de un repositorio y activar GitHub Pages.

## Carrera recomendada

En **Carrera única**, selecciona:

```text
Tour de France 2026 · GPX reales
```

Esta carrera contiene exclusivamente los 18 GPX disponibles:

```text
1, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 y 21
```

Las etapas 3, 4 y 5 no estaban incluidas en los archivos recibidos y por eso no aparecen en la carrera GPX-only.

El Tour de France original también se conserva para mantener compatibilidad con el juego anterior. En ese evento, 18 etapas usan GPX real y las etapas 3, 4 y 5 mantienen el perfil sintético previo.

## Qué cambia en el motor

### Geometría y altimetría

Cada GPX se procesa con:

- distancia acumulada geodésica;
- remuestreo cada 20 m;
- filtro mediano para picos espurios;
- suavizado de elevación;
- pendiente calculada en una ventana centrada de 100 m;
- coordenadas latitud/longitud asociadas a cada muestra.

### Resolución de simulación

El motor v0.24 original trabajaba internamente por kilómetros. En las etapas GPX se ha sustituido por subpasos de:

```text
250 m
```

En cada subpaso se mantienen:

- física de potencia y velocidad;
- CP y W′;
- drafting y posición en grupo;
- fatiga, energía e hidratación;
- neumáticos, rodadura y material;
- riesgo de caída o pinchazo;
- formación del grupo;
- autobús;
- ataques y respuestas;
- telemetría.

Los eventos probabilísticos que antes se evaluaban una vez por kilómetro siguen evaluándose una vez por kilómetro para evitar multiplicar artificialmente ataques, abanicos o alertas.

### Viento ligado al recorrido

En etapas GPX, el viento deja de depender solo de una oscilación ficticia. El motor calcula el rumbo local de la carretera y descompone el viento en:

- componente frontal;
- componente lateral;
- exposición al abanico.

## Visualización

Cada etapa GPX incluye:

- perfil altimétrico coloreado a alta frecuencia;
- cursor interactivo;
- lectura de km recorrido;
- distancia restante;
- elevación;
- pendiente local;
- navegación con ratón, arrastre, rueda, táctil y teclado;
- recorrido real proyectado desde latitud/longitud;
- grupos colocados sobre la ruta;
- tramo completado destacado;
- sectores generados a partir del terreno real.

## Colores de pendiente

La escala está inspirada en Radial:

- descenso muy fuerte: azul oscuro;
- descenso: azul/celeste;
- falso llano descendente: turquesa;
- llano: verde;
- subida suave: verde lima;
- subida media: amarillo;
- subida dura: naranja;
- pendiente extrema: naranja oscuro.

## Orden de carga de scripts

El orden de `index.html` es importante:

```text
data.js
v024-data.js
gpx-stage-data.js
gpx-engine.js
game.js
v024-expansion.js
gpx-integration.js
```

- `gpx-stage-data.js` contiene los datos procesados.
- `gpx-engine.js` modifica las etapas antes de iniciar el juego.
- `gpx-integration.js` conecta el GPX con la física y la interfaz después de cargar v0.24.

## Archivos nuevos

```text
gpx-stage-data.js
gpx-engine.js
gpx-integration.js
gpx.css
gpx/
tools/build_stage_data.py
tools/rebuild_gpx_data.py
```

## Añadir más etapas GPX

1. Copia el archivo en `gpx/`.
2. Usa el nombre:

```text
stage-3-parcours.gpx
```

3. Ejecuta:

```bash
python tools/rebuild_gpx_data.py
```

4. Recarga el navegador borrando caché.

El script regenerará `gpx-stage-data.js`.

## Guardado

Se mantiene la clave de guardado de v0.24:

```text
cyclingManager_v024
```

Para una primera prueba de esta integración, se recomienda pulsar **Borrar guardado** y empezar una nueva partida, evitando estados antiguos asociados a distancias o sectores diferentes.

## Limitaciones actuales

- El mapa es una proyección autónoma de la geometría real, sin teselas externas.
- No se han añadido carreteras, poblaciones ni cartografía base.
- Los puntos de sprint, puertos oficiales y nombres geográficos no vienen identificados en los GPX suministrados; las ascensiones y sectores se detectan automáticamente.
- Las etapas 3, 4 y 5 necesitan sus GPX para completar el Tour real de 21 etapas.
