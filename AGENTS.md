# Instrucciones del proyecto

## Publicación en GitHub

- Después de cada cambio realizado en este proyecto, verificar el resultado y publicarlo en GitHub mediante commit y push al repositorio remoto configurado.
- Esta instrucción autoriza los commits y pushes de los cambios solicitados y necesarios para cada tarea, sin pedir confirmación adicional para publicarlos.
- Incluir en cada commit únicamente los archivos y cambios correspondientes a la tarea. Preservar las modificaciones locales del usuario y no publicar cambios ajenos a la tarea, archivos personales ni credenciales.
- Si la verificación o la publicación falla, informar qué quedó pendiente. No forzar el push ni sobrescribir cambios remotos.

## Entorno de pruebas

- Los cambios en desarrollo se verifican y publican en la rama `codex/pruebas`, cuyo despliegue de Cloudflare Pages es de tipo Preview.
- La web principal usa `main`. No incorporar los cambios de pruebas a `main` ni desplegarlos en producción sin una indicación explícita del usuario para lanzarlos.
- La autorización de commit y push anterior se aplica a la rama de pruebas durante esta etapa.
