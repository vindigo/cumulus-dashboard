describe('Dashboard Tests', () => {
  it('When not logged in it should redirect to login page', () => {
    cy.visit('/');
    cy.url().should('include', '/#/auth');
    cy.get('div[class=modal__internal]').within(() => {
      cy.get('a').should('have.attr', 'href').and('include', 'token?');
      cy.get('a').should('have.text', 'Login with Earthdata Login');
    });
  });

  it('Logging in successfully redirects to the Dashboard main page', () => {
    cy.get('div[class=modal__internal]').within(() => {
      cy.get('a').click();
    });

    cy.get('h1[class=heading--xlarge').should('have.text', 'CUMULUS Dashboard');
    cy.get('li[class=nav__order-0]').within(() => {
      cy.get('a').should('have.attr', 'href').and('include', '/collections');
    });
    cy.contains('Rules').should('have.attr', 'href').and('include', '/rules');
  });

  it('Logging out successfully redirects to the login screen', () => {
    cy.get('h1[class=heading--xlarge').should('have.text', 'CUMULUS Dashboard');

    cy.get('nav li').last().within(() => {
      cy.get('a').should('have.text', 'Log out');
    });
    cy.get('nav li').last().click();
    cy.url().should('include', '/#/auth');

    cy.url().should('not.include', '/#/collections');
    cy.url().should('include', '/#/auth');
  });
});
