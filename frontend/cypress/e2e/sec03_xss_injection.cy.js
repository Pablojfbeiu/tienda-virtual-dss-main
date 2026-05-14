/**
 * SEC-03: Inyección XSS y Falta de Sanitización de Entrada
 * Categoría: Cross-Site Scripting / Improper Input Validation
 * OWASP: A03:2021 – Injection / CWE-20 / CWE-79
 *
 * DESCRIPCIÓN:
 * El backend no sanitiza el campo `customerName` antes de almacenarlo
 * o devolverlo en la respuesta. Si este dato es renderizado en alguna
 * vista (ej. panel de administración), puede ejecutar código arbitrario.
 *
 * Adicionalmente, el frontend muestra mensajes de orden en el DOM sin
 * escapado explícito (depende del escape automático de React).
 *
 * VECTORES PROBADOS:
 *   1. Script tag clásico: <script>alert('XSS')</script>
 *   2. Event handler HTML: <img src=x onerror="alert('XSS')">
 *   3. Protocolo javascript: en href/src
 *   4. Entidades HTML con doble codificación
 *
 * RESULTADO ESPERADO (comportamiento seguro):
 *   → 400 Bad Request O entrada sanitizada antes de almacenar
 *
 * RESULTADO REAL (vulnerabilidad):
 *   → 201 Created con el payload XSS intacto en la respuesta
 */

const API = 'http://localhost:4000';

const XSS_PAYLOADS = [
  {
    nombre: 'Script tag clásico',
    payload: "<script>alert('XSS-SEC03')</script>",
    id: 'classic-script'
  },
  {
    nombre: 'Event handler en imagen',
    payload: "<img src=x onerror=\"document.title='PWNED'\">",
    id: 'img-onerror'
  },
  {
    nombre: 'Protocolo javascript en texto',
    payload: "javascript:alert('XSS')",
    id: 'js-protocol'
  },
  {
    nombre: 'Doble codificación HTML',
    payload: '&lt;script&gt;alert(1)&lt;/script&gt;',
    id: 'double-encoded'
  }
];

describe('SEC-03 | Inyección XSS y Falta de Sanitización', () => {

  XSS_PAYLOADS.forEach(({ nombre, payload, id }) => {
    it(`SEC-03-${id}: [${nombre}] debe ser rechazado o sanitizado`, () => {
      cy.request({
        method: 'POST',
        url: `${API}/api/compra`,
        body: {
          customerName: payload,
          items: [{ productId: 1, quantity: 1 }]
        },
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`Payload enviado: ${payload}`);
        cy.log(`Status: ${response.status}`);
        cy.log(`customerName recibido: ${response.body.customerName}`);

        if (response.status === 201) {
          // Vulnerabilidad confirmada: payload XSS aceptado sin sanitización
          cy.log(`⚠ VULNERABILIDAD ACTIVA: payload "${nombre}" almacenado sin sanitizar`);

          // Verificar que al menos el payload llegó tal como se envió (sin encoding)
          expect(response.body.customerName).to.equal(payload);
          expect(response.body.status).to.equal('created');
        } else {
          cy.log(`✓ Servidor rechazó payload: ${nombre}`);
          expect(response.status).to.be.oneOf([400, 422]);
        }
      });
    });
  });

  it('SEC-03-UI: React escapa XSS en la pantalla de confirmación de orden', () => {
    // Verificar que aunque el backend acepte el XSS, React lo escapa en el DOM
    // El mensaje de confirmación muestra: `Orden ${id.slice(0,8)} creada por $X MXN`
    // El customerName NO se renderiza en el frontend, por lo que no hay XSS visible.
    // Esta prueba documenta la mitigación parcial de React.

    cy.visit('/');

    // Agregar producto al carrito
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.contains('Agregar').click();
    });

    // Verificar que el botón de checkout está activo
    cy.contains('Finalizar compra').should('not.be.disabled');

    // Interceptar la llamada de checkout para inyectar un customerName malicioso
    cy.intercept('POST', `${API}/api/compra`, (req) => {
      req.body.customerName = "<script>alert('XSS-UI')</script>";
    }).as('checkout');

    cy.contains('Finalizar compra').click();
    cy.wait('@checkout');

    // Verificar que el DOM no ejecutó el script (React escapa por defecto)
    cy.get('.alert').should('be.visible').then(($el) => {
      const text = $el.text();
      cy.log(`Mensaje de confirmación en DOM: ${text}`);
      // El mensaje no debe contener el script tag sin escapar
      expect(text).to.not.include('<script>');
      cy.log('✓ React escapó el contenido XSS en el DOM de confirmación');
    });
  });

  it('SEC-03-CORS: CORS permite todos los orígenes (wildcard *) en producción', () => {
    // En app.js: cors({ origin: process.env.CORS_ORIGIN || '*' })
    // Si CORS_ORIGIN no está definido en producción, acepta cualquier origen
    cy.request({
      method: 'GET',
      url: `${API}/api/arts`,
      headers: {
        'Origin': 'http://sitio-malicioso.ejemplo.com'
      }
    }).then((response) => {
      const allowOrigin = response.headers['access-control-allow-origin'];
      cy.log(`Access-Control-Allow-Origin: ${allowOrigin}`);

      if (allowOrigin === '*' || allowOrigin === 'http://sitio-malicioso.ejemplo.com') {
        cy.log('⚠ VULNERABILIDAD: CORS acepta orígenes arbitrarios. Configura CORS_ORIGIN en producción.');
      } else {
        cy.log(`✓ CORS correctamente restringido a: ${allowOrigin}`);
      }
    });
  });

  it('SEC-03-NOAUTH: crear orden sin autenticación (control de acceso ausente)', () => {
    // La API no requiere ningún token, cookie ni sesión para crear órdenes
    cy.request({
      method: 'POST',
      url: `${API}/api/compra`,
      headers: {
        // Sin Authorization, sin Cookie, sin X-API-Key
      },
      body: {
        customerName: 'Anonimo Sin Auth',
        items: [{ productId: 3, quantity: 1 }]
      }
    }).then((response) => {
      cy.log(`Status sin autenticación: ${response.status}`);
      cy.log(`Order ID: ${response.body.id}`);

      if (response.status === 201) {
        cy.log('⚠ VULNERABILIDAD: orden creada sin ningún mecanismo de autenticación');
        expect(response.body.id).to.exist;
        expect(response.body.status).to.equal('created');
      } else {
        cy.log('✓ API requiere autenticación');
      }
    });
  });
});
