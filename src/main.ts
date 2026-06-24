import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import './assets/main.css'
import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPersist)
createApp(App).use(pinia).mount('#app')
