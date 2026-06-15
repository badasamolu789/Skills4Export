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
    networkStatus: {
      offline: false,
      lastIssueAt: '',
    },
  }),
  actions: {
    setOfflineStatus(isOffline: boolean) {
      this.networkStatus.offline = isOffline
      if (isOffline) {
        this.networkStatus.lastIssueAt = new Date().toISOString()
      }
    },
    clearNetworkIssue() {
      this.networkStatus.offline = false
    },
  },
})
