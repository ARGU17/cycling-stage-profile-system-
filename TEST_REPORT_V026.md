# Informe de validación v0.26

## Sintaxis

Comprobación `node --check` superada para:

- `v026-season-skip.js`
- `v024-plus-fix.js`
- scripts principales del manager
- scripts de integración GPX
- scripts de Grand Tour Stage Lab

## Flujo validado: una carrera omitida

Configuración:

- Modo temporada.
- Santos Tour Down Under en automático.
- Cadel Evans Great Ocean Road Race como siguiente evento manual.

Resultado:

- Santos simulado correctamente.
- Resultado añadido al historial.
- Puntos, tiempos, forma y fatiga actualizados.
- Avance automático al índice siguiente.
- Stage Lab abierto para Cadel Evans.
- Sin error de convocatoria ni de estado.

## Flujo validado: varias carreras omitidas

Configuración:

- Cinco primeras carreras en automático.
- Paris-Nice como siguiente evento manual.

Resultado:

- Cinco eventos procesados.
- Entrenamiento aplicado entre eventos.
- Historial marcado como `autoSimulated`.
- Stage Lab abierto para Paris-Nice.
- Ejecución interna aproximada: menos de 2 segundos en el entorno de validación Node/VM.

## Flujo validado: salto directo al Giro

Configuración:

- Primer evento manual: Giro d'Italia.

Resultado:

- Veinte competiciones anteriores simuladas.
- Giro seleccionado como carrera 21 del calendario interno.
- Stage Lab activado para el Giro.
- Ejecución interna aproximada: 4–5 segundos en el entorno de validación Node/VM.

## Flujo validado: temporada completamente automática

Configuración:

- Cero eventos manuales.

Resultado:

- 36/36 competiciones simuladas.
- Final de temporada alcanzado.
- Historial completo y sin duplicados.
- No se detectaron valores de tiempo no finitos.
- Ejecución interna aproximada: 10 segundos en el entorno de validación Node/VM.

## Sistemas preservados

- Convocatorias automáticas de ocho corredores por equipo.
- Clasificaciones de etapa y generales.
- CRI y CRE.
- Puntos UCI y victorias.
- Fatiga, forma, moral y race days.
- Objetivos de sponsor.
- Contratos y promesas.
- Scouting y mentoría.
- Palmarés y récords.
- Training camps.
- Stage Lab y GPX para eventos manuales.

La validación utiliza un entorno JavaScript Node/VM con DOM simulado para ejecutar el estado y el motor. Debe complementarse con una revisión visual en el navegador tras subir el paquete a GitHub Pages.
