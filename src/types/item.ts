import { BaseEntity, Location, ItemCondition, ItemStatus, DeliveryMode, File } from './common.js';
import { User } from './user.js';

// Category interface
export interface Category extends BaseEntity {
  id: string;
  categoryName: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  parentCategoryId?: string;
  isActive: boolean;
  sortOrder: number;
  
  // Relations
  parentCategory?: Category;
  subcategories?: Category[];
}

// Item interface
export interface Item extends BaseEntity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  categoryId: string;
  condition: ItemCondition;
  imageUrls?: string[];
  status: ItemStatus;
  securityAmount?: number;
  rentPricePerDay: number;
  locationId: string;
  deliveryMode: DeliveryMode;
  minRentalDays: number;
  maxRentalDays: number;
  isNegotiable: boolean;
  tags?: string[];
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
  
  // Relations
  user?: User;
  category?: Category;
  location?: Location;
  images?: ItemImage[];
  reviews?: ItemReview[];
}

// Item View interface
export interface ItemView {
  id: string;
  userId?: string;
  itemId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  viewedAt: string;
  sessionDuration?: number;
  
  // Relations
  user?: User;
  item?: Item;
}

// Item Image interface
export interface ItemImage {
  id: string;
  itemId: string;
  fileId: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
  
  // Relations
  item?: Item;
  file?: File;
}

// Item Review interface
export interface ItemReview extends BaseEntity {
  id: string;
  itemId: string;
  userId: string;
  bookingId?: string;
  rating: number;
  reviewText?: string;
  isVerified: boolean;
  helpfulCount: number;
  
  // Relations
  item?: Item;
  user?: User;
}

// Analytics Event interface
export interface AnalyticsEvent extends BaseEntity {
  id: string;
  eventType: string;
  itemId?: string;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  eventTimestamp: string;
  eventDate: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  additionalData?: Record<string, any>;
  
  // Relations
  item?: Item;
  user?: User;
}

// Item Metrics interface
export interface ItemMetrics extends BaseEntity {
  id: string;
  itemId: string;
  metricDate: string;
  viewCount: number;
  uniqueViewCount: number;
  bookingCount: number;
  bookingConversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  
  // Relations
  item?: Item;
}

// Analytics Summary interface
export interface ItemAnalyticsSummary {
  totalViews: number;
  uniqueViews: number;
  totalBookings: number;
  conversionRate: number;
  avgDailyViews: number;
  trendDirection: 'up' | 'down' | 'stable' | 'insufficientData';
}

// Search and filter types
export interface ItemSearchFilters {
  categoryId?: string;
  city?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in km
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  condition?: ItemCondition[];
  deliveryMode?: DeliveryMode[];
  availability?: {
    startDate?: string;
    endDate?: string;
  };
  searchTerm?: string;
  sortBy?: 'priceAsc' | 'priceDesc' | 'rating' | 'distance' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

// Create/Update DTOs
export interface CreateItemDto {
  title: string;
  description?: string;
  categoryId: string;
  condition: ItemCondition;
  securityAmount?: number;
  rentPricePerDay: number;
  locationId: string;
  deliveryMode?: DeliveryMode;
  minRentalDays?: number;
  maxRentalDays?: number;
  isNegotiable?: boolean;
  tags?: string[];
  imageUrls?: string[];
}

// Enhanced DTO with address support
export interface CreateItemDtoWithAddress extends Omit<CreateItemDto, 'locationId'> {
  addressData: {               // Address data is mandatory
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface UpdateItemDto {
  title?: string;
  description?: string;
  categoryId?: string;
  condition?: ItemCondition;
  securityAmount?: number;
  rentPricePerDay?: number;
  deliveryMode?: DeliveryMode;
  minRentalDays?: number;
  maxRentalDays?: number;
  isNegotiable?: boolean;
  tags?: string[];
  status?: ItemStatus;
}