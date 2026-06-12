import { createRouter, createWebHistory } from 'vue-router'
import { getStoredOnboardingRequired } from '@/stores/auth'

const CreateAlertView = () => import('@/views/CreateAlertView.vue')
const CreatePageView = () => import('@/views/CreatePageView.vue')
const CommunityDetailView = () => import('@/views/CommunityDetailView.vue')
const CommunityRegulationsView = () => import('@/views/CommunityRegulationsView.vue')
const ExploreCommunitiesView = () => import('@/views/ExploreCommunitiesView.vue')
const FreelancersView = () => import('@/views/FreelancersView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const ForgotPasswordView = () => import('@/views/ForgotPasswordView.vue')
const GoogleCallbackView = () => import('@/views/GoogleCallbackView.vue')
const LandingView = () => import('@/views/LandingView.vue')
const JobDetailView = () => import('@/views/JobDetailView.vue')
const JobFeedView = () => import('@/views/JobFeedView.vue')
const JobsView = () => import('@/views/JobsView.vue')
const CookiePolicyView = () => import('@/views/CookiePolicyView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const MobileNotificationsView = () => import('@/views/MobileNotificationsView.vue')
const MobileAccountView = () => import('@/views/MobileAccountView.vue')
const MobileSearchView = () => import('@/views/MobileSearchView.vue')
const PageDetailView = () => import('@/views/PageDetailView.vue')
const PostDetailView = () => import('@/views/PostDetailView.vue')
const QuestionDetailView = () => import('@/views/QuestionDetailView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const EditProfileView = () => import('@/views/EditProfileView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const PublicProfileView = () => import('@/views/PublicProfileView.vue')
const PrivacyPolicyView = () => import('@/views/PrivacyPolicyView.vue')
const FollowersView = () => import('@/views/FollowersView.vue')
const LoginHistoryView = () => import('@/views/LoginHistoryView.vue')
const ManageActivitiesView = () => import('@/views/ManageActivitiesView.vue')
const QuestionAnswerView = () => import('@/views/QuestionAnswerView.vue')
const ReferralsView = () => import('@/views/ReferralsView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')
const SignUpView = () => import('@/views/SignUpView.vue')
const SignUpDetailsView = () => import('@/views/SignUpDetailsView.vue')
const TermsConditionsView = () => import('@/views/TermsConditionsView.vue')
const VerifyEmailView = () => import('@/views/VerifyEmailView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
      meta: {
        layout: 'public',
      },
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: PrivacyPolicyView,
      meta: {
        layout: 'public',
      },
    },
    {
      path: '/terms-and-conditions',
      name: 'terms-and-conditions',
      component: TermsConditionsView,
      meta: {
        layout: 'public',
      },
    },
    {
      path: '/cookie-policy',
      name: 'cookie-policy',
      component: CookiePolicyView,
      meta: {
        layout: 'public',
      },
    },
    {
      path: '/community-regulations',
      name: 'community-regulations',
      component: CommunityRegulationsView,
      meta: {
        layout: 'public',
      },
    },
    {
      path: '/feed',
      name: 'home',
      component: HomeView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: JobsView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        showRightRail: true,
      },
    },
    {
      path: '/jobs/feed',
      name: 'job-feed',
      component: JobFeedView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/jobs/alerts',
      name: 'job-alerts',
      component: CreateAlertView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        hideRightRail: true,
      },
    },
    {
      path: '/jobs/:slug',
      name: 'job-detail',
      component: JobDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        hideRightRail: true,
      },
    },
    {
      path: '/pages/create',
      name: 'create-page',
      component: CreatePageView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/pages/:slug/public',
      name: 'public-page-detail',
      component: PageDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        showRightRail: true,
      },
    },
    {
      path: '/pages/:slug',
      name: 'page-detail',
      component: PageDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        showRightRail: true,
      },
    },
    {
      path: '/answer/question',
      name: 'answer-question',
      component: QuestionAnswerView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/mobile/notifications',
      name: 'mobile-notifications',
      component: MobileNotificationsView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/mobile/search',
      name: 'mobile-search',
      component: MobileSearchView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/mobile/account',
      name: 'mobile-account',
      component: MobileAccountView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/communities',
      name: 'explore-communities',
      component: ExploreCommunitiesView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/communities/:slug',
      name: 'community-detail',
      component: CommunityDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/posts/:slug',
      name: 'post-detail',
      component: PostDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        showRightRail: true,
      },
    },
    {
      path: '/questions/:slug',
      name: 'question-detail',
      component: QuestionDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        showRightRail: true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/profile/view/:id',
      name: 'public-profile',
      component: PublicProfileView,
      meta: {
        layout: 'app',
        hideSidebar: true,
        showRightRail: true,
      },
    },
    {
      path: '/activities',
      name: 'manage-activities',
      component: ManageActivitiesView,
      meta: {
        layout: 'app',
        requiresAuth: true,
        hideSidebar: true,
        showRightRail: true,
        hideRightRailAdverts: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: EditProfileView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/profile/followers/:id',
      name: 'followers',
      component: FollowersView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/profile/login-history',
      name: 'login-history',
      component: LoginHistoryView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/referrals',
      name: 'referrals',
      component: ReferralsView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/freelancers',
      name: 'freelancers',
      component: FreelancersView,
      meta: {
        layout: 'app',
        requiresAuth: true,
      },
    },
    {
      path: '/auth/login',
      name: 'login',
      component: LoginView,
      meta: {
        layout: 'auth',
        guestOnly: true,
      },
    },
    {
      path: '/auth/google/callback',
      name: 'google-callback',
      component: GoogleCallbackView,
      meta: {
        layout: 'auth',
      },
    },
    {
      path: '/auth/signup',
      name: 'signup',
      component: SignUpView,
      meta: {
        layout: 'auth',
        guestOnly: true,
      },
    },
    {
      path: '/auth/signup/details',
      name: 'signup-details',
      component: SignUpDetailsView,
      meta: {
        layout: 'auth',
        guestOnly: true,
      },
    },
    {
      path: '/auth/signup/verify',
      name: 'signup-verify',
      component: VerifyEmailView,
      meta: {
        layout: 'auth',
        guestOnly: true,
      },
    },
    {
      path: '/auth/signup/success',
      name: 'signup-success',
      redirect: '/feed',
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: {
        layout: 'auth',
        guestOnly: true,
      },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: ForgotPasswordView,
      meta: {
        layout: 'auth',
        guestOnly: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        layout: 'public',
      },
    },
  ],
})

const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem('skills4export-auth-token') ?? ''
}

router.beforeEach((to) => {
  const isAuthenticated = Boolean(getStoredAuthToken())
  const onboardingRequired = isAuthenticated && getStoredOnboardingRequired()

  if (to.name === 'landing' && isAuthenticated) {
    if (onboardingRequired) {
      return {
        name: 'signup-details',
      }
    }

    return '/feed'
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (onboardingRequired && to.name !== 'signup-details') {
    if (to.fullPath.startsWith('/auth')) {
      return {
        name: 'signup-details',
      }
    }

    return {
      name: 'signup-details',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && isAuthenticated && to.name !== 'signup-details') {
    const redirectTarget =
      typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
        ? to.query.redirect
        : '/feed'

    return redirectTarget
  }

  return true
})

export default router
