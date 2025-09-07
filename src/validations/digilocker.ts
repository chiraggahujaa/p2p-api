import { z } from 'zod';
import { uuidSchema } from './common.js';

// Document types supported by DigiLocker
export const documentTypeSchema = z.enum([
  'aadhaar',
  'pan',
  'driving_license',
  'passport',
  'voter_id',
  'other'
]);

// Session status enum
export const sessionStatusSchema = z.enum([
  'initiated',
  'redirected', 
  'authorized',
  'documents_fetched',
  'expired',
  'failed'
]);

// Request schemas
export const initiateSessionRequestSchema = z.object({
  documentsRequested: z.array(documentTypeSchema).min(1).max(5).default(['aadhaar']),
  redirectUrl: z.string().url().optional(),
});

export const sessionCallbackRequestSchema = z.object({
  sessionId: uuidSchema,
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const fetchDocumentsRequestSchema = z.object({
  sessionId: uuidSchema,
});

// Response schemas
export const digiLockerSessionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  sandboxSessionId: z.string(),
  redirectUrl: z.string().url(),
  callbackUrl: z.string().url(),
  status: sessionStatusSchema,
  documentsRequested: z.array(z.string()),
  consentGiven: z.boolean(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const digiLockerDocumentSchema = z.object({
  id: uuidSchema,
  sessionId: uuidSchema,
  userId: uuidSchema,
  documentType: documentTypeSchema,
  documentName: z.string(),
  documentUrl: z.string().url(),
  documentData: z.any(),
  fileSize: z.number().min(0),
  mimeType: z.string(),
  downloadUrl: z.string().url(),
  downloadedAt: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Validation helper functions
export const validateInitiateSessionRequest = (data: any) => {
  return initiateSessionRequestSchema.parse(data);
};

export const validateSessionCallbackRequest = (data: any) => {
  return sessionCallbackRequestSchema.parse(data);
};

export const validateFetchDocumentsRequest = (data: any) => {
  return fetchDocumentsRequestSchema.parse(data);
};

export const validateDocumentType = (documentType: string) => {
  const result = documentTypeSchema.safeParse(documentType);
  if (!result.success) {
    throw new Error(`Invalid document type: ${documentType}. Supported types: ${documentTypeSchema.options.join(', ')}`);
  }
  return result.data;
};

export const validateSessionStatus = (status: string) => {
  const result = sessionStatusSchema.safeParse(status);
  if (!result.success) {
    throw new Error(`Invalid session status: ${status}. Valid statuses: ${sessionStatusSchema.options.join(', ')}`);
  }
  return result.data;
};

// Additional utility schemas
export const digiLockerConfigSchema = z.object({
  sandboxApiUrl: z.string().url(),
  sandboxApiKey: z.string().optional(),
  sandboxClientId: z.string().optional(),
  sandboxClientSecret: z.string().optional(),
  sandboxApiVersion: z.string().default('2.0'),
  redirectUrl: z.string().url(),
  sessionTimeout: z.number().min(300).max(7200).default(3600), // 5 min to 2 hours
});

// Error response schema
export const digiLockerErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

// Success response schemas
export const initiateSessionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessionId: uuidSchema,
    redirectUrl: z.string().url(),
  }),
  message: z.string().optional(),
});

export const sessionStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessionId: uuidSchema,
    status: sessionStatusSchema,
    consentGiven: z.boolean(),
    documents: z.array(digiLockerDocumentSchema).optional(),
    message: z.string().optional(),
  }),
});

export const fetchDocumentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessionId: uuidSchema,
    documents: z.array(digiLockerDocumentSchema),
    fetchedAt: z.string(),
  }),
  message: z.string().optional(),
});

export const kycStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    isVerified: z.boolean(),
    verificationMethod: z.string().nullable(),
    verifiedAt: z.string().nullable(),
    documentsCount: z.number(),
    latestSessionStatus: sessionStatusSchema.nullable(),
    activeSession: digiLockerSessionSchema.nullable(),
  }),
});

// All schemas are already exported individually above