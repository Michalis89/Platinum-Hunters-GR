describe('Homepage Test', () => {
  it('should load homepage', () => {
    cy.visit('/');
    cy.contains('Platinum Hunters GR').should('exist');
  });
});
