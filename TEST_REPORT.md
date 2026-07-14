# Informe de validación · Motor GPX

## Sintaxis

Comprobación `node --check` superada:

- `data.js`
- `v024-data.js`
- `gpx-stage-data.js`
- `gpx-engine.js`
- `game.js`
- `v024-expansion.js`
- `gpx-integration.js`

## Datos

- 18 etapas GPX cargadas.
- Carrera GPX-only con 18 etapas.
- Todas las etapas de dicha carrera tienen `gpxAvailable = true`.
- Resolución altimétrica base: 20 m.
- Resolución física: 250 m.

## Pruebas de integración

### Etapa 10 GPX

- ID: `tour_10`
- Distancia: 167.09 km.
- Desnivel positivo: 3713 m.
- Puntos GPX procesados: 8356.
- Sectores generados: 24.
- Simulación de primer sector completada.
- Estado del líder actualizado de 0 km a 6.1 km.
- Telemetría generada en 25 subpasos.

### CRE GPX

- Etapa 1 tratada como CRE.
- Primer sector simulado.
- Telemetría física por subpasos de 250 m.

### CRI GPX

- Etapa 16 tratada como CRI.
- Primer sector simulado.
- Pendiente GPX aplicada al cálculo físico.

### Etapa completa

- Etapa 10 simulada completamente.
- 272 corredores clasificados.
- Resultado de etapa y estado de carrera producidos sin perder sistemas v0.24.

## Compatibilidad

Las carreras sin GPX siguen utilizando exactamente el motor y los perfiles anteriores.


## Validación v0.24+

Confirmadas carrera única, carrera GPX, temporada, selección manual de ocho corredores, almacenamiento bloqueado y simulación del primer sector GPX.
