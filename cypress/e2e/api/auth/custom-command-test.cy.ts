/// <reference types="cypress" />

describe('Custom Command Test', () => {
  it('should use apiRequest command', () => {
    cy.apiRequest({
      method: 'GET',
      url: 'http://localhost:5000/health',
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('status', 'OK');
    });
  });
  
  it('should use validateStatusCode command', () => {
    cy.apiRequest({
      method: 'GET', 
      url: 'http://localhost:5000/health',
    }).then((response) => {
      cy.validateStatusCode(response, 200);
    });
  });
});