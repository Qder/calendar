import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import { wireNotificationTapNavigation } from './services/scheduler/notificationTap'
import { setupPinia } from './stores'

const app = createApp(App)
app.use(setupPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')

void wireNotificationTapNavigation(router)
