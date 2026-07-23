# Fuentes, trazabilidad y datos simulados

## Base histórica 1990–2025

Se conserva la metodología de la versión WT Historical: archivo de equipos del pelotón profesional de élite, participantes históricos y curación manual de estructuras relevantes. No debe interpretarse como un registro contractual universal de todos los ciclistas profesionales de cada año.

Los ratings son valores de videojuego reproducibles y no mediciones fisiológicas oficiales.

## Base 2026

La versión v0.26 restaura exactamente el dataset de Cycling Manager Tour v0.24:

- 34 equipos.
- 927 registros de corredor.
- 36 carreras.

El objetivo es recuperar la profundidad y compatibilidad solicitadas. Algunas ampliaciones de plantilla de v0.24 fueron generadas por el simulador. Por ello, la etiqueta `complete-simulator-v024` significa “base completa del juego”, no “plantilla contractual externamente verificada”.

## Staff nominal

El mercado mezcla dos tipos de registros:

- `real-verified`: nombre y función publicados por una fuente oficial del equipo.
- `fictional-generated`: perfil ficticio creado para completar el mercado.

Se han incorporado perfiles documentados de UAE Team Emirates-XRG, Team Visma | Lease a Bike, Movistar Team, Red Bull–BORA–hansgrohe, Soudal Quick-Step e INEOS Grenadiers. Cada registro nominal conserva `sourceUrl` dentro de `staff-market-v026.js`.

Fuentes oficiales principales:

- UAE Team Emirates-XRG: `https://www.uaeteamemirates.com/team/sports-directors/`
- Team Visma | Lease a Bike: `https://www.teamvismaleaseabike.com/team/`
- Movistar Team: `https://movistarteam.com/2025-10-29/movistar-team-impulsa-una-nueva-estructura-en-su-area-deportiva-bajo-el-liderazgo-de-sebastian-unzue`
- Red Bull–BORA–hansgrohe: noticias oficiales enlazadas individualmente en el dataset.
- Soudal Quick-Step: `https://soudal-quickstepteam.com/en/team/staff`
- INEOS Grenadiers: noticias oficiales de dirección de carrera enlazadas en cada perfil.

Las habilidades, salarios, costes, cláusulas y efectos de todos los perfiles —incluidos los nominales— son valores simulados.

## Cantera

Los nombres marcados como `real-name-simulated-rating` proceden de páginas oficiales de academias o equipos de desarrollo. Cada registro conserva su `sourceUrl` en `youth-market-v026.js`.

Estructuras utilizadas:

- Movistar Team Academy.
- Team Visma | Lease a Bike Development.
- Red Bull Rookies.
- INEOS Racing Academy.
- UAE Gen Z.

Todos los ratings, potenciales, salarios, precios y personalidades son simulados. Los perfiles `fictional-generated` son completamente ficticios.

## Vehículos y patrocinio

La asociación CUPRA como coche oficial de Movistar Team para 2026–2027 está marcada como documentada. Las restantes marcas y acuerdos incluidos en el mercado de vehículos son escenarios de simulación, aunque utilicen modelos comerciales reales.

Fuente oficial CUPRA–Movistar:

`https://movistarteam.com/en/2025-12-11/cupra-partners-with-movistar-team-as-official-car-for-all-world-tour-men-women-races-to-inspire-the-world-from-barcelona`

## Integración GPX v0.27

La distribución incorpora los archivos GPX entregados por el usuario para etapas del Tour. Los XML originales se mantienen en `gpx/` y se transforman en `gpx-stage-data.js` mediante las herramientas incluidas.

Los puntos GPX se utilizan para:

- geometría del recorrido;
- altitud;
- pendiente;
- orientación de la carretera;
- detección de puertos;
- creación de sectores;
- simulación física cada 250 m.

El generador Stage Lab puede crear recorridos procedurales o consultar un servidor de enrutado compatible. Las rutas generadas de forma procedural no se presentan como tracks oficiales de una organización deportiva.

## v0.28 · actualización visual

La v0.28 no modifica fuentes de datos, plantillas, ratings ni recorridos. Los nuevos maillots, avatares y mini perfiles son representaciones visuales generadas localmente a partir de los colores y datos ya incluidos en el simulador; no utilizan fotografías ni recursos externos.
