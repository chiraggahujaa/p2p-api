import { BaseService } from './BaseService.js';
import { supabaseAdmin } from '../utils/database.js';
import { ApiResponse } from '../types/common.js';
import { DataMapper } from '../utils/mappers.js';

export interface ItemImageData {
  id?: string;
  itemId: string;
  fileId: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export class ItemImageService extends BaseService {
  constructor() {
    super('item_image');
  }

  async createItemImages(itemId: string, imageUrls: string[]): Promise<ApiResponse<any[]>> {
    if (!imageUrls || imageUrls.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    try {
      // Get file IDs from URLs
      const fileIds: string[] = [];
      
      for (const url of imageUrls) {
        const fileResult = await this.getFileIdFromUrl(url);
        if (fileResult) {
          fileIds.push(fileResult);
        } else {
          console.warn(`Could not find file ID for URL: ${url}`);
        }
      }

      if (fileIds.length === 0) {
        return {
          success: false,
          error: 'No valid file IDs found from provided URLs',
        };
      }

      const itemImages = fileIds.map((fileId, index) => ({
        item_id: itemId,
        file_id: fileId,
        is_primary: index === 0,
        display_order: index + 1,
      }));

      const { data, error } = await supabaseAdmin
        .from('item_image')
        .insert(itemImages)
        .select();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data || []),
      };
    } catch (error) {
      console.error('Error creating item images:', error);
      throw error;
    }
  }

  private async getFileIdFromUrl(url: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('file')
        .select('id')
        .eq('url', url)
        .single();

      if (error || !data) {
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error getting file ID from URL:', error);
      return null;
    }
  }

  async updateItemImages(itemId: string, imageUrls: string[]): Promise<ApiResponse<any[]>> {
    try {
      await supabaseAdmin
        .from('item_image')
        .delete()
        .eq('item_id', itemId);

      return await this.createItemImages(itemId, imageUrls);
    } catch (error) {
      console.error('Error updating item images:', error);
      throw error;
    }
  }

  async deleteItemImages(itemId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabaseAdmin
        .from('item_image')
        .delete()
        .eq('item_id', itemId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Error deleting item images:', error);
      throw error;
    }
  }

  async getItemImages(itemId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('item_image')
        .select(`
          *,
          file:file(*)
        `)
        .eq('item_id', itemId)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: DataMapper.toCamelCase(data || []),
      };
    } catch (error) {
      console.error('Error getting item images:', error);
      throw error;
    }
  }
}