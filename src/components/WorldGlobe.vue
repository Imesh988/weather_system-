<template>
  <div class="relative w-full h-[650px] bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] border border-white/80">
    
    <div ref="globeRef" class="w-full h-full relative z-10"></div>

    <!-- Static decorative orbs -->
    <div class="absolute top-1/4 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl"></div>

    <!-- Country Tooltip -->
    <div 
      v-if="selectedCountry" 
      class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 max-w-[95%]"
      :style="{ opacity: tooltipVisible ? 1 : 0, transform: `translateX(-50%) translateY(${tooltipVisible ? 0 : 20}px)` }"
    >
      <div class="relative bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl px-7 py-4 min-w-[200px] text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]">
        <div class="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-sm -z-10"></div>
        <div class="text-3xl mb-0.5">{{ getCountryFlag(selectedCountry) }}</div>
        <h3 class="text-gray-800 font-bold text-lg tracking-tight">{{ selectedCountry }}</h3>
        <div class="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span v-if="weatherData" class="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-100/50 shadow-sm">
            <span class="text-sm">🌡️</span> {{ weatherData.main.temp }}°C
          </span>
          <span v-if="weatherData" class="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-100/50 shadow-sm">
            <span class="text-sm">💧</span> {{ weatherData.main.humidity }}%
          </span>
          <span v-if="weatherData" class="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-100/50 shadow-sm">
            <span class="text-sm">💨</span> {{ weatherData.wind.speed }} m/s
          </span>
          <span v-else class="text-xs text-gray-400">Loading...</span>
        </div>
        <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
    </div>

    <!-- Live Stats -->
    <div class="absolute bottom-8 right-8 z-10 bg-white/70 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/60 shadow-sm">
      <div class="flex items-center gap-5 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Countries</span>
          <span class="text-gray-800 font-bold text-sm">{{ countriesCount }}</span>
        </div>
        <div class="w-px h-6 bg-gray-200/60"></div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Live</span>
          <span class="relative flex h-2.5 w-2.5">
            <span class="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl transition-opacity duration-700">
      <div class="relative">
        <div class="w-14 h-14 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div class="absolute inset-0 w-14 h-14 border-3 border-purple-200/30 border-t-purple-500 rounded-full animate-spin" style="animation-duration: 0.8s; animation-direction: reverse;"></div>
      </div>
      <p class="text-gray-400 text-xs mt-4 tracking-[0.2em] uppercase font-medium">Loading World Data...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { countryCoordinates } from '../services/countryApi';
import { getCurrentWeather } from '../services/weatherApi';

const emit = defineEmits(['country-selected']);

const globeRef = ref(null);
const selectedCountry = ref(null);
const weatherData = ref(null);
const tooltipVisible = ref(false);
const loading = ref(true);
const countriesCount = Object.keys(countryCoordinates).length;

let scene, camera, renderer, controls;
let markers = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let animationId = null;

const getCountryFlag = (name) => {
  const map = {
    'Sri Lanka': '🇱🇰',
    'USA': '🇺🇸',
    'UK': '🇬🇧',
    // Add more as needed
  };
  return map[name] || '🌍';
};

// ---- Create marker sprites ----
const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(0.2, '#3b82f6cc');
  grad.addColorStop(0.6, '#3b82f666');
  grad.addColorStop(1, '#3b82f600');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
};

const addCountryMarkers = () => {
  markers.forEach(m => scene.remove(m));
  markers = [];
  const glowTex = createGlowTexture();

  Object.keys(countryCoordinates).forEach(name => {
    const coords = countryCoordinates[name];
    if (!coords) return;
    const lat = coords.lat * Math.PI / 180;
    const lon = coords.lon * Math.PI / 180;
    const r = 2.05;
    const x = r * Math.cos(lat) * Math.cos(lon);
    const y = r * Math.sin(lat);
    const z = r * Math.cos(lat) * Math.sin(lon);

    // Glow sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.3,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.2, 0.2, 1);
    sprite.userData = { country: name, type: 'glow' };
    scene.add(sprite);
    markers.push(sprite);

    // Core dot
    const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(x, y, z);
    dot.userData = { country: name, type: 'dot' };
    scene.add(dot);
    markers.push(dot);

    // Hit area
    const hitGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.set(x, y, z);
    hit.userData = { country: name, isHit: true };
    scene.add(hit);
    markers.push(hit);
  });
};

// ---- Scene Setup ----
const initGlobe = () => {
  const container = globeRef.value;
  if (!container) return;

  const w = container.clientWidth;
  const h = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4f8);

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
  camera.position.set(0, 0.1, 5.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;          // <-- NO AUTO ROTATION
  controls.minDistance = 3.0;
  controls.maxDistance = 9;
  controls.enablePan = false;
  controls.rotateSpeed = 0.4;

  // ---- Earth (static) ----
  const sphereGeo = new THREE.SphereGeometry(2, 96, 96);
  // Simple procedural texture (you can use a real texture if available)
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6a9ab0';
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const rad = 10 + Math.random() * 60;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 160, 120, ${0.1 + Math.random() * 0.15})`;
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sphereMat = new THREE.MeshPhongMaterial({
    map: texture,
    color: 0x8ab4d4,
    emissive: 0x204060,
    emissiveIntensity: 0.08,
    specular: 0x88aacc,
    shininess: 25,
    transparent: true,
    opacity: 0.92,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // ---- Atmosphere ----
  const atmosGeo = new THREE.SphereGeometry(2.25, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        vec3 color = vec3(0.3, 0.6, 1.0);
        gl_FragColor = vec4(color, intensity * 0.25);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
  scene.add(atmosphere);

  // ---- Lights ----
  const mainLight = new THREE.DirectionalLight(0x8ab4d4, 1.5);
  mainLight.position.set(5, 4, 6);
  scene.add(mainLight);
  const fillLight = new THREE.DirectionalLight(0x6688aa, 0.6);
  fillLight.position.set(-4, -1, -5);
  scene.add(fillLight);
  const ambient = new THREE.AmbientLight(0x88aacc, 0.4);
  scene.add(ambient);

  // ---- Static Stars ----
  const starCount = 1500;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 15 + Math.random() * 60;
    starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i*3+1] = r * Math.cos(phi);
    starPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.08,
    color: 0x8899bb,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  addCountryMarkers();

  // ---- Events ----
  container.addEventListener('click', onGlobeClick);
  container.addEventListener('mousemove', onGlobeHover);
  window.addEventListener('resize', handleResize);

  loading.value = false;
  render(); // One-time render
};

// ---- Render once (no animation loop) ----
const render = () => {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// ---- Hover ----
const onGlobeHover = (event) => {
  const container = globeRef.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = markers.filter(m => m.userData.isHit);
  const intersects = raycaster.intersectObjects(hits);

  renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';

  // Update dot colors on hover
  markers.forEach(m => {
    if (m.userData.type === 'dot') {
      const hovered = intersects.length > 0 && intersects[0].object.userData.country === m.userData.country;
      m.material.color.setHex(hovered ? 0x2563eb : 0x3b82f6);
    }
  });
};

// ---- Click ----
const onGlobeClick = (event) => {
  const container = globeRef.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = markers.filter(m => m.userData.isHit);
  const intersects = raycaster.intersectObjects(hits);

  if (intersects.length > 0) {
    const name = intersects[0].object.userData.country;
    if (name) {
      selectCountry(name);
    }
  }
};

// ---- Select ----
const selectCountry = async (name) => {
  selectedCountry.value = name;
  tooltipVisible.value = false;

  const coords = countryCoordinates[name];
  if (coords) {
    const weather = await getCurrentWeather(coords.lat, coords.lon);
    weatherData.value = weather;
  }

  await nextTick();
  setTimeout(() => { tooltipVisible.value = true; }, 100);

  emit('country-selected', name);
};

// ---- Resize ----
const handleResize = () => {
  const container = globeRef.value;
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  render();
};

// ---- Lifecycle ----
onMounted(() => setTimeout(initGlobe, 50));

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  window.removeEventListener('resize', handleResize);
});
</script>