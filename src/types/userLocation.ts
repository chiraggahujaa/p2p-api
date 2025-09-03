import { BaseEntity, Location } from './common.js';
import { CreateLocationDto } from '../services/LocationService.js';

export interface UserLocation extends BaseEntity {
  id: string;
  userId: string;
  locationId: string;
  isDefault: boolean;
  label: string;
  
  // Relations (populated when needed)
  location?: Location;
}

// Create/Update DTOs
export interface CreateUserLocationDto {
  locationId: string;
  isDefault?: boolean;
  label?: string;
}

export interface UpdateUserLocationDto {
  location?: Partial<CreateLocationDto>;
  isDefault?: boolean;
  label?: string;
}

// Response DTOs
export interface UserLocationWithDetails extends UserLocation {
  location: Location;
}

export interface DefaultLocationResponse {
  locationId: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  label: string;
}