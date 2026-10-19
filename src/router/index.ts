import { createRouter, createWebHashHistory } from 'vue-router'
import { getDeveloperMode } from '@/db/repos/settings'
import BackupView from '@/views/BackupView.vue'
import CourseEditView from '@/views/CourseEditView.vue'
import CourseImportView from '@/views/CourseImportView.vue'
import DebugNotificationView from '@/views/DebugNotificationView.vue'
import EventEditView from '@/views/EventEditView.vue'
import HomeView from '@/views/HomeView.vue'
import MonthView from '@/views/MonthView.vue'
import SettingsView from '@/views/SettingsView.vue'
import WeekView from '@/views/WeekView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'month',
      component: MonthView,
    },
    {
      path: '/week',
      name: 'week',
      component: WeekView,
    },
    {
      path: '/courses/import',
      name: 'course-import',
      component: CourseImportView,
    },
    {
      path: '/courses/new',
      name: 'course-new',
      component: CourseEditView,
    },
    {
      path: '/courses/:id',
      name: 'course-edit',
      component: CourseEditView,
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
      path: '/backup',
      name: 'backup',
      component: BackupView,
    },
    {
      path: '/debug/notifications',
      name: 'debug-notifications',
      component: DebugNotificationView,
      meta: { requiresDeveloper: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresDeveloper) return true
  const on = await getDeveloperMode()
  if (on) return true
  return { name: 'settings' }
})

export default router
