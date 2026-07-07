const navLinks = [
  { label: 'Communities', href: '/communities' },
  { label: 'Jokes', href: '/jokes' },
  { label: 'Headlines', href: '/headlines' },
  { label: 'Questions', href: '/answers' },
  { label: 'Freelancers', href: '/freelancers' },
  { label: 'Contests', href: '/contest' },
  { label: 'Posts', href: '/post' },
]

const footerLinks = [
  { label: 'Showcase Skills', href: '/freelancers', requiresAuth: true },
  { label: 'Career Pathways', href: '/communities', requiresAuth: true },
  { label: 'Student Page', href: '/pages/create?type=student', requiresAuth: true },
  { label: 'Art&Character', href: '/communities', requiresAuth: true },
  { label: 'Jokes', href: '/jokes', requiresAuth: true },
  { label: 'Headlines', href: '/headlines', requiresAuth: true },
  { label: 'Product Page', href: '/pages/create?type=business', requiresAuth: true },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms-and-conditions' },
  { label: 'About', href: './index.html' },
  { label: 'Careers', href: './index.html' },
  { label: 'Advertising', href: './index.html' },
  { label: 'Contact', href: './index.html' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
]

const createLink = (item, className) => {
  const link = document.createElement('a')
  link.href = item.href
  link.textContent = item.label
  link.className = className
  return link
}

const isAuthenticated = () => Boolean(window.localStorage.getItem('skills4export-auth-token'))

const startGuestSession = () => {
  window.sessionStorage.setItem('skills4export-landing-guest', 'true')
  window.sessionStorage.removeItem('skills4export-guest-auth-prompted')
}

const enterGuestNav = () => {
  if (isAuthenticated()) {
    return
  }

  startGuestSession()
}

const renderNavLinks = () => {
  const container = document.querySelector('#landing-nav')

  navLinks.forEach((item) => {
    const link = createLink(
      item,
      'rounded-full px-2.5 py-2 transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)] xl:px-3',
    )
    link.addEventListener('click', enterGuestNav)
    container.appendChild(link)
  })
}

const renderFooterLinks = () => {
  const container = document.querySelector('#footer-links')

  footerLinks.forEach((item) => {
    const link = createLink(item, 'transition hover:text-[var(--accent-strong)]')

    if (item.requiresAuth) {
      link.addEventListener('click', enterGuestNav)
    }

    container.appendChild(link)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavLinks()
  renderFooterLinks()
  lucide.createIcons()
})
