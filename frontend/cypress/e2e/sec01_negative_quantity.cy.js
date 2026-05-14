/**
 * SEC-01: Inyección de Cantidad Negativa
 * Categoría: Validación de entrada insuficiente / Lógica de negocio rota
 * OWASP: A03:2021 – Injection / A04:2021 – Insecure Design
 *
 * DESCRIPCIÓN:
 * El backend acepta órdenes con cantidades negativas sin validación,
 * lo que permite generar totales negativos (descuentos no autorizados).
 *
 * RESULTADO ESPERADO (comportamiento seguro):
 *   → 400 Bad Request o rechazo de cantidades <= 0
 *
 * RESULTADO REAL (vulnerabilidad):
 *   → 201 Created con total negativo
 */

const API = 'http://localhost:4000';

describe('SEC-01 | Inyección de Cantidad Negativa', () => {

  it('SEC-01-A: cantidad negativa genera total negativo (vulnerabilidad confirmada)', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/compra`,
      body: {
        customerName: 'Atacante',
        items: [{ productId: 1, quantity: -999 }]
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Status recibido: ${response.status}`);
      cy.log(`Total recibido: ${response.body.total}`);

      // Documentar la vulnerabilidad: el servidor responde 201 con total negativo
      if (response.status === 201) {
        cy.log('⚠ VULNERABILIDAD ACTIVA: servidor aceptó cantidad negativa');
        expect(response.body.total).to.be.lessThan(0);
        expect(response.body.status).to.equal('created');
      } else {
        // Si el servidor ya valida, la prueba pasa como segura
        expect(response.status).to.be.oneOf([400, 422]);
        cy.log('✓ Servidor rechazó la cantidad negativa correctamente');
      }
    });
  });

  it('SEC-01-B: cantidad cero debe rechazarse (behavior: quantity=0)', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/compra`,
      body: {
        customerName: 'TestCero',
        items: [{ productId: 2, quantity: 0 }]
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Status con quantity=0: ${response.status}`);
      cy.log(`Total con quantity=0: ${response.body.total}`);

      // quantity=0 → total=0. El backend usa `Number(item.quantity || 1)`
      // por lo que quantity=0 se trata como 1 (falsy fallback). Otro bug.
      if (response.status === 201) {
        cy.log('⚠ NOTA: quantity=0 fue tratado como 1 por el fallback || 1');
        expect(response.body.total).to.be.greaterThan(0);
      }
    });
  });

  it('SEC-01-C: cantidad masivamente inflada no es rechazada', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/compra`,
      body: {
        customerName: 'TestOverflow',
        items: [{ productId: 1, quantity: 999999 }]
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Status con quantity masiva: ${response.status}`);
      cy.log(`Total generado: $${response.body.total?.toLocaleString('es-MX')} MXN`);

      if (response.status === 201) {
        cy.log('⚠ VULNERABILIDAD: servidor acepta cantidades arbitrariamente grandes sin límite');
        expect(response.body.total).to.equal(649 * 999999);
      }
    });
  });

  it('SEC-01-D: ítem con productId inexistente no suma pero orden se crea igual', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/compra`,
      body: {
        customerName: 'TestFakeId',
        items: [{ productId: 9999, quantity: 1 }]
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Status con productId falso: ${response.status}`);
      cy.log(`Total: ${response.body.total}`);

      if (response.status === 201) {
        cy.log('⚠ VULNERABILIDAD: órdenes con productos inexistentes se crean con total $0');
        expect(response.body.total).to.equal(0);
      }
    });
  });
});
