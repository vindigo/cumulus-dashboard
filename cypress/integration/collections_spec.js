import { shouldBeRedirectedToLogin } from '../support/assertions';

describe('Dashboard Collections Page', () => {
  describe('When not logged in', () => {
    it('should redirect to login page', () => {
      cy.visit('/#/collections');
      shouldBeRedirectedToLogin();
    });
  });

  describe('When logged in', () => {
    beforeEach(() => {
      cy.login();
      cy.task('resetState');
    });

    after(() => {
      cy.task('resetState');
    });

    it('displays a link to view collections', () => {
      cy.visit('/');

      cy.contains('nav li a', 'Collections').as('collections');
      cy.get('@collections').should('have.attr', 'href', '#/collections');
      cy.get('@collections').click();

      cy.url().should('include', 'collections');
      cy.contains('.heading--xlarge', 'Collections');

      cy.get('table tbody tr').its('length').should('be.eq', 5);
    });

    it('collections page displays a button to add a new collection', () => {
      const name = 'TESTCOLLECTION';
      const version = '006';

      cy.visit('/#/collections');

      cy.contains('.heading--large', 'Collection Overview');
      cy.contains('a', 'Add a Collection').as('addCollection');
      cy.get('@addCollection').should('have.attr', 'href', '#/collections/add');
      cy.get('@addCollection').click();

      // fill the form and submit
      const duplicateHandling = 'error';
      const collection = {
        name: 'TESTCOLLECTION',
        version: '006',
        dataType: 'TESTCOLLECTION',
        duplicateHandling
      };
      cy.editJsonTextarea({ data: collection });
      cy.get('form').get('input').contains('Submit').click();

      // displays the new collection
      cy.contains('.heading--xlarge', 'Collections');
      cy.contains('.heading--large', `${name} / ${version}`);
      cy.url().should('include', `#/collections/collection/${name}/${version}`);

      // verify the collection's properties by looking at the Edit page
      cy.contains('a', 'Edit').click();
      cy.get('form .ace_content')
        .within(() => {
          cy.contains(`"name": "${name}"`);
          cy.contains(`"version": "${version}"`);
          cy.contains(`"dataType": "${name}"`);
          cy.contains(`"duplicateHandling": "${duplicateHandling}"`);
        });

      // verify the new collection is added to the collections list
      cy.contains('a', 'Back to Collections').click();
      cy.contains('table tbody tr a', name)
        .should('have.attr', 'href', `#/collections/collection/${name}/${version}`);
    });

    it('collection page has button to edit the collection', () => {
      const name = 'MOD09GQ';
      const version = '006';

      cy.visit(`/#/collections/collection/${name}/${version}`);
      cy.contains('a', 'Edit').as('editCollection');
      cy.get('@editCollection')
        .should('have.attr', 'href')
        .and('include', `#/collections/edit/${name}/${version}`);
      cy.get('@editCollection').click();

      cy.contains('.heading--large', `Edit ${name}___${version}`);

      // update collection and submit
      const meta = 'metadata';
      cy.editJsonTextarea({ data: { meta }, update: true });
      cy.contains('form input', 'Submit').click();

      // displays the updated collection and its granules
      cy.contains('.heading--xlarge', 'Collections');
      cy.contains('.heading--large', `${name} / ${version}`);

      // verify the collection is updated by looking at the Edit page
      cy.contains('a', 'Edit').click();
      cy.contains('form .ace_content', meta);
      cy.contains('.heading--large', `Edit ${name}___${version}`);
    });

    it('collection page has button to delete the collection', () => {
      const name = 'MOD09GQ';
      const version = '006';

      cy.visit(`/#/collections/collection/${name}/${version}`);

      // delete collection
      cy.contains('button', 'Delete').click();
      cy.contains('button', 'Confirm').click();

      // verify the collection is now gone
      cy.url().should('include', 'collections');
      cy.contains('.heading--xlarge', 'Collections');
      cy.contains('table tbody tr a', name).should('not.exist');
    });
  });
});