import { createRouter, createWebHashHistory } from 'vue-router'
import DebugNotificationView from '@/views/DebugNotificationView.vue'
import EventEditView from '@/views/EventEditView.vue'
import HomeView from '@/views/HomeView.vue'
import MonthView from '@/views/MonthView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  // Hash history works under Capacitor file:// and Tauri custom schemes.
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'month',
      component: MonthView,
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/events/new',
      name: 'event-new',
      component: EventEditView,
    },
    {
      path: '/events/:id',
      name: 'event-edit',
      component: EventEditView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/debug/notifications',
      name: 'debug-notifications',
      component: DebugNotificationView,
    },
  ],
})

export default router
