import { slugify } from '@/utils/slugify'
import { publicProfileRoute } from '@/data/publicProfiles'

export type CommunityPost = {
  type: 'community'
  slug: string
  author: {
    name: string
    to: string
    avatarText: string
  }
  time: string
  title: string
  description: string
  imageSrc: string
  imageAlt?: string
  score: number
  comments: number
  isFollowing?: boolean
}

export type QuestionPost = {
  type: 'question'
  slug: string
  communityName: string
  title: string
  time: string
  authorName: string
  authorTo: string
  tag: string
  answers: number
  isFollowing?: boolean
}

export type PersonalPost = {
  type: 'personal'
  slug: string
  author: {
    name: string
    to: string
    avatarText: string
    tag: string
  }
  time: string
  title: string
  description: string
  imageSrc: string
  imageAlt?: string
  score: number
  comments: number
  isFollowing?: boolean
}

export type FeedPost = CommunityPost | QuestionPost | PersonalPost

export const feedPosts: FeedPost[] = [
  {
    type: 'community',
    slug: slugify('Bootstrap select pass value with disabled'),
    author: {
      name: 'Chike Collections',
      to: publicProfileRoute('user-chike-collections'),
      avatarText: 'CC',
    },
    time: '6 hours ago',
    title: 'Bootstrap select pass value with disabled',
    description:
      'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. It is a long established fact that a reader will be...',
    imageSrc: '/post/javad_esmaeili-woman-7262808_1920.jpg',
    imageAlt: 'Community post image',
    score: 0,
    comments: 0,
  },
  {
    type: 'question',
    slug: slugify('What is the fourth element of the periodic table of elements'),
    communityName: 'Distinguished Cmty',
    title: 'What is the fourth element of the periodic table of elements?',
    time: '1 hour ago',
    authorName: 'Arden Smith',
    authorTo: publicProfileRoute('user-arden-smith'),
    tag: 'Psychologist | CSS3 | Java | Project Mgt.',
    answers: 0,
  },
  {
    type: 'personal',
    slug: slugify('Unemployment is an anomaly'),
    author: {
      name: 'Arden Smith',
      to: publicProfileRoute('user-arden-smith'),
      avatarText: 'AS',
      tag: 'Psychologist | CSS3 | Java | Project Mgt.',
    },
    time: '6 hours ago',
    title: 'Unemployment is an anomaly.',
    description:
      '"As the population grows, so should job opportunities to match the demand created by growth in population. Unemployment should be a choice."',
    imageSrc: '/post/lobostudiohamburg-internet-3113279_1920.jpg',
    imageAlt: 'Personal post image',
    score: 0,
    comments: 0,
  },
  {
    type: 'question',
    slug: slugify('What should a junior frontend developer include in a strong portfolio'),
    communityName: 'Tech Careers',
    title: 'What should a junior frontend developer include in a strong portfolio?',
    time: '3 hours ago',
    authorName: 'Naomi Cole',
    authorTo: publicProfileRoute('user-naomi-cole'),
    tag: 'Frontend | UI Systems | Mentorship',
    answers: 0,
  },
  {
    type: 'question',
    slug: slugify('Which remote job platforms are best for product designers in Africa'),
    communityName: 'Opportunities Hub',
    title: 'Which remote job platforms are best for product designers in Africa?',
    time: '5 hours ago',
    authorName: 'David Mensah',
    authorTo: publicProfileRoute('user-david-mensah'),
    tag: 'Product Design | Remote Work | Strategy',
    answers: 0,
  },
]

export const questionPosts = feedPosts.filter(
  (post): post is QuestionPost => post.type === 'question',
)

export const getFeedPostBySlug = (slug: string) => feedPosts.find((post) => post.slug === slug)
