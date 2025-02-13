import { createApp } from 'vue';
import { usePlugins } from './plugins';
import App from './App.vue';
import './styles/index.css';

createApp(App).use(usePlugins).mount('#app');
