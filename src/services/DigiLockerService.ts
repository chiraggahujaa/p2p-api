import { BaseService } from './BaseService.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiResponse } from '../types/common.js';
import { DataMapper } from '../utils/mappers.js';
import axios from 'axios';

interface CachedToken {
  accessToken: string;
  expiresAt: Date;
}

interface SandboxDigiLockerInitResponse {
  success: boolean;
  data: {
    sessionId: string;
    redirectUrl: string;
    expiresAt: string;
  };
  message?: string;
}

interface SandboxDigiLockerStatusResponse {
  success: boolean;
  data: {
    sessionId: string;
    status: 'initiated' | 'redirected' | 'authorized' | 'documents_fetched' | 'expired' | 'failed';
    consentGiven: boolean;
    documents?: Array<{
      type: string;
      name: string;
      downloadUrl: string;
      expiresAt: string;
    }>;
  };
}

interface SandboxDigiLockerDocumentResponse {
  success: boolean;
  data: {
    documentType: string;
    documentName: string;
    documentUrl: string;
    documentData: any;
    fileSize: number;
    mimeType: string;
    expiresAt: string;
  };
}

interface DigiLockerSession {
  id: string;
  userId: string;
  sandboxSessionId: string;
  redirectUrl: string;
  callbackUrl: string;
  status: 'initiated' | 'redirected' | 'authorized' | 'documents_fetched' | 'expired' | 'failed';
  documentsRequested: string[];
  consentGiven: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DigiLockerDocument {
  id: string;
  sessionId: string;
  userId: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentData: any;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  downloadedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}


export class DigiLockerService extends BaseService {
  private sandboxApiUrl: string;
  private sandboxApiKey: string;
  private sandboxClientId: string;
  private sandboxClientSecret: string;
  private sandboxApiVersion: string;
  private redirectUrl: string;
  private sessionTimeout: number;
  private cachedToken: CachedToken | null = null;

  constructor() {
    super('digilocker_sessions');
    
    this.sandboxApiUrl = process.env.SANDBOX_API_URL || 'https://api.sandbox.co.in';
    this.sandboxApiKey = process.env.SANDBOX_API_KEY || '';
    this.sandboxClientId = process.env.SANDBOX_CLIENT_ID || '';
    this.sandboxClientSecret = process.env.SANDBOX_CLIENT_SECRET || '';
    this.sandboxApiVersion = process.env.SANDBOX_API_VERSION || '2.0';
    
    // Set redirect URL based on environment
    const isDev = process.env.NODE_ENV === 'development';
    this.redirectUrl = isDev 
      ? process.env.DIGILOCKER_REDIRECT_URL_DEV || 'http://localhost:3000/kyc/callback'
      : process.env.DIGILOCKER_REDIRECT_URL_PROD || '';
      
    this.sessionTimeout = parseInt(process.env.DIGILOCKER_SESSION_TIMEOUT || '3600');
    
    if (!this.sandboxApiKey && !this.sandboxClientSecret) {
      console.warn('DigiLocker Sandbox credentials not configured. Set SANDBOX_API_KEY and SANDBOX_CLIENT_SECRET.');
    }
  }

  /**
   * Authenticate with Sandbox API to get access token
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (this.cachedToken && this.cachedToken.expiresAt > new Date()) {
      return this.cachedToken.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.sandboxApiUrl}/authenticate`,
        {},
        {
          headers: {
            'x-api-key': this.sandboxApiKey,
            'x-api-secret': this.sandboxClientSecret,
            'x-api-version': this.sandboxApiVersion,
          },
          timeout: 30000,
        }
      );

      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid authentication response');
      }

      // Cache the token with expiry (24 hours minus 5 minutes buffer)
      const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23 hours
      this.cachedToken = {
        accessToken: response.data.access_token,
        expiresAt,
      };

      console.log('Successfully authenticated with Sandbox API');
      return this.cachedToken.accessToken;

    } catch (error: any) {
      console.error('Authentication error:', error.response?.data || error.message);
      this.cachedToken = null;
      throw new Error('Failed to authenticate with Sandbox API');
    }
  }


  /**
   * Initiate DigiLocker session
   */
  async initiateSession(
    userId: string, 
    documentsRequested: string[] = ['aadhaar']
  ): Promise<ApiResponse<{ sessionId: string; redirectUrl: string }>> {
    try {
      // Check for existing active session
      const existingSession = await this.findActiveSession(userId);
      if (existingSession.success && existingSession.data) {
        const session = existingSession.data as DigiLockerSession;
        if (new Date(session.expiresAt) > new Date()) {
          return {
            success: false,
            error: 'An active DigiLocker session already exists. Please complete the current verification or wait for it to expire.',
          };
        }
      }

      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(userId);
      if (!rateLimitCheck) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      // Call Sandbox API to initiate DigiLocker session
      let sandboxResponse;
      try {
        sandboxResponse = await this.callSandboxInitiateSession(documentsRequested);
        console.log('Sandbox response:', sandboxResponse);
      } catch (error: any) {
        if (error.message === 'Failed to authenticate with Sandbox API') {
          return {
            success: false,
            error: 'Authentication failed. Please check API credentials and try again.',
          };
        }
        console.error('Error initiating DigiLocker session:', error.message);
        throw error;
      }

      if (!sandboxResponse.success) {
        return {
          success: false,
          error: 'Failed to initiate DigiLocker session. Please try again.',
        };
      }

      // Create local DigiLocker session
      const sessionData = {
        userId,
        sandboxSessionId: sandboxResponse.data.sessionId,
        redirectUrl: sandboxResponse.data.redirectUrl,
        callbackUrl: this.redirectUrl,
        status: 'initiated' as const,
        documentsRequested,
        consentGiven: false,
        expiresAt: new Date(Date.now() + this.sessionTimeout * 1000), // Convert to milliseconds
      };

      const sessionResult = await this.create(sessionData);
      
      if (!sessionResult.success) {
        return {
          success: false,
          error: 'Failed to create DigiLocker session',
        };
      }

      return {
        success: true,
        data: { 
          sessionId: sessionResult.data.id,
          redirectUrl: sandboxResponse.data.redirectUrl 
        },
        message: 'DigiLocker session initiated successfully. Please complete the verification on DigiLocker.',
      };

    } catch (error: any) {
      console.error('Error initiating DigiLocker session:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * Get DigiLocker session status
   */
  async getSessionStatus(sessionId: string): Promise<ApiResponse<any>> {
    try {
      // Find local session
      const sessionResult = await this.findById(sessionId);
      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          error: 'DigiLocker session not found',
        };
      }

      const session = sessionResult.data as DigiLockerSession;

      // Check if session has expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.updateSessionStatus(sessionId, 'expired');
        return {
          success: true,
          data: { 
            ...session,
            status: 'expired',
            message: 'Session has expired' 
          },
        };
      }

      // If session is not yet completed, check with Sandbox
      if (!['documents_fetched', 'failed'].includes(session.status)) {
        try {
          const sandboxStatus = await this.callSandboxGetSessionStatus(session.sandboxSessionId);
          
          if (sandboxStatus.success) {
            // Update local session status based on Sandbox response
            let newStatus = session.status;
            if (sandboxStatus.data.status === 'authorized' && sandboxStatus.data.consentGiven) {
              newStatus = 'authorized';
              await this.update(sessionId, { 
                status: newStatus, 
                consentGiven: sandboxStatus.data.consentGiven 
              });
            }
          }
        } catch (error: any) {
          if (error.message === 'Failed to authenticate with Sandbox API') {
            console.warn('Authentication failed when checking session status');
          } else {
            console.error('Error checking session status with Sandbox:', error);
          }
        }
      }

      // Get associated documents
      const documents = await this.getSessionDocuments(sessionId);

      return {
        success: true,
        data: {
          ...session,
          documents: documents.success ? documents.data : [],
        },
      };

    } catch (error: any) {
      console.error('Error getting session status:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * Fetch documents from DigiLocker
   */
  async fetchDocuments(sessionId: string): Promise<ApiResponse<any>> {
    try {
      // Find session
      const sessionResult = await this.findById(sessionId);
      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          error: 'DigiLocker session not found',
        };
      }

      const session = sessionResult.data as DigiLockerSession;

      // Verify session is authorized
      if (session.status !== 'authorized') {
        return {
          success: false,
          error: 'Session is not authorized for document fetching',
        };
      }

      // Check if session has expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.updateSessionStatus(sessionId, 'expired');
        return {
          success: false,
          error: 'Session has expired',
        };
      }

      const fetchedDocuments = [];

      // Fetch each requested document
      for (const docType of session.documentsRequested) {
        try {
          const docResponse = await this.callSandboxFetchDocument(session.sandboxSessionId, docType);
          
          if (docResponse.success) {
            // Store document in database
            const documentData = {
              sessionId,
              userId: session.userId,
              documentType: docType,
              documentName: docResponse.data.documentName,
              documentUrl: docResponse.data.documentUrl,
              documentData: docResponse.data.documentData,
              fileSize: docResponse.data.fileSize,
              mimeType: docResponse.data.mimeType,
              downloadUrl: docResponse.data.documentUrl,
              downloadedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            };

            const { data, error } = await supabaseAdmin
              .from('digilocker_documents')
              .insert(DataMapper.toSnakeCase(documentData))
              .select()
              .single();

            if (!error && data) {
              fetchedDocuments.push(DataMapper.toCamelCase(data));
            }
          }
        } catch (docError: any) {
          if (docError.message === 'Failed to authenticate with Sandbox API') {
            console.error('Authentication failed while fetching documents');
            return {
              success: false,
              error: 'Authentication failed. Please try again.',
            };
          }
          console.error(`Error fetching ${docType} document:`, docError);
        }
      }

      // Update session status
      await this.updateSessionStatus(sessionId, 'documents_fetched');

      // Update user verification status
      await this.updateUserVerification(session.userId, fetchedDocuments);

      return {
        success: true,
        data: {
          sessionId,
          documents: fetchedDocuments,
          fetchedAt: new Date().toISOString(),
        },
        message: 'Documents fetched successfully from DigiLocker',
      };

    } catch (error: any) {
      console.error('Error fetching documents:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * Get KYC status for a user
   */
  async getKycStatus(userId: string): Promise<ApiResponse<any>> {
    try {
      // Use database function to get comprehensive status
      const { data, error } = await supabaseAdmin.rpc('get_user_verification_status', {
        p_user_id: userId
      });

      if (error || !data || data.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const status = data[0];

      // Get active session if any
      const activeSession = await this.findActiveSession(userId);

      return {
        success: true,
        data: {
          isVerified: status.is_verified,
          verificationMethod: status.verification_method,
          verifiedAt: status.verified_at,
          documentsCount: status.documents_count,
          latestSessionStatus: status.latest_session_status,
          activeSession: activeSession.success ? activeSession.data : null,
        },
      };

    } catch (error) {
      console.error('Error getting KYC status:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * Test API credentials and connectivity
   */
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.sandboxApiKey && !this.sandboxClientId) {
        return {
          success: false,
          message: 'No API credentials configured. Please set SANDBOX_API_KEY or SANDBOX_CLIENT_ID/SANDBOX_CLIENT_SECRET.'
        };
      }

      // Try a simple health check or authentication test
      console.log('Testing DigiLocker API configuration...');
      console.log('API URL:', this.sandboxApiUrl);
      console.log('Has API Key:', !!this.sandboxApiKey);
      console.log('Has Client ID:', !!this.sandboxClientId);
      console.log('Redirect URL:', this.redirectUrl);

      return {
        success: true,
        message: 'API configuration appears valid. Test with actual API call required.'
      };
    } catch (error) {
      return {
        success: false,
        message: `API configuration test failed: ${error}`
      };
    }
  }

  /**
   * Private helper methods
   */
  private async findActiveSession(userId: string): Promise<ApiResponse<DigiLockerSession>> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .in('status', ['initiated', 'redirected', 'authorized'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'No active session found' };
        }
        throw error;
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data) as DigiLockerSession,
      };
    } catch (error) {
      console.error('Error finding active session:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  private async updateSessionStatus(sessionId: string, status: DigiLockerSession['status']): Promise<void> {
    await this.update(sessionId, { status });
  }

  private async updateUserVerification(userId: string, documents: any[]): Promise<void> {
    const documentTypes = documents.map(doc => doc.documentType);
    
    await supabaseAdmin
      .from('users')
      .update({
        digilocker_verified: true,
        verification_method: 'digilocker',
        verified_at: new Date().toISOString(),
        verification_documents: documentTypes,
      })
      .eq('id', userId);
  }

  private async getSessionDocuments(sessionId: string): Promise<ApiResponse<DigiLockerDocument[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('digilocker_documents')
        .select('*')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data.map(doc => DataMapper.toCamelCase(doc)) as DigiLockerDocument[],
      };
    } catch (error) {
      console.error('Error getting session documents:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    // Simple rate limiting - 5 session requests per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { count } = await supabaseAdmin
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString());

    return (count || 0) < 5;
  }

  private async callSandboxInitiateSession(documentsRequested: string[]): Promise<SandboxDigiLockerInitResponse> {
    try {
      // Get access token first
      const accessToken = await this.authenticate();
      
      const requestData = {
        '@entity': 'in.co.sandbox.kyc.digilocker.session.request',
        flow: 'signin',
        doc_types: documentsRequested,
        redirect_url: this.redirectUrl,
        consent_expiry: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
        options: {
          pinless: true,
          usernameless: true
        }
      };

      console.log('headers', {
        'Authorization': accessToken,
        'x-api-key': this.sandboxApiKey,
        'x-api-version': this.sandboxApiVersion,
        'Content-Type': 'application/json'
      });

      console.log('req data', requestData);

      const response = await axios.post(
        `${this.sandboxApiUrl}/kyc/digilocker/sessions/init`,
        requestData,
        {
          headers: {
            'Authorization': accessToken,
            'x-api-key': this.sandboxApiKey,
            'x-api-version': this.sandboxApiVersion,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.data) {
        return {
          success: true,
          data: {
            sessionId: response.data.data.session_id,
            redirectUrl: response.data.data.authorization_url || response.data.data.redirect_url,
            expiresAt: new Date(Date.now() + this.sessionTimeout * 1000).toISOString(),
          },
          message: 'Session initiated successfully',
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Sandbox session initiation error:', error.response?.data || error.message);
      return {
        success: false,
        data: { sessionId: '', redirectUrl: '', expiresAt: '' },
        message: error.response?.data?.message || error.message || 'Failed to initiate session',
      };
    }
  }

  private async callSandboxGetSessionStatus(sessionId: string): Promise<SandboxDigiLockerStatusResponse> {
    try {
      // Get access token first
      const accessToken = await this.authenticate();

      const response = await axios.get(
        `${this.sandboxApiUrl}/kyc/digilocker/sessions/${sessionId}/status`,
        {
          headers: {
            'Authorization': accessToken,
            'x-api-key': this.sandboxApiKey
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: {
          sessionId: response.data.data?.session_id || sessionId,
          status: response.data.data?.status || 'initiated',
          consentGiven: response.data.data?.consent_given || false,
          documents: response.data.data?.documents || [],
        },
      };
    } catch (error: any) {
      console.error('Sandbox session status error:', error.response?.data || error.message);
      return {
        success: false,
        data: {
          sessionId,
          status: 'failed',
          consentGiven: false,
        },
      };
    }
  }

  private async callSandboxFetchDocument(sessionId: string, documentType: string): Promise<SandboxDigiLockerDocumentResponse> {
    try {
      // Get access token first
      const accessToken = await this.authenticate();

      const response = await axios.get(
        `${this.sandboxApiUrl}/kyc/digilocker/sessions/${sessionId}/documents/${documentType}`,
        {
          headers: {
            'Authorization': accessToken,
            'x-api-key': this.sandboxApiKey
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: {
          documentType: documentType,
          documentName: response.data.data?.document_name || '',
          documentUrl: response.data.data?.document_url || '',
          documentData: response.data.data?.document_data || null,
          fileSize: response.data.data?.file_size || 0,
          mimeType: response.data.data?.mime_type || 'application/pdf',
          expiresAt: response.data.data?.expires_at || '',
        },
      };
    } catch (error: any) {
      console.error('Sandbox document fetch error:', error.response?.data || error.message);
      return {
        success: false,
        data: {
          documentType,
          documentName: '',
          documentUrl: '',
          documentData: null,
          fileSize: 0,
          mimeType: '',
          expiresAt: '',
        },
      };
    }
  }
}