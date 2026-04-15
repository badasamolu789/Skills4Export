import { slugify } from '@/utils/slugify'

export type JobPost = {
  slug: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  perks: string[]
}

export const jobs: JobPost[] = [
  {
    slug: slugify('Frontend Developer Telefun'),
    title: 'Frontend Developer',
    company: 'Telefun',
    location: 'Lagos, Nigeria',
    type: 'Full-time',
    salary: 'N450k - N650k / month',
    description:
      'Build polished user experiences, maintain design consistency, and ship fast with the product team.',
    summary:
      'Join a product team shipping customer-facing experiences across onboarding, job workflows, and collaboration tools.',
    responsibilities: [
      'Build and refine responsive product interfaces with Vue and Tailwind.',
      'Translate design decisions into reusable, accessible UI patterns.',
      'Collaborate closely with product and backend teammates on new features.',
    ],
    requirements: [
      '2+ years working with modern frontend tooling.',
      'Strong eye for interaction quality and interface consistency.',
      'Comfortable turning feedback into quick, well-tested iterations.',
    ],
    perks: ['Hybrid collaboration culture', 'Monthly learning support', 'Performance bonus opportunities'],
  },
  {
    slug: slugify('Community Manager EL Academy'),
    title: 'Community Manager',
    company: 'EL Academy',
    location: 'Remote',
    type: 'Contract',
    salary: 'N300k - N420k / month',
    description:
      'Grow engagement, coordinate creator programs, and help shape community campaigns across the platform.',
    summary:
      'Own day-to-day community rhythms, creator communication, and audience engagement across digital touchpoints.',
    responsibilities: [
      'Run member engagement programs and recurring content moments.',
      'Coordinate moderation standards and creator-facing communication.',
      'Track participation signals and propose ways to deepen retention.',
    ],
    requirements: [
      'Experience managing communities, audiences, or ambassador programs.',
      'Strong writing and stakeholder coordination skills.',
      'Confidence using analytics to shape programming decisions.',
    ],
    perks: ['Remote-first workflow', 'Flexible hours', 'Creator partnership exposure'],
  },
  {
    slug: slugify('Product Designer Skills4Export'),
    title: 'Product Designer',
    company: 'Skills4Export',
    location: 'Abuja, Nigeria',
    type: 'Hybrid',
    salary: 'N500k - N750k / month',
    description:
      'Design job flows, creator tools, and marketplace experiences with strong visual craft and thoughtful UX.',
    summary:
      'Shape end-to-end product experiences from rough concept through high-fidelity delivery for a growing platform.',
    responsibilities: [
      'Design flows, wireframes, and polished screens across core product journeys.',
      'Work with engineering to keep implementation aligned with design intent.',
      'Contribute to patterns, component usage, and visual consistency.',
    ],
    requirements: [
      'Strong product thinking with a clear portfolio of shipped work.',
      'Ability to balance strategy, UX clarity, and visual craft.',
      'Comfortable collaborating with product managers and frontend engineers.',
    ],
    perks: ['High ownership role', 'Cross-functional product exposure', 'Growth-focused team culture'],
  },
]

export const getJobBySlug = (slug: string) => jobs.find((job) => job.slug === slug)
