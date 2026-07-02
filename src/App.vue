<template>
  <div id="app" class="">
    <!-- Hero Section (Static) -->
    <AnimatedHero />

    <!-- Planet Tour (Static) -->
    <FullscreenGallery />

    <!-- Main Dashboard Content -->
    <header class="max-w-[1200px] mx-auto mb-10 text-center">
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
        NASA POWER Weather Dashboard
      </h1>
      <p class="text-slate-500 mt-2 font-medium">Advanced Meteorological Data Analysis</p>
    </header>

    <main class="max-w-[1200px] mx-auto space-y-10">
      <!-- Top Section: Globe & Current Weather -->
      <div class="flex flex-col lg:flex-row gap-8 items-stretch">
        <!-- Globe Card -->
        <div class="lg:w-3/5 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/50 border border-blue-50/50 overflow-hidden">
          <div class="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
            <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">Interactive Satellite View</span>
            <div class="flex gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <div class="w-3 h-3 rounded-full bg-amber-400"></div>
              <div class="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>
          <WorldGlobe @country-selected="onGlobeCountrySelected" class="w-full h-full min-h-[400px]" />
        </div>

        <!-- Current Weather Card -->
        <div class="lg:w-2/5 flex">
          <div v-if="loading" class="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-50/50 p-10 flex flex-col items-center justify-center text-center">
            <div class="relative w-20 h-20 mb-4">
              <div class="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div class="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p class="text-slate-500 font-medium">Syncing with NASA Satellites...</p>
          </div>
          <CurrentWeather v-else :data="currentWeather" class="w-full" />
        </div>
      </div>

      <!-- Control Panel -->
      <div class="bg-white/80 backdrop-blur-md sticky top-5 z-10 p-5 rounded-2xl shadow-lg border border-white/50 flex flex-wrap gap-6 items-center justify-between">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 px-1 bg-white/80 text-[10px] font-bold text-blue-600 uppercase">Country</label>
            <select v-model="selectedCountry" @change="fetchWeatherData" class="pl-4 pr-10 py-3 border-2 border-slate-100 rounded-xl bg-transparent font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
              <option v-for="country in countryList" :key="country" :value="country">{{ country }}</option>
            </select>
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 px-1 bg-white/80 text-[10px] font-bold text-blue-600 uppercase">Archive Year</label>
            <select v-model="selectedYear" @change="fetchWeatherData" class="pl-4 pr-10 py-3 border-2 border-slate-100 rounded-xl bg-transparent font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
        </div>

        <button @click="fetchWeatherData" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center gap-2">
          <span v-if="loading" class="animate-spin">🌀</span>
          <span v-else>Update Analytics</span>
        </button>
      </div>

      <!-- Insights Section -->
      <div v-if="!loading && currentWeather && historicalData" class="space-y-10 pb-20">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl">
            <p class="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Temperature Range</p>
            <p class="text-lg font-medium leading-tight">{{ temperatureSummary }}</p>
          </div>
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-slate-100/50 shadow-xl shadow-slate-200/50">
            <div class="flex items-center gap-3 mb-2">
              <span class="p-2 bg-blue-50 rounded-lg text-xl">☔</span>
              <p class="text-slate-400 text-xs font-bold uppercase">Annual Rainfall</p>
            </div>
            <p class="text-3xl font-black text-slate-800">{{ totalRain }} <span class="text-sm font-normal text-slate-400">mm</span></p>
          </div>
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-slate-100/50 shadow-xl shadow-slate-200/50">
            <div class="flex items-center gap-3 mb-2">
              <span class="p-2 bg-indigo-50 rounded-lg text-xl">💧</span>
              <p class="text-slate-400 text-xs font-bold uppercase">Avg Humidity</p>
            </div>
            <p class="text-3xl font-black text-slate-800">{{ avgHum }} <span class="text-sm font-normal text-slate-400">%</span></p>
          </div>
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-slate-100/50 shadow-xl shadow-slate-200/50">
            <div class="flex items-center gap-3 mb-2">
              <span class="p-2 bg-cyan-50 rounded-lg text-xl">💨</span>
              <p class="text-slate-400 text-xs font-bold uppercase">Wind Velocity</p>
            </div>
            <p class="text-3xl font-black text-slate-800">{{ avgWind }} <span class="text-sm font-normal text-slate-400">m/s</span></p>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-slate-50/50">
            <WeatherChart :labels="historicalData.months" :dataValues="historicalData.temperature" title="Thermal Trendline" borderColor="#2563eb" />
          </div>
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-slate-50/50">
            <WeatherChart :labels="historicalData.months" :dataValues="historicalData.precipitation" title="Precipitation Volume" borderColor="#3b82f6" type="bar" />
          </div>
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-slate-50/50">
            <WeatherChart :labels="historicalData.months" :dataValues="historicalData.humidity" title="Atmospheric Moisture" borderColor="#6366f1" />
          </div>
          <div class="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-slate-50/50">
            <WeatherChart :labels="historicalData.months" :dataValues="historicalData.windSpeed" title="Wind Dynamics" borderColor="#06b6d4" />
          </div>
        </div>
      </div>

      <!-- Error Handling -->
      <div v-if="!loading && errorMessage" class="max-w-md mx-auto mt-10 bg-red-50/90 backdrop-blur-sm border-l-4 border-red-500 p-6 rounded-2xl shadow-lg flex items-center gap-4">
        <span class="text-3xl">🚫</span>
        <div>
          <h4 class="font-bold text-red-800">System Error</h4>
          <p class="text-red-600 text-sm">{{ errorMessage }}</p>
        </div>
      </div>
    </main>

    <!-- Static Navbar -->
    

    <!-- ChatBot (Static) -->
    <ChatBot />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CurrentWeather from './components/CurrentWeather.vue';
import WeatherChart from './components/WeatherChart.vue';
import { getCountryCoordinates, countryCoordinates } from './services/countryApi';
import { getCurrentWeather } from './services/weatherApi';
import { getHistoricalWeather } from './services/nasaApi';
import WorldGlobe from './components/WorldGlobe.vue';
import AnimatedHero from './components/AnimatedHero.vue';
import PlanetTour from './components/PlanetTour.vue';
import Navbar from './components/Navbar.vue';
import ChatBot from './components/ChatBot.vue';
import FullscreenGallery from './components/FullscreenGallery.vue';

const selectedCountry = ref('Sri Lanka');
const selectedYear = ref(2020);
const errorMessage = ref('');
const loading = ref(false);
const currentWeather = ref(null);
const historicalData = ref(null);

const countryList = computed(() => Object.keys(countryCoordinates).sort());

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 1; i >= currentYear - 40; i--) {
    years.push(i);
  }
  return years;
});

const onGlobeCountrySelected = (countryName) => {
  selectedCountry.value = countryName;
  fetchWeatherData();
};

const totalRain = computed(() => {
  const data = historicalData.value;
  if (!data) return 0;
  const dailyAvg = data.precipitation;
  const year = data.year || new Date().getFullYear();
  const daysInMonth = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dailyAvg.reduce((acc, val, idx) => acc + (val * daysInMonth[idx]), 0).toFixed(1);
});

const avgHum = computed(() => {
  const data = historicalData.value;
  if (!data?.humidity) return 'N/A';
  return (data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length).toFixed(1);
});

const avgWind = computed(() => {
  const data = historicalData.value;
  if (!data?.windSpeed) return 'N/A';
  return (data.windSpeed.reduce((a, b) => a + b, 0) / data.windSpeed.length).toFixed(1);
});

const temperatureSummary = computed(() => {
  const data = historicalData.value;
  if (!data?.temperature?.length) return 'Data pending...';
  const celsiusArr = data.temperature.map(k => k - 273.15);
  const minC = Math.min(...celsiusArr).toFixed(1);
  const maxC = Math.max(...celsiusArr).toFixed(1);
  return `Fluctuating between ${minC}°C and ${maxC}°C`;
});

const fetchWeatherData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const coords = await getCountryCoordinates(selectedCountry.value);
    if (!coords) throw new Error('Country coordinates not found');
    
    const [weather, history] = await Promise.all([
      getCurrentWeather(coords.lat, coords.lon),
      getHistoricalWeather(coords.lat, coords.lon, selectedYear.value)
    ]);

    if (!weather || !history) throw new Error('Failed to retrieve satellite data');
    
    currentWeather.value = weather;
    historicalData.value = history;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

fetchWeatherData();
</script>

<style scoped>
/* No animations needed */
</style>