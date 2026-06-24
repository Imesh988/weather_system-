<template>
  <div class="relative group w-full h-[380px] perspective-1000">
    <!-- Premium Card Wrapper -->
    <div class="absolute inset-0 bg-gradient-to-br from-white to-sky-50/50 backdrop-blur-2xl rounded-[1.8rem] border border-sky-100/80 shadow-[0_20px_50px_rgba(14,165,233,0.05)] group-hover:shadow-[0_30px_60px_rgba(14,165,233,0.12)] group-hover:-rotate-x-1 group-hover:scale-[1.01] transition-all duration-700 overflow-hidden">
      
      <!-- Three.js: Neural Data Mesh Background -->
      <div ref="threeContainer" class="absolute inset-0 z-0 opacity-40 group-hover:opacity-80 transition-opacity duration-1000"></div>

      <!-- High-End Content Layer -->
      <div class="relative z-10 h-full flex flex-col">
        <!-- Header: Clean & Techy -->
        <div class="p-6 flex items-center justify-between border-b border-sky-50/50">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-sky-100 group-hover:border-sky-300 transition-colors duration-500">
                <span class="text-2xl filter drop-shadow-sm">{{ getChartIcon() }}</span>
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-sky-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div>
              <h4 class="text-sm font-black text-slate-700 tracking-tight uppercase">{{ title }}</h4>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="h-1.5 w-8 bg-sky-100 rounded-full overflow-hidden">
                  <div class="h-full bg-sky-500 w-2/3 animate-shimmer"></div>
                </div>
                <span class="text-[9px] font-bold text-sky-500/80 tracking-tighter">SYSTEM ACTIVE</span>
              </div>
            </div>
          </div>

          <div class="flex gap-1.5">
            <div v-for="i in 3" :key="i" class="w-1.5 h-1.5 rounded-full bg-sky-100 group-hover:bg-sky-400 transition-colors" :style="{ transitionDelay: i*100+'ms' }"></div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="flex-1 px-4 py-2 relative">
          <canvas ref="chartCanvas" class="w-full h-full"></canvas>
        </div>

        <!-- Bottom Stat Bar -->
        <div class="px-6 py-4 bg-sky-50/30 flex items-center justify-between">
          <span class="text-[10px] font-medium text-slate-400">REFRESH RATE: 0.5s</span>
          <div class="flex items-center gap-3">
             <div class="h-1 w-12 bg-sky-200/50 rounded-full"></div>
             <span class="text-[10px] font-bold text-sky-600">84% ACCURACY</span>
          </div>
        </div>
      </div>

      <!-- Subtle Light Sweep Overlay -->
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-sky-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { Chart, registerables } from 'chart.js';
import * as THREE from 'three';

Chart.register(...registerables);

const props = defineProps({
  labels: { type: Array, required: true },
  dataValues: { type: Array, required: true },
  title: { type: String, required: true },
  borderColor: { type: String, default: '#0ea5e9' }, // Light Blue Default
  type: { type: String, default: 'line' }
});

const chartCanvas = ref(null);
const threeContainer = ref(null);
const chartInstance = shallowRef(null);

// --- Three.js: Neural Mesh Animation ---
let scene, camera, renderer, mesh;
const initThree = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, threeContainer.value.offsetWidth / threeContainer.value.offsetHeight, 0.1, 100);
  camera.position.z = 3;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(threeContainer.value.offsetWidth, threeContainer.value.offsetHeight);
  threeContainer.value.appendChild(renderer.domElement);

  // සරල තිත් ජාලයක් (Geometry) නිර්මාණය
  const geometry = new THREE.IcosahedronGeometry(2, 2);
  const material = new THREE.PointsMaterial({
    size: 0.03,
    color: '#0ea5e9',
    transparent: true,
    opacity: 0.3
  });

  mesh = new THREE.Points(geometry, material);
  scene.add(mesh);

  const animate = () => {
    requestAnimationFrame(animate);
    mesh.rotation.y += 0.002;
    mesh.rotation.x += 0.001;
    renderer.render(scene, camera);
  };
  animate();
};

// --- Chart.js: Modern Blue Design ---
const createChart = () => {
  if (chartInstance.value) chartInstance.value.destroy();

  const ctx = chartCanvas.value.getContext('2d');
  
  // Multi-layered Gradient
  const fillGradient = ctx.createLinearGradient(0, 0, 0, 200);
  fillGradient.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
  fillGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  chartInstance.value = new Chart(ctx, {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [{
        data: props.dataValues,
        borderColor: '#0ea5e9',
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0ea5e9',
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
  initThree();
  createChart();
  window.addEventListener('resize', () => {
    if (!renderer) return;
    camera.aspect = threeContainer.value.offsetWidth / threeContainer.value.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(threeContainer.value.offsetWidth, threeContainer.value.offsetHeight);
  });
});

onUnmounted(() => renderer?.dispose());

watch(() => [props.dataValues, props.borderColor], () => {
  createChart();
  if (mesh) mesh.material.color.set(props.borderColor);
}, { deep: true });
</script>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite linear;
}
.perspective-1000 {
  perspective: 1000px;
}
</style>