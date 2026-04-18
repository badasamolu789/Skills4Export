import { createRouter, createWebHistory } from 'vue-router'
import CreateAlertView from '@/views/CreateAlertView.vue'
import CreatePageView from '@/views/CreatePageView.vue'
import CommunityDetailView from '@/views/CommunityDetailView.vue'
import ExploreCommunitiesView from '@/views/ExploreCommunitiesView.vue'
import HomeView from '@/views/HomeView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import GoogleCallbackView from '@/views/GoogleCallbackView.vue'
import JobDetailView from '@/views/JobDetailView.vue'
import JobFeedView from '@/views/JobFeedView.vue'
import JobsView from '@/views/JobsView.vue'
import LoginView from '@/views/LoginView.vue'
import MobileNotificationsView from '@/views/MobileNotificationsView.vue'
import MobileSearchView from '@/views/MobileSearchView.vue'
import PageDetailView from '@/views/PageDetailView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import ProfileView from '@/views/ProfileView.vue'
import FollowersView from '@/views/FollowersView.vue'
import LoginHistoryView from '@/views/LoginHistoryView.vue'
import QuestionAnswerView from '@/views/QuestionAnswerView.vue'
import ReferralsView from '@/views/ReferralsView.vue'
import SignUpSuccessView from '@/views/SignUpSuccessView.vue'
import SignUpView from '@/views/SignUpView.vue'
import VerifyEmailView from '@/views/VerifyEmailView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: JobsView,
    },
    {
      path: '/jobs/feed',
      name: 'job-feed',
      component: JobFeedView,
    },
    {
      path: '/jobs/alerts',
      name: 'job-alerts',
      component: CreateAlertView,
    },
    {
      path: '/jobs/:slug',
      name: 'job-detail',
      component: JobDetailView,
    },
    {
      path: '/pages/create',
      name: 'create-page',
      component: CreatePageView,
    },
    {
      path: '/pages/:slug',
      name: 'page-detail',
      component: PageDetailView,
    },
    {
      path: '/answer/question',
      name: 'answer-question',
      component: QuestionAnswerView,
    },
    {
      path: '/mobile/notifications',
      name: 'mobile-notifications',
      component: MobileNotificationsView,
    },
    {
      path: '/mobile/search',
      name: 'mobile-search',
      component: MobileSearchView,
    },
    {
      path: '/communities',
      name: 'explore-communities',
      component: ExploreCommunitiesView,
    },
    {
      path: '/communities/:slug',
      name: 'community-detail',
      component: CommunityDetailView,
    },
    {
      path: '/posts/:slug',
      name: 'post-detail',
      component: PostDetailView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: EditProfileView,
    },
    {
      path: '/profile/followers/:id',
      name: 'followers',
      component: FollowersView,
    },
    {
      path: '/profile/login-history',
      name: 'login-history',
      component: LoginHistoryView,
    },
    {
      path: '/referrals',
      name: 'referrals',
      component: ReferralsView,
    },
    {
      path: '/auth/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/auth/google/callback',
      name: 'google-callback',
      component: GoogleCallbackView,
    },
    {
      path: '/auth/signup',
      name: 'signup',
      component: SignUpView,
    },
    {
      path: '/auth/signup/verify',
      name: 'signup-verify',
      component: VerifyEmailView,
    },
    {
      path: '/auth/signup/success',
      name: 'signup-success',
      component: SignUpSuccessView,
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: ForgotPasswordView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

export default router
