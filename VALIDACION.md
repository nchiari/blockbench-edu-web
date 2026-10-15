# Validación del prototipo

Fecha: 13 de octubre de 2026.

## Entrada guiada 0.2.0

- Entrada nativa registrada como `ModelLoader` en **Cargadores**, con nombre e icono propios en verde. La selección de esa entrada también usa fondo verde.
- Asistente con tres pasos: Bienvenida, Tu criatura y A modelar. La plantilla y el addon se incluyen en el JS; no se necesita vincular archivos al empezar.
- Cada nueva creación recibe UUID, identificador de entidad, geometría y rutas de recursos propios, conservando las dependencias cruzadas.
- **12 pruebas automáticas** pasan, incluida la creación de dos proyectos independientes y la resolución de todas las texturas del addon generado.
- Recorrido comprobado en Blockbench web 5.2.2: abrir desde Cargadores, avanzar y retroceder, crear el cerdo y llegar al editor con textura preparada y cabeza `8 × 8 × 8`.
- Cancelar conserva el proyecto abierto. Descarga real desde el nuevo asistente comprobada: cabeza `9 × 8 × 8`, identidad propia, ambos packs `1.0.1` y dependencias cruzadas correctas. Archivo: `output/cerdo_edu_desde_asistente.mcaddon`.
- La validación del núcleo 0.1.0 que figura a continuación sigue siendo la evidencia de modelado/pintura. Education continúa pendiente.

## Núcleo 0.1.0 comprobado

- **11 pruebas automáticas** del núcleo: copia exacta RGBA, alfa, bordes/esquinas, recorte, dirección de UV espejadas, empaquetado determinista sin solapamiento, cambio centrado, detección de referencias con UV/espejos/rotaciones distintos, versiones/dependencias y exportación con archivos conservados. Incluye `.mcaddon` de carpetas y de `.mcpack` anidados.
- **19 comprobaciones de integración en Blockbench web 5.2.2** con navegador real: preparación de todas las caras sin alterar sus píxeles o espejos; deshacer de preparación; ampliar cuatro unidades por eje; cuatro entradas de historial; mínimo de una unidad; recuperación exacta de geometría, UV, lienzo y píxeles mediante deshacer/rehacer; apertura de los modos nativos de pintura y edición.
- Las pruebas de historial comparan el JSON completo de geometría exportada y todos los bytes del bitmap, no solo las dimensiones.
- Trazo con ratón sobre el modelo 3D: cambió la pintura, creó una única entrada de deshacer y se recuperó exactamente el estado anterior.
- Controles Frente, Costado y Encuadrar ejecutados. Captura final inspeccionada; ajustes locales de ancho de botones y altura del panel para evitar superposición y controles ocultos.
- Dos descargas reales del exportador: versiones `1.0.1` y `1.0.2`; cabeza `12 × 8 × 8`. Verificación del contenido mediante `scripts/verify-export.js`: solo cambian manifests, geometría y las texturas recolocadas. Comportamiento, animaciones, entidad cliente y demás archivos se conservan byte por byte.
- Los PNG principal y auxiliares comparten las dimensiones declaradas por la geometría. Las versiones y dependencias BP/RP coinciden; UUID y versión mínima del motor se conservan.
- Copia del plugin sincronizada en la carpeta de plugins de Blockbench, con hash comprobado.
- Descarga del plugin comprobada: desaparecen panel, acción y CSS propios; el modelo, la pintura y los demás paneles se conservan.

Evidencia generada: `output/playwright/browser-probe-result.txt`, `output/playwright/plugin-final.png`, los dos `.mcaddon` de muestra y `output/export-verification.json`.

## Pendiente de comprobar en Minecraft Education

No se abrió Minecraft ni se importó un addon en el juego. Falta comprobar importación, activación de packs, actualización sobre un mundo existente, apariencia, caminar, mirar, colisión y variante con silla. La conservación de los archivos de animación y comportamiento no demuestra su resultado visual en ejecución.

El valor `1.26.32` no se aplicó automáticamente. Los manifests conservan `min_engine_version: [1,16,0]` del Wizard; falta contrastar con un archivo funcional de Nico y la versión instalada de Education.

La referencia de Entity Wizard y los recursos vanilla se usan para esta prueba interna. No se preparó una distribución pública.
# Avance hacia la versión de clase — 2026-10-13

Trabajo en curso; todavía no cumple el objetivo completo de selección de entidad y uso en clase.

- Nuevo espacio educativo a pantalla completa: oculta el contenedor nativo y conserva el visor 3D. Controles de forma, piezas, color, pincel/relleno/cuentagotas, cámaras y deshacer/rehacer.
- Redimensionado generalizado a cualquiera de los cubos existentes. Cada pieza conserva su tamaño inicial para calcular límites independientes.
- Verificado en Blockbench web: cuerpo del cerdo de 10 a 11 unidades de ancho, cambio a pintura, elección de color, trazo real con ratón y un único deshacer que recupera exactamente el bitmap anterior.
- Salir al editor elimina la clase educativa y restaura la visibilidad nativa. Descarga del plugin elimina el nuevo componente y sus estilos.
- Captura revisada: `output/playwright/classroom-first.png`. Corregidos desbordes horizontales causados por tamaños mínimos nativos de controles.
- Las 12 pruebas del núcleo pasan; sintaxis verificada y copia de plugins sincronizada con SHA-256.
- Pendiente: conectar el selector real del Entity Wizard (catálogo confirmado en su `content_vue.mobs`), generación para entidades distintas, ampliar operaciones de geometría, pulir tamaño/visibilidad de controles, validar exportación del recorrido ampliado y probar en Education.

## Catálogo y generación — avance posterior

- Guardado `reference/wizard-catalog.json` directamente desde el catálogo del Wizard 1.8.3 instalado, sin modificar ese plugin. Contiene 75 entradas y se usa como referencia interna.
- Añadida `createMobAddon`: genera BP/RP con UUID independientes y dependencias mutuas, copia modelo/comportamiento/animaciones/controladores disponibles, asigna rutas privadas a las texturas incluidas y añade nombres de entidad/huevo en español e inglés. Todavía no conectada al selector visible; faltan sonidos y resolución de texturas auxiliares vanilla.
- Nueva prueba con la vaca compara JSON de geometría, comportamiento y animaciones contra el original, compara PNG exacto y verifica identidades y dependencias. Total: 13 pruebas pasando.
- Auditoría en `output/catalog-audit.json`: 20 entradas con planos, camel/parrot con dimensiones fraccionarias, creeper con formato que requiere inspección adicional y ocho entradas con texturas externas. Estos casos aún no están cubiertos por la preparación educativa; no equivalen a criaturas comprobadas.

## Selector conectado y descarga de vaca

- El catálogo se incluye en el JS mediante `scripts/embed-catalog.js <directorio RP vanilla>`. Usa las miniaturas originales del Wizard en una cuadrícula con búsqueda; la UI del selector es propia, no el componente original del Wizard.
- El recorrido ahora usa `createMobAddon`, carga el modelo Bedrock elegido y conecta su textura con el editor educativo. Las pantallas iniciales ocultan también el contenedor general de Blockbench.
- Comprobado en web: elegir Cow, abrir sus nueve cubos, preparar atlas 55 × 77, aumentar ancho del cuerpo de 12 a 13 y descargar `output/vaca-selector.mcaddon`.
- Inspección del archivo descargado: nueve cubos, cuerpo 13 × 18 × 10, UUID/identificador nuevos, versión 1.0.1, textura y sonidos incluidos.
- Las 13 pruebas automáticas pasan. Plugin sincronizado. Quedan pendientes los casos de catálogo indicados arriba, equivalencia completa del selector solicitado, traducción de nombres, ampliación de operaciones y validación en Education. No considerar la selección de cualquier entrada como validada.

## Posición y giro de piezas

- Añadido selector Tamaño / Posición / Giro en el panel educativo. Mover cambia un píxel por pulsación; girar cambia 15 grados. Cada acción tiene una transacción nativa de deshacer.
- Mover traslada el pivote local del cubo junto con sus extremos; no altera los pivotes de los huesos.
- Verificado con la vaca en web: traslación X de un píxel, pivote trasladado un píxel, bitmap idéntico; deshacer recupera el JSON completo de geometría. Giro Y de 15 grados y deshacer también recuperan exactamente ese JSON.
- El catálogo embebido ahora obtiene sus nombres de `texts/es_ES.lang` del RP vanilla local. Las entradas especiales conservan un nombre explícito o el original cuando no existe clave.

## Piezas planas

- Preparación y edición admiten dimensiones cero. Las caras sin superficie reciben una muestra de un píxel del borde más cercano para poder dar grosor sin interpolar colores. Las caras visibles mantienen sus píxeles.
- Una dimensión originalmente plana puede variar de cero a dos; las otras mantienen mínimo uno y máximo dos veces el tamaño original. Las UV reservan al menos un texel por eje, incluso para caras temporalmente sin superficie.
- Comprobado en web: Abeja abre con seis piezas planas; ala 9 × 0 × 6 pasa a 9 × 1 × 6. Deshacer recupera exactamente el JSON completo de geometría y el bitmap anterior.
- Nueva prueba de superficies degeneradas y bordes del atlas: 14 pruebas automáticas pasando. Este resultado no prueba todavía todas las criaturas con planos ni las dimensiones fraccionarias.

## Creeper y texturas auxiliares

- Se carga la geometría principal cuando una entidad incluye modelos adicionales. Las variantes referenciadas que tienen exactamente los mismos huesos/cubos/UV iniciales se actualizan junto con la principal, conservando identificadores distintos.
- Corregida la referencia de la geometría cargada del creeper para apuntar a la copia propia del addon. Web: abrir Creeper, aumentar ancho y descargar `output/creeper-selector.mcaddon`. Inspección: dos geometrías de igual forma editada, dos texturas incluidas, versión 1.0.1.
- Prueba automática de exportación de geometrías vinculadas: 15 pruebas pasan.
- El empaquetador resuelve las texturas por alias, nombre de archivo o recurso vanilla. Convierte TGA de profesiones del aldeano zombi a PNG con Pillow y verifica igualdad de todos los bytes RGBA después de la conversión. Cero referencias de textura pendientes al regenerar el catálogo.
- Esta resolución de archivos no prueba que todas las variantes se vean correctamente en Education. Las dimensiones fraccionarias y la prueba completa del catálogo siguen pendientes.

## Apertura del catálogo en navegador

- Ejecutada la creación/preparación por el mismo método del asistente para las 73 opciones mostradas (no incluye Basic Walking sin entidad ni Armadillo marcado por el Wizard como no disponible en Education).
- La primera pasada reveló 23 rechazos. La precisión numérica de coordenadas explicaba varios: 0.1 frente a 0.10000000000000009. La firma ahora redondea únicamente para comparar a nueve decimales; no cambia las coordenadas del modelo.
- También normaliza en la comparación las rotaciones cero y pivotes de cubos sin rotación que el codec omite. Una nueva prueba asegura que aún se rechazan cambios reales de 0.001 unidades. Total: 16 pruebas pasando.
- Los residuos numéricos de tamaños se normalizan antes de operar con píxeles. Las medidas fraccionarias reales todavía se rechazan.
- Falta resolver UV fuera del atlas en algunos peces/planos, distintas resoluciones de Happy Ghast, el modelo principal del NPC y las dimensiones fraccionarias. La apertura no equivale a validar pintura/exportación de todas las entidades ni su comportamiento en Education.

## Reordenación de huesos y bordes invisibles

- La comparación de geometría ordena los huesos por nombre: el codec reordena hermanos para agruparlos por padre. Se conserva la comprobación de sus padres, pivotes, rotaciones y cubos.
- Se identificaron referencias de padres con mayúsculas distintas en plantillas de humanoides (rightArm frente a rightarm). La comparación solo resuelve esa diferencia si existe un único nombre coincidente y no existe ya el nombre exacto.
- Los bordes de planos que tienen UV fuera de la imagen se siembran con el texel más cercano. No se relaja la validación de caras con superficie visible.
- Retest web confirmado: rana, bacalao, salmón, sniffer y strider ahora abren y preparan su atlas. Las 16 pruebas siguen pasando. Ahogado pasa la comparación de geometría pero aún falla la comparación de bitmap; queda por investigar.

## Texturas semitransparentes e inflado heredado

- Resuelto el bitmap del ahogado usando el mismo contexto 2D `willReadFrequently` que Blockbench: la discrepancia era de redondeo de RGB con alfa 252, no de pintura distinta. Se conserva la comparación exacta.
- La firma contempla el inflado que heredan los cubos de su hueso. Web confirmado: Ahogado, Saqueador, NPC, Piglin y Piglin zombificado abren/preparan correctamente.
- NPC usa un identificador de geometría fijo en la plantilla; ahora recibe identificador propio igual que el resto.
- 17 pruebas automáticas pasan. Happy Ghast tiene bitmap 128 × 128 y UV 64 × 64; pendiente conversión de densidad.
- Decisión explícita de Nico: para camello y loro conservar las medidas fraccionarias originales y avanzar de a 1 (ejemplo 2.5 → 3.5). No redondear la geometría al preparar.
- Implementado: se conservan dimensiones originales finitas; mínimos mantienen el resto fraccionario y cada cambio sigue sumando/restando uno. Las regiones de píxeles siguen el redondeo hacia abajo del box UV nativo, con al menos un texel. Esto conserva la correspondencia original de esas caras, cuya densidad no es exactamente 1:1 en el eje fraccionario.
- Apertura/preparación web confirmada sin redondear: Loro mantiene 1 × 1.7 × 1; Camello mantiene 7.4 × 7 × 0. Queda comprobar el redimensionado fraccionario y el historial en ejecución.

## Densidad inicial y medidas fraccionarias verificadas

- Happy Ghast abre/prepara atlas 239 × 315. Sus caras no tenían densidad uniforme: se muestrea cada región original según su resolución real hacia la cantidad de texeles de trabajo, mediante vecino más cercano y conservando RGBA.
- Las referencias de textura con contenido idéntico comparten ruta en el addon: pintar el recurso principal afecta también al alias usado por el controlador de render. Las texturas de una geometría separada no vinculada (por ejemplo cuerdas) conservan su bitmap original.
- Prueba web con pieza del Camello: ancho 7.4 → 8.4; deshacer recupera exactamente geometría y bitmap; siete reducciones llegan a 0.4 y desactivan el botón de reducir. No se redondeó su geometría.
- Nueva prueba del muestreo: colores/alfa exactos, ampliación por duplicación y reducción por vecino más cercano. 18 pruebas automáticas pasando.


## Comprobación del catálogo e historial — 2026-10-14

- Se mantiene la decisión de conservar medidas fraccionarias y avanzar de a 1, sin redondear la geometría original.
- Corregida una carrera entre la actualización de la imagen desde el lienzo y deshacer inmediato: al cargar un snapshot nativo se limpia la marca que impediría restaurar el bitmap. El evento solo afecta proyectos vinculados a Edu y se retira al descargar el plugin.
- Comprobación en una sesión nueva de Blockbench web, cargando únicamente Edu: las 73 opciones disponibles abren, permiten aumentar un cubo en 1 y recuperan geometría, UV y PNG exactos con deshacer y rehacer. Evidencia: output/catalog-browser-audit.json; procedimiento reproducible: tests/catalog-browser-probe.js.
- La comparación excluye los límites de visibilidad calculados por el codec: compilar puede ampliar ese cache, aunque no cambien las piezas. Se comparan las dimensiones de textura, huesos, cubos y UV.
- 18 pruebas de núcleo pasan; sintaxis correcta; copia instalada sincronizada con hash idéntico.
- Esta comprobación cubre un cubo y un eje por criatura, no todas sus piezas, variantes, animaciones o importaciones en Minecraft Education. La validación dentro del juego sigue pendiente.

## Selector del Wizard adaptado — 2026-10-14

- El cuadro reproduce la estructura del selector original: buscador nativo, tarjetas de 122 × 90, miniaturas de 96 px y nombre al pie. La selección se marca en verde y conserva los nombres en español. Se reutiliza su estructura; no se instancia el componente privado del plugin original.
- Verificado en web sin Entity Wizard instalado: 73 tarjetas, búsqueda «loro», selección con Enter y paso al editor. Se detuvo la propagación de Enter/espacio para evitar que el manejador global cerrase el asistente.
- Pantalla 1366 × 768: el selector completo cabe (cuadro 740 × 653, posición y=100). Capturas selector-wizard.png y classroom-parrot.png en output/playwright.
- README actualizado al flujo y alcance reales; sigue pendiente la importación en Education y la revisión final de la experiencia completa de clase.

## Selección directa y controles 3D — 2026-10-14

- Herramienta propia para elegir partes en el lienzo, sin flechas nativas de transformación. Al pulsar una pata del cerdo, la selección nativa y el panel Edu coinciden.
- «Ver todo» encuadra el conjunto y recupera la parte seleccionada. Volver de pintura a forma activa la herramienta educativa; salir restaura la herramienta anterior y descargar el plugin elimina la herramienta registrada.
- Verificado en web con acciones reales: pintar sobre el cerdo cambia el bitmap; Ctrl+Z lo recupera exactamente; cambiar entre pintura y forma mantiene oculto el transformador.
- Los siete botones de cámara se comprobaron contra sus cámaras reales: norte, sur, este, oeste, arriba, abajo y perspectiva. No se usaron solo textos de botones como prueba.
- «Para el profe» restaura move_tool y retira el modo educativo; descargar el plugin elimina la herramienta y el overlay. Sintaxis y sincronización verificadas.

## Descarga guiada y segunda exportación — 2026-10-14

- Tras descargar, Edu explica cómo abrir el archivo con Education, pedir ayuda para activar la criatura y encontrar su huevo. «Seguir creando» devuelve al editor.
- Corregido el orden de los diálogos y el fondo modal en modo educativo: los mensajes ya no quedan debajo de la vista 3D. Verificado pulsando el botón real, sin forzar clics.
- Dos descargas nuevas desde la interfaz actual: output/clase_cerdo_1_0_1.mcaddon (cabeza 9 × 8 × 8) y output/clase_cerdo_1_0_2.mcaddon (10 × 8 × 8). Comparten identificador y UUID de packs, con versiones 1.0.1 y 1.0.2 y dependencias cruzadas sincronizadas.
- Comparación de contenido: solo cambian los manifests, geometría, textura principal y silla. Evidencia en output/classroom-export-verification.json. La importación/actualización dentro de Education sigue sin comprobar.

## Inicio del historial educativo — 2026-10-14

- En los proyectos nuevos creados por el asistente, el historial empieza después de preparar la criatura. La preparación automática no forma parte de las acciones del alumno. No se borra el historial de proyectos existentes al entrar o salir del modo educativo.
- Deshacer y Rehacer se desactivan cuando no hay acciones disponibles en su dirección.
- Prueba web con botones y teclado: aumentar ancho, pulsar Ctrl+Z cinco veces, comparar geometría y PNG exactos con el comienzo, rehacer y aumentar alto. Resultado correcto; la textura sigue preparada y la cabeza termina en 9 × 9 × 8.
- Nico confirmó que realizará la prueba de importación en Education cuando tenga el archivo. Los dos archivos clase_cerdo_1_0_1.mcaddon y clase_cerdo_1_0_2.mcaddon ya están disponibles en output; todavía no hay resultado de esa prueba.

## Primera prueba de Nico en Education y correcciones — 2026-10-14

- Nico confirma que el cerdo 1.0.1 funciona y aporta captura en el mundo. Informa un error Molang en sonidos, un ojo ensanchado y ausencia de pack_icon. No confirmó todavía la actualización 1.0.2.
- Causa de sonido: sounds.json de vanilla reciente usa minecraft:sound_variant, propiedad no declarada en el comportamiento del Wizard. El generador conserva los eventos básicos y omite variantes que dependan de propiedades no sincronizadas por el actor. Las variantes compatibles se conservan. Test añadido; 19 pruebas pasan.
- Se incluyen BP/pack_icon.png y RP/pack_icon.png a partir de la miniatura original de cada criatura.
- Ojo comprobado en los PNG exportados: la fila negra/blanca del frente pasa a #W....W## en 1.0.1 y #W....W### en 1.0.2. Es extensión del texel negro del borde al agrandar, según la regla acordada, no evidencia de UV incorrectas. No se cambia esa regla ni se retoca la pintura sin una nueva decisión.
- Nueva salida output/clase_cerdo_1_0_3.mcaddon, basada en 1.0.1: geometría y pintura idénticas; sonidos corregidos, ambos iconos y versiones/dependencias 1.0.3. Identidad preservada. Verificación estática del ZIP correcta; falta comprobar eliminación del error y actualización real en Education.

## Decisión sobre el borde del ojo — 2026-10-14

- Nico acepta conservar el resultado de extender los píxeles del borde: los alumnos pueden retocar el ojo pintando. Este efecto deja de ser un pendiente de esta primera versión; no se cambia el algoritmo.
- La nueva captura muestra al cerdo dentro de Education. No confirma por sí sola la ausencia de errores de sonido ni la visualización del icono del pack. Se solicitó esa confirmación para 1.0.3 y sigue pendiente.

## Cierre de la primera versión 0.3.0 — 2026-10-14

Nico confirma: «Ya no aparece y el icono está ok», en respuesta a la comprobación del error de sonido y pack_icon de la revisión 1.0.3. Esto completa esa comprobación en Education junto a su confirmación anterior de que el cerdo funciona y las capturas en el mundo. El ojo ensanchado está aceptado para retocarlo pintando.

Alcance de la primera versión:
- Entrada verde en Cargadores con icono propio y asistente.
- Selector con estructura, miniaturas y medidas del Wizard; búsqueda en español y selección con teclado. Disponible sin instalar Wizard.
- Edición de todas las partes existentes mediante selección en el modelo o lista: tamaño, movimiento y giro. Las partes fraccionarias mantienen su forma y avanzan de a 1.
- Pantalla educativa que oculta menús/paneles generales y transformadores nativos; siete vistas más encuadre; pincel, relleno y copia de color sobre el modelo.
- Textos breves en español, deshacer/rehacer y descarga con instrucciones. El historial comienza con la criatura preparada.
- Exportación mcaddon con UUID estables por creación, versiones y dependencias cruzadas; iconos y sonidos compatibles con el comportamiento.

Evidencia: 19 pruebas automáticas del núcleo aprobadas; prueba web de apertura, un cambio y deshacer/rehacer en 73 entradas (output/catalog-browser-audit.json); recorridos web reales de selector, cámaras, pintura, selección, salida y descarga documentados arriba; comparación de paquetes en output/classroom-export-verification.json; validación de Nico del cerdo en Education.

Límites explícitos: no se han probado en el juego todas las variantes y criaturas; la colisión no se adapta a la geometría; no se añaden piezas nuevas; no se guarda una sesión educativa completa para reabrirla; el relleno por borde puede necesitar retoque manual. Esta es una primera versión para prueba acompañada en clase, no una certificación de todas las combinaciones del catálogo.

## Herramientas de pintura y visibilidad — 2026-10-14

- «Dale color» incorpora iconos y nombres para pincel, borrador, suavizar, rellenar y copiar color. Tamaño de pincel/borrador entre 1 y 64 píxeles, con pasos de 1.
- Suavizado circular de radio 2 píxeles: mezcla RGB mediante vecinos ponderados por alfa y conserva el alfa original. Restringido a la cara activa y al recorte nativo; usa una operación nativa de pintura/deshacer por trazo.
- Mostrar/ocultar huesos desde una lista con ojos, con «Mostrar todas». Ocultar un hueso oculta sus descendientes; mostrar un descendiente revela también sus padres. Se restaura la visibilidad al volver a forma o salir. Exportar incluye las piezas temporalmente ocultas.
- Pruebas web reales: incremento 1→3; borrador de tamaño 3 elimina 9 píxeles; suavizado cambia 39 canales RGB sin cambiar alfa; Ctrl+Z restaura el PNG exacto en ambos casos. Exportación con hat oculto contiene los 7 cubos y el cubo de hat. Mostrar hat tras ocultar head recupera ambos. Captura output/playwright/paint-tools-final.png.
- 20 pruebas del núcleo pasan, incluida conservación de alfa, radio y píxeles exteriores del suavizado. Sintaxis correcta y copia instalada sincronizada.
# Web con inicio directo — 2026-10-15

Compilación web de Blockbench 5.2.2 fijada a `c9ace42ef1b770bdadfe656729c7833b8feb37d2`. Prueba local bajo `/blockbench-edu-web/` en navegador limpio a 1366 × 768: inicio automático de Edu, selección inicialmente vacía y «Siguiente» deshabilitado, cancelar y volver a comenzar, creación del cerdo, ancho 8 → 9, desplazamiento, pintura real, deshacer y rehacer con igualdad exacta del PNG, cambio docente/alumno conservando la pintura y descarga de addon. El paquete descargado contiene cabeza de 9 × 8 × 8, textura de 46 × 55, versiones 1.0.1 sincronizadas, dependencias mutuas e iconos en ambos packs. Sin service workers registrados. Fallo de carga simulado: a los 30 segundos muestra «Reintentar», que vuelve a abrir el asistente al restablecer la carga. Las 20 pruebas automáticas pasan.

Esta prueba valida el canal web y el empaquetado. No añade una nueva comprobación dentro de Minecraft Education.
