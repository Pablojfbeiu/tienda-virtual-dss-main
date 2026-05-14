# Guia de implementacion: Tienda Virtual Demo

## 1. Descripcion general

Este repositorio contiene una tienda virtual demo construida con:

- Frontend: React + Vite
- Backend: Node.js + Express
- Pruebas frontend: Vitest + Testing Library
- Pruebas E2E: Cypress
- Pruebas backend: Node Test Runner + Supertest
- Seguridad: CodeQL
- Contenedores: Docker y Docker Compose
- CI/CD: GitHub Actions

La aplicacion permite consultar articulos universitarios, agregarlos al carrito y crear una compra demo.

---

## 2. Estructura del proyecto

```text
virtual-store-demo/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── data.js
│   │   └── server.js
│   ├── test/
│   │   └── app.test.js
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.test.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── cypress/
│   │   └── e2e/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── cypress.config.js
│   ├── vite.config.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       └── codeql.yml
├── docker-compose.yml
└── IMPLEMENTACION.md
```

---

## 3. Requisitos previos

- Node.js 22 o superior
- npm
- Git
- Docker Desktop, opcional
- Cuenta de GitHub

---

## 4. Ejecucion local

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Disponible en `http://localhost:4000`.

Rutas principales:

- `GET /api/salud`
- `GET /api/arts`
- `GET /api/arts/:id`
- `POST /api/compra`
- `GET /api/seg`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Disponible en `http://localhost:5173`.

---

## 5. Docker Compose

Desde la raiz del proyecto:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api/salud`

---

## 6. Variables de entorno

### Backend

Archivo: `backend/.env`

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### Frontend

Archivo: `frontend/.env`

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 7. Pruebas

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

### Cypress E2E en local

Primero levanta backend y frontend:

```bash
cd backend
npm start
```

En otra terminal:

```bash
cd frontend
npm run dev
```

Luego ejecuta:

```bash
cd frontend
npm run e2e
```

La configuracion actual usa una suite minima y no requiere `cypress/support/e2e.js`.

---

## 8. GitHub Actions

Archivo principal:

```text
.github/workflows/ci-cd.yml
```

Este workflow ejecuta:

1. Instalacion de dependencias del backend con `npm ci`
2. Instalacion de dependencias del frontend con `npm ci`
3. Pruebas del backend
4. Pruebas del frontend
5. Build del frontend
6. Pruebas E2E con Cypress

Tambien fuerza la ejecucion de acciones JavaScript con Node 24 para evitar el warning de deprecacion de Node 20 en GitHub Actions.

Se activa unicamente cuando se abre o actualiza un `pull_request` de `develop` hacia `main`.

Configuracion:

```yaml
pull_request:
  branches: [main]
```

Ademas, el job principal valida que la rama origen sea `develop`.

---

## 9. CodeQL

Archivo:

```text
.github/workflows/codeql.yml
```

CodeQL queda disponible solo por ejecucion manual hasta que el repositorio tenga habilitado `Code scanning` en GitHub.

Usa:

```yaml
queries: security-extended,security-and-quality
```

Trigger actual:

```yaml
workflow_dispatch:
```

Consulta resultados en:

```text
Repository -> Security -> Code scanning
```

---

## 10. Flujo recomendado

```text
Desarrollador trabaja en develop
        ↓
Ejecuta pruebas locales
        ↓
Abre Pull Request de develop hacia main
        ↓
GitHub Actions ejecuta tests, build, Cypress y validaciones de seguridad
        ↓
Si todo pasa, se aprueba el merge
```

---

## 11. Comandos rapidos

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Pruebas

```bash
cd backend
npm test

cd ../frontend
npm test
```

### Docker

```bash
docker compose up --build
```

---

## 12. Resultado esperado

Al finalizar tendras:

- Tienda virtual demo funcional
- Backend REST con Express
- Frontend React + Vite
- Pruebas unitarias y E2E
- CodeQL activo
- GitHub Actions ejecutando Cypress solo en PR `develop -> main`
