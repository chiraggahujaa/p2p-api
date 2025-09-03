import type { Request } from 'express';
import { OpenWeatherCityProvider, type CityRecord as OpenWeatherCityRecord } from './cityProviders/OpenWeatherCityProvider.js';

type City = {
  name: string;
  latitude: number;
  longitude: number;
};

export class CityService {
  // In-memory cache for fetched cities
  private static cachedAt: number | null = null;
  private static cacheTtlMs = Number(process.env.CITIES_CACHE_TTL_MS ?? `${60 * 60 * 1000}`); // default 1h
  private static cachedCities: City[] | null = null;

  private static readonly fallbackCities: City[] = [
    { name: 'New Delhi', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Pune', latitude: 18.5204, longitude: 73.8567 },
    { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
    { name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
    { name: 'Surat', latitude: 21.1702, longitude: 72.8311 },
    { name: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
    { name: 'Kanpur', latitude: 26.4499, longitude: 80.3319 },
    { name: 'Nagpur', latitude: 21.1458, longitude: 79.0882 },
    { name: 'Indore', latitude: 22.7196, longitude: 75.8577 },
    { name: 'Thane', latitude: 19.2183, longitude: 72.9781 },
    { name: 'Bhopal', latitude: 23.2599, longitude: 77.4126 },
    { name: 'Visakhapatnam', latitude: 17.6868, longitude: 83.2185 },
    { name: 'Patna', latitude: 25.5941, longitude: 85.1376 },
    { name: 'Vadodara', latitude: 22.3072, longitude: 73.1812 },
    { name: 'Ghaziabad', latitude: 28.6692, longitude: 77.4538 },
    { name: 'Agra', latitude: 27.1767, longitude: 78.0081 },
    { name: 'Noida', latitude: 28.5355, longitude: 77.3910 },
    { name: 'Gurgaon', latitude: 28.4595, longitude: 77.0266 },
    { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { name: 'Kochi', latitude: 9.9312, longitude: 76.2673 },
  ];

  private static async loadCities(): Promise<City[]> {
    const now = Date.now();
    if (this.cachedCities && this.cachedAt && now - this.cachedAt < this.cacheTtlMs) {
      return this.cachedCities;
    }

    // Without GeoDB bulk listing, default to fallback and augment on-demand via OpenWeather
    this.cachedCities = this.fallbackCities;
    this.cachedAt = now;
    return this.fallbackCities;
  }

  private static normalizeRecords(records: Array<OpenWeatherCityRecord | City>): City[] {
    const seen = new Set<string>();
    const out: City[] = [];
    for (const r of records) {
      const key = r.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name: r.name.trim(), latitude: r.latitude, longitude: r.longitude });
    }
    return out;
  }

  public static async augmentWithPreferredIfMissing(prefer?: string): Promise<void> {
    if (!prefer || !prefer.trim()) return;
    const names = (this.cachedCities ?? this.fallbackCities).map(c => c.name.toLowerCase());
    if (names.includes(prefer.trim().toLowerCase())) return;
    try {
      const found = await OpenWeatherCityProvider.searchIndianCitiesByName(prefer.trim(), 1);
      if (found.length > 0) {
        const merged = this.normalizeRecords([...(this.cachedCities ?? this.fallbackCities), ...found]);
        this.cachedCities = merged;
        this.cachedAt = Date.now();
      }
    } catch (err) {
        console.error('open weather api error ', err);
    }
  }

  public static getAllCitiesAlphabetical(): string[] {
    const source = this.cachedCities ?? this.fallbackCities;
    return [...source].map(c => c.name).sort((a, b) => a.localeCompare(b));
  }

  public static isValidLatitude(lat: number): boolean {
    return Number.isFinite(lat) && lat >= -90 && lat <= 90;
  }

  public static isValidLongitude(lon: number): boolean {
    return Number.isFinite(lon) && lon >= -180 && lon <= 180;
  }

  public static getNearestCity(lat: number, lon: number): City | null {
    if (!this.isValidLatitude(lat) || !this.isValidLongitude(lon)) {
      return null;
    }

    const source = this.cachedCities ?? this.fallbackCities;
    let nearest: City | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const city of source) {
      const d = this.haversineDistance(lat, lon, city.latitude, city.longitude);
      if (d < bestDistance) {
        bestDistance = d;
        nearest = city;
      }
    }
    return nearest;
  }

  public static getCitiesSortedByProximity(lat: number, lon: number): string[] {
    const nearest = this.getNearestCity(lat, lon);
    const names = this.getAllCitiesAlphabetical();
    if (!nearest) return names;

    const withoutNearest = names.filter(n => n !== nearest!.name);
    return [nearest.name, ...withoutNearest];
  }

  public static getCitiesWithPreferred(prefer: string): string[] {
    const names = this.getAllCitiesAlphabetical();
    const preferLower = prefer.trim().toLowerCase();
    const match = names.find(n => n.toLowerCase() === preferLower);
    if (!match) return names;
    return [match, ...names.filter(n => n !== match)];
  }

  public static getCityCoordinates(cityName: string): City | null {
    const source = this.cachedCities ?? this.fallbackCities;
    const cityNameLower = cityName.trim().toLowerCase();
    
    const found = source.find(city => 
      city.name.toLowerCase() === cityNameLower
    );
    
    return found || null;
  }

  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}


