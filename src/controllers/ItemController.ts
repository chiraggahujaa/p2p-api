// Item controller with CRUD operations and business logic

import { Request, Response } from 'express';
import { ItemService } from '../services/ItemService.js';
import {
  updateItemSchema,
  validateSearchParams,
  createItemWithAddressSchema
} from '../validations/item.js';
import { validateId, validatePagination } from '../validations/common.js';
import { UpdateItemDto, CreateItemDtoWithAddress } from '../types/item.js';

export class ItemController {
  private itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  /**
   * Create a new item with address data
   */
  async createItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // Validate using address-based schema
      const validatedData = createItemWithAddressSchema.parse(req.body) as CreateItemDtoWithAddress;
      const result = await this.itemService.createItem(userId, validatedData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Create item error:', error);
      
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
   * Update an item
   */
  async updateItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: itemId } = validateId(req.params);
      const validatedData = updateItemSchema.parse(req.body) as UpdateItemDto;

      const result = await this.itemService.updateItem(itemId, userId, validatedData);

      if (!result.success) {
        return res.status(result.error === 'Item not found' ? 404 : 400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Update item error:', error);
      
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
   * Get item by ID with full details
   */
  async getItem(req: Request, res: Response) {
    try {
      const { id: itemId } = validateId(req.params);
      const userId = req.user?.id; // Optional for view recording

      const result = await this.itemService.getItemWithDetails(itemId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      // Record view (async, don't wait)
      if (userId) {
        this.itemService.recordView(itemId, userId, undefined, {
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          referrer: req.get('referer'),
        }).catch(console.warn);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get item error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Search items with filters
   */
  async searchItems(req: Request, res: Response) {
    try {
      const filters = validateSearchParams(req.query);

      const result = await this.itemService.searchItems(filters as any);

      res.json(result);
    } catch (error: any) {
      console.error('Search items error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid search parameters',
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
   * Get similar items
   */
  async getSimilarItems(req: Request, res: Response) {
    try {
      const { id: itemId } = validateId(req.params);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;

      const result = await this.itemService.getSimilarItems(itemId, limit);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get similar items error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Check item availability
   */
  async checkAvailability(req: Request, res: Response) {
    try {
      const { id: itemId } = validateId(req.params);
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
      }

      const result = await this.itemService.checkAvailability(
        itemId,
        start_date as string,
        end_date as string
      );

      res.json(result);
    } catch (error: any) {
      console.error('Check availability error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Add item to favorites
   */
  async addToFavorites(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: itemId } = validateId(req.params);

      const result = await this.itemService.addToFavorites(itemId, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Add to favorites error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Remove item from favorites
   */
  async removeFromFavorites(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: itemId } = validateId(req.params);

      const result = await this.itemService.removeFromFavorites(itemId, userId);

      res.json(result);
    } catch (error: any) {
      console.error('Remove from favorites error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: itemId } = validateId(req.params);

      // First verify ownership by trying to update (which checks ownership)
      const ownershipCheck = await this.itemService.updateItem(itemId, userId, { status: 'inactive' });

      if (!ownershipCheck.success) {
        return res.status(ownershipCheck.error === 'Item not found' ? 404 : 403).json(ownershipCheck);
      }

      res.json({
        success: true,
        message: 'Item deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete item error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get item analytics (for item owners)
   */
  async getItemAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: itemId } = validateId(req.params);

      const result = await this.itemService.getItemAnalytics(itemId, userId);

      if (!result.success) {
        return res.status(result.error?.includes('not found') ? 404 : 403).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get item analytics error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get all items (with pagination and basic filters)
   */
  async getAllItems(req: Request, res: Response) {
    try {
      const { page, limit } = validatePagination(req.query);
      const { categoryId, status, userId } = req.query;

      const filters: any = {
        is_active: true,
      };

      if (categoryId) filters.category_id = categoryId;
      if (status) filters.status = status;
      if (userId) filters.user_id = userId;

      const result = await this.itemService.findAllWithImages({
        page,
        limit,
        filters,
        orderBy: 'created_at',
        orderDirection: 'desc',
      });

      res.json(result);
    } catch (error: any) {
      console.error('Get all items error:', error);
      
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
   * Get popular items
   */
  async getPopularItems(req: Request, res: Response) {
    try {
      const { page, limit } = validatePagination(req.query);

      const result = await this.itemService.findAllWithImages({
        page,
        limit,
        filters: {
          is_active: true,
          status: 'available',
        },
        orderBy: 'booking_count',
        orderDirection: 'desc',
      });

      res.json(result);
    } catch (error: any) {
      console.error('Get popular items error:', error);
      
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
   * Get featured items (highest rated)
   */
  async getFeaturedItems(req: Request, res: Response) {
    try {
      const { page, limit } = validatePagination(req.query);

      const result = await this.itemService.findAllWithImages({
        page,
        limit,
        filters: {
          is_active: true,
          status: 'available',
        },
        orderBy: 'rating_average',
        orderDirection: 'desc',
      });

      res.json(result);
    } catch (error: any) {
      console.error('Get featured items error:', error);
      
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
}