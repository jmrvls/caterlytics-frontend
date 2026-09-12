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
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-auto print:hidden"
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
          @click.prevent="goTo(item)"
          :class="item.name === 'Reports' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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
    <main class="flex-1 p-4 sm:p-8 pt-20 lg:pt-8 overflow-x-hidden print:p-0 w-full min-w-0">
      <div class="max-w-7xl mx-auto">

        <div class="flex flex-wrap items-center justify-between gap-3 mb-6 print:mb-4 print:flex-nowrap">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
            <p class="hidden print:block text-xs text-gray-500 dark:text-gray-400 mt-1">Generated {{ generatedOn }}</p>
          </div>
          <div class="flex items-center gap-3 print:hidden">
            <div class="hidden lg:block">
              <NotificationBell />
            </div>
            <button @click="exportPDF" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap flex-shrink-0">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H8a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <!-- TABS -->
        <div class="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-none border border-gray-100 dark:border-gray-700 mb-4 w-fit print:hidden">
          <button
            v-for="tab in tabs" :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab ? 'bg-emerald-600 dark:bg-emerald-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
            class="px-4 py-2 rounded-none text-sm font-semibold transition"
          >
            {{ tab }}
          </button>
        </div>

        <!-- DATE FILTER (affects Overview + Bookings tabs) -->
        <div v-if="activeTab !== 'Inventory Report'" class="bg-white dark:bg-gray-800 p-5 rounded-none border border-gray-100 dark:border-gray-700 mb-4 flex flex-wrap items-end gap-4 print:hidden">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">From</label>
            <input type="date" v-model="dateFrom" class="block p-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">To</label>
            <input type="date" v-model="dateTo" class="block p-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>
          <button v-if="dateFrom || dateTo" @click="dateFrom = ''; dateTo = ''" class="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
            Clear filter
          </button>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ pageError }}
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500">
          Loading report data...
        </div>

        <template v-else>

          <!-- ============ OVERVIEW TAB ============ -->
          <div v-if="activeTab === 'Overview'">

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 mt-4">
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Total Bookings</h3>
                <p class="text-2xl font-black text-gray-900 dark:text-gray-100">{{ filteredBookings.length }}</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Confirmed</h3>
                <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400">{{ countByStatus('Confirmed') }}</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Completed</h3>
                <p class="text-2xl font-black text-blue-600 dark:text-blue-400">{{ countByStatus('Completed') }}</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Cancelled</h3>
                <p class="text-2xl font-black text-red-500 dark:text-red-400">{{ countByStatus('Cancelled') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 mt-4">
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Revenue Collected</h3>
                <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400">₱{{ formatPrice(revenueCollected) }}</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-snug">Actual amount paid, from the Payments module.</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Total Expenses</h3>
                <p class="text-2xl font-black text-red-500 dark:text-red-400">₱{{ formatPrice(totalExpenses) }}</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-snug">Recorded business costs in this range.</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Gross Profit</h3>
                <p class="text-2xl font-black" :class="grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'">₱{{ formatPrice(grossProfit) }}</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-snug">Revenue Collected − direct costs (Ingredients &amp; Supplies).</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Outstanding Balance</h3>
                <p class="text-2xl font-black text-amber-500 dark:text-amber-400">₱{{ formatPrice(outstandingBalance) }}</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-snug">Still owed by clients across their bookings.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-4">
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Total Billed</h3>
                <p class="text-2xl font-black text-gray-900 dark:text-gray-100">₱{{ formatPrice(totalBilled) }}</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-snug">Sum of all payment records in this range.</p>
              </div>
              <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
                <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Low Stock Items</h3>
                <p class="text-2xl font-black text-amber-500 dark:text-amber-400">{{ lowStockItems.length }}</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-snug">Out of {{ inventory.length }} tracked item(s) in inventory.</p>
              </div>
            </div>

            <!-- Booking status breakdown (simple bar chart, no chart lib needed) -->
            <div class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 p-5 mb-6">
              <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4">Bookings by Status</h3>
              <div v-if="filteredBookings.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No bookings in this range.</div>
              <div v-else class="space-y-3">
                <div v-for="s in statusBreakdown" :key="s.status" class="flex items-center gap-3">
                  <span class="w-24 text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">{{ s.status }}</span>
                  <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all" :class="s.barClass" :style="{ width: s.pct + '%' }"></div>
                  </div>
                  <span class="w-8 text-xs font-bold text-gray-700 dark:text-gray-200 text-right flex-shrink-0">{{ s.count }}</span>
                </div>
              </div>
            </div>

            <!-- Monthly bookings trend -->
            <div class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 p-5">
              <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4">Bookings per Month</h3>
              <div v-if="monthlyTrend.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No bookings in this range.</div>
              <div v-else class="flex items-end gap-3 h-40">
                <div v-for="m in monthlyTrend" :key="m.label" class="flex-1 flex flex-col items-center justify-end h-full">
                  <span class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">{{ m.count }}</span>
                  <div class="w-full bg-emerald-500 rounded-t-lg transition-all" :style="{ height: m.pct + '%' }"></div>
                  <span class="text-[11px] text-gray-400 dark:text-gray-500 mt-2">{{ m.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ BOOKINGS REPORT TAB ============ -->
          <div v-else-if="activeTab === 'Bookings Report'">
            <div class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 class="font-bold text-gray-800 dark:text-gray-100">Booking Records ({{ filteredBookings.length }})</h3>
              </div>
              <div v-if="filteredBookings.length === 0" class="text-center py-14 text-gray-400 dark:text-gray-500 text-sm">
                No bookings found for the selected date range.
              </div>
              <div v-else>
                <!-- Mobile card list -->
                <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  <div v-for="b in filteredBookings" :key="b.booking_id" class="px-4 py-3.5">
                    <div class="flex items-start justify-between gap-2 mb-1.5">
                      <p class="font-semibold text-gray-800 dark:text-gray-100 truncate">{{ b.client_name }}</p>
                      <template v-if="paymentByBookingId.get(b.booking_id)">
                        <span :class="paymentStatusBadgeClass(paymentByBookingId.get(b.booking_id).payment_status)" class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {{ paymentByBookingId.get(b.booking_id).payment_status }}
                        </span>
                      </template>
                      <span v-else class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">No record</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ formatDate(b.event_date) }} · {{ b.event_location }} · {{ b.guest_count }} guests · {{ b.package_name || '—' }}</p>
                    <div v-if="paymentByBookingId.get(b.booking_id)" class="grid grid-cols-3 gap-2 text-center">
                      <div class="bg-gray-50 dark:bg-gray-900 py-1.5 rounded-none">
                        <p class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase">Total</p>
                        <p class="text-xs font-bold text-gray-800 dark:text-gray-100">₱{{ formatPrice(paymentByBookingId.get(b.booking_id).total_amount) }}</p>
                      </div>
                      <div class="bg-gray-50 dark:bg-gray-900 py-1.5 rounded-none">
                        <p class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase">Paid</p>
                        <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400">₱{{ formatPrice(paymentByBookingId.get(b.booking_id).amount_paid) }}</p>
                      </div>
                      <div class="bg-gray-50 dark:bg-gray-900 py-1.5 rounded-none">
                        <p class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase">Balance</p>
                        <p class="text-xs font-bold text-red-500 dark:text-red-400">₱{{ formatPrice(paymentByBookingId.get(b.booking_id).balance) }}</p>
                      </div>
                    </div>
                    <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">No payment record yet (est. ₱{{ formatPrice(estimateBookingAmount(b)) }})</p>
                  </div>
                </div>

                <!-- Desktop / tablet table -->
                <div class="hidden sm:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th class="text-left px-6 py-3 font-semibold">Client</th>
                      <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                      <th class="text-left px-6 py-3 font-semibold">Location</th>
                      <th class="text-left px-6 py-3 font-semibold">Guests</th>
                      <th class="text-left px-6 py-3 font-semibold">Package</th>
                      <th class="text-left px-6 py-3 font-semibold">Total Billed</th>
                      <th class="text-left px-6 py-3 font-semibold">Paid</th>
                      <th class="text-left px-6 py-3 font-semibold">Balance</th>
                      <th class="text-left px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="b in filteredBookings" :key="b.booking_id">
                      <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100">{{ b.client_name }}</td>
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ formatDate(b.event_date) }}</td>
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ b.event_location }}</td>
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ b.guest_count }}</td>
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ b.package_name || '—' }}</td>
                      <template v-if="paymentByBookingId.get(b.booking_id)">
                        <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">₱{{ formatPrice(paymentByBookingId.get(b.booking_id).total_amount) }}</td>
                        <td class="px-6 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium">₱{{ formatPrice(paymentByBookingId.get(b.booking_id).amount_paid) }}</td>
                        <td class="px-6 py-3.5 text-red-500 dark:text-red-400">₱{{ formatPrice(paymentByBookingId.get(b.booking_id).balance) }}</td>
                        <td class="px-6 py-3.5">
                          <span :class="paymentStatusBadgeClass(paymentByBookingId.get(b.booking_id).payment_status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                            {{ paymentByBookingId.get(b.booking_id).payment_status }}
                          </span>
                        </td>
                      </template>
                      <template v-else>
                        <td class="px-6 py-3.5 text-gray-400 dark:text-gray-500 italic" colspan="3">
                          No payment record yet (est. ₱{{ formatPrice(estimateBookingAmount(b)) }})
                        </td>
                        <td class="px-6 py-3.5">
                          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">No record</span>
                        </td>
                      </template>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ INVENTORY REPORT TAB ============ -->
          <div v-else-if="activeTab === 'Inventory Report'">
            <div v-if="lowStockItems.length > 0" class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm font-medium p-3 rounded-none mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{{ lowStockItems.length }} item(s) at or below their low-stock threshold.</span>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-100">Inventory Levels ({{ inventory.length }})</h3>
              </div>
              <div v-if="inventory.length === 0" class="text-center py-14 text-gray-400 dark:text-gray-500 text-sm">
                No inventory items recorded yet.
              </div>
              <div v-else>
                <!-- Mobile card list -->
                <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  <div v-for="i in sortedInventory" :key="i.item_id" class="px-4 py-3.5 flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <p class="font-semibold text-gray-800 dark:text-gray-100 truncate">{{ i.item_name }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Qty: {{ i.quantity }} · Threshold: {{ i.low_stock_threshold }}</p>
                    </div>
                    <span
                      :class="isLowStock(i) ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'"
                      class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                    >
                      {{ isLowStock(i) ? 'Low Stock' : 'Sufficient' }}
                    </span>
                  </div>
                </div>

                <!-- Desktop / tablet table -->
                <div class="hidden sm:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th class="text-left px-6 py-3 font-semibold">Item</th>
                      <th class="text-left px-6 py-3 font-semibold">Quantity</th>
                      <th class="text-left px-6 py-3 font-semibold">Low Stock Threshold</th>
                      <th class="text-left px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="i in sortedInventory" :key="i.item_id">
                      <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100">{{ i.item_name }}</td>
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ i.quantity }}</td>
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ i.low_stock_threshold }}</td>
                      <td class="px-6 py-3.5">
                        <span
                          :class="isLowStock(i) ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'"
                          class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        >
                          {{ isLowStock(i) ? 'Low Stock' : 'Sufficient' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ EXPENSES TAB ============ -->
          <div v-else-if="activeTab === 'Expenses'">
            <div class="flex items-center justify-between mb-4 print:hidden">
              <p class="text-sm text-gray-500 dark:text-gray-400">Track business costs to compute Gross Profit.</p>
              <button @click="openExpenseForm" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 transition">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Expense
              </button>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 class="font-bold text-gray-800 dark:text-gray-100">Expenses ({{ filteredExpenses.length }})</h3>
                <p class="text-sm font-bold text-red-500 dark:text-red-400">Total: ₱{{ formatPrice(totalExpenses) }}</p>
              </div>
              <div v-if="filteredExpenses.length === 0" class="text-center py-14 text-gray-400 dark:text-gray-500 text-sm">
                No expenses recorded in this range.
              </div>
              <div v-else>
                <!-- Mobile card list -->
                <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  <div v-for="e in filteredExpenses" :key="e.expense_id" class="px-4 py-3.5">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <p class="font-semibold text-gray-800 dark:text-gray-100 truncate">{{ e.description }}</p>
                      <p class="shrink-0 text-sm font-bold text-red-500 dark:text-red-400">₱{{ formatPrice(e.amount) }}</p>
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(e.expense_date) }}</span>
                        <span
                          :class="['Ingredients', 'Supplies'].includes(e.category) ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'"
                          class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        >{{ e.category }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button @click="openEditExpenseForm(e)" class="p-2 rounded-none text-gray-400 dark:text-gray-500 active:text-emerald-600 active:bg-emerald-50 dark:active:bg-emerald-900/30" title="Edit expense">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button @click="confirmDeleteExpense(e)" class="p-2 rounded-none text-gray-400 dark:text-gray-500 active:text-red-600 active:bg-red-50 dark:active:bg-red-900/30" title="Delete expense">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Desktop / tablet table -->
                <div class="hidden sm:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th class="text-left px-6 py-3 font-semibold">Date</th>
                      <th class="text-left px-6 py-3 font-semibold">Description</th>
                      <th class="text-left px-6 py-3 font-semibold">Category</th>
                      <th class="text-left px-6 py-3 font-semibold">Amount</th>
                      <th class="text-right px-6 py-3 font-semibold print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="e in filteredExpenses" :key="e.expense_id">
                      <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ formatDate(e.expense_date) }}</td>
                      <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100">{{ e.description }}</td>
                      <td class="px-6 py-3.5">
                        <span
                          :class="['Ingredients', 'Supplies'].includes(e.category) ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'"
                          class="px-2.5 py-1 rounded-full text-xs font-semibold"
                          :title="['Ingredients', 'Supplies'].includes(e.category) ? 'Counted in Gross Profit (direct cost)' : 'Operating cost — not counted in Gross Profit'"
                        >{{ e.category }}</span>
                      </td>
                      <td class="px-6 py-3.5 text-red-500 dark:text-red-400 font-medium">₱{{ formatPrice(e.amount) }}</td>
                      <td class="px-6 py-3.5 text-right print:hidden">
                        <button @click="openEditExpenseForm(e)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" title="Edit expense">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button @click="confirmDeleteExpense(e)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete expense">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>

        </template>

      </div>
    </main>

    <!-- ============ NEW EXPENSE MODAL ============ -->
    <div v-if="showExpenseForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{{ editingExpenseId ? 'Edit Expense' : 'New Expense' }}</h3>

        <div v-if="expenseFormError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ expenseFormError }}
        </div>

        <form @submit.prevent="handleSaveExpense" class="space-y-5">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Description</label>
            <input type="text" v-model="newExpense.description" placeholder="e.g. Bagoong at toyo, market" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="relative">
              <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Category</label>
              <select v-model="newExpense.category" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
                <option value="Ingredients">Ingredients</option>
                <option value="Supplies">Supplies</option>
                <option value="Salaries">Salaries</option>
                <option value="Transportation">Transportation</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="relative">
              <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Amount (₱)</label>
              <input type="number" min="0" step="0.01" v-model.number="newExpense.amount" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
            </div>
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Date</label>
            <input type="date" v-model="newExpense.expense_date" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeExpenseForm" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isSavingExpense" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSavingExpense ? 'Saving...' : (editingExpenseId ? 'Update Expense' : 'Save Expense') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE EXPENSE CONFIRM MODAL ============ -->
    <div v-if="expenseToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Expense?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This will permanently remove <span class="font-semibold text-gray-700 dark:text-gray-200">"{{ expenseToDelete.description }}"</span> (₱{{ formatPrice(expenseToDelete.amount) }}).
        </p>
        <div class="flex gap-3">
          <button @click="expenseToDelete = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button @click="handleDeleteExpense" :disabled="isDeletingExpense" class="flex-1 bg-red-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeletingExpense ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useRouter } from 'vue-router'
import { getMyAvatarUrl } from '../services/profileService'
import { getAllBookings } from '../services/bookingService'
import { getAllInventory } from '../services/inventoryService'
import { getAllPackages } from '../services/packageService'
import { getAllPayments } from '../services/paymentService'
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')
const userAvatarUrl = ref('')

const isLoading = ref(false)
const pageError = ref('')

const bookings = ref([])
const inventory = ref([])
const packages = ref([])
const payments = ref([])
const expenses = ref([])

const tabs = ['Overview', 'Bookings Report', 'Inventory Report', 'Expenses']
const activeTab = ref('Overview')

const dateFrom = ref('')
const dateTo = ref('')

const generatedOn = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

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
  // Per the manuscript's Use Case Diagram, Staff only has access to
  // Login/Authentication and Manage Payments -- Reports is Owner/Manager-only.
  if (user.role === 'Staff') {
    router.push('/admin/dashboard')
    return
  }
  userName.value = user.full_name
  userRole.value = user.role
  userInitial.value = user.full_name.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || '' // show cached picture immediately, no flicker
  getMyAvatarUrl(user.user_id).then((url) => {
    userAvatarUrl.value = url || ''
    const cached = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...cached, avatar_url: url || '' }))
  })

  fetchReportData()
})

async function fetchReportData() {
  isLoading.value = true
  pageError.value = ''
  try {
    const [b, i, p, pay, exp] = await Promise.all([getAllBookings(), getAllInventory(), getAllPackages(), getAllPayments(), getAllExpenses()])
    bookings.value = b
    inventory.value = i
    packages.value = p
    payments.value = pay
    expenses.value = exp
  } catch (error) {
    pageError.value = 'Failed to load report data. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// ---------- Filtering ----------
const filteredBookings = computed(() => {
  return bookings.value.filter((b) => {
    if (dateFrom.value && b.event_date < dateFrom.value) return false
    if (dateTo.value && b.event_date > dateTo.value) return false
    return true
  })
})

function countByStatus(status) {
  return filteredBookings.value.filter((b) => b.booking_status === status).length
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Confirmed': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'Completed': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'Cancelled': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  }
}

function paymentStatusBadgeClass(status) {
  switch (status) {
    case 'Paid': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'Partial': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'Unpaid': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  }
}

// ---------- Real revenue (from actual tbl_payments records) ----------
// A booking only has a payment record once Staff/Admin creates one in
// the Payments module, so we look it up per booking rather than assume
// every booking has one.
const paymentByBookingId = computed(() => {
  const map = new Map()
  payments.value.forEach((p) => map.set(p.booking_id, p))
  return map
})

// Payments are filtered by their linked booking's event date, so the
// date range picker behaves the same way across every tab.
const filteredPayments = computed(() => {
  return payments.value.filter((p) => {
    const eventDate = p.tbl_bookings?.event_date
    if (dateFrom.value && (!eventDate || eventDate < dateFrom.value)) return false
    if (dateTo.value && (!eventDate || eventDate > dateTo.value)) return false
    return true
  })
})

// Total Billed: what clients are supposed to pay in total for this range.
const totalBilled = computed(() =>
  filteredPayments.value.reduce((sum, p) => sum + Number(p.total_amount || 0), 0)
)

// Revenue Collected: actual money received (real amount_paid, not an estimate).
const revenueCollected = computed(() =>
  filteredPayments.value.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
)

// Outstanding Balance: money still owed by clients in this range.
const outstandingBalance = computed(() =>
  filteredPayments.value.reduce((sum, p) => sum + Number(p.balance || 0), 0)
)

// ---------- Expenses & Gross Profit ----------
// Expenses are filtered by their own expense_date, same date-range picker
// used everywhere else on this page.
const filteredExpenses = computed(() => {
  return expenses.value.filter((e) => {
    if (dateFrom.value && e.expense_date < dateFrom.value) return false
    if (dateTo.value && e.expense_date > dateTo.value) return false
    return true
  })
})

const totalExpenses = computed(() =>
  filteredExpenses.value.reduce((sum, e) => sum + Number(e.amount || 0), 0)
)

// Cost of Goods Sold (COGS): only the expense categories that are direct
// costs of producing the catering service (Ingredients, Supplies).
// Salaries, Transportation, Utilities, and Other are operating costs and
// are excluded from Gross Profit, per standard accounting definition.
const COGS_CATEGORIES = ['Ingredients', 'Supplies']

const costOfGoodsSold = computed(() =>
  filteredExpenses.value
    .filter((e) => COGS_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)
)

// Gross Profit = Revenue Collected − direct costs of the catering service
// (COGS) only. This is real data (from Payments and Expenses), not an
// estimate.
const grossProfit = computed(() => revenueCollected.value - costOfGoodsSold.value)

// ---------- Fallback estimate (only used for bookings with no payment
// record yet, so the Bookings Report table still shows a useful number
// instead of a blank) ----------
function findPackagePrice(packageName) {
  const match = packages.value.find((p) => p.package_name === packageName)
  return match ? Number(match.price_per_head) || 0 : 0
}

function estimateBookingAmount(booking) {
  return findPackagePrice(booking.package_name) * (Number(booking.guest_count) || 0)
}

function formatPrice(value) {
  const num = Number(value) || 0
  return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ---------- Charts (plain CSS, no chart library needed) ----------
const STATUS_LIST = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
const STATUS_BAR_CLASS = {
  Pending: 'bg-amber-400',
  Confirmed: 'bg-emerald-500',
  Completed: 'bg-blue-500',
  Cancelled: 'bg-red-400'
}

const statusBreakdown = computed(() => {
  const total = filteredBookings.value.length || 1
  return STATUS_LIST.map((status) => {
    const count = countByStatus(status)
    return {
      status,
      count,
      pct: Math.round((count / total) * 100),
      barClass: STATUS_BAR_CLASS[status]
    }
  })
})

const monthlyTrend = computed(() => {
  const counts = {}
  filteredBookings.value.forEach((b) => {
    if (!b.event_date) return
    const d = new Date(b.event_date)
    const key = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
    counts[key] = (counts[key] || 0) + 1
  })
  const entries = Object.entries(counts)
  const max = Math.max(...entries.map(([, c]) => c), 1)
  return entries.map(([label, count]) => ({
    label,
    count,
    pct: Math.max(Math.round((count / max) * 100), 6)
  }))
})

// ---------- Inventory ----------
function isLowStock(item) {
  return Number(item.quantity) <= Number(item.low_stock_threshold)
}

const lowStockItems = computed(() => inventory.value.filter(isLowStock))

const sortedInventory = computed(() => {
  return [...inventory.value].sort((a, b) => {
    const aLow = isLowStock(a) ? 0 : 1
    const bLow = isLowStock(b) ? 0 : 1
    return aLow - bLow
  })
})

// ---------- Expense management ----------
const emptyExpenseForm = () => ({
  description: '',
  category: 'Ingredients',
  amount: null,
  expense_date: new Date().toISOString().split('T')[0]
})
const newExpense = ref(emptyExpenseForm())
const showExpenseForm = ref(false)
const isSavingExpense = ref(false)
const expenseFormError = ref('')
const editingExpenseId = ref(null)

const expenseToDelete = ref(null)
const isDeletingExpense = ref(false)

function openExpenseForm() {
  editingExpenseId.value = null
  newExpense.value = emptyExpenseForm()
  expenseFormError.value = ''
  showExpenseForm.value = true
}

function openEditExpenseForm(expense) {
  editingExpenseId.value = expense.expense_id
  newExpense.value = {
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    expense_date: expense.expense_date
  }
  expenseFormError.value = ''
  showExpenseForm.value = true
}

function closeExpenseForm() {
  showExpenseForm.value = false
}

async function handleSaveExpense() {
  expenseFormError.value = ''
  isSavingExpense.value = true
  try {
    if (editingExpenseId.value) {
      await updateExpense(editingExpenseId.value, newExpense.value)
    } else {
      await createExpense(newExpense.value)
    }
    showExpenseForm.value = false
    editingExpenseId.value = null
    await fetchReportData()
  } catch (error) {
    expenseFormError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSavingExpense.value = false
  }
}

function confirmDeleteExpense(expense) {
  expenseToDelete.value = expense
}

async function handleDeleteExpense() {
  if (!expenseToDelete.value) return
  isDeletingExpense.value = true
  try {
    await deleteExpense(expenseToDelete.value.expense_id)
    expenses.value = expenses.value.filter((e) => e.expense_id !== expenseToDelete.value.expense_id)
    expenseToDelete.value = null
  } catch (error) {
    pageError.value = error.message || 'Failed to delete expense.'
    console.error(error)
  } finally {
    isDeletingExpense.value = false
  }
}

// ---------- Export: real generated PDF (not browser print) ----------
function exportPDF() {
  const doc = new jsPDF()
  const rangeLabel = (dateFrom.value || dateTo.value)
    ? `${dateFrom.value || 'Start'} to ${dateTo.value || 'Present'}`
    : 'All time'

  // Letterhead
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('Caterlytics', 14, 18)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text('Catering-Service Management & Inventory System', 14, 24)
  doc.text(`${activeTab.value} Report  •  Range: ${rangeLabel}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 14, 35)

  doc.setDrawColor(220)
  doc.line(14, 39, 196, 39)

  let startY = 46

  if (activeTab.value === 'Overview') {
    autoTable(doc, {
      startY,
      head: [['Metric', 'Value']],
      body: [
        ['Total Billed', `PHP ${formatPrice(totalBilled.value)}`],
        ['Revenue Collected', `PHP ${formatPrice(revenueCollected.value)}`],
        ['Total Expenses', `PHP ${formatPrice(totalExpenses.value)}`],
        ['Gross Profit', `PHP ${formatPrice(grossProfit.value)}`],
        ['Outstanding Balance', `PHP ${formatPrice(outstandingBalance.value)}`],
        ['Low Stock Items', `${lowStockItems.value.length} of ${inventory.value.length} tracked item(s)`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
    })
  } else if (activeTab.value === 'Bookings Report') {
    autoTable(doc, {
      startY,
      head: [['Client', 'Event Date', 'Location', 'Guests', 'Package', 'Total Billed', 'Paid', 'Balance', 'Status']],
      body: filteredBookings.value.map((b) => {
        const pay = paymentByBookingId.value.get(b.booking_id)
        return [
          b.client_name,
          formatDate(b.event_date),
          b.event_location,
          String(b.guest_count),
          b.package_name || '—',
          pay ? `PHP ${formatPrice(pay.total_amount)}` : `~PHP ${formatPrice(estimateBookingAmount(b))}`,
          pay ? `PHP ${formatPrice(pay.amount_paid)}` : '—',
          pay ? `PHP ${formatPrice(pay.balance)}` : '—',
          pay ? pay.payment_status : 'No record',
        ]
      }),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8 },
    })
  } else if (activeTab.value === 'Inventory Report') {
    autoTable(doc, {
      startY,
      head: [['Item', 'Quantity', 'Low Stock Threshold', 'Status']],
      body: inventory.value.map((i) => [
        i.item_name,
        String(i.quantity),
        String(i.low_stock_threshold),
        isLowStock(i) ? 'Low Stock' : 'Sufficient',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
    })
  } else if (activeTab.value === 'Expenses') {
    autoTable(doc, {
      startY,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: filteredExpenses.value.map((e) => [
        formatDate(e.expense_date),
        e.description,
        e.category,
        `PHP ${formatPrice(e.amount)}`,
      ]),
      foot: [['', '', 'Total', `PHP ${formatPrice(totalExpenses.value)}`]],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    })
  }

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' })
  }

  const tabSlug = activeTab.value.toLowerCase().replace(/\s+/g, '-')
  const dateSlug = new Date().toISOString().split('T')[0]
  doc.save(`caterlytics-${tabSlug}-${dateSlug}.pdf`)
}

// ---------- Nav / auth ----------
function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}

const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Payments', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]

const staffAllowedSections = ['Dashboard', 'Payments']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)
</script>

<style scoped>
@media print {
  :deep(.print\:hidden) { display: none !important; }
}
</style>