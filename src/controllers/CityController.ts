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
}


