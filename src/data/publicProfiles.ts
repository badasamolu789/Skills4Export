import type {
  UserCertification,
  UserEducation,
  UserExperience,
  UserFollower,
  UserPortfolio,
  UserProfile,
  UserRecord,
  UserSkill,
} from '@/services/users'

export type SeededPublicProfile = {
  id: string
  user: UserRecord
  profile: UserProfile
  skills: UserSkill[]
  portfolios: UserPortfolio[]
  certifications: UserCertification[]
  educations: UserEducation[]
  experiences: UserExperience[]
  followers: UserFollower[]
}

export const publicProfileRoute = (id: string) => `/profile/view/${id}`

export const seededPublicProfiles: SeededPublicProfile[] = [
  {
    id: 'user-chike-collections',
    user: {
      id: 'user-chike-collections',
      name: 'Chike Collections',
      email: 'chike@example.com',
    },
    profile: {
      id: 'profile-chike-collections',
      userId: 'user-chike-collections',
      username: 'chikecollections',
      bio: 'Community builder sharing practical export-readiness conversations and useful field updates.',
      location: 'Enugu, Nigeria',
      website: 'https://skills4export.com/@chikecollections',
    },
    skills: [
      { id: 'skill-cc-1', name: 'Community Growth', level: 'expert' },
      { id: 'skill-cc-2', name: 'Business Development', level: 'intermediate' },
      { id: 'skill-cc-3', name: 'Export Readiness', level: 'intermediate' },
    ],
    portfolios: [
      {
        id: 'portfolio-cc-1',
        userId: 'user-chike-collections',
        title: 'Export Community Playbook',
        description: 'A knowledge-sharing resource for early-stage founders entering new markets.',
        link: 'https://skills4export.com',
      },
    ],
    certifications: [],
    educations: [],
    experiences: [
      {
        id: 'experience-cc-1',
        userId: 'user-chike-collections',
        company: 'Skills4Export',
        title: 'Community Lead',
        description: 'Designing discussions and programs that help members turn ideas into traction.',
      },
    ],
    followers: [],
  },
  {
    id: 'user-arden-smith',
    user: {
      id: 'user-arden-smith',
      name: 'Arden Smith',
      email: 'arden@example.com',
    },
    profile: {
      id: 'profile-arden-smith',
      userId: 'user-arden-smith',
      username: 'ardensmith',
      bio: 'Psychologist turned tech mentor helping people tell stronger career stories and build visible proof of work.',
      location: 'Lagos, Nigeria',
      website: 'https://skills4export.com/@ardensmith',
    },
    skills: [
      { id: 'skill-as-1', name: 'Career Strategy', level: 'expert' },
      { id: 'skill-as-2', name: 'Frontend Coaching', level: 'intermediate' },
      { id: 'skill-as-3', name: 'Portfolio Reviews', level: 'expert' },
    ],
    portfolios: [
      {
        id: 'portfolio-as-1',
        userId: 'user-arden-smith',
        title: 'Career Visibility Workshops',
        description: 'A workshop series focused on portfolios, positioning, and opportunity readiness.',
      },
    ],
    certifications: [
      {
        id: 'cert-as-1',
        userId: 'user-arden-smith',
        name: 'Career Coaching Certificate',
        issuer: 'Mentorship Circle',
      },
    ],
    educations: [],
    experiences: [
      {
        id: 'experience-as-1',
        userId: 'user-arden-smith',
        company: 'Independent',
        title: 'Career Mentor',
        description: 'Helping junior talent present their work more clearly and competitively.',
      },
    ],
    followers: [],
  },
  {
    id: 'user-naomi-cole',
    user: {
      id: 'user-naomi-cole',
      name: 'Naomi Cole',
      email: 'naomi@example.com',
    },
    profile: {
      id: 'profile-naomi-cole',
      userId: 'user-naomi-cole',
      username: 'naomicole',
      bio: 'Frontend designer focused on UI systems, portfolio storytelling, and mentorship for emerging builders.',
      location: 'Accra, Ghana',
      website: 'https://skills4export.com/@naomicole',
    },
    skills: [
      { id: 'skill-nc-1', name: 'UI Systems', level: 'expert' },
      { id: 'skill-nc-2', name: 'Mentorship', level: 'expert' },
      { id: 'skill-nc-3', name: 'Design Critique', level: 'intermediate' },
    ],
    portfolios: [],
    certifications: [],
    educations: [],
    experiences: [
      {
        id: 'experience-nc-1',
        userId: 'user-naomi-cole',
        company: 'Studio North',
        title: 'Frontend Designer',
        description: 'Building interfaces with clear systems and stronger onboarding experiences.',
      },
    ],
    followers: [],
  },
  {
    id: 'user-david-mensah',
    user: {
      id: 'user-david-mensah',
      name: 'David Mensah',
      email: 'david@example.com',
    },
    profile: {
      id: 'profile-david-mensah',
      userId: 'user-david-mensah',
      username: 'davidmensah',
      bio: 'Product design strategist interested in remote work, opportunity access, and practical career growth.',
      location: 'Kumasi, Ghana',
      website: 'https://skills4export.com/@davidmensah',
    },
    skills: [
      { id: 'skill-dm-1', name: 'Product Design', level: 'expert' },
      { id: 'skill-dm-2', name: 'Remote Strategy', level: 'intermediate' },
      { id: 'skill-dm-3', name: 'Research Synthesis', level: 'intermediate' },
    ],
    portfolios: [],
    certifications: [],
    educations: [],
    experiences: [
      {
        id: 'experience-dm-1',
        userId: 'user-david-mensah',
        company: 'Remote Product Lab',
        title: 'Product Strategist',
        description: 'Researching platform, talent, and market patterns that help designers find better opportunities.',
      },
    ],
    followers: [],
  },
]

export const getSeededPublicProfile = (id: string) =>
  seededPublicProfiles.find((profile) => profile.id === id) ?? null
