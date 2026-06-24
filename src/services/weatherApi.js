import axios from "axios";

const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getCurrentWeather = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode&timezone=auto`;
    const response = await axios.get(url, { timeout: 30000 });
    
    if (!response.data || !response.data.current) {
      console.error('Invalid response from Open-Meteo');
      return null;
    }

    const current = response.data.current;
    const weatherCode = current.weathercode;
    const weatherDescription = getWeatherDescription(weatherCode);
    
    return {
      main: {
        temp: current.temperature_2m,
        humidity: current.relativehumidity_2m,
        temp_min: current.temperature_2m - 2,
        temp_max: current.temperature_2m + 2
      },
      wind: {
        speed: current.windspeed_10m
      },
      weather: [{
        description: weatherDescription,
        icon: getWeatherIcon(weatherCode)
      }]
    };
  } catch (error) {
    console.error('Open-Meteo API Error:', error);
    return null;
  }
};

function getWeatherDescription(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Unknown';
}

function getWeatherIcon(code) {
  if (code === 0) return '01d';
  if (code === 1) return '02d';
  if (code === 2 || code === 3) return '03d';
  if (code >= 51 && code <= 55) return '09d';
  if (code >= 61 && code <= 65) return '10d';
  if (code >= 71 && code <= 75) return '13d';
  if (code >= 80 && code <= 82) return '09d';
  if (code >= 95) return '11d';
  return '01d';
}

export const getWeatherByCity = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Weather API Error:', error);
    return null;
  }
};

export const getWeatherByCoords = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat: lat,
        lon: lon,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Weather API Error:', error);
    return null;
  }
};