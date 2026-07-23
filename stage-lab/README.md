# Grand Tour Stage Lab v1.5 · Cycling Manager Bridge

Generador web de recorridos, perfiles altimétricos y GPX integrado en **Cycling Manager Tour v0.25**.

En este paquete, Stage Lab se encuentra dentro de:

```text
stage-lab/
```

No debe moverse ni publicarse por separado si se quiere mantener la conexión automática con el simulador.

## Funciones

- Generación procedural local.
- Configuración de carreras de un día y vueltas por etapas.
- Soporte geográfico para todos los países del calendario del simulador.
- Mapa 2D/3D.
- Perfil interactivo con color de pendiente de alta frecuencia.
- Enrutado opcional por carreteras OpenStreetMap mediante Valhalla.
- Exportación GPX por etapa.
- Exportación ZIP de una vuelta.
- Transferencia completa del recorrido al motor de Cycling Manager.

## Modo integrado

Cycling Manager abre:

```text
stage-lab/index.html?embed=manager
```

El simulador envía mediante `postMessage`:

- ID y nombre del evento;
- país y modo geográfico;
- número de etapas;
- tipo de cada etapa;
- distancia objetivo;
- semilla específica;
- condicionantes deportivos.

Al pulsar **Usar GPX en Cycling Manager**, Stage Lab devuelve la vuelta generada y el simulador crea los perfiles, sectores, puertos y geometría necesarios para la carrera.

## Generación local y enrutado real

La generación local no requiere Internet, cuenta ni clave API.

El enrutado real consulta el endpoint Valhalla configurado. Necesita Internet y puede estar limitado temporalmente por el servidor público. Si una ruta no puede recalcularse, el GPX local continúa siendo válido para el simulador.

## Perfil

La escala de pendiente utilizada es:

```text
≤ -9%      #1a4bff
-9 a -6%   #2c7cff
-6 a -3%   #2bb2ff
-3 a -1%   #24c6c6
-1 a 1.5%  #14b81f
1.5 a 3%   #63cf15
3 a 5%     #b5c718
5 a 7%     #e4c625
7 a 9%     #ee9430
> 9%       #dd5a22
```

## Pruebas internas

Desde la carpeta `stage-lab/`:

```bash
node smoke-test.js
node map-sync-test.js
node routing-recovery-test.js
```

Estas pruebas verifican generación, exportación GPX, sincronización del mapa y recuperación adaptativa del enrutado.
