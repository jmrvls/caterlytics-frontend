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
          @click.prevent="goTo(item)"
          :class="item.name === 'Payments' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments</h1>
          </div>
          <div class="flex items-center gap-3">
            <div class="hidden lg:block">
              <NotificationBell />
            </div>
            <button @click="openCreateModal" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 transition">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Payment
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 mt-4">
          <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
            <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Total Records</h3>
            <p class="text-2xl font-black text-gray-900 dark:text-gray-100">{{ payments.length }}</p>
          </div>
          <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
            <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Fully Paid</h3>
            <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400">{{ countByStatus('Paid') }}</p>
          </div>
          <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
            <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Partial</h3>
            <p class="text-2xl font-black text-amber-500 dark:text-amber-400">{{ countByStatus('Partial') }}</p>
          </div>
          <div class="relative bg-white dark:bg-gray-800 px-5 pt-6 pb-5 rounded-none border-2 border-gray-200 dark:border-gray-600">
            <h3 class="absolute -top-3 left-4 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Unpaid</h3>
            <p class="text-2xl font-black text-red-500 dark:text-red-400">{{ countByStatus('Unpaid') }}</p>
          </div>
        </div>

        <!-- Search -->
        <div class="bg-white dark:bg-gray-800 p-4 rounded-none border border-gray-100 dark:border-gray-700 mb-4">
          <div class="relative">
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
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ pageError }}
        </div>

        <!-- Payments — mobile card list (phone-friendly, replaces the table below md) -->
        <div class="md:hidden space-y-3">
          <div v-if="isLoading" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Loading payments...</div>
          <div v-else-if="filteredPayments.length === 0" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            {{ payments.length === 0 ? 'No payment records yet. Tap "New Payment" to add one.' : 'No records match your search.' }}
          </div>
          <div
            v-for="p in filteredPayments" :key="p.payment_id"
            class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-none p-4"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ p.tbl_bookings?.client_name || '—' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ formatDate(p.tbl_bookings?.event_date) }}</p>
              </div>
              <span :class="statusStyle(p.payment_status)" class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold">
                {{ p.payment_status }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2 mb-3 text-center">
              <div class="bg-gray-50 dark:bg-gray-900 py-2 rounded-none">
                <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total</p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-100">₱{{ Number(p.total_amount).toLocaleString() }}</p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-900 py-2 rounded-none">
                <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Paid</p>
                <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">₱{{ Number(p.amount_paid).toLocaleString() }}</p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-900 py-2 rounded-none">
                <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Balance</p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-100">₱{{ Number(p.balance).toLocaleString() }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="p.payment_status !== 'Paid'"
                @click="openRecordModal(p)"
                class="flex-1 py-2.5 rounded-none text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 active:bg-emerald-100 dark:active:bg-emerald-900/40"
              >
                Record Payment
              </button>
              <button
                v-if="Number(p.amount_paid) > 0"
                @click="generateReceipt(p)"
                class="w-11 h-11 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 active:bg-emerald-50 dark:active:bg-emerald-900/30 active:text-emerald-600"
                title="Generate Receipt"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                @click="confirmDelete(p)"
                class="w-11 h-11 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 active:bg-red-50 dark:active:bg-red-900/30 active:text-red-600"
                title="Delete"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="hasMorePayments && !isLoading" class="flex justify-center pt-1">
            <button @click="loadMorePayments" :disabled="isLoadingMore" class="px-5 py-2.5 rounded-none border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700 disabled:opacity-50">
              {{ isLoadingMore ? 'Loading...' : `Load More (${payments.length} of ${totalPayments})` }}
            </button>
          </div>
        </div>

        <!-- Payments Table — desktop / tablet -->
        <div class="hidden md:block bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                <tr>
                  <th class="text-left px-6 py-3 font-semibold">Client</th>
                  <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                  <th class="text-left px-6 py-3 font-semibold">Total</th>
                  <th class="text-left px-6 py-3 font-semibold">Paid</th>
                  <th class="text-left px-6 py-3 font-semibold">Balance</th>
                  <th class="text-left px-6 py-3 font-semibold">Status</th>
                  <th class="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="isLoading">
                  <td colspan="7" class="text-center py-10 text-gray-400 dark:text-gray-500">Loading payments...</td>
                </tr>
                <tr v-else-if="filteredPayments.length === 0">
                  <td colspan="7" class="text-center py-10 text-gray-400 dark:text-gray-500">
                    {{ payments.length === 0 ? 'No payment records yet. Click "New Payment" to add one.' : 'No records match your search.' }}
                  </td>
                </tr>
                <tr v-for="p in filteredPayments" :key="p.payment_id" class="hover:bg-gray-50/60 dark:hover:bg-gray-700/60">
                  <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100">{{ p.tbl_bookings?.client_name || '—' }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ formatDate(p.tbl_bookings?.event_date) }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">₱{{ Number(p.total_amount).toLocaleString() }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">₱{{ Number(p.amount_paid).toLocaleString() }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">₱{{ Number(p.balance).toLocaleString() }}</td>
                  <td class="px-6 py-3.5">
                    <span :class="statusStyle(p.payment_status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                      {{ p.payment_status }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        v-if="p.payment_status !== 'Paid'"
                        @click="openRecordModal(p)"
                        class="px-3 py-1.5 rounded-none text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                      >
                        Record Payment
                      </button>
                      <button
                        v-if="Number(p.amount_paid) > 0"
                        @click="generateReceipt(p)"
                        class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        title="Generate Receipt"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button @click="confirmDelete(p)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete">
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
          <div v-if="hasMorePayments && !isLoading" class="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="loadMorePayments" :disabled="isLoadingMore" class="px-5 py-2 rounded-none border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
              {{ isLoadingMore ? 'Loading...' : `Load More (${payments.length} of ${totalPayments})` }}
            </button>
          </div>
        </div>

      </div>
    </main>

    <!-- ============ NEW PAYMENT MODAL ============ -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">New Payment Record</h3>

        <div v-if="modalError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleCreatePayment" class="space-y-5">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Booking</label>
            <select v-model.number="createForm.booking_id" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
              <option value="" disabled>Select a booking</option>
              <option v-for="b in bookingsWithoutPayment" :key="b.booking_id" :value="b.booking_id">
                {{ b.client_name }} — {{ formatDate(b.event_date) }}
              </option>
            </select>
          </div>
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Total Amount</label>
            <input type="number" min="0" step="0.01" v-model.number="createForm.total_amount" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Initial Down Payment (optional)</label>
            <input type="number" min="0" step="0.01" v-model.number="createForm.amount_paid" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="showCreateModal = false" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : 'Create Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ RECORD PAYMENT MODAL ============ -->
    <div v-if="recordingPayment" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Record Payment</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Remaining balance: <span class="font-semibold text-gray-700 dark:text-gray-200">₱{{ Number(recordingPayment.balance).toLocaleString() }}</span>
        </p>

        <div v-if="modalError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleRecordPayment" class="space-y-5">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Amount Received</label>
            <input type="number" min="0" step="0.01" :max="recordingPayment.balance" v-model.number="recordAmount" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="recordingPayment = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : 'Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="paymentToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Payment Record?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This will permanently remove the payment record for
          <span class="font-semibold text-gray-700 dark:text-gray-200">{{ paymentToDelete.tbl_bookings?.client_name }}</span>.
        </p>
        <div class="flex gap-3">
          <button @click="paymentToDelete = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button @click="handleDelete" :disabled="isDeleting" class="flex-1 bg-red-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
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
import { getPaymentsPage, getPaymentStatusCounts, getAllPaymentBookingIds, createPayment, recordPayment, deletePayment } from '../services/paymentService'
import { getAllBookings } from '../services/bookingService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')
const userAvatarUrl = ref('')

const payments = ref([])
const bookings = ref([])
const isLoading = ref(false)
const pageError = ref('')
const searchQuery = ref('')

const PAGE_SIZE = 50
const totalPayments = ref(0)
const isLoadingMore = ref(false)
const statusCounts = ref({})
const paidBookingIds = ref(new Set())
const hasMorePayments = computed(() => payments.value.length < totalPayments.value)

const showCreateModal = ref(false)
const isSaving = ref(false)
const modalError = ref('')
const createForm = ref({ booking_id: '', total_amount: 0, amount_paid: 0 })

const recordingPayment = ref(null)
const recordAmount = ref(0)

const paymentToDelete = ref(null)
const isDeleting = ref(false)

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
  userAvatarUrl.value = user.avatar_url || '' // show cached picture immediately, no flicker
  getMyAvatarUrl(user.user_id).then((url) => {
    userAvatarUrl.value = url || ''
    const cached = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...cached, avatar_url: url || '' }))
  })

  fetchData()
})

async function fetchData() {
  isLoading.value = true
  pageError.value = ''
  try {
    const [page, counts, bookedIds, bookingsData] = await Promise.all([
      getPaymentsPage({ offset: 0, limit: PAGE_SIZE }),
      getPaymentStatusCounts(),
      getAllPaymentBookingIds(),
      getAllBookings()
    ])
    payments.value = page.rows
    totalPayments.value = page.total
    statusCounts.value = counts
    paidBookingIds.value = new Set(bookedIds)
    bookings.value = bookingsData
  } catch (error) {
    pageError.value = 'Failed to load payments. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function loadMorePayments() {
  if (isLoadingMore.value || !hasMorePayments.value) return
  isLoadingMore.value = true
  try {
    const page = await getPaymentsPage({ offset: payments.value.length, limit: PAGE_SIZE })
    payments.value = [...payments.value, ...page.rows]
    totalPayments.value = page.total
  } catch (error) {
    pageError.value = 'Failed to load more payments.'
    console.error(error)
  } finally {
    isLoadingMore.value = false
  }
}

const filteredPayments = computed(() =>
  payments.value.filter((p) =>
    (p.tbl_bookings?.client_name || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const bookingsWithoutPayment = computed(() => {
  return bookings.value.filter((b) => !paidBookingIds.value.has(b.booking_id))
})

function countByStatus(status) {
  return statusCounts.value[status] || 0
}

function statusStyle(status) {
  if (status === 'Paid') return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
  if (status === 'Partial') return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function openCreateModal() {
  createForm.value = { booking_id: '', total_amount: 0, amount_paid: 0 }
  modalError.value = ''
  showCreateModal.value = true
}

async function handleCreatePayment() {
  modalError.value = ''
  isSaving.value = true
  try {
    await createPayment(createForm.value)
    showCreateModal.value = false
    fetchData()
  } catch (error) {
    modalError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function openRecordModal(payment) {
  recordingPayment.value = payment
  recordAmount.value = 0
  modalError.value = ''
}

async function handleRecordPayment() {
  modalError.value = ''
  isSaving.value = true
  try {
    await recordPayment(recordingPayment.value.payment_id, recordAmount.value)
    recordingPayment.value = null
    fetchData()
  } catch (error) {
    modalError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function confirmDelete(payment) {
  paymentToDelete.value = payment
}

async function handleDelete() {
  if (!paymentToDelete.value) return
  isDeleting.value = true
  try {
    await deletePayment(paymentToDelete.value.payment_id)
    const deletedStatus = paymentToDelete.value.payment_status
    const deletedBookingId = paymentToDelete.value.booking_id
    payments.value = payments.value.filter((p) => p.payment_id !== paymentToDelete.value.payment_id)
    totalPayments.value = Math.max(0, totalPayments.value - 1)
    statusCounts.value = {
      ...statusCounts.value,
      [deletedStatus]: Math.max(0, (statusCounts.value[deletedStatus] || 0) - 1)
    }
    const updatedPaidIds = new Set(paidBookingIds.value)
    updatedPaidIds.delete(deletedBookingId)
    paidBookingIds.value = updatedPaidIds
    paymentToDelete.value = null
  } catch (error) {
    pageError.value = 'Failed to delete payment record.'
    console.error(error)
  } finally {
    isDeleting.value = false
  }
}

// ---------- Generate Receipt (official receipt PDF, per payment record) ----------
// No dedicated "receipts" table exists in the schema (see ERD, Figure 5), so
// this is generated on-the-fly from the payment + booking data already on
// hand. Receipt No. is derived from the stable payment_id so re-printing the
// same payment always yields the same number.
function generateReceipt(payment) {
  const booking = payment.tbl_bookings || {}
  const doc = new jsPDF()
  const receiptNo = `OR-${String(payment.payment_id).padStart(6, '0')}`
  const issuedOn = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

  // Letterhead
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('Caterlytics', 14, 18)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text('Catering-Service Management & Inventory System', 14, 24)

  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('OFFICIAL RECEIPT', 196, 18, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text(receiptNo, 196, 24, { align: 'right' })
  doc.text(`Issued: ${issuedOn}`, 196, 29, { align: 'right' })

  doc.setDrawColor(220)
  doc.line(14, 34, 196, 34)

  // Client / event details
  autoTable(doc, {
    startY: 40,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    body: [
      ['Client Name', booking.client_name || '—'],
      ['Event Date', formatDate(booking.event_date)],
      ['Event Location', booking.event_location || '—'],
      ['Guest Count', booking.guest_count != null ? String(booking.guest_count) : '—'],
      ['Package', booking.package_name || '—'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 45 } },
  })

  // Amount breakdown
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Description', 'Amount']],
    body: [
      ['Total Package Cost', `PHP ${Number(payment.total_amount).toLocaleString()}`],
      ['Amount Paid to Date', `PHP ${Number(payment.amount_paid).toLocaleString()}`],
      ['Remaining Balance', `PHP ${Number(payment.balance).toLocaleString()}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
    foot: [['Payment Status', payment.payment_status]],
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
  })

  const finalY = doc.lastAutoTable.finalY + 20
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text('This receipt was generated by the Caterlytics system and reflects the payment record on file.', 14, finalY)
  doc.text(`Issued by: ${userName.value} (${userRole.value})`, 14, finalY + 5)

  doc.save(`caterlytics-receipt-${receiptNo}.pdf`)
}

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
  { name: 'Staff Management', path: '/admin/dashboard?section=Staff Management', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]

// Staff (per the manuscript's Use Case Diagram) only has access to
// Login/Authentication and Manage Payments -- so their sidebar only
// shows Dashboard (general landing view) and Payments.
const staffAllowedSections = ['Dashboard', 'Payments']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)
</script>

<style scoped>
</style>