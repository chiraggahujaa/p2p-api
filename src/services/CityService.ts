import type { Request } from 'express';
import { OpenWeatherCityProvider, type CityRecord as OpenWeatherCityRecord } from './cityProviders/OpenWeatherCityProvider.js';
import indianCitiesData from '../data/indian-cities.json';

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

  private static readonly comprehensiveCities: City[] = indianCitiesData as City[];

  private static async loadCities(): Promise<City[]> {
    const now = Date.now();
    if (this.cachedCities && this.cachedAt && now - this.cachedAt < this.cacheTtlMs) {
      return this.cachedCities;
    }

    this.cachedCities = this.comprehensiveCities;
    this.cachedAt = now;
    return this.comprehensiveCities;
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
    const names = (this.cachedCities ?? this.comprehensiveCities).map(c => c.name.toLowerCase());
    if (names.includes(prefer.trim().toLowerCase())) return;
    try {
      const found = await OpenWeatherCityProvider.searchIndianCitiesByName(prefer.trim(), 1);
      if (found.length > 0) {
        const merged = this.normalizeRecords([...(this.cachedCities ?? this.comprehensiveCities), ...found]);
        this.cachedCities = merged;
        this.cachedAt = Date.now();
      }
    } catch (err) {
        console.error('open weather api error ', err);
    }
  }

  public static getAllCitiesAlphabetical(): string[] {
    const source = this.cachedCities ?? this.comprehensiveCities;
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

    const source = this.cachedCities ?? this.comprehensiveCities;
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
    const source = this.cachedCities ?? this.comprehensiveCities;
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


