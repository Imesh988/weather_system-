<template>
  <div class="planet-display-container w-full min-h-screen flex flex-col md:flex-row overflow-hidden font-sans relative">
    <div ref="canvasContainer" class="fixed inset-0 w-full h-full overflow-hidden -z-10"></div>

    <!-- LEFT PANEL - Completely Transparent -->
    <div class="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-end p-8 md:p-16 pb-8 translate-y-40 z-10 border-b md:border-b-0 md:border-r border-white/10 bg-transparent">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
        <span class="text-cyan-500 text-[11px] uppercase tracking-[0.3em] font-bold">Solar System Tour</span>
      </div>

      <Transition name="fade-slide" mode="out-in">
        <div :key="currentIndex" class="space-y-6">
          <div>
            <span class="text-5xl mb-2 block animate-bounce" style="animation-duration: 2s;">{{ currentPlanet.emoji }}</span>
            <h1 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
              {{ currentPlanet.name }}
            </h1>
            <div class="h-1 w-20 bg-gradient-to-r from-cyan-400 to-blue-500 mt-4 animate-pulse"></div>
          </div>

          <!-- Description - Larger -->
          <p class="text-cyan-100 text-xl md:text-2xl leading-relaxed font-light max-w-xl drop-shadow-md min-h-[40px]">
            <span class="typing-cursor">{{ typedDescription }}</span>
          </p>

          <div class="grid grid-cols-2 gap-4 pt-6">
            <!-- Type Card - Larger & Bolder -->
            <div class="bg-transparent p-4 rounded-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <p class="text-cyan-400/80 text-xs uppercase tracking-widest mb-1">Type</p>
              <p class="text-cyan-300 font-black text-3xl md:text-4xl min-h-[30px]">
                <span class="typing-cursor">{{ typedType }}</span>
              </p>
            </div>
            <!-- Diameter Card - Larger & Bolder -->
            <div class="bg-transparent p-4 rounded-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <p class="text-cyan-400/80 text-xs uppercase tracking-widest mb-1">Diameter</p>
              <p class="text-cyan-300 font-black text-3xl md:text-4xl min-h-[30px]">
                <span class="typing-cursor">{{ typedDiameter }}</span>
              </p>
            </div>
          </div>
        </div>
      </Transition>

      <div class="mt-12">
        <div class="flex justify-between items-end mb-2">
          <span class="text-white/60 text-xs font-mono">0{{ currentIndex + 1 }} / 0{{ planetData.length }}</span>
          <button @click="toggleTour" class="text-[10px] uppercase tracking-widest px-3 py-1 border border-cyan-500/40 rounded-full text-cyan-400 hover:bg-cyan-500/20 transition-all hover:scale-110">
            {{ isPaused ? '▶ Play' : '⏸ Pause' }}
          </button>
        </div>
        <div class="w-full h-[2px] bg-white/20 overflow-hidden rounded-full">
          <div class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-100 ease-linear rounded-full" :style="{ width: `${(timer / SWITCH_TIME) * 100}%` }"></div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL - Completely Transparent -->
    <div class="w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col items-center justify-end p-4 md:p-6 pb-0 z-10">
      <div ref="canvasBox" class="w-full h-full min-h-[420px] max-w-[650px] max-h-[680px] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/20 bg-transparent translate-y-[180px]">
        <div class="absolute inset-0 pointer-events-none z-10">
          <div class="absolute top-10 left-8 text-cyan-500/40 font-mono text-[9px] tracking-[0.2em] drop-shadow-lg">✦ LIVE_RENDER_AUTO_TOUR</div>
          <div class="absolute bottom-6 right-6 flex gap-3">
            <div class="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-pulse"></div>
            <div class="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse-slow"></div>
          </div>
        </div>
        <div class="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-white/30 text-[8px] tracking-widest font-mono">
          <span class="animate-pulse">✦</span> SPIN: <span id="speed-indicator" class="text-cyan-400/50">1.0x</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import * as THREE from 'three';

// ============================================================
//  NOISE FUNCTIONS
// ============================================================
function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) & 0x7fffffff;
}

function smoothNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = (hash(ix, iy) & 0xffff) / 65536;
  const b = (hash(ix + 1, iy) & 0xffff) / 65536;
  const c = (hash(ix, iy + 1) & 0xffff) / 65536;
  const d = (hash(ix + 1, iy + 1) & 0xffff) / 65536;
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value;
}

// ============================================================
//  REALISTIC TEXTURE GENERATOR
// ============================================================
function createRealisticTexture(baseColors, type = 'generic') {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;

    const hash = (x, y) => {
        let h = Math.imul(x, 1540483477) ^ Math.imul(y, 1150630961);
        h = Math.imul(h ^ (h >>> 16), 1540483477);
        return (h >>> 0) / 4294967296;
    };

    const noise = (x, y) => {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const a = hash(ix, iy), b = hash(ix + 1, iy);
        const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
        const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
        return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };

    const fbm = (x, y, octaves = 8) => {
        let val = 0, amp = 0.5, freq = 1.0;
        for (let i = 0; i < octaves; i++) {
            val += noise(x * freq, y * freq) * amp;
            amp *= 0.5; freq *= 2.1;
        }
        return val;
    };

    const voronoi = (x, y) => {
        let minDist = 1.0;
        for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
                const px = Math.floor(x) + i, py = Math.floor(y) + j;
                const h = hash(px, py);
                const ox = (h * 123.45) % 1, oy = (h * 456.78) % 1;
                const dx = i + ox - (x - Math.floor(x)), dy = j + oy - (y - Math.floor(y));
                minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy));
            }
        }
        return minDist;
    };

    const colors = baseColors.map(c => new THREE.Color(c));

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const u = x / W, v = y / H;
            let n = 0;
            const q = { x: fbm(u * 4, v * 4, 4), y: fbm(u * 4 + 1.2, v * 4 + 2.8, 4) };
            const r = { x: fbm(u * 4 + q.x * 2 + 1.7, v * 4 + q.y * 2 + 9.2, 4), y: fbm(u * 4 + q.x * 2 + 8.3, v * 4 + q.y * 2 + 2.8, 4) };

            if (type === 'jupiter' || type === 'saturn') {
                const bands = Math.sin(v * 50 + fbm(u * 2, v * 5, 4) * 10);
                n = fbm(u * 4 + r.x, v * 2 + r.y, 6) * 0.4 + bands * 0.6;
            } else if (type === 'earth') {
                const continent = fbm(u * 3 + r.x, v * 3 + r.y, 8);
                n = continent > 0.53 ? continent : continent * 0.4; 
            } else if (type === 'star') {
                n = fbm(u * 10 + r.x * 5, v * 10 + r.y * 5, 6);
            } else {
                n = fbm(u * 6 + r.x, v * 6 + r.y, 6);
            }

            const pos = Math.max(0, Math.min(1, n)) * (colors.length - 1);
            const i0 = Math.floor(pos), i1 = Math.min(i0 + 1, colors.length - 1);
            let finalColor = colors[i0].clone().lerp(colors[i1], pos - i0);

            if (['mercury', 'mars', 'generic'].includes(type)) {
                const crater = voronoi(u * 30, v * 30);
                if (crater < 0.1) {
                    const depth = (0.1 - crater) * 4;
                    finalColor.multiplyScalar(1 - depth);
                }
            }

            const polarMask = Math.pow(Math.abs(v - 0.5) * 2, 8);
            if (['earth', 'mars'].includes(type) && polarMask > 0.6) {
                const iceColor = new THREE.Color(type === 'earth' ? 0xffffff : 0xffeeff);
                finalColor.lerp(iceColor, (polarMask - 0.6) * 2);
            }

            if (type === 'earth' || type === 'venus' || type === 'neptune') {
                const clouds = fbm(u * 10 + r.x, v * 10 + r.y, 4);
                if (clouds > 0.6) finalColor.lerp(new THREE.Color(0xffffff), (clouds - 0.6) * 0.5);
            }

            const idx = (y * W + x) * 4;
            data[idx]     = Math.min(255, finalColor.r * 255);
            data[idx + 1] = Math.min(255, finalColor.g * 255);
            data[idx + 2] = Math.min(255, finalColor.b * 255);
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16; 
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    return texture;
}

// ============================================================
//  ATMOSPHERE SHADERS
// ============================================================
const atmoVS = `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`;

const atmoFS = `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform vec3 color;
  uniform float intensity;
  uniform float time;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPos);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    float glow1 = pow(rim, 2.0) * intensity;
    float glow2 = pow(rim, 4.0) * intensity * 0.6;
    float glow = glow1 + glow2;
    vec3 scattered = color + vec3(0.15, 0.25, 0.6) * rim * 0.4;
    float pulse = 0.85 + 0.15 * sin(time * 0.7 + 1.2);
    float alpha = glow * pulse;
    gl_FragColor = vec4(scattered, alpha);
  }
`;

// ============================================================
//  PLANET DATA
// ============================================================
const planetData = [
  { emoji: '☀️', name: 'Sun', description: 'The center of our solar system. A massive, luminous ball of gas that provides energy to all planets.', type: 'Star', diameter: '1,391,000 km', colors: ['#ffcc33', '#ff8800', '#ff4400'], atmo: '#ffaa00', tilt: 0, typeLabel: 'star', image: '/textures/images-removebg-preview.png' },
  { emoji: '🪐', name: 'Mercury', description: 'The smallest planet and closest to the Sun. It has a heavily cratered, rocky surface.', type: 'Terrestrial', diameter: '4,879 km', colors: ['#8a8a8a', '#555555', '#333333'], atmo: '#ffffff', tilt: 0.03, typeLabel: 'mercury' },
  { emoji: '🪐', name: 'Venus', description: 'The hottest planet in the solar system, shrouded in thick, toxic sulfuric acid clouds.', type: 'Terrestrial', diameter: '12,104 km', colors: ['#e3bb76', '#a47e3c', '#7a5c2a'], atmo: '#ffddaa', tilt: 2.64, typeLabel: 'venus' },
  { emoji: '🌍', name: 'Earth', description: 'The only known planet to harbor life. A stunning blue world filled with vast oceans and diverse ecosystems.', type: 'Terrestrial', diameter: '12,756 km', colors: ['#1a5276', '#27ae60', '#2e86c1', '#f5cba7'], atmo: '#4488ff', tilt: 0.41, typeLabel: 'earth' },
  { emoji: '🔴', name: 'Mars', description: 'Known as the Red Planet due to its iron oxide-rich soil. Home to the tallest volcano in the solar system.', type: 'Terrestrial', diameter: '6,792 km', colors: ['#c1440e', '#8a2e0a', '#5c1a06'], atmo: '#ff6633', tilt: 0.44, typeLabel: 'mars' },
  { emoji: '🟠', name: 'Jupiter', description: 'The largest planet in our solar system. A gas giant famous for its Great Red Spot, a storm larger than Earth.', type: 'Gas Giant', diameter: '139,820 km', colors: ['#d4a373', '#c77d5e', '#a45d3c', '#e8b88a'], atmo: '#ffd4aa', tilt: 0.05, typeLabel: 'jupiter' },
  { emoji: '💍', name: 'Saturn', description: 'Famous for its magnificent, extensive ring system made mostly of ice particles and rocky debris.', type: 'Gas Giant', diameter: '116,460 km', colors: ['#ead2ac', '#c4a882', '#a68a6a'], atmo: '#ead2ac', tilt: 0.47, hasRings: true, typeLabel: 'saturn' },
  { emoji: '🧊', name: 'Uranus', description: 'An ice giant with a frigid atmosphere. It rotates on its side, likely due to a massive ancient collision.', type: 'Ice Giant', diameter: '50,724 km', colors: ['#b2ebf2', '#4dd0e1', '#1a8a9e'], atmo: '#88ffff', tilt: 1.71, typeLabel: 'uranus' },
  { emoji: '🌊', name: 'Neptune', description: 'The farthest and windiest planet. This deep blue ice giant experiences supersonic wind speeds.', type: 'Ice Giant', diameter: '49,528 km', colors: ['#4a6fa5', '#1a2a5a', '#0d1a3a'], atmo: '#4466ff', tilt: 0.49, typeLabel: 'neptune' },
];

// ============================================================
//  STATE
// ============================================================
const currentIndex = ref(0);
const timer = ref(0);
const isPaused = ref(false);
const SWITCH_TIME = 5000;
const currentPlanet = computed(() => planetData[currentIndex.value]);

// Typing Animation State
const typedDescription = ref('');
const typedType = ref('');
const typedDiameter = ref('');
let descInterval = null, typeInterval = null, diamInterval = null;
let descTimeout = null, typeTimeout = null, diamTimeout = null;

function startTyping(text, targetRef, speed, delay) {
  if (targetRef === typedDescription && descInterval) { clearInterval(descInterval); descInterval = null; clearTimeout(descTimeout); }
  if (targetRef === typedType && typeInterval) { clearInterval(typeInterval); typeInterval = null; clearTimeout(typeTimeout); }
  if (targetRef === typedDiameter && diamInterval) { clearInterval(diamInterval); diamInterval = null; clearTimeout(diamTimeout); }

  targetRef.value = '';
  let index = 0;

  const timeout = setTimeout(() => {
    const interval = setInterval(() => {
      if (index < text.length) {
        targetRef.value += text[index];
        index++;
      } else {
        clearInterval(interval);
        if (targetRef === typedDescription) descInterval = null;
        if (targetRef === typedType) typeInterval = null;
        if (targetRef === typedDiameter) diamInterval = null;
      }
    }, speed);
    
    if (targetRef === typedDescription) descInterval = interval;
    if (targetRef === typedType) typeInterval = interval;
    if (targetRef === typedDiameter) diamInterval = interval;
  }, delay);

  if (targetRef === typedDescription) descTimeout = timeout;
  if (targetRef === typedType) typeTimeout = timeout;
  if (targetRef === typedDiameter) diamTimeout = timeout;
}

watch(currentPlanet, (newPlanet) => {
  if (!newPlanet) return;
  startTyping(newPlanet.description, typedDescription, 25, 0);
  startTyping(newPlanet.type, typedType, 40, 400);
  startTyping(newPlanet.diameter, typedDiameter, 40, 600);
}, { immediate: true });

// ============================================================
//  THREE.JS STUFF
// ============================================================
const canvasBox = ref(null);
const canvasContainer = ref(null);
let scene, camera, renderer, planetMesh, atmoMesh, ringMesh, starFieldBG;
let animationId, animationIdBG;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let time = 0;
let floatParticles = null;

function createFloatingParticles() {
  const count = 300;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color(0x88ccff),
    new THREE.Color(0xff88aa),
    new THREE.Color(0x88ffaa),
    new THREE.Color(0xffcc88),
    new THREE.Color(0xcc88ff),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 1.6 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i*3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = radius * Math.cos(phi);
    speeds[i] = 0.08 + Math.random() * 0.2;
    const c = palette[Math.floor(Math.random() * palette.length)].clone();
    c.multiplyScalar(0.7 + Math.random() * 0.3);
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.025,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    vertexColors: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geo, mat);
  particles.userData = { speeds };
  return particles;
}

function initStarBackground() {
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  const sceneBG = new THREE.Scene();
  sceneBG.background = new THREE.Color(0x050b14);

  const cameraBG = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  cameraBG.position.set(0, 0, 14);
  cameraBG.lookAt(0, 0, 0);

  const rendererBG = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rendererBG.setSize(width, height);
  rendererBG.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(rendererBG.domElement);

  const starsCount = 6000;
  const positions = new Float32Array(starsCount * 3);
  const starColors = new Float32Array(starsCount * 3);
  const sizes = new Float32Array(starsCount);

  for (let i = 0; i < starsCount; i++) {
    const radius = 15 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i*3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = radius * Math.cos(phi);

    const temp = Math.random();
    let r, g, b;
    if (temp < 0.1) { r=0.7; g=0.8; b=1.0; }
    else if (temp < 0.3) { r=1.0; g=0.95; b=0.8; }
    else if (temp < 0.6) { r=1.0; g=1.0; b=1.0; }
    else if (temp < 0.85) { r=1.0; g=0.85; b=0.6; }
    else { r=1.0; g=0.6; b=0.4; }
    starColors[i*3] = r;
    starColors[i*3+1] = g;
    starColors[i*3+2] = b;
    sizes[i] = 0.03 + Math.random() * 0.12;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    vertexColors: true,
  });

  starFieldBG = new THREE.Points(geometry, material);
  sceneBG.add(starFieldBG);

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animateBG() {
    animationIdBG = requestAnimationFrame(animateBG);
    targetX += (mouseX * 1.5 - targetX) * 0.02;
    targetY += (mouseY * 0.8 - targetY) * 0.02;
    cameraBG.position.x = targetX * 1.0;
    cameraBG.position.y = targetY * 0.5;
    cameraBG.lookAt(0, 0, 0);
    if (starFieldBG) {
      starFieldBG.rotation.y += 0.00008;
      starFieldBG.rotation.x += 0.00003;
    }
    rendererBG.render(sceneBG, cameraBG);
  }

  function resizeBG() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    cameraBG.aspect = w / h;
    cameraBG.updateProjectionMatrix();
    rendererBG.setSize(w, h);
  }

  window.addEventListener('resize', resizeBG);
  animateBG();

  return () => {
    cancelAnimationFrame(animationIdBG);
    window.removeEventListener('resize', resizeBG);
    rendererBG.dispose();
    if (rendererBG.domElement && rendererBG.domElement.parentNode) {
      rendererBG.domElement.parentNode.removeChild(rendererBG.domElement);
    }
  };
}

const initThree = () => {
  const container = canvasBox.value;
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) {
    setTimeout(initThree, 100);
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);

  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
  camera.position.set(0, 0.8, 4.2);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x223355, 0.4);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffeedd, 2.0);
  key.position.set(4, 5, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x88ccff, 0.8);
  fill.position.set(-3, 1, 2);
  scene.add(fill);

  const rim1 = new THREE.DirectionalLight(0xff8844, 0.6);
  rim1.position.set(-2, -1, -4);
  scene.add(rim1);

  const rim2 = new THREE.DirectionalLight(0x4488ff, 0.5);
  rim2.position.set(2, -1, -4);
  scene.add(rim2);

  const geo = new THREE.SphereGeometry(1.2, 80, 80);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x66aaff,
    roughness: 0.4,
    metalness: 0.05,
    clearcoat: 0.2,
    clearcoatRoughness: 0.2,
    emissive: 0x224488,
    emissiveIntensity: 0.15,
  });
  planetMesh = new THREE.Mesh(geo, mat);
  scene.add(planetMesh);

  const atmoGeo = new THREE.SphereGeometry(1.28, 64, 64);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: atmoVS,
    fragmentShader: atmoFS,
    uniforms: {
      color: { value: new THREE.Color(0x4488ff) },
      intensity: { value: 0.8 },
      time: { value: 0 },
    },
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  atmoMesh.visible = false;
  scene.add(atmoMesh);

  const ringGeo = new THREE.RingGeometry(1.5, 2.6, 96);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xccaa88,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x332211,
    emissiveIntensity: 0.1,
  });
  ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2.5;
  ringMesh.visible = false;
  scene.add(ringMesh);

  floatParticles = createFloatingParticles();
  scene.add(floatParticles);

  updatePlanetDisplay();
  setTimeout(() => renderer.render(scene, camera), 100);
  animate();
};

const textureLoader = new THREE.TextureLoader();

const updatePlanetDisplay = () => {
  const data = currentPlanet.value;
  if (!planetMesh || !atmoMesh) return;

  let texture;

  if (data.image) {
    texture = textureLoader.load(data.image);
  } else {
    texture = createRealisticTexture(data.colors, data.typeLabel || 'generic');
  }

  planetMesh.material.map = texture;
  planetMesh.material.needsUpdate = true;

  const c = new THREE.Color(data.colors[0]);
  planetMesh.material.color.set(c);
  planetMesh.material.emissive.set(c.clone().multiplyScalar(0.3));
  planetMesh.material.emissiveIntensity = 0.25;

  if (atmoMesh.visible) {
    atmoMesh.material.uniforms.color.value.set(data.atmo);
    atmoMesh.material.uniforms.intensity.value = 0.8;
  }

  planetMesh.rotation.x = data.tilt || 0;
  planetMesh.rotation.z = 0;
  atmoMesh.rotation.x = data.tilt || 0;
  atmoMesh.rotation.z = 0;

  if (data.hasRings) {
    ringMesh.visible = true;
    const ringColor = new THREE.Color(data.colors[0]);
    ringMesh.material.color.set(ringColor);
    ringMesh.material.emissive.set(ringColor.clone().multiplyScalar(0.3));
    ringMesh.material.emissiveIntensity = 0.2;
  } else {
    ringMesh.visible = false;
  }

  planetMesh.scale.set(0.3, 0.3, 0.3);
  atmoMesh.scale.set(0.3, 0.3, 0.3);

  renderer.render(scene, camera);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  time += 0.01;

  if (planetMesh) {
    const s = planetMesh.scale.x;
    if (s < 1.0) {
      const newS = Math.min(s + 0.015, 1.0);
      planetMesh.scale.set(newS, newS, newS);
      atmoMesh.scale.set(newS * 1.06, newS * 1.06, newS * 1.06);
    } else {
      const breathe = 1.0 + 0.018 * Math.sin(time * 0.9) + 0.008 * Math.sin(time * 2.3 + 1.2);
      planetMesh.scale.set(breathe, breathe, breathe);
      atmoMesh.scale.set(breathe * 1.06, breathe * 1.06, breathe * 1.06);
      planetMesh.material.emissiveIntensity = 0.2 + 0.2 * (0.5 + 0.5 * Math.sin(time * 1.1));
    }
  }

  if (atmoMesh && atmoMesh.visible) {
    const pulse = 0.6 + 0.3 * Math.sin(time * 0.8 + 0.5);
    atmoMesh.material.uniforms.intensity.value = pulse;
    atmoMesh.material.uniforms.time.value = time;
    const hueShift = 0.05 * Math.sin(time * 0.15);
    const baseColor = new THREE.Color(currentPlanet.value.atmo);
    const shifted = baseColor.clone().offsetHSL(hueShift, 0, 0.05);
    atmoMesh.material.uniforms.color.value.lerp(shifted, 0.02);
  }

  if (floatParticles) {
    const positions = floatParticles.geometry.attributes.position.array;
    const speeds = floatParticles.userData.speeds || [];
    for (let i = 0; i < positions.length / 3; i++) {
      const idx = i * 3;
      const radius = Math.sqrt(positions[idx]*positions[idx] + positions[idx+1]*positions[idx+1] + positions[idx+2]*positions[idx+2]);
      const theta = Math.atan2(positions[idx+1], positions[idx]);
      const phi = Math.atan2(positions[idx+2], Math.sqrt(positions[idx]*positions[idx] + positions[idx+1]*positions[idx+1]));
      const speed = speeds[i] || 0.1;
      const newTheta = theta + 0.002 * speed * (0.8 + 0.2 * Math.sin(time * 0.5 + i));
      const newPhi = phi + 0.001 * speed * 0.6 * (0.7 + 0.3 * Math.cos(time * 0.4 + i * 0.1));
      positions[idx] = radius * Math.cos(newTheta) * Math.cos(newPhi);
      positions[idx+1] = radius * Math.sin(newTheta) * Math.cos(newPhi);
      positions[idx+2] = radius * Math.sin(newPhi);
    }
    floatParticles.geometry.attributes.position.needsUpdate = true;
    floatParticles.material.size = 0.02 + 0.015 * Math.sin(time * 1.3);
    floatParticles.material.opacity = 0.4 + 0.25 * Math.sin(time * 0.5 + 0.7);
  }

  if (planetMesh) {
    const speedVar = 0.004 + 0.002 * Math.sin(time * 0.25);
    planetMesh.rotation.y += speedVar;
    planetMesh.rotation.x += 0.0003 * Math.sin(time * 0.4);
    const indicator = document.getElementById('speed-indicator');
    if (indicator) indicator.textContent = (speedVar / 0.004).toFixed(1) + 'x';
  }

  if (ringMesh && ringMesh.visible) {
    ringMesh.rotation.z += 0.0015;
    ringMesh.material.opacity = 0.4 + 0.3 * Math.sin(time * 0.4 + 0.7);
    const baseColor = new THREE.Color(currentPlanet.value.colors[0]);
    const shifted = baseColor.clone().offsetHSL(0.02 * Math.sin(time * 0.1), 0, 0.05);
    ringMesh.material.color.lerp(shifted, 0.02);
  }

  renderer.render(scene, camera);
};

// ============================================================
//  TOUR LOGIC
// ============================================================
let lastTime = 0;
const runTour = (timestamp) => {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (!isPaused.value) {
    timer.value += delta;
    if (timer.value >= SWITCH_TIME) {
      timer.value = 0;
      currentIndex.value = (currentIndex.value + 1) % planetData.length;
    }
  }
  requestAnimationFrame(runTour);
};

const toggleTour = () => { isPaused.value = !isPaused.value; };
watch(currentIndex, () => updatePlanetDisplay());

// ============================================================
//  RESIZE
// ============================================================
const handleResize = () => {
  if (!canvasBox.value) return;
  const w = canvasBox.value.clientWidth;
  const h = canvasBox.value.clientHeight;
  if (w > 0 && h > 0) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
};

// ============================================================
//  LIFECYCLE
// ============================================================
let cleanupBG = null;

onMounted(() => {
  nextTick(() => {
    cleanupBG = initStarBackground();
    initThree();
    requestAnimationFrame(runTour);
    window.addEventListener('resize', handleResize);
  });
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (cleanupBG) cleanupBG();
  window.removeEventListener('resize', handleResize);
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
});
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(20px); }
::-webkit-scrollbar { display: none; }

/* Typing Cursor */
.typing-cursor::after {
  content: '|';
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  color: #06b6d4;
  font-weight: 300;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Slow Pulse Animation */
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
</style>