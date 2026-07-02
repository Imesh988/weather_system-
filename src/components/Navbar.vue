<template>
  <nav class="fixed top-10 right-9 left-[67%] -translate-x-1/2 z-50 animate-slide-down">
    <!-- Main Navbar Container -->
    <div 
      class="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 px-4 sm:px-6 rounded-[3rem]"
    >
      <router-link 
        v-for="link in navLinks" 
        :key="link.path"
        :to="link.path" 
        class="relative flex flex-col items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-[2rem] transition-all duration-500 group overflow-visible"
        active-class="active-link"
      >
        <!-- Orbiting Stars -->
        <div class="stars-container opacity-0 group-hover:opacity-100 group-[.active-link]:opacity-100 transition-opacity duration-700">
          <div class="star star-1"></div>
          <div class="star star-2"></div>
          <div class="star star-3"></div>
          <div class="star star-4"></div>
        </div>

        <!-- Icon Wrapper -->
        <div class="relative z-10 icon-animation-wrapper">
          <div 
            v-html="iconMap[link.iconKey]" 
            class="w-7 h-7 sm:w-9 sm:h-9 transition-all duration-500 animated-icon"
            :class="route.path === link.path ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-300'"
          ></div>
          
          <!-- Badge -->
          <span 
            v-if="link.badge" 
            class="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black text-black bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-bounce"
          >
            {{ link.badge }}
          </span>
        </div>

        <!-- Label Text -->
        <span 
          class="mt-1 sm:mt-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 group-[.active-link]:opacity-100"
          :class="route.path === link.path ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-200'"
        >
          {{ link.name }}
        </span>

        <!-- Active Indicator -->
        <div 
          v-if="route.path === link.path"
          class="absolute bottom-2 sm:bottom-3 w-6 sm:w-8 h-[3px] rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]"
        ></div>

      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();

const iconMap = {
  Home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>`,
  Dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  Projects: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  Messages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  Analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  Team: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  Settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

const navLinks = [
  { name: 'Home', path: '/', iconKey: 'Home' },
  { name: 'Dash', path: '/dashboard', iconKey: 'Dashboard' },
  { name: 'Projects', path: '/projects', iconKey: 'Projects' },
  { name: 'Inbox', path: '/messages', iconKey: 'Messages', badge: 5 },
  { name: 'Stats', path: '/analytics', iconKey: 'Analytics' },
  { name: 'Team', path: '/team', iconKey: 'Team' },
  { name: 'Settings', path: '/settings', iconKey: 'Settings' },
];
</script>

<style scoped>
/* Entry Animation - උඩ සිට පහළට එන */
@keyframes slideDown {
  from { transform: translate(-50%, -100px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
.animate-slide-down {
  animation: slideDown 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards;
}

/* Floating Animation for Icons */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.icon-animation-wrapper {
  animation: float 3s ease-in-out infinite;
}

/* SVG Styling */
:deep(svg) {
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  transition: filter 0.3s ease;
}

/* Hover/Active දීප්තිය */
.group:hover :deep(svg),
.active-link :deep(svg) {
  filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.8));
}

/* Stars */
.stars-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.star {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #22d3ee;
  border-radius: 50%;
  box-shadow: 0 0 10px #22d3ee;
}
.star-1 { animation: orbit 4s linear infinite; }
.star-2 { animation: orbit 3s linear infinite reverse; animation-delay: -1s; }
.star-3 { animation: orbit 5s linear infinite; animation-delay: -2s; }
.star-4 { animation: orbit 3.5s linear infinite reverse; }

@keyframes orbit {
  from { transform: rotate(0deg) translateX(35px) rotate(0deg); opacity: 1; }
  50% { opacity: 0.5; }
  to { transform: rotate(360deg) translateX(35px) rotate(-360deg); opacity: 1; }
}

.active-link {
  background: radial-gradient(circle at center, rgba(34, 211, 238, 0.15) 0%, transparent 70%);
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .star { width: 2px; height: 2px; }
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(25px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(25px) rotate(-360deg); }
  }
}
</style>