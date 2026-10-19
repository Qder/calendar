import { createRouter, createWebHashHistory } from 'vue-router'
import DebugNotificationView from '@/views/DebugNotificationView.vue'

const router = createRouter({
  // Hash history works under Capacitor file:// and Tauri custom schemes.
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/debug/notifications' },
    {
      path: '/debug/notifications',
      name: 'debug-notifications',
      component: DebugNotificationView,
    },
  ],
})

export default router
