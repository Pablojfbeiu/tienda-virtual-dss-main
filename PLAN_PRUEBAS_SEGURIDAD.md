# Plan de Pruebas de Seguridad — Tienda Virtual DSS

**Proyecto:** Tienda Virtual Universitaria (DSS — Desarrollo de Software Seguro)  
**Herramienta:** Cypress 13.x (E2E + API Testing)  
**Fecha:** Mayo 2026  
**Autor:** Equipo DSS  
**Versión:** 1.0

---

## 1. Comparativa: Cypress vs Selenium

### 1.1 Cypress

| Aspecto | Detalle |
|---------|---------|
| **Arquitectura** | Corre dentro del navegador (mismo proceso que la app). No usa WebDriver. |
| **Lenguaje** | Solo JavaScript/TypeScript |
| **Browsers** | Chromium, Firefox, Edge, Electron (sin Safari nativo) |
| **Setup** | `npm install cypress` — listo. Sin drivers externos. |
| **Esperas** | Auto-wait integrado. No se necesita `sleep()` ni `WebDriverWait`. |
| **Depuración** | Time-travel debugging (screenshots por cada comando), video de sesión |
| **Pruebas API** | `cy.request()` para HTTP directamente |
| **Intercepción** | `cy.intercept()` para mockear/espiar requests de red |
| **Reportes** | Dashboard propio, integración con CI/CD |
| **Licencia** | Open source (MIT) + plan comercial para Dashboard |
| **Limitaciones** | No multi-tab nativo, no multi-dominio en mismo test, solo JS |

**Ventajas de Cypress:**
- Curva de aprendizaje baja para developers de JS
- Configuración mínima (ya instalado en este proyecto)
- Auto-retry en assertions (menos tests frágiles)
- Excelente DX: errores claros, preview en tiempo real
- Ideal para SPA (React, Vue, Angular)
- `cy.intercept()` permite simular ataques de red

**Desventajas de Cypress:**
- Solo JavaScript (no Java, Python, C#)
- Sin soporte nativo para Safari
- No puede abrir múltiples pestañas en un test
- Tests de múltiples dominios requieren configuración especial

---

### 1.2 Selenium

| Aspecto | Detalle |
|---------|---------|
| **Arquitectura** | WebDriver externo (chromedriver, geckodriver). Protocolo W3C. |
| **Lenguaje** | Java, Python, JavaScript, C#, Ruby, PHP |
| **Browsers** | Chrome, Firefox, Safari, Edge, IE (soporte completo) |
| **Setup** | Instalar Selenium + driver binario correspondiente al browser |
| **Esperas** | Manual (`implicitlyWait`, `WebDriverWait`, `ExpectedConditions`) |
| **Depuración** | Sin time-travel. Requiere herramientas externas (Allure, ExtentReports) |
| **Pruebas API** | No nativo (requiere librería extra: REST-Assured, Requests) |
| **Intercepción** | No nativo (requiere BrowserMob Proxy u otras) |
| **Reportes** | Requiere configuración extra |
| **Licencia** | Open source (Apache 2.0) |
| **Limitaciones** | Más verboso, setup complejo, tests más frágiles por timing |

**Ventajas de Selenium:**
- Multi-lenguaje (equipo puede usar Java, Python, etc.)
- Soporte Safari y browsers móviles
- Estándar de la industria desde 2004 (amplio ecosistema)
- Multi-tab y multi-ventana nativos
- Grid para paralelismo a gran escala

**Desventajas de Selenium:**
- Setup complejo (versiones de driver deben coincidir con browser)
- Tests más frágiles (timing issues frecuentes)
- No tiene intercepción de red nativa
- Más código boilerplate para la misma prueba

---

### 1.3 Tabla Comparativa

| Criterio | Cypress | Selenium |
|----------|---------|----------|
| Velocidad de setup | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Curva de aprendizaje | Baja | Media-Alta |
| Soporte de browsers | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Velocidad de ejecución | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Estabilidad de tests | Alta (auto-retry) | Media (timing manual) |
| Pruebas API | Nativo | Requiere librería |
| Intercepción de red | Nativo | Proxy externo |
| Depuración | Excelente | Básica |
| Multi-lenguaje | No (solo JS) | Sí |
| Adecuado para este proyecto | ✅ Óptimo | ✅ Posible |

**Conclusión:** Para este proyecto React + Node.js con Cypress ya instalado, **Cypress es la elección óptima**.

---

## 2. Herramienta Seleccionada

**Cypress 13.x** — ya presente en `frontend/package.json` como devDependency.

**Justificación:**
1. El proyecto ya lo tiene instalado y configurado (`cypress.config.js`)
2. El stack es 100% JavaScript (React + Express), mismo lenguaje que Cypress
3. `cy.request()` permite probar la API del backend directamente
4. `cy.intercept()` permite simular ataques de hombre-en-el-medio
5. Screenshots y videos automáticos para evidencia del informe

---

## 3. Alcance del Sistema Bajo Prueba

### 3.1 Descripción del Sistema

**Nombre:** Tienda Virtual DSS  
**Tipo:** SPA (Single-Page Application) con API REST  
**Frontend:** React 18 + Vite 5 → `http://localhost:5173`  
**Backend:** Node.js + Express 4 → `http://localhost:4000`  
**Sin base de datos:** datos en memoria  

### 3.2 Funcionalidades en Alcance

| ID | Funcionalidad | Endpoint/Componente |
|----|---------------|---------------------|
| F1 | Catálogo de productos | GET `/api/arts` |
| F2 | Detalle de producto | GET `/api/arts/:id` |
| F3 | Agregar al carrito | Estado React (frontend) |
| F4 | Crear orden (checkout) | POST `/api/compra` |
| F5 | Health check | GET `/api/salud` |
| F6 | Reporte de seguridad | GET `/api/seg` |

### 3.3 Fuera de Alcance

- Autenticación de usuarios (no existe en el sistema)
- Base de datos (no existe)
- Pagos reales
- Panel de administración

---

## 4. Plan de Pruebas

### 4.1 Objetivo General

Identificar, documentar y evidenciar vulnerabilidades de seguridad en la Tienda Virtual DSS mediante pruebas automatizadas con Cypress, siguiendo el estándar OWASP Top 10 2021.

### 4.2 Criterios de Entrada

- Backend corriendo en `http://localhost:4000`
- Frontend corriendo en `http://localhost:5173`
- Cypress instalado (`npm install` en carpeta `frontend`)
- Node.js >= 18

### 4.3 Criterios de Salida

- Todas las pruebas ejecutadas al menos una vez
- Resultados documentados con screenshots
- Vulnerabilidades clasificadas por severidad
- Propuestas de remediación documentadas

---

## 5. Pruebas Seleccionadas

### 5.1 Resumen de Pruebas de Seguridad

| ID | Nombre | Categoría OWASP | Severidad | Archivo |
|----|--------|-----------------|-----------|---------|
| SEC-01 | Inyección de Cantidad Negativa | A04 Insecure Design / A03 Injection | Alta | `sec01_negative_quantity.cy.js` |
| SEC-02 | Cabeceras de Seguridad HTTP | A05 Security Misconfiguration | Media | `sec02_security_headers.cy.js` |
| SEC-03 | Inyección XSS y Falta de Sanitización | A03 Injection / CWE-79 | Alta | `sec03_xss_injection.cy.js` |

---

### 5.2 SEC-01: Inyección de Cantidad Negativa

**Descripción:**  
El endpoint `POST /api/compra` acepta el campo `quantity` en los ítems de la orden sin validar que sea un número positivo. Un atacante puede enviar cantidades negativas para generar totales negativos (potencial fraude en tiendas reales).

**Código vulnerable en `backend/src/app.js`:**
```js
const total = items.reduce((sum, item) => {
  const product = products.find((current) => current.id === Number(item.productId));
  return product ? sum + product.price * Number(item.quantity || 1) : sum;
}, 0);
```

**Vectores de ataque:**
- `quantity: -999` → total: `$-649,351 MXN`
- `quantity: 0` → tratado como 1 por el fallback `|| 1` (bug adicional)
- `quantity: 999999` → sin límite superior
- `productId: 9999` → orden creada con total $0

**Remediación propuesta:**
```js
// Validar antes del reduce
const isValid = items.every(item =>
  Number.isInteger(Number(item.quantity)) &&
  Number(item.quantity) > 0 &&
  Number(item.quantity) <= 100
);
if (!isValid) return res.status(400).json({ message: 'Cantidad inválida' });
```

**Sub-pruebas:**
- SEC-01-A: cantidad negativa `-999`
- SEC-01-B: cantidad cero `0`
- SEC-01-C: cantidad masiva `999999`
- SEC-01-D: productId inexistente `9999`

---

### 5.3 SEC-02: Cabeceras de Seguridad HTTP

**Descripción:**  
Las cabeceras HTTP de seguridad son la primera línea de defensa del navegador contra ataques comunes. Aunque el proyecto usa Helmet.js, se debe verificar que las cabeceras críticas estén presentes y configuradas correctamente.

**Cabeceras evaluadas:**

| Cabecera | Propósito | Valor esperado |
|----------|-----------|----------------|
| `X-Content-Type-Options` | Previene MIME sniffing | `nosniff` |
| `X-Frame-Options` | Previene clickjacking | `SAMEORIGIN` o CSP |
| `Content-Security-Policy` | Mitiga XSS | Presente |
| `Referrer-Policy` | Evita fuga de URL | No `unsafe-url` |
| `X-Powered-By` | Fingerprinting | Debe estar AUSENTE |
| `Cross-Origin-Opener-Policy` | Aislamiento de origen | `same-origin` |

**Sub-pruebas:**
- SEC-02-A: `X-Content-Type-Options: nosniff`
- SEC-02-B: Protección contra clickjacking
- SEC-02-C: `Content-Security-Policy` presente
- SEC-02-D: `Referrer-Policy` no es `unsafe-url`
- SEC-02-E: Header `Server` no expone versión
- SEC-02-F: `X-Powered-By` eliminado
- SEC-02-G: Reporte completo de todas las cabeceras

---

### 5.4 SEC-03: Inyección XSS y Falta de Sanitización

**Descripción:**  
El campo `customerName` en `POST /api/compra` no es sanitizado por el backend. Cualquier cadena, incluyendo tags HTML y scripts JavaScript, es aceptada y devuelta intacta en la respuesta. Si esta información es renderizada en un navegador (ej. panel de administración) sin escapado, ejecutará el script.

**Vulnerabilidades adicionales descubiertas:**
- **CORS wildcard:** `cors({ origin: '*' })` cuando `CORS_ORIGIN` no está definido
- **Sin autenticación:** cualquier cliente puede crear órdenes sin sesión

**Payloads probados:**
1. `<script>alert('XSS-SEC03')</script>` — script clásico
2. `<img src=x onerror="document.title='PWNED'">` — event handler
3. `javascript:alert('XSS')` — protocolo javascript
4. `&lt;script&gt;alert(1)&lt;/script&gt;` — doble codificación

**Sub-pruebas:**
- SEC-03-classic-script: tag script
- SEC-03-img-onerror: event handler en imagen
- SEC-03-js-protocol: protocolo javascript
- SEC-03-double-encoded: codificación HTML doble
- SEC-03-UI: React escapa XSS en el DOM (mitigación del frontend)
- SEC-03-CORS: CORS acepta orígenes arbitrarios
- SEC-03-NOAUTH: órdenes sin autenticación

---

## 6. Ambiente de Pruebas

### 6.1 Configuración

```bash
# Terminal 1: iniciar backend
cd backend
npm install
node src/server.js
# Escucha en: http://localhost:4000

# Terminal 2: iniciar frontend
cd frontend
npm install
npm run dev
# Escucha en: http://localhost:5173

# Terminal 3: ejecutar pruebas Cypress
cd frontend
npx cypress run              # headless (CI)
npx cypress open             # con GUI (evidencia visual)
```

### 6.2 Versiones

| Software | Versión |
|----------|---------|
| Node.js | >= 18.x |
| Cypress | ^13.13.3 |
| React | 18.3.1 |
| Express | 4.x |
| Helmet | 7.x |

---

## 7. Matriz de Trazabilidad

| ID Prueba | Sub-prueba | OWASP 2021 | CWE | Severidad | Estado |
|-----------|------------|------------|-----|-----------|--------|
| SEC-01-A | Cantidad negativa | A04 | CWE-20 | Alta | Ejecutar |
| SEC-01-B | Cantidad cero | A04 | CWE-20 | Media | Ejecutar |
| SEC-01-C | Cantidad masiva | A04 | CWE-20 | Media | Ejecutar |
| SEC-01-D | ProductId falso | A04 | CWE-807 | Media | Ejecutar |
| SEC-02-A | MIME sniffing | A05 | CWE-693 | Media | Ejecutar |
| SEC-02-B | Clickjacking | A05 | CWE-1021 | Media | Ejecutar |
| SEC-02-C | CSP ausente | A05 | CWE-693 | Alta | Ejecutar |
| SEC-02-D | Referrer-Policy | A05 | CWE-200 | Baja | Ejecutar |
| SEC-02-E | Server fingerprint | A05 | CWE-200 | Baja | Ejecutar |
| SEC-02-F | X-Powered-By | A05 | CWE-200 | Baja | Ejecutar |
| SEC-02-G | Reporte completo | A05 | CWE-693 | — | Ejecutar |
| SEC-03-classic-script | XSS script | A03 | CWE-79 | Alta | Ejecutar |
| SEC-03-img-onerror | XSS event | A03 | CWE-79 | Alta | Ejecutar |
| SEC-03-js-protocol | XSS protocol | A03 | CWE-79 | Alta | Ejecutar |
| SEC-03-double-encoded | XSS encoded | A03 | CWE-79 | Alta | Ejecutar |
| SEC-03-UI | React DOM XSS | A03 | CWE-79 | Baja | Ejecutar |
| SEC-03-CORS | CORS wildcard | A05 | CWE-942 | Alta | Ejecutar |
| SEC-03-NOAUTH | Sin autenticación | A07 | CWE-306 | Crítica | Ejecutar |
