# Blockbench Edu 0.3.0 — primera versión para prueba en clase

Plugin local en español para Blockbench web 5.2.2, con teclado y ratón. Incluye un catálogo de criaturas del Entity Wizard y una pantalla educativa para cambiar sus partes y pintarlas. **El cerdo de prueba se importó y funciona en Minecraft Education; Nico confirmó que la revisión 1.0.3 ya no presenta el error de sonido y muestra el icono correctamente.** El resto del catálogo tiene comprobaciones en el editor, no una validación individual dentro del juego.

## Web con inicio directo

Abre **[Blockbench Edu](https://blockbench-edu.pages.dev/)**. Edu se carga automáticamente y abre su asistente, sin instalar plugins ni iniciar sesión. Si cancelas, pulsa «Comenzar» para volver. La versión web usa Blockbench 5.2.2 fijado a una revisión exacta. Cloudflare Pages publica la web desde la rama `main` del repositorio `nchiari/blockbench-edu-web`; la compilación y publicación se describen en [web/README.md](web/README.md).

«Guardar mi criatura» descarga un proyecto editable `.bbedu` para continuar otro día, incluso en otro ordenador. La web genera proyectos y addons en el navegador y no requiere cuentas de alumnos ni base de datos. Las clases con buzón configurado permiten entregar el addon de la criatura directamente al Drive del docente desde el editor; ver [infraestructura de Drive](infrastructure/drive/README.md) y [validación](infrastructure/drive/VALIDACION.md).

## Empezar

1. Abrir https://web.blockbench.net/.
2. En Archivo → Plugins, cargar `blockbench_edu.js` desde archivo. No hace falta instalar Entity Wizard para usar el catálogo incluido.
3. Elegir Cargadores → Blockbench Edu → Comenzar.
4. En «Elige tu criatura», buscar un nombre y elegir su tarjeta. El catálogo está ordenado por el nombre en español y los botones inferiores permanecen visibles al desplazarse. Las miniaturas, estructura y medidas de las tarjetas vienen del selector del Wizard, adaptadas al verde de Edu y con nombres en español. Enter o espacio también permiten elegir una tarjeta enfocada.
5. Avanzar hasta «Abrir editor». Se crea una criatura independiente y se prepara su textura automáticamente.
6. En «Dale forma», elegir una parte o **Todo el modelo** y usar Tamaño, Mover o Girar. Con Todo el modelo, el tamaño cambia en proporción sin separar las piezas (cada + aumenta un 10 %; − revierte ese aumento), el movimiento desplaza toda la criatura y el giro la rota 15° alrededor del origen del modelo. Incluye partes ocultas y permite deshacer y rehacer. Al elegir una parte, se mantienen sus controles individuales.
7. En «Dale color», elegir un color y pintar directamente sobre la criatura. Hay pincel, relleno y herramienta para copiar un color.
8. Usar los botones inferiores para verla desde distintos lados o encuadrar toda la criatura con «Ver todo».
9. En **3 · Dale vida**, conservá el comportamiento **Original** o elegí una base terrestre: **Animal tranquilo**, **Animal asustadizo**, **Compañero**, **Guardián** o **Enemigo**. Ajustá vida, velocidad y las opciones que ofrece cada base. Las bases nuevas reemplazan las habilidades especiales de la plantilla; se prueban dentro de Minecraft.
10. **4 · Guardar y exportar** abre dos opciones: **Guardar para seguir editando** descarga el proyecto `.bbedu` para continuar otra clase; **Llevar a Minecraft** descarga un `.mcaddon` para importarlo en Education y activar sus packs en un mundo de prueba. Si hay una clase configurada, también aparece **Entregar al profe**. El nombre de la criatura es el de la plantilla seguido de «Edu».

Puedes arrastrar el separador entre el menú izquierdo y la vista 3D para ampliar el menú: mínimo 260 px y máximo 480 px, limitado al 40 % de la ventana cuando hay menos espacio. El ancho se conserva durante la sesión, también al cambiar entre forma, color y la vista del docente.

En la web de pruebas, el cerdo ofrece un menú de botones en «Dale vida»: **Base**, **Movimiento**, **Reacción al jugador**, **Amistad**, **Vida y cuidados** y **Combate**. Cada botón abre sus ajustes y «Todas las categorías» vuelve al menú sin perderlos. Permite combinar paseo, reacción al recibir daño, domesticación, seguimiento con distancias propias, defensa del dueño y curación con el objeto elegido. El primer cambio activa una base adulta personalizada, que reemplaza crías, montura y transformaciones. Los botones muestran un resumen de las elecciones. Los proyectos del cerdo que incluyen estas opciones usan formato `.bbedu` versión 3 y requieren esta versión de pruebas para reabrirse; se siguen admitiendo los formatos anteriores. Las demás criaturas conservan el selector de bases de la primera versión.

Deshacer y rehacer permanecen fijos al pie del menú, tanto en «Dale forma» como en «Dale color».

El panel «Partes», a la derecha de la vista 3D, permite mostrar u ocultar partes con el ojo, dejar una sola visible con el botón de enfoque y recuperar la vista completa con «Mostrar todas». Está abierto al iniciar y disponible en forma y color. La lista tiene desplazamiento propio y conserva las partes ocultas al cambiar entre esos dos modos. La flecha superior pliega el panel para ampliar la vista 3D; el botón «Partes» permite abrirlo de nuevo e indica cuántas partes están ocultas. Esc también lo pliega cuando el foco está dentro del panel. La exportación incluye las partes temporalmente ocultas; al pasar a la vista del docente se restaura la visibilidad original.

En «Dale color», «Seleccionar color» permite hacer clic directamente sobre la criatura para seleccionar todos los píxeles de ese mismo color y transparencia en la textura, aunque estén separados o en partes ocultas. Seleccionar no cambia la pintura. La selección permanece activa al cambiar de herramienta: el pincel, el borrador y Suavizar actúan únicamente dentro de ella; Rellenar pinta toda la selección al hacer clic sobre un píxel seleccionado. «Quitar selección» permite volver a pintar libremente. La selección muestra cuántos píxeles contiene y cada acción de pintura se puede deshacer o rehacer.

«Controles de cámara», junto a las vistas inferiores, abre botones para girar y desplazar la vista y acercar o alejar. Permite manejar la cámara con clics de touchpad sin rueda ni clic derecho. En las vistas ortográficas, el giro queda deshabilitado; «Vista 3D» lo habilita de nuevo. Los botones de cámara no modifican las piezas ni el historial.

La web tiene dos accesos: la dirección principal abre la versión alumno, sin «Para el docente» ni la barra general de Blockbench; `/docente/` abre la versión docente y, al terminar el asistente, muestra el editor completo con el panel «Prueba Edu». Desde allí se puede configurar la clase y copiar su enlace, que siempre apunta a la versión alumno. El docente conserva «Volver a alumnos» para probar la pantalla educativa y «Para el docente» para regresar a sus controles. El plugin instalado manualmente conserva también ese cambio de vista.

## Guardar y continuar otra clase

Si Edu detecta piezas que no tiene registradas, ofrece **Guardar copia de rescate** en lugar de pedir que se reabra la referencia. Descarga un `.bbmodel` con el modelo y la pintura actuales, incluidas las partes ocultas temporalmente. El docente puede abrirlo en Blockbench; no es un `.bbedu` para «Abrir una criatura» ni un addon de Minecraft. En una pestaña que todavía tenga la versión anterior, cerrar el aviso y pulsar **Ctrl + Alt + S** permite descargar el proyecto con el guardado propio de Blockbench; conservar también el PNG si se descarga. Comprobar la descarga antes de cerrar o recargar la pestaña.

1. Antes de cerrar, pulsar **Guardar mi criatura**, disponible al pie del menú en forma y color. Conservar el `.bbedu` descargado en la carpeta del alumno; también se puede enviar al docente por el medio habitual.
2. La próxima clase, entrar en la web y pulsar **Abrir una criatura** en la bienvenida. Elegir el archivo `.bbedu`. También se puede abrir desde la pantalla de inicio, el editor educativo o el panel docente.
3. Continuar cambiando las partes y pintando. Si hay más cambios, volver a guardar: cada descarga es una copia del proyecto en ese momento.

El proyecto incluye modelo, pintura, addon base, medidas originales e identidad y última versión del addon. Permite volver a exportar a Minecraft sin crear otro pack distinto. Las partes ocultas temporalmente se guardan completas y se muestran al reabrir. El historial de deshacer empieza de cero; la cámara, las herramientas y las selecciones temporales se reinician. Abrir un archivo crea otro proyecto y conserva el que ya estaba abierto. Un archivo inválido muestra un aviso.

`.bbedu` es para **seguir editando en Edu**; `.mcaddon` es para **importar en Minecraft Education**. La entrega a Drive envía el `.mcaddon` y una copia `.bbmodel` para el docente; el proyecto portátil `.bbedu` se comparte como archivo por otro medio. No incluye el código de clase ni rutas locales de las texturas. No hay guardado automático: cerrar la pestaña no sustituye la descarga del proyecto. Cada acceso trabaja en su propia pestaña; abrir el acceso docente no transfiere la criatura de una pestaña de alumno.

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

## Comida y crías del cerdo en test

En Dale vida, **Comida y cuidados** permite elegir varios alimentos por separado
para atraer, domesticar y curar, ajustar la probabilidad de domesticación y los
puntos de curación de cada alimento. **Crías** permite elegir alimentos para
reproducirse, la espera entre reproducciones y el tiempo para crecer. Necesitás
dos adultos de esa misma creación; si son domesticables, primero domesticá a
ambos. Las crías se domestican por separado. Los alimentos para reproducirse y
curar deben ser distintos cuando ambas acciones están activas. Los proyectos
con estas opciones usan formato .bbedu versión 4, disponible en la web de test;
se siguen abriendo proyectos de versiones anteriores.

## Montura del cerdo en test

**Montura** tiene su propio botón en Dale vida. Permite habilitar un pasajero
adulto, exigir silla o montar directamente, elegir si dirige el jugador con
zanahoria en un palo o el cerdo, y ajustar altura y posición del asiento.
Las crías no se montan hasta crecer. Mientras lleva pasajero, pausa sus otras
acciones; al bajar las recupera. Si dirige el cerdo, conserva su paseo si estaba
activado. En esta versión la silla colocada no se retira. Los proyectos nuevos
usan formato .bbedu versión 5 de la web de test; se admiten archivos anteriores.

En el cerdo, **Vida y daño** reúne los puntos de vida y el daño por golpe editable
(de 1 a 20). El daño solo se aplica si el cerdo ataca o defiende; las decisiones
de combate siguen separadas de la cantidad de daño.

En esa categoría también podés elegir qué puede quitarle vida al cerdo. Abrí
**Golpes y proyectiles**, **Fuego y explosiones**, **Peligros del entorno** o
**Daño mágico** y desmarcá las causas que quieras bloquear. Lava y quemaduras se
configuran por separado. Los daños que no estén en la lista siguen funcionando
normalmente. El resumen derecho muestra las protecciones elegidas. Los proyectos
con estas opciones usan formato .bbedu versión 6 de la web de test; se siguen
abriendo los formatos anteriores.


En el cerdo de test, **Movimiento** permite elegir Camina, Nada, Camina y nada o
Vuela. El vuelo es autónomo con Pasea por su cuenta; la montura requiere Camina.
**Vida y daño → Respiración** separa respirar aire, agua o ambos y permite
configurar de 5 a 300 segundos sin respirar. Nadar no cambia la respiración.
**Combate** incluye listas desplegables con buscador para atacar o evitar 12
familias de Minecraft. Una familia no puede estar en ambas listas; las opciones
incompatibles se muestran deshabilitadas con su motivo. La selección para atacar
excluye mascotas domesticadas y desactiva la huida al recibir daño y las crías.
Evitar tiene prioridad sobre el ataque y excluye esa familia de la defensa.
Los proyectos con estos ajustes usan formato .bbedu 7; se leen formatos 1–6.
Pendiente verificar los movimientos y sus combinaciones dentro de Minecraft Education.


### Interfaz de comportamiento simplificada (test, 14/11/2026)

Siete categorías: Base, Movimiento, Reacción al jugador, Amistad, Vida y daño,
Combate y Montura. Se eliminan Comida y cuidados y Crías. El editor actual no
permite reproducirse, tampoco con la base Original. Los archivos antiguos se
adaptan al abrirlos: un alimento por acción, domesticación al 100 % y curación
fija de 4 puntos. Los alimentos se eligen junto a sus casillas en Amistad y Vida
y daño. Los proyectos nuevos usan .bbedu 8; los anteriores siguen siendo legibles.

Las selecciones llevan una marca visible; Volver y los títulos se destacan.
Los requisitos aparecen en amarillo y los cambios automáticos se anuncian sobre
el modelo durante unos segundos. Textos breves en español de España.
Montura mantiene un único pasajero, con vista 3D y botones de posición vertical,
longitudinal y lateral. La conversión de coordenadas se contrastó con el plugin
Seat Position instalado; no necesita instalar ese plugin en la web. El ayudante
es una previsualización y no forma parte del modelo exportado.


Revisión del 14/11: Volver utiliza borde verde claro; selección solo por color,
descripciones breves restauradas y resumen derecho con título en negrita. Los
avisos amarillos nombran cada opción entre comillas y en negrita y ofrecen un
acceso que abre la categoría y enfoca el control. Montura permite la navegación
normal del ratón con una herramienta de cámara que no edita el modelo.
Nuevo control de montura Directo (WASD y ratón), sin objeto en la mano, mediante
input_ground_controlled; se mantienen el control con zanahoria y el paseo autónomo.
Las nuevas configuraciones eligen Directo; las monturas existentes conservan su
control. Los proyectos con Directo usan formato 9, compatible con lectura 1–8.


### Editor común para todas las entidades — test, 14/11/2026

Las siete categorías se habilitan para las 70 criaturas disponibles en el
asistente, incluidos NPC, voladoras y acuáticas. El comportamiento Original
conserva la plantilla (sin reproducción); personalizar sustituye sus habilidades
especiales por los ajustes del editor. Los archivos anteriores conservan sus
ajustes y se adaptan al editor común al abrirlos.

El movimiento y la respiración iniciales proceden de la plantilla. Tamaño y
vida se leen también de los estados adultos; la vida admite hasta 2000 puntos
para incluir criaturas como el Custodio. Al personalizar se normalizan gravedad
y colisión según el movimiento elegido, y se evitan daños heredados por lluvia
o agua que contradigan la respiración. El asiento inicial se adapta al tamaño
y su vista incluye criatura y pasajero. Las restricciones entre opciones se
mantienen para todas las entidades.

Los avisos de la categoría abierta muestran la opción en negrita sin enlace;
solo enlazan las opciones de otra categoría. Guardado universal en .bbedu 10;
lectura de proyectos 1–9 conservada. Prueba real en Minecraft Education pendiente.

`tests/whole-model-probe.js` comprueba el tamaño proporcional, movimiento y giro completo en los tres ejes, partes ocultas, huesos rotados, historial, exportación y guardado/reapertura de proyectos. Los cambios afectan al modelo visual; la colisión y las animaciones deben revisarse en Minecraft Education.
