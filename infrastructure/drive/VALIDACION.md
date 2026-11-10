# Validación del buzón — 10 de noviembre de 2026

## Receptor publicado

- El propietario ejecutó `prepararBuzon` y confirmó el registro de creación de **Primera clase** y su carpeta privada.
- Se abrió la URL `/exec` en Chromium de Playwright sin sesión de Google. Se mostró el formulario sin pedir inicio de sesión.
- Se entregó `reference/cerdo_edu.mcaddon` con alias **PRUEBA_DOCENTE** y nombre **Cerdo de prueba**.
- El formulario mostró la confirmación y el conector de Drive verificó el archivo en la carpeta de esa clase: 19.025 bytes, `shared: false`.
- El archivo de prueba se conserva en Drive para que el docente pueda revisarlo.

## Integración local con el editor

- `npm run check`, las 36 pruebas de `npm test` y `npm run build:web` pasaron.
- Chromium abrió una clase de prueba en el editor local, creó un cerdo con el asistente y abrió **3 · Entregar al profe**.
- Se comprobó el transporte con dos marcos de distinto origen que simulan el contenedor y el cliente de Google. La llamada de guardado se simuló: el primer intento falló y el segundo confirmó.
- Ambos intentos enviaron idénticos archivo, identificador y datos. No se abrió otra pestaña ni se alteraron el proyecto, los cubos o la textura.
- El archivo generado incluyó 25 entradas, ambos manifiestos y sus dependencias cruzadas.
- Se verificaron el enlace del docente, el regreso a la interfaz del alumno y el cuadro en 1024 × 768. No se registraron errores de JavaScript en esa prueba.
- Captura local: `output/playwright/drive-delivery-success.png`.
- Se quitó la clase del enlace y se comprobó la descarga habitual `Cerdo_Edu_1_0_2.mcaddon`.
- El código de clase también se actualiza cuando se abre un enlace que solo cambia el fragmento de la misma página, sin recargar el documento.

## Conexión real desde el editor

- El propietario actualizó la misma implementación de Apps Script a la versión 2 del proyecto, con el receptor v3.
- Se abrió el editor local en un navegador nuevo sin sesión de Google y sin respuestas simuladas.
- Se creó un cerdo desde el catálogo y se entregó con el botón integrado, usando el alias **PRUEBA_EDITOR_REAL**.
- El cuadro confirmó el guardado y el conector de Drive verificó el archivo privado en **Primera clase**, de 36.618 bytes (`shared: false`).
- La prueba empezó con una pestaña y terminó con una pestaña. La conexión pasó por el iframe real de Apps Script y sus marcos de Google; no hubo navegación fuera del editor.
- Captura: `output/playwright/drive-real-delivery-success.png`.

## Sitio público

- Se publicó el commit `5c3c3f1` mediante [Publish Blockbench Edu](https://github.com/nchiari/blockbench-edu-web/actions/runs/42803167632); compilación y despliegue terminaron correctamente.
- Se abrió `https://nchiari.github.io/blockbench-edu-web/` con el enlace de la clase en un navegador nuevo sin sesión de Google, sin interceptar ni simular las llamadas de guardado.
- Desde el asistente se creó un cerdo, se abrió **3 · Entregar al profe** y se entregó como **PRUEBA_WEB_PUBLICA**.
- Se mostró la confirmación y Drive verificó el archivo en **Primera clase**, de 36.618 bytes, con `shared: false`.
- Hubo una única pestaña durante toda la prueba y no se registraron errores de JavaScript. Captura: `output/playwright/drive-public-delivery-success.png`.
- El sitio sirvió el host `edu-web.a8210585d4ce850d.js`, que incluye la conexión de Drive y referencia el plugin actualizado por su nombre con huella de contenido.

## Pendiente

- Prueba física en Brave, equipos escolares y redes de aula, incluidos los bloqueos de contenido de terceros que pudieran impedir el iframe.
- Importación en Minecraft Education de una entrega generada por este botón. El empaquetado conserva la ruta de exportación existente; esta etapa no acredita una nueva prueba en el juego.

## Revisión del cuadro de entrega

- Se reprodujo en el sitio público el estado de la captura del docente: el campo vacío dejaba **Entregar** deshabilitado sin mensaje; el borde calculado era `0px none` y el fondo transparente.
- El cuadro ahora pide **Tu nombre o número de alumno**, muestra borde y fondo en el campo y destaca **Entregar** en verde y negrita.
- Pulsar **Entregar** con el campo vacío o con espacios muestra una indicación, marca el campo como inválido y lleva el foco al campo. Escribir borra la indicación; se aceptó un número de alumno en la prueba.
- En el editor local se comprobaron los estilos calculados, el cuadro en 1024 × 768 y una entrega real como **PRUEBA_NOMBRE_VERDE**, sin nuevas pestañas ni errores de JavaScript. Drive confirmó el archivo privado.
- Captura: `output/playwright/delivery-name-green-before.png`.
- Se publicó el ajuste en `0afb2c4`; el [despliegue](https://github.com/nchiari/blockbench-edu-web/actions/runs/42804743331) terminó correctamente.
- En una sesión privada nueva de Chromium, con cero cookies al comenzar, se repitieron las comprobaciones de campo vacío, espacios, número, foco, borde y botón verde desde el sitio público. La entrega real **PRUEBA_BOTON_PUBLICO** se guardó privada en Drive, sin abrir pestañas ni registrar errores de JavaScript.
- Captura del sitio público: `output/playwright/delivery-name-green-public.png`.
