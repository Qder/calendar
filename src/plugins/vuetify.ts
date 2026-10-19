import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

/** 规范色板仅在此与 courseColors 定义；组件内禁止写死 hex */
const lightColors = {
  primary: '#4F6BED',
  'primary-container': '#EEF1FE',
  secondary: '#6B7280',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  'surface-bright': '#FFFFFF',
  'surface-variant': '#EEF1FE',
  'on-primary': '#FFFFFF',
  'on-primary-container': '#1F2430',
  'on-secondary': '#FFFFFF',
  'on-background': '#1F2430',
  'on-surface': '#1F2430',
  'on-surface-variant': '#6B7280',
  outline: '#E6E8EF',
  'outline-variant': '#E6E8EF',
  error: '#E5484D',
  weekend: '#E5484D',
  'on-weekend': '#FFFFFF',
}

const darkColors = {
  primary: '#8EA0FF',
  'primary-container': '#2A3148',
  secondary: '#9CA3AF',
  background: '#12141A',
  surface: '#1B1E26',
  'surface-bright': '#1B1E26',
  'surface-variant': '#2A3148',
  'on-primary': '#12141A',
  'on-primary-container': '#E8EAF0',
  'on-secondary': '#12141A',
  'on-background': '#E8EAF0',
  'on-surface': '#E8EAF0',
  'on-surface-variant': '#9CA3AF',
  outline: '#2E3340',
  'outline-variant': '#2E3340',
  error: '#E5484D',
  weekend: '#E5484D',
  'on-weekend': '#FFFFFF',
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: lightColors,
      },
      dark: {
        dark: true,
        colors: darkColors,
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
    },
    VBtn: {
      rounded: 'lg',
    },
    VChip: {
      rounded: 'md',
    },
  },
  display: {
    mobileBreakpoint: 'md',
  },
})
