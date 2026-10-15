# Blockbench Edu 0.3.0 — primera versión para prueba en clase

Plugin local en español para Blockbench web 5.2.2, con teclado y ratón. Incluye un catálogo de criaturas del Entity Wizard y una pantalla educativa para cambiar sus partes y pintarlas. **El cerdo de prueba se importó y funciona en Minecraft Education; Nico confirmó que la revisión 1.0.3 ya no presenta el error de sonido y muestra el icono correctamente.** El resto del catálogo tiene comprobaciones en el editor, no una validación individual dentro del juego.

## Web con inicio directo

Abre **https://nchiari.github.io/blockbench-edu-web/**. Edu se carga automáticamente y abre su asistente, sin instalar plugins ni iniciar sesión. Si cancelas, pulsa «Comenzar» para volver. La versión web usa Blockbench 5.2.2 fijado a una revisión exacta; la compilación y publicación manual se describen en [web/README.md](web/README.md).

El guardado de una sesión educativa completa sigue pendiente: cerrar la pestaña no conserva el estado completo de Edu. La web genera el addon en el navegador y no requiere cuentas de alumnos ni base de datos.

## Empezar

1. Abrir https://web.blockbench.net/.
2. En Archivo → Plugins, cargar `blockbench_edu.js` desde archivo. No hace falta instalar Entity Wizard para usar el catálogo incluido.
3. Elegir Cargadores → Blockbench Edu → Comenzar.
4. En «Elige tu criatura», buscar un nombre y elegir su tarjeta. Las miniaturas, estructura y medidas de las tarjetas vienen del selector del Wizard, adaptadas al verde de Edu y con nombres en español. Enter o espacio también permiten elegir una tarjeta enfocada.
5. Avanzar hasta «Abrir editor». Se crea una criatura independiente y se prepara su textura automáticamente.
6. En «Dale forma», elegir la parte y cambiar su tamaño, moverla o girarla con los botones. Se pueden editar todas las partes existentes de la criatura.
7. En «Dale color», elegir un color y pintar directamente sobre la criatura. Hay pincel, relleno y herramienta para copiar un color.
8. Usar los botones inferiores para verla desde distintos lados o encuadrar toda la criatura con «Ver todo».
9. «Llévala a Minecraft» descarga un `.mcaddon`. Importarlo en Education y activar sus packs en un mundo de prueba. El nombre de la criatura es el de la plantilla seguido de «Edu».

«Para el docente» vuelve a la interfaz general de Blockbench. La pantalla educativa oculta los menús y paneles generales mientras se trabaja. La sesión educativa y el addon base se conservan en memoria: no cerrar la pestaña esperando recuperar después todo ese estado. El guardado y reapertura de una sesión educativa completa sigue pendiente.

## Tamaño, pintura e historial

- Cada pulsación cambia la dimensión total en 1 y mantiene el centro. Las medidas fraccionarias originales se conservan: 2,5 → 3,5. No se redondea la silueta para preparar el modelo.
- Los límites dependen del tamaño original de cada parte; la prueba permite hasta el doble, con un máximo mínimo de 2. El mínimo conserva el resto fraccionario. Los planos pueden empezar con grosor cero.
- Los píxeles nuevos repiten el borde y conservan su transparencia. Achicar recorta; volver a aumentar extiende el borde actual. Deshacer recupera la pintura recortada.
- Las caras se separan y reorganizan automáticamente en una sola textura de trabajo. La densidad inicial se normaliza por vecino más cercano. En piezas fraccionarias, las regiones usan dimensiones enteras de píxeles y la densidad de ese eje no es exactamente 1:1.
- Un cambio de tamaño registra geometría, UV, lienzo y bitmap en una acción de deshacer. Mover cambia 1 unidad y girar cambia 15 grados.
- Las dimensiones y los movimientos no ajustan la colisión del comportamiento. Las animaciones y variantes necesitan revisión dentro del juego.
- La primera exportación usa versión 1.0.1 y la siguiente 1.0.2. BP y RP mantienen dependencias cruzadas, versiones sincronizadas e identidad estable durante esa creación. Otra creación recibe identificadores y UUID independientes.

## Alcance comprobado

Las 73 opciones disponibles abren en una sesión nueva de Blockbench web con solo Edu. La prueba del catálogo aumenta un cubo en un eje y comprueba la recuperación de geometría, UV y PNG con deshacer/rehacer. No acredita todas las combinaciones de piezas, variantes o animaciones. Los resultados y las limitaciones se registran en `VALIDACION.md`; el resultado de la prueba del catálogo está en `output/catalog-browser-audit.json`.

El catálogo de referencia proviene del Entity Wizard 1.8.3 instalado. Sus recursos se completan con el pack vanilla local. Es un prototipo educativo de prueba.

## Desarrollo

```powershell
npm install --ignore-scripts
npm test
npm run check
npm run sync
```

`npm run sync` actualiza la copia local en la carpeta de plugins de Blockbench y verifica SHA-256. No activa ni recarga el plugin: en una ventana abierta hay que recargarlo. `tests/catalog-browser-probe.js` contiene la prueba del catálogo para `playwright-cli run-code`; crea y cierra únicamente sus proyectos temporales. `tests/core.test.js` cubre los algoritmos y el empaquetado. `scripts/verify-export.js` corresponde a las exportaciones históricas del cerdo de referencia.

Las capturas, descargas y resultados generados van en `output/`. La pareja original `reference/cerdo_edu.bbmodel` y `reference/cerdo_edu.mcaddon` se conserva para las pruebas de referencia.
