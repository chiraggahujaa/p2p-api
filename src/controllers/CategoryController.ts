// Category controller

import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService.js';
import { createCategorySchema, updateCategorySchema } from '../validations/item.js';
import { validateId } from '../validations/common.js';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Get all categories with subcategories
   */
  async getAllCategories(req: Request, res: Response) {
    try {
      const includeSubcategories = req.query.includeSubcategories !== 'false';
      
      let result;
      if (req.query.hierarchical === 'true') {
        result = await this.categoryService.getAllCategoriesWithSubcategories();
      } else {
        result = await this.categoryService.getActiveCategories(includeSubcategories);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get all categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get category by ID
   */
  async getCategory(req: Request, res: Response) {
    try {
      const { id: categoryId } = validateId(req.params);

      const result = await this.categoryService.getCategoryWithRelations(categoryId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get category error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get subcategories
   */
  async getSubcategories(req: Request, res: Response) {
    try {
      const { id: parentCategoryId } = validateId(req.params);

      const result = await this.categoryService.getSubcategories(parentCategoryId);

      res.json(result);
    } catch (error: any) {
      console.error('Get subcategories error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get popular categories
   */
  async getPopularCategories(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.categoryService.getPopularCategories(limit);

      res.json(result);
    } catch (error: any) {
      console.error('Get popular categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Search categories
   */
  async searchCategories(req: Request, res: Response) {
    try {
      const { search } = req.query;
      if (!search || typeof search !== 'string' || search.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search term must be at least 2 characters long',
        });
      }

      const result = await this.categoryService.searchCategories(search.trim());

      res.json(result);
    } catch (error: any) {
      console.error('Search categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get category hierarchy (breadcrumb)
   */
  async getCategoryHierarchy(req: Request, res: Response) {
    try {
      const { id: categoryId } = validateId(req.params);

      const result = await this.categoryService.getCategoryHierarchy(categoryId);

      res.json(result);
    } catch (error: any) {
      console.error('Get category hierarchy error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Create category (admin only)
   */
  async createCategory(req: Request, res: Response) {
    try {
      // TODO: Add admin authorization check

      const validatedData = createCategorySchema.parse(req.body);

      const cleanData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== undefined)
      );

      const result = await this.categoryService.createCategory(cleanData as any);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Create category error:', error);
      
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
   * Update category (admin only)
   */
  async updateCategory(req: Request, res: Response) {
    try {
      // TODO: Add admin authorization check

      const { id: categoryId } = validateId(req.params);
      const validatedData = updateCategorySchema.parse(req.body);

      const cleanData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== undefined)
      );

      const result = await this.categoryService.updateCategory(categoryId, cleanData as any);

      if (!result.success) {
        return res.status(result.error === 'Category not found' ? 404 : 400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Update category error:', error);
      
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
}