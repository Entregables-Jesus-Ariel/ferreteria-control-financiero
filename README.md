# Ferreteria - Control Financiero

Sistema de control financiero para un negocio pequeno: registro de
ingresos y egresos por categoria, consulta de saldo neto por periodo
(dia/semana/mes) e historial de auditoria por movimiento.

No es un punto de venta ni un sistema de facturacion: la unidad de
trabajo es el movimiento de dinero agregado, no la venta individual.

## Stack

- Backend: Go (arquitectura hexagonal: domain / application / persistence / transport)
- Base de datos: MySQL 8, esquema versionado con Liquibase
- Frontend: Angular
- Orquestacion: Docker / Docker Compose

Monorepo unico, no microservicios: un backend, una base de datos, un
frontend.

## Estructura del repositorio

    backend/      API en Go (JWT + bcrypt, movimientos, categorias, resumen, auditoria)
    database/     Changesets Liquibase (DDL, DML, DCL) + rollbacks
    frontend/     SPA Angular (login, movimientos, categorias, resumen)
    doc/adr/      Decisiones de arquitectura (ADRs)
    docker-compose.yml

## Levantar el entorno local

No requiere tener Go, MySQL, Liquibase ni Node instalados; todo corre en
contenedores.

1. Copia backend/.env.example a .env en la raiz del repo y completa
   los valores (usuario, contrasenas, secreto de token).

2. Levanta la base de datos:

       docker compose up mysql -d

3. Aplica el esquema:

       docker compose --profile tooling run --rm liquibase-ferreteria update

4. Levanta el backend:

       docker compose up backend -d

   Queda escuchando en http://localhost:8080.

5. Levanta el frontend:

       docker compose up frontend -d

   Queda disponible en http://localhost:4200.

Para desarrollo del frontend con recarga en caliente fuera de Docker:

    cd frontend
    npm install
    npm start

### Verificar el backend sin levantar todo el stack

    docker build --target build -t ferreteria-backend-toolchain ./backend
    docker run --rm ferreteria-backend-toolchain go build ./...
    docker run --rm ferreteria-backend-toolchain go test ./...

## Usuario de prueba

    usuario:    admin
    contrasena: Admin#2026Local

## Documentacion adicional

- [ADR-000: Migracion a MySQL, Go dockerizado y convencion Liquibase](doc/adr/ADR-000-migracion-mysql-docker-liquibase.md)
