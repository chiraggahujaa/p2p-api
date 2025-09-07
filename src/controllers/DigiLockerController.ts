import { Request, Response } from 'express';
import { DigiLockerService } from '../services/DigiLockerService.js';
import { 
  validateInitiateSessionRequest,
  validateSessionCallbackRequest,
  validateFetchDocumentsRequest
} from '../validations/digilocker.js';
import { validateId } from '../validations/common.js';
import { supabaseAdmin } from '../lib/supabase.js';

export class DigiLockerController {
  private digiLockerService: DigiLockerService;

  constructor() {
    this.digiLockerService = new DigiLockerService();
  }

  /**
   * Initiate DigiLocker verification session
   * POST /api/v1/user/kyc/digilocker/initiate
   */
  async initiateSession(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Validation
      const validatedData = validateInitiateSessionRequest(req.body);

      // 3. Service call
      const result = await this.digiLockerService.initiateSession(
        userId, 
        validatedData.documentsRequested
      );

      // 4. Response
      if (!result.success) {
        const statusCode = result.error?.includes('Rate limit') ? 429 : 
                          result.error?.includes('active session') ? 409 : 400;
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Initiate DigiLocker session error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Handle DigiLocker callback/redirect
   * GET /api/v1/user/kyc/digilocker/callback
   */
  async handleCallback(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Validation
      const validatedData = validateSessionCallbackRequest(req.query);

      // 3. Handle error callback
      if (validatedData.error) {
        return res.status(400).json({
          success: false,
          error: `DigiLocker callback error: ${validatedData.error}`,
        });
      }

      // 4. Get session status
      const result = await this.digiLockerService.getSessionStatus(validatedData.sessionId);

      // 5. Response
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('DigiLocker callback error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid callback parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get DigiLocker session status
   * GET /api/v1/user/kyc/digilocker/session/:sessionId
   */
  async getSessionStatus(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Validation
      const { id: sessionId } = validateId(req.params);

      // 3. Service call to get session details
      const sessionResult = await this.digiLockerService.findById(sessionId);
      
      if (!sessionResult.success || !sessionResult.data) {
        return res.status(404).json({
          success: false,
          error: 'DigiLocker session not found',
        });
      }

      // 4. Authorization check - ensure session belongs to the user
      if (sessionResult.data.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // 5. Get detailed status
      const result = await this.digiLockerService.getSessionStatus(sessionId);

      // 6. Response
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Get DigiLocker session status error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid session ID',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Fetch documents from DigiLocker
   * POST /api/v1/user/kyc/digilocker/fetch-documents
   */
  async fetchDocuments(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Validation
      const validatedData = validateFetchDocumentsRequest(req.body);

      // 3. Authorization check - ensure session belongs to the user
      const sessionResult = await this.digiLockerService.findById(validatedData.sessionId);
      
      if (!sessionResult.success || !sessionResult.data) {
        return res.status(404).json({
          success: false,
          error: 'DigiLocker session not found',
        });
      }

      if (sessionResult.data.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // 4. Service call
      const result = await this.digiLockerService.fetchDocuments(validatedData.sessionId);

      // 5. Response
      if (!result.success) {
        const statusCode = result.error?.includes('not authorized') ? 403 :
                          result.error?.includes('expired') ? 410 : 400;
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Fetch DigiLocker documents error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get KYC verification status for current user
   * GET /api/v1/user/kyc/status
   */
  async getKycStatus(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Service call (no validation needed for status check)
      const result = await this.digiLockerService.getKycStatus(userId);

      // 3. Response
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Get KYC status error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Cancel active DigiLocker session
   * DELETE /api/v1/user/kyc/digilocker/session/:sessionId
   */
  async cancelSession(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Validation
      const { id: sessionId } = validateId(req.params);

      // 3. Get session details and verify ownership
      const sessionResult = await this.digiLockerService.findById(sessionId);
      
      if (!sessionResult.success || !sessionResult.data) {
        return res.status(404).json({
          success: false,
          error: 'DigiLocker session not found',
        });
      }

      if (sessionResult.data.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // 4. Check if session can be cancelled
      if (sessionResult.data.status === 'documents_fetched') {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel a session with fetched documents',
        });
      }

      // 5. Update session status to expired
      const updateResult = await this.digiLockerService.update(sessionId, { 
        status: 'expired' 
      });

      if (!updateResult.success) {
        return res.status(400).json(updateResult);
      }

      res.status(200).json({
        success: true,
        message: 'DigiLocker session cancelled successfully',
      });
    } catch (error: any) {
      console.error('Cancel DigiLocker session error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid session ID',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Test DigiLocker API configuration
   * GET /api/v1/user/kyc/digilocker/test
   */
  async testApiConfig(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Test API configuration
      const result = await this.digiLockerService.testApiConnection();

      res.status(200).json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Test API config error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get user's DigiLocker documents
   * GET /api/v1/user/kyc/digilocker/documents
   */
  async getUserDocuments(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Get user's documents (not expired)
      const { data, error } = await supabaseAdmin
        .from('digilocker_documents')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 3. Transform data
      const documents = data.map(doc => ({
        id: doc.id,
        documentType: doc.document_type,
        documentName: doc.document_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        downloadedAt: doc.downloaded_at,
        expiresAt: doc.expires_at,
        // Don't expose full document data or URLs for security
      }));

      res.status(200).json({
        success: true,
        data: {
          documents,
          count: documents.length,
        },
      });
    } catch (error: any) {
      console.error('Get user documents error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}