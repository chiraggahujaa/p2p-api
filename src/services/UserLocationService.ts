import { supabaseAdmin } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { DataMapper } from '../utils/mappers.js';
import { ApiResponse, PaginatedResponse } from '../types/common.js';
import { 
  UserLocation, 
  UserLocationWithDetails, 
  CreateUserLocationDto, 
  UpdateUserLocationDto,
  DefaultLocationResponse 
} from '../types/userLocation.js';
import { LocationService } from './LocationService.js';

export class UserLocationService {
  /**
   * Get all locations for a user with location details
   */
  public static async getUserLocations(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<UserLocationWithDetails>> {
    try {
      const offset = (page - 1) * limit;

      // Get user locations with location details using the database function
      const { data, error } = await supabaseAdmin
        .rpc('get_user_locations_with_details', { user_uuid: userId })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Get user locations error:', error);
        return {
          success: false,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        } as PaginatedResponse<UserLocationWithDetails>;
      }

      // Get total count
      const { count } = await supabaseAdmin
        .from('user_locations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      const mappedData = data ? data.map((item: any) => ({
        id: item.id,
        userId: userId,
        locationId: item.location_id,
        isDefault: item.is_default,
        label: item.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        location: {
          id: item.location_id,
          addressLine: item.address_line,
          city: item.city,
          state: item.state,
          pincode: item.pincode,
          country: item.country,
          latitude: item.latitude,
          longitude: item.longitude,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }
      })) : [];

      return {
        success: true,
        data: mappedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error: any) {
      console.error('Get user locations error:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      } as PaginatedResponse<UserLocationWithDetails>;
    }
  }

  /**
   * Get user's default location
   */
  public static async getDefaultLocation(userId: string): Promise<ApiResponse<DefaultLocationResponse | null>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_user_default_location', { user_uuid: userId })
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No default location found
          return {
            success: true,
            data: null
          };
        }
        console.error('Get default location error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const mappedData: DefaultLocationResponse = {
        locationId: (data as any).location_id,
        addressLine: (data as any).address_line,
        city: (data as any).city,
        state: (data as any).state,
        pincode: (data as any).pincode,
        country: (data as any).country,
        latitude: (data as any).latitude,
        longitude: (data as any).longitude,
        label: (data as any).label
      };

      return {
        success: true,
        data: mappedData
      };

    } catch (error: any) {
      console.error('Get default location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get default location'
      };
    }
  }

  /**
   * Add a location to user's address book
   */
  public static async addLocationToUser(
    userId: string, 
    locationData: CreateUserLocationDto
  ): Promise<ApiResponse<UserLocation>> {
    try {
      // Check if the location already exists for this user
      const { data: existing } = await supabaseAdmin
        .from('user_locations')
        .select('id')
        .eq('user_id', userId)
        .eq('location_id', locationData.locationId)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: 'Location already exists in your address book'
        };
      }

      const userLocationData = DataMapper.toSnakeCase({
        id: uuidv4(),
        userId,
        locationId: locationData.locationId,
        isDefault: locationData.isDefault || false,
        label: locationData.label || 'Location',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const { data, error } = await supabaseAdmin
        .from('user_locations')
        .insert(userLocationData)
        .select()
        .single();

      if (error) {
        console.error('Add user location error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data)
      };

    } catch (error: any) {
      console.error('Add user location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add location to address book'
      };
    }
  }

  /**
   * Update user location (label, default status)
   */
  public static async updateUserLocation(
    userId: string,
    userLocationId: string,
    updates: UpdateUserLocationDto
  ): Promise<ApiResponse<UserLocation>> {
    try {
      const updateData = DataMapper.toSnakeCase({
        ...updates,
        updatedAt: new Date().toISOString()
      });

      const { data, error } = await supabaseAdmin
        .from('user_locations')
        .update(updateData)
        .eq('id', userLocationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update user location error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Location not found or access denied'
        };
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data)
      };

    } catch (error: any) {
      console.error('Update user location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update location'
      };
    }
  }

  /**
   * Update user location including the underlying location data
   */
  public static async updateUserLocationWithLocationDetails(
    userId: string,
    userLocationId: string,
    updates: UpdateUserLocationDto
  ): Promise<ApiResponse<UserLocationWithDetails>> {
    try {
      // First get the user location to get the locationId
      const { data: userLocation, error: userLocationError } = await supabaseAdmin
        .from('user_locations')
        .select('location_id')
        .eq('id', userLocationId)
        .eq('user_id', userId)
        .single();

      if (userLocationError || !userLocation) {
        return {
          success: false,
          error: 'Location not found or access denied'
        };
      }

      // Update the location details if provided
      if (updates.location) {
        const locationResult = await LocationService.updateLocation(
          userLocation.location_id,
          updates.location
        );
        
        if (!locationResult.success) {
          return {
            success: false,
            error: locationResult.error || 'Failed to update location details'
          };
        }
      }

      // Update user location metadata (label, isDefault)
      const userLocationUpdates: any = {};
      if (updates.label !== undefined) userLocationUpdates.label = updates.label;
      if (updates.isDefault !== undefined) userLocationUpdates.isDefault = updates.isDefault;

      if (Object.keys(userLocationUpdates).length > 0) {
        const updateResult = await this.updateUserLocation(userId, userLocationId, userLocationUpdates);
        if (!updateResult.success) {
          return {
            success: false,
            error: updateResult.error || 'Failed to update user location'
          };
        }
      }

      // Return the updated user location with details
      const { data, error } = await supabaseAdmin
        .rpc('get_user_locations_with_details', { user_uuid: userId })
        .eq('id', userLocationId)
        .single();

      if (error) {
        console.error('Get updated location error:', error);
        return {
          success: false,
          error: 'Failed to retrieve updated location'
        };
      }

      const mappedData = {
        id: (data as any).id,
        userId: userId,
        locationId: (data as any).location_id,
        isDefault: (data as any).is_default,
        label: (data as any).label,
        createdAt: (data as any).created_at,
        updatedAt: (data as any).updated_at,
        location: {
          id: (data as any).location_id,
          addressLine: (data as any).address_line,
          city: (data as any).city,
          state: (data as any).state,
          pincode: (data as any).pincode,
          country: (data as any).country,
          latitude: (data as any).latitude,
          longitude: (data as any).longitude,
          createdAt: (data as any).created_at,
          updatedAt: (data as any).updated_at
        }
      };

      return {
        success: true,
        data: mappedData
      };

    } catch (error: any) {
      console.error('Update user location with details error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update location'
      };
    }
  }

  /**
   * Remove location from user's address book
   */
  public static async removeUserLocation(
    userId: string, 
    userLocationId: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      // First check if this is the user's only location or default location
      const { data: userLocations } = await supabaseAdmin
        .from('user_locations')
        .select('id, is_default')
        .eq('user_id', userId);

      const targetLocation = userLocations?.find(loc => loc.id === userLocationId);
      
      if (!targetLocation) {
        return {
          success: false,
          error: 'Location not found or access denied'
        };
      }

      // If this is the only location, don't allow deletion
      if (userLocations?.length === 1) {
        return {
          success: false,
          error: 'Cannot delete your only location. Add another location first.'
        };
      }

      // Delete the location
      const { error } = await supabaseAdmin
        .from('user_locations')
        .delete()
        .eq('id', userLocationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Remove user location error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // If we deleted the default location, set another one as default
      if (targetLocation.is_default && userLocations && userLocations.length > 1) {
        const remainingLocations = userLocations.filter(loc => loc.id !== userLocationId);
        if (remainingLocations.length > 0) {
          await supabaseAdmin
            .from('user_locations')
            .update({ is_default: true })
            .eq('id', remainingLocations[0]?.id)
            .eq('user_id', userId);
        }
      }

      return {
        success: true,
        data: { message: 'Location removed from address book' }
      };

    } catch (error: any) {
      console.error('Remove user location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove location'
      };
    }
  }

  /**
   * Create location and add to user's address book in one step
   */
  public static async createAndAddLocation(
    userId: string,
    locationData: any,
    label?: string,
    isDefault?: boolean
  ): Promise<ApiResponse<UserLocationWithDetails>> {
    try {
      // First create the location
      const locationResult = await LocationService.getOrCreateLocation(locationData);
      
      if (!locationResult.success || !locationResult.data) {
        return {
          success: false,
          error: locationResult.error || 'Failed to create location'
        };
      }

      // Then add it to user's address book
      const userLocationResult = await this.addLocationToUser(userId, {
        locationId: locationResult.data.id,
        label: label || 'Location',
        isDefault: isDefault || false
      });

      if (!userLocationResult.success || !userLocationResult.data) {
        return {
          success: false,
          error: userLocationResult.error || 'Failed to add location to address book'
        };
      }

      // Return combined data
      return {
        success: true,
        data: {
          ...userLocationResult.data,
          location: locationResult.data
        }
      };

    } catch (error: any) {
      console.error('Create and add location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create and add location'
      };
    }
  }
}