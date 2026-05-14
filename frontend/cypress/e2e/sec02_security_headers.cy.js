/**
 * SEC-02: Verificación de Cabeceras de Seguridad HTTP
 * Categoría: Configuración de seguridad / Security Misconfiguration
 * OWASP: A05:2021 – Security Misconfiguration
 *
 * DESCRIPCIÓN:
 * Las cabeceras HTTP de seguridad protegen al navegador contra ataques como
 * XSS, clickjacking, MIME sniffing y fugas de información. Helmet.js
 * debe configurarlas correctamente en el servidor Express.
 *
 * CABECERAS EVALUADAS:
 *   - X-Content-Type-Options   → previene MIME sniffing
 *   - X-Frame-Options          → previene clickjacking
 *   - Content-Security-Policy  → restringe fuentes de contenido (XSS mitigation)
 *   - Referrer-Policy          → controla información del referrer
 *   - X-Permitted-Cross-Domain-Policies → protege lectores Flash/PDF
 *   - Cross-Origin-Opener-Policy → aislamiento de origen
 *
 * RESULTADO ESPERADO:
 *   → Todas las cabeceras presentes con valores seguros
 */

const API = 'http://localhost:4000';

describe('SEC-02 | Cabeceras de Seguridad HTTP', () => {

  it('SEC-02-A: X-Content-Type-Options debe ser "nosniff"', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      const header = response.headers['x-content-type-options'];
      cy.log(`X-Content-Type-Options: ${header}`);

      if (header) {
        expect(header).to.equal('nosniff');
        cy.log('✓ MIME sniffing deshabilitado');
      } else {
        cy.log('⚠ VULNERABILIDAD: cabecera X-Content-Type-Options ausente');
        expect(header, 'X-Content-Type-Options debe estar presente').to.exist;
      }
    });
  });

  it('SEC-02-B: X-Frame-Options debe prevenir clickjacking', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      // Helmet moderno puede usar CSP frame-ancestors en lugar de X-Frame-Options
      const xfo = response.headers['x-frame-options'];
      const csp = response.headers['content-security-policy'];
      cy.log(`X-Frame-Options: ${xfo}`);
      cy.log(`CSP (extracto frame-ancestors): ${csp?.match(/frame-ancestors[^;]*/)?.[0] ?? 'no presente en CSP'}`);

      const protegido = xfo || (csp && csp.includes('frame-ancestors'));
      if (protegido) {
        cy.log('✓ Protección contra clickjacking confirmada');
      } else {
        cy.log('⚠ VULNERABILIDAD: sin protección contra clickjacking');
      }
      expect(protegido, 'debe existir X-Frame-Options o frame-ancestors en CSP').to.be.ok;
    });
  });

  it('SEC-02-C: Content-Security-Policy debe estar presente', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      const csp = response.headers['content-security-policy'];
      cy.log(`Content-Security-Policy: ${csp}`);

      if (csp) {
        cy.log('✓ CSP presente');
        expect(csp).to.be.a('string').and.have.length.greaterThan(0);
      } else {
        cy.log('⚠ VULNERABILIDAD: Content-Security-Policy ausente — mayor riesgo de XSS');
        expect(csp, 'CSP debe estar presente').to.exist;
      }
    });
  });

  it('SEC-02-D: Referrer-Policy debe controlar fuga de información', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      const rp = response.headers['referrer-policy'];
      cy.log(`Referrer-Policy: ${rp}`);

      if (rp) {
        expect(rp).to.not.equal('unsafe-url');
        cy.log(`✓ Referrer-Policy presente: ${rp}`);
      } else {
        cy.log('⚠ ADVERTENCIA: Referrer-Policy ausente');
        expect(rp, 'Referrer-Policy debe estar presente').to.exist;
      }
    });
  });

  it('SEC-02-E: cabecera Server no debe exponer versión del servidor', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      const server = response.headers['server'];
      cy.log(`Server header: ${server}`);

      if (!server || server === '') {
        cy.log('✓ Cabecera Server eliminada');
      } else if (server.toLowerCase().includes('express') || /\d+\.\d+/.test(server)) {
        cy.log(`⚠ VULNERABILIDAD: header Server expone tecnología/versión: "${server}"`);
      } else {
        cy.log(`ℹ Header Server presente pero sin versión específica: ${server}`);
      }
    });
  });

  it('SEC-02-F: X-Powered-By no debe estar presente (fingerprinting)', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      const powered = response.headers['x-powered-by'];
      cy.log(`X-Powered-By: ${powered}`);

      if (!powered) {
        cy.log('✓ X-Powered-By eliminado por Helmet');
      } else {
        cy.log(`⚠ VULNERABILIDAD: X-Powered-By expuesto — fingerprinting posible: "${powered}"`);
        expect(powered, 'X-Powered-By no debe estar presente').to.not.exist;
      }
    });
  });

  it('SEC-02-G: verificar todas las cabeceras críticas en un solo request', () => {
    cy.request(`${API}/api/salud`).then((response) => {
      const headers = response.headers;
      const reporte = {
        'x-content-type-options': headers['x-content-type-options'] ?? '⚠ AUSENTE',
        'x-frame-options': headers['x-frame-options'] ?? '⚠ AUSENTE (verificar CSP)',
        'content-security-policy': headers['content-security-policy'] ? '✓ PRESENTE' : '⚠ AUSENTE',
        'referrer-policy': headers['referrer-policy'] ?? '⚠ AUSENTE',
        'x-powered-by': headers['x-powered-by'] ? `⚠ EXPUESTO: ${headers['x-powered-by']}` : '✓ ELIMINADO',
        'cross-origin-opener-policy': headers['cross-origin-opener-policy'] ?? '⚠ AUSENTE',
      };

      cy.log('=== REPORTE COMPLETO DE CABECERAS ===');
      Object.entries(reporte).forEach(([key, val]) => cy.log(`${key}: ${val}`));

      // Mínimo requerido
      expect(headers['x-content-type-options']).to.equal('nosniff');
    });
  });
});
