import axios from "axios";


const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;
const BASE_URL = 'https://api.nasa.gov';

export const getHistoricalWeather = async (lat, lon, year) => {
    try {
        const validYear = parseInt(year);
        const currentYear = new Date().getFullYear();
        const maxYear = currentYear - 1;
        if (isNaN(validYear) || validYear < 1981 || validYear > maxYear) {
            console.error(`Invalid year: ${year}`);
            return null;
        }

        const startDate = `${year}`;
        const endDate = `${year}`;

        const latFixed = parseFloat(lat).toFixed(4);
        const lonFixed = parseFloat(lon).toFixed(4);

        const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR,RH2M,WS2M&community=RE&longitude=${lonFixed}&latitude=${latFixed}&start=${startDate}&end=${endDate}&format=JSON`;

        console.log('📡 NASA Request URL:', url);

        const response = await axios.get(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.data || !response.data.properties) {
            console.error('Invalid response from NASA API');
            return null;
        }

        const params = response.data.properties.parameter;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const temperature = params.T2M ? Object.values(params.T2M) : [];
        const precipitation = params.PRECTOTCORR ? Object.values(params.PRECTOTCORR) : [];
        const humidity = params.RH2M ? Object.values(params.RH2M) : [];
        const windSpeed = params.WS2M ? Object.values(params.WS2M) : [];

        if (temperature.length === 0) {
            console.warn('No data returned for year:', year);
            return null;
        }

        return { months, temperature, precipitation, humidity, windSpeed, year: validYear };

    } catch (error) {
        console.error('NASA API Error:', error);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            if (error.response.status === 422) {
                const msg = error.response.data?.messages?.join(' | ');
                console.error('422 Details:', msg);
            }
        }
        return null;
    }
};

export const getApod = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/planetary/apod`, {
      params: { api_key: NASA_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('APOD Error:', error);
    return null;
  }
};

// ඔබගේ අනෙකුත් NASA functions (Mars, NEO, Image search) මෙතනටම දාන්න
export const searchNasaImages = async (query) => {
  try {
    const response = await axios.get('https://images-api.nasa.gov/search', {
      params: { q: query, media_type: 'image' }
    });
    return response.data.collection.items;
  } catch (error) {
    console.error('Image Search Error:', error);
    return [];
  }
};