# Investigación técnica: creación de mobs para niños con Blockbench

Fecha: 12 de octubre de 2026. Estado: revisión estática del código; todavía no hay un prototipo ejecutado ni pruebas de importación en Minecraft Education.

## Revisión de alcance confirmada por Nico (posterior a la investigación inicial)

Esta sección prevalece sobre las recomendaciones de alcance que aparecen más abajo. El resto conserva la investigación inicial y las alternativas como referencia histórica.

- Prueba interna y educativa. Usar el Entity Wizard disponible como base funcional y como dependencia de la prueba; Nico también tiene su JS local. No convertir las dudas de licencia o distribución pública en un bloqueo para investigar y probar. No se declara que el bundle tenga una licencia abierta ni se publicará una adaptación en esta fase. Si más adelante hay distribución, tratar ese punto con Jannis.
- Teclado y ratón exclusivamente para el MVP. Web y español principal siguen vigentes. Pantallas táctiles, tablet e interacción con dedo quedan para una etapa posterior.
- La salida obligatoria es mcaddon con resource/behavior packs, geometría y textura actualizadas. Exportar solo bbmodel o geometría no cumple el MVP.
- Densidad fija de 16 píxeles por bloque de Minecraft; una unidad de geometría de Blockbench (1/16 de bloque) corresponde a un píxel de textura. Dimensiones con pasos enteros de 1 unidad; no estirar la imagen para cubrir nuevas áreas.
- Al agrandar un cubo, ajustar automáticamente sus regiones UV y darles espacio sin superponerlas con las de otras piezas. Al superar el atlas disponible, aumentar el lienzo de textura sin escalar sus píxeles.
- Al achicar, ajustar UV y reducir el lienzo al tamaño requerido por el conjunto del modelo. Una reducción local no implica necesariamente reducir el atlas global si otras piezas ocupan los extremos. Empaquetado y tamaño deterministas y sin redondeo a potencias de dos como regla inicial; comprobar límites del formato y motor con casos reales.
- Ctrl+Z y rehacer deben restaurar como una única operación la geometría, todas las UV afectadas, dimensiones de textura y sus píxeles. No usar uv_only para el snapshot de una acción que también cambia geometría.

### Evidencia adicional y diseño propuesto para UV automático

Se inspeccionó js/texturing/texture_generator.js. Ya tiene generación de plantillas a resolución 16, cálculo de ocupación, reorganización de UV, transferencia de textura a nuevas posiciones y cambio de dimensiones. js/undo.js contempla snapshots de elementos, bitmap y uv_mode (dimensiones del proyecto). Son piezas aprovechables; no existe evidencia de que el flujo pedido se ejecute automáticamente al redimensionar un cubo.

El generador actual abre su propia transacción Undo, incluye opciones de generación/empacado y en la ruta de anexar a una textura evita reducir el tamaño por debajo del existente. No encadenarlo ingenuamente con Cube.resize esperando un único undo y reducción automática. Hace falta un controlador que coordine todo el cambio o una adaptación acotada de esas rutinas.

Orden propuesto: capturar estado completo; guardar los píxeles originales de cada cara; aplicar cambio entero de geometría; calcular nuevas regiones UV a densidad 1:1; empacar regiones sin solapamiento; construir el atlas del tamaño requerido; copiar píxeles sin escalarlos; actualizar UV/dimensiones/bitmap; cerrar una única transacción Undo. Incluir todos los cubos cuya UV se haya movido en el snapshot, no solo el cubo redimensionado. Agrupar un arrastre de control en una acción; deshacer todos sus efectos con Ctrl+Z.

Política de dibujo para superficie nueva confirmada por Nico: repetir el píxel del borde, manteniendo el dibujo existente sin escalarlo. Si el borde es opaco, la extensión también lo será; conservar el alfa del píxel original. Al ampliar en dos ejes, extender también las esquinas con su píxel más cercano. Al achicar, recortar desde el borde elegido. Undo debe recuperar píxeles recortados. Que vuelvan automáticamente al agrandar manualmente otra vez requeriría además guardar pintura fuera del área activa; queda pendiente de decidir, no es equivalente a Undo.

Usar IDs estables de cubo/cara para conservar el dibujo al reorganizar. Resolver al preparar la plantilla las regiones espejadas o compartidas: pueden mantenerse vinculadas o independizarse con una copia inicial. Definir reglas explícitas para dimensiones de cero en planos decorativos; no aplicar un mínimo de volumen a ciegas a todo modelo vanilla.

### Nuevo primer hito técnico

Un mob vanilla simple generado con el Wizard; una pieza editable (cabeza) y luego cuerpo; ajuste de 1 unidad por acción. Pintar un patrón reconocible, ampliar 4 unidades, comprobar la densidad, UV y lienzo; achicar y verificar recorte; deshacer/rehacer toda la operación; exportar mcaddon e importar en Education. Este circuito de geometría–UV–pintura–undo–mcaddon precede al trabajo amplio de interfaz. El código revisado demuestra componentes disponibles; falta ejecutar esta prueba.

## Objetivo y decisiones del proyecto

Nico quiere una actividad lúdica para chicos de primaria de 9 a 11 años: transformar una criatura de Minecraft y verla funcionar en Minecraft Education. El objetivo educativo es introducir bases de modelado 3D durante la actividad, sin convertirla en un curso de Blockbench. Público inicial: talleres municipales propios; primero prueba interna de Nico, después iteración y prueba con niños.

Requisitos confirmados: navegador web; combinación de Windows, Chromebook y tablets; español como idioma principal; partir de entidades vanilla, sin modelado desde cero en la primera versión; modificar textura y geometría dentro de límites por definir. El Entity Wizard es la referencia funcional del recorrido. Nico confirma que sus exports mcaddon se pueden importar en Education y menciona 1.26.32 en manifests. Falta identificar el campo exacto y contrastar un archivo funcional con la versión de Education usada.

## Fuentes y versiones inspeccionadas

Se clonaron superficialmente tres repositorios públicos para lectura. No se modificó el producto ni se instaló/ejecutó su aplicación.

| Repositorio | Revisión exacta | Función |
| --- | --- | --- |
| https://github.com/JannisX11/blockbench | 7c92e27d237e365110030d73e92c5d1605f0d311 | Editor, interfaz, modelado, pintura, exportación |
| https://github.com/JannisX11/blockbench-plugins | 91ac60fa067008937393e88c902f8871406f55ed | Distribución compilada del Wizard y reglas del catálogo |
| https://github.com/JannisX11/minecraft-wizards | 94e71c2fa23f8eb9a30fdd7c48a28f000049884b | Información y seguimiento de incidencias |

El package.json inspeccionado declara Blockbench 5.2.2. Esto identifica la revisión analizada, no demuestra qué versión está sirviendo actualmente web.blockbench.net. El catálogo y registro del plugin declaran Entity Wizard 1.8.3, compatible con web y desktop, mínimo Blockbench 4.8.0.

## Hallazgo principal: Wizard y Blockbench no tienen la misma disponibilidad de código

Blockbench publica fuentes bajo GPL. El README de minecraft-wizards afirma que el código de los Wizards no está publicado y que ese repositorio es informativo y de incidencias.

En blockbench-plugins sí existe plugins/minecraft_entity_wizard/minecraft_entity_wizard.js: un bundle compilado y minificado de aproximadamente 1,94 MB. Se inspeccionaron fragmentos para conocer cómo funciona. En esa carpeta y metadatos no se encontró una licencia abierta específica. No asumir que la GPL de Blockbench se extiende a ese plugin o que poder descargar un bundle permite modificarlo y redistribuirlo.

La conclusión no es que sea técnicamente imposible integrarlo. Es que no tenemos una base demostrada para copiar sus fuentes, plantillas y assets a una aplicación derivada. Para una adaptación profunda del Wizard conviene preguntar a Jannis por licencia, fuentes y puntos de extensión disponibles. Esto no bloquea una prueba independiente del editor simplificado.

Fuentes: https://github.com/JannisX11/minecraft-wizards ; https://github.com/JannisX11/blockbench-plugins/tree/master/plugins/minecraft_entity_wizard ; https://github.com/JannisX11/blockbench-plugins/blob/master/README.md

## Mapa del código de Blockbench

| Archivo relativo | Evidencia inspeccionada | Implicación |
| --- | --- | --- |
| package.json y build.js | TypeScript/JavaScript, Vue 2.7, Three.js, esbuild, JSZip; targets web/Electron | Hay una base web construible; no hace falta desarrollar un motor 3D |
| js/modes.ts | Mode con component, hide_toolbars, hide_sidebars, hide_status_bar; eventos al seleccionar/desseleccionar | Se pueden añadir pantallas y modos propios |
| js/interface/panels.ts | Panel con componentes Vue, condiciones, posiciones por modo y slot hidden | Se pueden crear controles infantiles y gestionar paneles |
| js/api.ts | addCSS, sistema de eventos, isTouch/isMobile y selección de interfaz | Estilos propios y detección de interacción disponibles |
| js/preview/preview.ts y OrbitControls.js | Eventos pointer/touch y controles de vista | Reutilizar cámara y visor; probar gestos reales |
| js/outliner/types/cube.js | Cube con from/to/origin, resize, setUVMode, actualización de geometría y UV | Controles de proporciones son viables, pero hay que gestionar texturas y anclajes |
| js/outliner/* | Cubos, grupos y jerarquía | Traducir estructura técnica a partes del cuerpo; conservar nombres y pivotes |
| js/texturing/painter.js | Pintura, integración con Undo, pointer/stylus | Reutilizar pintura 3D; resolver separación entre girar y pintar |
| js/texturing/textures.js | fromDataURL, getBase64, edit | Capturar y restaurar texturas dentro del proyecto |
| js/undo.js | initEdit/finishEdit y snapshots | Cada control propio debe integrarse con deshacer/rehacer |
| js/formats/bedrock/bedrock.js | Codec de importación y compilación de geometría Bedrock | Exportar geometría sin reimplementarla |
| js/formats/bbmodel.js | Codec de proyecto con geometría/texturas y otros datos | Base para guardar/reabrir; añadir estado educativo explícito |
| js/file_system.ts | Rutas separadas de escritorio y navegador | En web, descarga/importación mediante selector de archivos |
| js/languages.ts y lang/es.json | Traducción española y mecanismos de traducción | Español principal viable; redactar lenguaje infantil propio |

Documentación complementaria: https://web.blockbench.net/docs/classes/generated_modes.Mode.html ; https://web.blockbench.net/docs/classes/generated_interface_panels.Panel.html ; https://blockbench.net/wiki/docs/plugin/

## Límite importante de los modos personalizados

Hay comprobaciones explícitas de Modes.edit y Modes.paint dentro del visor y herramientas de pintura. Registrar Mode('edu') no garantiza que todas las herramientas existentes funcionen igual. No falsear estas banderas sin revisar consecuencias.

Propuesta para la prueba: usar los modos nativos Edit/Paint y superponer/añadir controles propios. Preservar y restaurar condiciones, paneles y estilos al entrar/salir del recorrido o descargar el plugin. Registrar los elementos de interfaz que todavía dependen de DOM/CSS interno. Si ese número crece mucho, evaluar un fork web acotado.

## Qué hace el Wizard publicado

El bundle registra una Action new_bedrock_entity, un ModelLoader y un Dialog con componente Vue. Exporta mediante exportPacks, arma resource/behavior packs, recoge geometría mediante Codecs.bedrock.compile({raw:true}), captura textura y usa JSZip para producir un mcaddon. Incluye rutas de Education en escritorio y opciones de edición web.

Expone window.EntityWizardProject como estado, pero gran parte del asistente permanece dentro del cierre del bundle. Hay objetos de acciones accesibles, pero no se identificó una API pública documentada para sustituir sus pasos y UI. Su existencia no equivale a un contrato estable de integración. No diseñar el producto alrededor de manipular Dialog.content_vue o variables internas.

Esto confirma que geometría, pintura y empaquetado pueden conectarse en navegador. No valida la importación actual en Education ni autoriza copiar el bundle.

## Manifests: precisar 1.26.32

En el bundle 1.8.3 inspeccionado, los manifests generados para BP y RP usan format_version:2, header.version:[1,0,0] y header.min_engine_version:[1,16,0]. No se encontró 1.26.32 como requisito de ese exportador.

Son conceptos distintos: format_version define el esquema; version define la versión del pack; min_engine_version define la versión mínima del motor y compatibilidad. No reemplazar indiscriminadamente los campos por [1,26,32].

Acción previa a fijar el exportador: inspeccionar un mcaddon de Nico que funcione y confirmar versión de Education, campo cambiado y resultado de importación. Mantener un perfil de compatibilidad verificable para el aula; no perseguir automáticamente la última versión de Bedrock.

Referencia: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable

## Texturas y deformación: riesgo para el MVP

En modelos con box UV, el tamaño del cubo participa en el cálculo de la distribución de caras de textura. Cambiar dimensiones puede cambiar qué píxeles aparecen en cada cara y producir solapamientos. La API resize llama a actualización de UV. Conservar uv_offset no alcanza para asegurar que el aspecto se mantenga.

Probar con una cabeza y cuerpo de una entidad simple: guardar regiones originales por cara y usar UV por cara fijos al modificar dimensiones. El exportador Bedrock admite UV por cara; comprobar que la conversión mantiene orientación y regiones. El efecto esperado es estirar el dibujo sobre la superficie modificada. Revisar espejo, caras compartidas y pintura antes/después de deformar.

Conservar huesos, nombres, jerarquía y pivotes mantiene referencias de animación, pero no garantiza que una deformación grande se vea bien. Limitar proporciones; probar caminar y mirar en Education. La hitbox del comportamiento no se adapta automáticamente al tamaño visual; mantenerla preparada y restringir la deformación o ajustar explícitamente según la plantilla.

## Alternativas y recomendación

| Ruta | Ventaja | Costo/riesgo | Uso propuesto |
| --- | --- | --- | --- |
| Plugin propio sobre Blockbench web | Reutiliza motor, pintura, undo y codecs; rápido para prueba interna | Algunas simplificaciones requieren condiciones y CSS; app anfitriona actualizable | Primera prueba |
| Adaptación del Entity Wizard | Usa el recorrido y generador existentes | Fuentes/licencia y API de integración no confirmadas | Explorar con Jannis, no dependencia inicial |
| Fork web de Blockbench con capa educativa propia | Control de entrada, versión y UI | Mantener cambios y actualizaciones; GPL y marca | Si el plugin no logra una UX mantenible |
| Extraer un motor e inventar editor desde cero | Control amplio | Dependencias y globals entre subsistemas; mucho trabajo para editor/pintura | No recomendado para el MVP |

El código tiene módulos, pero también mucha interconexión y globals. No se identificó una biblioteca autónoma y limpia de motor que se pueda importar sin el resto del editor.

## MVP interno propuesto, pendiente de acuerdo de producto

Objetivo de aceptación: Nico carga una criatura preparada, cambia cabeza/cuerpo, pinta, guarda/reabre y obtiene un addon que muestra esos cambios en Education. Una sola criatura prueba el circuito; no representa el alcance final para niños.

### Preparación del docente

Usar el Wizard oficial instalado, sin modificarlo, para preparar una entidad simple (cerdo como candidato), exportar mcaddon de referencia y guardar el proyecto editable. Revisar si los archivos resultantes pueden usarse/distribuirse como plantillas del producto; no extraer la base de datos ni assets del bundle. La prueba local puede trabajar con los archivos propios de Nico. Si las condiciones no permiten distribuir esas plantillas, obtener los recursos mediante una ruta autorizada o crear recursos propios.

### Recorrido del editor

1. Abrir plantilla preparada. En la prueba interna puede ser manual; no construir todavía un catálogo automático de mobs.
2. Forma: seleccionar Cabeza/Cuerpo por botones; ajustar ancho, alto y profundidad con pasos y límites; selección resaltada; tres vistas y encuadrar. Patas quedan fijas inicialmente. Conservar huesos y pivotes.
3. Color: pincel, relleno y paleta; pintura sobre modelo. Alternar claramente Pintar/Mirar en táctil. Deshacer/rehacer visibles.
4. Guardar/Reabrir: proyecto con textura, límites, correspondencia de partes y metadatos de exportación. No depender de memoria temporal del Wizard. bbmodel más metadatos educativos o contenedor propio con modelo y pack de referencia; decidir tras prueba de serialización.
5. Exportar: primera comprobación puede usar reexportación oficial del Wizard en la misma sesión, para aislar el editor. Para completar el MVP interno, añadir un empaquetador propio que lea un addon de referencia y sustituya geometría/textura con JSZip, conservando los demás archivos. No necesita reproducir el catálogo ni generador de comportamientos del Wizard. Leer manifests para determinar raíces/rutas; no asumir nombres fijos de carpetas. Registrar en el proyecto las rutas de cada plantilla.

La identidad debe sobrevivir a reexportaciones: UUID e identificador estables por proyecto; versión del pack que aumente al publicar cambios; proyecto nuevo obtiene UUID/identificador propio. Generar un identificador válido separado del nombre visible. Probar actualización del pack en un mundo existente y dos proyectos simultáneos.

El comportamiento será el de la plantilla. Elegir comportamientos, añadir cubos, animar manualmente, publicar galerías y crear desde cero quedan fuera de esta primera comprobación.

### Orden de implementación

A. Prueba técnica breve: cargar plantilla y controles de cabeza/cuerpo; confirmar UV e interacción táctil. Es el punto que puede invalidar la estrategia de plugin.
B. Pintura reducida y deshacer/rehacer integrados.
C. Serialización del proyecto y exportación propia desde addon de referencia.
D. Prueba de Nico con importación real en Education; iterar con hallazgos.
E. Antes de niños: ampliar a 2–3 bases verificadas, entrada sin preparación técnica por el alumno, instrucciones, recuperación y exportación/importación probadas en cada plataforma de aula.

No iniciar con catálogo completo de entidades o combinaciones arbitrarias de apariencia/comportamiento.

## Matriz mínima de validación

| Prueba | Resultado de aceptación |
| --- | --- |
| Deformación | No cambia regiones de textura de forma inesperada, huesos siguen válidos |
| Pintar y girar | Se distingue cada acción con mouse y con dedo |
| Deshacer/rehacer | Revierte geometría y trazos correctamente |
| Guardar/cerrar/reabrir | Recupera textura, dimensiones y estado de exportación |
| Exportar/importar | Nombre y modificaciones visibles en Education |
| Animación | Caminar/mirar conservan movimiento entendible |
| Reexportar | Pack actualizado sin duplicaciones accidentales |
| Dos criaturas | No chocan UUID, identificadores o rutas |
| Chromebook/tablet reales | Descarga y paso a Education completables; no basta emulación |
| Salir del modo educativo | Blockbench recupera interfaz y ajustes originales |

Windows + Chrome, Chromebook + Chrome y tablet real deben probarse. Falta conocer si las tablets son Android, iPad o ambas y sus tamaños. No declarar soporte universal sin esas pruebas.

## Preguntas para Jannis cuando haya una primera prueba

¿Puede compartir fuentes/licencia del Entity Wizard o autorizar una adaptación educativa? ¿Hay API oficial para crear presets y exportar sin depender de su diálogo? ¿Prefiere plugin, contribución upstream o fork? ¿Qué condiciones aplican a redistribuir las plantillas y recursos? ¿Qué posibilidades de asociación/nombre existirían? El plugin propio y su prueba interna pueden avanzar antes de resolver todas estas preguntas.

## Límites de esta investigación

Revisión estática y lectura de documentación; no se ejecutó Blockbench, no se cargó un plugin propio y no se importó un addon en Education. Recomendaciones y estrategia de UV son hipótesis de implementación que requieren un prototipo. Las versiones objetivo y recursos de la plantilla deben validarse con archivos y dispositivos reales de Nico. No se copiaron fuentes del Wizard a un nuevo producto.
