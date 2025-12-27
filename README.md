# Resumen Técnico de la Aplicación: FLUX Wems Core

## 1. Propósito de la Aplicación

**FLUX Wems Core** es un sistema de gestión de almacenes (WMS) y logística diseñado como una aplicación web moderna. Su objetivo es centralizar y optimizar las operaciones clave de un almacén, incluyendo la gestión de pedidos, el control de inventario, la administración de productos y la coordinación de usuarios con roles específicos.

## 2. Arquitectura General

La aplicación sigue una arquitectura moderna basada en **Jamstack** con componentes dinámicos del lado del servidor, utilizando Next.js y servicios de backend gestionados por Firebase (BaaS - Backend as a Service).

-   **Frontend (Cliente)**: Es una Single-Page Application (SPA) construida con Next.js y React. Se ejecuta directamente en el navegador del usuario. La interfaz es interactiva y se comunica de forma segura y directa con los servicios de Firebase.
-   **Backend (Servicios)**: No hay un servidor de backend monolítico tradicional. La lógica de negocio, la base de datos y la autenticación son gestionadas por los siguientes servicios de Google Cloud a través de Firebase:
    -   **Firebase Authentication**: Gestiona la identidad de los usuarios (login, registro, sesiones).
    -   **Firestore**: Actúa como la base de datos principal (NoSQL, orientada a documentos) donde se almacena toda la información operativa (pedidos, usuarios, inventario, etc.).
-   **Seguridad**: El modelo de seguridad se delega a **Firestore Security Rules** y **Storage Security Rules**. Estas reglas se ejecutan en los servidores de Google y definen con precisión qué datos puede leer o escribir cada usuario, garantizando un acceso seguro y granular directamente desde el cliente.
-   **Funciones del Lado del Servidor**: Para operaciones administrativas que requieren privilegios elevados (ej. inicialización de datos), se utilizan **Next.js Server Actions**. Estas funciones se ejecutan en el entorno de Node.js del servidor de Next.js y utilizan el **Firebase Admin SDK** con credenciales de servicio seguras.

## 3. Stack Tecnológico

-   **Framework Principal**: **Next.js 15** (con App Router).
-   **Lenguaje**: **TypeScript**.
-   **Interfaz de Usuario (UI)**:
    -   **React 19**: Para la construcción de componentes de UI.
    -   **ShadCN UI**: Librería de componentes UI pre-construidos, accesibles y estilizables.
    -   **Tailwind CSS**: Para el diseño y estilizado de la aplicación.
-   **Base de Datos**: **Cloud Firestore** (NoSQL).
-   **Autenticación**: **Firebase Authentication**.
-   **Almacenamiento de Archivos**: **Firebase Storage** (para evidencia de pedidos, etc.).
-   **Gestión de Estado**: Combinación de React Hooks (`useState`, `useContext`) y `react-firebase-hooks` para la sincronización en tiempo real con Firestore.
-   **Validación de Formularios**: `react-hook-form` y `zod`.
-   **Inteligencia Artificial (Opcional)**: El proyecto está configurado con **Genkit**, el framework de Google para desarrollo de aplicaciones con IA, aunque su uso actual es mínimo.

## 4. Flujo de Autenticación y Datos

1.  **Inicio de Sesión**: El usuario introduce sus credenciales en el cliente (navegador).
2.  El cliente se comunica directamente con **Firebase Authentication** para validar las credenciales.
3.  Si es exitoso, Firebase Authentication devuelve un **ID Token (JWT)** al cliente.
4.  El cliente utiliza este ID Token para las solicitudes posteriores a Firestore.
5.  **Firestore Security Rules** en el servidor de Google validan el ID Token en cada lectura o escritura y verifican el rol y los permisos del usuario (`isUserCompany`, `isAdmin`, etc.) antes de permitir o denegar la operación.
6.  Los datos se sincronizan en tiempo real entre Firestore y el cliente gracias a listeners de `react-firebase-hooks`.

## 5. Configuración del Entorno y Variables

La configuración de la conexión a Firebase se gestiona a través de variables de entorno.

-   **Lado del Cliente (`.env`)**:
    -   Las variables con el prefijo `NEXT_PUBLIC_` se utilizan para configurar el SDK de Firebase en el navegador. Son públicas y no contienen información sensible.
    -   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.

-   **Lado del Servidor (`src/app/actions.ts`)**:
    -   Las credenciales para el **Firebase Admin SDK** (usado en las Server Actions) están actualmente configuradas directamente en el código para el entorno de desarrollo.
    -   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
    -   **Nota para TI**: En un entorno de producción, estas credenciales deben ser gestionadas de forma segura a través de secretos del entorno de hosting (ej. Firebase App Hosting, Google Secret Manager) y no deben estar en el código fuente.

## 6. Alojamiento (Hosting)

La aplicación está configurada para ser desplegada en **Firebase App Hosting**, una plataforma optimizada para aplicaciones web modernas con integración nativa con el resto de servicios de Firebase. El archivo `apphosting.yaml` contiene la configuración básica de despliegue.
