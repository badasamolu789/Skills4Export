export type CommunityIconKey =
  | 'palette'
  | 'code'
  | 'rocket'
  | 'briefcase'
  | 'building'
  | 'users'

export type CommunityCard = {
  name: string
  slug: string
  members: string
  visibility: 'Open community' | 'Private community'
  description: string
  icon: CommunityIconKey
  focus: string[]
}

export const communities: CommunityCard[] = [
  {
    name: 'Design Community',
    slug: 'design-community',
    members: '12.4k members',
    visibility: 'Open community',
    description:
      'A place for UI, UX, product, and brand designers sharing case studies, hiring leads, and honest feedback.',
    icon: 'palette',
    focus: ['UI systems', 'Brand thinking', 'Portfolio feedback'],
  },
  {
    name: 'Tech Careers',
    slug: 'tech-careers',
    members: '9.1k members',
    visibility: 'Open community',
    description:
      'Career conversations for developers, analysts, and builders navigating interviews, growth, and remote work.',
    icon: 'code',
    focus: ['Interviews', 'Career growth', 'Remote opportunities'],
  },
  {
    name: 'Opportunities Hub',
    slug: 'opportunities-hub',
    members: '15.8k members',
    visibility: 'Open community',
    description:
      'Scholarships, grants, competitions, and job opportunities curated for ambitious members across Africa.',
    icon: 'rocket',
    focus: ['Scholarships', 'Grants', 'Career openings'],
  },
  {
    name: 'Freelance Circle',
    slug: 'freelance-circle',
    members: '6.7k members',
    visibility: 'Private community',
    description:
      'Independent talent exchanging project tips, pricing advice, client lessons, and collaboration leads.',
    icon: 'briefcase',
    focus: ['Client work', 'Pricing', 'Collaboration'],
  },
  {
    name: 'Founder Network',
    slug: 'founder-network',
    members: '4.2k members',
    visibility: 'Private community',
    description:
      'Startup-minded operators discussing growth, fundraising, product bets, and founder support systems.',
    icon: 'building',
    focus: ['Fundraising', 'Growth', 'Product strategy'],
  },
  {
    name: 'Community Builders',
    slug: 'community-builders',
    members: '8.5k members',
    visibility: 'Open community',
    description:
      'For community managers, moderators, and organizers building strong spaces that people genuinely return to.',
    icon: 'users',
    focus: ['Moderation', 'Programming', 'Retention'],
  },
]

export const getCommunityBySlug = (slug: string) =>
  communities.find((community) => community.slug === slug)
