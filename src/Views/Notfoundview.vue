<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center max-w-md">
      <p class="text-7xl font-black text-emerald-600">404</p>
      <h1 class="mt-4 text-2xl font-black text-gray-900">Page not found</h1>
      <p class="mt-2 text-gray-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <router-link
        to="/"
        class="inline-block mt-6 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-100"
      >
        Back to Caterlytics
      </router-link>
    </div>
  </div>
</template>