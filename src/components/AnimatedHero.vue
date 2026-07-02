<template>
  <div class="relative w-full h-screen overflow-hidden bg-[#050b14]">
    <Navbar />
    <!-- Three.js Canvas Container -->
    <div ref="canvasContainer" class="absolute inset-0 w-full h-full z-0"></div>
    
    <!-- Overlay Content -->
    <div class="absolute inset-0 z-10 pointer-events-none">
      
      <!-- 1. LEFT SIDE - ExploreX Branding Content -->
      <div class="flex items-center justify-start h-full w-full px-6 md:px-12 lg:px-20">
        <div class="pointer-events-auto max-w-4xl">
          <div class="space-y-4">
            
            <!-- 🌟 Small Badge - Animated -->
            <div class="flex items-center gap-3 mb-2 animated-badge">
              <span class="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"></span>
              <span class="text-cyan-400/70 text-xs md:text-sm font-mono tracking-[0.2em] uppercase badge-text animated-badge-text">
                ✦ Kegalu Vidyalaya ✦
              </span>
              <span class="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400"></span>
            </div>

            <!-- 🚀 Main Title: ExploreX (Animated Letters) -->
            <h1 class="text-6xl md:text-8xl lg:text-9xl font-extrabold leading-none animated-title">
              <!-- Prefix Color - "✦" Symbol before ExploreX -->
              <span class="title-prefix inline-block mr-2 text-5xl md:text-7xl lg:text-8xl">
                <span class="animated-prefix">
                  ✦
                </span>
              </span>
              <span class="title-part explore-text">
                <span 
                  v-for="(char, index) in exploreChars" 
                  :key="index"
                  class="inline-block animated-letter"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  {{ char === ' ' ? '&nbsp;' : char }}
                </span>
              </span>
              <span class="title-part x-text">
                <span 
                  v-for="(char, index) in xChars" 
                  :key="index"
                  class="inline-block animated-letter"
                  :style="{ animationDelay: `${(exploreChars.length + index) * 0.1}s` }"
                >
                  {{ char }}
                </span>
              </span>
            </h1>

            <!-- 📝 Subtitle with Typewriter Effect -->
            <div class="relative mt-2">
              <p 
                class="text-xl md:text-3xl lg:text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-cyan-200/90 to-blue-200/90 typewriter-text animated-subtitle"
                v-html="displayedText"
              ></p>
              <!-- Blinking Cursor -->
              <span 
                class="inline-block w-0.5 h-6 md:h-8 lg:h-10 bg-cyan-300 ml-1 align-middle animated-cursor"
                :style="{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.1s' }"
              ></span>
            </div>

            <!-- 🏫 Organization Details - Animated -->
            <div class="flex flex-wrap items-center gap-6 pt-3 animated-details">
              <div class="flex items-center gap-2 detail-item">
                <span class="text-cyan-400/60 text-sm">✦</span>
                <span class="text-cyan-300/70 text-sm md:text-base font-mono tracking-wider">
                  Science Society
                </span>
              </div>
              <div class="w-px h-6 bg-cyan-400/20"></div>
              <div class="flex items-center gap-2 detail-item">
                <span class="text-purple-400/60 text-sm">✦</span>
                <span class="text-blue-300/70 text-sm md:text-base font-mono tracking-wider">
                  EST. 2024
                </span>
              </div>
              <div class="w-px h-6 bg-cyan-400/20"></div>
              <div class="flex items-center gap-2 detail-item">
                <span class="text-cyan-400/60 text-sm">✦</span>
                <span class="text-cyan-300/70 text-sm md:text-base font-mono tracking-wider">
                  #ExploreTheCosmos
                </span>
              </div>
            </div>

            <!-- 📌 Tagline / Motto - Animated -->
            <div class="pt-2 animated-tagline">
              <p class="text-cyan-400/40 text-xs md:text-sm font-mono tracking-[0.3em] uppercase tagline-text">
                — Inspiring the Next Generation of Explorers —
              </p>
            </div>

            <!-- 🔮 Decorative Line - Animated -->
            <div class="flex items-center gap-4 pt-1 animated-divider">
              <div class="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent divider-line"></div>
              <span class="text-cyan-400/30 text-xs divider-diamond">◈</span>
              <div class="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent divider-line"></div>
            </div>

          </div>
        </div>
      </div>

      <!-- 2. RIGHT SIDE SLIDESHOW -->
      <div class="absolute left-[75%] top-1/2 -translate-y-1/2 z-20 hidden md:block">
        <Transition name="fade-slide" mode="out-in">
          <img 
            :key="currentIndex"
            :src="currentImage.src" 
            :alt="currentImage.alt" 
            class="w-80 h-80 md:w-[500px] md:h-[500px] rounded-full object-cover up-down-animation hover:scale-105 transition-transform duration-500 cursor-pointer"
          />
        </Transition>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import Navbar from './Navbar.vue';

// --- 📸 1. Images List ---
const sideImages = [
  { src: '/images/images.jpeg', alt: 'ExploreX Image' },
];

const currentIndex = ref(0);
const currentImage = computed(() => sideImages[currentIndex.value]);
let slideInterval = null;

// --- 🎠 2. Slideshow Logic ---
const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % sideImages.length;
};

const startSlideshow = () => {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 4000);
};

// --- ✍️ 3. Typewriter Effect Logic ---
const fullText = "Exploring the Universe, Inspiring the Future...";
const displayedText = ref('');
const cursorVisible = ref(true);

let typewriterInterval = null;
let currentCharIndex = 0;
let isDeleting = false;

// --- 🔤 Split Text for Animation ---
const exploreChars = 'Explore'.split('');
const xChars = 'X'.split('');

const typeWriter = () => {
  if (!isDeleting) {
    if (currentCharIndex < fullText.length) {
      displayedText.value = fullText.substring(0, currentCharIndex + 1);
      currentCharIndex++;
    } else {
      clearInterval(typewriterInterval);
      setTimeout(() => {
        isDeleting = true;
        typewriterInterval = setInterval(typeWriter, 50);
      }, 2500);
    }
  } else {
    if (currentCharIndex > 0) {
      displayedText.value = fullText.substring(0, currentCharIndex - 1);
      currentCharIndex--;
    } else {
      clearInterval(typewriterInterval);
      setTimeout(() => {
        isDeleting = false;
        typewriterInterval = setInterval(typeWriter, 80);
      }, 1200);
    }
  }
};

// --- 🌌 4. Three.js Animated Background ---
const canvasContainer = ref(null);
let scene, camera, renderer, animationId;

// Animation objects
const waveLines = [];
const floatingStars = [];
const colorPlanets = [];

// Sync timing variables
const SYNC_SPEED = 0.6;

function initScene() {
  if (!canvasContainer.value) return;
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050b14);

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.set(0, 0.5, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // --- 1. Wave Lines (Aqua + Purple Mix) ---
  const waveColors = [0x4FC3F7, 0x29B6F6, 0x7C4DFF, 0x81D4FA, 0xB388FF];
  
  for (let i = 0; i < 5; i++) {
    const points = [];
    const segments = 64;
    const radius = 1.5 + i * 0.6;
    const color = waveColors[i % waveColors.length];
    
    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      points.push(new THREE.Vector3(x, 0, z));
    }
    
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15 + i * 0.06,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    
    waveLines.push({
      mesh: line,
      radius: radius,
      speed: SYNC_SPEED * (0.8 + i * 0.05),
      phase: i * 1.0,
      amplitude: 0.08 + i * 0.025,
      segments: segments,
    });
  }

  // --- 2. Floating Stars ---
  const starCount = 150;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starData = [];

  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 14;
    const y = (Math.random() - 0.5) * 7;
    const z = (Math.random() - 0.5) * 8 - 1;
    starPos[i * 3] = x;
    starPos[i * 3 + 1] = y;
    starPos[i * 3 + 2] = z;
    
    starData.push({
      speed: SYNC_SPEED * (0.5 + Math.random() * 0.5),
      amplitude: 0.08 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      baseY: y,
      baseX: x,
      baseZ: z,
    });
  }
  
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x4FC3F7,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  });
  const starSystem = new THREE.Points(starGeo, starMat);
  scene.add(starSystem);
  
  floatingStars.push({
    mesh: starSystem,
    data: starData,
    positions: starPos,
    type: 'star',
  });

  // --- 3. Color-Shifting Planets (Aqua ↔ Purple) ---
  const planetCount = 8;
  for (let i = 0; i < planetCount; i++) {
    const radius = 0.06 + Math.random() * 0.16;
    const geo = new THREE.CircleGeometry(radius, 16);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x4FC3F7,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.4,
      emissive: 0x4FC3F7,
      emissiveIntensity: 0.1,
      side: THREE.DoubleSide,
    });
    const planet = new THREE.Mesh(geo, mat);
    
    const x = (Math.random() - 0.5) * 12;
    const y = (Math.random() - 0.5) * 5;
    const z = (Math.random() - 0.5) * 6 - 1;
    planet.position.set(x, y, z);
    
    planet.rotation.x = Math.random() * Math.PI;
    planet.rotation.y = Math.random() * Math.PI;
    
    scene.add(planet);
    
    colorPlanets.push({
      mesh: planet,
      data: {
        speed: SYNC_SPEED * (0.4 + Math.random() * 0.4),
        amplitude: 0.1 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        baseY: y,
        baseX: x,
        baseZ: z,
        colorSpeed: 0.2 + Math.random() * 0.4,
        colorOffset: Math.random() * Math.PI * 2,
      },
    });
  }

  // --- 4. Rocket Particles ---
  const rocketParticles = new THREE.BufferGeometry();
  const rCount = 40;
  const rPos = new Float32Array(rCount * 3);
  const rData = [];

  for (let i = 0; i < rCount; i++) {
    const x = (Math.random() - 0.5) * 12;
    const y = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6 - 1;
    rPos[i * 3] = x;
    rPos[i * 3 + 1] = y;
    rPos[i * 3 + 2] = z;
    
    rData.push({
      speed: SYNC_SPEED * (0.5 + Math.random() * 0.6),
      amplitude: 0.1 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      baseY: y,
      baseX: x,
      baseZ: z,
      direction: Math.random() * Math.PI * 2,
    });
  }
  
  rocketParticles.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  const rMat = new THREE.PointsMaterial({
    color: 0xB388FF,
    size: 0.035,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });
  const rSystem = new THREE.Points(rocketParticles, rMat);
  scene.add(rSystem);
  
  floatingStars.push({
    mesh: rSystem,
    data: rData,
    positions: rPos,
    type: 'rocket',
  });

  // --- 5. Glow Rings ---
  for (let i = 0; i < 4; i++) {
    const radius = 0.8 + i * 0.35;
    const geo = new THREE.RingGeometry(radius - 0.02, radius, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: i % 2 === 0 ? 0x4FC3F7 : 0xB388FF,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
      emissive: i % 2 === 0 ? 0x4FC3F7 : 0xB388FF,
      emissiveIntensity: 0.02,
    });
    const ring = new THREE.Mesh(geo, mat);
    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 4;
    const z = (Math.random() - 0.5) * 4 - 2;
    ring.position.set(x, y, z);
    ring.rotation.x = Math.random() * 0.5;
    ring.rotation.y = Math.random() * 0.5;
    scene.add(ring);
    
    floatingStars.push({
      mesh: ring,
      data: {
        speed: SYNC_SPEED * (0.1 + i * 0.03),
        amplitude: 0.03,
        phase: i * 0.8,
        baseY: y,
        baseX: x,
        baseZ: z,
      },
      type: 'ring',
    });
  }

  // --- Animation Loop ---
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    const syncTime = time * SYNC_SPEED;

    // Animate Waves
    waveLines.forEach((wave, index) => {
      const positions = wave.mesh.geometry.attributes.position;
      const array = positions.array;
      const segments = wave.segments;
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const waveOffset = Math.sin(theta * 2 + syncTime * wave.speed + wave.phase) * wave.amplitude;
        const idx = i * 3;
        array[idx] = wave.radius * Math.cos(theta);
        array[idx + 1] = waveOffset;
        array[idx + 2] = wave.radius * Math.sin(theta);
      }
      positions.needsUpdate = true;
      
      const opacityPulse = 0.15 + Math.sin(syncTime * 0.5 + index * 0.8) * 0.08;
      wave.mesh.material.opacity = Math.max(0.05, opacityPulse);
    });

    // Animate Floating Stars & Rocket Particles
    floatingStars.forEach((obj) => {
      if (obj.type === 'ring') {
        const data = obj.data;
        const floatOffset = Math.sin(syncTime * data.speed + data.phase) * data.amplitude;
        obj.mesh.position.y = data.baseY + floatOffset;
        obj.mesh.rotation.z += 0.001;
        return;
      }
      
      const dataArray = obj.data;
      const positions = obj.positions;
      
      for (let i = 0; i < dataArray.length; i++) {
        const d = dataArray[i];
        const floatOffset = Math.sin(syncTime * d.speed + d.phase) * d.amplitude;
        const idx = i * 3;
        
        if (obj.type === 'rocket') {
          const angle = syncTime * d.speed * 0.4 + d.direction;
          const radius = 0.3 + Math.sin(syncTime * d.speed + d.phase) * 0.2;
          positions[idx] = d.baseX + radius * Math.cos(angle);
          positions[idx + 1] = d.baseY + floatOffset + Math.sin(angle) * 0.08;
          positions[idx + 2] = d.baseZ + radius * Math.sin(angle);
        } else {
          positions[idx] = d.baseX + Math.sin(syncTime * 0.15 + d.phase) * 0.04;
          positions[idx + 1] = d.baseY + floatOffset;
          positions[idx + 2] = d.baseZ + Math.cos(syncTime * 0.15 + d.phase) * 0.04;
        }
      }
      obj.mesh.geometry.attributes.position.needsUpdate = true;
    });

    // Animate Planets
    colorPlanets.forEach((planet) => {
      const data = planet.data;
      const floatOffset = Math.sin(syncTime * data.speed + data.phase) * data.amplitude;
      planet.mesh.position.y = data.baseY + floatOffset;
      
      const hue = (Math.sin(syncTime * data.colorSpeed + data.colorOffset) + 1) * 0.5;
      const color = new THREE.Color().setHSL(0.55 + hue * 0.3, 0.8, 0.5);
      planet.mesh.material.color.copy(color);
      planet.mesh.material.emissive.copy(color);
      
      const pulse = 1 + Math.sin(syncTime * data.speed + data.phase) * 0.08;
      planet.mesh.scale.set(pulse, pulse, 1);
      planet.mesh.rotation.z += 0.008;
    });

    // Camera sway
    const camSway = Math.sin(syncTime * 0.12) * 0.02;
    camera.position.x = camSway;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };
  animate();
}

function onResize() {
  if (!canvasContainer.value) return;
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

onMounted(() => {
  initScene();
  startSlideshow();
  window.addEventListener('resize', onResize);
  
  // Start typewriter effect
  setTimeout(() => {
    typewriterInterval = setInterval(typeWriter, 80);
  }, 500);
  
  // Blinking cursor
  setInterval(() => {
    cursorVisible.value = !cursorVisible.value;
  }, 500);
});

onBeforeUnmount(() => {
  clearInterval(slideInterval);
  if (typewriterInterval) clearInterval(typewriterInterval);
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
/* 🚀 1. Image Up-Down Animation */
.up-down-animation {
  animation: floatUpDown 5s ease-in-out infinite;
}

@keyframes floatUpDown {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-30px); }
}

/* 🎭 2. Image Fade + Slide Animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.8s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.8);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50px) scale(0.8);
}

/* 🌟 Glow Effect */
img {
  filter: drop-shadow(0 0 30px rgba(108, 180, 238, 0.25));
}

/* ======================================================== */
/* ✍️ 3. TYPEWRITER TEXT STYLING */
/* ======================================================== */
.typewriter-text {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  text-shadow: 0 0 30px rgba(79, 195, 247, 0.15);
  line-height: 1.3;
}

/* Typewriter cursor blinking */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.animated-cursor {
  animation: blink 0.7s ease-in-out infinite;
}

/* ======================================================== */
/* 🎨 4. ANIMATED LETTERS - EXPLORE X */
/* ======================================================== */
.animated-title {
  display: inline-block;
}

.title-part {
  display: inline-block;
}

/* --- Prefix Symbol Animation --- */
.title-prefix {
  display: inline-block;
  vertical-align: middle;
}

.animated-prefix {
  display: inline-block;
  background: linear-gradient(135deg, #4FC3F7, #7C4DFF, #E040FB);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite, floatPrefix 3s ease-in-out infinite, glowPrefix 2s ease-in-out infinite;
}

@keyframes floatPrefix {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-5px) scale(1.1); }
}

@keyframes glowPrefix {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(79, 195, 247, 0.3)); }
  50% { filter: drop-shadow(0 0 30px rgba(124, 77, 255, 0.6)); }
}

/* --- Animated Letters --- */
.animated-letter {
  display: inline-block;
  animation: letterFloat 3s ease-in-out infinite, letterGlow 2s ease-in-out infinite;
  transform-origin: center;
}

/* Each letter floats up and down */
@keyframes letterFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
}

/* Glow effect for letters */
@keyframes letterGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(79, 195, 247, 0.2); }
  50% { text-shadow: 0 0 30px rgba(79, 195, 247, 0.6), 0 0 60px rgba(79, 195, 247, 0.2); }
}

/* Special styling for "Explore" part */
.explore-text .animated-letter {
  background: linear-gradient(135deg, #4FC3F7, #29B6F6, #7C4DFF);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: letterFloat 3s ease-in-out infinite, gradientShift 4s ease-in-out infinite;
}

/* Special styling for "X" part */
.x-text .animated-letter {
  background: linear-gradient(135deg, #7C4DFF, #E040FB, #4FC3F7);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: letterFloat 3s ease-in-out infinite, gradientShift 4s ease-in-out infinite reverse;
}

/* Gradient shifting animation */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ======================================================== */
/* 🏷️ 5. ANIMATED BADGE */
/* ======================================================== */
.animated-badge {
  animation: fadeInLeft 1s ease-out;
}

@keyframes fadeInLeft {
  0% { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
}

.badge-text {
  animation: pulseText 3s ease-in-out infinite;
}

/* 🆕 Animated Badge Text - "Kegalu Vidyalaya" */
.animated-badge-text {
  display: inline-block;
  background: linear-gradient(135deg, #4FC3F7, #81D4FA, #7C4DFF);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: badgeGradient 4s ease-in-out infinite, pulseText 3s ease-in-out infinite;
  text-shadow: none;
}

@keyframes badgeGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulseText {
  0%, 100% { opacity: 0.7; filter: brightness(0.8); }
  50% { opacity: 1; filter: brightness(1); }
}

/* ======================================================== */
/* 🏫 6. ANIMATED DETAILS */
/* ======================================================== */
.animated-details {
  animation: fadeInUp 1.2s ease-out;
}

.detail-item {
  animation: detailPulse 3s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.3s);
}

.detail-item:nth-child(1) { --i: 0; }
.detail-item:nth-child(3) { --i: 1; }
.detail-item:nth-child(5) { --i: 2; }

@keyframes detailPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* ======================================================== */
/* 📌 7. ANIMATED TAGLINE */
/* ======================================================== */
.animated-tagline {
  animation: fadeInUp 1.5s ease-out;
}

.tagline-text {
  animation: taglineGlow 4s ease-in-out infinite;
}

@keyframes taglineGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(79, 195, 247, 0.1); letter-spacing: 0.3em; }
  50% { text-shadow: 0 0 20px rgba(79, 195, 247, 0.3); letter-spacing: 0.5em; }
}

/* ======================================================== */
/* 🔮 8. ANIMATED DIVIDER */
/* ======================================================== */
.animated-divider {
  animation: fadeInUp 1.8s ease-out;
}

.divider-line {
  animation: lineExpand 3s ease-in-out infinite;
}

@keyframes lineExpand {
  0%, 100% { transform: scaleX(1); opacity: 0.3; }
  50% { transform: scaleX(1.2); opacity: 0.6; }
}

.divider-diamond {
  animation: diamondSpin 6s linear infinite;
}

@keyframes diamondSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ======================================================== */
/* 📱 9. MOBILE HIDE */
/* ======================================================== */
@media (max-width: 768px) {
  .hidden.md\:block {
    display: none !important;
  }
}

/* ======================================================== */
/* 🎯 10. SUBTITLE ANIMATION */
/* ======================================================== */
.animated-subtitle {
  animation: subtitleFade 2s ease-out;
}

@keyframes subtitleFade {
  0% { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
}
</style>