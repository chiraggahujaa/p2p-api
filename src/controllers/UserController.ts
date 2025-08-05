// User controller with profile management and user operations

import { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';
import { createUserSchema, updateUserSchema } from '../validations/user.js';
import { validateId, validatePagination } from '../validations/common.js';
import { CreateUserDto, UpdateUserDto } from '../types/user.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const result = await this.userService.getUserWithDetails(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const validatedData = updateUserSchema.parse(req.body) as UpdateUserDto;

      const result = await this.userService.updateUser(userId, validatedData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get user by ID (public profile)
   */
  async getUserById(req: Request, res: Response) {
    try {
      const { id: userId } = validateId(req.params);

      const result = await this.userService.getUserWithDetails(userId);

      if (!result.success || !result.data) {
        return res.status(404).json(result);
      }

      // Return limited public information
      const publicProfile = {
        userId: result.data.id,
        fullName: result.data.fullName,
        avatarUrl: result.data.avatarUrl,
        trustScore: result.data.trustScore,
        isVerified: result.data.isVerified,
        bio: result.data.bio,
        location: result.data.location ? {
          city: result.data.location.city,
          state: result.data.location.state,
        } : null,
        createdAt: result.data.createdAt,
      };

      res.json({
        success: true,
        data: publicProfile,
      });
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get current user's items
   */
  async getUserItems(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { page, limit } = validatePagination(req.query);

      const result = await this.userService.getUserItems(userId, page, limit);

      res.json(result);
    } catch (error: any) {
      console.error('Get user items error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get items by user ID (public)
   */
  async getItemsByUserId(req: Request, res: Response) {
    try {
      const { id: userId } = validateId(req.params);
      const { page, limit } = validatePagination(req.query);

      const result = await this.userService.getUserItems(userId, page, limit);

      res.json(result);
    } catch (error: any) {
      console.error('Get items by user ID error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get current user's bookings
   */
  async getUserBookings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { page, limit } = validatePagination(req.query);
      const role = req.query.role as 'lender' | 'borrower' | 'both' || 'both';

      const result = await this.userService.getUserBookings(userId, role, page, limit);

      res.json(result);
    } catch (error: any) {
      console.error('Get user bookings error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get current user's favorites
   */
  async getUserFavorites(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { page, limit } = validatePagination(req.query);

      const result = await this.userService.getUserFavorites(userId, page, limit);

      res.json(result);
    } catch (error: any) {
      console.error('Get user favorites error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get current user's statistics
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const result = await this.userService.getUserStats(userId);

      res.json(result);
    } catch (error: any) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Search users
   */
  async searchUsers(req: Request, res: Response) {
    try {
      const { search } = req.query;
      if (!search || typeof search !== 'string' || search.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search term must be at least 2 characters long',
        });
      }

      const { page, limit } = validatePagination(req.query);

      const result = await this.userService.searchUsers(search.trim(), page, limit);

      res.json(result);
    } catch (error: any) {
      console.error('Search users error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Deactivate current user account
   */
  async deactivateAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const result = await this.userService.deactivateUser(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Account deactivated successfully',
      });
    } catch (error: any) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get all users (admin/public listing with minimal info)
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const { page, limit } = validatePagination(req.query);
      const { isVerified, location } = req.query;

      const filters: any = {
        is_active: true,
      };

      if (isVerified !== undefined) {
        filters.is_verified = isVerified === 'true';
      }

      const result = await this.userService.findAll({
        page,
        limit,
        filters,
        orderBy: 'trust_score',
        orderDirection: 'desc',
      });

      // Return only public information
      if (result.success && result.data) {
        result.data = result.data.map(user => ({
          userId: user.id,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
          trustScore: user.trust_score,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        }));
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get all users error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Verify user account (admin only - placeholder)
   */
  async verifyUser(req: Request, res: Response) {
    try {
      // TODO: Add admin role check
      const { id: userId } = validateId(req.params);

      const result = await this.userService.verifyUser(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Verify user error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}