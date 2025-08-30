import { ApiResponse } from '../types/common.js';
import { CreateLocationDto } from './LocationService.js';
import { AddressSearchRequest } from '../validations/address.js';

// Nominatim response interface
interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
}

// Transformed address result
export interface AddressResult extends CreateLocationDto {
  displayName: string;
  placeId: number;
  importance: number;
  addressType: string;
  boundingBox: [number, number, number, number];
}

export class AddressService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
  private static readonly USER_AGENT = 'P2P-API';
  private static readonly REQUEST_DELAY = 1100; // 1.1 seconds to respect 1 req/sec limit
  private static lastRequestTime = 0;

  /**
   * Search addresses using Nominatim API
   */
  public static async searchAddresses(searchParams: AddressSearchRequest): Promise<ApiResponse<AddressResult[]>> {
    try {
      // Respect rate limiting
      await this.enforceRateLimit();

      const url = this.buildSearchUrl(searchParams);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json',
          'Accept-Language': searchParams.acceptLanguage || 'en',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Nominatim API error:', response.status, response.statusText);
        return {
          success: false,
          error: `Address search failed: ${response.statusText}`,
        };
      }

      const data = await response.json() as NominatimResponse[];
      
      if (!Array.isArray(data)) {
        console.error('Invalid Nominatim response format:', data);
        return {
          success: false,
          error: 'Invalid response format from address service',
        };
      }

      const transformedResults = data.map((item) => this.transformNominatimResponse(item));
      
      return {
        success: true,
        data: transformedResults,
        message: `Found ${transformedResults.length} address results`,
      };

    } catch (error: any) {
      console.error('Address search error:', error);
      
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Address search timeout. Please try again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to search addresses',
      };
    }
  }

  /**
   * Build search URL for Nominatim API
   */
  private static buildSearchUrl(params: AddressSearchRequest): string {
    const searchParams = new URLSearchParams({
      q: params.query,
      format: 'json',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      limit: params.limit.toString(),
    });

    if (params.countryCode) {
      searchParams.append('countrycodes', params.countryCode.toLowerCase());
    }

    return `${this.NOMINATIM_BASE_URL}?${searchParams.toString()}`;
  }

  /**
   * Transform Nominatim response to our CreateLocationDto format
   */
  private static transformNominatimResponse(nominatim: NominatimResponse): AddressResult {
    const address = nominatim.address || {};
    
    // Build address line from components
    const addressComponents = [
      address.house_number,
      address.road,
      address.neighbourhood,
      address.suburb,
    ].filter(Boolean);
    
    const addressLine = addressComponents.length > 0 
      ? addressComponents.join(', ')
      : nominatim.name || nominatim.display_name.split(',')[0];

    // Extract city (try multiple fields)
    const city = address.city 
      || address.district 
      || address.county 
      || address.suburb
      || 'Unknown City';

    // Extract state
    const state = address.state || 'Unknown State';

    // Extract pincode (try postcode)
    const pincode = address.postcode || '000000';

    // Extract country
    const country = address.country || 'India';

    // Parse coordinates
    const latitude = parseFloat(nominatim.lat);
    const longitude = parseFloat(nominatim.lon);

    // Parse bounding box
    const boundingBox: [number, number, number, number] = [
      parseFloat(nominatim.boundingbox[0]), // south
      parseFloat(nominatim.boundingbox[1]), // north
      parseFloat(nominatim.boundingbox[2]), // west
      parseFloat(nominatim.boundingbox[3]), // east
    ];

    const result: AddressResult = {
      addressLine: (addressLine || 'Unknown Address').substring(0, 255), // Ensure max length
      city: city.substring(0, 100),
      state: state.substring(0, 100),
      pincode: this.normalizePincode(pincode),
      country: country.substring(0, 100),
      displayName: nominatim.display_name,
      placeId: nominatim.place_id,
      importance: nominatim.importance || 0,
      addressType: nominatim.addresstype || nominatim.type,
      boundingBox,
    };

    // Only add coordinates if they are valid numbers
    if (!isNaN(latitude)) {
      result.latitude = latitude;
    }
    if (!isNaN(longitude)) {
      result.longitude = longitude;
    }

    return result;
  }

  /**
   * Normalize pincode to 6 digits for Indian addresses, or return as-is for others
   */
  private static normalizePincode(pincode: string): string {
    // Remove non-numeric characters
    const numericPincode = pincode.replace(/\D/g, '');
    
    // For Indian pincodes, ensure 6 digits
    if (numericPincode.length === 6) {
      return numericPincode;
    }
    
    // For other countries or invalid formats, return original or default
    return numericPincode || '000000';
  }

  /**
   * Enforce rate limiting to respect Nominatim's 1 request per second policy
   */
  private static async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get address suggestions for autocomplete
   * This is a lighter version of search with fewer details
   */
  public static async getAddressSuggestions(query: string, limit: number = 5): Promise<ApiResponse<string[]>> {
    try {
      const searchParams: AddressSearchRequest = {
        query,
        limit: Math.min(limit, 10),
        countryCode: 'IN',
      };

      const result = await this.searchAddresses(searchParams);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to get address suggestions',
        };
      }

      const suggestions = result.data.map(addr => addr.displayName);
      
      return {
        success: true,
        data: suggestions,
      };

    } catch (error: any) {
      console.error('Address suggestions error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get address suggestions',
      };
    }
  }
}