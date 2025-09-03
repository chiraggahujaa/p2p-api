import { Request, Response } from 'express';
import { CityService } from '../services/CityService.js';

export class CityController {
  static async listCities(req: Request, res: Response) {
    try {
      const _ = await (CityService as any).loadCities?.();

      const latRaw = req.query.lat as string | undefined;
      const lonRaw = req.query.lon as string | undefined;
      const prefer = (req.query.prefer as string | undefined) || undefined;

      let cities: string[];

      // Parse numbers safely
      const lat = latRaw !== undefined ? Number(latRaw) : undefined;
      const lon = lonRaw !== undefined ? Number(lonRaw) : undefined;

      const hasValidLatLon =
        lat !== undefined && lon !== undefined &&
        CityService.isValidLatitude(lat) && CityService.isValidLongitude(lon);

      if (hasValidLatLon) {
        cities = CityService.getCitiesSortedByProximity(lat as number, lon as number);
      } else if (prefer && prefer.trim().length > 0) {
        await (CityService as any).augmentWithPreferredIfMissing?.(prefer);
        cities = CityService.getCitiesWithPreferred(prefer);
      } else {
        cities = CityService.getAllCitiesAlphabetical();
      }

      // Idempotent, cacheable GET
      res.set('Cache-Control', 'public, max-age=3600');
      return res.status(200).json({ cities });
    } catch (error) {
      console.error('Cities endpoint error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Get coordinates for a city name
   */
  static async getCityCoordinates(req: Request, res: Response) {
    try {
      const cityName = req.params.name;
      
      if (!cityName || cityName.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'City name is required' 
        });
      }

      await (CityService as any).loadCities?.();
      await (CityService as any).augmentWithPreferredIfMissing?.(cityName.trim());
      
      const cityCoords = CityService.getCityCoordinates(cityName.trim());
      
      if (!cityCoords) {
        return res.status(404).json({ 
          success: false, 
          error: 'City not found' 
        });
      }

      res.set('Cache-Control', 'public, max-age=3600');
      return res.status(200).json({ 
        success: true,
        data: cityCoords
      });
    } catch (error) {
      console.error('City coordinates endpoint error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}


