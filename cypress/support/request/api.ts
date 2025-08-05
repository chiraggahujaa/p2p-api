// Centralized API request handler for all tests
/// <reference types="cypress" />

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types for authentication
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface UserSession {
  user: any;
  tokens: AuthTokens;
}

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: any;
  headers?: Record<string, string>;
  qs?: Record<string, any>;
  timeout?: number;
  failOnStatusCode?: boolean;
  auth?: boolean;
  retryOnNetworkFailure?: boolean;
}

export class ApiClient {
  private static baseUrl: string = Cypress.env('API_BASE_URL') || 'http://localhost:5000/api';
  private static defaultTimeout: number = 15000;
  private static authToken: string | null = null;

  /**
   * Set authentication token for subsequent requests
   */
  static setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  static clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Get current auth token
   */
  static getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Make HTTP request with standardized configuration
   */
  static request<T = any>(config: RequestConfig): Cypress.Chainable<Cypress.Response<ApiResponse<T>>> {
    const {
      method = 'GET',
      url,
      body,
      headers = {},
      qs,
      timeout = this.defaultTimeout,
      failOnStatusCode = false,
      auth = false,
      retryOnNetworkFailure = true
    } = config;

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    };

    // Add authentication header if required
    if (auth && this.authToken) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Log request details
    cy.log(`API ${method} Request`, fullUrl);
    if (body) {
      cy.log('Request Body', JSON.stringify(body, null, 2));
    }

    // Make the request
    return cy.request({
      method,
      url: fullUrl,
      body,
      headers: requestHeaders,
      qs,
      timeout,
      failOnStatusCode,
      retryOnNetworkFailure
    });
  }

  /**
   * GET request helper
   */
  static get<T = any>(url: string, options: Omit<RequestConfig, 'method' | 'url'> = {}): Cypress.Chainable<Cypress.Response<ApiResponse<T>>> {
    return this.request<T>({ method: 'GET', url, ...options });
  }

  /**
   * POST request helper
   */
  static post<T = any>(url: string, body?: any, options: Omit<RequestConfig, 'method' | 'url' | 'body'> = {}): Cypress.Chainable<Cypress.Response<ApiResponse<T>>> {
    return this.request<T>({ method: 'POST', url, body, ...options });
  }

  /**
   * PUT request helper
   */
  static put<T = any>(url: string, body?: any, options: Omit<RequestConfig, 'method' | 'url' | 'body'> = {}): Cypress.Chainable<Cypress.Response<ApiResponse<T>>> {
    return this.request<T>({ method: 'PUT', url, body, ...options });
  }

  /**
   * DELETE request helper
   */
  static delete<T = any>(url: string, options: Omit<RequestConfig, 'method' | 'url'> = {}): Cypress.Chainable<Cypress.Response<ApiResponse<T>>> {
    return this.request<T>({ method: 'DELETE', url, ...options });
  }

  /**
   * PATCH request helper
   */
  static patch<T = any>(url: string, body?: any, options: Omit<RequestConfig, 'method' | 'url' | 'body'> = {}): Cypress.Chainable<Cypress.Response<ApiResponse<T>>> {
    return this.request<T>({ method: 'PATCH', url, body, ...options });
  }

  // ===== AUTHENTICATION ENDPOINTS =====

  /**
   * Login user and store authentication token
   */
  static login(email: string, password: string): Cypress.Chainable<UserSession> {
    return this.post('/auth/login', { email, password })
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('accessToken');
        
        const { accessToken, refreshToken } = response.body.data;
        this.setAuthToken(accessToken);
        
        return {
          user: response.body.data.user,
          tokens: { 
            accessToken, 
            ...(refreshToken && { refreshToken })
          }
        };
      });
  }

  /**
   * Register new user
   */
  static register(userData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/auth/register', userData);
  }

  /**
   * Logout current user
   */
  static logout(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/auth/logout', {}, { auth: true })
      .then((response) => {
        this.clearAuthToken();
        return response;
      });
  }

  /**
   * Get user profile (authenticated)
   */
  static getProfile(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/auth/profile', { auth: true });
  }

  /**
   * Refresh authentication token
   */
  static refreshToken(refreshToken: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/auth/refresh', { refreshToken })
      .then((response) => {
        if (response.body.success && response.body.data?.accessToken) {
          this.setAuthToken(response.body.data.accessToken);
        }
        return response;
      });
  }

  /**
   * Verify email
   */
  static verifyEmail(token: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/auth/verify', { token });
  }

  /**
   * Request password reset
   */
  static resetPassword(email: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/auth/reset-password', { email });
  }

  /**
   * Update password (authenticated)
   */
  static updatePassword(currentPassword: string, newPassword: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put('/auth/password', { currentPassword, newPassword }, { auth: true });
  }

  // ===== USER ENDPOINTS =====

  /**
   * Get all users
   */
  static getAllUsers(params?: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/all', { qs: params });
  }

  /**
   * Search users
   */
  static searchUsers(query: string, params?: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/search', { qs: { q: query, ...params } });
  }

  /**
   * Get user by ID
   */
  static getUserById(userId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/users/${userId}`);
  }

  /**
   * Get user's items
   */
  static getUserItems(userId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/users/${userId}/items`);
  }

  /**
   * Get current user's profile (authenticated)
   */
  static getMyProfile(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/me/profile', { auth: true });
  }

  /**
   * Update current user's profile (authenticated)
   */
  static updateMyProfile(profileData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put('/users/me/profile', profileData, { auth: true });
  }

  /**
   * Get current user's items (authenticated)
   */
  static getMyItems(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/me/items', { auth: true });
  }

  /**
   * Get current user's bookings (authenticated)
   */
  static getMyBookings(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/me/bookings', { auth: true });
  }

  /**
   * Get current user's favorites (authenticated)
   */
  static getMyFavorites(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/me/favorites', { auth: true });
  }

  /**
   * Get current user's stats (authenticated)
   */
  static getMyStats(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/users/me/stats', { auth: true });
  }

  /**
   * Deactivate current user's account (authenticated)
   */
  static deactivateAccount(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.delete('/users/me/account', { auth: true });
  }

  /**
   * Verify user (admin functionality)
   */
  static verifyUser(userId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/users/${userId}/verify`, {}, { auth: true });
  }

  // ===== ITEM ENDPOINTS =====

  /**
   * Get all items
   */
  static getAllItems(params?: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/items', { qs: params, auth: true });
  }

  /**
   * Search items
   */
  static searchItems(query: string, params?: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/items/search', { qs: { q: query, ...params } });
  }

  /**
   * Get popular items
   */
  static getPopularItems(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/items/popular');
  }

  /**
   * Get featured items
   */
  static getFeaturedItems(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/items/featured');
  }

  /**
   * Get item by ID
   */
  static getItemById(itemId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/items/${itemId}`);
  }

  /**
   * Get similar items
   */
  static getSimilarItems(itemId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/items/${itemId}/similar`);
  }

  /**
   * Check item availability
   */
  static checkItemAvailability(itemId: string, startDate?: string, endDate?: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return this.get(`/items/${itemId}/availability`, { qs: params });
  }

  /**
   * Create new item (authenticated)
   */
  static createItem(itemData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/items', itemData, { auth: true });
  }

  /**
   * Update item (authenticated)
   */
  static updateItem(itemId: string, itemData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/items/${itemId}`, itemData, { auth: true });
  }

  /**
   * Delete item (authenticated)
   */
  static deleteItem(itemId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.delete(`/items/${itemId}`, { auth: true });
  }

  /**
   * Add item to favorites (authenticated)
   */
  static addToFavorites(itemId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post(`/items/${itemId}/favorites`, {}, { auth: true });
  }

  /**
   * Remove item from favorites (authenticated)
   */
  static removeFromFavorites(itemId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.delete(`/items/${itemId}/favorites`, { auth: true });
  }

  /**
   * Get item analytics (authenticated)
   */
  static getItemAnalytics(itemId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/items/${itemId}/analytics`, { auth: true });
  }

  // ===== BOOKING ENDPOINTS =====

  /**
   * Create new booking (authenticated)
   */
  static createBooking(bookingData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/bookings', bookingData, { auth: true });
  }

  /**
   * Get all bookings (admin functionality)
   */
  static getAllBookings(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/bookings', { auth: true });
  }

  /**
   * Get current user's bookings (authenticated)
   */
  static getMyBookingsFromBookings(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/bookings/my', { auth: true });
  }

  /**
   * Get current user's booking stats (authenticated)
   */
  static getMyBookingStats(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/bookings/my/stats', { auth: true });
  }

  /**
   * Get booking by ID (authenticated)
   */
  static getBookingById(bookingId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/bookings/${bookingId}`, { auth: true });
  }

  /**
   * Update booking status (authenticated)
   */
  static updateBookingStatus(bookingId: string, status: string, notes?: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/bookings/${bookingId}/status`, { status, notes }, { auth: true });
  }

  /**
   * Confirm booking (authenticated)
   */
  static confirmBooking(bookingId: string, notes?: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/bookings/${bookingId}/confirm`, { notes }, { auth: true });
  }

  /**
   * Start booking (authenticated)
   */
  static startBooking(bookingId: string, notes?: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/bookings/${bookingId}/start`, { notes }, { auth: true });
  }

  /**
   * Complete booking (authenticated)
   */
  static completeBooking(bookingId: string, notes?: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/bookings/${bookingId}/complete`, { notes }, { auth: true });
  }

  /**
   * Cancel booking (authenticated)
   */
  static cancelBooking(bookingId: string, reason?: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/bookings/${bookingId}/cancel`, { reason }, { auth: true });
  }

  /**
   * Add rating and feedback (authenticated)
   */
  static addRatingAndFeedback(bookingId: string, ratingData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post(`/bookings/${bookingId}/rating`, ratingData, { auth: true });
  }

  // ===== CATEGORY ENDPOINTS =====

  /**
   * Get all categories
   */
  static getAllCategories(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/categories');
  }

  /**
   * Search categories
   */
  static searchCategories(query: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/categories/search', { qs: { q: query } });
  }

  /**
   * Get popular categories
   */
  static getPopularCategories(): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get('/categories/popular');
  }

  /**
   * Get category by ID
   */
  static getCategoryById(categoryId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/categories/${categoryId}`);
  }

  /**
   * Get subcategories
   */
  static getSubcategories(categoryId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/categories/${categoryId}/subcategories`);
  }

  /**
   * Get category hierarchy
   */
  static getCategoryHierarchy(categoryId: string): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.get(`/categories/${categoryId}/hierarchy`);
  }

  /**
   * Create new category (authenticated - admin)
   */
  static createCategory(categoryData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.post('/categories', categoryData, { auth: true });
  }

  /**
   * Update category (authenticated - admin)
   */
  static updateCategory(categoryId: string, categoryData: any): Cypress.Chainable<Cypress.Response<ApiResponse>> {
    return this.put(`/categories/${categoryId}`, categoryData, { auth: true });
  }

  // ===== HEALTH & UTILITY ENDPOINTS =====

  /**
   * Health check
   */
  static healthCheck(): Cypress.Chainable<Cypress.Response<any>> {
    return cy.request({
      method: 'GET',
      url: `${this.baseUrl.replace('/api', '')}/health`,
      failOnStatusCode: false
    });
  }

  /**
   * Get API info
   */
  static getApiInfo(): Cypress.Chainable<Cypress.Response<any>> {
    return cy.request({
      method: 'GET',
      url: this.baseUrl.replace('/api', ''),
      failOnStatusCode: false
    });
  }
}