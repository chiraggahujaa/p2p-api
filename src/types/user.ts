import { BaseEntity, Location, UserGender, UserDobVisibility } from './common.js';

export interface User extends BaseEntity {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: UserGender;
  dob?: string;
  dobVisibility: UserDobVisibility;
  locationId?: string;
  trustScore: number;
  isVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  isActive: boolean;
  
  // Relations (populated when needed)
  location?: Location;
}

// User Favorite interface
export interface UserFavorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
  
  // Relations
  user?: User;
}

// Create/Update DTOs (Data Transfer Objects)
export interface CreateUserDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: UserGender;
  dob?: string;
  dobVisibility?: UserDobVisibility;
  bio?: string;
  location?: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateUserDto {
  fullName?: string;
  phoneNumber?: string;
  gender?: UserGender;
  dob?: string;
  dobVisibility?: UserDobVisibility;
  bio?: string;
  avatarUrl?: string;
}