# Blockbench Edu 0.3.0 — primera versión para prueba en clase

Plugin local en español para Blockbench web 5.2.2, con teclado y ratón. Incluye un catálogo de criaturas del Entity Wizard y una pantalla educativa para cambiar sus partes y pintarlas. **El cerdo de prueba se importó y funciona en Minecraft Education; Nico confirmó que la revisión 1.0.3 ya no presenta el error de sonido y muestra el icono correctamente.** El resto del catálogo tiene comprobaciones en el editor, no una validación individual dentro del juego.

## Web con inicio directo

Abre **[Blockbench Edu](https://blockbench-edu.pages.dev/)**. Edu se carga automáticamente y abre su asistente, sin instalar plugins ni iniciar sesión. Si cancelas, pulsa «Comenzar» para volver. La versión web usa Blockbench 5.2.2 fijado a una revisión exacta. Cloudflare Pages publica la web desde la rama `main` del repositorio `nchiari/blockbench-edu-web`; la compilación y publicación se describen en [web/README.md](web/README.md).

El guardado de una sesión educativa completa sigue pendiente: cerrar la pestaña no conserva el estado completo de Edu. La web genera el addon en el navegador y no requiere cuentas de alumnos ni base de datos. Las clases con buzón configurado permiten entregar la criatura directamente al Drive del docente desde el editor; ver [infraestructura de Drive](infrastructure/drive/README.md) y [validación](infrastructure/drive/VALIDACION.md).

## Empezar

1. Abrir https://web.blockbench.net/.
2. En Archivo → Plugins, cargar `blockbench_edu.js` desde archivo. No hace falta instalar Entity Wizard para usar el catálogo incluido.
3. Elegir Cargadores → Blockbench Edu → Comenzar.
4. En «Elige tu criatura», buscar un nombre y elegir su tarjeta. El catálogo está ordenado por el nombre en español y los botones inferiores permanecen visibles al desplazarse. Las miniaturas, estructura y medidas de las tarjetas vienen del selector del Wizard, adaptadas al verde de Edu y con nombres en español. Enter o espacio también permiten elegir una tarjeta enfocada.
5. Avanzar hasta «Abrir editor». Se crea una criatura independiente y se prepara su textura automáticamente.
6. En «Dale forma», elegir la parte y cambiar su tamaño, moverla o girarla con los botones. Se pueden editar todas las partes existentes de la criatura.
7. En «Dale color», elegir un color y pintar directamente sobre la criatura. Hay pincel, relleno y herramienta para copiar un color.
8. Usar los botones inferiores para verla desde distintos lados o encuadrar toda la criatura con «Ver todo».
9. «Llévala a Minecraft» descarga un `.mcaddon`. Importarlo en Education y activar sus packs en un mundo de prueba. El nombre de la criatura es el de la plantilla seguido de «Edu».

Puedes arrastrar el separador entre el menú izquierdo y la vista 3D para ampliar el menú: mínimo 260 px y máximo 480 px, limitado al 40 % de la ventana cuando hay menos espacio. El ancho se conserva durante la sesión, también al cambiar entre forma, color y la vista del docente.

Deshacer y rehacer permanecen fijos al pie del menú, tanto en «Dale forma» como en «Dale color».

El panel «Partes», a la derecha de la vista 3D, permite mostrar u ocultar partes con el ojo, dejar una sola visible con el botón de enfoque y recuperar la vista completa con «Mostrar todas». Está abierto al iniciar y disponible en forma y color. La lista tiene desplazamiento propio y conserva las partes ocultas al cambiar entre esos dos modos. La flecha superior pliega el panel para ampliar la vista 3D; el botón «Partes» permite abrirlo de nuevo e indica cuántas partes están ocultas. Esc también lo pliega cuando el foco está dentro del panel. La exportación incluye las partes temporalmente ocultas; al pasar a la vista del docente se restaura la visibilidad original.

En «Dale color», «Seleccionar color» permite hacer clic directamente sobre la criatura para seleccionar todos los píxeles de ese mismo color y transparencia en la textura, aunque estén separados o en partes ocultas. Seleccionar no cambia la pintura. La selección permanece activa al cambiar de herramienta: el pincel, el borrador y Suavizar actúan únicamente dentro de ella; Rellenar pinta toda la selección al hacer clic sobre un píxel seleccionado. «Quitar selección» permite volver a pintar libremente. La selección muestra cuántos píxeles contiene y cada acción de pintura se puede deshacer o rehacer.

«Controles de cámara», junto a las vistas inferiores, abre botones para girar y desplazar la vista y acercar o alejar. Permite manejar la cámara con clics de touchpad sin rueda ni clic derecho. En las vistas ortográficas, el giro queda deshabilitado; «Vista 3D» lo habilita de nuevo. Los botones de cámara no modifican las piezas ni el historial.

La web tiene dos accesos: la dirección principal abre la versión alumno, sin «Para el docente» ni la barra general de Blockbench; `/docente/` abre la versión docente y, al terminar el asistente, muestra el editor completo con el panel «Prueba Edu». Desde allí se puede configurar la clase y copiar su enlace, que siempre apunta a la versión alumno. El docente conserva «Volver a alumnos» para probar la pantalla educativa y «Para el docente» para regresar a sus controles. El plugin instalado manualmente conserva también ese cambio de vista.

La sesión educativa y el addon base se conservan en memoria: no cerrar la pestaña esperando recuperar después todo ese estado. El guardado y reapertura de una sesión educativa completa sigue pendiente. Cada acceso trabaja en su propia pestaña; abrir el acceso docente no transfiere la criatura de una pestaña de alumno.

Los píxeles seleccionados se destacan sobre el modelo con un tinte celeste transparente y un borde de contraste. La marca se mantiene al cambiar de herramienta, desaparece con «Quitar selección» y solo se muestra en Pintura. Es una ayuda visual del editor: no modifica la textura ni se incluye en el addon exportado.

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

La prueba de interfaz `tests/classroom-ui-probe.js` se ejecuta con `playwright-cli run-code` en una pestaña web de prueba. Revisa el asistente, el catálogo, los controles de cámara y las acciones fijas en tres resoluciones, al 100 % y con la distribución equivalente al 125 %. La comodidad con un touchpad físico requiere una prueba manual.

`tests/parts-panel-probe.js`, sobre el zombi temporal de esa prueba, comprueba los ojos, el aislamiento de una parte, el cambio entre forma y color, el teclado, el encuadre disponible al plegar, el historial y la descarga con partes ocultas. También revisa el panel en las mismas tres resoluciones y dos escalas, con el menú izquierdo en su ancho mínimo y máximo y los controles de cámara abiertos.

`tests/color-selection-probe.js`, en una pestaña de prueba nueva, comprueba la selección por color desde el modelo 3D, el uso del bote, pincel, borrador y Suavizar, la conservación de todos los píxeles no seleccionados y la recuperación de la pintura con el historial nativo.
