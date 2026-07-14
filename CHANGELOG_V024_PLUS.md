# Changelog v0.24+

## Corrección crítica: confirmación de convocatoria

Se corrige el bloqueo que podía dejar la aplicación en la pantalla de selección después de escoger ocho corredores, tanto en carrera única como en temporada.

### Cambios realizados

- La carrera se renderiza **antes** de intentar guardar la partida.
- Los errores de `localStorage` ya no interrumpen el flujo de confirmación.
- Se incorpora un guardado temporal en memoria cuando el navegador bloquea o llena el almacenamiento local.
- La lista seleccionada se normaliza para eliminar identificadores duplicados o inválidos.
- Las convocatorias de los equipos rivales se verifican y completan hasta ocho corredores.
- La selección de equipo deja de preparar la convocatoria dos veces.
- El líder protegido queda siempre dentro de los ocho corredores realmente convocados.
- Los guardados v0.24 siguen siendo compatibles con v0.24+.

## Sistemas conservados

- Motor físico CP/W′ y W′ balance.
- Simulación por pendiente real GPX.
- IA rival, grupos, ataques, puentes, abanicos, autobús y descensos.
- Nutrición, material, cubiertas, staff, contratos, scouting y objetivos A/B/C.
- Perfiles interactivos tipo Radial y grupos sincronizados sobre el recorrido GPX.
