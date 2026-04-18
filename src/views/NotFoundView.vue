<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <div class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div class="space-y-4">
        <router-link
          to="/"
          class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <Home class="w-5 h-5 mr-2" />
          Go Home
        </router-link>

        <div>
          <button
            @click="$router.go(-1)"
            class="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200 ml-4"
          >
            <ArrowLeft class="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Home, ArrowLeft } from 'lucide-vue-next'
</script>