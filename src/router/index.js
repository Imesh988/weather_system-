// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import AnimatedHero from '../components/AnimatedHero.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AnimatedHero,
  },
  {
    path: '/planets',
    name: 'Planets',
    // Lazy load
   
  },
  {
    path: '/about',
    name: 'About',
   
  },
  {
    path: '/contact',
    name: 'Contact',
   
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;