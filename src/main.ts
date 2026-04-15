import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'vue-sonner/style.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

const hidePreloader = () => {
  window.requestAnimationFrame(() => {
    document.body.classList.add('preloader-hidden')

    window.setTimeout(() => {
      document.getElementById('app-preloader')?.remove()
    }, 420)
  })
}

router.isReady().finally(() => {
  window.setTimeout(hidePreloader, 180)
})
