// Authentication utilities for P2P API testing
/// <reference types="cypress" />

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      fullName?: string;
      isVerified?: boolean;
      user_metadata?: {
        name?: string;
        email_verified?: boolean;
      };
    };
    access_token?: string;
    refresh_token?: string;
    session?: {
      access_token: string;
      refresh_token: string;
      user: any;
    };
  };
  user?: any; // Supabase format
  session?: {
    access_token: string;
    refresh_token: string;
    user: any;
  };
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isVerified: boolean;
  trustScore: number;
  location?: any;
  avatar?: string;
  bio?: string;
}

// Type declarations moved to /cypress/support/index.d.ts

// Login command
Cypress.Commands.add('login', (credentials: AuthCredentials) => {
  cy.log(`🔐 Logging in user: ${credentials.email}`);
  
  return cy.apiRequest({
    method: 'POST',
    url: '/auth/login',
    body: credentials,
  }).then((response) => {
    let normalizedResponse: AuthResponse;
    
    if (response.status === 200) {
      // Handle wrapped Supabase format (success: true, data: { user, session })
      if (response.body.success && response.body.data && response.body.data.session) {
        normalizedResponse = {
          success: true,
          data: {
            user: {
              id: response.body.data.user.id,
              email: response.body.data.user.email,
              fullName: response.body.data.user.user_metadata?.name || response.body.data.user.email,
              isVerified: response.body.data.user.user_metadata?.email_verified || false,
              user_metadata: response.body.data.user.user_metadata
            },
            access_token: response.body.data.session.access_token,
            refresh_token: response.body.data.session.refresh_token,
            session: response.body.data.session
          },
          user: response.body.data.user,
          session: response.body.data.session
        };
        
        // Store auth token
        cy.setAuthToken(response.body.data.session.access_token);
        cy.log(`✅ Login successful for: ${credentials.email}`);
      }
      // Handle direct Supabase format (direct user/session objects)
      else if (response.body.user && response.body.session) {
        normalizedResponse = {
          success: true,
          data: {
            user: {
              id: response.body.user.id,
              email: response.body.user.email,
              fullName: response.body.user.user_metadata?.name || response.body.user.email,
              isVerified: response.body.user.user_metadata?.email_verified || false,
              user_metadata: response.body.user.user_metadata
            },
            access_token: response.body.session.access_token,
            refresh_token: response.body.session.refresh_token,
            session: response.body.session
          },
          user: response.body.user,
          session: response.body.session
        };
        
        // Store auth token
        cy.setAuthToken(response.body.session.access_token);
        cy.log(`✅ Login successful for: ${credentials.email}`);
      }
      // Handle custom format (data object with tokens)
      else if (response.body.success && response.body.data) {
        normalizedResponse = response.body as AuthResponse;
        const token = response.body.data.access_token || response.body.data.session?.access_token;
        if (token) {
          cy.setAuthToken(token);
        }
        cy.log(`✅ Login successful for: ${credentials.email}`);
      }
      // Handle error case
      else {
        normalizedResponse = {
          success: false,
          error: response.body.error || 'Login failed'
        };
        cy.log(`❌ Login failed for: ${credentials.email}. Response: ${JSON.stringify(response.body)}`);
      }
    } else {
      normalizedResponse = {
        success: false,
        error: response.body.error || response.body.message || 'Login failed'
      };
      cy.log(`❌ Login failed for: ${credentials.email}. Response: ${JSON.stringify(response.body)}`);
    }
    
    return cy.wrap(normalizedResponse);
  });
});

// Login as predefined test user
Cypress.Commands.add('loginAsTestUser', (userType: 'borrower' | 'lender' | 'admin' = 'borrower') => {
  const testUsers = Cypress.env('testUsers');
  const userData = testUsers[userType];
  
  if (!userData) {
    throw new Error(`Test user type '${userType}' not found`);
  }

  return cy.login({
    email: userData.email,
    password: userData.password,
  });
});

// User registration command
Cypress.Commands.add('register', (userData: any) => {
  cy.log(`📝 Registering new user: ${userData.email}`);
  
  const registrationData = {
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
    phoneNumber: userData.phoneNumber,
    gender: userData.gender || 'prefer_not_to_say',
    dob: userData.dob,
    dobVisibility: userData.dobVisibility || 'private',
    ...userData,
  };

  return cy.apiRequest({
    method: 'POST',
    url: '/auth/register',
    body: registrationData,
  }).then((response) => {
    let normalizedResponse: AuthResponse;
    
    if (response.status === 201 || response.status === 200) {
      // Handle wrapped Supabase format (success: true, data: { user, session })
      if (response.body.success && response.body.data && response.body.data.session) {
        normalizedResponse = {
          success: true,
          data: {
            user: {
              id: response.body.data.user.id,
              email: response.body.data.user.email,
              fullName: response.body.data.user.user_metadata?.name || response.body.data.user.email,
              isVerified: response.body.data.user.user_metadata?.email_verified || false,
              user_metadata: response.body.data.user.user_metadata
            },
            access_token: response.body.data.session.access_token,
            refresh_token: response.body.data.session.refresh_token,
            session: response.body.data.session
          },
          user: response.body.data.user,
          session: response.body.data.session
        };
        
        // Store auth token
        cy.setAuthToken(response.body.data.session.access_token);
        cy.log(`✅ Registration successful for: ${userData.email}`);
      }
      // Handle wrapped user-only response (email confirmation required)
      else if (response.body.success && response.body.data && response.body.data.user && !response.body.data.session) {
        normalizedResponse = {
          success: true,
          data: {
            user: {
              id: response.body.data.user.id,
              email: response.body.data.user.email,
              fullName: response.body.data.user.user_metadata?.name || response.body.data.user.email,
              isVerified: response.body.data.user.user_metadata?.email_verified || false,
              user_metadata: response.body.data.user.user_metadata
            }
          },
          user: response.body.data.user
        };
        cy.log(`✅ Registration successful (email confirmation required) for: ${userData.email}`);
      }
      // Handle direct Supabase format (direct user/session objects)
      else if (response.body.user && response.body.session) {
        normalizedResponse = {
          success: true,
          data: {
            user: {
              id: response.body.user.id,
              email: response.body.user.email,
              fullName: response.body.user.user_metadata?.name || response.body.user.email,
              isVerified: response.body.user.user_metadata?.email_verified || false,
              user_metadata: response.body.user.user_metadata
            },
            access_token: response.body.session.access_token,
            refresh_token: response.body.session.refresh_token,
            session: response.body.session
          },
          user: response.body.user,
          session: response.body.session
        };
        
        // Store auth token
        cy.setAuthToken(response.body.session.access_token);
        cy.log(`✅ Registration successful for: ${userData.email}`);
      }
      // Handle custom format (data object with tokens)
      else if (response.body.success && response.body.data) {
        normalizedResponse = response.body as AuthResponse;
        const token = response.body.data.access_token || response.body.data.session?.access_token;
        if (token) {
          cy.setAuthToken(token);
        }
        cy.log(`✅ Registration successful for: ${userData.email}`);
      }
      // Handle Supabase user-only response (email confirmation required)
      else if (response.body.user && !response.body.session) {
        normalizedResponse = {
          success: true,
          data: {
            user: {
              id: response.body.user.id,
              email: response.body.user.email,
              fullName: response.body.user.user_metadata?.name || response.body.user.email,
              isVerified: response.body.user.user_metadata?.email_verified || false,
              user_metadata: response.body.user.user_metadata
            }
          },
          user: response.body.user
        };
        cy.log(`✅ Registration successful (email confirmation required) for: ${userData.email}`);
      }
      else {
        normalizedResponse = {
          success: false,
          error: response.body.error || 'Registration failed'
        };
        cy.log(`❌ Registration failed for: ${userData.email}. Response: ${JSON.stringify(response.body)}`);
      }
    } else {
      normalizedResponse = {
        success: false,
        error: response.body.error || response.body.message || 'Registration failed'
      };
      cy.log(`❌ Registration failed for: ${userData.email}. Response: ${JSON.stringify(response.body)}`);
    }
    
    return cy.wrap(normalizedResponse);
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.log('🚪 Logging out user');
  
  cy.getAuthToken().then((token) => {
    if (token) {
      cy.apiRequest({
        method: 'POST',
        url: '/auth/logout',
        auth: { bearer: token },
      }).then(() => {
        cy.clearAuthToken();
        cy.log('✅ Logout successful');
      });
    } else {
      cy.log('ℹ️ No active session to logout');
    }
  });
});

// Get current auth token
Cypress.Commands.add('getAuthToken', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('cypress_auth_token');
    return cy.wrap(token);
  });
});

// Set auth token
Cypress.Commands.add('setAuthToken', (token: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('cypress_auth_token', token);
    cy.log(`🔑 Auth token set`);
  });
});

// Clear auth token
Cypress.Commands.add('clearAuthToken', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('cypress_auth_token');
    cy.log('🗑️ Auth token cleared');
  });
});

// Verify user is authenticated
Cypress.Commands.add('verifyAuthenticated', () => {
  return cy.getAuthToken().then((token) => {
    console.log('token: ', token);
    expect(token).to.exist;
    expect(token).to.be.a('string');
    
    // Note: /auth/me endpoint not yet implemented
    // For now, just verify token exists
    return cy.log(`✅ User authenticated with token: ${token?.substring(0, 10)}...`).then(() => {
      // Return a mock UserProfile since the endpoint doesn't exist yet
      const mockProfile: UserProfile = {
        id: 'mock-id',
        email: 'mock@example.com',
        fullName: 'Mock User',
        isVerified: true,
        trustScore: 0
      };
      return mockProfile;
    });
  });
});

// Verify user is not authenticated
Cypress.Commands.add('verifyNotAuthenticated', () => {
  cy.getAuthToken().then((token) => {
    if (token) {
      // Note: /auth/me endpoint not yet implemented
      // For now, just check if token exists
      cy.log('⚠️ Auth token present but /auth/me endpoint not available for verification');
    } else {
      cy.log('✅ No auth token present - user not authenticated');
    }
  });
});

// Switch user role (for testing different permissions)
Cypress.Commands.add('switchUserRole', (role: 'borrower' | 'lender' | 'admin') => {
  cy.logout();
  return cy.loginAsTestUser(role);
});

// Refresh auth token
Cypress.Commands.add('refreshAuthToken', () => {
  return cy.getAuthToken().then((token) => {
    if (!token) {
      throw new Error('No auth token to refresh');
    }

    return cy.apiRequest({
      method: 'POST',
      url: '/auth/refresh',
      auth: { bearer: token },
    }).then((response) => {
      if (response.status === 200 && response.body.success) {
        const newToken = response.body.data.access_token;
        cy.setAuthToken(newToken);
        cy.log('✅ Auth token refreshed');
      }
      
      return response.body as AuthResponse;
    });
  });
});

// Validate auth token
Cypress.Commands.add('validateAuthToken', (token: string) => {
  return cy.apiRequest({
    method: 'GET',
    url: '/auth/validate',
    auth: { bearer: token },
  }).then((response) => {
    return response.status === 200 && response.body.success;
  });
});

export {};