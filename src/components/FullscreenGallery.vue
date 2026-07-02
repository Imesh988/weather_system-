<template>
  <!-- Gallery Container - Fullscreen Mode එකේදී Fixed Overlay එකක් වෙයි -->
  <div 
    class="relative w-full h-full flex items-center justify-center transition-all duration-500"
    :class="{
      'fixed inset-0 z-[9999] bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-xl p-6 md:p-12': isFullscreen
    }"
  >
    <!-- Fullscreen Toggle Button -->
    <button 
      @click.stop="toggleFullscreen" 
      class="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white hover:scale-105 p-2.5 rounded-full shadow-xl border border-slate-200/80 transition-all duration-300 backdrop-blur-sm"
      :class="{ 'shadow-2xl': isFullscreen }"
    >
      <!-- Expand / Collapse Icons -->
      <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- 3D Rotation Area -->
    <div 
      class="flex-1 relative flex items-center justify-center w-full h-full overflow-visible"
      style="perspective: 1200px;"
    >
      <!-- Circle Wrapper - Dynamic Sizes (එක :style එකකට ඒකාබද්ධ කර ඇත) -->
      <div 
        class="relative transition-all duration-700 ease-in-out"
        :style="{
          width: circleSize + 'px',
          height: circleSize + 'px',
          transformStyle: 'preserve-3d',
          animation: `spinCircle ${rotationSpeed} linear infinite`
        }"
        :class="{ 'animate-pause': isHovering }"
        @mouseenter="isHovering = true"
        @mouseleave="isHovering = false"
      >
        <!-- Rotating Images -->
        <div
          v-for="(image, index) in imageList"
          :key="index"
          class="absolute rounded-full border-4 border-white/90 shadow-2xl overflow-hidden transition-all duration-300"
          :style="{
            width: imageSize + 'px',
            height: imageSize + 'px',
            transform: `rotateY(${index * (360 / imageList.length)}deg) translateZ(${translateZ}px)`,
            background: `url(${image.url}) center/cover no-repeat`,
          }"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
        >
          <!-- Placeholder -->
          <div class="w-full h-full bg-gradient-to-br from-slate-300 to-slate-500 animate-pulse"></div>
          <!-- Actual Image -->
          <img 
            :src="image.url" 
            :alt="'Satellite ' + (index + 1)"
            class="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <!-- Center Glow -->
      <div 
        class="absolute bg-blue-500/20 blur-3xl rounded-full pointer-events-none transition-all duration-700"
        :style="{ width: glowSize + 'px', height: glowSize + 'px' }"
      ></div>

      <!-- Bottom Status Tag -->
      <div 
        class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/80 shadow-sm text-[10px] text-slate-600 font-medium flex items-center gap-2 pointer-events-none whitespace-nowrap transition-all duration-300"
        :class="{ 'bottom-8 px-6 py-2 text-sm': isFullscreen }"
      >
        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        {{ imageList.length }} Satellite Views • 3D Orbital Scan
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

// ඔබගේ රූප ලැයිස්තුව (මෙතනට ඔබගේ සැබෑ URLs දාන්න)
const imageList = ref([
  { url: 'https://picsum.photos/seed/sat1/400/400' },
  { url: 'https://picsum.photos/seed/sat2/400/400' },
  { url: 'https://picsum.photos/seed/sat3/400/400' },
  { url: 'https://picsum.photos/seed/sat4/400/400' },
  { url: 'https://picsum.photos/seed/sat5/400/400' },
  { url: 'https://picsum.photos/seed/sat6/400/400' },
  { url: 'https://picsum.photos/seed/sat7/400/400' },
  { url: 'https://picsum.photos/seed/sat8/400/400' },
]);

// මෙය true කරන්න, එවිට පිටුව Load වූ ගමන්ම Fullscreen එකෙන් පෙන්වයි (විකල්ප)
// const isFullscreen = ref(true); 
const isFullscreen = ref(false); // පෙරනිමියෙන් Card එක තුළ

const isHovering = ref(false);
const hoveredIndex = ref(null);

// === Fullscreen Mode එක අනුව Dynamic Sizes ===
const circleSize = computed(() => isFullscreen.value ? 600 : 340);
const imageSize = computed(() => isFullscreen.value ? 150 : 100);
const translateZ = computed(() => isFullscreen.value ? 520 : 300);
const hoverTranslateZ = computed(() => isFullscreen.value ? 580 : 340);
const glowSize = computed(() => isFullscreen.value ? 48 : 32);

// === Rotation Speed ===
const rotationSpeed = computed(() => {
  const baseSpeed = isFullscreen.value ? 25 : 20;
  const adjusted = baseSpeed + (imageList.value.length - 8) * 1.5;
  return `${Math.max(adjusted, 15)}s`;
});

// === Fullscreen Toggle Function ===
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

// Component එක Unmount වෙද්දී Scroll Lock එක ඉවත් කරන්න
onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style scoped>
@keyframes spinCircle {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

.animate-pause {
  animation-play-state: paused !important;
}

/* Hover Effect - CSS v-bind එක හරියට නිවැරදි කර ඇත */
.absolute.rounded-full {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.3s ease;
}
.absolute.rounded-full:hover {
  transform: rotateY(0deg) translateZ(v-bind(hoverTranslateZ)) scale(1.2) !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  z-index: 999;
  border-color: #3B82F6;
}

/* Fullscreen Mode එකේදී Button එකට Hover වෙද්දී */
button:hover svg {
  stroke: #2563EB;
}

/* Browser Support */
@-webkit-keyframes spinCircle {
  0% { -webkit-transform: rotateY(0deg); }
  100% { -webkit-transform: rotateY(360deg); }
}
</style>