export type NotificationItem = {
  id: number
  title: string
  description: string
  time: string
  unread?: boolean
}

export const notifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Your community digest is ready',
    description: 'Fresh posts, replies, and member activity are available for today.',
    time: '5 min ago',
  },
  {
    id: 2,
    title: 'New contest announcement',
    description: 'A featured community challenge opens later this week with new rewards.',
    time: '27 min ago',
  },
  {
    id: 3,
    title: 'A recruiter viewed your profile',
    description: 'Your recent activity is attracting interest from the jobs section.',
    time: 'Yesterday',
  },
]
