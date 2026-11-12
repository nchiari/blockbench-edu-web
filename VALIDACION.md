# Validación del prototipo

## Causas de daño del cerdo — 12 de noviembre de 2026

- Vida y daño incorpora 15 opciones en cuatro desplegables: golpes/proyectiles/Espinas; fuego/lava/magma/explosiones/rayos; caídas/ahogamiento/asfixia/contacto/bloques que caen/congelación; daño mágico y Wither.
- Por defecto todas las causas siguen activas. Desmarcar una genera únicamente los bloqueos correspondientes con damage_sensor; no se agrega inmunidad general. Los daños fuera de la lista conservan su comportamiento. Fuego y lava se configuran por separado.
- Al desactivar lava también se elimina la condición adicional de daño por lava de la plantilla. No se modifica el addon de referencia, la curación, el daño que causa la criatura ni su vida. La protección permanece al montar o cambiar entre cría/adulto.
- 66 pruebas automáticas aprobadas. Navegador local: desactivar fuego/lava/caídas, resumen actualizado, deshacer/rehacer y descargas reales. Lectura de los archivos: formato portátil 6, causas bloqueadas fire, fire_tick, lava y fall; golpes todavía habilitados.
- Se admiten proyectos de formatos 1–5, con todas las causas activas al incorporar esta configuración. Original conserva intacto su comportamiento.
- Pendiente: verificación real de cada causa en Minecraft Education. Las opciones se refieren a pérdida de vida; no prometen inmunidad a todos los comandos, efectos, empujes o daños ajenos a la lista.


## Vida y daño — 11 de noviembre de 2026

- La categoría del cerdo se llama Vida y daño. Agrupa vida máxima (1–200) y daño por golpe editable (1–20); conserva la activación de curación y su acceso a los alimentos.
- El control de daño se mueve desde Combate, sin duplicarlo ni cambiar el valor guardado. Combate conserva la decisión de defender al dueño y remite a Vida y daño para la cantidad. El daño configurado solo actúa cuando el cerdo tiene un comportamiento de ataque o defensa.

## Montura del cerdo — 11 de noviembre de 2026

- Categoría Montura: activar acceso, exigir silla o montar directamente, control con zanahoria en un palo o paseo decidido por el cerdo, un pasajero y asiento ajustable (altura 0–4; adelante/atrás −2–2 bloques). Opciones bloqueadas y grisadas hasta activar Se puede montar.
- Acceso solo de adultos: el nacimiento elimina los grupos de montura; crecer incorpora acceso directo o interacción para colocar la silla. La silla colocada no se retira en esta primera versión.
- Eventos de subir/bajar retiran y restauran grupos de IA, seguimiento/defensa y reproducción. El grupo de domesticación y curación permanece; restaurar seguimiento depende de is_tamed. Si decide el cerdo, solo mantiene el paseo configurado mientras lleva pasajero.
- Los eventos de rideable requieren formato de entidad 1.21.80; solo al activar Montura se genera ese formato y se eleva el mínimo de BP/RP a esa versión cuando corresponde. Original y exportaciones sin montura conservan sus versiones. Se mantiene el esquema de reproducción anterior a 1.26.
- 63 pruebas automáticas aprobadas, incluidas silla/acceso directo, ambos controles, asiento, pausa/restauración, crianza, domesticación, validación y versiones de manifiestos. Sintaxis y build web comprobados.
- Navegador local: activar montura, quitar requisito de silla, cambiar ambos controles, asiento a altura 1,1 y posición −0,25; resumen actualizado y descargas reales de .bbedu y .mcaddon. Proyectos nuevos con estos ajustes: formato 5; siguen abriendo 1–4.
- Pendiente: prueba en Minecraft Education de interacción con silla, controles, asiento, pausa al montar/restauración al bajar y crecimiento de crías montables.

## Comida y crías del cerdo — 11 de noviembre de 2026

- Comida y cuidados: listas independientes para atraer, domesticar y curar; curación de 1–20 puntos por alimento y domesticación de 1–100 % por intento. Papa y remolacha se agregan a las opciones del cerdo.
- Crías: alimentos propios, espera de 10–3600 segundos y crecimiento de 10–7200 segundos. Solo adultos de esta misma creación. Si son domesticables, ambos padres deben estar domesticados; cada cría se domestica por separado, sin heredar dueño. Crecer conserva una domesticación realizada sobre la cría.
- Se conserva el esquema de entidad 1.16.0 de la plantilla: grupos adulto/cría, escala 0,5, is_baby, seguimiento de padres y evento de crecimiento. La animación baby_transform ya existe en el RP. Original conserva el BP intacto.
- Reproducción bloqueada con combate, huida del jugador o defensa del dueño; cambiar a esas opciones la desactiva con aviso. Curación y reproducción activas no comparten alimentos. En domesticables, la curación solo se activa después de domesticar.
- 60 pruebas automáticas aprobadas: listas, probabilidad, curación por alimento, conflictos, tiempos, grupos adulto/cría, identidad de descendencia, migración y persistencia. Comprobaciones de sintaxis y compilación web completadas.
- Navegador local: alimentos distintos, probabilidad 50 %, curación con zanahoria y remolacha (7 puntos), crías con papa, espera 60 s y crecimiento 120 s. Descargas reales de .bbedu y .mcaddon; lectura de ambos confirmó configuración y componentes. Los proyectos nuevos usan formato 4; se siguen leyendo 1–3.
- Pendiente: validación en Minecraft Education de alimentación, reproducción, presentación de crías, crecimiento y convivencia con domesticación.

## Presentación de Dale vida — 11 de noviembre de 2026

- Categorías con iconos, checkboxes centrados junto al texto y flechas a la derecha de selectores y secciones desplegables del editor educativo.
- En Dale vida se ocultan los atajos laterales de guardar/abrir y el panel de Partes. Su lugar lo ocupa «Tu criatura en Minecraft», con resumen y lista de ajustes que se actualizan al editar, sin el aviso explicativo sobre la vista 3D.
- El panel de Partes mantiene su estado abierto/plegado al pasar por Dale vida. El resumen se muestra aunque Partes estuviera plegado. Se verificó que el lanzador de Partes vuelva en Pintura y que el resumen desaparezca fuera de comportamiento.
- Las opciones incompatibles muestran checkbox y texto grisados; el tooltip del contenedor explica el motivo específico del bloqueo. Verificados en navegador: huida ante daño con Enemigo, domesticación incompatible, seguimiento sin domesticación y atracción incompatible. Alineación centrada y márgenes del checkbox comprobados.
- Presentación únicamente: no cambia la generación del comportamiento ni el formato de los proyectos. La validación dentro de Minecraft de las acciones sigue pendiente.

## Categorías de comportamiento del cerdo — 11 de noviembre de 2026

- Prueba limitada al cerdo, en `codex/pruebas`: seis botones de categorías con submenús, regreso al menú, resumen por categoría y foco en el título al navegar. Las otras plantillas conservan la interfaz anterior.
- Personalización nueva: paseo independiente, defensa propia al recibir daño, domesticación sin seguimiento obligatorio, distancias de seguimiento, radio de atracción y curación con el objeto elegido. Dependencias verificadas y combinaciones contradictorias rechazadas por el exportador.
- 57 pruebas automáticas aprobadas, incluidas transiciones entre reacciones y dependencias de controles. Navegador local: combinar seguimiento desde 12 bloques, vida 30 y curación de 7 puntos; descargar `.bbedu` y `.mcaddon`; reabrir el proyecto y recuperar los ajustes. Lectura de los archivos descargados confirmó los tres valores y el formato portátil 3. Se admiten proyectos de formatos 1 y 2.
- Controles bloqueados: domesticación fuera de No ataca; seguimiento y defensa sin domesticación; huida ante daño mientras ataca o defiende; atracción mientras ataca al jugador o huye de él. Los cambios automáticos muestran un aviso. Los límites de las distancias de seguimiento dependen entre sí.
- No se verificaron estas acciones dentro de Minecraft Education. Probar en un mundo descartable antes de considerar su lanzamiento.

## Dale vida — primera versión en pruebas — 11 de noviembre de 2026

- Rama `codex/pruebas`, sin incorporar cambios a `main`. Paso 3 «Dale vida» y paso 4 «Guardar y exportar».
- Bases: Original, Animal tranquilo, Animal asustadizo, Compañero, Guardián y Enemigo. Vida de 1 a 200 puntos, cuatro velocidades, objeto para atraer/domesticar y atracción opcional, daño de 1 a 20 y detección de 4 a 32 bloques según la base.
- Las bases nuevas generan una criatura terrestre adulta y reemplazan las habilidades especiales de la plantilla. Se conserva el tamaño de colisión original, sin adaptarlo a las ediciones del modelo. Original conserva intacto el archivo BP de comportamiento. No se simula la inteligencia en la vista 3D ni se agregan animaciones de ataque.
- Compañero y Guardián se domestican con un objeto, siguen a su dueño y no se pueden montar. Guardián selecciona como objetivo a quien daña al dueño después de la domesticación. Enemigo selecciona jugadores; la prueba de combate requiere Supervivencia o Aventura.
- `npm test`: 53 pruebas aprobadas, incluidos catálogo, rechazo de opciones inválidas/movimientos no admitidos, domesticación y separación de roles, exportación BP en carpetas y packs anidados, restauración de Original y persistencia de ajustes. `npm run check` y `npm run build:web` completados.
- Navegador local: creación de cerdo, cambio a Guardián, vida 40, velocidad rápida, zanahoria; deshacer/rehacer; cambio de pasos; descarga real de `.bbedu` y `.mcaddon`; lectura de ambos archivos confirmó los ajustes y los grupos de domesticación/seguimiento/defensa. Reapertura del `.bbedu` en una sesión nueva conservó los valores. También se configuró Enemigo, daño 8 y detección 24; sin errores de JavaScript en esa sesión.
- Los proyectos nuevos usan formato `.bbedu` versión 2. Se siguen abriendo proyectos versión 1 con comportamiento Original. Las versiones anteriores de Edu rechazan la versión 2; continuar estos proyectos en la web de pruebas hasta lanzar la actualización.
- Pendiente: validación real en Minecraft Education de persecución, daño, domesticación, seguimiento y defensa; revisión de animaciones y de cada plantilla que se vaya a usar en clase. Drive continúa deshabilitado para el origen de pruebas.

## Rescate ante cambios de estructura — 10 de noviembre de 2026

- El bloqueo por piezas sin registrar ofrece una copia `.bbmodel` y ya no aconseja reabrir la referencia. El rescate conserva modelo y pintura sin exigir los metadatos necesarios para exportar a Edu/Minecraft.
- `tests/rescue-model-probe.js`: **12 comprobaciones aprobadas** en Chromium con un zombi y una pieza duplicada fuera de los controles de Edu. Descarga real, piezas y posiciones exactas, PNG idéntico, partes ocultas incluidas, rutas locales omitidas y reapertura con el codec de Blockbench recuperando la pintura. Cancelar conserva el proyecto. Se comprobó también Ctrl + Alt + S como salida para pestañas anteriores a esta actualización; los dos archivos descargados contienen la pintura integrada.
- `npm test`: **48 pruebas aprobadas**; `npm run check` y `npm run build:web` completados. Archivos de prueba en `output/playwright/structure-rescue.bbmodel` y `native-structure-rescue.bbmodel`.
- No se identificó la acción concreta que desajustó la sesión del alumno ni se recuperó su trabajo real. La salida de rescate no reconstruye los metadatos de Edu ni acredita una importación en Minecraft.

## Tercer paso «Guardar y compartir» — 10 de noviembre de 2026

- El tercer paso abre una ventana con dos acciones: guardar un proyecto editable `.bbedu` o descargar el addon `.mcaddon` para Minecraft. Si hay una clase configurada, ofrece además «Entregar al profe».
- La ventana se puede cerrar con «Seguir creando» sin modificar la criatura. Conserva los accesos de guardado y apertura del menú lateral.
- `npm run check`, `npm test` (**48 pruebas aprobadas**) y `npm run build:web` completados. `tests/session-project-probe.js`: **23 comprobaciones aprobadas**, con las descargas reales de `.bbedu` y `.mcaddon` pasando por la nueva ventana, reapertura, edición y exportación posterior.
- `tests/web-entry-probe.js` comprobó los accesos de alumno/docente y la opción de entrega en el nuevo menú cuando hay clase, sin enviar trabajos a Drive. Se ajustó también la prueba de exportación con partes ocultas al nuevo recorrido.
- Ventana revisada visualmente a 1024 × 768. Evidencia: `output/playwright/save-options-1024.png`, `save-options-result.txt` y `save-options-entry-result.txt`. No se importó en Minecraft ni se publicó esta revisión durante esta tarea.

## Proyectos portátiles — 10 de noviembre de 2026

- «Guardar mi criatura» descarga un único `.bbedu` con modelo y pintura integrados, addon base y metadatos de edición. «Abrir una criatura» está disponible en el asistente, inicio, editor alumno y panel docente.
- `npm test`: **43 pruebas aprobadas**, incluidas conservación del contenido original del addon, identidad y versión, y rechazo de proyectos incompletos, incompatibles o con datos inconsistentes. `npm run check` y `npm run build:web` completados.
- `tests/session-project-probe.js`: **20 comprobaciones aprobadas** en Chromium, con la compilación local de Blockbench 5.2.2. Se modificó tamaño, posición, giro y pintura de un zombi; se descargó el proyecto, recargó la página y abrió usando solamente el archivo.
- Geometría, PNG, UUID de piezas/textura, nombre y límites de tamaño recuperados sin diferencias. Se pudo volver a cambiar tamaño y pintar; deshacer recuperó exactamente el estado guardado. Las pruebas esperan a que termine la restauración asíncrona de los bitmaps nativos.
- Exportación antes y después: BP/RP de `1.0.1` a `1.0.2`, con dependencias cruzadas. Las pruebas de archivo comprueban que los UUID de los packs se mantienen y que se conserva cada archivo del addon base.
- Partes ocultas temporalmente guardadas completas y visibles al reabrir. Abrir otro proyecto conserva el anterior en su pestaña. Un archivo inválido conserva la criatura actual; su aviso también es accesible desde el inicio.
- Apertura y guardado comprobados en la entrada docente. Botones revisados visualmente a 1024 × 768. Evidencia: `output/playwright/session-project-result.txt`, `session-restored-1024.png`, `session-roundtrip.bbedu`, `session-before.mcaddon` y `session-after.mcaddon`.
- El proyecto reinicia historial de deshacer, cámara, herramientas y selecciones temporales. No incluye código de clase ni rutas locales de las texturas. No se agregó guardado automático ni recepción de `.bbedu` en Drive.
- No se importó el addon resultante en Minecraft Education ni se publicó esta revisión en la web pública durante esta tarea.

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

Publicación confirmada en `https://nchiari.github.io/blockbench-edu-web/`, revisión `0a2531d`, Actions `38714991797` completado correctamente. La prueba se repitió sobre la dirección pública en un navegador limpio: cero plugins instalados, español, cero service workers y cero errores de consola. Inicio directo, cancelar/reiniciar, criatura inicialmente vacía, creación del cerdo, tamaño, movimiento, pintura real, recuperación exacta del PNG con deshacer, regreso desde docente y descarga comprobados. El addon público contiene cabeza 9 × 8 × 8 y origen X −5,5 tras el movimiento (el codec Bedrock invierte el eje X), textura 46 × 55, iconos y dependencias cruzadas con versiones sincronizadas. Evidencia local: `output/public-web-validation.json` y `output/public-web-pig.mcaddon`.


## Feedback de navegación y cámara — 2026-10-15

- Deshacer y rehacer fuera del contenido desplazable; acciones inferiores del asistente fijas; catálogo ordenado por nombre español; retorno al alumnado independiente del panel nativo.
- Prueba automatizada de interfaz en Chromium con `tests/classroom-ui-probe.js`: 1366×768, 1280×720 y 1024×768; viewport CSS al 100 % y equivalente a zoom 125 % (emulación de métricas, no el botón de zoom de un navegador físico). Se comprobaron 6 diseños del asistente y 24 combinaciones del editor: ancho mínimo/máximo, forma/color y controles de cámara desplegados. Sin solapamientos y con historial siempre visible. Altura mínima de la vista 3D observada: 191 px.
- Catálogo completo y filtrado ordenados; ninguna criatura seleccionada inicialmente; Enter selecciona una tarjeta y habilita Siguiente.
- 32 acciones de cámara verificadas con clics: 10 en perspectiva y 6 en ortográfica, en forma y color. Cambian la cámara y conservan geometría, UV, bitmap, UUID e índice de deshacer. Los 4 giros se deshabilitan en ortográfica.
- Pincelada real sobre el modelo, redimensionado y arrastre 3D: un paso de historial por operación; deshacer/rehacer desde los botones fijos recupera los estados completos. Regreso desde docente después de editar conserva UUID, geometría, pintura e historial.
- El regreso independiente se oculta al seleccionar otro proyecto sin sesión Edu y se elimina al descargar el plugin.
- Artefacto de prueba local: `output/feedback-ui-audit.txt`. Capturas en `output/playwright/feedback-*.png`.
- Pendiente: prueba manual de comodidad con touchpad físico. El usuario confirmó que la realizará después de publicar; no se considera validada por los clics automatizados.

## Panel lateral de partes — 2026-11-10

- Se reemplaza el desplegable al final de Pintura por un panel derecho abierto al iniciar, disponible en Forma y Color. La vista 3D reserva su espacio y recupera el ancho al plegarlo. El botón externo «Partes» queda por encima del lienzo nativo y muestra el número de partes ocultas.
- Los ojos conservan el comportamiento de jerarquía existente: ocultar un hueso oculta sus descendientes y mostrar un descendiente revela sus padres. «Ver solo» aísla únicamente los cubos de la parte elegida, incluso cuando esa parte es el cuerpo que contiene al resto de los huesos. Después de aislar, cada ojo permite añadir o quitar partes individualmente. «Mostrar todas» restaura la visibilidad inicial.
- Las partes ocultas se mantienen al alternar entre Forma y Color, al redimensionar y al deshacer/rehacer. Salir a la vista del docente restaura la visibilidad inicial. El estado abierto/plegado se conserva durante la sesión; no añade guardado entre cierres del navegador.
- Prueba real de navegador con `tests/parts-panel-probe.js`: ojos, cabeza y capa hija, aislamiento del cuerpo y de la cabeza, combinación de partes, plegado, ampliación del lienzo, foco de teclado y Escape, cambio de modo y redimensionado con recuperación exacta de geometría, UV y PNG.
- Descarga nativa `output/parts-panel-hidden.mcaddon` con solo la cabeza visible: contiene los siete cubos del zombi y todos sus huesos coinciden exactamente con los de antes de ocultarlos. La descarga conserva el aislamiento en el editor. No se realizó una nueva importación dentro de Minecraft Education.
- 12 combinaciones de distribución del panel comprobadas: 1366×768, 1280×720 y 1024×768, al 100 % y con métricas equivalentes al 125 %, menú izquierdo mínimo/máximo y controles de cámara abiertos. Sin solapamientos con la vista 3D ni las cámaras; «Mostrar todas» permanece fijo y la lista conserva desplazamiento propio. En ventanas bajas se omite la ayuda inferior para dar lugar a la lista; el caso más ajustado mantiene 59 px de lista y 240 px de ancho de vista 3D.
- También pasó la prueba general existente `tests/classroom-ui-probe.js`: 6 distribuciones del asistente, 24 del editor y 32 acciones de cámara. Pincelada real adicional sobre la cabeza aislada: cambia el PNG en una sola acción y Deshacer recupera exactamente la pintura sin mostrar otras partes. Evidencia del trazo en `output/parts-paint-probe.js`; captura en `output/playwright/parts-panel-final.png`.
- Sintaxis, 39 pruebas automáticas y compilación web correctas. Copias del plugin del proyecto, instalación local y web compilada sincronizadas por SHA-256. Validación local; no acredita publicación de este cambio en GitHub Pages.

## Dirección principal en Cloudflare Pages — 2026-11-10

- Dirección principal confirmada por el usuario: [Blockbench Edu](https://blockbench-edu.pages.dev/). Proyecto de Cloudflare Pages: `blockbench-edu`, conectado al repositorio `nchiari/blockbench-edu-web`, rama `main`.
- Comprobación HTTP de la dirección pública: respuesta 200, título `Blockbench Edu`, pantalla inicial `edu-web-start` y referencia al archivo de inicio `edu-web` con nombre derivado de su contenido.
- Esta comprobación acredita la disponibilidad de la página y esas referencias en su HTML. No acredita la ejecución completa del editor en navegador, la publicación de todos los cambios locales ni una nueva prueba dentro de Minecraft Education.
- Se actualizan los README con la dirección principal, la configuración de compilación y el procedimiento de publicación en Cloudflare. Las comprobaciones históricas en GitHub Pages conservan sus direcciones originales.
- La adaptación y validación de la integración con Drive quedan fuera de este cambio y se gestionan por separado.

## Selección por color para las herramientas de pintura — 2026-11-10

- Nuevo botón «Seleccionar color» en «Dale color». Un clic sobre el modelo 3D crea una selección nativa de todos los píxeles con el mismo RGBA de la textura de trabajo; no modifica el bitmap. Incluye coincidencias separadas y partes ocultas. Se omiten los clics sobre píxeles totalmente transparentes.
- La selección permanece activa al cambiar de herramienta. Pincel y Borrador usan la restricción nativa; Suavizar aplica expresamente la máscara porque Blockbench no la aplica a los callbacks de dibujo personalizados. Rellenar pinta de forma opaca todos los píxeles seleccionados con un clic dentro de la selección, incluidas las partes ocultas. Sin selección mantiene su comportamiento habitual.
- Se muestran el número de píxeles y «Quitar selección». La selección y su limpieza usan el historial nativo de selecciones cuando esa opción de Blockbench está activada. Las acciones de pintura usan siempre su historial normal. Si un cambio de tamaño reorganiza la textura y vacía la máscara, se elimina la restricción vacía para no bloquear la pintura.
- `tests/color-selection-probe.js`: 12 comprobaciones reales aprobadas en Chromium. Selección de dos píxeles separados, uno en el cuerpo oculto; exclusión de colores cercanos y de otras transparencias; selección sin repintar; bote sobre toda la selección; conservación exacta de los píxeles no seleccionados con pincel, borrador y suavizado; PNG idéntico tras deshacer y rehacer; limpieza y recuperación de la selección desde el historial nativo activado en la prueba.
- La prueba usa coordenadas enteras de pantalla para evitar diferencias de redondeo en los bordes de los píxeles y compara el bitmap leído del canvas, que normaliza los RGB de píxeles transparentes o semitransparentes. Captura de prueba en `output/playwright/color-selection-final.png`.
- Copias del proyecto y de la instalación local sincronizadas; compilación web local generada. No se realizó una nueva publicación ni una importación en Minecraft Education como parte de este cambio.

## Accesos separados para alumno y docente — 2026-11-10

- La compilación genera la entrada alumno en `/` y la entrada docente en `/docente/`, con los mismos recursos compartidos. La entrada alumno es la predeterminada y no depende de una preferencia guardada en el navegador. No se crean subdominios ni cuentas.
- El alumno termina el asistente en la barra educativa, sin «Para el docente» ni la cabecera general de Blockbench. Cancelar vuelve al inicio de Edu. La acción antigua de salir queda también deshabilitada en esa entrada.
- El docente termina el asistente en el editor completo; cancelar deja disponible el inicio general. Conserva la vista de prueba de alumnos y su regreso al docente. Se actualiza la visibilidad del botón de prueba al cerrar el asistente.
- El enlace de clase generado desde el docente apunta a la entrada alumno y conserva el fragmento `#clase=…`, tanto desde la raíz de Cloudflare como desde la subruta de GitHub Pages. No se modifica el receptor ni su lista de orígenes admitidos.
- Sintaxis correcta, 41 pruebas automáticas aprobadas y compilación web correcta. `tests/web-entry-probe.js` pasó en Chromium con los archivos servidos desde la raíz y desde `/blockbench-edu-web/`: cancelación de ambos accesos, creación de un zombi, barra alumno, ausencia de controles docentes, pintura, recarga, editor docente, vista de prueba y regreso, enlace de clase y botón «Entregar al profe». Se usó un código ficticio y no se envió ningún archivo a Drive.
- Capturas revisadas en `output/playwright/entry-student.png` y `output/playwright/entry-teacher.png`. Las pruebas existentes de interfaz y partes reconocen la entrada alumno, que ya no ofrece el cambio al docente; sus baterías completas de resoluciones no se repitieron en este cambio.
- Validación local. Pendiente publicar y comprobar el despliegue en Cloudflare; no se realizó una nueva importación en Minecraft Education. El plugin instalado manualmente conserva el cambio de vista anterior y no se sincronizó su instalación en este trabajo.


## Movimiento, respiración y objetivos del cerdo — 2026-11-12

- Controladores de vuelo, natación y movimiento anfibio basados en los BP vanilla 1.26.30 (loro, bacalao, ajolote) y la documentación de Minecraft Creator. Respiración independiente del movimiento y protecciones por daño.
- Listas con búsqueda para atacar o evitar 12 familias, exclusión mutua y respeto de mascotas domesticadas en la selección de ataque. Evitar filtra también represalias y defensa del dueño. Detección compartida de 4 a 32 bloques.
- Restricciones verificadas: montura solo con Camina; atacar criaturas desactiva pánico y reproducción. Opciones bloqueadas en gris con tooltip. Resumen derecho e historial reflejan los cambios.
- Pruebas automáticas de controladores, respiración, validación de objetivos y conflictos, exportación y guardado .bbedu 7 con lectura de proyectos previos. Navegador: búsqueda, selección y bloqueo de zombis en la lista opuesta, respiración en ambos medios, resumen, descarga de .bbedu y .mcaddon inspeccionados.
- Pendiente probar dentro de Minecraft Education el vuelo, el regreso a tomar aire, la supervivencia de una criatura acuática en tierra y el combate/huida con distintos objetivos. La estructura del addon y la interfaz no acreditan esas pruebas en el juego.
