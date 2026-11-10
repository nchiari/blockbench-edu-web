# Buzón de Drive de Blockbench Edu

Receptor de entregas en Google Apps Script. Recibe `.mcaddon` en una carpeta privada por clase, sin cuenta de alumno. Incluye una página manual para comprobar el receptor y un modo interno para enviar desde el editor sin abrir otra pestaña. Los QR todavía no están implementados.

## Instalación para el docente

1. Crear un proyecto en https://script.google.com/ y llamarlo **Blockbench Edu — Buzón de entregas**.
2. Pegar `Code.gs` en el archivo inicial `Código.gs`. El original requiere reemplazar `REPLACE_WITH_DRIVE_FOLDER_ID` por el ID de la carpeta privada. La copia preparada en `output/drive-buzon/Code.gs` ya tiene la carpeta configurada para esta instalación.
3. Guardar. En el selector de funciones, elegir **prepararBuzon** (sin guion bajo al final) y pulsar **Ejecutar**. El propietario debe autorizar el acceso a Drive y la identificación de su cuenta personalmente. No ejecutar `doGet` ni `entregarAddon` desde el editor: requieren parámetros. El selector oculta las funciones auxiliares que terminan en `_`.
4. El registro muestra la clase, el código de entrega, el vencimiento y la subcarpeta. Volver a ejecutar `prepararBuzon` conserva la clase y los trabajos; no duplica carpetas ni reabre una entrega cerrada.
5. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como **Yo**. Acceso: **Cualquier usuario**, incluida gente sin iniciar sesión (no la opción limitada a cuentas de Google). La carpeta de Drive sigue siendo privada. Si la cuenta no permite acceso sin sesión, no se cumple el objetivo de alumnos sin cuenta.
6. Publicar y copiar la URL que termina en `/exec`. Ejecutar **mostrarBuzon** para obtener el enlace completo con el código de clase.
7. Abrir el enlace completo en una ventana privada sin cuenta de Google y entregar un `.mcaddon` de prueba. Comprobar el archivo en la subcarpeta desde la cuenta del docente. La confirmación debe aparecer únicamente después de guardar en Drive.
8. Para cerrar antes de tiempo, ejecutar **cerrarBuzon**. Los archivos se conservan. La clase caduca a los siete días. Esta versión administra una clase por proyecto; aún no incluye panel de creación de clases.

## Actualizar una implementación existente para el editor

1. Reemplazar `Código.gs` por la copia configurada `output/drive-buzon/Pegar-en-Apps-Script-v4.txt` y guardar. Las propiedades del proyecto conservan la carpeta, el código de clase y las entregas existentes. La versión v4 incorpora nombres cortos de archivo; el receptor v3 anterior sigue siendo compatible con el botón del editor.
2. **Implementar → Gestionar implementaciones → seleccionar la aplicación web → Editar (lápiz)**.
3. En **Versión**, elegir **Nueva versión** y pulsar **Implementar**. Conservar ejecutar como **Yo** y acceso sin inicio de sesión. No crear otro proyecto ni otra implementación: la URL `/exec` debe seguir siendo la misma.
4. Verificar una entrega real desde el editor local antes de publicar la actualización web. El modo manual anterior ya se comprobó con el cerdo de referencia.

## Entregar desde Blockbench Edu web

- La dirección pública del receptor está en `web/drive-inbox.js`; el código de cada clase no se incluye en el repositorio.
- El docente abre **Para el docente → Prueba Edu → Entregas de la clase**, pega el código obtenido al preparar el buzón y pulsa **Seleccionar clase**. Copia el enlace del editor que aparece y lo comparte con los alumnos.
- El enlace lleva la clase en el fragmento `#clase=…`. El alumno crea su criatura y pulsa **3 · Entregar al profe**, escribe su nombre o número de alumno y confirma con el botón verde. El archivo se prepara y envía automáticamente. Si el campo está vacío, el botón explica qué falta y lleva el cursor al campo.
- El cuadro muestra el resultado y ofrece descarga de respaldo. Tras un error conserva el mismo archivo e identificador para reintentar desde ese cuadro. Cerrar el cuadro y empezar de nuevo crea una entrega nueva.
- Durante la preparación y el envío aparece una ruedita sin porcentaje. Se bloquean los botones del cuadro, la cruz de cierre, el teclado y los controles del editor; el bloqueo se retira al guardar o al mostrar un error. La confirmación usa un recuadro verde, una marca de verificación y el botón **Seguir creando**.
- Con el receptor v4, los archivos nuevos se guardan como **NOMBRE_DD-MM-AA.mcaddon**, por ejemplo `Nico_10-11-26.mcaddon`. Se usa la fecha de Madrid, se normalizan los caracteres del nombre para su descarga y se añade `_2`, `_3`, etc. si hay otra entrega con ese mismo nombre y fecha. Los reintentos reconocen el recibo guardado; los archivos de versiones anteriores conservan su nombre.
- Sin clase seleccionada, se conserva **3 · Llévala a Minecraft** y su descarga habitual.
- La conexión usa un iframe oculto de Apps Script y mensajes con origen, ventana, canal aleatorio y recibo comprobados. Solo el modo de transporte permite incrustación; la página manual conserva la protección predeterminada. El modo interno permite el sitio publicado del proyecto y el servidor local de prueba.
- El plugin manual de Blockbench no incorpora este transporte web. El botón integrado se ofrece en el sitio web del proyecto.

## Límites y permisos

- Código aleatorio de 128 bits por clase, con siete días de vigencia. Quien tenga el enlace puede entregar durante ese período. No publicar el enlace en repositorios.
- La operación de alumnos es `entregarAddon`. Los tres comandos visibles del docente comprueban que la identidad activa no esté vacía y coincida con la cuenta que ejecuta el script. Así rechazan visitantes anónimos y otras cuentas en el despliegue que se ejecuta como el propietario. Sus auxiliares terminan en `_` y no pueden invocarse desde `google.script.run`.
- Máximo 10 MiB por archivo, 200 archivos y 500 MiB por clase. Hay además cuotas de Google y espacio disponible en Drive.
- Comprueba extensión, codificación, tamaño y cabecera ZIP. No descomprime archivos ni acredita que el addon funcione en Minecraft.
- Usa un bloqueo de escritura y comprueba los archivos reales para aplicar el límite incluso ante solicitudes simultáneas. Los reintentos del mismo trabajo devuelven el recibo existente; el mismo identificador con otro contenido se rechaza.
- Conserva un alias, nombre de criatura, huella del contenido y hora en la descripción privada del archivo. No necesita nombre completo ni correo de alumnos. No lista trabajos ni devuelve enlaces de descarga al alumno.
- No concede permisos de lectura ni cambia el acceso a la carpeta. La carpeta de destino debe ser privada antes de configurar el receptor.
- Google solicitará permisos de Drive al propietario por el uso de `DriveApp` y de identificación de su cuenta para proteger los comandos del docente; el código limita sus operaciones al buzón, pero la autorización de Google puede ser más amplia que una sola carpeta. Revisarla antes de aceptar.

## Comprobación local

`npm test` incluye pruebas del empaquetado, del receptor y del transporte. Comprueba códigos inválidos, expiración/cierre, tamaño, recibos repetidos, contenido cambiado, cupo, bloqueo y verificación de mensajes. Las pruebas unitarias usan una simulación de Drive; ver `VALIDACION.md` para distinguirlas de la entrega real comprobada.

Referencias: [Apps web](https://developers.google.com/apps-script/guides/web), [comunicación y funciones privadas](https://developers.google.com/apps-script/guides/html/communication), [cuotas](https://developers.google.com/apps-script/guides/services/quotas).
