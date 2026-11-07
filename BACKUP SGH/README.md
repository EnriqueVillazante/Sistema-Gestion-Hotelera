# 💾 Respaldo y Dump Oficial de la Base de Datos
## Gran Hotel Illimani ★★★★★ — SAGH

Este directorio contiene el **Dump Oficial y Backup Completo de la Base de Datos** del Sistema de Administración y Gestión Empresarial Hotelera (SAGH).

---

## 📁 Archivos Disponibles en este Respaldo

| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| **`dump_completo_hotel_illimani.sql`** | **SQL Maestro (Recomendado)** | **Script 100% autoejecutable que contiene Estructura (DDL) + Datos Reales (DML) + Políticas de Seguridad (RLS).** Se ejecuta de una sola vez. |
| `basededatos.sql` | SQL (Esquema DDL) | Definición base de tablas exportada desde el gestor. |
| `*_rows.csv` | CSVs individuales | Respaldo en texto plano de cada una de las tablas del sistema (`perfiles`, `habitaciones`, `reservas`, `servicios`, etc.). |

---

## 🚀 ¿Cómo restaurar la Base de Datos?

### Opción 1: En Supabase Cloud (Recomendada)
1. Iniciar sesión en el panel del proyecto en [Supabase](https://supabase.com).
2. Dirigirse al menú lateral y hacer clic en **SQL Editor** (o Nuevo Query).
3. Abrir o copiar todo el contenido del archivo **`dump_completo_hotel_illimani.sql`**.
4. Hacer clic en **Run** (Ejecutar).
5. Todas las tablas, relaciones, roles, habitaciones y servicios quedarán restaurados inmediatamente con sus datos reales.

### Opción 2: En PostgreSQL Local / pgAdmin / DBeaver
1. Crear una base de datos vacía (ej. `hotel_illimani_db`):
   ```sql
   CREATE DATABASE hotel_illimani_db;
   ```
2. Abrir la herramienta de consulta SQL (Query Tool) conectada a la base de datos creada.
3. Cargar y ejecutar **`dump_completo_hotel_illimani.sql`**.
4. El script crea automáticamente los tipos ENUM, extensiones UUID y los registros con integridad referencial garantizada.

---

## 📊 Tablas y Datos Respaldados

* `tipos_habitacion`: Categorías (Suite Presidencial, Matrimonial Deluxe, Doble Ejecutiva, Confort).
* `habitaciones`: 23 habitaciones con asignación de pisos, cuadrícula y coordenadas JSONB de fachada.
* `catalogo_servicios`: 53 amenidades y servicios (Gastronomía, Spa, Minibar, Lavandería, Transporte).
* `perfiles`: Usuarios y personal del hotel con roles (`admin`, `recepcionista`, `limpieza`, `huesped`).
* `huespedes`: Directorio de clientes con cédulas de identidad, correos y teléfonos.
* `reservas`: Reservas en estado `en_curso`, `confirmada` y `finalizada`.
* `consumos_reserva`: Consumos de servicios cargados a habitaciones de huéspedes.
* `turnos_caja`: Turnos de caja registrados con montos iniciales de apertura.
* `historial_limpieza`: Registro de estados y trazabilidad de aseo de habitaciones.

