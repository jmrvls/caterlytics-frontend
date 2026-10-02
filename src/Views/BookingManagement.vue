<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- MOBILE TOP BAR -->
    <div class="lg:hidden fixed top-0 inset-x-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 px-4 py-3 print:hidden">
      <button @click="isMobileSidebarOpen = true" class="p-2 -ml-2 rounded-none text-gray-600 dark:text-gray-300">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="font-bold text-gray-800 dark:text-gray-100 truncate">Caterlytics</span>
      </div>
      <NotificationBell />
    </div>

    <!-- MOBILE BACKDROP -->
    <div v-if="isMobileSidebarOpen" @click="isMobileSidebarOpen = false" class="fixed inset-0 bg-black/40 z-40 lg:hidden"></div>

    <!-- SIDEBAR -->
    <aside
      :class="[sidebarExpanded ? 'w-64' : 'w-20', isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-auto"
    >
      <div class="flex items-center justify-between gap-2 p-4">
        <!-- COLLAPSED: logo itself is the toggle -->
        <div
          v-if="!sidebarExpanded"
          class="relative flex items-center justify-center w-8 h-8 cursor-pointer select-none rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @mouseenter="isLogoHovered = true"
          @mouseleave="isLogoHovered = false"
          @click="toggleSidebar"
        >
          <img v-if="!isLogoHovered" :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <svg v-else class="w-6 h-6 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
            <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
          </svg>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Open sidebar
          </div>
        </div>

        <!-- EXPANDED: static logo + name on the left -->
        <div v-else class="flex items-center gap-2 overflow-hidden">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
        </div>

        <!-- EXPANDED: dedicated toggle button on the right, like Gemini's collapse icon -->
        <div v-if="sidebarExpanded" class="relative flex-shrink-0">
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            @mouseenter="isLogoHovered = true"
            @mouseleave="isLogoHovered = false"
            @click="toggleSidebar"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
              <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
            </svg>
          </button>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Close sidebar
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Event Bookings' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="relative flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
          <span
            v-if="item.name === 'Support Chat' && chatUnread"
            :class="sidebarExpanded ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[16px] h-4 px-1'"
            class="rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
          >{{ chatUnread > 99 ? '99+' : chatUnread }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 dark:border-gray-700 p-3 relative">
        <!-- Click-outside backdrop -->
        <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

        <!-- Account menu (Log Out) -->
        <div v-if="showAccountMenu" class="absolute bottom-full left-2 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg overflow-hidden z-50">
          <button v-if="userRole === 'Admin' || userRole === 'Owner/Manager'" @click="showAccountMenu = false; router.push('/settings')" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button @click="handleLogout" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>

        <!-- Profile: click toggles the account menu -->
        <div @click="showAccountMenu = !showAccountMenu" class="flex items-center gap-3 px-2 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Profile picture" class="w-full h-full object-cover" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div v-if="sidebarExpanded" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ userRole }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-4 sm:p-8 pt-20 lg:pt-8 overflow-x-hidden w-full min-w-0">
      <div class="max-w-none 2xl:max-w-[1920px] mx-auto">

        <div class="flex flex-col gap-3 mb-4">
          <div class="flex flex-row items-center justify-between gap-2 sm:gap-3">
            <div class="relative flex-1 max-w-sm">
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by client name..."
                class="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div class="flex items-center gap-3 flex-shrink-0">
              <div class="hidden lg:block">
                <NotificationBell />
              </div>
              <button @click="openCreateModal" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 sm:px-4 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap min-w-[172px]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Booking
              </button>
            </div>
          </div>

          <!-- Filter -->
          <div class="flex flex-col sm:flex-row gap-2">
            <select v-model="statusFilter" class="py-2.5 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" role="alert" class="mb-4 flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900/60 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20 p-4 shadow-sm">
          <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-red-800 dark:text-red-200">{{ pageErrorParsed.title }}</p>
            <p v-if="pageErrorParsed.subtitle" class="text-sm text-red-700/80 dark:text-red-300/80 mt-0.5">{{ pageErrorParsed.subtitle }}</p>
            <div v-if="pageErrorParsed.gaps.length" class="flex flex-wrap gap-2 mt-3">
              <span
                v-for="g in pageErrorParsed.gaps" :key="g.label"
                class="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300"
              >
                {{ g.label }}
                <span class="rounded-full bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 text-[11px] font-semibold">{{ g.picked }} / {{ g.need }}</span>
              </span>
            </div>
          </div>
          <button type="button" @click="pageError = ''" aria-label="Dismiss" class="text-red-400 hover:text-red-600 dark:hover:text-red-300">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Stock Notice (shown after a status change moves inventory) -->
        <div v-if="stockNotice" role="status" class="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-4 shadow-sm">
          <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">{{ stockNotice }}</p>
          <button type="button" @click="stockNotice = ''" aria-label="Dismiss" class="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Bookings — mobile card list (phone-friendly, replaces the table below md) -->
        <div class="md:hidden space-y-3">
          <div v-if="isLoading" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Loading bookings...</div>
          <div v-else-if="filteredBookings.length === 0" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            {{ bookings.length === 0 ? 'No bookings yet. Tap "New Booking" to create one.' : 'No bookings match your filters.' }}
          </div>
          <div
            v-for="b in filteredBookings" :key="b.booking_id"
            class="bg-white dark:bg-gray-800 border border-emerald-600 dark:border-gray-700 rounded-none p-4"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-gray-100 truncate capitalize">{{ b.client_name }}</p>
                <a v-if="b.client_contact_number" :href="'tel:' + b.client_contact_number" class="block text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{{ b.client_contact_number }}</a>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ formatDate(b.event_date) }} · {{ formatTime(b.event_time) }}</p>
              </div>
              <span :class="statusBadgeClass(b.booking_status)" class="shrink-0 text-xs font-semibold leading-5">
                {{ b.booking_status }}
              </span>
            </div>

            <div class="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-3">
              <p class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span class="truncate capitalize">{{ b.event_location }}</span>
              </p>
              <p class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4m4 4a4 4 0 01-4-4" /></svg>
                {{ b.guest_count }} guests · {{ b.package_name || 'No package' }}
              </p>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap mb-2.5">
              <span v-if="assignedStaffNames(b.booking_id).length === 0" class="text-xs text-gray-400 dark:text-gray-500">No staff assigned</span>
              <span v-for="name in assignedStaffNames(b.booking_id)" :key="name" class="px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                {{ name }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <select
                :value="b.booking_status"
                @change="requestStatusChange(b, $event)"
                class="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-none px-3 py-2.5 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button
                @click="openAssignModal(b)"
                class="w-11 h-11 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 active:bg-purple-50 dark:active:bg-purple-900/30 active:text-purple-600"
                title="Assign staff"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z" />
                </svg>
              </button>
              <button
                @click="confirmDelete(b)"
                class="w-11 h-11 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 active:bg-red-50 dark:active:bg-red-900/30 active:text-red-600"
                title="Delete booking"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="hasMoreBookings && !isLoading" class="flex justify-center pt-1">
            <button @click="loadMoreBookings" :disabled="isLoadingMore" class="px-5 py-2.5 rounded-none border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700 disabled:opacity-50">
              {{ isLoadingMore ? 'Loading...' : `Load More (${bookings.length} of ${totalBookings})` }}
            </button>
          </div>
        </div>

        <!-- Bookings Table — desktop / tablet -->
        <div class="hidden md:block bg-white dark:bg-gray-800 rounded-none shadow-sm border border-emerald-600 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 uppercase text-xs tracking-wide">
                <tr>
                  <th class="text-left px-6 py-3 font-semibold">Client</th>
                  <th class="text-left px-6 py-3 font-semibold">Contact</th>
                  <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                  <th class="text-left px-6 py-3 font-semibold">Time</th>
                  <th class="text-left px-6 py-3 font-semibold">Location</th>
                  <th class="text-left px-6 py-3 font-semibold">Guests</th>
                  <th class="text-left px-6 py-3 font-semibold">Package</th>
                  <th class="text-left px-6 py-3 font-semibold">Staff</th>
                  <th class="text-left px-6 py-3 font-semibold">Status</th>
                  <th class="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="isLoading">
                  <td colspan="10" class="text-center py-10 text-gray-400 dark:text-gray-500">Loading bookings...</td>
                </tr>
                <tr v-else-if="filteredBookings.length === 0">
                  <td colspan="10" class="text-center py-10 text-gray-400 dark:text-gray-500">
                    {{ bookings.length === 0 ? 'No bookings yet. Click "New Booking" to create one.' : 'No bookings match your filters.' }}
                  </td>
                </tr>
                <tr v-for="b in filteredBookings" :key="b.booking_id" class="hover:bg-gray-50/60 dark:hover:bg-gray-700/60">
                  <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100 capitalize">{{ b.client_name }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    <a v-if="b.client_contact_number" :href="'tel:' + b.client_contact_number" class="hover:text-emerald-600 dark:hover:text-emerald-400">{{ b.client_contact_number }}</a>
                    <span v-else class="text-gray-400 dark:text-gray-500">—</span>
                  </td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ formatDate(b.event_date) }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ formatTime(b.event_time) }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300 max-w-[12rem] truncate capitalize" :title="b.event_location">{{ b.event_location }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ b.guest_count }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ b.package_name || '—' }}</td>
                  <td class="px-6 py-3.5">
                    <div class="flex flex-wrap gap-1 max-w-[10rem]">
                      <span v-if="assignedStaffNames(b.booking_id).length === 0" class="text-xs text-gray-400 dark:text-gray-500">—</span>
                      <span v-for="name in assignedStaffNames(b.booking_id)" :key="name" class="px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                        {{ name }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 align-middle">
                    <span :class="statusBadgeClass(b.booking_status)" class="inline-block align-middle text-xs font-semibold leading-5">
                      {{ b.booking_status }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                      <select
                        :value="b.booking_status"
                        @change="requestStatusChange(b, $event)"
                        class="text-xs border border-gray-200 dark:border-gray-700 rounded-none px-2 py-1.5 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button @click="openAssignModal(b)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30" title="Assign staff">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z" />
                        </svg>
                      </button>
                      <button @click="confirmDelete(b)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete booking">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="hasMoreBookings && !isLoading" class="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="loadMoreBookings" :disabled="isLoadingMore" class="px-5 py-2 rounded-none border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
              {{ isLoadingMore ? 'Loading...' : `Load More (${bookings.length} of ${totalBookings})` }}
            </button>
          </div>
        </div>

      </div>
    </main>

    <!-- ============ NEW BOOKING MODAL ============ -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">New Booking</h3>

        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {{ modalError }}
        </div>

        <div v-if="conflictWarning" class="text-amber-700 dark:text-amber-300 text-sm font-medium mb-4 flex gap-2">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.82 21h16.36a2 2 0 001.71-3l-8.18-14.14a2 2 0 00-3.42 0z" />
          </svg>
          <span>{{ conflictWarning }}</span>
        </div>

        <form @submit.prevent="handleCreateBooking" class="space-y-5">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Client Name</label>
            <input type="text" v-model="form.client_name" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Client Contact Number</label>
            <input type="tel" inputmode="tel" v-model="form.client_contact_number" placeholder="09171234567" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="relative">
              <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Event Date</label>
              <input
                type="date"
                v-model="form.event_date"
                @change="handleDateCheck"
                :min="todayStr"
                class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div class="relative">
              <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Event Time</label>
              <input type="time" v-model="form.event_time" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
            </div>
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Event Location</label>
            <input type="text" v-model="form.event_location" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="relative">
              <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Guest Count</label>
              <input type="number" min="1" v-model.number="form.guest_count" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
            </div>
            <div class="relative">
              <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Package</label>
              <select v-model="form.package_id" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
                <option value="" disabled>Select a package</option>
                <option v-for="p in packages" :key="p.package_id" :value="p.package_id">{{ p.package_name }}</option>
              </select>
            </div>
          </div>
          <p v-if="packages.length === 0" class="text-xs text-amber-600 dark:text-amber-400 -mt-2">No packages yet. Create one under Catering Packages first.</p>

          <!-- Menu picks (per-category limits), same rule the client form uses.
               Without these a booking can never be Confirmed (the menu must be complete). -->
          <div v-if="form.package_id && menuCategories.length" class="space-y-3">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400">Menu selection</p>
            <div v-for="cat in menuCategories" :key="cat.category" class="border border-gray-200 dark:border-gray-700 p-3">
              <p class="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {{ cat.category }}
                <span class="font-normal text-gray-400 dark:text-gray-500">— pick {{ cat.need }} ({{ (selectedMenu[cat.category] || []).length }}/{{ cat.need }})</span>
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <label v-for="item in cat.items" :key="item.item_id" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    :checked="(selectedMenu[cat.category] || []).includes(item.item_id)"
                    :disabled="!(selectedMenu[cat.category] || []).includes(item.item_id) && (selectedMenu[cat.category] || []).length >= cat.need"
                    @change="toggleMenuItem(cat, item.item_id)"
                  />
                  {{ item.item_name }}
                </label>
              </div>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Assign Staff (optional)</p>
            <div v-if="assignableStaff.length === 0" class="text-xs text-gray-400 dark:text-gray-500">
              No staff accounts yet. Add staff under Staff Management first.
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-none p-3">
              <label v-for="s in assignableStaff" :key="s.id" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  :value="s.id"
                  v-model="selectedStaffIds"
                  @change="checkStaffAvailability"
                  class="rounded-none"
                />
                {{ s.full_name }}<span v-if="s.position" class="text-xs text-gray-400 dark:text-gray-500"> · {{ s.position }}</span>
              </label>
            </div>
            <p v-if="staffConflictWarning" class="text-xs text-amber-600 dark:text-amber-400 mt-2">{{ staffConflictWarning }}</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeCreateModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isCreating" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isCreating ? 'Saving...' : 'Create Booking' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ RETURN-STOCK CONFIRM MODAL ============ -->
    <div v-if="revertRequest" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Return stock to inventory?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Changing <span class="font-semibold text-gray-700 dark:text-gray-200">{{ revertRequest.booking.client_name }}</span>'s booking from
          {{ revertRequest.booking.booking_status }} to <span class="font-semibold text-gray-700 dark:text-gray-200">{{ revertRequest.newStatus }}</span>
          will put
          <template v-if="revertRequest.count">the {{ revertRequest.count }} deducted item(s)</template>
          <template v-else>the deducted ingredients</template>
          back into inventory.
        </p>
        <div class="flex gap-3">
          <button @click="revertRequest = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Keep as is
          </button>
          <button @click="confirmRevert" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700">
            Return stock
          </button>
        </div>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="bookingToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Booking?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This will permanently remove the booking for <span class="font-semibold text-gray-700 dark:text-gray-200">{{ bookingToDelete.client_name }}</span> on {{ formatDate(bookingToDelete.event_date) }}.
        </p>
        <div class="flex gap-3">
          <button @click="bookingToDelete = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button @click="handleDelete" :disabled="isDeleting" class="flex-1 bg-red-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ ASSIGN STAFF MODAL ============ -->
    <div v-if="assignModalBooking" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Assign Staff</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ assignModalBooking.client_name }} — {{ formatDate(assignModalBooking.event_date) }}
        </p>

        <div v-if="assignModalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {{ assignModalError }}
        </div>
        <div v-if="assignModalConflict" class="text-amber-700 dark:text-amber-300 text-sm font-medium mb-4 flex gap-2">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.82 21h16.36a2 2 0 001.71-3l-8.18-14.14a2 2 0 00-3.42 0z" />
          </svg>
          <span>{{ assignModalConflict }}</span>
        </div>

        <div v-if="assignableStaff.length === 0" class="text-sm text-gray-400 dark:text-gray-500 mb-4">
          No staff accounts yet. Add staff under Staff Management first.
        </div>
        <div v-else class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-none p-3 mb-4">
          <label v-for="s in assignableStaff" :key="s.id" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              :value="s.id"
              v-model="assignModalStaffIds"
              @change="checkAssignModalConflicts"
              class="rounded-none"
            />
            {{ s.full_name }}
            <span v-if="s.position" class="text-xs text-gray-400 dark:text-gray-500"> · {{ s.position }}</span>
            <span v-if="s.availability !== 'Available'" class="text-xs text-gray-400 dark:text-gray-500">({{ s.availability }})</span>
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeAssignModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="button" @click="handleSaveAssignment" :disabled="isSavingAssignment" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
            {{ isSavingAssignment ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { localToday } from '../utils/date'
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted, watch } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import { useRouter } from 'vue-router'
import {
  getBookingsPage,
  getBookingStatusCounts,
  createBooking,
  updateBookingStatus,
  getBookingStockCount,
  deleteBooking,
  checkDateConflict,
  setBookingSelections
} from '../services/bookingService'
import { getAllPackages, getPackageMenu, getAllMenuItems } from '../services/packageService'
import { sendBookingConfirmationSms } from '../services/smsService'
import {
  getAssignableStaff,
  getAssignedStaff,
  getAssignedStaffForBookings,
  getStaffScheduleConflicts,
  getUnavailableStaffOnDate,
  setBookingStaff
} from '../services/staffassignmentservice'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
const isLogoHovered = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  isLogoHovered.value = false
}
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')
const userAvatarUrl = ref('')

const bookings = ref([])
const isLoading = ref(false)
const pageError = ref('')

// Turns the raw DB message ("Cannot confirm booking: menu selection is incomplete -
// Main Course (picked 0 of 2); ...") into a title + category chips. Any other
// error text just falls back to a plain title.
const pageErrorParsed = computed(() => {
  const raw = (pageError.value || '').trim()
  const m = raw.match(/^Cannot confirm booking:\s*menu selection is incomplete\s*-\s*(.+)$/i)
  if (!m) return { title: raw, subtitle: '', gaps: [] }
  const gaps = [...m[1].matchAll(/([^;()]+?)\s*\(picked\s*(\d+)\s*of\s*(\d+)\)/gi)]
    .map((x) => ({ label: x[1].trim(), picked: x[2], need: x[3] }))
  return {
    title: 'Cannot confirm this booking',
    subtitle: 'The client has not finished picking their menu. Still needed per category:',
    gaps
  }
})
const stockNotice = ref('')
const revertRequest = ref(null) // { booking, newStatus, count } while the "return stock?" modal is open
let stockNoticeTimer = null

function showStockNotice(message) {
  stockNotice.value = message
  clearTimeout(stockNoticeTimer)
  stockNoticeTimer = setTimeout(() => { stockNotice.value = '' }, 8000)
}

const PAGE_SIZE = 50
const totalBookings = ref(0)
const isLoadingMore = ref(false)
const statusCounts = ref({})
const hasMoreBookings = computed(() => bookings.value.length < totalBookings.value)

const searchQuery = ref('')
const statusFilter = ref('')

const showCreateModal = ref(false)
const isCreating = ref(false)
const modalError = ref('')
const conflictWarning = ref('')

const bookingToDelete = ref(null)
const isDeleting = ref(false)

const emptyForm = () => ({
  client_name: '',
  client_contact_number: '',
  event_date: '',
  event_time: '',
  event_location: '',
  guest_count: null,
  package_id: '',
  package_name: ''
})
const form = ref(emptyForm())

// --- Package + menu picks for admin-created bookings ---
// This used to be a free-text "package name" box, so the booking had NO
// package_id: no menu, no ingredient stock deduction, no food costing.
const packages = ref([])
const allMenuItems = ref([])
const packageMenu = ref({ limits: [], itemsByCategory: {} })
const selectedMenu = ref({}) // category -> [item_id, ...]

// Same rule as the client form and the confirm RPC: per category the booking
// needs min(pick limit, dishes offered) dishes.
const menuCategories = computed(() => {
  const out = []
  for (const l of packageMenu.value.limits) {
    const ids = packageMenu.value.itemsByCategory[l.category] || []
    const items = allMenuItems.value.filter((i) => ids.includes(i.item_id) && i.is_active !== false)
    const need = Math.min(Number(l.max_selections) || 0, items.length)
    if (need > 0) out.push({ category: l.category, need, items })
  }
  return out
})

const isMenuComplete = computed(() =>
  menuCategories.value.every((c) => (selectedMenu.value[c.category] || []).length === c.need)
)

function toggleMenuItem(cat, itemId) {
  const current = selectedMenu.value[cat.category] || []
  if (current.includes(itemId)) {
    selectedMenu.value = { ...selectedMenu.value, [cat.category]: current.filter((id) => id !== itemId) }
  } else if (current.length < cat.need) {
    selectedMenu.value = { ...selectedMenu.value, [cat.category]: [...current, itemId] }
  }
}

watch(() => form.value.package_id, async (packageId) => {
  selectedMenu.value = {}
  packageMenu.value = { limits: [], itemsByCategory: {} }
  const pkg = packages.value.find((p) => p.package_id === packageId)
  form.value.package_name = pkg?.package_name || ''
  if (!packageId) return
  try {
    packageMenu.value = await getPackageMenu(packageId)
  } catch (error) {
    console.error('Failed to load package menu:', error)
  }
})

// --- Staff assignment ---
const assignableStaff = ref([]) // all Staff-role profiles, for checklists
const assignedStaffByBooking = ref({}) // booking_id -> [{ id, full_name }]
const selectedStaffIds = ref([]) // used by the New Booking form
const staffConflictWarning = ref('')

const assignModalBooking = ref(null) // booking currently being (re)assigned
const assignModalStaffIds = ref([])
const isSavingAssignment = ref(false)
const assignModalError = ref('')
const assignModalConflict = ref('')

const todayStr = localToday()

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (!['Admin', 'Staff', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  // Per the manuscript's Use Case Diagram, Staff only has access to
  // Login/Authentication and Manage Payments -- Bookings is Admin-only.
  if (user.role === 'Staff') {
    router.push('/admin/dashboard')
    return
  }
  // full_name can be empty for accounts created without one -- fall back so
  // `.charAt` never runs on null and blanks the whole page.
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''

  fetchBookings()
  getAssignableStaff().then((staff) => { assignableStaff.value = staff }).catch(console.error)
  getAllPackages().then((rows) => { packages.value = rows }).catch(console.error)
  getAllMenuItems().then((rows) => { allMenuItems.value = rows }).catch(console.error)
})

async function fetchBookings() {
  isLoading.value = true
  pageError.value = ''
  try {
    const [page, counts] = await Promise.all([
      getBookingsPage({ offset: 0, limit: PAGE_SIZE }),
      getBookingStatusCounts()
    ])
    bookings.value = page.rows
    totalBookings.value = page.total
    statusCounts.value = counts
    loadAssignedStaffFor(page.rows)
  } catch (error) {
    pageError.value = 'Failed to load bookings. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function loadMoreBookings() {
  if (isLoadingMore.value || !hasMoreBookings.value) return
  isLoadingMore.value = true
  try {
    const page = await getBookingsPage({ offset: bookings.value.length, limit: PAGE_SIZE })
    bookings.value = [...bookings.value, ...page.rows]
    totalBookings.value = page.total
    loadAssignedStaffFor(page.rows)
  } catch (error) {
    pageError.value = 'Failed to load more bookings.'
    console.error(error)
  } finally {
    isLoadingMore.value = false
  }
}

async function loadAssignedStaffFor(rows) {
  try {
    const ids = rows.map((b) => b.booking_id)
    const map = await getAssignedStaffForBookings(ids)
    assignedStaffByBooking.value = { ...assignedStaffByBooking.value, ...map }
  } catch (error) {
    console.error('Failed to load staff assignments:', error)
  }
}

const filteredBookings = computed(() => {
  return bookings.value.filter((b) => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = b.client_name?.toLowerCase().includes(q) || (b.client_contact_number || '').includes(q)
    const matchesStatus = !statusFilter.value || b.booking_status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function countByStatus(status) {
  return statusCounts.value[status] || 0
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Confirmed': return 'text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'text-amber-700 dark:text-amber-300'
    case 'Completed': return 'text-blue-700 dark:text-blue-300'
    case 'Cancelled': return 'text-red-700 dark:text-red-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function assignedStaffNames(bookingId) {
  return (assignedStaffByBooking.value[bookingId] || []).map((s) => s.full_name)
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${m} ${suffix}`
}

function openCreateModal() {
  form.value = emptyForm()
  selectedStaffIds.value = []
  modalError.value = ''
  conflictWarning.value = ''
  staffConflictWarning.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function handleDateCheck() {
  conflictWarning.value = ''
  if (!form.value.event_date) return
  try {
    const result = await checkDateConflict(form.value.event_date)
    if (result.conflict) {
      const existing = result.existingBookings[0]
      conflictWarning.value = `This date already has a booking (${existing.client_name} at ${formatTime(existing.event_time)}). Please choose a different date — the same date can't be booked twice.`
    }
  } catch (error) {
    console.error('Conflict check failed:', error)
  }
  await checkStaffAvailability()
}

// Warn (don't block) if any selected staff member is already assigned to
// another Pending/Confirmed booking on this date, OR has marked this date
// as unavailable (leave/time-off) on their schedule.
async function checkStaffAvailability() {
  staffConflictWarning.value = ''
  if (!form.value.event_date || selectedStaffIds.value.length === 0) return
  try {
    const [bookingConflicts, leaveConflicts] = await Promise.all([
      getStaffScheduleConflicts(form.value.event_date, selectedStaffIds.value),
      getUnavailableStaffOnDate(form.value.event_date, selectedStaffIds.value)
    ])
    const messages = []
    if (bookingConflicts.length > 0) {
      const names = [...new Set(bookingConflicts.map((c) => c.staff_name))].join(', ')
      messages.push(`${names} already assigned to another event on this date.`)
    }
    if (leaveConflicts.length > 0) {
      const names = [...new Set(leaveConflicts.map((c) => c.staff_name))].join(', ')
      messages.push(`${names} marked unavailable (leave/time-off) on this date.`)
    }
    staffConflictWarning.value = messages.join(' ')
  } catch (error) {
    console.error('Staff conflict check failed:', error)
  }
}

async function handleCreateBooking() {
  modalError.value = ''
  if (!form.value.package_id) {
    modalError.value = 'Please select a package.'
    return
  }
  if (!isMenuComplete.value) {
    modalError.value = 'Please finish the menu selection for every category.'
    return
  }
  isCreating.value = true
  try {
    const booking = await createBooking(form.value)
    const flatSelections = Object.values(selectedMenu.value).flat().map((item_id) => ({ item_id }))
    if (flatSelections.length) {
      try {
        await setBookingSelections(booking.booking_id, flatSelections)
      } catch (selError) {
        // The booking exists; don't lose it, but tell the admin clearly.
        pageError.value = selError?.message || 'Booking created, but the menu picks could not be saved.'
      }
    }
    if (selectedStaffIds.value.length > 0) {
      try {
        await setBookingStaff(booking.booking_id, selectedStaffIds.value)
      } catch (assignError) {
        // Booking itself succeeded; surface the assignment failure but
        // don't lose the booking that was just created.
        pageError.value = assignError?.message || 'Booking created, but staff assignment failed. Assign staff from the table.'
      }
    }
    showCreateModal.value = false
    fetchBookings()
  } catch (error) {
    modalError.value = error?.message || error?.response?.data?.error || 'Something went wrong. Please try again.'
  } finally {
    isCreating.value = false
  }
}

// --- Assign Staff modal (for existing bookings) ---
async function openAssignModal(booking) {
  assignModalBooking.value = booking
  assignModalError.value = ''
  assignModalConflict.value = ''
  assignModalStaffIds.value = (assignedStaffByBooking.value[booking.booking_id] || []).map((s) => s.id)
  // Refresh from source of truth in case the cached list is stale.
  try {
    const current = await getAssignedStaff(booking.booking_id)
    assignModalStaffIds.value = current.map((s) => s.id)
  } catch (error) {
    console.error(error)
  }
}

function closeAssignModal() {
  assignModalBooking.value = null
}

async function checkAssignModalConflicts() {
  assignModalConflict.value = ''
  if (!assignModalBooking.value || assignModalStaffIds.value.length === 0) return
  try {
    const [bookingConflicts, leaveConflicts] = await Promise.all([
      getStaffScheduleConflicts(
        assignModalBooking.value.event_date,
        assignModalStaffIds.value,
        assignModalBooking.value.booking_id
      ),
      getUnavailableStaffOnDate(assignModalBooking.value.event_date, assignModalStaffIds.value)
    ])
    const messages = []
    if (bookingConflicts.length > 0) {
      const names = [...new Set(bookingConflicts.map((c) => c.staff_name))].join(', ')
      messages.push(`${names} already assigned to another event on this date.`)
    }
    if (leaveConflicts.length > 0) {
      const names = [...new Set(leaveConflicts.map((c) => c.staff_name))].join(', ')
      messages.push(`${names} marked unavailable (leave/time-off) on this date.`)
    }
    assignModalConflict.value = messages.join(' ')
  } catch (error) {
    console.error(error)
  }
}

async function handleSaveAssignment() {
  if (!assignModalBooking.value) return
  assignModalError.value = ''
  isSavingAssignment.value = true
  try {
    await setBookingStaff(assignModalBooking.value.booking_id, assignModalStaffIds.value)
    const updated = await getAssignedStaff(assignModalBooking.value.booking_id)
    assignedStaffByBooking.value = { ...assignedStaffByBooking.value, [assignModalBooking.value.booking_id]: updated }
    assignModalBooking.value = null
  } catch (error) {
    assignModalError.value = error?.message || 'Failed to save staff assignment.'
  } finally {
    isSavingAssignment.value = false
  }
}

// Entry point for both status dropdowns. Stock is deducted when a booking is
// Confirmed and returned when it goes back to Pending or to Cancelled, so
// those two moves ask first instead of surprising the admin.
async function requestStatusChange(booking, event) {
  const newStatus = event.target.value
  const previousStatus = booking.booking_status
  if (newStatus === previousStatus) return

  const returnsStock =
    ['Confirmed', 'Completed'].includes(previousStatus) && ['Pending', 'Cancelled'].includes(newStatus)
  if (!returnsStock) {
    handleStatusChange(booking, newStatus)
    return
  }

  event.target.value = previousStatus // snap the dropdown back until the admin agrees
  const count = await getBookingStockCount(booking.booking_id)
  revertRequest.value = { booking, newStatus, count }
}

function confirmRevert() {
  const { booking, newStatus } = revertRequest.value
  revertRequest.value = null
  handleStatusChange(booking, newStatus)
}

async function handleStatusChange(booking, newStatus) {
  const previousStatus = booking.booking_status
  pageError.value = '' // drop any stale error from a previous attempt
  stockNotice.value = ''
  const countBefore = ['Pending', 'Cancelled'].includes(newStatus)
    ? await getBookingStockCount(booking.booking_id)
    : null
  booking.booking_status = newStatus // optimistic update
  try {
    await updateBookingStatus(booking.booking_id, newStatus)
    if (newStatus === 'Confirmed') {
      sendBookingConfirmationSms(booking.booking_id) // no await: SMS must never block the UI
      const deducted = await getBookingStockCount(booking.booking_id)
      showStockNotice(
        deducted
          ? `${deducted} item(s) deducted from inventory.`
          : 'Booking confirmed. Ingredients were deducted from inventory.'
      )
    } else if (countBefore) {
      showStockNotice(`${countBefore} item(s) returned to inventory.`)
    }
    statusCounts.value = {
      ...statusCounts.value,
      [previousStatus]: Math.max(0, (statusCounts.value[previousStatus] || 0) - 1),
      [newStatus]: (statusCounts.value[newStatus] || 0) + 1
    }
  } catch (error) {
    booking.booking_status = previousStatus
    pageError.value = error?.message || 'Failed to update booking status.'
    console.error(error)
  }
}

function confirmDelete(booking) {
  bookingToDelete.value = booking
}

async function handleDelete() {
  if (!bookingToDelete.value) return
  isDeleting.value = true
  try {
    await deleteBooking(bookingToDelete.value.booking_id)
    const deletedStatus = bookingToDelete.value.booking_status
    const deletedId = bookingToDelete.value.booking_id
    bookings.value = bookings.value.filter((b) => b.booking_id !== deletedId)
    const { [deletedId]: _removed, ...restAssignments } = assignedStaffByBooking.value
    assignedStaffByBooking.value = restAssignments
    totalBookings.value = Math.max(0, totalBookings.value - 1)
    statusCounts.value = {
      ...statusCounts.value,
      [deletedStatus]: Math.max(0, (statusCounts.value[deletedStatus] || 0) - 1)
    }
    bookingToDelete.value = null
  } catch (error) {
    pageError.value = 'Failed to delete booking.'
    console.error(error)
  } finally {
    isDeleting.value = false
  }
}

function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = async () => {
  // End the real Supabase session too -- clearing sessionStorage alone left it
  // alive, so Back / typing the URL let the user straight back in.
  try {
    await logoutUser()
  } catch (error) {
    console.error('Sign out failed:', error)
  }
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  resetNotifications()
  router.push('/')
}

const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Event Planning', path: '/admin/planning', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]


const staffAllowedSections = ['Dashboard', 'Payment Records', 'Support Chat']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)
</script>

<style scoped>
</style>