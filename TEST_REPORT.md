# Informe de validación · v0.28 Graphite Performance

## Sintaxis

- Todos los JavaScript de la raíz: correctos.
- Todos los JavaScript de `stage-lab`: correctos.
- `v028.js`: sintaxis válida.
- `tools/smoke_test_v028_ui.js`: sintaxis válida.
- Referencias nuevas en `index.html`: presentes.
- Referencia `stage-lab/v028-stage-lab.css`: presente.

## Prueba visual y funcional v0.28

Ejecutada con:

```bash
node tools/smoke_test_v028_ui.js
```

Resultado:

- Cuatro tarjetas de modo renderizadas.
- Stepper v0.28 renderizado.
- Tarjetas de carreras renderizadas.
- Mini perfiles SVG generados.
- Filtro de grandes vueltas funcional.
- Selector visual de equipos funcional.
- Filtro WT funcional.
- Selección y confirmación de equipo funcional.
- Stage Lab abre después de confirmar equipo.
- Convocatoria v0.28 renderizada.
- Confirmación de convocatoria funcional.
- Simulación completa con resultados y tiempos finitos.
- 34 equipos 2026.
- 927 registros de corredor 2026.
- 1.000 profesionales de staff.
- 1.000 corredores U23.

## Regresión de integración GPX

Ejecutada con:

```bash
node tools/smoke_test_v028.js
```

Resultado:

- Asistente inicial operativo.
- GPX integrados en el calendario.
- Stage Lab operativo.
- Aceptación de un recorrido GPX correcta.
- Sectores y perfil GPX generados.
- Convocatoria y simulación válidas.
- Temporada y multi-era operativos.
- UAE Tour no se confunde con Tour de France.

## Vuelta completa

Ejecutada con:

```bash
node tools/test_v027_stage_lab_multistage.js
```

Resultado:

- Tour de France generado con 21 etapas.
- 21 etapas convertidas.
- 6.699 puntos integrados.
- Perfiles y sectores disponibles.
- Motor por sectores iniciado.

## Regresión v0.26

Ejecutada con:

```bash
node tools/smoke_test_v026_full.js
```

Resultado:

- Carrera normal: 25 equipos.
- Tour: 22 equipos.
- Multi-era: 22 equipos en calendario con gran vuelta.
- Staff rival fichable.
- Mercado U23 funcional.
- Compra de autobús funcional.
- Departamentos actualizables.
- Guardado y carga multi-era funcionales.

## Pruebas Stage Lab

Ejecutadas con:

```bash
cd stage-lab
npm test
```

Resultado:

- Generación de vueltas validada.
- Exportación GPX validada.
- Sincronización de mapa validada.
- Recuperación adaptativa del enrutado validada.
- Tema visual v0.28 cargado sin modificar las pruebas del motor v1.4.

## Compatibilidad

- No se ha eliminado ningún módulo de v0.27.
- El esquema de guardado anterior se conserva.
- La capa v0.28 se carga al final y amplía el renderizado existente.
