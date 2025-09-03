import { supabaseAdmin } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { Location } from '../types/common.js';
import { DataMapper } from '../utils/mappers.js';

export interface CreateLocationDto {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export class LocationService {
  /**
   * Create a new location
   */
  public static async createLocation(locationData: CreateLocationDto): Promise<{ success: boolean; data?: Location; error?: string }> {
    try {
      const location = DataMapper.toSnakeCase({
        id: uuidv4(),
        ...locationData,
        country: locationData.country || 'India',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const { data, error } = await supabaseAdmin
        .from('location')
        .insert(location)
        .select()
        .single();

      if (error) {
        console.error('Location creation error:', error);
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
      console.error('Location service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create location'
      };
    }
  }

  /**
   * Get or create a location based on the provided data
   */
  public static async getOrCreateLocation(locationData: CreateLocationDto): Promise<{ success: boolean; data?: Location; error?: string }> {
    try {
      // First, try to find an existing location with similar details
      const { data: existingLocation, error: searchError } = await supabaseAdmin
        .from('location')
        .select('*')
        .eq('city', locationData.city)
        .eq('state', locationData.state)
        .eq('pincode', locationData.pincode)
        .eq('address_line', locationData.addressLine)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Location search error:', searchError);
        return {
          success: false,
          error: searchError.message
        };
      }

      // If location exists, return it
      if (existingLocation) {
        return {
          success: true,
          data: DataMapper.toCamelCase(existingLocation)
        };
      }

      // Otherwise, create a new location
      return await this.createLocation(locationData);

    } catch (error: any) {
      console.error('Get or create location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get or create location'
      };
    }
  }

  /**
   * Get location by ID
   */
  public static async getLocationById(locationId: string): Promise<{ success: boolean; data?: Location; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('location')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) {
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
      console.error('Get location by ID error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get location'
      };
    }
  }

  /**
   * Search locations by city or pincode
   */
  public static async searchLocations(query: string, limit: number = 10): Promise<{ success: boolean; data?: Location[]; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('location')
        .select('*')
        .or(`city.ilike.%${query}%,pincode.ilike.%${query}%,address_line.ilike.%${query}%`)
        .limit(limit)
        .order('city');

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data ? DataMapper.toCamelCase(data) : []
      };

    } catch (error: any) {
      console.error('Search locations error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search locations'
      };
    }
  }

  /**
   * Get locations by city
   */
  public static async getLocationsByCity(city: string): Promise<{ success: boolean; data?: Location[]; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('location')
        .select('*')
        .eq('city', city)
        .order('address_line');

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data ? DataMapper.toCamelCase(data) : []
      };

    } catch (error: any) {
      console.error('Get locations by city error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get locations'
      };
    }
  }

  /**
   * Update a location
   */
  public static async updateLocation(
    locationId: string, 
    locationData: Partial<CreateLocationDto>
  ): Promise<{ success: boolean; data?: Location; error?: string }> {
    try {
      const updateData = DataMapper.toSnakeCase({
        ...locationData,
        updatedAt: new Date().toISOString()
      });

      const { data, error } = await supabaseAdmin
        .from('location')
        .update(updateData)
        .eq('id', locationId)
        .select()
        .single();

      if (error) {
        console.error('Location update error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Location not found'
        };
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data)
      };

    } catch (error: any) {
      console.error('Update location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update location'
      };
    }
  }

  /**
   * Create a default location for quick testing
   */
  public static async createDefaultLocation(): Promise<{ success: boolean; data?: Location; error?: string }> {
    const defaultLocationData: CreateLocationDto = {
      addressLine: 'Default Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      latitude: 19.0760,
      longitude: 72.8777
    };

    return await this.getOrCreateLocation(defaultLocationData);
  }
}