## Selección de la arquitectura y planificación del proyecto

Desde el principio tenía claro que iba a utilizar un **monorepo**, es decir, tener el frontend y el backend dentro de un mismo repositorio. Lo que todavía no tenía decidido era qué arquitectura de software utilizar. Después de analizar las necesidades del proyecto, terminé optando por una arquitectura **cliente-servidor**, donde el frontend se encarga de la interfaz y el backend de procesar las solicitudes, gestionar la autenticación y comunicarse con la base de datos y otros servicios.

Para tomar esta decisión, consulté a diferentes inteligencias artificiales: Gemini, ChatGPT, Claude y DeepSeek. A todas les expliqué la idea de Garabato y las funcionalidades que quería implementar. Las respuestas fueron bastante similares, pero algo que noté es que la mayoría proponía stacks muy completos, con tecnologías y configuraciones que podían complicar el desarrollo, especialmente considerando mi experiencia actual.

Al final me decidí por la propuesta de Claude, ya que planteaba algo más sencillo, pero que seguía cubriendo las necesidades del proyecto. La propuesta consistía en utilizar **React con Vite para el frontend, Fastify para el backend y PostgreSQL con Neon para la base de datos**, además de Vercel y Render para el despliegue. Me pareció una buena combinación porque permitía separar las responsabilidades sin agregar demasiadas herramientas.

Después le pedí que me preparara un roadmap con las etapas necesarias para desarrollar el proyecto, desde la configuración inicial hasta el despliegue. Me pareció una buena planificación, así que la comparé con las propuestas de las otras IA. En general, todas coincidían en varios puntos y no encontré diferencias importantes que me hicieran cambiar de decisión.

Mi idea desde el principio fue desarrollar primero una versión funcional y relativamente sencilla de Garabato, sin intentar implementar todas las funcionalidades que tenía pensadas desde el inicio. Más adelante me gustaría llevar el proyecto a escritorio, posiblemente utilizando Electron o alguna otra tecnología que me permita aprovechar el trabajo realizado en la versión web.

## Metodología de desarrollo y uso de IA

Considero que durante la planificación inicial utilicé un enfoque parecido al **SDD (Spec-Driven Development)**, ya que primero definí qué quería desarrollar, las funcionalidades principales, la estructura del proyecto y las etapas que debía seguir.

Sin embargo, durante el desarrollo no seguí una metodología tan estricta. Me apoyé principalmente en la **programación conversacional e iterativa**, utilizando la IA para implementar funcionalidades, resolver errores y realizar mejoras conforme avanzaba el proyecto.

Algunos ejemplos de cómo lo apliqué fueron:

- **Planificación:** utilicé Claude para generar un roadmap dividido en fases, como la autenticación, la integración con Google Classroom, el editor Markdown y la exportación a PDF.
- **Desarrollo iterativo:** fui implementando las funcionalidades poco a poco, en lugar de pedir que se desarrollara toda la aplicación de una sola vez. Por ejemplo, inicialmente el editor tenía un cuadro de texto y una vista previa por separado. Después de probarlo, decidí cambiarlo por un editor que muestra directamente el contenido formateado sobre hojas tamaño carta.
- **Resolución de errores:** cuando encontraba problemas, como errores al obtener las tareas de Google Classroom o al generar los PDF, consultaba a la IA para encontrar posibles soluciones y entender qué estaba pasando.
- **Mejoras:** cuando una funcionalidad ya estaba terminada, también utilizaba la IA para revisar posibles mejoras en el código, la organización o la seguridad.

De esta manera fui desarrollando Garabato por partes, probando cada funcionalidad antes de continuar con la siguiente. Me resultó más cómodo trabajar así porque podía ir viendo los resultados, detectar errores conforme aparecían y cambiar algunas decisiones cuando encontraba una mejor alternativa.
