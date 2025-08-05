// Category service with specialized operations

import { BaseService } from './BaseService.js';
import { supabaseAdmin } from '../utils/database.js';
import { Category } from '../types/item.js';
import { ApiResponse, PaginatedResponse } from '../types/common.js';

export class CategoryService extends BaseService {
  constructor() {
    super('categories');
  }

  /**
   * Get all categories with subcategories
   */
  async getAllCategoriesWithSubcategories(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          subcategories:d_categories!parent_category_id(*)
        `)
        .is('parent_category_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting categories with subcategories:', error);
      throw error;
    }
  }

  /**
   * Get all active categories (flat list)
   */
  async getActiveCategories(includeSubcategories: boolean = true): Promise<ApiResponse<Category[]>> {
    try {
      let query = supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (!includeSubcategories) {
        query = query.is('parent_category_id', null);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting active categories:', error);
      throw error;
    }
  }

  /**
   * Get subcategories for a parent category
   */
  async getSubcategories(parentCategoryId: string): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('parent_category_id', parentCategoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting subcategories:', error);
      throw error;
    }
  }

  /**
   * Get category with its parent and subcategories
   */
  async getCategoryWithRelations(categoryId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          parent_category:parent_category_id(*),
          subcategories:d_categories!parent_category_id(*)
        `)
        .eq('id', categoryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Category not found',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting category with relations:', error);
      throw error;
    }
  }

  /**
   * Get popular categories based on item count
   */
  async getPopularCategories(limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_popular_categories', { category_limit: limit });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting popular categories:', error);
      // Fallback to regular category listing if function doesn't exist
      const fallbackResult = await this.getActiveCategories(false);
      return fallbackResult;
    }
  }

  /**
   * Search categories by name
   */
  async searchCategories(searchTerm: string): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .ilike('category_name', `%${searchTerm}%`)
        .eq('is_active', true)
        .order('category_name', { ascending: true })
        .limit(50);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: {
    categoryName: string;
    description?: string;
    iconUrl?: string;
    bannerUrl?: string;
    parentCategoryId?: string;
    sortOrder?: number;
  }): Promise<ApiResponse<Category>> {
    try {
      const result = await this.create({
        category_name: categoryData.categoryName,
        description: categoryData.description,
        icon_url: categoryData.iconUrl,
        banner_url: categoryData.bannerUrl,
        parent_category_id: categoryData.parentCategoryId,
        is_active: true,
        sort_order: categoryData.sortOrder || 0,
      });

      return result;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    categoryData: {
      categoryName?: string;
      description?: string;
      iconUrl?: string;
      bannerUrl?: string;
      parentCategoryId?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<Category>> {
    try {
      const result = await this.update(categoryId, {
        category_name: categoryData.categoryName,
        description: categoryData.description,
        icon_url: categoryData.iconUrl,
        banner_url: categoryData.bannerUrl,
        parent_category_id: categoryData.parentCategoryId,
        sort_order: categoryData.sortOrder,
        is_active: categoryData.isActive,
      });
      return result;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Get category hierarchy (breadcrumb)
   */
  async getCategoryHierarchy(categoryId: string): Promise<ApiResponse<Category[]>> {
    try {
      const hierarchy: Category[] = [];
      let currentCategoryId = categoryId;

      while (currentCategoryId) {
        const { data, error } = await supabaseAdmin
          .from('categories')
          .select('*, parent_category:parent_category_id(*)')
          .eq('id', currentCategoryId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            break;
          }
          throw new Error(`Database error: ${error.message}`);
        }

        hierarchy.unshift(data);
        currentCategoryId = data.parent_category_id;
      }

      return {
        success: true,
        data: hierarchy,
      };
    } catch (error) {
      console.error('Error getting category hierarchy:', error);
      throw error;
    }
  }
}