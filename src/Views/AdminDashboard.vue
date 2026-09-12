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
      <div class="flex items-center justify-between p-4">
        <div v-if="sidebarExpanded" class="flex items-center gap-2 overflow-hidden">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
        </div>
        <button @click="isMobileSidebarOpen ? (isMobileSidebarOpen = false) : (isSidebarOpen = !isSidebarOpen)" :class="!sidebarExpanded ? 'mx-auto' : ''" class="relative group p-1.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500">
          <img v-if="!sidebarExpanded" :src="logoUrl" alt="Toggle" class="w-8 h-8 object-contain group-hover:opacity-0 transition-opacity duration-150" />
          <svg v-if="!sidebarExpanded" class="w-8 h-8 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2" />
            <line x1="9" y1="4" x2="9" y2="20" stroke-width="2" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2" />
            <line x1="9" y1="4" x2="9" y2="20" stroke-width="2" />
          </svg>
          <span class="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            {{ sidebarExpanded ? 'Close sidebar' : 'Open sidebar' }}
          </span>
        </button>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="sidebarExpanded" class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
        @click.prevent="isMobileSidebarOpen = false; item.name === 'Event Bookings' ? router.push('/admin/bookings') : item.name === 'Catering Packages' ? router.push('/admin/packages') : item.name === 'Inventory' ? router.push('/admin/inventory') : item.name === 'Payment Records' ? router.push('/admin/payments') : item.name === 'Staff Management' ? router.push('/admin/staff') : item.name === 'Reports' ? router.push('/admin/reports') : (activeSection = item.name)"
          :class="activeSection === item.name ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 dark:border-gray-700 p-3 relative">
        <!-- Click-outside backdrop -->
        <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

        <!-- Account menu (Settings + Log Out) -->
        <div v-if="showAccountMenu" class="absolute bottom-full left-2 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg overflow-hidden z-50">
          <button @click="router.push('/settings')" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
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

        <!-- Gear icon: its own row, above the profile -->
        <div v-if="sidebarExpanded" class="flex justify-end px-1 mb-1">
          <button @click="router.push('/settings')" title="Settings" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <!-- Profile: click toggles the account menu -->
        <div @click="showAccountMenu = !showAccountMenu" class="flex items-center gap-3 px-2 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="" class="w-full h-full object-cover" />
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
      <div class="max-w-7xl mx-auto">

        <div v-if="activeSection !== 'Dashboard'" class="hidden lg:flex justify-end mb-4">
          <NotificationBell />
        </div>

        <h1 v-if="activeSection !== 'Dashboard'" class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{{ sectionLabel }}</h1>

        <!-- ============ DASHBOARD SECTION (STAFF) ============ -->
        <div v-if="activeSection === 'Dashboard' && userRole === 'Staff'">

          <!-- Welcome Banner -->
          <div class="p-8 rounded-none mb-8 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Welcome, {{ userName }}!</h2>
              <p class="text-gray-500 dark:text-gray-400 mt-2">You can view and manage client payments here.</p>
            </div>
            <div class="hidden lg:block">
              <NotificationBell />
            </div>
          </div>

          <!-- Summary Card -->
          <div class="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8 mt-4 max-w-sm mx-auto">
            <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
              <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Total Revenue</h3>
              <p class="text-3xl font-black text-gray-900 dark:text-gray-100">₱{{ formatCurrency(totalRevenue) }}</p>
            </div>
          </div>

          <!-- Quick Action -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button @click="router.push('/admin/payments')" class="bg-white dark:bg-gray-800 p-5 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 transition text-center">
              <div class="w-10 h-10 rounded-none bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-800 dark:text-gray-100 text-sm">Go to Payments</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">Record and track client payments</p>
              </div>
            </button>
          </div>

          <!-- My Assigned Events -->
          <div class="bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm">My Upcoming Events</h3>
            </div>
            <div v-if="isLoadingDashboard" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
            <div v-else-if="myAssignedEvents.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No events assigned to you yet.
            </div>
            <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
              <div v-for="e in myAssignedEvents" :key="e.booking_id" class="px-5 py-3.5 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{{ e.client_name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(e.event_date) }} · {{ e.event_location }}</p>
                </div>
                <span :class="statusBadgeClass(e.booking_status)" class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ e.booking_status }}
                </span>
              </div>
            </div>
          </div>

          <!-- My Schedule -->
          <div class="bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm">My Schedule</h3>
              <button @click="openScheduleModal({ id: currentUserId, full_name: userName })" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Manage unavailable dates
              </button>
            </div>
            <p class="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Mark dates you're on leave or unavailable — the office will see this when assigning staff to events.</p>
          </div>

        </div>

        <!-- ============ DASHBOARD SECTION (ADMIN / OWNER) ============ -->
        <div v-if="activeSection === 'Dashboard' && userRole !== 'Staff'">

          <!-- Welcome Banner -->
          <div class="flex items-start justify-between mb-8">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome, {{ userName }}!</h2>
              <p class="text-gray-500 dark:text-gray-400 mt-1">Manage bookings, packages, and inventory.</p>
            </div>
            <div class="hidden lg:flex flex-col items-end gap-2">
              <span class="text-sm text-gray-400 dark:text-gray-500">{{ todayLabel }}</span>
              <NotificationBell />
            </div>
          </div>

          <!-- Taken so far -->
          <div class="mb-6">
            <div class="flex items-center gap-4">
              <span class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 whitespace-nowrap">₱{{ isLoadingDashboard ? '…' : formatCurrency(totalRevenue) }}</span>
              <span class="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></span>
              <span class="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">Total Revenue</span>
            </div>
          </div>

          <!-- Mini stats -->
          <div class="flex flex-wrap items-center gap-x-8 gap-y-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span class="font-bold text-gray-900 dark:text-gray-100">{{ isLoadingDashboard ? '…' : totalBookings }}</span>
              <span class="text-gray-400 dark:text-gray-500 text-sm">Total Bookings</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-bold text-gray-900 dark:text-gray-100">{{ isLoadingDashboard ? '…' : activeEventsCount }}</span>
              <span class="text-gray-400 dark:text-gray-500 text-sm">Active Events</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
              </svg>
              <span class="font-bold text-gray-900 dark:text-gray-100">{{ isLoadingDashboard ? '…' : lowStockCount }}</span>
              <span class="text-gray-400 dark:text-gray-500 text-sm">Low Stock Items</span>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-6 mb-8">
            <a href="#" @click.prevent="router.push('/admin/bookings')" class="text-sm font-medium text-gray-700 dark:text-gray-200 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400">New Booking</a>
            <a href="#" @click.prevent="router.push('/admin/inventory')" class="text-sm font-medium text-gray-700 dark:text-gray-200 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400">Add Inventory</a>
            <a href="#" @click.prevent="router.push('/admin/staff')" class="text-sm font-medium text-gray-700 dark:text-gray-200 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400">Manage Staff</a>
          </div>

          <!-- Recent Bookings -->
          <h3 class="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Bookings</h3>
          <div v-if="isLoadingDashboard" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Loading bookings...</div>
          <div v-else-if="recentBookings.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No bookings yet.</div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="b in recentBookings" :key="b.booking_id" class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 p-4">
              <div class="h-1.5 w-10 bg-gray-200 dark:bg-gray-600 rounded-full mb-4"></div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">{{ formatDate(b.event_date) }}</p>
              <p class="font-bold text-gray-900 dark:text-gray-100">{{ b.client_name }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">{{ b.package_name || 'No package' }}</p>
              <span :class="statusBadgeClass(b.booking_status)" class="inline-block px-2.5 py-1 rounded-full text-xs font-semibold">
                {{ b.booking_status }}
              </span>
            </div>
          </div>

        </div>


        <!-- ============ PLACEHOLDER FOR OTHER SECTIONS ============ -->
        <div v-if="activeSection !== 'Dashboard'" class="bg-white dark:bg-gray-800 p-8 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 text-center text-gray-400 dark:text-gray-500">
          {{ activeSection }} page — coming soon.
        </div>

      </div>
    </main>

    <!-- ============ STAFF SCHEDULE MODAL (per-date unavailability) ============ -->
    <div v-if="scheduleModalUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{{ scheduleModalUser.full_name }}'s Schedule</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Mark specific dates this staff member is unavailable (leave, time off, etc). Booking-time assignment checks use this list.</p>

        <div v-if="scheduleError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ scheduleError }}
        </div>

        <form @submit.prevent="handleAddLeaveDate" class="flex gap-2 mb-4">
          <input type="date" v-model="newLeaveDate" :min="todayStr" required class="flex-1 p-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
          <input type="text" v-model="newLeaveReason" placeholder="Reason (optional)" class="flex-1 p-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
          <button type="submit" :disabled="isSavingLeave" class="px-4 py-2.5 bg-emerald-600 text-white rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
            Add
          </button>
        </form>

        <div v-if="isLoadingSchedule" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
        <div v-else-if="scheduleDates.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
          No unavailable dates marked yet.
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-none">
          <div v-for="d in scheduleDates" :key="d.id" class="flex items-center justify-between px-4 py-2.5">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(d.unavailable_date) }}</p>
              <p v-if="d.reason" class="text-xs text-gray-500 dark:text-gray-400">{{ d.reason }}</p>
            </div>
            <button @click="handleRemoveLeaveDate(d.id)" class="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
              Remove
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="closeScheduleModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { getMyAvatarUrl } from '../services/profileService'
import { getAllBookings } from '../services/bookingService'
import { getAllInventory } from '../services/inventoryService'
import { getAllPayments } from '../services/paymentService'
import {
  getMyAssignedBookings,
  getUnavailableDates,
  addUnavailableDate,
  removeUnavailableDate
} from '../services/staffassignmentservice'

const router = useRouter()
const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const showAccountMenu = ref(false)
const activeSection = ref('Dashboard')

const userName = ref('User')
const userRole = ref('Admin')
const userInitial = ref('U')
const userAvatarUrl = ref('')
const currentUserId = ref('')

// ---------- Staff schedule (per-date unavailability) — self-service,
// used from the Staff role's own "My Schedule" card on this Dashboard.
// The full staff list + add/edit/delete lives in StaffManagement.vue.
const scheduleModalUser = ref(null)
const scheduleDates = ref([])
const isLoadingSchedule = ref(false)
const scheduleError = ref('')
const newLeaveDate = ref('')
const newLeaveReason = ref('')
const isSavingLeave = ref(false)
const todayStr = new Date().toISOString().split('T')[0]

// ---------- Dashboard data ----------
const allBookings = ref([])
const allInventory = ref([])
const allPayments = ref([])
const isLoadingDashboard = ref(false)
const myAssignedEvents = ref([]) // Staff role: their own upcoming assigned events

const totalBookings = computed(() => allBookings.value.length)

const activeEventsCount = computed(() =>
  allBookings.value.filter((b) => ['Pending', 'Confirmed'].includes(b.booking_status)).length
)

const lowStockCount = computed(() =>
  allInventory.value.filter((item) => Number(item.quantity) <= Number(item.low_stock_threshold)).length
)

const totalRevenue = computed(() =>
  allPayments.value.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0)
)

const recentBookings = computed(() => {
  return [...allBookings.value]
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    .slice(0, 5)
})

function formatCurrency(value) {
  const num = Number(value) || 0
  return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const todayLabel = new Date().toLocaleDateString('en-PH', {
  weekday: 'short', month: 'short', day: 'numeric'
})

function statusBadgeClass(status) {
  switch (status) {
    case 'Confirmed': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'Completed': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'Cancelled': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  }
}

async function fetchDashboardData(role) {
  isLoadingDashboard.value = true
  try {
    if (role === 'Staff') {
      // Staff only has Payments access — just pull revenue — plus their own
      // assigned events, so they know what they're actually working on.
      const [payments, assigned] = await Promise.all([
        getAllPayments(),
        getMyAssignedBookings()
      ])
      allPayments.value = payments
      myAssignedEvents.value = assigned
    } else {
      const [bookings, inventory, payments] = await Promise.all([
        getAllBookings(),
        getAllInventory(),
        getAllPayments()
      ])
      allBookings.value = bookings
      allInventory.value = inventory
      allPayments.value = payments
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoadingDashboard.value = false
  }
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }

  const user = JSON.parse(storedUser)

  if (!['Admin', 'Staff', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }

  userName.value = user.full_name
  userRole.value = user.role
  userInitial.value = user.full_name.charAt(0).toUpperCase()
  currentUserId.value = user.user_id
  userAvatarUrl.value = user.avatar_url || '' // show cached picture immediately, no flicker
  getMyAvatarUrl(user.user_id).then((url) => {
    userAvatarUrl.value = url || ''
    const cached = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...cached, avatar_url: url || '' }))
  })

  fetchDashboardData(user.role)
})

async function openScheduleModal(user) {
  scheduleModalUser.value = user
  scheduleError.value = ''
  newLeaveDate.value = ''
  newLeaveReason.value = ''
  await loadSchedule()
}

function closeScheduleModal() {
  scheduleModalUser.value = null
  scheduleDates.value = []
}

async function loadSchedule() {
  if (!scheduleModalUser.value) return
  isLoadingSchedule.value = true
  try {
    scheduleDates.value = await getUnavailableDates(scheduleModalUser.value.id)
  } catch (error) {
    scheduleError.value = error?.message || 'Failed to load schedule.'
  } finally {
    isLoadingSchedule.value = false
  }
}

async function handleAddLeaveDate() {
  if (!scheduleModalUser.value || !newLeaveDate.value) return
  scheduleError.value = ''
  isSavingLeave.value = true
  try {
    await addUnavailableDate(scheduleModalUser.value.id, newLeaveDate.value, newLeaveReason.value || null)
    newLeaveDate.value = ''
    newLeaveReason.value = ''
    await loadSchedule()
  } catch (error) {
    scheduleError.value = error?.message || 'Failed to add date.'
  } finally {
    isSavingLeave.value = false
  }
}

async function handleRemoveLeaveDate(id) {
  scheduleError.value = ''
  try {
    await removeUnavailableDate(id)
    scheduleDates.value = scheduleDates.value.filter((d) => d.id !== id)
  } catch (error) {
    scheduleError.value = error?.message || 'Failed to remove date.'
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}

const allNavItems = [
  { name: 'Dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Catering Packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Payment Records', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Staff Management', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]

// Staff (per the manuscript's Use Case Diagram) only has access to
// Login/Authentication and Manage Payments -- so their sidebar only
// shows Dashboard (general landing view) and Payments.
const staffAllowedSections = ['Dashboard', 'Payment Records']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)


const sectionLabel = computed(() =>
  activeSection.value === 'Dashboard' ? 'Pangunahing Pahina' : activeSection.value
)
</script>

<style scoped>
</style>