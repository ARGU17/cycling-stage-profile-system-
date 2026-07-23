# Cycling Manager Tour v0.28 · Graphite Performance

La **v0.28** es una actualización visual completa de la **v0.27 GPX Stage Lab**. No sustituye el motor de simulación ni elimina módulos: añade una nueva capa de interfaz cargada después de todos los sistemas anteriores.

## Objetivo de la versión

La interfaz adopta una estética **Graphite Performance**:

- Fondo negro grafito.
- Superficies jerarquizadas y bordes de baja opacidad.
- Azul como acción principal.
- Verde, amarillo, naranja, rojo, rosa y morado para estados deportivos.
- Tipografía del sistema Apple mediante `-apple-system`, `SF Pro Display` y `SF Pro Text` cuando están disponibles.
- Datos técnicos con `SF Mono` o la fuente monoespaciada del sistema.
- Tarjetas más visuales, menos densas y con una jerarquía más clara.

No se distribuye ningún archivo de fuente. En dispositivos Apple se utilizan automáticamente las fuentes instaladas por el sistema; en Windows y Android se aplican alternativas nativas.

## Nuevo asistente visual

### 1. Selección de modo

- Cuatro tarjetas de gran formato.
- Iconografía vectorial integrada.
- Numeración visual 01–04.
- Identificación específica de modos multi-era.
- Resumen visual de Stage Lab, motor CP/W′ y Director Suite.

### 2. Selección de carreras

- Tarjetas con mini perfil altimétrico real generado desde los datos de cada prueba.
- Color propio por competición.
- Identificación de gran vuelta, monumento, clásica, crono o vuelta por etapas.
- Distancia total, número de etapas y límite de equipos.
- Buscador y filtros por categoría.
- Selección múltiple para temporadas.

### 3. Selección de equipos

- Tarjetas de equipo con maillot vectorial tridimensional.
- Colores de cada estructura.
- Año, categoría, país, número de corredores y fuerza deportiva.
- Avatares visuales de los principales ciclistas.
- Filtros WT, ProTeam, Continental y todos.
- Selección confirmable mediante una barra inferior persistente.

### 4. Convocatoria

- Resumen visual del equipo y la carrera.
- Contador de seleccionados.
- Lista compacta de los corredores elegidos.
- Tarjetas individuales con rol, base, forma y barras de montaña, CRI, sprint y llano.
- Conserva las convocatorias históricas adaptativas y las reservas de archivo.

## Rediseño del juego completo

La nueva colorimetría y el sistema de componentes también se aplican a:

- Race Director.
- Panel de amenaza táctica.
- Recomendación del director.
- Estado de carrera y clima.
- Carriles de grupos.
- Vista TV y narración.
- Perfil 2D y perfil GPX.
- Mapa GPX.
- Clasificaciones.
- Material, nutrición y neumáticos.
- Staff y mercado.
- Mercado U23.
- Contratos, objetivos y scouting.
- Autobuses, coches y departamentos.
- Telemetría, gráficos y palmarés.

## Stage Lab

El iframe de Grand Tour Stage Lab conserva todas sus funciones y recibe una capa visual específica:

- Paleta grafito común con el manager.
- Botones azules y estados verdes.
- Paneles más compactos.
- Formularios y controles unificados.
- Perfil, mapa, libro de ruta y configuración sin cambios funcionales.

## Funcionalidades preservadas de v0.27

- Archivo histórico 1990–2026.
- Base 2026 de 34 equipos y 927 registros de corredor.
- Carrera histórica y temporada histórica.
- Carrera y temporada multi-era.
- Selección manual del pelotón multi-era.
- 25 equipos en pruebas normales y 22 en Tour, Giro y Vuelta.
- Grand Tour Stage Lab.
- Generación, importación y exportación GPX.
- Perfiles y sectores físicos a partir del GPX.
- Motor por pendiente cada 250 m.
- CP, W′ y recuperación anaeróbica.
- Grupos, formaciones, ataques y respuestas.
- Corredores puente y ataques de largo alcance.
- Autobús de sprinters.
- Viento, abanicos, descensos y pavé.
- CRI y CRE.
- IA de equipos rivales.
- Nutrición, material, neumáticos y presiones.
- Objetivos A/B/C y calendario individual.
- Contratos y promesas.
- Staff nominal y mercado de 1.000 profesionales.
- Mercado de 1.000 corredores U23.
- Scouting, cantera y mentoría.
- Autobuses, coches, patrocinio y departamentos.
- Logística, telemetría, gráficos, alertas, récords y palmarés.

## Archivos nuevos

- `v028.css`: sistema visual Graphite Performance y actualización de todas las pantallas.
- `v028.js`: renderizado visual del asistente, carreras, equipos, maillots y convocatoria.
- `stage-lab/v028-stage-lab.css`: tema visual del laboratorio GPX.
- `tools/smoke_test_v028_ui.js`: prueba del flujo visual y funcional.
- `UI_GUIDE.md`: referencia de color, tipografía y componentes.
- `ui-showcase.html`: galería estática de la nueva interfaz.

Los archivos de v0.27 permanecen en el proyecto y siguen cargándose antes de la nueva capa.

## Instalación en GitHub Pages

1. Descomprime `cycling-manager-v028.zip`.
2. Sube **todo el contenido** de la carpeta a la raíz del repositorio.
3. Conserva las carpetas:
   - `.github`
   - `gpx`
   - `historical-data`
   - `stage-lab`
   - `tools`
4. Mantén `.nojekyll`.
5. Activa GitHub Pages desde la rama principal y la carpeta raíz.

No elimines `v027.js`, `v027.css`, los módulos GPX ni los archivos v0.26: la v0.28 los amplía, no los reemplaza.

## Guardado

Se mantiene el esquema de guardado de v0.26/v0.27 para no invalidar partidas existentes. La actualización visual no requiere migración de datos.

## Pruebas

```bash
node tools/smoke_test_v028_ui.js
node tools/smoke_test_v028.js
node tools/test_v027_stage_lab_multistage.js
node tools/smoke_test_v026_full.js
cd stage-lab && npm test
```

Consulta `TEST_REPORT.md` para ver el resultado completo.

## Versión

`v0.28-graphite-performance`
