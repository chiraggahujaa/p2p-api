import { BaseService } from './BaseService.js';
import { supabaseAdmin } from '../utils/database.js';
import { User, CreateUserDto, UpdateUserDto } from '../types/user.js';
import { ApiResponse, PaginatedResponse } from '../types/common.js';

export class UserService extends BaseService {
  constructor() {
    super('users');
  }

  /**
   * Create a new user with location
   */
  async createUser(userData: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      let locationId: string | undefined;

      // Create location if provided
      if (userData.location) {
        const { data: locationData, error: locationError } = await supabaseAdmin
          .from('location')
          .insert(userData.location)
          .select()
          .single();

        if (locationError) {
          throw new Error(`Location creation error: ${locationError.message}`);
        }

        locationId = locationData.id;
      }

      // Create user
      const userCreateData = {
        full_name: userData.fullName,
        email: userData.email,
        phone_number: userData.phoneNumber,
        gender: userData.gender,
        dob: userData.dob,
        dob_visibility: userData.dobVisibility || 'private',
        bio: userData.bio,
        location_id: locationId,
        trust_score: 0,
        is_verified: false,
        is_active: true,
      };

      const result = await this.create(userCreateData);
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, userData: UpdateUserDto): Promise<ApiResponse<User>> {
    try {
      const result = await this.update(userId, userData);
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Get user with location details
   */
  async getUserWithDetails(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          location:d_location(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'User not found',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'User not found',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Verify user account
   */
  async verifyUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const result = await this.update(userId, { is_verified: true });
      return result;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const result = await this.update(userId, { is_active: false });
      return result;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Get user's items
   */
  async getUserItems(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('item')
        .select(`
          *,
          category:d_categories(category_name),
          location:d_location(city, state),
                      images:item_image(
            file:d_file(url, file_type),
            is_primary,
            display_order
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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
      console.error('Error getting user items:', error);
      throw error;
    }
  }

  /**
   * Get user's bookings (as lender or borrower)
   */
  async getUserBookings(
    userId: string,
    role: 'lender' | 'borrower' | 'both' = 'both',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('booking')
        .select(`
          *,
                      item:item(title, image_urls),
          lender:lender_user_id!inner(full_name, avatar_url),
          borrower:borrower_user_id!inner(full_name, avatar_url)
        `, { count: 'exact' });

      // Apply role filter
      if (role === 'lender') {
        query = query.eq('lender_user_id', userId);
      } else if (role === 'borrower') {
        query = query.eq('borrower_user_id', userId);
      } else {
        query = query.or(`lender_user_id.eq.${userId},borrower_user_id.eq.${userId}`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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
      console.error('Error getting user bookings:', error);
      throw error;
    }
  }

  /**
   * Get user's favorites
   */
  async getUserFavorites(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('user_favorite')
        .select(`
          *,
          item:item(
            *,
            category:d_categories(category_name),
            location:d_location(city, state),
            owner:users(full_name, avatar_url, trust_score)
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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
      console.error('Error getting user favorites:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ApiResponse<any>> {
    try {
      // Get various statistics for the user
      const [itemsCount, bookingsAsLender, bookingsAsBorrower, reviewsCount, avgRating] = await Promise.all([
        // Items count
        supabaseAdmin
          .from('item')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true),
        
        // Bookings as lender
        supabaseAdmin
          .from('booking')
          .select('*', { count: 'exact', head: true })
          .eq('lender_user_id', userId),
        
        // Bookings as borrower
        supabaseAdmin
          .from('booking')
          .select('*', { count: 'exact', head: true })
          .eq('borrower_user_id', userId),
        
        // Get user's item IDs first
        supabaseAdmin
          .from('item')
          .select('id')
          .eq('user_id', userId)
          .then(async ({ data: items }) => {
            const itemIds = items?.map(item => item.id) || [];
            if (itemIds.length === 0) return { count: 0 };
            
            return supabaseAdmin
              .from('item_review')
              .select('*', { count: 'exact', head: true })
              .in('item_id', itemIds);
          }),
        
        // Average rating of user's items
        supabaseAdmin
          .from('item')
          .select('rating_average')
          .eq('user_id', userId)
          .eq('is_active', true)
      ]);

      // Calculate average rating
      const itemRatings = avgRating.data?.map(item => item.rating_average).filter(rating => rating > 0) || [];
      const averageRating = itemRatings.length > 0 
        ? itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length 
        : 0;

      const stats = {
        itemsCount: itemsCount.count || 0,
        bookingsAsLender: bookingsAsLender.count || 0,
        bookingsAsBorrower: bookingsAsBorrower.count || 0,
        totalBookings: (bookingsAsLender.count || 0) + (bookingsAsBorrower.count || 0),
        reviewsReceived: reviewsCount.count || 0,
        averageRating: Number(averageRating.toFixed(2)),
        itemsWithRatings: itemRatings.length,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          trust_score,
          is_verified,
          dob_visibility,
          is_active,
          created_at,
          updated_at,
          location:d_location(city, state)
        `, { count: 'exact' })
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('trust_score', { ascending: false })
        .range(offset, offset + limit - 1);

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
      console.error('Error searching users:', error);
      throw error;
    }
  }
}