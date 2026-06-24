<template>
  <div class="weather-card" v-if="data && typeof data === 'object' && data.main">
    <h3>🌤️ Current Weather</h3>
    <p class="temp-summary"><strong>🌡️ Temperature:</strong> {{ temperatureSummary }}</p>
    <p><strong>💧 Humidity:</strong> {{ data.main.humidity }}%</p>
    <p><strong>💨 Wind Speed:</strong> {{ data.wind.speed }} m/s</p>
    <p><strong>📝 Description:</strong> {{ data.weather[0].description }}</p>
  </div>
  <div v-else class="weather-card">⏳ Loading...</div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: null
  }
});

const temperatureSummary = computed(() => {
  if (!props.data || typeof props.data !== 'object' || !props.data.main) {
    return 'Data Not Available';
  }
  const temp = props.data.main.temp;
  const tempF = (temp * 9 / 5) + 32;
  const description = props.data.weather?.[0]?.description || 'Unknown';
  return `${description} ${temp.toFixed(1)}°C (${Math.round(tempF)}°F)`;
});
</script>

<style scoped>
.weather-card {
  border: 1px solid #ccc;
  padding: 16px;
  border-radius: 12px;
  background: #f0f8ff;
  margin: 10px 0;
}
.temp-summary {
  font-size: 1.1em;
  background: #d4edda;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}
</style>