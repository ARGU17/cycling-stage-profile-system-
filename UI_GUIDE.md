# Guía visual · Graphite Performance

## Paleta

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#0B0D10` | Fondo general |
| Superficie | `#161A20` | Panel principal |
| Elevada | `#1C2129` | Tarjetas y módulos |
| Hover | `#222833` | Interacción |
| Borde | `rgba(255,255,255,.08)` | Separadores |
| Azul | `#0A84FF` | Acción principal |
| Verde | `#30D158` | Estado correcto |
| Amarillo | `#FFD60A` | Gran vuelta / aviso |
| Naranja | `#FF9F0A` | Atención |
| Rojo | `#FF453A` | Peligro / borrar |
| Texto principal | `#F5F7FA` | Contenido principal |
| Texto secundario | `#A1A9B5` | Explicaciones |
| Texto terciario | `#697382` | Metadatos |

## Tipografía

```css
font-family: -apple-system, BlinkMacSystemFont,
             "SF Pro Display", "SF Pro Text",
             "Helvetica Neue", Arial, sans-serif;
```

- Título principal: 28–38 px, peso 720.
- Título de sección: 20 px, peso 680.
- Título de tarjeta: 16–22 px, peso 680–700.
- Texto: 13–14 px.
- Etiquetas: 8–11 px.
- Datos: `SF Mono` o alternativa monoespaciada.

## Principios

1. Una acción primaria azul por bloque.
2. Rojo solo para acciones destructivas.
3. Color deportivo reservado para estados, perfiles y categorías.
4. Datos secundarios con menor contraste.
5. Bordes discretos en lugar de sombras intensas.
6. Tarjetas visuales con jerarquía: imagen, nombre, metadatos y acción.
7. Los componentes deben seguir funcionando sin imágenes externas.
