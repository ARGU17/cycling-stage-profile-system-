# Informe de validación v0.24+

## Pruebas críticas de convocatoria

- Carrera única: selección automática de 8 corredores -> confirmación -> pantalla de carrera.
- Carrera única GPX: selección manual de 8 corredores distintos -> confirmación -> pantalla de carrera GPX.
- Temporada: selección de 8 corredores -> confirmación -> primera etapa de la temporada.
- Doble pulsación / estado ya bloqueado: no genera convocatorias duplicadas.
- Identificadores duplicados: se rechazan como una convocatoria inferior a ocho corredores distintos.
- Corredor inválido o de otro equipo: se elimina antes de validar.

## Persistencia

- `localStorage` operativo: guardado v0.24+ correcto.
- `localStorage` bloqueado: la carrera avanza y queda una copia temporal en memoria.
- `localStorage` sin cuota: la carrera avanza sin bloquear la interfaz.
- Carga compatible con estados v0.24 y v0.24+.

## Regresión

- Sintaxis JavaScript validada para todos los scripts.
- Se mantienen los 34 equipos, 927 corredores y el calendario existente.
- Se mantienen las 18 etapas GPX disponibles y el motor de simulación a 250 m.
