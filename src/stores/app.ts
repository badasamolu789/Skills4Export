import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    projectName: 'Skills4Export',
    tagline: 'Community-led conversations, knowledge sharing, and meaningful connection.',
    stack: ['Vue 3', 'TypeScript', 'Tailwind CSS', 'Vue Router', 'Pinia'],
    pillars: [
      'Community discussions and shared updates',
      'Knowledge exchange across members',
      'A premium, trustworthy, people-first experience',
    ],
    responsivePrinciples: [
      'Mobile-first layouts with comfortable spacing and readable text',
      'Desktop modals become bottom sheets on smaller screens',
      'Touch-friendly controls for members browsing primarily on phones',
    ],
    headerFeatures: [
      'Logo lockup with a premium brand treatment',
      'Primary navigation for Home, Ask, Contest, Job, and Community',
      'Search, notifications, avatar menu, and theme switching',
    ],
    apiErrorModal: {
      open: false,
      title: 'API Request Failed',
      description: 'A request to the backend did not complete successfully.',
      method: '',
      url: '',
      status: '',
      payload: '',
    },
  }),
  actions: {
    showApiError(details: {
      title?: string
      description?: string
      method: string
      url: string
      status?: string | number
      payload?: unknown
    }) {
      this.apiErrorModal = {
        open: true,
        title: details.title || 'API Request Failed',
        description: details.description || 'The backend returned an error response.',
        method: details.method,
        url: details.url,
        status: details.status ? String(details.status) : 'Unknown',
        payload:
          typeof details.payload === 'string'
            ? details.payload
            : JSON.stringify(details.payload ?? {}, null, 2),
      }
    },
    hideApiError() {
      this.apiErrorModal.open = false
    },
  },
})
