describe('Carrito universitario', () => {
  it('muestra articulos, detecta el hallazgo simulado y actualiza el carrito', () => {
    cy.request('http://localhost:4000/api/seg').then(({ body }) => {
      expect(body.simulated).to.equal(true);
      expect(body.status).to.equal('warning');
      expect(body.severity).to.equal('medium');
      expect(body.finding).to.include('simulada');
    });

    cy.visit('/');
    cy.contains('Pruebas automaticas');
    cy.contains('Articulos universitarios');
    cy.get('[data-testid="product-card"]').should('have.length.at.least', 4);
    cy.contains('Sin productos agregados.');

    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.contains('Sudadera institucional');
      cy.contains('Agregar').click();
      cy.contains('Agregar').click();
    });

    cy.contains('Sudadera institucional').should('be.visible');
    cy.contains('2').should('exist');
    cy.contains('Total:').should('contain', '$1,298');
  });

  it('falla de forma intencional para evidenciar el control de seguridad', () => {
    cy.request('http://localhost:4000/api/seg').then(({ body }) => {
      expect(body.severity).to.equal('medium');
    });
  });
});
