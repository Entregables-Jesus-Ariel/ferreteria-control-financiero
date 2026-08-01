# ADR-000: Migracion a MySQL, Go dockerizado y convencion Liquibase

## Estado

Aceptado.

## Contexto

El backend recibido (backend.zip) venia funcional pero con tres supuestos
que no coincidian con el stack pedido para esta prueba (Go + MySQL +
Angular, todo en Docker):

1. Usaba lib/pq y variables POSTGRES_* para conectarse a PostgreSQL.
2. Go no estaba instalado en la maquina de desarrollo, y el flujo asumia
   compilar/testear localmente.
3. No existia ningun esquema de base de datos versionado; solo el codigo
   de persistencia.

## Decision

### a) Migrar la persistencia de PostgreSQL a MySQL

Se reemplazo lib/pq por go-sql-driver/mysql y se movio
internal/persistence/postgres a internal/persistence/mysql, adaptando
los placeholders ($1, $2 a ?) y los tipos (SERIAL a AUTO_INCREMENT).
Las variables de entorno pasaron de POSTGRES_* a MYSQL_*
(ver backend/.env.example).

### b) Dockerizar Go en vez de instalarlo localmente

El backend se compila, testea y corre siempre dentro de contenedores
(backend/Dockerfile, multi-stage: golang:1.21 para compilar, alpine
para el runtime). Esto evita depender de una instalacion local de Go y
mantiene el entorno de desarrollo reproducible entre maquinas.

Para compilar/testear sin depender de docker-compose.yml completo
(por ejemplo, sin MySQL levantado), se usa la etapa intermedia del
Dockerfile:

    docker build --target build -t ferreteria-backend-toolchain ./backend
    docker run --rm ferreteria-backend-toolchain go build ./...
    docker run --rm ferreteria-backend-toolchain go test ./...

### c) Adoptar la convencion Liquibase para versionar el esquema

En vez de scripts .sql sueltos aplicados a mano, el esquema de MySQL se
versiona con Liquibase, corriendo tambien en un contenedor
(database/Dockerfile, imagen liquibase/liquibase + driver
mysql-connector-j). La estructura sigue la convencion estandar:

    database/
    |-- changelog/db.changelog-master.yaml   # punto de entrada unico
    |-- 01_ddl/                              # tablas, constraints, indices
    |-- 02_dml/                              # seeds (categorias, admin)
    |-- 03_dcl/                              # usuario de aplicacion
    |-- 04_tcl/                              # reservado, sin uso en esta fase
    `-- 05_rollbacks/                        # rollback de cada changeset

00_extensions y 06_materialized_views (presentes en la convencion
original pensada para Postgres) no aplican en MySQL y se omiten a
proposito, no por olvido.

### d) Sin .env compartido entre ambientes

No existe un archivo de infraestructura compartido entre ambientes.
backend/.env.example documenta las variables que necesita el backend;
cada desarrollador o ambiente mantiene su propio .env local (ignorado
por git) con los valores reales.

## Consecuencias

- El proyecto es un monorepo unico: un backend Go, una base MySQL, un
  frontend Angular, no microservicios.
- Cualquier persona puede levantar el entorno completo solo con Docker,
  sin instalar Go, MySQL ni Liquibase en su maquina.
- El esquema de base de datos queda versionado y es reproducible desde
  cero (docker compose --profile tooling run --rm liquibase-ferreteria update).
- Los cambios de esquema futuros deben anadirse como nuevos changesets en
  database/01_ddl (o 02_dml/03_dcl segun corresponda) con su rollback
  correspondiente en database/05_rollbacks, nunca modificando un
  changeset ya aplicado.
