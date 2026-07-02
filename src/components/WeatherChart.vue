<template>
  <div class="relative group w-full h-[380px] perspective-1000">
    <div class="absolute inset-0 bg-gradient-to-br from-white to-sky-50/50 backdrop-blur-2xl rounded-[1.8rem] border border-sky-100/80 shadow-[0_20px_50px_rgba(14,165,233,0.05)] overflow-hidden">
      
      <!-- Content Layer -->
      <div class="relative z-10 h-full flex flex-col">
        <!-- Header -->
        <div class="p-6 flex items-center justify-between border-b border-sky-50/50">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-sky-100">
                <span class="text-2xl filter drop-shadow-sm">{{ getChartIcon() }}</span>
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-sky-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-700 tracking-tight uppercase">{{ title }}</h4>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="h-1.5 w-8 bg-sky-100 rounded-full overflow-hidden">
                  <div class="h-full bg-sky-500 w-2/3"></div>
                </div>
                <span class="text-[9px] font-bold text-sky-500/80 tracking-tighter">SYSTEM ACTIVE</span>
              </div>
            </div>
          </div>

          <div class="flex gap-1.5">
            <div v-for="i in 3" :key="i" class="w-1.5 h-1.5 rounded-full bg-sky-100"></div>
          </div>
        </div>

        <!-- Chart -->
        <div class="flex-1 px-4 py-2 relative">
          <canvas ref="chartCanvas" class="w-full h-full"></canvas>
        </div>

        <!-- Bottom Bar -->
        <div class="px-6 py-4 bg-sky-50/30 flex items-center justify-between">
          <span class="text-[10px] font-medium text-slate-400">REFRESH RATE: 0.5s</span>
          <div class="flex items-center gap-3">
             <div class="h-1 w-12 bg-sky-200/50 rounded-full"></div>
             <span class="text-[10px] font-bold text-sky-600">84% ACCURACY</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  labels: { type: Array, required: true },
  dataValues: { type: Array, required: true },
  title: { type: String, required: true },
  borderColor: { type: String, default: '#0ea5e9' },
  type: { type: String, default: 'line' }
});

const chartCanvas = ref(null);
const chartInstance = shallowRef(null);

const createChart = () => {
  if (chartInstance.value) chartInstance.value.destroy();

  const ctx = chartCanvas.value.getContext('2d');
  const fillGradient = ctx.createLinearGradient(0, 0, 0, 200);
  fillGradient.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
  fillGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  chartInstance.value = new Chart(ctx, {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [{
        data: props.dataValues,
        borderColor: props.borderColor,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: props.borderColor,
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: fillGradient,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          cornerRadius: 10,
          titleFont: { size: 12, weight: 'bold' },
          callbacks: { label: (v) => ` Value: ${v.raw}` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 10, weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(224, 242, 254, 0.5)', drawBorder: false },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        }
      }
    }
  });
};

const getChartIcon = () => {
  const map = { 'Temperature': '❄️', 'Rainfall': '🌧️', 'Humidity': '☁️' };
  return map[props.title] || '💎';
};

onMounted(() => {
  createChart();
});

onUnmounted(() => {
  if (chartInstance.value) chartInstance.value.destroy();
});

watch(() => [props.dataValues, props.borderColor], () => {
  createChart();
}, { deep: true });
</script>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
</style>