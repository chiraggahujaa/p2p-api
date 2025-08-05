// Analytics service for handling event-driven analytics
import { BaseService } from './BaseService.js';
import { supabaseAdmin } from '../utils/database.js';
import { AnalyticsEvent, ItemMetrics, ItemAnalyticsSummary } from '../types/item.js';
import { ApiResponse } from '../types/common.js';

export class AnalyticsService extends BaseService {
  constructor() {
    super('analytics_event');
  }

  /**
   * Record an analytics event (item view, booking, etc.)
   */
  async recordEvent(eventData: {
    eventType: string;
    itemId?: string;
    userId?: string;
    sessionId?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    additionalData?: Record<string, any>;
  }): Promise<ApiResponse<AnalyticsEvent>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('record_analytics_event', {
          p_event_type: eventData.eventType,
          p_item_id: eventData.itemId || null,
          p_user_id: eventData.userId || null,
          p_session_id: eventData.sessionId || null,
          p_device_id: eventData.deviceId || null,
          p_ip_address: eventData.ipAddress || null,
          p_user_agent: eventData.userAgent || null,
          p_referrer: eventData.referrer || null,
          p_additional_data: eventData.additionalData || null,
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: { id: data, ...eventData } as AnalyticsEvent,
        message: 'Analytics event recorded successfully',
      };
    } catch (error) {
      console.error('Error recording analytics event:', error);
      throw error;
    }
  }

  /**
   * Get real-time view count for an item
   */
  async getItemViewCount(
    itemId: string, 
    days: number = 30
  ): Promise<ApiResponse<{ count: number }>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_item_view_count', {
          p_item_id: itemId,
          p_days: days,
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: { count: data || 0 },
      };
    } catch (error) {
      console.error('Error getting item view count:', error);
      throw error;
    }
  }

  /**
   * Get real-time booking count for an item
   */
  async getItemBookingCount(
    itemId: string, 
    days: number = 30
  ): Promise<ApiResponse<{ count: number }>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_item_booking_count', {
          p_item_id: itemId,
          p_days: days,
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: { count: data || 0 },
      };
    } catch (error) {
      console.error('Error getting item booking count:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics summary for an item
   */
  async getItemAnalyticsSummary(
    itemId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<ItemAnalyticsSummary>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_item_analytics_summary', {
          p_item_id: itemId,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data?.[0] || {
          totalViews: 0,
          uniqueViews: 0,
          totalBookings: 0,
          conversionRate: 0,
          avgDailyViews: 0,
          trendDirection: 'insufficientData',
        },
      };
    } catch (error) {
      console.error('Error getting item analytics summary:', error);
      throw error;
    }
  }

  /**
   * Get item metrics for a specific date range
   */
  async getItemMetrics(
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<ItemMetrics[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('item_metric')
        .select('*')
        .eq('item_id', itemId)
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting item metrics:', error);
      throw error;
    }
  }

  /**
   * Get popular items from materialized view
   */
  async getPopularItems(limit: number = 50): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('popular_items_7d')
        .select('*')
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting popular items:', error);
      throw error;
    }
  }

  /**
   * Get analytics events for an item (for debugging/detailed analysis)
   */
  async getItemEvents(
    itemId: string,
    eventType?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ApiResponse<AnalyticsEvent[]>> {
    try {
      let query = supabaseAdmin
        .from('analytics_event')
        .select('*, item:item(title), user:users(full_name)')
        .eq('item_id', itemId)
        .order('event_timestamp', { ascending: false });

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting item events:', error);
      throw error;
    }
  }

  /**
   * Process metrics for a specific date (called by scheduled jobs)
   */
  async processMetricsForDate(targetDate?: string): Promise<ApiResponse<{ processed_items: number }>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('update_item_metrics_for_date', {
          p_target_date: targetDate || null,
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: { processed_items: data || 0 },
        message: `Processed metrics for ${data || 0} items`,
      };
    } catch (error) {
      console.error('Error processing metrics:', error);
      throw error;
    }
  }

  /**
   * Refresh popular items materialized view
   */
  async refreshPopularItems(): Promise<ApiResponse<{ message: string }>> {
    try {
      const { error } = await supabaseAdmin
        .rpc('refresh_popular_items');

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: { message: 'Popular items view refreshed successfully' },
      };
    } catch (error) {
      console.error('Error refreshing popular items:', error);
      throw error;
    }
  }

  /**
   * Record item view event (convenience method)
   */
  async recordItemView(
    itemId: string,
    userId?: string,
    sessionId?: string,
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string,
    sessionDuration?: number
  ): Promise<ApiResponse<AnalyticsEvent>> {
    const eventData: any = {
      eventType: 'item_view',
      itemId: itemId,
    };

    if (userId) eventData.userId = userId;
    if (sessionId) eventData.sessionId = sessionId;
    if (deviceId) eventData.deviceId = deviceId;
    if (ipAddress) eventData.ipAddress = ipAddress;
    if (userAgent) eventData.userAgent = userAgent;
    if (referrer) eventData.referrer = referrer;
    if (sessionDuration) eventData.additionalData = { sessionDuration: sessionDuration };

    return this.recordEvent(eventData);
  }

  /**
   * Get analytics dashboard data for multiple items (e.g., for a user's items)
   */
  async getItemsDashboard(
    itemIds: string[],
    days: number = 30
  ): Promise<ApiResponse<any[]>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabaseAdmin
        .rpc('get_items_dashboard', {
          p_item_ids: itemIds,
          p_start_date: startDate.toISOString().split('T')[0],
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting items dashboard:', error);
      throw error;
    }
  }
}