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
          :class="item.name === 'Pricing & Discounts' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Pricing &amp; Discounts</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Seasonal pricing, promo codes, and loyalty rewards for your packages.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div class="hidden lg:block"><NotificationBell /></div>
            <button v-if="tab === 'seasons'" @click="openRuleModal()" :class="btnPrimary" class="whitespace-nowrap">Add Season</button>
            <button v-if="tab === 'promos'" @click="openPromoModal()" :class="btnPrimary" class="whitespace-nowrap">New Promo Code</button>
          </div>
        </div>

        <div v-if="setupMissing" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
          Pricing &amp; Discounts needs a one-time database setup. Open the Supabase SQL Editor, run <span class="font-mono font-semibold">RUN_THIS_PRICING_DISCOUNTS_IN_SUPABASE_SQL_EDITOR.sql</span>, then refresh this page.
        </div>
        <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">{{ pageError }}</div>
        <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">{{ successMessage }}</div>
        <div v-if="isLoading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>

        <template v-else-if="!setupMissing">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div v-for="c in cards" :key="c.label" :class="card" class="p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ c.label }}</p>
              <p class="text-xl sm:text-2xl font-bold break-words text-gray-800 dark:text-gray-100">{{ c.value }}</p>
            </div>
          </div>

          <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
            <button v-for="t in TABS" :key="t.key" @click="tab = t.key"
              :class="tab === t.key ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'"
              class="px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition">{{ t.label }}</button>
          </div>

          <!-- SEASONAL PRICING -->
          <div v-if="tab === 'seasons'" :class="card">
            <p class="p-4 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              Raise or lower the package price for events that fall in a date range (peak season, holidays, lean months).
              If several seasons match an event date, only one applies: the highest priority wins, then the one made for a specific package.
            </p>
            <div v-if="!rules.length" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">No seasonal rules yet. Add one, like "Christmas peak +20%".</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <tr><th class="px-4 py-3">Season</th><th class="px-4 py-3">Dates</th><th class="px-4 py-3">Adjustment</th><th class="px-4 py-3">Applies to</th><th class="px-4 py-3">Priority</th><th class="px-4 py-3">Status</th><th class="px-4 py-3"></th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in rules" :key="r.rule_id" class="border-b border-gray-50 dark:border-gray-700/50">
                    <td class="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{{ r.rule_name }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ ruleDates(r) }}</td>
                    <td class="px-4 py-3 font-semibold whitespace-nowrap" :class="Number(r.adjustment_value) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">{{ adjustmentLabel(r) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ packageName(r.package_id) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ r.priority }}</td>
                    <td class="px-4 py-3"><button @click="toggleRule(r)" :class="r.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'" class="px-2 py-0.5 text-xs font-semibold">{{ r.is_active ? 'Active' : 'Off' }}</button></td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button @click="openRuleModal(r)" class="text-sm text-gray-600 dark:text-gray-300 hover:underline mr-3">Edit</button>
                      <button @click="askDelete('rule', r)" class="text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PROMO CODES -->
          <div v-if="tab === 'promos'" :class="card">
            <p class="p-4 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              Clients type a code while booking. The discount comes off the subtotal (package + season + add-ons). Codes are checked by the server, so they can't be guessed or edited in the browser.
            </p>
            <div v-if="!promos.length" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">No promo codes yet.</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <tr><th class="px-4 py-3">Code</th><th class="px-4 py-3">Discount</th><th class="px-4 py-3">Min. order</th><th class="px-4 py-3">Valid</th><th class="px-4 py-3">Used</th><th class="px-4 py-3">Status</th><th class="px-4 py-3"></th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in promos" :key="p.promo_id" class="border-b border-gray-50 dark:border-gray-700/50">
                    <td class="px-4 py-3"><span class="font-mono font-bold text-gray-800 dark:text-gray-100">{{ p.code }}</span><p v-if="p.description" class="text-xs text-gray-400 dark:text-gray-500">{{ p.description }}</p></td>
                    <td class="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{{ promoLabel(p) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ Number(p.min_subtotal) > 0 ? formatPeso(p.min_subtotal) : '—' }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ promoValidity(p) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ p.times_used }}{{ p.usage_limit ? ' / ' + p.usage_limit : '' }}</td>
                    <td class="px-4 py-3"><button @click="togglePromo(p)" :class="promoState(p).cls" class="px-2 py-0.5 text-xs font-semibold">{{ promoState(p).label }}</button></td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button @click="openPromoModal(p)" class="text-sm text-gray-600 dark:text-gray-300 hover:underline mr-3">Edit</button>
                      <button @click="askDelete('promo', p)" class="text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- LOYALTY -->
          <div v-if="tab === 'loyalty'" class="space-y-4">
            <div :class="card" class="p-4 sm:p-6">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 class="font-bold text-gray-800 dark:text-gray-100">Loyalty program</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Clients earn points when a booking is marked Completed, and can spend them on later bookings.</p>
                </div>
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap">
                  <input type="checkbox" v-model="loyalty.is_enabled" class="w-4 h-4 accent-emerald-600" /> Enabled
                </label>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label :class="lbl">Points earned per ₱100</label><input v-model.number="loyalty.points_per_100" type="number" min="0" step="0.1" :class="[inputCls, 'w-full']" /></div>
                <div><label :class="lbl">Value of 1 point (₱)</label><input v-model.number="loyalty.peso_per_point" type="number" min="0.01" step="0.01" :class="[inputCls, 'w-full']" /></div>
                <div><label :class="lbl">Minimum points to redeem</label><input v-model.number="loyalty.min_redeem_points" type="number" min="0" :class="[inputCls, 'w-full']" /></div>
                <div><label :class="lbl">Max % of order payable with points</label><input v-model.number="loyalty.max_redeem_percent" type="number" min="1" max="100" :class="[inputCls, 'w-full']" /></div>
              </div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-5 mb-2">Tiers (by lifetime points)</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label :class="lbl">Silver from <span class="text-gray-400">(earns ×1.1)</span></label><input v-model.number="loyalty.silver_threshold" type="number" min="1" :class="[inputCls, 'w-full']" /></div>
                <div><label :class="lbl">Gold from <span class="text-gray-400">(earns ×1.25)</span></label><input v-model.number="loyalty.gold_threshold" type="number" min="1" :class="[inputCls, 'w-full']" /></div>
                <div><label :class="lbl">Platinum from <span class="text-gray-400">(earns ×1.5)</span></label><input v-model.number="loyalty.platinum_threshold" type="number" min="1" :class="[inputCls, 'w-full']" /></div>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Example: a ₱50,000 booking earns <b>{{ exampleEarn }}</b> points (Bronze) and {{ loyalty.min_redeem_points }} points are worth <b>{{ formatPeso(loyalty.min_redeem_points * loyalty.peso_per_point) }}</b>.</p>
              <div class="mt-4"><button @click="submitLoyalty" :disabled="isSaving" :class="btnPrimary">{{ isSaving ? 'Saving...' : 'Save settings' }}</button></div>
            </div>

            <div :class="card">
              <p class="p-4 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">Members</p>
              <div v-if="!members.length" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">No one has earned points yet.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <tr><th class="px-4 py-3">Client</th><th class="px-4 py-3">Tier</th><th class="px-4 py-3">Points</th><th class="px-4 py-3">Lifetime</th><th class="px-4 py-3"></th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in members" :key="m.client_id" class="border-b border-gray-50 dark:border-gray-700/50">
                      <td class="px-4 py-3"><p class="font-semibold text-gray-800 dark:text-gray-100">{{ m.full_name || 'Client' }}</p><p class="text-xs text-gray-400 dark:text-gray-500">{{ m.email }}</p></td>
                      <td class="px-4 py-3"><span :class="tierBadgeClass(m.tier)" class="px-2 py-0.5 text-xs font-semibold">{{ m.tier }}</span></td>
                      <td class="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{{ m.points_balance.toLocaleString() }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ m.lifetime_points.toLocaleString() }}</td>
                      <td class="px-4 py-3 text-right"><button @click="openAdjust(m)" class="text-sm text-gray-600 dark:text-gray-300 hover:underline">Adjust</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- SEASON MODAL -->
    <div v-if="showRuleModal" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showRuleModal = false"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ ruleForm.rule_id ? 'Edit season' : 'Add season' }}</h3>
        <label :class="lbl">Season name</label>
        <input v-model="ruleForm.rule_name" maxlength="80" placeholder="e.g. Christmas peak" :class="[inputCls, 'w-full mb-3']" />
        <div class="grid grid-cols-2 gap-3">
          <div><label :class="lbl">Type</label><select v-model="ruleForm.adjustment_type" :class="[inputCls, 'w-full mb-3']"><option v-for="t in ADJUSTMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option></select></div>
          <div><label :class="lbl">Amount (− for discount)</label><input v-model.number="ruleForm.adjustment_value" type="number" step="0.01" placeholder="20 or -10" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Starts</label><input v-model="ruleForm.start_date" type="date" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Ends</label><input v-model="ruleForm.end_date" type="date" :class="[inputCls, 'w-full mb-3']" /></div>
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3 cursor-pointer"><input type="checkbox" v-model="ruleForm.recurring_yearly" class="w-4 h-4 accent-emerald-600" /> Repeat every year (uses month and day only)</label>
        <div class="grid grid-cols-2 gap-3">
          <div><label :class="lbl">Applies to</label><select v-model="ruleForm.package_id" :class="[inputCls, 'w-full mb-3']"><option :value="null">All packages</option><option v-for="p in packages" :key="p.package_id" :value="p.package_id">{{ p.package_name }}</option></select></div>
          <div><label :class="lbl">Priority</label><input v-model.number="ruleForm.priority" type="number" step="1" :class="[inputCls, 'w-full mb-3']" /></div>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">Higher priority wins when two seasons overlap.</p>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm mb-3">{{ modalError }}</div>
        <div class="flex gap-3">
          <button @click="showRuleModal = false" :disabled="isSaving" :class="btnGhost" class="flex-1">Cancel</button>
          <button @click="submitRule" :disabled="isSaving" :class="btnPrimary" class="flex-1">{{ isSaving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- PROMO MODAL -->
    <div v-if="showPromoModal" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showPromoModal = false"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ promoForm.promo_id ? 'Edit promo code' : 'New promo code' }}</h3>
        <div class="grid grid-cols-2 gap-3">
          <div><label :class="lbl">Code</label><input :value="promoForm.code" @input="promoForm.code = normalizePromoCode($event.target.value)" maxlength="20" placeholder="SUMMER10" :class="[inputCls, 'w-full mb-3 font-mono uppercase']" /></div>
          <div><label :class="lbl">Description <span class="text-gray-400">(optional)</span></label><input v-model="promoForm.description" maxlength="80" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Discount type</label><select v-model="promoForm.discount_type" :class="[inputCls, 'w-full mb-3']"><option value="percent">Percent (%)</option><option value="fixed">Fixed amount (₱)</option></select></div>
          <div><label :class="lbl">{{ promoForm.discount_type === 'percent' ? 'Percent off' : 'Peso off' }}</label><input v-model.number="promoForm.discount_value" type="number" min="0" step="0.01" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Minimum order (₱)</label><input v-model.number="promoForm.min_subtotal" type="number" min="0" :class="[inputCls, 'w-full mb-3']" /></div>
          <div v-if="promoForm.discount_type === 'percent'"><label :class="lbl">Max discount (₱) <span class="text-gray-400">(optional)</span></label><input v-model.number="promoForm.max_discount" type="number" min="0" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Valid from</label><input v-model="promoForm.valid_from" type="date" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Valid until</label><input v-model="promoForm.valid_until" type="date" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Total uses <span class="text-gray-400">(blank = unlimited)</span></label><input v-model.number="promoForm.usage_limit" type="number" min="1" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Uses per client</label><input v-model.number="promoForm.per_client_limit" type="number" min="1" :class="[inputCls, 'w-full mb-3']" /></div>
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3 cursor-pointer"><input type="checkbox" v-model="promoForm.is_active" class="w-4 h-4 accent-emerald-600" /> Active</label>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm mb-3">{{ modalError }}</div>
        <div class="flex gap-3">
          <button @click="showPromoModal = false" :disabled="isSaving" :class="btnGhost" class="flex-1">Cancel</button>
          <button @click="submitPromo" :disabled="isSaving" :class="btnPrimary" class="flex-1">{{ isSaving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- ADJUST POINTS MODAL -->
    <div v-if="adjusting" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="adjusting = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Adjust points</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ adjusting.full_name || 'Client' }} · {{ adjusting.points_balance.toLocaleString() }} points now</p>
        <label :class="lbl">Points to add (− to remove)</label>
        <input v-model.number="adjustPoints" type="number" step="1" :class="[inputCls, 'w-full mb-3']" />
        <label :class="lbl">Reason <span class="text-gray-400">(optional)</span></label>
        <input v-model="adjustNote" maxlength="120" placeholder="e.g. Goodwill for a late delivery" :class="[inputCls, 'w-full mb-3']" />
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm mb-3">{{ modalError }}</div>
        <div class="flex gap-3">
          <button @click="adjusting = null" :disabled="isSaving" :class="btnGhost" class="flex-1">Cancel</button>
          <button @click="submitAdjust" :disabled="isSaving" :class="btnPrimary" class="flex-1">{{ isSaving ? 'Saving...' : 'Apply' }}</button>
        </div>
      </div>
    </div>

    <!-- CONFIRM -->
    <div v-if="confirmState" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="confirmState = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{{ confirmState.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-5">{{ confirmState.message }}</p>
        <div class="flex gap-3">
          <button @click="confirmState = null" :class="btnGhost" class="flex-1">Keep</button>
          <button @click="runConfirm" class="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import { useRouter } from 'vue-router'
import { getAllPackages } from '../services/packageService'
import {
  ADJUSTMENT_TYPES, normalizePromoCode, tierBadgeClass,
  getPricingRules, savePricingRule, deletePricingRule,
  getPromoCodes, savePromoCode, deletePromoCode,
  getLoyaltySettings, saveLoyaltySettings, getLoyaltyMembers, adjustLoyaltyPoints, LOYALTY_DEFAULTS
} from '../services/pricingService'
import { formatPeso, localISODate } from '../utils/suppliers'

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

const card = 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
const inputCls = 'px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500'
const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
const btnGhost = 'px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 transition'
const btnPrimary = 'px-4 py-2.5 bg-emerald-600 text-white rounded-none text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition'

const TABS = [
  { key: 'seasons', label: 'Seasonal Pricing' },
  { key: 'promos', label: 'Promo Codes' },
  { key: 'loyalty', label: 'Loyalty Rewards' },
]
const tab = ref('seasons')
const rules = ref([])
const promos = ref([])
const packages = ref([])
const members = ref([])
const loyalty = ref({ ...LOYALTY_DEFAULTS })
const isLoading = ref(false)
const isSaving = ref(false)
const setupMissing = ref(false)
const pageError = ref('')
const modalError = ref('')
const successMessage = ref('')

function flash(message) {
  successMessage.value = message
  setTimeout(() => { successMessage.value = '' }, 4000)
}

// ---- helpers ----
const todayISO = () => localISODate(new Date())
const packageName = (id) => (id ? packages.value.find((p) => p.package_id === id)?.package_name || 'Package #' + id : 'All packages')
const fullDate = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }
const monthDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

function ruleDates(r) {
  return r.recurring_yearly
    ? `${monthDay(r.start_date)} – ${monthDay(r.end_date)}, every year`
    : `${fullDate(r.start_date)} – ${fullDate(r.end_date)}`
}
function adjustmentLabel(r) {
  const v = Number(r.adjustment_value)
  const sign = v > 0 ? '+' : '−'
  return r.adjustment_type === 'percent' ? `${sign}${Math.abs(v)}%` : `${sign}₱${Math.abs(v).toLocaleString()}/head`
}
function promoLabel(p) {
  const v = Number(p.discount_value)
  return p.discount_type === 'percent'
    ? `${v}% off${p.max_discount ? ` (max ${formatPeso(p.max_discount)})` : ''}`
    : `${formatPeso(v)} off`
}
function promoValidity(p) {
  if (!p.valid_from && !p.valid_until) return 'Always'
  const from = p.valid_from ? fullDate(p.valid_from) : 'any time'
  return p.valid_until ? `${from} – ${fullDate(p.valid_until)}` : `From ${from}`
}
function promoState(p) {
  const green = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  const grey = 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
  const red = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  const t = todayISO()
  if (!p.is_active) return { label: 'Off', cls: grey }
  if (p.valid_until && t > p.valid_until) return { label: 'Expired', cls: red }
  if (p.valid_from && t < p.valid_from) return { label: 'Scheduled', cls: grey }
  if (p.usage_limit && p.times_used >= p.usage_limit) return { label: 'Used up', cls: red }
  return { label: 'Active', cls: green }
}

const cards = computed(() => [
  { label: 'Active seasons', value: rules.value.filter((r) => r.is_active).length },
  { label: 'Active promo codes', value: promos.value.filter((p) => promoState(p).label === 'Active').length },
  { label: 'Promo redemptions', value: promos.value.reduce((s, p) => s + (p.times_used || 0), 0) },
  { label: 'Loyalty members', value: members.value.length },
])
const exampleEarn = computed(() => Math.floor(500 * (Number(loyalty.value.points_per_100) || 0)))

// ---- load ----
onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) { router.push('/'); return }
  const user = JSON.parse(storedUser)
  if (!['Admin', 'Owner/Manager'].includes(user.role)) { router.push('/'); return }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  loadAll()
})

async function loadAll(silent = false) {
  if (!silent) isLoading.value = true
  pageError.value = ''
  setupMissing.value = false
  try {
    const [r, p, pk, l] = await Promise.all([getPricingRules(), getPromoCodes(), getAllPackages(), getLoyaltySettings()])
    rules.value = r
    promos.value = p
    packages.value = pk
    loyalty.value = l
    try { members.value = await getLoyaltyMembers() } catch { members.value = [] }
  } catch (error) {
    // 42P01 = table missing: the SQL file hasn't been run yet.
    if (error?.code === '42P01' || error?.code === 'PGRST205' || /does not exist|schema cache/i.test(error?.message || '')) setupMissing.value = true
    else pageError.value = error?.message || 'Failed to load pricing.'
  } finally {
    isLoading.value = false
  }
}

// ---- seasons ----
const showRuleModal = ref(false)
const emptyRule = () => ({ rule_id: null, rule_name: '', adjustment_type: 'percent', adjustment_value: null, start_date: '', end_date: '', recurring_yearly: false, package_id: null, priority: 0, is_active: true })
const ruleForm = ref(emptyRule())
function openRuleModal(r = null) {
  modalError.value = ''
  ruleForm.value = r ? { ...r } : emptyRule()
  showRuleModal.value = true
}
async function submitRule() {
  modalError.value = ''
  isSaving.value = true
  try {
    const editing = !!ruleForm.value.rule_id
    await savePricingRule(ruleForm.value)
    showRuleModal.value = false
    flash(editing ? 'Season updated.' : 'Season added.')
    await loadAll(true)
  } catch (error) {
    modalError.value = error?.message || 'Failed to save.'
  } finally {
    isSaving.value = false
  }
}
async function toggleRule(r) {
  try {
    await savePricingRule({ ...r, is_active: !r.is_active })
    await loadAll(true)
  } catch (error) { pageError.value = error?.message }
}

// ---- promos ----
const showPromoModal = ref(false)
const emptyPromo = () => ({ promo_id: null, code: '', description: '', discount_type: 'percent', discount_value: null, min_subtotal: 0, max_discount: null, valid_from: '', valid_until: '', usage_limit: null, per_client_limit: 1, is_active: true })
const promoForm = ref(emptyPromo())
function openPromoModal(p = null) {
  modalError.value = ''
  promoForm.value = p ? { ...p } : emptyPromo()
  showPromoModal.value = true
}
async function submitPromo() {
  modalError.value = ''
  isSaving.value = true
  try {
    const editing = !!promoForm.value.promo_id
    await savePromoCode(promoForm.value)
    showPromoModal.value = false
    flash(editing ? 'Promo code updated.' : 'Promo code created.')
    await loadAll(true)
  } catch (error) {
    modalError.value = error?.message || 'Failed to save.'
  } finally {
    isSaving.value = false
  }
}
async function togglePromo(p) {
  try {
    await savePromoCode({ ...p, is_active: !p.is_active })
    await loadAll(true)
  } catch (error) { pageError.value = error?.message }
}

// ---- loyalty ----
async function submitLoyalty() {
  pageError.value = ''
  isSaving.value = true
  try {
    loyalty.value = { ...loyalty.value, ...(await saveLoyaltySettings(loyalty.value)) }
    flash('Loyalty settings saved.')
  } catch (error) {
    pageError.value = error?.message || 'Failed to save.'
  } finally {
    isSaving.value = false
  }
}
const adjusting = ref(null)
const adjustPoints = ref(null)
const adjustNote = ref('')
function openAdjust(m) {
  modalError.value = ''
  adjusting.value = m
  adjustPoints.value = null
  adjustNote.value = ''
}
async function submitAdjust() {
  modalError.value = ''
  isSaving.value = true
  try {
    await adjustLoyaltyPoints(adjusting.value.client_id, adjustPoints.value, adjustNote.value)
    adjusting.value = null
    flash('Points updated.')
    members.value = await getLoyaltyMembers()
  } catch (error) {
    modalError.value = error?.message || 'Failed to adjust points.'
  } finally {
    isSaving.value = false
  }
}

// ---- delete ----
const confirmState = ref(null)
function askDelete(kind, item) {
  confirmState.value = kind === 'rule'
    ? { title: 'Delete this season?', message: `"${item.rule_name}" will stop affecting prices. Bookings already priced keep their price.`, run: () => deletePricingRule(item.rule_id), done: 'Season deleted.' }
    : { title: 'Delete this promo code?', message: `${item.code} will stop working. Bookings that already used it keep their discount.`, run: () => deletePromoCode(item.promo_id), done: 'Promo code deleted.' }
}
async function runConfirm() {
  const c = confirmState.value
  confirmState.value = null
  try {
    await c.run()
    flash(c.done)
  } catch (error) { pageError.value = error?.message }
  await loadAll(true)
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