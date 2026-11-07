# 🏨 Gran Hotel Illimani ★★★★★
## Sistema de Administración y Gestión Empresarial Hotelera (SAGH)

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📋 Descripción del Proyecto

El **Sistema de Administración y Gestión Hotelera (SAGH)** es una plataforma web integral diseñada para optimizar y digitalizar todas las operaciones del **Gran Hotel Illimani**. Permite la administración en tiempo real de reservas, disponibilidad de habitaciones, catálogo de servicios, control de personal, limpieza y la experiencia de los huéspedes mediante un portal interactivo.

Desarrollado para la materia de **Taller de Sistemas II**.

---

## ✨ Características Principales por Módulo

### 1. 🛡️ Módulo de Administración y Gerencia
* **Panel de Control (Dashboard):** Métricas operativas clave en tiempo real (porcentaje de ocupación, ingresos proyectados, habitaciones disponibles y en mantenimiento).
* **Rack de Habitaciones Interactivo:** Visualización y control integral del estado de cada habitación (disponible, ocupada, sucia, mantenimiento).
* **Gestión de Personal y Trabajadores:** Alta, edición, asignación de roles y control de acceso del personal del hotel.
* **Catálogo de Servicios:** Administración de amenidades, servicios a la habitación, gastronomía y tarifas adicionales.
* **Directorio de Huéspedes:** Historial de estadías, datos de contacto y registro de preferencias.

### 2. 🛎️ Módulo de Recepción
* **Check-in y Check-out Rápido:** Registro ágil de entradas y salidas de huéspedes con cálculo automático de saldos y consumos.
* **Asignación Dinámica de Habitaciones:** Consulta de disponibilidad inmediata y asignación según tipo y vistas preferidas.
* **Atención de Solicitudes:** Seguimiento de pedidos especiales y requerimientos en tiempo real.

### 3. 🧹 Módulo de Limpieza (Housekeeping)
* **Tablero de Estado Operativo:** Notificaciones de habitaciones listas para limpieza tras el check-out.
* **Actualización en Tiempo Real:** Cambio de estados (Sucia ➔ En Proceso ➔ Limpia/Desinfectada) para liberar habitaciones inmediatamente a recepción.

### 4. 🧳 Portal del Huésped (Experiencia de Cliente)
* **Landing Page Informativa:** Presentación del hotel, amenidades y habitaciones disponibles.
* **Fachada Interactiva:** Exploración visual e intuitiva de las habitaciones y su orientación.
* **Reservas en Línea:** Proceso de selección de fechas, tipo de habitación y confirmación inmediata.
* **Portal "En Hotel":** Gestión durante la estadía (solicitud de servicios al cuarto, consulta del estado de cuenta y consumos acumulados).
* **Registro Internacional:** Selector interactivo de países con código telefónico y validación.

---

## 🛠️ Stack Tecnológico

* **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
* **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Iconografía)
* **Enrutamiento:** [React Router v7](https://reactrouter.com/)
* **Backend as a Service (BaaS):** [Supabase](https://supabase.com/)
  * Base de Datos relacional PostgreSQL.
  * Autenticación segura y control de sesiones.
  * Políticas de Seguridad por Fila (Row Level Security - RLS).
  * Consultas y sincronización en tiempo real.

---

## 📁 Estructura del Proyecto

```text
├── public/                 # Recursos públicos e iconos
├── src/
│   ├── components/
│   │   ├── admin/          # Vistas y paneles del Administrador (Rack, Métricas, Personal, Servicios)
│   │   ├── auth/           # Login, Registro de Huéspedes y selectores de país
│   │   ├── common/         # Componentes transversales reutilizables (Logos, botones, modales)
│   │   ├── dashboard/      # Vistas dinámicas del Huésped (En Hotel, Sin Reserva, Fachada)
│   │   ├── diagnostico/    # Comprobación de estado y conectividad
│   │   ├── landing/        # Landing page pública del hotel
│   │   ├── limpieza/       # Módulo operativo de camareras y limpieza
│   │   └── recepcion/      # Módulo operativo de front-desk y recepción
│   ├── context/            # Contextos globales de React (AuthContext)
│   ├── data/               # Datos locales, listas de países y catálogos semilla
│   ├── lib/                # Configuración de clientes (Supabase, helpers de caché)
│   ├── services/           # Capa de consumo de API y servicios
│   ├── types/              # Definiciones TypeScript de tablas y entidades
│   ├── App.tsx             # Enrutador principal y layout
│   └── main.tsx            # Punto de entrada de la aplicación
├── supabase/
│   └── seed_hotel_illimani.sql  # Scripts SQL y datos semilla para la base de datos
├── .env                    # Variables de entorno locales
├── package.json            # Dependencias y scripts de ejecución
└── vite.config.ts          # Configuración de Vite
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
* [npm](https://www.npmjs.com/) o gestor de paquetes preferido

### 1. Clonar el repositorio
```bash
git clone https://github.com/TALLER-DE-SISTEMAS-II/Sistema-Gestion-Hotelera-Gran-Hotel-Illimani.git
cd Sistema-Gestion-Hotelera-Gran-Hotel-Illimani
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto (o copia `.env.example`) con las credenciales de tu proyecto en Supabase:

```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Base de Datos (Opcional si usas una instancia propia)
Ejecuta el script SQL ubicado en `supabase/seed_hotel_illimani.sql` dentro del Editor SQL de tu proyecto en Supabase para crear las tablas, políticas RLS y cargar los datos iniciales.

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 📜 Scripts Disponibles

* `npm run dev`: Inicia el servidor de desarrollo local con recarga rápida (HMR).
* `npm run build`: Compila el código TypeScript y empaqueta la aplicación optimizada para producción en la carpeta `dist/`.
* `npm run preview`: Previsualiza localmente la versión de producción generada.
* `npm run lint`: Ejecuta el análisis estático de código mediante ESLint.

---

## 👥 Autores y Créditos

* **Desarrollador:** Enrique Villazante ([@EnriqueVillazante](https://github.com/EnriqueVillazante))
* **Materia:** Taller de Sistemas II
* **Institución:** Proyecto Académico Universitario
