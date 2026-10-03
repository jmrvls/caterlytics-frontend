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
          :class="item.name === 'Waste Tracking' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Waste Tracking</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Monitor food wastage and optimize inventory usage.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            <select v-model.number="rangeDays" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option v-for="r in RANGE_OPTIONS" :key="r.days" :value="r.days">{{ r.label }}</option>
            </select>
            <button @click="exportCSV" :disabled="!summary.entries" class="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Export CSV
            </button>
            <div class="hidden lg:block"><NotificationBell /></div>
            <button @click="openLogModal()" :disabled="setupMissing" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Log Waste
            </button>
          </div>
        </div>

        <!-- Not set up yet -->
        <div v-if="setupMissing" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
          Waste tracking needs a one-time database setup. Open the Supabase SQL Editor and run <span class="font-mono font-semibold">waste_tracking.sql</span>, then refresh this page.
        </div>
        <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">{{ pageError }}</div>
        <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">{{ successMessage }}</div>

        <div v-if="isLoading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading waste data...</div>

        <template v-else-if="!setupMissing">
          <!-- Summary cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total waste cost</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 break-words">{{ formatPeso(summary.totalCost) }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">vs previous period</p>
              <p v-if="summary.changePct === null" class="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">N/A</p>
              <p v-else :class="summary.changePct > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'" class="text-xl sm:text-2xl font-bold">
                {{ summary.changePct > 0 ? '+' : '' }}{{ summary.changePct.toFixed(0) }}%
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Previously {{ formatPeso(summary.prevCost) }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Waste entries</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ summary.entries }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Top cause</p>
              <p class="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 break-words">{{ summary.byReason[0]?.reason || '—' }}</p>
            </div>
          </div>

          <!-- Insights -->
          <div v-if="insights.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5 mb-6">
            <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-3">How to reduce waste</h2>
            <ul class="space-y-2">
              <li v-for="(tip, idx) in insights" :key="idx" class="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span :class="tip.type === 'warn' ? 'bg-red-500' : tip.type === 'good' ? 'bg-emerald-500' : 'bg-amber-500'" class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"></span>
                <span>{{ tip.text }}</span>
              </li>
            </ul>
          </div>

          <!-- Reorder suggestions (waste + real usage) -->
          <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div>
                <h2 class="font-semibold text-gray-800 dark:text-gray-100">Reorder suggestions</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Based on how fast each item is used and how much of it gets wasted ({{ reorderPlan.observedDays }} {{ reorderPlan.observedDays === 1 ? 'day' : 'days' }} of data).</p>
              </div>
              <div class="flex items-center gap-2">
                <select v-model.number="coverDays" class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option v-for="c in COVER_OPTIONS" :key="c.days" :value="c.days">{{ c.label }}</option>
                </select>
                <button @click="exportReorderCSV" :disabled="!reorderPlan.rows.length" class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap">Export list</button>
              </div>
            </div>

            <div v-if="usageMissing" class="text-xs text-amber-700 dark:text-amber-300 mb-3">Couldn't load stock usage, so quantities fall back to your low-stock levels.</div>
            <div v-else-if="!reorderPlan.hasUsage" class="text-xs text-gray-500 dark:text-gray-400 mb-3">No bookings have used stock in this period yet, so quantities are based on your low-stock levels.</div>

            <div v-if="!reorderPlan.rows.length" class="text-sm text-gray-400 dark:text-gray-500 py-4">Nothing to reorder right now, and no item stands out for waste.</div>
            <template v-else>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th class="px-3 py-2 font-medium">Item</th>
                      <th class="px-3 py-2 font-medium">Suggestion</th>
                      <th class="px-3 py-2 font-medium whitespace-nowrap">On hand</th>
                      <th class="px-3 py-2 font-medium whitespace-nowrap">Used / Wasted</th>
                      <th class="px-3 py-2 font-medium whitespace-nowrap">Days left</th>
                      <th class="px-3 py-2 font-medium text-right whitespace-nowrap">Order qty</th>
                      <th class="px-3 py-2 font-medium text-right whitespace-nowrap">Est. cost</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="r in reorderPlan.rows" :key="r.item_id" class="text-gray-700 dark:text-gray-300 align-top">
                      <td class="px-3 py-2.5 font-medium text-gray-900 dark:text-gray-100">{{ r.name }}</td>
                      <td class="px-3 py-2.5 min-w-[220px]">
                        <span :class="STATUS_UI[r.status].cls" class="inline-block px-2 py-0.5 text-xs font-semibold mb-1">{{ STATUS_UI[r.status].label }}</span>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ r.note }}</p>
                      </td>
                      <td class="px-3 py-2.5 whitespace-nowrap">{{ formatQty(r.onHand, r.unit) }}</td>
                      <td class="px-3 py-2.5 whitespace-nowrap">{{ formatQty(r.used, r.unit) }} / {{ formatQty(r.wasted, r.unit) }} <span class="text-xs text-gray-400">({{ Math.round(r.wastePct) }}%)</span></td>
                      <td class="px-3 py-2.5 whitespace-nowrap">{{ r.daysLeft === null ? '—' : Math.round(r.daysLeft) }}</td>
                      <td class="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{{ r.status === 'reorder' ? formatQty(r.qty, r.unit) : '—' }}</td>
                      <td class="px-3 py-2.5 text-right whitespace-nowrap">{{ r.status === 'reorder' ? formatPeso(r.cost) : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="reorderPlan.reorderCount" class="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-3 text-right">Estimated reorder cost: {{ formatPeso(reorderPlan.totalCost) }}</p>
            </template>
          </div>

          <div v-if="!summary.entries" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12 text-gray-400 dark:text-gray-500 text-sm mb-6">
            No waste logged in this period. Tap "Log Waste" whenever food is thrown away so the numbers stay accurate.
          </div>

          <template v-else>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <!-- By reason -->
              <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Waste by reason</h2>
                <div class="space-y-3">
                  <div v-for="r in summary.byReason" :key="r.reason">
                    <div class="flex justify-between gap-3 text-sm mb-1">
                      <span class="text-gray-700 dark:text-gray-300 truncate">{{ r.reason }} <span class="text-gray-400 dark:text-gray-500">({{ r.entries }})</span></span>
                      <span class="font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{{ formatPeso(r.cost) }}</span>
                    </div>
                    <div class="h-2 bg-gray-100 dark:bg-gray-700">
                      <div class="h-2 bg-emerald-600" :style="{ width: Math.max(r.pct, 2) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top wasted items -->
              <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Most wasted items</h2>
                <div class="space-y-3">
                  <div v-for="(it, idx) in summary.topItems.slice(0, 5)" :key="it.key" class="flex items-center gap-3">
                    <span class="w-6 h-6 flex items-center justify-center text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">{{ idx + 1 }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ it.name }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatQty(it.qty, it.unit) }} · {{ it.entries }} {{ it.entries === 1 ? 'entry' : 'entries' }}</p>
                    </div>
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{{ formatPeso(it.cost) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trend -->
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5 mb-6">
              <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">Waste cost over time</h2>
              <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">{{ rangeDays > 31 ? 'Per week' : 'Per day' }}</p>
              <div class="flex items-end gap-1 h-36 overflow-x-auto">
                <div v-for="b in summary.buckets" :key="b.from" class="flex-1 min-w-[6px] h-full flex flex-col justify-end group relative">
                  <div class="bg-emerald-600 hover:bg-emerald-700 transition-colors" :style="{ height: b.cost > 0 ? Math.max((b.cost / maxBucket) * 100, 3) + '%' : '0%' }"></div>
                  <div class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                    {{ b.label }}: {{ formatPeso(b.cost) }}
                  </div>
                </div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                <span>{{ summary.buckets[0]?.label }}</span>
                <span>{{ summary.buckets[summary.buckets.length - 1]?.label }}</span>
              </div>
            </div>

            <!-- Log list -->
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div class="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                <h2 class="font-semibold text-gray-800 dark:text-gray-100 sm:flex-1 sm:self-center">Waste log</h2>
                <input v-model="searchQuery" type="text" placeholder="Search item or note..." class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
                <select v-model="reasonFilter" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">All reasons</option>
                  <option v-for="r in WASTE_REASONS" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>

              <!-- Mobile cards -->
              <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                <div v-if="!filteredLogs.length" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No entries match.</div>
                <div v-for="l in filteredLogs" :key="l.waste_id" class="p-4">
                  <div class="flex justify-between gap-3">
                    <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ l.item_name }}</p>
                    <p class="font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">{{ formatPeso(costOf(l)) }}</p>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{{ formatQty(l.quantity, l.unit) }} · {{ l.reason }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatShortDate(l.waste_date) }}<span v-if="l.note"> · {{ l.note }}</span></p>
                </div>
              </div>

              <!-- Desktop table -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th class="px-4 py-3 font-medium">Date</th>
                      <th class="px-4 py-3 font-medium">Item</th>
                      <th class="px-4 py-3 font-medium">Quantity</th>
                      <th class="px-4 py-3 font-medium">Reason</th>
                      <th class="px-4 py-3 font-medium text-right">Cost lost</th>
                      <th class="px-4 py-3 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="!filteredLogs.length"><td colspan="6" class="text-center py-8 text-gray-400 dark:text-gray-500">No entries match.</td></tr>
                    <tr v-for="l in filteredLogs" :key="l.waste_id" class="text-gray-700 dark:text-gray-300">
                      <td class="px-4 py-3 whitespace-nowrap">{{ formatShortDate(l.waste_date) }}</td>
                      <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{{ l.item_name }}</td>
                      <td class="px-4 py-3 whitespace-nowrap">{{ formatQty(l.quantity, l.unit) }}</td>
                      <td class="px-4 py-3">{{ l.reason }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">{{ formatPeso(costOf(l)) }}</td>
                      <td class="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="l.note || ''">{{ l.note || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </template>
      </div>
    </main>

    <!-- LOG WASTE MODAL -->
    <div v-if="showLogModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="closeLogModal"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Log Waste</h3>

        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item</label>
        <select v-model="form.item_id" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="" disabled>Choose an inventory item</option>
          <option v-for="i in items" :key="i.item_id" :value="i.item_id">{{ i.item_name }} ({{ formatQty(i.quantity, i.unit || 'kg') }} on hand)</option>
        </select>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity wasted <span v-if="selectedItem" class="text-gray-400">({{ selectedItem.unit || 'kg' }})</span></label>
        <input v-model="form.quantity" type="number" min="1" step="1" inputmode="numeric" placeholder="0" class="w-full mb-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <p v-if="estimatedCost !== null" class="text-xs text-gray-500 dark:text-gray-400 mb-3">Estimated cost lost: {{ formatPeso(estimatedCost) }}</p>
        <div v-else class="mb-3"></div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
        <select v-model="form.reason" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="" disabled>Choose a reason</option>
          <option v-for="r in WASTE_REASONS" :key="r" :value="r">{{ r }}</option>
        </select>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
        <input v-model="form.waste_date" type="date" :max="today" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note <span class="text-gray-400">(optional)</span></label>
        <textarea v-model="form.note" rows="2" maxlength="300" placeholder="e.g. Cooler broke down overnight" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>

        <label class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 mb-5 cursor-pointer">
          <input v-model="form.deduct" type="checkbox" class="mt-0.5 accent-emerald-600" />
          <span>Deduct from inventory<span class="block text-xs text-gray-400 dark:text-gray-500">Untick only if this stock was already removed from the system.</span></span>
        </label>

        <div class="flex gap-3">
          <button @click="closeLogModal" :disabled="isSaving" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button @click="submitLog" :disabled="isSaving" class="flex-1 py-2.5 bg-emerald-600 text-white rounded-none text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">{{ isSaving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, watch, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import { useRouter } from 'vue-router'
import { getAllInventory } from '../services/inventoryService'
import { getWasteLogs, logWaste, getUsageMovements } from '../services/wasteservice'
import { formatQty } from '../utils/inventory'
import {
  WASTE_REASONS, RANGE_OPTIONS, summarize, buildInsights, costOf, formatPeso,
  formatShortDate, daysAgoISO, localISODate, logsToCSV,
  COVER_OPTIONS, buildReorderPlan, reorderToCSV
} from '../utils/waste'

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

const items = ref([])
const logs = ref([])
const movements = ref([])
const usageMissing = ref(false)
const coverDays = ref(14)
const rangeDays = ref(30)
const isLoading = ref(false)
const pageError = ref('')
const successMessage = ref('')
const setupMissing = ref(false)
const searchQuery = ref('')
const reasonFilter = ref('')

const showLogModal = ref(false)
const isSaving = ref(false)
const modalError = ref('')
const today = computed(() => localISODate())
const emptyForm = () => ({ item_id: '', quantity: '', reason: '', waste_date: localISODate(), note: '', deduct: true })
const form = ref(emptyForm())

const summary = computed(() => summarize(logs.value, rangeDays.value))
const insights = computed(() => buildInsights(summary.value, items.value))
const reorderPlan = computed(() => buildReorderPlan(items.value, summary.value.current, movements.value, { days: rangeDays.value, coverDays: coverDays.value }))
const STATUS_UI = {
  reorder: { label: 'Reorder', cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  hold: { label: 'Hold off', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  reduce: { label: 'Order less', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
}
const maxBucket = computed(() => Math.max(...summary.value.buckets.map((b) => b.cost), 1))

const selectedItem = computed(() => items.value.find((i) => i.item_id === form.value.item_id) || null)
const estimatedCost = computed(() => {
  const q = Number(form.value.quantity)
  if (!selectedItem.value || !Number.isFinite(q) || q <= 0) return null
  return q * Number(selectedItem.value.unit_cost || 0)
})

const filteredLogs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return summary.value.current.filter((l) => {
    if (reasonFilter.value && l.reason !== reasonFilter.value) return false
    if (!q) return true
    return (l.item_name || '').toLowerCase().includes(q) || (l.note || '').toLowerCase().includes(q)
  })
})

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  // Same access as Inventory (see the route guard in main.js).
  if (!['Admin', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''

  loadAll()
})

// Loads two periods of logs so the page can compare against the previous one.
async function loadAll() {
  isLoading.value = true
  pageError.value = ''
  setupMissing.value = false
  try {
    const [inv, wasteRows] = await Promise.all([
      getAllInventory(),
      getWasteLogs(daysAgoISO(rangeDays.value * 2 - 1)),
    ])
    items.value = inv
    logs.value = wasteRows
    try {
      movements.value = await getUsageMovements(daysAgoISO(rangeDays.value - 1))
      usageMissing.value = false
    } catch (e) {
      movements.value = []
      usageMissing.value = true
      console.error(e)
    }
  } catch (error) {
    if (error?.code === 'WASTE_NOT_SET_UP') {
      setupMissing.value = true
      try { items.value = await getAllInventory() } catch { /* inventory is optional here */ }
    } else {
      pageError.value = error?.message || 'Failed to load waste data.'
    }
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

watch(rangeDays, () => { searchQuery.value = ''; reasonFilter.value = ''; loadAll() })

function openLogModal() {
  form.value = emptyForm()
  modalError.value = ''
  showLogModal.value = true
}

function closeLogModal() {
  if (isSaving.value) return
  showLogModal.value = false
}

async function submitLog() {
  if (isSaving.value) return
  modalError.value = ''
  isSaving.value = true
  try {
    await logWaste(form.value, selectedItem.value)
    showLogModal.value = false
    successMessage.value = 'Waste logged' + (form.value.deduct ? ' and stock updated.' : '.')
    setTimeout(() => { successMessage.value = '' }, 4000)
    await loadAll() // stock changed too, so refresh both
  } catch (error) {
    modalError.value = error?.message || 'Failed to log waste.'
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

function exportCSV() {
  const csv = logsToCSV(summary.value.current)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `waste-log-${localISODate()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function exportReorderCSV() {
  const csv = reorderToCSV(reorderPlan.value.rows)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reorder-suggestions-${localISODate()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = async () => {
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

const wasteIcon = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
const fleetIcon = 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'

const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Event Planning', path: '/admin/planning', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Pricing & Discounts', path: '/admin/pricing', iconPath: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Suppliers', path: '/admin/suppliers', iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: wasteIcon },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: fleetIcon },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Legal Documents', path: '/admin/legal-documents', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Admin / Owner-Manager only (route + onMounted already enforce this).
const navItems = computed(() => allNavItems)
</script>