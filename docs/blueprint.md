# **App Name**: Klog Wems Core

## Core Features:

- Autenticación: Implementar la autenticación de Firebase para el inicio y cierre de sesión de usuarios con control de acceso basado en roles.
- Autorización: Implementar la autorización basada en roles utilizando Custom Claims para roles e IDs de compañía/cliente.
- Configuración de modelos de datos: Establecer estructuras básicas de colección de Firestore para compañías, usuarios, clientes, almacenes, ubicaciones, productos, pedidos, saldos de inventario, libro mayor de inventario y evidencia.
- Datos de inicialización: Crear una página de administrador accesible para el superadministrador para iniciar la aplicación.
- Diseño de navegación: Establecer la navegación de nivel superior con Dashboard, Pedidos, Inventario, Almacenes, Productos y Usuarios para usuarios autenticados.
- Configuración de almacenamiento: Configurar el almacenamiento en la nube para estar listo para almacenar evidencia.
- Reglas de seguridad de Firestore: Desarrollar reglas de seguridad de Firestore para segregar el acceso a los datos por ID de compañía e ID de cliente.

## Style Guidelines:

- Color primario: Deep Indigo (#3F51B5) para proporcionar una sensación de confianza.
- Color de fondo: Gris muy claro (#F5F5F5) para una apariencia limpia y moderna.
- Color de acento: Cian (#00BCD4) para resaltar acciones importantes.
- Fuente del cuerpo y del título: 'Inter', un sans-serif de estilo grotesco con un aspecto moderno, mecanizado, objetivo y neutral; adecuado para titulares o texto de cuerpo.
- Utilizar iconos de diseño plano que sean fáciles de entender, garantizando una rápida comprensión de las características.
- Mantener un diseño consistente basado en cuadrícula con un espaciado adecuado para mejorar la legibilidad y reducir la carga cognitiva.
- Emplear animaciones de transición sutiles para mejorar la experiencia del usuario al navegar entre vistas y cargar datos.