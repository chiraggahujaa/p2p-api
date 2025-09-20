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

// Enhanced item creation schema with address support
export const createItemWithAddressSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  categoryId: uuidSchema,
  condition: itemConditionSchema,
  securityAmount: z.number().min(0, 'Security amount cannot be negative').optional(),
  rentPricePerDay: positiveNumberSchema,
  deliveryMode: deliveryModeSchema.default('both'),
  minRentalDays: z.number().int().min(1, 'Minimum rental days must be at least 1').default(1),
  maxRentalDays: z.number().int().min(1, 'Maximum rental days must be at least 1').default(30),
  isNegotiable: z.boolean().default(false),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Maximum 10 tags allowed').optional(),
  imageUrls: z.array(z.string().url('Invalid image URL')).optional(),
  
  // Address data is mandatory
  addressData: z.object({
    addressLine: z.string().min(5, 'Address line must be at least 5 characters').max(255, 'Address line too long'),
    city: z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name too long'),
    state: z.string().min(2, 'State name must be at least 2 characters').max(100, 'State name too long'),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode format (6 digits required)'),
    country: z.string().max(100, 'Country name too long').default('India'),
    latitude: z.number().min(-90).max(90, 'Invalid latitude').optional(),
    longitude: z.number().min(-180).max(180, 'Invalid longitude').optional(),
  }),
}).refine(data => data.maxRentalDays >= data.minRentalDays, {
  message: 'Maximum rental days must be greater than or equal to minimum rental days',
  path: ['maxRentalDays'],
});

// Address-based item search schema
export const itemSearchByAddressSchema = z.object({
  addressQuery: z.string().min(2, 'Address query must be at least 2 characters').max(200, 'Address query too long'),
  radius: z.number().int().min(1, 'Radius must be at least 1 km').max(100, 'Maximum radius is 100 km').default(10),
  categoryId: uuidSchema.optional(),
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
  sortBy: z.enum(['priceAsc', 'priceDesc', 'rating', 'distance', 'newest', 'popular']).default('distance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Item search validation
export const itemSearchSchema = z.object({
  categoryId: uuidSchema.optional(),
  city: z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name too long').optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().int().min(5).max(500).default(25),
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

  // Handle nested location parameters from bracket notation (location[latitude], location[longitude], etc.)
  if (parsed['location[latitude]'] || parsed['location[longitude]'] || parsed['location[radius]']) {
    parsed.location = {
      latitude: parsed['location[latitude]'] ? parseFloat(parsed['location[latitude]']) : undefined,
      longitude: parsed['location[longitude]'] ? parseFloat(parsed['location[longitude]']) : undefined,
      radius: parsed['location[radius]'] ? parseInt(parsed['location[radius]']) : undefined,
    };
    // Clean up the bracket notation keys
    delete parsed['location[latitude]'];
    delete parsed['location[longitude]'];
    delete parsed['location[radius]'];
  }

  // Handle existing nested location object (if already parsed)
  if (parsed.location?.radius) parsed.location.radius = parseInt(parsed.location.radius);
  if (parsed.location?.latitude) parsed.location.latitude = parseFloat(parsed.location.latitude);
  if (parsed.location?.longitude) parsed.location.longitude = parseFloat(parsed.location.longitude);

  // Handle nested priceRange parameters from bracket notation
  if (parsed['priceRange[min]'] || parsed['priceRange[max]']) {
    parsed.priceRange = {
      min: parsed['priceRange[min]'] ? parseFloat(parsed['priceRange[min]']) : undefined,
      max: parsed['priceRange[max]'] ? parseFloat(parsed['priceRange[max]']) : undefined,
    };
    // Clean up the bracket notation keys
    delete parsed['priceRange[min]'];
    delete parsed['priceRange[max]'];
  }

  // Handle existing nested priceRange object (if already parsed)
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