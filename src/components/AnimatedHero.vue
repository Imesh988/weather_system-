<!-- src/components/AnimatedHero.vue -->
<template>
  <div class="relative w-full h-screen overflow-hidden bg-[#050b14]">
    <div ref="canvasContainer" class="absolute inset-0 w-full h-full z-0"></div>
    
    <div class="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 pointer-events-none">
      <div class="text-center space-y-6 max-w-4xl mx-auto pointer-events-auto">
        <span class="inline-block px-4 py-1.5 rounded-full bg-blue-900/40 backdrop-blur-sm border border-blue-400/30 text-blue-300 text-sm font-semibold tracking-widest uppercase animate-pulse">
          ✦ REAL SOLAR SYSTEM
        </span>
       
        <p class="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
          Explore a solar system with real planets in correct order and relative sizes.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button class="px-8 py-3.5 bg-blue-400 hover:bg-blue-300 text-slate-900 font-bold rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(108,180,238,0.3)] hover:scale-105">
            Start Exploring
          </button>
          <button @click="startRecording" class="px-8 py-3.5 border border-white/40 text-white font-bold rounded-full backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            🎬 Export Video
          </button>
        </div>
      </div>
    </div>
    
  </div>
  <!-- ✅ PlanetTour ටැගය ඉවත් කර ඇත -->
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import ChatBot from './ChatBot.vue';
// ✅ PlanetTour import එක ඉවත් කර ඇත

const canvasContainer = ref(null);
let scene, camera, renderer, particles;
let animationId;
let time = 0;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
const planets = [];

// ============================================================
// "exploreX" සඳහා විචල්‍යයන්
// ============================================================
let exploreXTextSprite = null;
let exploreXParticles = null;
let exploreXGlowSprite = null;
const scrollY = ref(0);

// ============================================================
// 1. PROBABILISTIC / PROCEDURAL TEXTURES
// ============================================================

function generateMercuryTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#8a8a8a');
  grad.addColorStop(0.5, '#a0a0a0');
  grad.addColorStop(1, '#7a7a7a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 20;
    const dark = 40 + Math.random() * 80;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${dark}, ${dark}, ${dark+10})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r*0.25, y - r*0.25, r*0.35, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,200,200,0.3)`;
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const x = 100 + Math.random() * 312;
    const y = 50 + Math.random() * 156;
    const r = 15 + Math.random() * 30;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,60,60,0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,160,160,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function generateVenusTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#e8c99e');
  grad.addColorStop(0.5, '#d4a373');
  grad.addColorStop(1, '#b8865a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 256;
    const h = 5 + Math.random() * 15;
    const alpha = 0.1 + Math.random() * 0.4;
    const bright = 150 + Math.random() * 105;
    ctx.fillStyle = `rgba(${bright}, ${bright-30}, ${bright-70}, ${alpha})`;
    ctx.beginPath();
    for (let x = 0; x < 512; x+=2) {
      const waveY = y + Math.sin(x * 0.02 + i) * 10;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.lineTo(512, y + h);
    for (let x = 512; x >= 0; x-=2) {
      const waveY = y + h + Math.sin(x * 0.02 + i + 1) * 10;
      ctx.lineTo(x, waveY);
    }
    ctx.closePath();
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function generateEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1a5276');
  grad.addColorStop(0.5, '#2e86c1');
  grad.addColorStop(1, '#154360');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  const continentColors = ['#27ae60', '#2ecc71', '#229954', '#1e8449', '#a9dfbf'];
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 256;
    const rx = 20 + Math.random() * 80;
    const ry = 15 + Math.random() * 50;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = continentColors[i % continentColors.length];
    ctx.fill();
    for (let j = 0; j < 20; j++) {
      const sx = cx + (Math.random() - 0.5) * rx * 1.2;
      const sy = cy + (Math.random() - 0.5) * ry * 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(30,80,40,${0.2 + Math.random() * 0.4})`;
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(220,240,255,0.5)';
  ctx.fillRect(0, 0, 512, 30);
  ctx.fillRect(0, 226, 512, 30);
  return new THREE.CanvasTexture(canvas);
}

function generateMarsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#c1440e');
  grad.addColorStop(0.5, '#b53b0a');
  grad.addColorStop(1, '#8a2e0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 10 + Math.random() * 40;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r*0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60,20,10,${0.2 + Math.random() * 0.3})`;
    ctx.fill();
  }
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 12;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,150,100,${0.1 + Math.random() * 0.2})`;
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function generateJupiterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const colors = ['#d4a373', '#c77d5e', '#a45d3c', '#e8c99e', '#b8865a', '#8a5a3a'];
  for (let y = 0; y < 256; y++) {
    const band = Math.floor(y / 20) % colors.length;
    ctx.fillStyle = colors[band];
    ctx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * 256;
    const h = 3 + Math.random() * 8;
    const alpha = 0.2 + Math.random() * 0.5;
    const bright = 180 + Math.random() * 75;
    ctx.fillStyle = `rgba(${bright}, ${bright-40}, ${bright-80}, ${alpha})`;
    for (let x = 0; x < 512; x+=4) {
      const waveY = y + Math.sin(x * 0.03 + i * 2) * 8;
      ctx.fillRect(x, waveY, 4, h);
    }
  }
  ctx.beginPath();
  ctx.ellipse(360, 145, 55, 28, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#c85a3a';
  ctx.shadowColor = '#ffaa77';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#a0402a';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(100 + Math.random() * 300, 80 + Math.random() * 100, 8+Math.random()*15, 4+Math.random()*8, Math.random()*2, 0, Math.PI*2);
    ctx.fillStyle = `rgba(200,120,80,${0.2+Math.random()*0.3})`;
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function generateSaturnTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const colors = ['#ead2ac', '#d4b896', '#c4a882', '#b89872', '#dcc4a0'];
  for (let y = 0; y < 256; y++) {
    const band = Math.floor(y / 30) % colors.length;
    ctx.fillStyle = colors[band];
    ctx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * 256;
    const h = 2 + Math.random() * 6;
    const alpha = 0.1 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(180,160,130,${alpha})`;
    ctx.fillRect(0, y, 512, h);
  }
  return new THREE.CanvasTexture(canvas);
}

function generateSaturnRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(512, 128, 50, 512, 128, 400);
  grad.addColorStop(0, 'rgba(180,160,130,0)');
  grad.addColorStop(0.15, 'rgba(210,190,160,0.9)');
  grad.addColorStop(0.25, 'rgba(160,140,110,0.3)');
  grad.addColorStop(0.35, 'rgba(200,180,150,0.8)');
  grad.addColorStop(0.45, 'rgba(140,120,90,0.2)');
  grad.addColorStop(0.55, 'rgba(220,200,170,0.9)');
  grad.addColorStop(0.65, 'rgba(190,170,140,0.6)');
  grad.addColorStop(0.8, 'rgba(170,150,120,0.4)');
  grad.addColorStop(1, 'rgba(120,100,80,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 40; i++) {
    const y = 80 + Math.random() * 80;
    ctx.fillStyle = `rgba(80,60,40,${Math.random() * 0.2})`;
    ctx.fillRect(0, y, 1024, 1 + Math.random() * 3);
  }
  return new THREE.CanvasTexture(canvas);
}

function generateUranusTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(200, 100, 20, 256, 128, 300);
  grad.addColorStop(0, '#b2ebf2');
  grad.addColorStop(0.5, '#80deea');
  grad.addColorStop(1, '#4dd0e1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 15; i++) {
    const y = 30 + Math.random() * 196;
    ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`;
    ctx.fillRect(0, y, 512, 4 + Math.random() * 8);
  }
  return new THREE.CanvasTexture(canvas);
}

function generateNeptuneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(150, 100, 30, 256, 128, 280);
  grad.addColorStop(0, '#4a6fa5');
  grad.addColorStop(0.6, '#2e4a7a');
  grad.addColorStop(1, '#1a2a5a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  ctx.beginPath();
  ctx.ellipse(300, 140, 35, 20, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,20,50,0.5)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(100, 80, 20, 12, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,20,50,0.3)';
  ctx.fill();
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, 5+Math.random()*15, 3+Math.random()*8, Math.random()*2, 0, Math.PI*2);
    ctx.fillStyle = `rgba(200,220,255,${0.1 + Math.random() * 0.2})`;
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

// ============================================================
// 2. ATMOSPHERE SHADER
// ============================================================
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 glowColor;
  uniform float intensity;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    float glow = pow(rim, 2.5) * intensity;
    gl_FragColor = vec4(glowColor, glow);
  }
`;

// ============================================================
// "exploreX" Canvas Texture Generator
// ============================================================
function generateExploreXTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 512, 128);
  
  ctx.shadowColor = '#6CB4EE';
  ctx.shadowBlur = 40;
  
  ctx.font = 'Bold 72px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, '#4A8DB7');
  gradient.addColorStop(0.5, '#6CB4EE');
  gradient.addColorStop(1, '#B0D4F1');
  ctx.fillStyle = gradient;
  
  ctx.fillText('exploreX', 256, 64);
  
  ctx.shadowBlur = 80;
  ctx.shadowColor = 'rgba(108, 180, 238, 0.5)';
  ctx.fillText('exploreX', 256, 64);
  
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255,255,255,0.2)';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = 'rgba(176, 212, 241, 0.8)';
  ctx.fillText('✦ Exploring the Universe ✦', 256, 110);
  
  return new THREE.CanvasTexture(canvas);
}

// ============================================================
// 3. MAIN PLANET CREATOR
// ============================================================
function createPlanet({
  radius,
  orbitRadius,
  speed,
  phase,
  textureGenerator,
  glowColor = new THREE.Color(0.3, 0.6, 1.0),
  glowIntensity = 0.8,
  hasRings = false,
  ringTextureGenerator = null,
  tilt = 0,
  rotationSpeed = 0.005,
}) {
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  const texture = textureGenerator();
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    metalness: 0.05,
    roughness: 0.7,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const atmoGeo = new THREE.SphereGeometry(radius * 1.025, 48, 48);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      glowColor: { value: glowColor },
      intensity: { value: glowIntensity },
    },
    side: THREE.FrontSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
  mesh.add(atmosphere);

  let ringMesh = null;
  if (hasRings && ringTextureGenerator) {
    const ringGeo = new THREE.RingGeometry(radius * 1.5, radius * 2.8, 128);
    const pos = ringGeo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const len = v3.length();
      ringGeo.attributes.uv.setXY(i, (len - radius * 1.5) / (radius * 1.3), 0.5);
    }
    const ringTex = ringTextureGenerator();
    const ringMat = new THREE.MeshPhysicalMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      roughness: 0.8,
      metalness: 0.0,
      depthWrite: false,
    });
    ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.4;
    ringMesh.rotation.z = 0.4;
    mesh.add(ringMesh);
  }

  const points = [];
  const segments = 80;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = orbitRadius * Math.cos(theta);
    const z = orbitRadius * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, z));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x4A8DB7,
    transparent: true,
    opacity: 0.12,
  });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  scene.add(orbitLine);

  return {
    mesh,
    orbitRadius,
    speed,
    phase,
    tilt,
    rotationSpeed,
    hasRings,
    ringMesh,
  };
}

// ============================================================
// 4. SCENE INITIALIZATION
// ============================================================
function initScene() {
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050b14);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 5, 14);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x303060, 0.6);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0x6CB4EE, 2.5, 35);
  sunLight.position.set(0, 4, 0);
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x4A8DB7, 0.6);
  fillLight.position.set(-5, 2, 6);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0x8BC4F0, 0.3);
  backLight.position.set(3, -1, -10);
  scene.add(backLight);

  const coreGeo = new THREE.SphereGeometry(0.7, 32, 32);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x6CB4EE,
    emissive: 0x4A8DB7,
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.95,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 0, 0);
  scene.add(core);

  const spriteMap = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(108, 180, 238, 1)');
    grad.addColorStop(0.1, 'rgba(74, 141, 183, 0.9)');
    grad.addColorStop(0.5, 'rgba(40, 80, 120, 0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  })();
  const spriteMat = new THREE.SpriteMaterial({
    map: spriteMap,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(12, 12, 1);
  scene.add(sprite);

  const planetConfigs = [
    { radius: 0.35, orbit: 1.8, speed: 0.9, phase: 0.0, tex: generateMercuryTexture, glow: new THREE.Color(0.5,0.5,0.6), glowIntensity: 0.3, rotSpeed: 0.005 },
    { radius: 0.55, orbit: 2.6, speed: 0.7, phase: 1.5, tex: generateVenusTexture, glow: new THREE.Color(0.8,0.7,0.5), glowIntensity: 0.5, rotSpeed: -0.002 },
    { radius: 0.6, orbit: 3.5, speed: 0.55, phase: 2.8, tex: generateEarthTexture, glow: new THREE.Color(0.2,0.5,1.0), glowIntensity: 1.0, rotSpeed: 0.02 },
    { radius: 0.5, orbit: 4.5, speed: 0.45, phase: 0.6, tex: generateMarsTexture, glow: new THREE.Color(0.8,0.3,0.1), glowIntensity: 0.6, rotSpeed: 0.019 },
    { radius: 1.1, orbit: 6.0, speed: 0.25, phase: 2.0, tex: generateJupiterTexture, glow: new THREE.Color(0.7,0.5,0.3), glowIntensity: 0.8, rotSpeed: 0.04 },
    { radius: 0.9, orbit: 7.8, speed: 0.18, phase: 3.2, tex: generateSaturnTexture, glow: new THREE.Color(0.7,0.6,0.4), glowIntensity: 0.5, hasRings: true, ringTex: generateSaturnRingTexture, rotSpeed: 0.035 },
    { radius: 0.7, orbit: 9.5, speed: 0.12, phase: 0.9, tex: generateUranusTexture, glow: new THREE.Color(0.3,0.8,0.9), glowIntensity: 0.6, rotSpeed: -0.025 },
    { radius: 0.68, orbit: 11.0, speed: 0.08, phase: 2.3, tex: generateNeptuneTexture, glow: new THREE.Color(0.2,0.3,0.8), glowIntensity: 0.7, rotSpeed: 0.022 },
  ];

  planetConfigs.forEach((cfg) => {
    const p = createPlanet({
      radius: cfg.radius,
      orbitRadius: cfg.orbit,
      speed: cfg.speed,
      phase: cfg.phase,
      textureGenerator: cfg.tex,
      glowColor: cfg.glow,
      glowIntensity: cfg.glowIntensity,
      hasRings: cfg.hasRings || false,
      ringTextureGenerator: cfg.ringTex || null,
      tilt: (Math.random() - 0.5) * 0.2,
      rotationSpeed: cfg.rotSpeed || 0.005,
    });
    p.mesh.position.x = cfg.orbit;
    scene.add(p.mesh);
    planets.push(p);
  });

  const starsGeo = new THREE.BufferGeometry();
  const starsCount = 5000;
  const posArray = new Float32Array(starsCount * 3);
  const sizes = new Float32Array(starsCount);
  for (let i = 0; i < starsCount * 3; i += 3) {
    const radius = 18 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i+1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i+2] = radius * Math.cos(phi);
    sizes[i/3] = 0.04 + Math.random() * 0.12;
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  starsGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMat = new THREE.PointsMaterial({
    color: 0xB0D4F1,
    size: 0.08,
    transparent: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  particles = new THREE.Points(starsGeo, starMat);
  scene.add(particles);

  const textTexture = generateExploreXTexture();
  const textMaterial = new THREE.SpriteMaterial({
    map: textTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 1,
  });
  exploreXTextSprite = new THREE.Sprite(textMaterial);
  exploreXTextSprite.scale.set(7.0, 1.7, 1);
  exploreXTextSprite.position.set(0, 3.2, 0);
  scene.add(exploreXTextSprite);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const gCtx = glowCanvas.getContext('2d');
  const gradGlow = gCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradGlow.addColorStop(0, 'rgba(108, 180, 238, 0.8)');
  gradGlow.addColorStop(0.3, 'rgba(74, 141, 183, 0.4)');
  gradGlow.addColorStop(1, 'rgba(0,0,0,0)');
  gCtx.fillStyle = gradGlow;
  gCtx.fillRect(0, 0, 256, 256);
  const glowMap = new THREE.CanvasTexture(glowCanvas);
  const glowMat2 = new THREE.SpriteMaterial({
    map: glowMap,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.6,
  });
  exploreXGlowSprite = new THREE.Sprite(glowMat2);
  exploreXGlowSprite.scale.set(10, 10, 1);
  exploreXGlowSprite.position.copy(exploreXTextSprite.position);
  scene.add(exploreXGlowSprite);

  const particleCount = 60;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 3.8;
    pPos[i*3] = Math.cos(angle) * radius;
    pPos[i*3+1] = Math.sin(angle) * radius * 0.25;
    pPos[i*3+2] = Math.sin(angle) * radius;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x6CB4EE,
    size: 0.12,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
  });
  exploreXParticles = new THREE.Points(pGeo, pMat);
  exploreXParticles.position.copy(exploreXTextSprite.position);
  scene.add(exploreXParticles);

  const onScroll = () => {
    scrollY.value = window.scrollY;
  };
  window.addEventListener('scroll', onScroll);

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });
}

// ============================================================
// 5. ANIMATION LOOP
// ============================================================
function animate() {
  animationId = requestAnimationFrame(animate);
  time += 0.006;

  targetX += (mouseX * 2 - targetX) * 0.03;
  targetY += (mouseY * 1.5 - targetY) * 0.03;
  camera.position.x = targetX * 1.8;
  camera.position.y = 5 + targetY * 0.8;
  camera.lookAt(0, 0, 0);

  planets.forEach((p) => {
    const angle = time * p.speed + p.phase;
    p.mesh.position.x = p.orbitRadius * Math.cos(angle);
    p.mesh.position.z = p.orbitRadius * Math.sin(angle);
    p.mesh.position.y = Math.sin(angle * 2) * 0.08 * p.tilt * 3;
    p.mesh.rotation.y += p.rotationSpeed;
    p.mesh.rotation.x += p.rotationSpeed * 0.2;
  });

  const maxScroll = window.innerHeight * 0.8;
  const progress = Math.min(scrollY.value / maxScroll, 1);

  if (exploreXTextSprite) {
    const targetScale = 7.0 - progress * 6.5;
    const currentScale = Math.max(targetScale, 0.5);
    exploreXTextSprite.scale.set(currentScale, currentScale * 0.24, 1);
    exploreXTextSprite.material.opacity = Math.max(1 - progress, 0);
    exploreXTextSprite.position.y = 3.2 + progress * 2.5;
  }

  if (exploreXGlowSprite) {
    const targetScale = 10 - progress * 9;
    exploreXGlowSprite.scale.set(Math.max(targetScale, 0.5), Math.max(targetScale, 0.5), 1);
    exploreXGlowSprite.material.opacity = Math.max(0.6 - progress * 0.6, 0);
    if (exploreXTextSprite) {
      exploreXGlowSprite.position.copy(exploreXTextSprite.position);
    }
  }

  if (exploreXParticles) {
    exploreXParticles.material.opacity = Math.max(0.9 - progress * 0.9, 0);
    const ringScale = 1 - progress * 0.9;
    exploreXParticles.scale.set(Math.max(ringScale, 0.1), Math.max(ringScale, 0.1), Math.max(ringScale, 0.1));
    if (exploreXTextSprite) {
      exploreXParticles.position.copy(exploreXTextSprite.position);
    }
    exploreXParticles.rotation.y += 0.015;
    exploreXParticles.rotation.x = Math.sin(time * 0.2) * 0.08;
    const sizePulse = 0.1 + Math.sin(time * 2) * 0.03;
    exploreXParticles.material.size = sizePulse * (1 - progress * 0.5);
  }

  if (particles) {
    particles.rotation.y += 0.00008;
  }

  renderer.render(scene, camera);
}

// ============================================================
// 6. VIDEO EXPORT
// ============================================================
const isRecording = ref(false);
const startRecording = () => {
  if (!renderer) return;
  const stream = renderer.domElement.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
  });
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exploreX-solar-system.webm';
    a.click();
    URL.revokeObjectURL(url);
    isRecording.value = false;
  };

  recorder.start();
  isRecording.value = true;
  setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop();
  }, 15000);
};

function onResize() {
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// ============================================================
// 7. LIFECYCLE HOOKS
// ============================================================
onMounted(() => {
  initScene();
  animate();
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) renderer.dispose();
  window.removeEventListener('resize', onResize);
  window.removeEventListener('scroll', () => {});
});

defineExpose({ startRecording });
</script>

<style scoped>
</style>