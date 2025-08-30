import { Request, Response } from 'express';
import { AddressService } from '../services/AddressService.js';
import { addressSearchSchema } from '../validations/address.js';

export class AddressController {
  private addressService: typeof AddressService;

  constructor() {
    this.addressService = AddressService;
  }

  /**
   * Search addresses using external geocoding service
   * GET /api/addresses/search?query=mumbai&limit=10&countryCode=IN
   */
  async searchAddresses(req: Request, res: Response) {
    try {
      // Validate query parameters
      const validatedQuery = addressSearchSchema.parse({
        query: req.query.query,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        countryCode: req.query.countryCode || 'IN',
        acceptLanguage: req.query.acceptLanguage || 'en',
      });

      const result = await this.addressService.searchAddresses(validatedQuery);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Address search controller error:', error);
      
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
   * Get address suggestions for autocomplete
   * GET /api/addresses/suggestions?query=mumb&limit=5
   */
  async getAddressSuggestions(req: Request, res: Response) {
    try {
      const query = req.query.query as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      // Basic validation for suggestions endpoint
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter must be at least 2 characters long',
        });
      }

      if (limit < 1 || limit > 10) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 10',
        });
      }

      const result = await this.addressService.getAddressSuggestions(query, limit);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Address suggestions controller error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}