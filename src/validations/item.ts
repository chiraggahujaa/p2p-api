import { z } from 'zod';
import { 
  uuidSchema, 
  positiveNumberSchema, 
  itemConditionSchema, 
  itemStatusSchema, 
  deliveryModeSchema 
} from './common.js';

// Category validation schemas
export const createCategorySchema = z.object({
  categoryName: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  iconUrl: z.string().url('Invalid icon URL').optional(),
  bannerUrl: z.string().url('Invalid banner URL').optional(),
  parentCategoryId: uuidSchema.optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// Item validation schemas
export const createItemSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  categoryId: uuidSchema,
  condition: itemConditionSchema,
  securityAmount: z.number().min(0, 'Security amount cannot be negative').optional(),
  rentPricePerDay: positiveNumberSchema,
  locationId: uuidSchema,
  deliveryMode: deliveryModeSchema.default('both'),
  minRentalDays: z.number().int().min(1, 'Minimum rental days must be at least 1').default(1),
  maxRentalDays: z.number().int().min(1, 'Maximum rental days must be at least 1').default(30),
  isNegotiable: z.boolean().default(false),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Maximum 10 tags allowed').optional(),
}).refine(data => data.maxRentalDays >= data.minRentalDays, {
  message: 'Maximum rental days must be greater than or equal to minimum rental days',
  path: ['maxRentalDays'],
});

export const updateItemSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  categoryId: uuidSchema.optional(),
  condition: itemConditionSchema.optional(),
  securityAmount: z.number().min(0, 'Security amount cannot be negative').optional(),
  rentPricePerDay: positiveNumberSchema.optional(),
  deliveryMode: deliveryModeSchema.optional(),
  minRentalDays: z.number().int().min(1, 'Minimum rental days must be at least 1').optional(),
  maxRentalDays: z.number().int().min(1, 'Maximum rental days must be at least 1').optional(),
  isNegotiable: z.boolean().optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Maximum 10 tags allowed').optional(),
  status: itemStatusSchema.optional(),
});

// Item search validation
export const itemSearchSchema = z.object({
  categoryId: uuidSchema.optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().int().min(1).max(100).default(10),
  }).optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  condition: z.array(itemConditionSchema).optional(),
  deliveryMode: z.array(deliveryModeSchema).optional(),
  availability: z.object({
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
  }).optional(),
  searchTerm: z.string().max(255, 'Search term too long').optional(),
  sortBy: z.enum(['priceAsc', 'priceDesc', 'rating', 'distance', 'newest', 'popular']).default('newest'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Item review validation
export const createItemReviewSchema = z.object({
  itemId: uuidSchema,
  bookingId: uuidSchema.optional(),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  reviewText: z.string().max(1000, 'Review text too long').optional(),
});

export const updateItemReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  reviewText: z.string().max(1000, 'Review text too long').optional(),
});

// Category search validation
export const categorySearchSchema = z.object({
  search: z.string().min(1, 'Search term is required').max(255, 'Search term too long'),
});

// Utility function for parsing search parameters
export const validateSearchParams = (query: any) => {
  const parsed = { ...query };
  
  // Parse numeric values
  if (parsed.page) parsed.page = parseInt(parsed.page);
  if (parsed.limit) parsed.limit = parseInt(parsed.limit);
  if (parsed.location?.radius) parsed.location.radius = parseInt(parsed.location.radius);
  if (parsed.location?.latitude) parsed.location.latitude = parseFloat(parsed.location.latitude);
  if (parsed.location?.longitude) parsed.location.longitude = parseFloat(parsed.location.longitude);
  if (parsed.priceRange?.min) parsed.priceRange.min = parseFloat(parsed.priceRange.min);
  if (parsed.priceRange?.max) parsed.priceRange.max = parseFloat(parsed.priceRange.max);
  
  // Parse arrays
  if (parsed.condition && typeof parsed.condition === 'string') {
    parsed.condition = parsed.condition.split(',');
  }
  if (parsed.deliveryMode && typeof parsed.deliveryMode === 'string') {
    parsed.deliveryMode = parsed.deliveryMode.split(',');
  }
  
  return itemSearchSchema.parse(parsed);
};