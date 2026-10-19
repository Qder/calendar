import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DebugNotificationView from '@/views/DebugNotificationView.vue'

const router = createRouter({
  // Hash history works under Capacitor file:// and Tauri custom schemes.
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/debug/notifications',
      name: 'debug-notifications',
      component: DebugNotificationView,
    },
  ],
})

export default router
