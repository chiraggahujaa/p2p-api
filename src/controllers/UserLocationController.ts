import { Request, Response } from 'express';
import { UserLocationService } from '../services/UserLocationService.js';
import { validateId, validatePagination } from '../validations/common.js';
import { createUserLocationSchema, updateUserLocationSchema, createAndAddLocationSchema } from '../validations/userLocation.js';
import { ZodError } from 'zod';

export class UserLocationController {

  /**
   * GET /api/users/:userId/locations
   * Get all locations for a user
   */
  async getUserLocations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // Validate pagination parameters
      const { page, limit } = validatePagination(req.query);
      const result = await UserLocationService.getUserLocations(userId, page, limit);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Get user locations error:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters',
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
   * GET /api/users/me/locations/default
   * Get user's default location
   */
  async getDefaultLocation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const result = await UserLocationService.getDefaultLocation(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Get default location error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/users/me/locations
   * Add existing location to user's address book
   */
  async addLocationToUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const validatedData = createUserLocationSchema.parse(req.body);
      const result = await UserLocationService.addLocationToUser(userId, validatedData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Add location to user error:', error);
      
      if (error instanceof ZodError) {
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
   * POST /api/users/me/locations/create-and-add
   * Create new location and add to user's address book
   */
  async createAndAddLocation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const validatedData = createAndAddLocationSchema.parse(req.body);
      const { location, label, isDefault } = validatedData;

      const result = await UserLocationService.createAndAddLocation(
        userId,
        location,
        label,
        isDefault
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Create and add location error:', error);
      
      if (error instanceof ZodError) {
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
   * PUT /api/users/me/locations/:userLocationId
   * Update user location (label, default status, and location details)
   */
  async updateUserLocation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: userLocationId } = validateId({ id: req.params.userLocationId });

      const parsedData = updateUserLocationSchema.parse(req.body);
      
      // Filter out undefined values for exactOptionalPropertyTypes
      const validatedData: any = {};
      if (parsedData.location !== undefined) {
        validatedData.location = parsedData.location;
      }
      if (parsedData.isDefault !== undefined) {
        validatedData.isDefault = parsedData.isDefault;
      }
      if (parsedData.label !== undefined) {
        validatedData.label = parsedData.label;
      }
      
      // Use the new service method that handles location updates
      const result = await UserLocationService.updateUserLocationWithLocationDetails(
        userId,
        userLocationId,
        validatedData
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Update user location error:', error);
      
      if (error instanceof ZodError) {
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
   * DELETE /api/users/me/locations/:userLocationId
   * Remove location from user's address book
   */
  async removeUserLocation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: userLocationId } = validateId({ id: req.params.userLocationId });

      const result = await UserLocationService.removeUserLocation(
        userId,
        userLocationId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Remove user location error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}