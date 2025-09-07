import express from 'express';
import { DigiLockerController } from '../controllers/DigiLockerController.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/security.js';

const router = express.Router();
const digiLockerController = new DigiLockerController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply rate limiting - more restrictive for KYC operations
const kycRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 requests per hour per IP
  'Too many KYC requests. Please try again later.'
);

/**
 * @swagger
 * /api/user/kyc/digilocker/initiate:
 *   post:
 *     tags: [KYC - DigiLocker]
 *     summary: Initiate DigiLocker verification session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentsRequested:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [aadhaar, pan, driving_license, passport, voter_id]
 *                 default: [aadhaar]
 *                 maxItems: 5
 *               redirectUrl:
 *                 type: string
 *                 format: uri
 *                 description: Optional custom redirect URL
 *             example:
 *               documentsRequested: ["aadhaar"]
 *     responses:
 *       200:
 *         description: Session initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     redirectUrl:
 *                       type: string
 *                       format: uri
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: User not authenticated
 *       409:
 *         description: Active session already exists
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/initiate', kycRateLimit, digiLockerController.initiateSession.bind(digiLockerController));

/**
 * @swagger
 * /api/user/kyc/digilocker/callback:
 *   get:
 *     tags: [KYC - DigiLocker]
 *     summary: Handle DigiLocker callback/redirect
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from DigiLocker
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error parameter if authorization failed
 *     responses:
 *       200:
 *         description: Callback handled successfully
 *       400:
 *         description: Callback error or validation error
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Session not found
 */
router.get('/callback', digiLockerController.handleCallback.bind(digiLockerController));

/**
 * @swagger
 * /api/user/kyc/digilocker/session/{sessionId}:
 *   get:
 *     tags: [KYC - DigiLocker]
 *     summary: Get DigiLocker session status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [initiated, redirected, authorized, documents_fetched, expired, failed]
 *                     consentGiven:
 *                       type: boolean
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Session not found
 *   delete:
 *     tags: [KYC - DigiLocker]
 *     summary: Cancel DigiLocker session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session cancelled successfully
 *       400:
 *         description: Cannot cancel session (e.g., documents already fetched)
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Session not found
 */
router.get('/session/:id', digiLockerController.getSessionStatus.bind(digiLockerController));
router.delete('/session/:id', digiLockerController.cancelSession.bind(digiLockerController));

/**
 * @swagger
 * /api/user/kyc/digilocker/fetch-documents:
 *   post:
 *     tags: [KYC - DigiLocker]
 *     summary: Fetch documents from DigiLocker
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *             example:
 *               sessionId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Documents fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           documentType:
 *                             type: string
 *                           documentName:
 *                             type: string
 *                           fileSize:
 *                             type: number
 *                           mimeType:
 *                             type: string
 *                     fetchedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Session not authorized or access denied
 *       410:
 *         description: Session expired
 */
router.post('/fetch-documents', kycRateLimit, digiLockerController.fetchDocuments.bind(digiLockerController));

/**
 * @swagger
 * /api/user/kyc/digilocker/documents:
 *   get:
 *     tags: [KYC - DigiLocker]
 *     summary: Get user's DigiLocker documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           documentType:
 *                             type: string
 *                           documentName:
 *                             type: string
 *                           fileSize:
 *                             type: number
 *                           mimeType:
 *                             type: string
 *                           downloadedAt:
 *                             type: string
 *                             format: date-time
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *       401:
 *         description: User not authenticated
 */
router.get('/documents', digiLockerController.getUserDocuments.bind(digiLockerController));

/**
 * @swagger
 * /api/user/kyc/digilocker/test:
 *   get:
 *     tags: [KYC - DigiLocker]
 *     summary: Test DigiLocker API configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration test result
 *       401:
 *         description: User not authenticated
 */
router.get('/test', digiLockerController.testApiConfig.bind(digiLockerController));

/**
 * @swagger
 * /api/user/kyc/status:
 *   get:
 *     tags: [KYC - DigiLocker]
 *     summary: Get KYC verification status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isVerified:
 *                       type: boolean
 *                     verificationMethod:
 *                       type: string
 *                       nullable: true
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     documentsCount:
 *                       type: number
 *                     latestSessionStatus:
 *                       type: string
 *                       nullable: true
 *                     activeSession:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 */
router.get('/status', digiLockerController.getKycStatus.bind(digiLockerController));

export default router;