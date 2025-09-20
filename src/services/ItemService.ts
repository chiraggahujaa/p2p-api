// Item service with specialized operations

import { BaseService, QueryOptions } from "./BaseService.js";
import { supabaseAdmin } from "../utils/database.js";
import {
  Item,
  CreateItemDto,
  UpdateItemDto,
  ItemSearchFilters,
  CreateItemDtoWithAddress,
} from "../types/item.js";
import { ApiResponse, PaginatedResponse } from "../types/common.js";
import { DataMapper } from "../utils/mappers.js";
import { LocationService, CreateLocationDto } from "./LocationService.js";
import { ValidationHelper } from "../utils/validation.js";
import { ItemImageService } from "./ItemImageService.js";

export class ItemService extends BaseService {
  private itemImageService: ItemImageService;

  constructor() {
    super('item');
    this.itemImageService = new ItemImageService();
  }

  /**
   * Create a new item
   */
  async createItem(
    userId: string,
    itemData: CreateItemDto
  ): Promise<ApiResponse<Item>>;
  async createItem(
    userId: string,
    itemData: CreateItemDtoWithAddress
  ): Promise<ApiResponse<Item>>;
  async createItem(
    userId: string,
    itemData: CreateItemDto | CreateItemDtoWithAddress
  ): Promise<ApiResponse<Item>> {
    try {
      let locationId: string;

      // Check if this is CreateItemDtoWithAddress (has addressData)
      if ("addressData" in itemData) {
        // Resolve location from address data
        const locationResult = await LocationService.resolveFromAddress(
          itemData.addressData
        );
        if (!locationResult.success) {
          return {
            success: false,
            error:
              locationResult.error || "Failed to resolve location from address",
          };
        }
        locationId = locationResult.data!.id;
      } else {
        // Use provided locationId
        locationId = itemData.locationId;
      }

      const itemCreateData = DataMapper.toSnakeCase({
        userId,
        title: itemData.title,
        description: itemData.description,
        categoryId: itemData.categoryId,
        condition: itemData.condition,
        securityAmount: itemData.securityAmount ?? 0,
        rentPricePerDay: itemData.rentPricePerDay,
        locationId: locationId,
        deliveryMode: itemData.deliveryMode || "none",
        minRentalDays: itemData.minRentalDays || 1,
        maxRentalDays: itemData.maxRentalDays || 30,
        isNegotiable: itemData.isNegotiable || false,
        tags: itemData.tags || [],
        status: "available",
        ratingAverage: 0,
        ratingCount: 0,
        isActive: true,
      });

      const result = await this.create(itemCreateData);

      if (!result.success) {
        return result;
      }

      if (itemData.imageUrls && itemData.imageUrls.length > 0) {
        const imageResult = await this.itemImageService.createItemImages(
          result.data.id,
          itemData.imageUrls
        );
        if (!imageResult.success) {
          return {
            success: false,
            error: "Item created but failed to save images",
          };
        }
      }

      return result;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  /**
   * Update item (with cache invalidation)
   */
  async updateItem(
    itemId: string,
    userId: string,
    itemData: UpdateItemDto
  ): Promise<ApiResponse<Item>> {
    try {
      // First verify ownership
      const ownershipCheck = await this.verifyOwnership(itemId, userId);
      if (!ownershipCheck.success) {
        return {
          success: false,
          error: ownershipCheck.error || "Ownership verification failed",
        };
      }

      const result = await this.update(itemId, itemData);

      return result;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  /**
   * Get item with full details
   */
  async getItemWithDetails(itemId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from("item")
        .select(
          `
          id, title, description, condition, security_amount, rent_price_per_day,
          delivery_mode, min_rental_days, max_rental_days, is_negotiable, tags,
          status, rating_average, rating_count, created_at, updated_at,
          category:categories!inner(id, category_name, description),
          location:location!inner(id, city, state, latitude, longitude, address_line),
          owner:users!inner(id, full_name, avatar_url, trust_score, is_verified),
          images:item_image!left(
            file:file!inner(url, file_type, alt_text),
            is_primary,
            display_order
          ),
          reviews:item_review!left(
            rating,
            review_text,
            is_verified,
            created_at,
            user:users!inner(full_name, avatar_url)
          )
        `
        )
        .eq("id", itemId)
        .eq("is_active", true)
        .order("display_order", { ascending: true, foreignTable: "item_image" })
        .order("created_at", { ascending: false, foreignTable: "item_review" })
        .limit(5, { foreignTable: "item_review" })
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            success: false,
            error: "Item not found",
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      // Sort images by primary first, then by display order
      if (data.images?.length) {
        data.images.sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return a.display_order - b.display_order;
        });
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data),
      };
    } catch (error) {
      console.error("Error getting item details:", error);
      throw error;
    }
  }

  /**
   * Search items with optimized single database function call
   */
  async searchItems(
    filters: ItemSearchFilters
  ): Promise<PaginatedResponse<any>> {
    try {
      const {
        categoryId,
        city,
        location,
        priceRange,
        condition,
        deliveryMode,
        availability,
        searchTerm,
        sortBy = "newest",
        page = 1,
        limit = 20,
      } = filters;

      const offset = (page - 1) * limit;
      
      // Use the optimized database function for all searches
      const { data, error } = await supabaseAdmin.rpc(
        "search_items_optimized",
        {
          user_lat: location?.latitude || null,
          user_lon: location?.longitude || null,
          radius_km: location?.radius || 10,
          category_filter: categoryId || null,
          city_filter: city || null,
          price_min: priceRange?.min || null,
          price_max: priceRange?.max || null,
          search_term: searchTerm || null,
          condition_filter:
            condition && condition.length > 0 ? condition : null,
          delivery_mode_filter:
            deliveryMode && deliveryMode.length > 0 ? deliveryMode : null,
          sort_by: sortBy,
          page_limit: limit,
          page_offset: offset,
        }
      );

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const results = data || [];
      const totalCount = results.length > 0 ? results[0].total_count : 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Remove total_count from individual items
      const cleanedData = results.map((item: any) => {
        const { total_count, ...cleanItem } = item;
        return cleanItem;
      });

      return {
        success: true,
        data: DataMapper.toCamelCase(cleanedData),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error searching items:", error);
      throw error;
    }
  }


  /**
   * Get similar items based on category and location
   */
  async getSimilarItems(
    itemId: string,
    limit: number = 6
  ): Promise<ApiResponse<any[]>> {
    try {
      // First get only the category_id of the current item
      const { data: currentItem, error: currentError } = await supabaseAdmin
        .from("item")
        .select("category_id")
        .eq("id", itemId)
        .single();

      if (currentError || !currentItem) {
        return { success: false, error: "Item not found" };
      }

      const { data, error } = await supabaseAdmin
        .from("item")
        .select(
          `
          id, title, description, condition, rent_price_per_day,
          rating_average, rating_count, created_at,
          category:categories!inner(id, category_name),
          location:location!inner(id, city, state),
          owner:users!inner(id, full_name, avatar_url, trust_score),
          images:item_image!left(
            file:file!inner(url),
            is_primary
          )
        `
        )
        .eq("category_id", currentItem.category_id)
        .eq("is_active", true)
        .eq("status", "available")
        .neq("id", itemId)
        .order("rating_average", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1, { foreignTable: "item_image" })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data || []),
      };
    } catch (error) {
      console.error("Error getting similar items:", error);
      throw error;
    }
  }

  /**
   * Check item availability for given dates
   */
  async checkAvailability(
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { count, error } = await supabaseAdmin
        .from("booking")
        .select("*", { count: "exact", head: true })
        .eq("item_id", itemId)
        .in("booking_status", ["confirmed", "in_progress"])
        .not("start_date", "gt", endDate)
        .not("end_date", "lt", startDate);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const isAvailable = !count || count === 0;
      return {
        success: true,
        data: isAvailable,
        message: isAvailable
          ? "Item is available for the selected dates"
          : "Item is not available for the selected dates",
      };
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  }

  /**
   * Add item to user favorites
   */
  async addToFavorites(
    itemId: string,
    userId: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from("user_favorite")
        .insert({
          user_id: userId,
          item_id: itemId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          return {
            success: false,
            error: "Item is already in favorites",
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data),
        message: "Item added to favorites",
      };
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  }

  /**
   * Remove item from user favorites
   */
  async removeFromFavorites(
    itemId: string,
    userId: string
  ): Promise<ApiResponse<any>> {
    try {
      const { error } = await supabaseAdmin
        .from("user_favorite")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", itemId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        message: "Item removed from favorites",
      };
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  }

  /**
   * Record item view (fire and forget)
   */
  async recordView(
    itemId: string,
    userId?: string,
    deviceId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Insert view record (fire and forget)
      supabaseAdmin
        .from("item_view")
        .insert({
          item_id: itemId,
          user_id: userId || null,
          device_id: deviceId || null,
          ip_address: metadata?.ip_address || null,
          user_agent: metadata?.user_agent || null,
          referrer: metadata?.referrer || null,
        });
    } catch (error) {
      // Don't throw error for view recording failures
      console.warn("Error recording item view:", error);
    }
  }

  /**
   * Get item analytics with parallel queries
   */
  async getItemAnalytics(
    itemId: string,
    userId: string
  ): Promise<ApiResponse<any>> {
    try {
      // Verify ownership
      const ownershipCheck = await this.verifyOwnership(itemId, userId);
      if (!ownershipCheck.success) {
        return ownershipCheck;
      }

      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [viewsData, bookingsData, reviewsData] = await Promise.all([
        // Count views in last 30 days
        supabaseAdmin
          .from("item_view")
          .select("*", { count: "exact", head: true })
          .eq("item_id", itemId)
          .gte("viewed_at", thirtyDaysAgo),

        // Bookings data with aggregation
        supabaseAdmin
          .from("booking")
          .select("booking_status, total_rent")
          .eq("item_id", itemId),

        // Reviews count and average rating
        supabaseAdmin
          .from("item_review")
          .select("rating")
          .eq("item_id", itemId),
      ]);

      const completedBookings =
        bookingsData.data?.filter((b) => b.booking_status === "completed") ||
        [];
      const totalEarnings =
        bookingsData.data?.reduce((sum, b) => sum + (b.total_rent || 0), 0) ||
        0;
      const avgRating = reviewsData.data?.length
        ? reviewsData.data.reduce((sum, r) => sum + r.rating, 0) /
          reviewsData.data.length
        : 0;

      const analytics = {
        totalViews: viewsData.count || 0,
        totalBookings: bookingsData.data?.length || 0,
        completedBookings: completedBookings.length,
        totalEarnings,
        averageRating: Math.round(avgRating * 100) / 100,
        totalReviews: reviewsData.data?.length || 0,
        conversionRate: viewsData.count
          ? Math.round(
              ((bookingsData.data?.length || 0) / viewsData.count) * 10000
            ) / 100
          : 0,
      };

      return {
        success: true,
        data: DataMapper.toCamelCase(analytics),
      };
    } catch (error) {
      console.error("Error getting item analytics:", error);
      throw error;
    }
  }

  /**
   * Verify item ownership
   */
  private async verifyOwnership(
    itemId: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabaseAdmin
        .from("item")
        .select("user_id")
        .eq("id", itemId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            success: false,
            error: "Item not found",
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (data.user_id !== userId) {
        return {
          success: false,
          error: "You do not have permission to modify this item",
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error("Error verifying ownership:", error);
      throw error;
    }
  }

  /**
   * Find all items with images and relations for list views
   */
  async findAllWithImages(
    options: QueryOptions
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page, limit, filters, orderBy, orderDirection } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from("item")
        .select(
          `
          id, title, description, condition, rent_price_per_day,
          rating_average, rating_count, created_at, is_active, status,
          category:categories!inner(id, category_name),
          location:location!inner(id, city, state),
          owner:users!inner(id, full_name, avatar_url, trust_score),
          images:item_image!left(
            file:file!inner(url, file_type),
            is_primary,
            display_order
          )
        `,
          { count: "exact" }
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true, foreignTable: "item_image" })
        .limit(1, { foreignTable: "item_image" });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending: orderDirection === "asc" });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);
      return {
        success: true,
        data: DataMapper.toCamelCase(data || []),
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
      console.error(`Error in ${this.tableName} findAllWithImages:`, error);
      throw error;
    }
  }

  /**
   * Get popular items
   */
  async getPopularItems(limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from("item")
        .select(
          `
          id, title, description, condition, rent_price_per_day,
          rating_average, rating_count, created_at,
          category:categories!inner(id, category_name),
          location:location!inner(id, city, state),
          owner:users!inner(id, full_name, avatar_url, trust_score),
          images:item_image!left(
            file:file!inner(url),
            is_primary
          )
        `
        )
        .eq("is_active", true)
        .eq("status", "available")
        .gte("rating_count", 1)
        .order("rating_average", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(1, { foreignTable: "item_image" })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data || []),
      };
    } catch (error) {
      console.error("Error getting popular items:", error);
      throw error;
    }
  }
}