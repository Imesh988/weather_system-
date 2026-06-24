<template>
  <div class="relative w-full h-[650px] bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] border border-white/80">
    
    <!-- 3D Canvas -->
    <div ref="globeRef" class="w-full h-full relative z-10"></div>

    <!-- Dynamic Gradient Orbs -->
    <div class="absolute top-1/4 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>

    <!-- ===== MODERN COUNTRY TOOLTIP ===== -->
    <div 
      v-if="selectedCountry" 
      class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] max-w-[95%]"
      :style="{ 
        opacity: tooltipVisible ? 1 : 0, 
        transform: `translateX(-50%) translateY(${tooltipVisible ? 0 : 20}px) scale(${tooltipVisible ? 1 : 0.85})` 
      }"
    >
      <div class="relative bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl px-7 py-4 min-w-[200px] text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]">
        <!-- Glow accent -->
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
          <span v-else class="text-xs text-gray-400 animate-pulse">Loading...</span>
        </div>

        <!-- Mini indicator line -->
        <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
    </div>


    <!-- ===== LIVE STATS (Glass) ===== -->
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
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- ===== LOADING ===== -->
    <div v-if="loading" class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl transition-opacity duration-700">
      <div class="relative">
        <div class="w-14 h-14 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div class="absolute inset-0 w-14 h-14 border-3 border-purple-200/30 border-t-purple-500 rounded-full animate-spin" style="animation-duration: 0.8s; animation-direction: reverse;"></div>
      </div>
      <p class="text-gray-400 text-xs mt-4 tracking-[0.2em] uppercase font-medium">Loading World Data...</p>
    </div>

    <!-- ===== CUSTOM CURSOR GLOW (CSS only) ===== -->
    <div class="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(600px_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(59,130,246,0.03),transparent_80%)]"></div>
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
let particles = [];
let connectionLines = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let animationId = null;
let time = 0;
let clickRipples = [];

const countries = Object.keys(countryCoordinates);

// ---- Helper: Flag ----
const getCountryFlag = (name) => {
  const getCountryFlag = (name) => {
  const map = {
    'Afghanistan': '🇦🇫',
    'Albania': '🇦🇱',
    'Algeria': '🇩🇿',
    'Andorra': '🇦🇩',
    'Angola': '🇦🇴',
    'Antigua and Barbuda': '🇦🇬',
    'Argentina': '🇦🇷',
    'Armenia': '🇦🇲',
    'Australia': '🇦🇺',
    'Austria': '🇦🇹',
    'Azerbaijan': '🇦🇿',
    'Bahamas': '🇧🇸',
    'Bahrain': '🇧🇭',
    'Bangladesh': '🇧🇩',
    'Barbados': '🇧🇧',
    'Belarus': '🇧🇾',
    'Belgium': '🇧🇪',
    'Belize': '🇧🇿',
    'Benin': '🇧🇯',
    'Bhutan': '🇧🇹',
    'Bolivia': '🇧🇴',
    'Bosnia and Herzegovina': '🇧🇦',
    'Botswana': '🇧🇼',
    'Brazil': '🇧🇷',
    'Brunei': '🇧🇳',
    'Bulgaria': '🇧🇬',
    'Burkina Faso': '🇧🇫',
    'Burundi': '🇧🇮',
    'Cambodia': '🇰🇭',
    'Cameroon': '🇨🇲',
    'Canada': '🇨🇦',
    'Cape Verde': '🇨🇻',
    'Central African Republic': '🇨🇫',
    'Chad': '🇹🇩',
    'Chile': '🇨🇱',
    'China': '🇨🇳',
    'Colombia': '🇨🇴',
    'Comoros': '🇰🇲',
    'Congo': '🇨🇬',
    'Costa Rica': '🇨🇷',
    'Croatia': '🇭🇷',
    'Cuba': '🇨🇺',
    'Cyprus': '🇨🇾',
    'Czechia': '🇨🇿',
    'Denmark': '🇩🇰',
    'Djibouti': '🇩🇯',
    'Dominica': '🇩🇲',
    'Dominican Republic': '🇩🇴',
    'DRC': '🇨🇩',
    'Ecuador': '🇪🇨',
    'Egypt': '🇪🇬',
    'El Salvador': '🇸🇻',
    'Equatorial Guinea': '🇬🇶',
    'Eritrea': '🇪🇷',
    'Estonia': '🇪🇪',
    'Eswatini': '🇸🇿',
    'Ethiopia': '🇪🇹',
    'Fiji': '🇫🇯',
    'Finland': '🇫🇮',
    'France': '🇫🇷',
    'Gabon': '🇬🇦',
    'Gambia': '🇬🇲',
    'Georgia': '🇬🇪',
    'Germany': '🇩🇪',
    'Ghana': '🇬🇭',
    'Greece': '🇬🇷',
    'Grenada': '🇬🇩',
    'Guatemala': '🇬🇹',
    'Guinea': '🇬🇳',
    'Guinea-Bissau': '🇬🇼',
    'Guyana': '🇬🇾',
    'Haiti': '🇭🇹',
    'Honduras': '🇭🇳',
    'Hungary': '🇭🇺',
    'Iceland': '🇮🇸',
    'India': '🇮🇳',
    'Indonesia': '🇮🇩',
    'Iran': '🇮🇷',
    'Iraq': '🇮🇶',
    'Ireland': '🇮🇪',
    'Israel': '🇮🇱',
    'Italy': '🇮🇹',
    'Jamaica': '🇯🇲',
    'Japan': '🇯🇵',
    'Jordan': '🇯🇴',
    'Kazakhstan': '🇰🇿',
    'Kenya': '🇰🇪',
    'Kiribati': '🇰🇮',
    'Kosovo': '🇽🇰',
    'Kuwait': '🇰🇼',
    'Kyrgyzstan': '🇰🇬',
    'Laos': '🇱🇦',
    'Latvia': '🇱🇻',
    'Lebanon': '🇱🇧',
    'Lesotho': '🇱🇸',
    'Liberia': '🇱🇷',
    'Libya': '🇱🇾',
    'Liechtenstein': '🇱🇮',
    'Lithuania': '🇱🇹',
    'Luxembourg': '🇱🇺',
    'Madagascar': '🇲🇬',
    'Malawi': '🇲🇼',
    'Malaysia': '🇲🇾',
    'Maldives': '🇲🇻',
    'Mali': '🇲🇱',
    'Malta': '🇲🇹',
    'Marshall Islands': '🇲🇭',
    'Mauritania': '🇲🇷',
    'Mauritius': '🇲🇺',
    'Mexico': '🇲🇽',
    'Micronesia': '🇫🇲',
    'Moldova': '🇲🇩',
    'Monaco': '🇲🇨',
    'Mongolia': '🇲🇳',
    'Montenegro': '🇲🇪',
    'Morocco': '🇲🇦',
    'Mozambique': '🇲🇿',
    'Myanmar': '🇲🇲',
    'Namibia': '🇳🇦',
    'Nauru': '🇳🇷',
    'Nepal': '🇳🇵',
    'Netherlands': '🇳🇱',
    'New Zealand': '🇳🇿',
    'Nicaragua': '🇳🇮',
    'Niger': '🇳🇪',
    'Nigeria': '🇳🇬',
    'North Korea': '🇰🇵',
    'North Macedonia': '🇲🇰',
    'Norway': '🇳🇴',
    'Oman': '🇴🇲',
    'Pakistan': '🇵🇰',
    'Palau': '🇵🇼',
    'Panama': '🇵🇦',
    'Papua New Guinea': '🇵🇬',
    'Paraguay': '🇵🇾',
    'Peru': '🇵🇪',
    'Philippines': '🇵🇭',
    'Poland': '🇵🇱',
    'Portugal': '🇵🇹',
    'Qatar': '🇶🇦',
    'Romania': '🇷🇴',
    'Russia': '🇷🇺',
    'Rwanda': '🇷🇼',
    'Saint Kitts and Nevis': '🇰🇳',
    'Saint Lucia': '🇱🇨',
    'Saint Vincent and the Grenadines': '🇻🇨',
    'Samoa': '🇼🇸',
    'San Marino': '🇸🇲',
    'Sao Tome and Principe': '🇸🇹',
    'Saudi Arabia': '🇸🇦',
    'Senegal': '🇸🇳',
    'Serbia': '🇷🇸',
    'Seychelles': '🇸🇨',
    'Sierra Leone': '🇸🇱',
    'Singapore': '🇸🇬',
    'Slovakia': '🇸🇰',
    'Slovenia': '🇸🇮',
    'Solomon Islands': '🇸🇧',
    'Somalia': '🇸🇴',
    'South Africa': '🇿🇦',
    'South Korea': '🇰🇷',
    'South Sudan': '🇸🇸',
    'Spain': '🇪🇸',
    'Sri Lanka': '🇱🇰',
    'Sudan': '🇸🇩',
    'Suriname': '🇸🇷',
    'Sweden': '🇸🇪',
    'Switzerland': '🇨🇭',
    'Syria': '🇸🇾',
    'Taiwan': '🇹🇼',
    'Tajikistan': '🇹🇯',
    'Tanzania': '🇹🇿',
    'Thailand': '🇹🇭',
    'Timor-Leste': '🇹🇱',
    'Togo': '🇹🇬',
    'Tonga': '🇹🇴',
    'Trinidad and Tobago': '🇹🇹',
    'Tunisia': '🇹🇳',
    'Turkey': '🇹🇷',
    'Turkmenistan': '🇹🇲',
    'Tuvalu': '🇹🇻',
    'UAE': '🇦🇪',
    'Uganda': '🇺🇬',
    'UK': '🇬🇧',
    'Ukraine': '🇺🇦',
    'Uruguay': '🇺🇾',
    'USA': '🇺🇸',
    'Uzbekistan': '🇺🇿',
    'Vanuatu': '🇻🇺',
    'Vatican City': '🇻🇦',
    'Venezuela': '🇻🇪',
    'Vietnam': '🇻🇳',
    'Yemen': '🇾🇪',
    'Zambia': '🇿🇲',
    'Zimbabwe': '🇿🇼'
  };
  return map[name] || '🌍';
};
};

// ---- Create Advanced Glow Texture ----
const createGlowTexture = (color = '#3b82f6') => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, color);
  grad.addColorStop(0.2, color + 'cc');
  grad.addColorStop(0.6, color + '66');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
};

// ---- Create Floating Particles ----
const createParticles = () => {
  const count = 800;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2.4 + Math.random() * 1.2;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    
    const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    
    sizes[i] = 0.01 + Math.random() * 0.025;
    speeds[i] = 0.2 + Math.random() * 0.4;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.02,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  points.userData = { speeds };
  scene.add(points);
  particles.push(points);
  return points;
};

// ---- Connection Lines ----
const createConnectionLines = () => {
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending
  });

  // Select random countries to connect
  const selected = [];
  const shuffled = [...countries].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(20, shuffled.length); i++) {
    const name = shuffled[i];
    const coords = countryCoordinates[name];
    if (coords) {
      const lat = coords.lat * Math.PI / 180;
      const lon = coords.lon * Math.PI / 180;
      const r = 2.05;
      selected.push(new THREE.Vector3(
        r * Math.cos(lat) * Math.cos(lon),
        r * Math.sin(lat),
        r * Math.cos(lat) * Math.sin(lon)
      ));
    }
  }

  for (let i = 0; i < selected.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 4, selected.length); j++) {
      if (Math.random() > 0.3) continue;
      const geo = new THREE.BufferGeometry().setFromPoints([
        selected[i],
        selected[j]
      ]);
      const line = new THREE.Line(geo, lineMat.clone());
      line.userData = { 
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.3
      };
      scene.add(line);
      connectionLines.push(line);
    }
  }
};

// ---- Click Ripple ----
const createRipple = (position) => {
  const geo = new THREE.RingGeometry(0.02, 0.03, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.lookAt(new THREE.Vector3(0, 0, 0));
  mesh.userData = { life: 1.0 };
  scene.add(mesh);
  clickRipples.push(mesh);
};

// ---- Markers (Enhanced) ----
const addCountryMarkers = () => {
  markers.forEach(m => scene.remove(m));
  markers = [];
  const glowTex = createGlowTexture('#3b82f6');
  const glowTex2 = createGlowTexture('#8b5cf6');

  countries.forEach((name, idx) => {
    const coords = countryCoordinates[name];
    if (!coords) return;

    const lat = coords.lat * Math.PI / 180;
    const lon = coords.lon * Math.PI / 180;
    const r = 2.05;
    const x = r * Math.cos(lat) * Math.cos(lon);
    const y = r * Math.sin(lat);
    const z = r * Math.cos(lat) * Math.sin(lon);

    const usePurple = idx % 5 === 0;
    const tex = usePurple ? glowTex2 : glowTex;
    const color = usePurple ? '#8b5cf6' : '#3b82f6';

    // Glow sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.4 + Math.random() * 0.2
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.25, 0.25, 1);
    sprite.userData = { country: name, type: 'glow', phase: Math.random() * Math.PI * 2 };
    scene.add(sprite);
    markers.push(sprite);

    // Core dot with glow
    const dotGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: usePurple ? 0x8b5cf6 : 0x3b82f6 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(x, y, z);
    dot.userData = { country: name, type: 'dot', baseColor: usePurple ? 0x8b5cf6 : 0x3b82f6 };
    scene.add(dot);
    markers.push(dot);

    // Outer ring
    const ringGeo = new THREE.RingGeometry(0.035, 0.045, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: usePurple ? 0x8b5cf6 : 0x3b82f6,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, y, z);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    ring.userData = { country: name, type: 'ring', phase: Math.random() * Math.PI * 2 };
    scene.add(ring);
    markers.push(ring);

    // Hit area
    const hitGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
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

  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true 
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.minDistance = 3.0;
  controls.maxDistance = 9;
  controls.enablePan = false;
  controls.rotateSpeed = 0.4;

  // ---- Earth with Texture ----
  const sphereGeo = new THREE.SphereGeometry(2, 96, 96);
  
  // Create advanced procedural texture
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Ocean gradient
  const grad = ctx.createRadialGradient(1024, 512, 100, 1024, 512, 800);
  grad.addColorStop(0, '#dceaf5');
  grad.addColorStop(0.3, '#c5dde8');
  grad.addColorStop(0.6, '#a8c8d8');
  grad.addColorStop(0.8, '#8ab4c8');
  grad.addColorStop(1, '#6a9ab0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Land masses (organic shapes)
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 1024;
    const rad = 15 + Math.random() * 80;
    const alpha = 0.08 + Math.random() * 0.18;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 160, 120, ${alpha})`;
    ctx.fill();
    
    // Add some terrain detail
    if (Math.random() > 0.6) {
      for (let j = 0; j < 5; j++) {
        const cx = x + (Math.random() - 0.5) * rad * 0.6;
        const cy = y + (Math.random() - 0.5) * rad * 0.6;
        const cr = rad * (0.2 + Math.random() * 0.3);
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 140, 100, ${alpha * 0.6})`;
        ctx.fill();
      }
    }
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
    opacity: 0.92
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // ---- Glow Ring Around Earth ----
  const glowRingGeo = new THREE.RingGeometry(2.15, 2.45, 64);
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
  glowRing.rotation.x = Math.PI / 3;
  glowRing.rotation.z = 0.2;
  scene.add(glowRing);

  const glowRing2 = new THREE.Mesh(
    new THREE.RingGeometry(2.3, 2.5, 64),
    new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  glowRing2.rotation.x = -Math.PI / 4;
  glowRing2.rotation.z = 0.5;
  scene.add(glowRing2);

  // ---- Atmosphere (Enhanced) ----
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
        vec3 color1 = vec3(0.3, 0.6, 1.0);
        vec3 color2 = vec3(0.5, 0.3, 0.8);
        vec3 color = mix(color1, color2, abs(vPosition.y) / 2.5);
        gl_FragColor = vec4(color, intensity * 0.25);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
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

  const rimLight = new THREE.DirectionalLight(0x4466aa, 0.3);
  rimLight.position.set(-3, 5, -2);
  scene.add(rimLight);

  // ---- Stars (Enhanced) ----
  const starCount = 1500;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starColors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 15 + Math.random() * 60;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    starSizes[i] = 0.05 + Math.random() * 0.12;
    const brightness = 0.5 + Math.random() * 0.5;
    const tint = Math.random();
    if (tint < 0.3) {
      starColors[i * 3] = brightness;
      starColors[i * 3 + 1] = brightness * 0.8;
      starColors[i * 3 + 2] = brightness * 0.6;
    } else if (tint < 0.6) {
      starColors[i * 3] = brightness * 0.7;
      starColors[i * 3 + 1] = brightness * 0.8;
      starColors[i * 3 + 2] = brightness;
    } else {
      starColors[i * 3] = brightness;
      starColors[i * 3 + 1] = brightness;
      starColors[i * 3 + 2] = brightness;
    }
  }
  
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  
  const starMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- Add Everything ----
  createParticles();
  addCountryMarkers();
  createConnectionLines();

  // ---- Events ----
  container.addEventListener('click', onGlobeClick);
  container.addEventListener('mousemove', onGlobeHover);
  container.addEventListener('mousemove', updateCursorGlow);
  window.addEventListener('resize', handleResize);

  loading.value = false;
  animate();
};

// ---- Update Cursor Glow (CSS) ----
const updateCursorGlow = (event) => {
  const container = globeRef.value?.parentElement;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  container.style.setProperty('--mouse-x', x + '%');
  container.style.setProperty('--mouse-y', y + '%');
};

// ---- Animation ----
const animate = () => {
  animationId = requestAnimationFrame(animate);
  time += 0.01;

  // Animate markers
  markers.forEach(m => {
    if (m.userData.type === 'glow') {
      const pulse = 0.35 + Math.sin(time * 0.8 + m.userData.phase) * 0.15;
      const s = 0.2 + Math.sin(time * 0.6 + m.userData.phase) * 0.05;
      m.scale.set(s, s, 1);
      m.material.opacity = pulse * 0.5;
    }
    if (m.userData.type === 'ring') {
      const s = 1 + Math.sin(time * 0.7 + m.userData.phase) * 0.15;
      m.scale.set(s, s, 1);
      m.material.opacity = 0.2 + Math.sin(time * 0.5 + m.userData.phase) * 0.1;
    }
    if (m.userData.type === 'dot') {
      const pulse = 1 + Math.sin(time * 0.6 + (m.userData.phase || 0)) * 0.1;
      m.scale.set(pulse, pulse, pulse);
    }
  });

  // Animate particles
  particles.forEach(p => {
    const pos = p.geometry.attributes.position;
    const speeds = p.userData.speeds;
    for (let i = 0; i < pos.count; i++) {
      const idx = i * 3;
      const theta = Math.atan2(pos.array[idx + 2], pos.array[idx]);
      const phi = Math.acos(pos.array[idx + 1] / 3);
      const r = 2.4 + Math.sin(time * 0.2 + i) * 0.3;
      const newTheta = theta + 0.001 * (speeds[i] || 0.3);
      pos.array[idx] = r * Math.sin(phi) * Math.cos(newTheta);
      pos.array[idx + 1] = r * Math.cos(phi + Math.sin(time * 0.1 + i) * 0.001);
      pos.array[idx + 2] = r * Math.sin(phi) * Math.sin(newTheta);
    }
    pos.needsUpdate = true;
  });

  // Animate connection lines
  connectionLines.forEach(line => {
    const opacity = 0.04 + Math.sin(time * line.userData.speed + line.userData.phase) * 0.03;
    line.material.opacity = Math.max(0.02, opacity);
  });

  // Animate click ripples
  clickRipples.forEach((ripple, idx) => {
    ripple.userData.life -= 0.015;
    const s = 1 + (1 - ripple.userData.life) * 3;
    ripple.scale.set(s, s, s);
    ripple.material.opacity = ripple.userData.life * 0.6;
    if (ripple.userData.life <= 0) {
      scene.remove(ripple);
      clickRipples.splice(idx, 1);
    }
  });

  // Animate glow rings
  const rings = scene.children.filter(c => c.type === 'Mesh' && c.geometry.type === 'RingGeometry');
  rings.forEach((ring, i) => {
    ring.rotation.z += 0.001 * (i + 1);
    ring.material.opacity = 0.05 + Math.sin(time * 0.3 + i) * 0.02;
  });

  controls.update();
  renderer.render(scene, camera);
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

  markers.forEach(m => {
    if (m.userData.type === 'dot') {
      const hovered = intersects.length > 0 && intersects[0].object.userData.country === m.userData.country;
      const baseColor = m.userData.baseColor || 0x3b82f6;
      m.material.color.setHex(hovered ? 0x2563eb : baseColor);
      m.scale.set(hovered ? 2.5 : 1, hovered ? 2.5 : 1, 1);
    }
    if (m.userData.type === 'ring' && intersects.length > 0) {
      const hovered = intersects[0].object.userData.country === m.userData.country;
      m.material.opacity = hovered ? 0.8 : 0.3;
      const s = hovered ? 1.5 : 1;
      m.scale.set(s, s, s);
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
      // Create ripple at click position
      const pos = intersects[0].point.clone();
      createRipple(pos);
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

  controls.autoRotate = false;
  setTimeout(() => { controls.autoRotate = true; }, 5000);
};

// ---- Resize ----
const handleResize = () => {
  const container = globeRef.value;
  if (!container) return;
  const w = container.clientWidth, h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
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