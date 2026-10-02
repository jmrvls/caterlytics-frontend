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
          :class="item.name === 'Suppliers' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Supplier Management</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Track vendors, purchase orders, and delivery schedules.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div class="hidden lg:block"><NotificationBell /></div>
            <button @click="openSupplierModal()" :disabled="setupMissing" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition whitespace-nowrap">Add Supplier</button>
            <button @click="openPoModal()" :disabled="setupMissing" class="bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition whitespace-nowrap">New Purchase Order</button>
          </div>
        </div>

        <div v-if="setupMissing" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
          Supplier Management needs a one-time database setup. Open the Supabase SQL Editor and run <span class="font-mono font-semibold">supplier_management.sql</span>, then refresh this page.
        </div>
        <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">{{ pageError }}</div>
        <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">{{ successMessage }}</div>
        <div v-if="isLoading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading suppliers...</div>

        <template v-else-if="!setupMissing">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div v-for="c in cards" :key="c.label" :class="card" class="p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ c.label }}</p>
              <p :class="c.warn ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'" class="text-xl sm:text-2xl font-bold break-words">{{ c.value }}</p>
            </div>
          </div>

          <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
            <button v-for="t in TABS" :key="t.key" @click="tab = t.key"
              :class="tab === t.key ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'"
              class="px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition">{{ t.label }}</button>
          </div>

          <!-- SUPPLIERS -->
          <div v-if="tab === 'suppliers'" :class="card">
            <div class="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
              <input v-model="supplierSearch" type="text" placeholder="Search name, contact, category..." :class="[inputCls, 'sm:flex-1']" />
              <select v-model="categoryFilter" :class="inputCls">
                <option value="">All categories</option>
                <option v-for="c in SUPPLIER_CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
              <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"><input v-model="showInactive" type="checkbox" class="accent-emerald-600" /> Show inactive</label>
            </div>
            <div v-if="!filteredSuppliers.length" class="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">{{ suppliers.length ? 'No suppliers match.' : 'No suppliers yet. Tap "Add Supplier" to add your first vendor.' }}</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr><th class="px-4 py-3">Supplier</th><th class="px-4 py-3">Contact</th><th class="px-4 py-3">Terms</th><th class="px-4 py-3 text-right">Orders</th><th class="px-4 py-3 text-right">Open</th><th class="px-4 py-3 text-right">Received value</th><th class="px-4 py-3"></th></tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="s in filteredSuppliers" :key="s.supplier_id" :class="s.is_active ? '' : 'opacity-60'" class="text-gray-700 dark:text-gray-300 align-top">
                    <td class="px-4 py-3"><p class="font-medium text-gray-900 dark:text-gray-100">{{ s.supplier_name }}<span v-if="!s.is_active" class="ml-2 text-xs text-gray-400">(inactive)</span></p><p class="text-xs text-gray-400">{{ s.category }}</p></td>
                    <td class="px-4 py-3"><p>{{ s.contact_person || '—' }}</p><p class="text-xs text-gray-400">{{ [s.contact_number, s.email].filter(Boolean).join(' · ') }}</p></td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ s.payment_terms }}</td>
                    <td class="px-4 py-3 text-right">{{ statsOf(s).orders }}</td>
                    <td class="px-4 py-3 text-right">{{ statsOf(s).open }}</td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">{{ formatPeso(statsOf(s).spent) }}</td>
                    <td class="px-4 py-3 text-right whitespace-nowrap space-x-3">
                      <button @click="openPoModal(null, s.supplier_id)" :disabled="!s.is_active" class="text-emerald-700 dark:text-emerald-300 hover:underline disabled:opacity-40 disabled:no-underline">Order</button>
                      <button @click="openSupplierModal(s)" class="text-gray-600 dark:text-gray-300 hover:underline">Edit</button>
                      <button @click="toggleActive(s)" class="text-gray-600 dark:text-gray-300 hover:underline">{{ s.is_active ? 'Deactivate' : 'Activate' }}</button>
                      <button @click="askDeleteSupplier(s)" class="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PURCHASE ORDERS -->
          <div v-if="tab === 'orders'" :class="card">
            <div class="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
              <input v-model="poSearch" type="text" placeholder="Search PO number or supplier..." :class="[inputCls, 'sm:flex-1']" />
              <select v-model="statusFilter" :class="inputCls">
                <option value="">All statuses</option>
                <option v-for="(v, k) in PO_STATUS" :key="k" :value="k">{{ v.label }}</option>
              </select>
            </div>
            <div v-if="!filteredOrders.length" class="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">{{ orders.length ? 'No purchase orders match.' : 'No purchase orders yet. Tap "New Purchase Order" to create one.' }}</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr><th class="px-4 py-3">PO</th><th class="px-4 py-3">Supplier</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Ordered</th><th class="px-4 py-3">Expected</th><th class="px-4 py-3 text-right">Total</th></tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="o in filteredOrders" :key="o.po_id" @click="openDetail(o)" class="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer">
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{{ o.po_number }}</td>
                    <td class="px-4 py-3">{{ o.supplier?.supplier_name }}</td>
                    <td class="px-4 py-3"><span :class="PO_STATUS[o.status].cls" class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ PO_STATUS[o.status].label }}</span></td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ formatShortDate(o.order_date) }}</td>
                    <td class="px-4 py-3 whitespace-nowrap" :class="overdue(o) ? 'text-red-600 dark:text-red-400 font-semibold' : ''">{{ o.expected_date ? formatShortDate(o.expected_date) : '—' }}<span v-if="overdue(o)"> (overdue)</span></td>
                    <td class="px-4 py-3 text-right font-semibold whitespace-nowrap">{{ formatPeso(poTotal(o)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- DELIVERY SCHEDULE -->
          <div v-if="tab === 'schedule'">
            <div v-if="!schedule.length" :class="card" class="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No deliveries are expected. Orders you place will show up here.</div>
            <div v-for="g in schedule" :key="g.key" :class="card" class="mb-4">
              <h2 :class="g.tone" class="font-semibold px-4 pt-4 pb-2">{{ g.title }} <span class="text-gray-400 font-normal">({{ g.rows.length }})</span></h2>
              <div class="divide-y divide-gray-100 dark:divide-gray-700">
                <div v-for="o in g.rows" :key="o.po_id" class="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                  <div class="sm:w-32 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ o.expected_date ? formatShortDate(o.expected_date) : '—' }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ o.supplier?.supplier_name }} <span class="text-gray-400 font-normal">· {{ o.po_number }}</span></p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ itemSummary(o) }}</p>
                  </div>
                  <span :class="PO_STATUS[o.status].cls" class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ PO_STATUS[o.status].label }}</span>
                  <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{{ formatPeso(poOutstandingValue(o)) }}</span>
                  <button @click="openReceive(o)" class="px-3 py-1.5 bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition whitespace-nowrap">Receive</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- SUPPLIER MODAL -->
    <div v-if="showSupplierModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="!isSaving && (showSupplierModal = false)"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ supplierForm.supplier_id ? 'Edit Supplier' : 'Add Supplier' }}</h3>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>
        <label :class="lbl">Supplier name</label>
        <input v-model="supplierForm.supplier_name" maxlength="120" :class="[inputCls, 'w-full mb-3']" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
          <div><label :class="lbl">Category</label><select v-model="supplierForm.category" :class="[inputCls, 'w-full mb-3']"><option v-for="c in SUPPLIER_CATEGORIES" :key="c" :value="c">{{ c }}</option></select></div>
          <div><label :class="lbl">Payment terms</label><select v-model="supplierForm.payment_terms" :class="[inputCls, 'w-full mb-3']"><option v-for="t in PAYMENT_TERMS" :key="t" :value="t">{{ t }}</option></select></div>
          <div><label :class="lbl">Contact person</label><input v-model="supplierForm.contact_person" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Contact number</label><input v-model="supplierForm.contact_number" inputmode="tel" :class="[inputCls, 'w-full mb-3']" /></div>
        </div>
        <label :class="lbl">Email</label>
        <input v-model="supplierForm.email" type="email" :class="[inputCls, 'w-full mb-3']" />
        <label :class="lbl">Address</label>
        <input v-model="supplierForm.address" :class="[inputCls, 'w-full mb-3']" />
        <label :class="lbl">Notes <span class="text-gray-400">(optional)</span></label>
        <textarea v-model="supplierForm.notes" rows="2" maxlength="500" :class="[inputCls, 'w-full mb-4']"></textarea>
        <div class="flex gap-3">
          <button @click="showSupplierModal = false" :disabled="isSaving" :class="btnGhost" class="flex-1">Cancel</button>
          <button @click="submitSupplier" :disabled="isSaving" :class="btnPrimary" class="flex-1">{{ isSaving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- PURCHASE ORDER MODAL -->
    <div v-if="showPoModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="!isSaving && (showPoModal = false)"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ poForm.po_id ? 'Edit Draft Purchase Order' : 'New Purchase Order' }}</h3>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
          <div class="sm:col-span-3">
            <label :class="lbl">Supplier</label>
            <select v-model="poForm.supplier_id" :class="[inputCls, 'w-full mb-3']">
              <option value="" disabled>Choose a supplier</option>
              <option v-for="s in activeSuppliers" :key="s.supplier_id" :value="s.supplier_id">{{ s.supplier_name }} ({{ s.category }})</option>
            </select>
          </div>
          <div><label :class="lbl">Order date</label><input v-model="poForm.order_date" type="date" :class="[inputCls, 'w-full mb-3']" /></div>
          <div><label :class="lbl">Expected delivery</label><input v-model="poForm.expected_date" type="date" :min="poForm.order_date" :class="[inputCls, 'w-full mb-3']" /></div>
        </div>

        <label :class="lbl">Items</label>
        <div class="space-y-2 mb-2">
          <div v-for="(l, idx) in poForm.lines" :key="l.key" class="grid grid-cols-12 gap-2 items-start">
            <div class="col-span-12 sm:col-span-5">
              <select :value="l.item_id" @change="pickItem(l, $event.target.value)" :class="[inputCls, 'w-full']">
                <option value="">Other item (type a name)</option>
                <option v-for="i in inventory" :key="i.item_id" :value="i.item_id">{{ i.item_name }} ({{ i.quantity }} {{ i.unit }} on hand)</option>
              </select>
              <input v-if="!l.item_id" v-model="l.item_name" placeholder="Item name" maxlength="120" :class="[inputCls, 'w-full mt-1']" />
            </div>
            <input v-model="l.quantity" type="number" min="1" step="1" inputmode="numeric" placeholder="Qty" :class="[inputCls, 'col-span-4 sm:col-span-2']" />
            <div class="col-span-3 sm:col-span-1">
              <span v-if="l.item_id" class="block py-2.5 text-sm text-gray-500 dark:text-gray-400">{{ l.unit }}</span>
              <select v-else v-model="l.unit" :class="[inputCls, 'w-full px-1']"><option v-for="u in UNIT_OPTIONS" :key="u" :value="u">{{ u }}</option></select>
            </div>
            <input v-model="l.unit_cost" type="number" min="0" step="0.01" inputmode="decimal" placeholder="₱ / unit" :class="[inputCls, 'col-span-4 sm:col-span-3']" />
            <button @click="removeLine(idx)" type="button" class="col-span-1 py-2.5 text-red-500 hover:text-red-700" title="Remove line">✕</button>
          </div>
        </div>
        <button @click="addLine" type="button" class="text-sm text-emerald-700 dark:text-emerald-300 hover:underline mb-3">+ Add item</button>
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 text-right mb-3">Total: {{ formatPeso(poTotal({ lines: poForm.lines })) }}</p>

        <label :class="lbl">Notes <span class="text-gray-400">(optional)</span></label>
        <textarea v-model="poForm.notes" rows="2" maxlength="500" :class="[inputCls, 'w-full mb-4']"></textarea>
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="showPoModal = false" :disabled="isSaving" :class="btnGhost" class="sm:flex-1">Cancel</button>
          <button @click="submitPo(false)" :disabled="isSaving" :class="btnGhost" class="sm:flex-1">Save as draft</button>
          <button @click="submitPo(true)" :disabled="isSaving" :class="btnPrimary" class="sm:flex-1">{{ isSaving ? 'Saving...' : 'Place order' }}</button>
        </div>
      </div>
    </div>

    <!-- PURCHASE ORDER DETAIL -->
    <div v-if="detail" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="detail = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <div class="flex items-start justify-between gap-3 mb-1">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ detail.po_number }}</h3>
          <span :class="PO_STATUS[detail.status].cls" class="inline-block px-2 py-0.5 text-xs font-semibold">{{ PO_STATUS[detail.status].label }}</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ detail.supplier?.supplier_name }}<span v-if="detail.supplier?.contact_number"> · {{ detail.supplier.contact_number }}</span></p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">Ordered {{ formatShortDate(detail.order_date) }}<span v-if="detail.expected_date"> · Expected {{ formatShortDate(detail.expected_date) }}</span><span v-if="detail.received_date"> · Received {{ formatShortDate(detail.received_date) }}</span></p>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>
        <div class="overflow-x-auto mb-3">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase text-gray-500 dark:text-gray-400"><tr><th class="px-3 py-2">Item</th><th class="px-3 py-2 text-right">Ordered</th><th class="px-3 py-2 text-right">Received</th><th class="px-3 py-2 text-right">Unit cost</th><th class="px-3 py-2 text-right">Line total</th></tr></thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="l in detail.items" :key="l.po_item_id" class="text-gray-700 dark:text-gray-300">
                <td class="px-3 py-2">{{ l.item_name }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">{{ l.quantity }} {{ l.unit }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">{{ l.received_qty }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">{{ formatPeso(l.unit_cost) }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">{{ formatPeso(lineTotal(l)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 text-right mb-3">Total: {{ formatPeso(poTotal(detail)) }}</p>
        <p v-if="detail.notes" class="text-sm text-gray-600 dark:text-gray-300 mb-2"><span class="font-medium">Notes:</span> {{ detail.notes }}</p>
        <p v-if="detail.delivery_notes" class="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-line"><span class="font-medium">Delivery notes:</span> {{ detail.delivery_notes }}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          <button @click="detail = null" :class="btnGhost" class="flex-1 sm:flex-none">Close</button>
          <template v-if="detail.status === 'Draft'">
            <button @click="openPoModal(detail)" :class="btnGhost" class="flex-1 sm:flex-none">Edit</button>
            <button @click="askDeletePo(detail)" class="px-4 py-2.5 border border-red-200 dark:border-red-800 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1 sm:flex-none">Delete</button>
            <button @click="placeOrder(detail)" :disabled="isSaving" :class="btnPrimary" class="flex-1 sm:flex-none">Place order</button>
          </template>
          <template v-if="['Ordered', 'Partially Received'].includes(detail.status)">
            <button v-if="detail.status === 'Ordered'" @click="askCancelPo(detail)" class="px-4 py-2.5 border border-red-200 dark:border-red-800 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1 sm:flex-none">Cancel order</button>
            <button @click="openReceive(detail)" :class="btnPrimary" class="flex-1 sm:flex-none">Receive delivery</button>
          </template>
          <button v-if="detail.status === 'Cancelled'" @click="askDeletePo(detail)" class="px-4 py-2.5 border border-red-200 dark:border-red-800 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
        </div>
      </div>
    </div>

    <!-- RECEIVE DELIVERY MODAL -->
    <div v-if="receiving" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="!isSaving && (receiving = null)"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Receive delivery</h3>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">{{ receiving.po.po_number }} · {{ receiving.po.supplier?.supplier_name }}. Items linked to Inventory are added to stock automatically.</p>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>
        <div class="space-y-2 mb-4">
          <div v-for="l in receiving.po.items.filter((x) => x.quantity > x.received_qty)" :key="l.po_item_id" class="flex items-center gap-3">
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ l.item_name }}</p><p class="text-xs text-gray-400">{{ l.quantity - l.received_qty }} {{ l.unit }} still outstanding</p></div>
            <input v-model="receiving.qty[l.po_item_id]" type="number" min="0" :max="l.quantity - l.received_qty" step="1" inputmode="numeric" :class="[inputCls, 'w-24']" />
          </div>
        </div>
        <label :class="lbl">Date received</label>
        <input v-model="receiving.date" type="date" :max="today" :class="[inputCls, 'w-full mb-3']" />
        <label :class="lbl">Delivery note <span class="text-gray-400">(optional)</span></label>
        <textarea v-model="receiving.note" rows="2" maxlength="300" placeholder="e.g. 2 crates arrived damaged" :class="[inputCls, 'w-full mb-3']"></textarea>
        <label class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 mb-5 cursor-pointer">
          <input v-model="receiving.close" type="checkbox" class="mt-0.5 accent-emerald-600" />
          <span>Close this order now<span class="block text-xs text-gray-400 dark:text-gray-500">Tick if the supplier will not deliver the remaining items. Otherwise the order stays open for the next delivery.</span></span>
        </label>
        <div class="flex gap-3">
          <button @click="receiving = null" :disabled="isSaving" :class="btnGhost" class="flex-1">Cancel</button>
          <button @click="submitReceive" :disabled="isSaving" :class="btnPrimary" class="flex-1">{{ isSaving ? 'Saving...' : 'Confirm received' }}</button>
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
          <button @click="runConfirm" class="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">{{ confirmState.action }}</button>
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
import { getAllInventory } from '../services/inventoryService'
import {
  getSuppliers, createSupplier, updateSupplier, setSupplierActive, deleteSupplier,
  getPurchaseOrders, savePurchaseOrder, setPurchaseOrderStatus, deletePurchaseOrder, receivePurchaseOrder
} from '../services/supplierservice'
import { UNIT_OPTIONS } from '../utils/inventory'
import {
  SUPPLIER_CATEGORIES, PAYMENT_TERMS, PO_STATUS, OPEN_STATUSES, poTotal, lineTotal, poOutstandingValue,
  isOverdue, buildSchedule, supplierStats, formatPeso, formatShortDate, localISODate
} from '../utils/suppliers'

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

// Shared Tailwind classes (keeps the template short).
const card = 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
const inputCls = 'px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500'
const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
const btnGhost = 'px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 transition'
const btnPrimary = 'px-4 py-2.5 bg-emerald-600 text-white rounded-none text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition'
const TABS = [
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'orders', label: 'Purchase Orders' },
  { key: 'schedule', label: 'Delivery Schedule' },
]

const tab = ref('suppliers')
const suppliers = ref([])
const orders = ref([])
const inventory = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const pageError = ref('')
const modalError = ref('')
const successMessage = ref('')
const setupMissing = ref(false)
const supplierSearch = ref('')
const categoryFilter = ref('')
const showInactive = ref(false)
const poSearch = ref('')
const statusFilter = ref('')
const today = computed(() => localISODate())

const activeSuppliers = computed(() => suppliers.value.filter((s) => s.is_active))
const statsMap = computed(() => supplierStats(orders.value))
const statsOf = (s) => statsMap.value[s.supplier_id] || { orders: 0, open: 0, spent: 0 }
const overdue = (o) => isOverdue(o, today.value)
const openOrders = computed(() => orders.value.filter((o) => OPEN_STATUSES.includes(o.status)))
const schedule = computed(() => buildSchedule(orders.value, today.value))
const cards = computed(() => {
  const late = openOrders.value.filter(overdue).length
  return [
    { label: 'Active suppliers', value: activeSuppliers.value.length },
    { label: 'Open orders', value: openOrders.value.length },
    { label: 'Overdue deliveries', value: late, warn: late > 0 },
    { label: 'Value still to arrive', value: formatPeso(openOrders.value.reduce((s, o) => s + poOutstandingValue(o), 0)) },
  ]
})

const filteredSuppliers = computed(() => {
  const q = supplierSearch.value.trim().toLowerCase()
  return suppliers.value.filter((s) => {
    if (!showInactive.value && !s.is_active) return false
    if (categoryFilter.value && s.category !== categoryFilter.value) return false
    return !q || [s.supplier_name, s.contact_person, s.category, s.email].some((v) => (v || '').toLowerCase().includes(q))
  })
})
const filteredOrders = computed(() => {
  const q = poSearch.value.trim().toLowerCase()
  return orders.value.filter((o) => {
    if (statusFilter.value && o.status !== statusFilter.value) return false
    return !q || o.po_number.toLowerCase().includes(q) || (o.supplier?.supplier_name || '').toLowerCase().includes(q)
  })
})
const itemSummary = (o) =>
  o.items.filter((i) => i.quantity > i.received_qty).map((i) => `${i.quantity - i.received_qty} ${i.unit} ${i.item_name}`).join(', ')

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) { router.push('/'); return }
  const user = JSON.parse(storedUser)
  // Same access as Inventory (see the route guard in main.js).
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
    const [s, o] = await Promise.all([getSuppliers(), getPurchaseOrders()])
    suppliers.value = s
    orders.value = o
    try { inventory.value = await getAllInventory() } catch { inventory.value = [] }
    if (detail.value) detail.value = o.find((x) => x.po_id === detail.value.po_id) || null
  } catch (error) {
    if (error?.code === 'SUPPLIERS_NOT_SET_UP') setupMissing.value = true
    else pageError.value = error?.message || 'Failed to load supplier data.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function flash(message) {
  successMessage.value = message
  setTimeout(() => { successMessage.value = '' }, 4000)
}

// ---- Suppliers ----
const showSupplierModal = ref(false)
const emptySupplier = () => ({ supplier_id: null, supplier_name: '', category: 'Other', contact_person: '', contact_number: '', email: '', address: '', payment_terms: 'COD', notes: '' })
const supplierForm = ref(emptySupplier())

function openSupplierModal(s = null) {
  supplierForm.value = s ? { ...emptySupplier(), ...s } : emptySupplier()
  modalError.value = ''
  showSupplierModal.value = true
}

async function submitSupplier() {
  if (isSaving.value) return
  modalError.value = ''
  isSaving.value = true
  try {
    const editing = !!supplierForm.value.supplier_id
    if (editing) await updateSupplier(supplierForm.value.supplier_id, supplierForm.value)
    else await createSupplier(supplierForm.value)
    showSupplierModal.value = false
    flash(editing ? 'Supplier updated.' : 'Supplier added.')
    await loadAll(true)
  } catch (error) {
    modalError.value = error?.message || 'Failed to save supplier.'
  } finally {
    isSaving.value = false
  }
}

async function toggleActive(s) {
  try {
    await setSupplierActive(s.supplier_id, !s.is_active)
    flash(s.is_active ? 'Supplier marked inactive.' : 'Supplier reactivated.')
    await loadAll(true)
  } catch (error) {
    pageError.value = error?.message
  }
}

// ---- Purchase orders ----
const showPoModal = ref(false)
const detail = ref(null)
let lineSeq = 0
const newLine = (l = {}) => ({ key: ++lineSeq, item_id: '', item_name: '', unit: 'kg', quantity: '', unit_cost: '', ...l })
const poForm = ref({})

function openPoModal(po = null, supplierId = '') {
  if (!activeSuppliers.value.length) {
    pageError.value = 'Add a supplier first, then create a purchase order.'
    tab.value = 'suppliers'
    return
  }
  pageError.value = ''
  modalError.value = ''
  detail.value = null
  poForm.value = po
    ? {
        po_id: po.po_id, supplier_id: po.supplier_id, order_date: po.order_date, expected_date: po.expected_date || '', notes: po.notes || '',
        lines: po.items.map((i) => newLine({ item_id: i.item_id || '', item_name: i.item_name, unit: i.unit, quantity: i.quantity, unit_cost: i.unit_cost })),
      }
    : { po_id: null, supplier_id: supplierId, order_date: today.value, expected_date: '', notes: '', lines: [newLine()] }
  showPoModal.value = true
}

const addLine = () => poForm.value.lines.push(newLine())
function removeLine(idx) {
  poForm.value.lines.splice(idx, 1)
  if (!poForm.value.lines.length) addLine()
}
function pickItem(line, raw) {
  const item = inventory.value.find((i) => String(i.item_id) === String(raw))
  if (!item) { line.item_id = ''; return }
  line.item_id = item.item_id
  line.item_name = item.item_name
  line.unit = item.unit || 'kg'
  if (line.unit_cost === '') line.unit_cost = item.unit_cost || ''
}

async function submitPo(markOrdered) {
  if (isSaving.value) return
  modalError.value = ''
  isSaving.value = true
  try {
    await savePurchaseOrder(poForm.value, { markOrdered })
    showPoModal.value = false
    tab.value = markOrdered ? 'schedule' : 'orders'
    flash(markOrdered ? 'Purchase order placed.' : 'Draft saved.')
    await loadAll(true)
  } catch (error) {
    modalError.value = error?.message || 'Failed to save purchase order.'
  } finally {
    isSaving.value = false
  }
}

function openDetail(o) {
  modalError.value = ''
  detail.value = o
}

async function placeOrder(po) {
  if (isSaving.value) return
  modalError.value = ''
  isSaving.value = true
  try {
    await setPurchaseOrderStatus(po.po_id, 'Ordered')
    detail.value = null
    flash('Purchase order placed.')
    await loadAll(true)
  } catch (error) {
    modalError.value = error?.message || 'Failed to place the order.'
  } finally {
    isSaving.value = false
  }
}

// ---- Receiving ----
const receiving = ref(null)

function openReceive(po) {
  modalError.value = ''
  const qty = {}
  po.items.forEach((i) => { if (i.quantity > i.received_qty) qty[i.po_item_id] = i.quantity - i.received_qty })
  receiving.value = { po, qty, date: today.value, note: '', close: false }
}

async function submitReceive() {
  if (isSaving.value) return
  modalError.value = ''
  const r = receiving.value
  const lines = Object.entries(r.qty).map(([id, q]) => ({ po_item_id: Number(id), qty: q === '' ? 0 : Number(q) }))
  if (lines.some((l) => !Number.isInteger(l.qty) || l.qty < 0)) {
    modalError.value = 'Quantities must be whole numbers, 0 or more.'
    return
  }
  isSaving.value = true
  try {
    const res = await receivePurchaseOrder(r.po.po_id, lines, { close: r.close, note: r.note, receivedDate: r.date })
    receiving.value = null
    detail.value = null
    flash(res?.status === 'Received' ? 'Delivery received. Order complete and inventory updated.' : 'Delivery recorded. The rest of the order is still open.')
    await loadAll(true)
  } catch (error) {
    modalError.value = error?.message || 'Failed to receive the delivery.'
  } finally {
    isSaving.value = false
  }
}

// ---- Confirmations ----
const confirmState = ref(null)
const askCancelPo = (po) => (confirmState.value = { title: 'Cancel this order?', message: `${po.po_number} will be marked cancelled. This cannot be undone.`, action: 'Cancel order', done: 'Order cancelled.', run: () => setPurchaseOrderStatus(po.po_id, 'Cancelled') })
const askDeletePo = (po) => (confirmState.value = { title: 'Delete this order?', message: `${po.po_number} will be permanently deleted.`, action: 'Delete', done: 'Order deleted.', run: () => deletePurchaseOrder(po.po_id) })
const askDeleteSupplier = (s) => (confirmState.value = { title: 'Delete this supplier?', message: `${s.supplier_name} will be permanently deleted. If it already has purchase orders, mark it inactive instead.`, action: 'Delete', done: 'Supplier deleted.', run: () => deleteSupplier(s.supplier_id) })

async function runConfirm() {
  const c = confirmState.value
  confirmState.value = null
  detail.value = null
  try {
    await c.run()
    flash(c.done)
  } catch (error) {
    pageError.value = error?.message
  }
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
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Suppliers', path: '/admin/suppliers', iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: wasteIcon },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: fleetIcon },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Admin / Owner-Manager only (route + onMounted already enforce this).
const navItems = computed(() => allNavItems)
</script>