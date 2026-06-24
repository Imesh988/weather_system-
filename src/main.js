// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css'; // ඔබගේ style file එක

const app = createApp(App);
app.use(router);
app.mount('#app');