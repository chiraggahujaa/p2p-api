import { z } from 'zod';
import { 
  uuidSchema, 
  issueTypeSchema, 
  supportStatusSchema, 
  fileTypeSchema, 
  deviceTypeSchema, 
  fileUploadSchema 
} from './common.js';

// Support Request validation schemas
export const createSupportRequestSchema = z.object({
  issueType: issueTypeSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(255, 'Subject too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  bookingId: uuidSchema.optional(),
  priority: z.number().int().min(1).max(5, 'Priority must be between 1 and 5').default(2),
});

export const updateSupportRequestSchema = z.object({
  status: supportStatusSchema.optional(),
  assignedTo: uuidSchema.optional(),
  resolution: z.string().max(2000, 'Resolution too long').optional(),
  priority: z.number().int().min(1).max(5, 'Priority must be between 1 and 5').optional(),
});

// File validation schemas
export const createFileSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  url: z.string().url('Invalid file URL'),
  fileType: fileTypeSchema,
  fileSize: z.number().int().positive('Invalid file size').optional(),
  mimeType: z.string().max(100, 'MIME type too long').optional(),
  altText: z.string().max(255, 'Alt text too long').optional(),
  isPublic: z.boolean().default(false),
});

// Device validation schemas
export const createDeviceSchema = z.object({
  deviceType: deviceTypeSchema,
  osVersion: z.string().max(50, 'OS version too long').optional(),
  appVersion: z.string().max(50, 'App version too long').optional(),
  deviceToken: z.string().max(1000, 'Device token too long').optional(),
});

export const updateDeviceSchema = createDeviceSchema.partial();

// Bulk operations validation
export const bulkUpdateStatusSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'At least one ID is required'),
  status: z.union([supportStatusSchema]),
});

// Export the file upload schema for use in other modules
export { fileUploadSchema };