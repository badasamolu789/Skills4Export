import { createRouter, createWebHistory } from 'vue-router'
import CreateAlertView from '@/views/CreateAlertView.vue'
import CreatePageView from '@/views/CreatePageView.vue'
import CommunityDetailView from '@/views/CommunityDetailView.vue'
import ExploreCommunitiesView from '@/views/ExploreCommunitiesView.vue'
import HomeView from '@/views/HomeView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import GoogleCallbackView from '@/views/GoogleCallbackView.vue'
import LandingView from '@/views/LandingView.vue'
import JobDetailView from '@/views/JobDetailView.vue'
import JobFeedView from '@/views/JobFeedView.vue'
import JobsView from '@/views/JobsView.vue'
import LoginView from '@/views/LoginView.vue'
import MobileNotificationsView from '@/views/MobileNotificationsView.vue'
import MobileAccountView from '@/views/MobileAccountView.vue'
import MobileSearchView from '@/views/MobileSearchView.vue'
import PageDetailView from '@/views/PageDetailView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import ProfileView from '@/views/ProfileView.vue'
import PublicProfileView from '@/views/PublicProfileView.vue'
import FollowersView from '@/views/FollowersView.vue'
import LoginHistoryView from '@/views/LoginHistoryView.vue'
import QuestionAnswerView from '@/views/QuestionAnswerView.vue'
import ReferralsView from '@/views/ReferralsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import SignUpSuccessView from '@/views/SignUpSuccessView.vue'
import SignUpView from '@/views/SignUpView.vue'
import VerifyEmailView from '@/views/VerifyEmailView.vue'

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
      },
    },
    {
      path: '/jobs/:slug',
      name: 'job-detail',
      component: JobDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
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
      path: '/pages/:slug',
      name: 'page-detail',
      component: PageDetailView,
      meta: {
        layout: 'app',
        requiresAuth: true,
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
      component: SignUpSuccessView,
      meta: {
        layout: 'auth',
      },
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

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'landing',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    const redirectTarget =
      typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
        ? to.query.redirect
        : '/feed'

    return redirectTarget
  }

  return true
})

export default router
