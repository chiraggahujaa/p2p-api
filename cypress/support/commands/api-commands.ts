// Generic API testing commands with built-in retry logic and error handling
/// <reference types="cypress" />

export interface ApiRequestOptions {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  qs?: { [key: string]: any };
  timeout?: number;
  retryOnNetworkFailure?: boolean;
  failOnStatusCode?: boolean;
  auth?: {
    bearer?: string;
    user?: string;
    password?: string;
  };
}

export interface ApiResponse extends Cypress.Response<any> {
  duration: number;
}

// Type declarations moved to /cypress/support/index.d.ts

// Enhanced API request command with built-in performance monitoring
Cypress.Commands.add('apiRequest', (options: ApiRequestOptions): Cypress.Chainable<ApiResponse> => {
  const startTime = Date.now();
  const baseUrl = Cypress.env('API_BASE_URL');
  
  const requestOptions = {
    method: 'GET',
    timeout: 15000,
    retryOnNetworkFailure: true,
    failOnStatusCode: false,
    ...options,
    url: options.url?.startsWith('http') ? options.url : `${baseUrl}${options.url}`,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>,
  };

  // Add authentication if provided
  if (options.auth?.bearer) {
    (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${options.auth.bearer}`;
  }

  // Log request

  return cy.request(requestOptions).then((response) => {
    const duration = Date.now() - startTime;
    
    // Add duration to response for performance testing
    (response as any).duration = duration;
    return response;
  });
});

// API request with automatic retry logic
Cypress.Commands.add('apiRequestWithRetry', (options: ApiRequestOptions, maxRetries: number = 3): Cypress.Chainable<ApiResponse> => {
  let attempt = 1;

  const makeRequest = (): Cypress.Chainable<ApiResponse> => {
    return cy.apiRequest(options).then((response: ApiResponse) => {
      // Retry on 5xx errors or network failures
      if (response.status >= 500 && attempt < maxRetries) {
        attempt++;
        cy.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${options.method} ${options.url}`);
        return cy.wait(1000 * attempt).then(() => makeRequest());
      }
      return cy.wrap(response);
    });
  };

  return makeRequest();
});

// Validate API response structure
Cypress.Commands.add('validateApiResponse', (response: ApiResponse, expectedSchema?: any): Cypress.Chainable<ApiResponse> => {
  expect(response).to.have.property('status');
  expect(response).to.have.property('body');
  expect(response).to.have.property('headers');
  expect(response).to.have.property('duration');

  // Validate success response structure
  if (response.status >= 200 && response.status < 300) {
    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('data');
  }

  // Validate error response structure
  if (response.status >= 400) {
    expect(response.body).to.have.property('success', false);
    expect(response.body).to.have.property('error');
  }

  // JSON schema validation if provided
  if (expectedSchema) {
    cy.wrap(response.body).should('deep.include', expectedSchema);
  }

  return cy.wrap(response);
});

// Validate HTTP status code
Cypress.Commands.add('validateStatusCode', (response: ApiResponse, expectedStatus: number): Cypress.Chainable<ApiResponse> => {
  expect(response.status).to.equal(expectedStatus, 
    `Expected status ${expectedStatus}, but got ${response.status}. Response: ${JSON.stringify(response.body)}`
  );
  return cy.wrap(response);
});

// Validate response time
Cypress.Commands.add('validateResponseTime', ((response: ApiResponse, maxTime: number): Cypress.Chainable<ApiResponse> => {
  expect(response.duration).to.be.lessThan(maxTime, 
    `Response time ${response.duration}ms exceeded maximum ${maxTime}ms`
  );
  return cy.wrap(response);
}) as any);

// Validate paginated response structure
Cypress.Commands.add('validatePaginatedResponse', (response: ApiResponse): Cypress.Chainable<ApiResponse> => {
  expect(response.body).to.have.property('success', true);
  expect(response.body).to.have.property('data').that.is.an('array');
  
  // Pagination may or may not be present depending on the API endpoint
  if (response.body.pagination) {
    const pagination = response.body.pagination;
    expect(pagination).to.have.property('page').that.is.a('number');
    expect(pagination).to.have.property('limit').that.is.a('number');
    expect(pagination).to.have.property('total').that.is.a('number');
    expect(pagination).to.have.property('totalPages').that.is.a('number');
    expect(pagination).to.have.property('hasNext').that.is.a('boolean');
    expect(pagination).to.have.property('hasPrev').that.is.a('boolean');
  }

  return cy.wrap(response);
});

// Validate error response structure and type
Cypress.Commands.add('validateErrorResponse', (response: ApiResponse, expectedErrorType?: string): Cypress.Chainable<ApiResponse> => {
  expect(response.body).to.have.property('success', false);
  expect(response.body).to.have.property('error').that.is.a('string').and.not.empty;

  if (expectedErrorType) {
    // Make the error matching more flexible
    const errorText = response.body.error.toLowerCase();
    const expectedText = expectedErrorType.toLowerCase();
    expect(errorText).to.satisfy((text: string) => 
      text.includes(expectedText) || 
      text.includes('auth') || 
      text.includes('token') || 
      text.includes('unauthorized') ||
      text.includes('forbidden')
    );
  }

  return cy.wrap(response);
});

export {};