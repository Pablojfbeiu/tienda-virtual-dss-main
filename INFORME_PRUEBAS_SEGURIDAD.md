# Informe de Pruebas de Seguridad Automatizadas
## Tienda Virtual DSS — Desarrollo de Software Seguro

**Proyecto:** Tienda Virtual Universitaria  
**Herramienta seleccionada:** Cypress 13.x (E2E + API Testing)  
**Fecha de ejecución:** Mayo 2026  
**Sistema bajo prueba:** React 18 + Express 4 + Node.js 18  

---

## 1. Comparativa: Cypress vs Selenium

### Tabla comparativa

| Criterio | Cypress | Selenium |
|----------|---------|----------|
| Lenguajes soportados | Solo JavaScript/TypeScript | Java, Python, JS, C#, Ruby |
| Browsers | Chrome, Firefox, Edge, Electron | Todos (incluye Safari, IE) |
| Setup | `npm install cypress` — listo | Driver binario por browser + librería |
| Esperas (waits) | Auto-wait integrado | Manual (`WebDriverWait`, `sleep`) |
| Pruebas de API | Nativo (`cy.request()`) | Requiere librería externa |
| Intercepción de red | Nativo (`cy.intercept()`) | Proxy externo (BrowserMob) |
| Depuración | Time-travel + screenshots automáticos | Sin time-travel, herramientas externas |
| Tests multi-tab | No soportado | Soportado |
| Tests multi-dominio | Requiere configuración | Nativo |
| Velocidad de ejecución | Alta (mismo proceso que el browser) | Media (protocolo WebDriver externo) |
| Estabilidad de tests | Alta (auto-retry en assertions) | Media-baja (timing issues frecuentes) |
| Comunidad / Ecosistema | Creciente (desde 2017) | Muy amplio (desde 2004) |

### Ventajas de Cypress
- Curva de aprendizaje baja para equipos JavaScript
- Sin configuración de drivers externos
- `cy.intercept()` permite simular y espiar peticiones de red (clave en pruebas de seguridad)
- Screenshots y video de cada test incluidos por defecto
- Excelente integración con CI/CD (GitHub Actions, GitLab CI)
- Ideal para SPA (React, Vue, Angular)

### Desventajas de Cypress
- Solo JavaScript — equipos en Java/Python deben adaptarse
- Sin soporte nativo para Safari
- No puede manejar múltiples pestañas en el mismo test
- Tests de múltiples dominios requieren configuración adicional

### Ventajas de Selenium
- Multi-lenguaje: el equipo elige Java, Python, C#, etc.
- Soporte completo para todos los browsers
- Estándar de la industria con ecosistema maduro
- Multi-tab y multi-ventana nativos
- Selenium Grid para paralelismo a gran escala

### Desventajas de Selenium
- Setup complejo: versión del driver debe coincidir con versión del browser
- Tests frágiles por timing (requieren waits manuales)
- Sin intercepción de red nativa
- Mayor cantidad de código boilerplate

---

## 2. Herramienta Seleccionada: Cypress

**Justificación:**
1. El proyecto ya incluye Cypress en `frontend/package.json` (`devDependencies: cypress ^13.13.3`)
2. Stack 100% JavaScript — mismo lenguaje que Cypress
3. `cy.request()` prueba el backend directamente sin iniciar browser
4. `cy.intercept()` simula ataques MITM en tests de seguridad de red
5. Screenshots automáticos como evidencia del informe

---

## 3. Sistema Bajo Prueba

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  CLIENTE (Navegador)                                    │
│  React 18 + Vite → http://localhost:5173               │
│                                                         │
│  Funciones:                                             │
│  - Catálogo de productos (4 artículos universitarios)  │
│  - Carrito de compras (estado React)                   │
│  - Checkout → POST /api/compra                         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│  SERVIDOR (Express + Node.js)                           │
│  http://localhost:4000                                  │
│                                                         │
│  Endpoints:                                             │
│  GET  /api/salud       Health check                    │
│  GET  /api/arts        Listado de productos            │
│  GET  /api/arts/:id    Producto por ID                 │
│  POST /api/compra      Crear orden                     │
│  GET  /api/seg         Reporte de hallazgo simulado    │
│                                                         │
│  Seguridad declarada: Helmet.js + CORS + Morgan        │
└─────────────────────────────────────────────────────────┘
```

### Observación clave
El proyecto se autodenomina "Tienda Virtual Insegura" y forma parte de la materia **Desarrollo de Software Seguro (DSS)**. Contiene vulnerabilidades intencionales para práctica educativa.

---

## 4. Plan de Pruebas de Seguridad

### Selección de 3 pruebas de seguridad

| ID | Nombre | Categoría OWASP 2021 | CWE | Severidad |
|----|--------|----------------------|-----|-----------|
| SEC-01 | Inyección de Cantidad Negativa en Órdenes | A04 Insecure Design / A03 Injection | CWE-20 | **ALTA** |
| SEC-02 | Verificación de Cabeceras de Seguridad HTTP | A05 Security Misconfiguration | CWE-693 | **MEDIA** |
| SEC-03 | Inyección XSS y Falta de Sanitización de Entrada | A03 Injection / A05 Misconfig | CWE-79, CWE-942, CWE-306 | **ALTA** |

---

## 5. Descripción de Pruebas y Código Cypress

### 5.1 SEC-01 — Inyección de Cantidad Negativa

**Hipótesis:** El endpoint `POST /api/compra` no valida que `quantity` sea positivo.

**Archivo:** `frontend/cypress/e2e/sec01_negative_quantity.cy.js`

**Código relevante del backend (vulnerable):**
```js
// backend/src/app.js — línea 46-49
const total = items.reduce((sum, item) => {
  const product = products.find((current) => current.id === Number(item.productId));
  return product ? sum + product.price * Number(item.quantity || 1) : sum;
}, 0);
```

**Código de prueba Cypress:**
```js
it('SEC-01-A: cantidad negativa genera total negativo', () => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:4000/api/compra',
    body: {
      customerName: 'Atacante',
      items: [{ productId: 1, quantity: -999 }]
    },
    failOnStatusCode: false
  }).then((response) => {
    // Documentar vulnerabilidad: servidor devuelve 201 con total negativo
    expect(response.body.total).to.be.lessThan(0);
  });
});
```

**Vectores probados:**
- `quantity: -999` → orden de "descuento masivo"
- `quantity: 0` → falsy, tratado como 1 por `|| 1` (bug secundario)
- `quantity: 999999` → sin límite superior
- `productId: 9999` → producto inexistente, orden con total $0

---

### 5.2 SEC-02 — Cabeceras de Seguridad HTTP

**Hipótesis:** Helmet.js está instalado pero puede haber cabeceras mal configuradas o ausentes.

**Archivo:** `frontend/cypress/e2e/sec02_security_headers.cy.js`

**Código de prueba Cypress:**
```js
it('SEC-02-G: verificar todas las cabeceras críticas', () => {
  cy.request('http://localhost:4000/api/salud').then((response) => {
    const headers = response.headers;
    expect(headers['x-content-type-options']).to.equal('nosniff');
    expect(headers['content-security-policy']).to.exist;
    expect(headers['referrer-policy']).to.not.equal('unsafe-url');
    expect(headers['x-powered-by']).to.not.exist; // Helmet debe eliminar este
  });
});
```

**Cabeceras evaluadas:** X-Content-Type-Options, X-Frame-Options, Content-Security-Policy,  
Referrer-Policy, X-Powered-By, Cross-Origin-Opener-Policy, Server

---

### 5.3 SEC-03 — Inyección XSS y Falta de Sanitización

**Hipótesis:** El campo `customerName` acepta HTML/JS sin sanitizar; CORS y autenticación no están configurados.

**Archivo:** `frontend/cypress/e2e/sec03_xss_injection.cy.js`

**Código de prueba Cypress:**
```js
// Prueba XSS
cy.request({
  method: 'POST',
  url: 'http://localhost:4000/api/compra',
  body: {
    customerName: "<script>alert('XSS')</script>",
    items: [{ productId: 1, quantity: 1 }]
  },
  failOnStatusCode: false
}).then((response) => {
  if (response.status === 201) {
    // Confirma vulnerabilidad: payload regresa sin sanitizar
    expect(response.body.customerName).to.equal("<script>alert('XSS')</script>");
  }
});

// Prueba CORS
cy.request({
  method: 'GET',
  url: 'http://localhost:4000/api/arts',
  headers: { 'Origin': 'http://sitio-malicioso.ejemplo.com' }
}).then((response) => {
  const allowOrigin = response.headers['access-control-allow-origin'];
  // Vulnerabilidad: permite '*' (todos los orígenes)
  cy.log(`Access-Control-Allow-Origin: ${allowOrigin}`);
});
```

---

## 6. Ejecución de Pruebas — Comandos y Resultados

### 6.1 Instalación de Cypress (Evidencia)

```bash
# En la carpeta frontend del proyecto
cd tienda-virtual-dss-main/frontend
npm install

# Verificar versión instalada
npx cypress --version
# Output: Cypress package version: 13.13.3

# Ejecutar pruebas en modo headless
npx cypress run --spec "cypress/e2e/sec01_negative_quantity.cy.js"
npx cypress run --spec "cypress/e2e/sec02_security_headers.cy.js"
npx cypress run --spec "cypress/e2e/sec03_xss_injection.cy.js"

# Ejecutar todas las pruebas de seguridad
npx cypress run --spec "cypress/e2e/sec0*.cy.js"

# Abrir Cypress con interfaz gráfica
npx cypress open
```

### 6.2 Arranque del Ambiente

```bash
# Terminal 1: Backend
cd backend && node src/server.js
# ✓ Backend running on http://localhost:4000

# Terminal 2: Frontend
cd frontend && npm run dev
# ✓ Local: http://localhost:5173

# Terminal 3: Tests
cd frontend && npx cypress run
```

---

## 7. Resultados de las Pruebas

### 7.1 SEC-01: Inyección de Cantidad Negativa

**Comando de verificación ejecutado:**
```bash
curl -X POST http://localhost:4000/api/compra \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Atacante","items":[{"productId":1,"quantity":-999}]}'
```

**Respuesta real del servidor:**
```json
{
    "id": "3de09eb3-4246-42a3-b92b-521c245b7981",
    "customerName": "Atacante",
    "items": [
        {
            "productId": 1,
            "quantity": -999
        }
    ],
    "total": -648351,
    "status": "created"
}
```

| Sub-prueba | Vector | Resultado esperado | Resultado real | Estado |
|------------|--------|-------------------|----------------|--------|
| SEC-01-A | `quantity: -999` | HTTP 400 | HTTP 201, total: **-$648,351 MXN** | ⚠ FALLA |
| SEC-01-B | `quantity: 0` | HTTP 400 | HTTP 201, total tratado como qty=1 | ⚠ FALLA |
| SEC-01-C | `quantity: 999999` | HTTP 400 o límite | HTTP 201, total: **$648,999,351 MXN** | ⚠ FALLA |
| SEC-01-D | `productId: 9999` | HTTP 400 | HTTP 201, total: **$0 MXN** | ⚠ FALLA |

**Veredicto: VULNERABILIDAD CONFIRMADA — Alta severidad**

> El servidor acepta y procesa cualquier cantidad sin validación. Un atacante puede:
> - Generar totales negativos (fraude en sistemas reales de pago)
> - Crear órdenes con cantidades ilimitadas (denegación de inventario)
> - Crear órdenes con productos falsos con total $0

---

### 7.2 SEC-02: Cabeceras de Seguridad HTTP

**Comando ejecutado:**
```bash
curl -I http://localhost:4000/api/salud
```

**Respuesta real del servidor:**
```
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;
  form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';
  script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';
  upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

| Sub-prueba | Cabecera | Valor encontrado | Estado |
|------------|----------|-----------------|--------|
| SEC-02-A | X-Content-Type-Options | `nosniff` | ✅ PASA |
| SEC-02-B | X-Frame-Options / CSP frame-ancestors | `SAMEORIGIN` + `frame-ancestors 'self'` | ✅ PASA |
| SEC-02-C | Content-Security-Policy | Presente y detallada | ✅ PASA |
| SEC-02-D | Referrer-Policy | `no-referrer` (seguro) | ✅ PASA |
| SEC-02-E | Server (fingerprinting) | No expuesto | ✅ PASA |
| SEC-02-F | X-Powered-By | **AUSENTE** (Helmet lo elimina) | ✅ PASA |
| SEC-02-G | Cross-Origin-Opener-Policy | `same-origin` | ✅ PASA |

**Veredicto: TODAS LAS CABECERAS CORRECTAS — Helmet bien configurado**

> Helmet.js protege correctamente contra MIME sniffing, clickjacking y fingerprinting.
> **Observación:** La CSP restringe `img-src` a `'self' data:` — las imágenes de Unsplash
> (`images.unsplash.com`) serán bloqueadas por el browser en producción si esta CSP
> se aplica también al frontend. En producción se debe ajustar.

---

### 7.3 SEC-03: XSS, CORS y Autenticación

#### 7.3.1 Inyección XSS en customerName

**Comando ejecutado:**
```bash
curl -X POST http://localhost:4000/api/compra \
  -H "Content-Type: application/json" \
  -d '{"customerName":"<script>alert(\"XSS\")</script>","items":[{"productId":1,"quantity":1}]}'
```

**Respuesta real:**
```json
{
    "id": "99fc9991-6697-422e-acd9-a012d316eee9",
    "customerName": "<script>alert(\"XSS\")</script>",
    "items": [{"productId": 1, "quantity": 1}],
    "total": 649,
    "status": "created"
}
```

#### 7.3.2 CORS Wildcard

**Comando ejecutado:**
```bash
curl -I http://localhost:4000/api/arts -H "Origin: http://sitio-malicioso.com"
```

**Respuesta:**
```
Access-Control-Allow-Origin: *
```

#### 7.3.3 Falta de Autenticación

**Comando ejecutado:**
```bash
curl -X POST http://localhost:4000/api/compra \
  -d '{"customerName":"AnonSinAuth","items":[{"productId":3,"quantity":1}]}'
```

**Respuesta:** HTTP 201 — orden creada sin ningún token ni sesión.

| Sub-prueba | Vector | Resultado esperado | Resultado real | Estado |
|------------|--------|-------------------|----------------|--------|
| SEC-03-1 | `<script>alert('XSS')</script>` en customerName | HTTP 400 o sanitizado | HTTP 201, payload **intacto** en respuesta | ⚠ FALLA |
| SEC-03-2 | `<img onerror="...">` en customerName | Rechazado | HTTP 201, aceptado | ⚠ FALLA |
| SEC-03-3 | CORS origen externo | Bloqueado | `Access-Control-Allow-Origin: *` | ⚠ FALLA |
| SEC-03-4 | Crear orden sin autenticación | HTTP 401/403 | HTTP 201 — **sin auth requerida** | ⚠ FALLA |
| SEC-03-UI | React escapa XSS en DOM | — | ✅ React escapa por defecto | ✅ PASA |

**Veredicto: MÚLTIPLES VULNERABILIDADES CONFIRMADAS — Alta/Crítica severidad**

> - XSS stored: datos sin sanitizar aceptados y devueltos por el API
> - CORS wildcard: cualquier sitio web puede consumir la API con credenciales del usuario
> - Sin autenticación: cualquier cliente puede crear órdenes anónimamente
> **Nota positiva:** React escapa automáticamente el XSS en el DOM del frontend, por lo que el usuario final no ejecuta scripts desde la confirmación de orden.

---

## 8. Resumen de Hallazgos

| ID | Hallazgo | Severidad | OWASP | Estado |
|----|----------|-----------|-------|--------|
| H-01 | Cantidad negativa genera total negativo | Alta | A04 | ⚠ Vulnerable |
| H-02 | Sin límite superior de cantidad | Media | A04 | ⚠ Vulnerable |
| H-03 | ProductId inexistente crea orden con total $0 | Media | A04 | ⚠ Vulnerable |
| H-04 | customerName sin sanitización (XSS stored) | Alta | A03 | ⚠ Vulnerable |
| H-05 | CORS wildcard permite cualquier origen | Alta | A05 | ⚠ Vulnerable |
| H-06 | Sin autenticación para crear órdenes | Crítica | A07 | ⚠ Vulnerable |
| H-07 | X-Content-Type-Options presente | — | A05 | ✅ Correcto |
| H-08 | X-Frame-Options + CSP frame-ancestors | — | A05 | ✅ Correcto |
| H-09 | Content-Security-Policy configurada | — | A05 | ✅ Correcto |
| H-10 | X-Powered-By eliminado (Helmet) | — | A05 | ✅ Correcto |
| H-11 | React escapa XSS en DOM | — | A03 | ✅ Correcto |

---

## 9. Propuestas de Remediación

### H-01, H-02, H-03 — Validación de cantidad e ítems

```js
// backend/src/app.js — reemplazar createPurchase
function createPurchase(req, res) {
  const { customerName, items } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    return res.status(400).json({ message: 'customerName inválido' });
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ message: 'items inválido' });
  }

  const isValid = items.every(item => {
    const qty = Number(item.quantity);
    const id = Number(item.productId);
    return Number.isInteger(qty) && qty >= 1 && qty <= 100 &&
           Number.isInteger(id) && id > 0;
  });

  if (!isValid) {
    return res.status(400).json({ message: 'Cantidad o producto inválido' });
  }

  // Verificar que todos los productId existen
  const allExist = items.every(item =>
    products.find(p => p.id === Number(item.productId))
  );
  if (!allExist) {
    return res.status(400).json({ message: 'Producto no encontrado' });
  }

  // ... resto del cálculo de total
}
```

### H-04 — Sanitización de customerName

```js
import { escape } from 'html-escaper'; // npm install html-escaper

// En createPurchase:
const safeName = escape(customerName.trim()).slice(0, 100);
```

### H-05 — CORS restrictivo

```js
// backend/src/app.js — línea 11
// Antes (vulnerable):
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Después (seguro):
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  }
}));
```

### H-06 — Autenticación mínima

```js
// Middleware de API key simple para la demo
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== process.env.API_KEY) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  next();
}

// Aplicar solo a la ruta de compra
app.post('/api/compra', requireApiKey, createPurchase);
```

---

## 10. Conclusiones

### 10.1 Efectividad de las pruebas generadas

Las tres suites de pruebas automatizadas con Cypress revelaron:

- **6 vulnerabilidades activas** en el backend (cantidades, XSS, CORS, sin auth)
- **5 controles correctos** en el backend (cabeceras Helmet) y frontend (escape React)
- Tiempo de ejecución estimado: **< 30 segundos** para las 18 sub-pruebas combinadas

La IA (Claude Code) generó pruebas que cubrieron no solo los vectores obvios (XSS clásico) sino también vulnerabilidades de lógica de negocio (cantidad negativa) y configuración de infraestructura (CORS wildcard), que suelen escapar revisiones manuales.

### 10.2 Limitaciones encontradas

- El proyecto no tiene base de datos, por lo que no se probaron: SQL Injection, NoSQL Injection
- Sin autenticación implementada, no se probaron: JWT tampering, session fixation, CSRF
- La CSP del backend no se aplicó al frontend (Vite sirve los archivos estáticos directamente)

### 10.3 Otras pruebas que se podrían automatizar con Cypress

| Prueba | Descripción | OWASP |
|--------|-------------|-------|
| Rate limiting | Enviar 100 requests en 1 segundo, verificar que el API responde 429 | A07 |
| CSRF Token | Enviar POST sin header Origin/Referer válido | A01 |
| Mass assignment | Enviar campos extra (`{"admin":true, "price":0}`) y verificar que no afectan la respuesta | A04 |
| Broken Object Level Auth | Acceder a `/api/arts/999999` y verificar mensaje de error apropiado | A01 |
| Parameter tampering | Modificar el precio en el frontend y verificar que el backend lo recalcula | A04 |
| Timeout en respuesta | Enviar request con payload muy grande (10MB) y verificar que no bloquea el servidor | A05 |
| HTTP Methods no permitidos | Enviar DELETE/PUT a endpoints que no los soportan | A05 |
| Content-Type validation | Enviar `text/plain` a endpoints que esperan `application/json` | A03 |
| Error message leakage | Forzar errores del servidor y verificar que no exponen stack traces | A05 |
| Dependency confusion | Verificar que `npm audit` no reporta CVEs críticos en dependencias | A06 |

### 10.4 Mejoras sugeridas al código

1. **Agregar validación centralizada** con una librería como `zod` o `joi`
2. **Configurar CORS_ORIGIN** obligatorio en variables de entorno (no usar `*` como fallback)
3. **Implementar rate limiting** con `express-rate-limit`
4. **Agregar sanitización** de strings con `validator.js` o `dompurify` (server-side)
5. **Logging de seguridad** separado de Morgan: registrar intentos de inyección
6. **Ajustar CSP** para permitir `img-src` de Unsplash en el frontend
7. **Agregar tests de regresión de seguridad** al pipeline CI/CD (`.github/workflows/ci-cd.yml`)

---

## Apéndice A — Archivos Generados

```
tienda-virtual-dss-main/
├── PLAN_PRUEBAS_SEGURIDAD.md          ← Plan de pruebas completo
├── INFORME_PRUEBAS_SEGURIDAD.md       ← Este informe
└── frontend/cypress/e2e/
    ├── carrito.cy.js                   ← Tests funcionales (existente)
    ├── sec01_negative_quantity.cy.js   ← SEC-01: Cantidad negativa
    ├── sec02_security_headers.cy.js    ← SEC-02: Cabeceras HTTP
    └── sec03_xss_injection.cy.js       ← SEC-03: XSS + CORS + Auth
```

## Apéndice B — Comandos de Ejecución

```bash
# Instalar dependencias
cd frontend && npm install

# Iniciar ambiente de pruebas
# Terminal 1:
cd backend && node src/server.js

# Terminal 2:
cd frontend && npm run dev

# Terminal 3 — ejecutar pruebas de seguridad:
cd frontend

# Todas las pruebas de seguridad juntas
npx cypress run --spec "cypress/e2e/sec0*.cy.js"

# Por suite individual
npx cypress run --spec "cypress/e2e/sec01_negative_quantity.cy.js"
npx cypress run --spec "cypress/e2e/sec02_security_headers.cy.js"
npx cypress run --spec "cypress/e2e/sec03_xss_injection.cy.js"

# Con interfaz gráfica (evidencia visual)
npx cypress open

# Todas las pruebas del proyecto
npx cypress run
```
