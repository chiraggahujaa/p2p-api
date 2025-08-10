export type CityRecord = {
  name: string;
  latitude: number;
  longitude: number;
};

type OpenWeatherPlace = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

export class OpenWeatherCityProvider {
  private static readonly DEFAULT_BASE_URL = 'https://api.openweathermap.org/geo/1.0';

  /**
   * Search cities by name within India, returns minimal records
   * Docs: https://openweathermap.org/api/geocoding-api
   */
  public static async searchIndianCitiesByName(name: string, limit: number = 5): Promise<CityRecord[]> {
    const baseUrl = process.env.OPENWEATHER_BASE_URL || OpenWeatherCityProvider.DEFAULT_BASE_URL;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    console.log('apiKey', apiKey);
    if (!apiKey) {
      throw new Error('Missing OPENWEATHER_API_KEY');
    }

    const q = encodeURIComponent(`${name},IN`);
    const url = `${baseUrl}/direct?q=${q}&limit=${Math.min(Math.max(limit, 1), 10)}&appid=${apiKey}`;

    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      throw new Error(`OpenWeather fetch failed: ${resp.status} ${resp.statusText}`);
    }
    const json = (await resp.json()) as OpenWeatherPlace[];
    console.log('json', json);
    return (json || [])
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon) && typeof p.name === 'string')
      .map(p => ({ name: p.name, latitude: p.lat, longitude: p.lon }));
  }
}


