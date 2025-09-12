/// <reference types="cypress" />

describe('Simple API Test', () => {
  it('should connect to the API health endpoint', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:5000/health',
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('status', 'OK');
    });
  });
});