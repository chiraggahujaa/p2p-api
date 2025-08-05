// Item service with specialized operations

import { BaseService, QueryOptions } from './BaseService.js';
import { supabaseAdmin } from '../utils/database.js';
import { Item, CreateItemDto, UpdateItemDto, ItemSearchFilters } from '../types/item.js';
import { ApiResponse, PaginatedResponse } from '../types/common.js';

export class ItemService extends BaseService {
  constructor() {
    super('item');
  }

  /**
   * Create a new item with images
   */
  async createItem(userId: string, itemData: CreateItemDto): Promise<ApiResponse<Item>> {
    try {
      // Create the item first
      const itemCreateData = {
        user_id: userId,
        title: itemData.title,
        description: itemData.description,
        category_id: itemData.categoryId,
        condition: itemData.condition,
        security_amount: itemData.securityAmount ?? 0,
        rent_price_per_day: itemData.rentPricePerDay,
        location_id: itemData.locationId,
        delivery_mode: itemData.deliveryMode || 'both',
        min_rental_days: itemData.minRentalDays || 1,
        max_rental_days: itemData.maxRentalDays || 30,
        is_negotiable: itemData.isNegotiable || false,
        tags: itemData.tags || [],
        status: 'available',
        rating_average: 0,
        rating_count: 0,
        is_active: true,
      };

      const result = await this.create(itemCreateData);

      if (!result.success) {
        return result;
      }

      return result;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update item
   */
  async updateItem(itemId: string, userId: string, itemData: UpdateItemDto): Promise<ApiResponse<Item>> {
    try {
      // First verify ownership
      const ownershipCheck = await this.verifyOwnership(itemId, userId);
      if (!ownershipCheck.success) {
        return {
          success: false,
          error: ownershipCheck.error || 'Ownership verification failed',
        };
      }

      const result = await this.update(itemId, itemData);
      return result;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Get item with full details
   */
  async getItemWithDetails(itemId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('item')
        .select(`
          *,
          category:categories(category_name, description),
          location:location(*),
                      owner:users(id, full_name, avatar_url, trust_score, is_verified),
          images:item_image(
            file:file(url, file_type, alt_text),
            is_primary,
            display_order
          ),
          reviews:item_review(
            rating,
            review_text,
            is_verified,
            created_at,
            user:users(full_name, avatar_url)
          )
        `)
        .eq('id', itemId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Item not found',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      // Sort images by primary first, then by display order
      if (data.images) {
        data.images.sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return a.display_order - b.display_order;
        });
      }

      // Sort reviews by newest first
      if (data.reviews) {
        data.reviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting item details:', error);
      throw error;
    }
  }

  /**
   * Search items with advanced filtering
   */
  async searchItems(filters: ItemSearchFilters): Promise<PaginatedResponse<any>> {
    try {
      const {
        categoryId,
        location,
        priceRange,
        condition,
        deliveryMode,
        availability,
        searchTerm,
        sortBy = 'newest',
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;

      // Use the database function for location-based search if location is provided
      if (location) {
        const { data, error } = await supabaseAdmin.rpc('get_items_within_radius', {
          user_lat: location.latitude,
          user_lon: location.longitude,
          radius_km: location.radius || 10,
          category_filter: categoryId || null,
          price_min: priceRange?.min || null,
          price_max: priceRange?.max || null,
          search_term: searchTerm || null,
        });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Apply additional filters if needed
        let filteredData = data || [];

        if (condition && condition.length > 0) {
          filteredData = filteredData.filter((item: any) => condition.includes(item.condition));
        }

        if (deliveryMode && deliveryMode.length > 0) {
          filteredData = filteredData.filter((item: any) => 
            deliveryMode.includes(item.delivery_mode) || item.delivery_mode === 'both'
          );
        }

        // Apply sorting
        switch (sortBy) {
          case 'priceAsc':
            filteredData.sort((a: any, b: any) => a.rent_price_per_day - b.rent_price_per_day);
            break;
          case 'priceDesc':
            filteredData.sort((a: any, b: any) => b.rent_price_per_day - a.rent_price_per_day);
            break;
          case 'rating':
            filteredData.sort((a: any, b: any) => b.rating_average - a.rating_average);
            break;
          case 'popular':
            filteredData.sort((a: any, b: any) => b.booking_count - a.booking_count);
            break;
          case 'distance':
            filteredData.sort((a: any, b: any) => a.distance_km - b.distance_km);
            break;
          default: // newest
            filteredData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        // Apply pagination
        const total = filteredData.length;
        const paginatedData = filteredData.slice(offset, offset + limit);
        const totalPages = Math.ceil(total / limit);

        return {
          success: true,
          data: paginatedData,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };
      }

      // Regular search without location
      let query = supabaseAdmin
        .from('item')
        .select(`
          *,
          category:categories(category_name),
          location:location(city, state, latitude, longitude),
                      owner:users(full_name, avatar_url, trust_score),
          images:item_image(
            file:file(url),
            is_primary,
            display_order
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'available');

      // Apply filters
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (priceRange?.min) {
        query = query.gte('rent_price_per_day', priceRange.min);
      }

      if (priceRange?.max) {
        query = query.lte('rent_price_per_day', priceRange.max);
      }

      if (condition && condition.length > 0) {
        query = query.in('condition', condition);
      }

      if (deliveryMode && deliveryMode.length > 0) {
        const modes = deliveryMode.includes('both') 
          ? deliveryMode 
          : [...deliveryMode, 'both'];
        query = query.in('delivery_mode', modes);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'priceAsc':
          query = query.order('rent_price_per_day', { ascending: true });
          break;
        case 'priceDesc':
          query = query.order('rent_price_per_day', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_average', { ascending: false });
          break;
        case 'popular':
          query = query.order('booking_count', { ascending: false });
          break;
        default: // newest
          query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * Get similar items based on category and location
   */
  async getSimilarItems(itemId: string, limit: number = 6): Promise<ApiResponse<any[]>> {
    try {
      // First get the current item details
      const currentItem = await this.findById(itemId);
      if (!currentItem.success || !currentItem.data) {
        return { success: false, error: 'Item not found' };
      }

      const { data, error } = await supabaseAdmin
        .from('item')
        .select(`
          *,
          category:d_categories(category_name),
          location:d_location(city, state),
                      owner:users(full_name, avatar_url, trust_score),
          images:item_image(
            file:d_file(url),
            is_primary
          )
        `)
        .eq('category_id', currentItem.data.category_id)
        .eq('is_active', true)
        .eq('status', 'available')
        .neq('id', itemId)
        .order('rating_average', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting similar items:', error);
      throw error;
    }
  }

  /**
   * Check item availability for given dates
   */
  async checkAvailability(itemId: string, startDate: string, endDate: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('booking')
        .select('id')
        .eq('item_id', itemId)
        .in('booking_status', ['confirmed', 'in_progress'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .limit(1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const isAvailable = !data || data.length === 0;

      return {
        success: true,
        data: isAvailable,
        message: isAvailable ? 'Item is available for the selected dates' : 'Item is not available for the selected dates',
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Add item to user favorites
   */
  async addToFavorites(itemId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_favorite')
        .insert({
          user_id: userId,
          item_id: itemId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            error: 'Item is already in favorites',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Item added to favorites',
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove item from user favorites
   */
  async removeFromFavorites(itemId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      const { error } = await supabaseAdmin
        .from('user_favorite')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        message: 'Item removed from favorites',
      };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Record item view
   */
  async recordView(itemId: string, userId?: string, deviceId?: string, metadata?: any): Promise<void> {
    try {
      await supabaseAdmin
        .from('item_view')
        .insert({
          item_id: itemId,
          user_id: userId || null,
          device_id: deviceId || null,
          ip_address: metadata?.ip_address || null,
          user_agent: metadata?.user_agent || null,
          referrer: metadata?.referrer || null,
        });
    } catch (error) {
      // Don't throw error for view recording failures
      console.warn('Error recording item view:', error);
    }
  }

  /**
   * Get item analytics
   */
  async getItemAnalytics(itemId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      // Verify ownership
      const ownershipCheck = await this.verifyOwnership(itemId, userId);
      if (!ownershipCheck.success) {
        return ownershipCheck;
      }

      const [viewsData, bookingsData, reviewsData] = await Promise.all([
        // Views in last 30 days
        supabaseAdmin
          .from('item_view')
          .select('viewed_at')
          .eq('item_id', itemId)
          .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Bookings data
        supabaseAdmin
          .from('booking')
          .select('booking_status, created_at, total_rent')
          .eq('item_id', itemId),
        
        // Reviews data
        supabaseAdmin
          .from('item_review')
          .select('rating, created_at')
          .eq('item_id', itemId)
      ]);

      const analytics = {
        totalViews: viewsData.data?.length || 0,
        totalBookings: bookingsData.data?.length || 0,
        completedBookings: bookingsData.data?.filter(b => b.booking_status === 'completed').length || 0,
        totalEarnings: bookingsData.data?.reduce((sum, b) => sum + (b.total_rent || 0), 0) || 0,
        averageRating: (reviewsData.data?.length || 0) > 0 
          ? reviewsData.data!.reduce((sum, r) => sum + r.rating, 0) / reviewsData.data!.length 
          : 0,
        totalReviews: reviewsData.data?.length || 0,
        conversionRate: (viewsData.data?.length || 0) > 0 
          ? (bookingsData.data?.length || 0) / (viewsData.data?.length || 1) * 100 
          : 0,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error('Error getting item analytics:', error);
      throw error;
    }
  }

  /**
   * Verify item ownership
   */
  private async verifyOwnership(itemId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('item')
        .select('user_id')
        .eq('id', itemId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Item not found',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (data.user_id !== userId) {
        return {
          success: false,
          error: 'You do not have permission to modify this item',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Error verifying ownership:', error);
      throw error;
    }
  }
}