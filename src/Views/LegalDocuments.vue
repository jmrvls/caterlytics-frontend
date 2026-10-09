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
          :class="item.name === 'Legal Documents' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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
          <span
            v-if="item.name === 'Feedback & Ratings' && reviewPending"
            :class="sidebarExpanded ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[16px] h-4 px-1'"
            class="rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
          >{{ reviewPending > 99 ? '99+' : reviewPending }}</span>
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
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Legal Documents</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Upload and manage catering agreements, permits and compliance documents.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="hidden lg:block"><NotificationBell /></div>
            <button @click="openUpload()" :disabled="setupMissing" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Document
            </button>
          </div>
        </div>

        <!-- Not set up yet -->
        <div v-if="setupMissing" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
          Legal document handling needs a one-time database setup. Open the Supabase SQL Editor and run <span class="font-mono font-semibold">legal_documents.sql</span>, then refresh this page.
        </div>
        <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">{{ pageError }}</div>
        <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">{{ successMessage }}</div>

        <div v-if="isLoading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading documents...</div>

        <template v-else-if="!setupMissing">
          <!-- Renewal alert -->
          <div v-if="summary.expired || summary.expiring" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
            <span v-if="summary.expired" class="font-semibold">{{ summary.expired }} expired</span>
            <span v-if="summary.expired && summary.expiring"> and </span>
            <span v-if="summary.expiring" class="font-semibold">{{ summary.expiring }} expiring within {{ EXPIRY_WARN_DAYS }} days</span>
            — renew these before your next event so you stay compliant.
            <button @click="statusFilter = summary.expired ? 'expired' : 'expiring'" class="underline font-semibold ml-1">Show</button>
          </div>

          <!-- License compliance (verified by the platform admin) -->
          <div v-if="verificationReady" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 mb-6">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 class="font-bold text-gray-800 dark:text-gray-100">License compliance</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Upload each required license, add its number, then submit it for verification by the platform admin.</p>
              </div>
              <span :class="compliance.compliant ? LICENSE_STATE_UI.verified.cls : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'" class="px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                {{ compliance.compliant ? 'Fully compliant' : `${compliance.verified} of ${compliance.total} required licenses verified` }}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-for="item in compliance.items" :key="item.type" class="flex items-start justify-between gap-2 border border-gray-100 dark:border-gray-700 px-3 py-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ item.type }}</p>
                  <p v-if="item.state === 'rejected' && item.doc?.verification_note" class="text-xs text-red-600 dark:text-red-400 break-words">{{ item.doc.verification_note }}</p>
                  <p v-else-if="item.state === 'missing'" class="text-xs text-gray-400 dark:text-gray-500">Upload this document below.</p>
                  <p v-else-if="item.state === 'unsubmitted'" class="text-xs text-gray-400 dark:text-gray-500">Uploaded — submit it for verification.</p>
                  <p v-else-if="item.state === 'expired'" class="text-xs text-gray-400 dark:text-gray-500">Renew and upload the new one.</p>
                </div>
                <span :class="LICENSE_STATE_UI[item.state].cls" class="px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ LICENSE_STATE_UI[item.state].label }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="verificationUnavailable" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
            License verification needs a one-time database setup. Run <span class="font-mono font-semibold">license_verification.sql</span> in the Supabase SQL Editor, then refresh this page.
          </div>

          <!-- Summary cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total documents</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ summary.total }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Valid</p>
              <p class="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ summary.valid + summary.none }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Expiring soon</p>
              <p class="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{{ summary.expiring }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Expired</p>
              <p class="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{{ summary.expired }}</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <input v-model="searchQuery" type="text" placeholder="Search title, party or reference no." class="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <select v-model="categoryFilter" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All categories</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
            <select v-model="statusFilter" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All statuses</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
              <option value="none">No expiry</option>
            </select>
          </div>

          <!-- Empty state -->
          <div v-if="!docs.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-16 px-4">
            <p class="font-semibold text-gray-800 dark:text-gray-100 mb-1">No documents yet</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload your business permits, client contracts and compliance certificates to keep them in one place.</p>
            <button @click="openUpload()" class="bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 transition">Upload your first document</button>
          </div>

          <div v-else class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <!-- Mobile cards -->
            <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              <p v-if="!filteredDocs.length" class="text-center py-8 text-sm text-gray-400 dark:text-gray-500">No documents match.</p>
              <div v-for="d in filteredDocs" :key="d.document_id" class="p-4">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="font-semibold text-gray-900 dark:text-gray-100 break-words">{{ d.title }}</p>
                  <span :class="STATUS_UI[docStatus(d)].cls" class="px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ STATUS_UI[docStatus(d)].label }}</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ d.doc_type }}<span v-if="d.party_name"> · {{ d.party_name }}</span></p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Expires: {{ formatDate(d.expiry_date) }} <span v-if="d.expiry_date">({{ expiryNote(d) }})</span></p>
                <div v-if="verificationReady && isLicenseType(d.doc_type)" class="mt-2">
                  <span :class="VERIFICATION_UI[verificationOf(d)].cls" class="inline-block px-2 py-0.5 text-xs font-semibold">{{ VERIFICATION_UI[verificationOf(d)].label }}</span>
                  <p v-if="verificationOf(d) === 'Rejected' && d.verification_note" class="text-xs text-red-600 dark:text-red-400 mt-1 break-words">{{ d.verification_note }}</p>
                  <button v-if="canSubmit(d)" @click="doSubmitVerification(d)" :disabled="verifyBusyId === d.document_id" class="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 disabled:opacity-50">{{ verificationOf(d) === 'Rejected' ? 'Resubmit' : 'Submit for verification' }}</button>
                  <button v-else-if="verificationOf(d) === 'Pending'" @click="doWithdrawVerification(d)" :disabled="verifyBusyId === d.document_id" class="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-50">Withdraw</button>
                </div>
                <div class="flex gap-3 mt-3 text-sm font-semibold">
                  <button @click="openFile(d)" class="text-emerald-700 dark:text-emerald-400">View</button>
                  <button @click="downloadFile(d)" class="text-gray-600 dark:text-gray-300">Download</button>
                  <button @click="openEdit(d)" class="text-gray-600 dark:text-gray-300">Edit</button>
                  <button @click="confirmDelete = d" class="text-red-600 dark:text-red-400">Delete</button>
                </div>
              </div>
            </div>

            <!-- Desktop table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th class="px-4 py-3 font-medium">Document</th>
                    <th class="px-4 py-3 font-medium">Type</th>
                    <th class="px-4 py-3 font-medium">Party / Ref. no.</th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">Issued</th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">Expires</th>
                    <th class="px-4 py-3 font-medium">Status</th>
                    <th v-if="verificationReady" class="px-4 py-3 font-medium">Verification</th>
                    <th class="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-if="!filteredDocs.length"><td :colspan="verificationReady ? 8 : 7" class="text-center py-8 text-gray-400 dark:text-gray-500">No documents match.</td></tr>
                  <tr v-for="d in filteredDocs" :key="d.document_id" class="text-gray-700 dark:text-gray-300 align-top">
                    <td class="px-4 py-3 max-w-xs">
                      <p class="font-medium text-gray-900 dark:text-gray-100 break-words">{{ d.title }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 truncate" :title="d.file_name">{{ d.file_name }} · {{ formatFileSize(d.file_size) }}</p>
                    </td>
                    <td class="px-4 py-3">{{ d.doc_type }}</td>
                    <td class="px-4 py-3">
                      <p>{{ d.party_name || '—' }}</p>
                      <p v-if="d.reference_no" class="text-xs text-gray-400 dark:text-gray-500">{{ d.reference_no }}</p>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(d.issue_date) }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      {{ formatDate(d.expiry_date) }}
                      <p v-if="d.expiry_date" class="text-xs text-gray-400 dark:text-gray-500">{{ expiryNote(d) }}</p>
                    </td>
                    <td class="px-4 py-3"><span :class="STATUS_UI[docStatus(d)].cls" class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ STATUS_UI[docStatus(d)].label }}</span></td>
                    <td v-if="verificationReady" class="px-4 py-3 max-w-[14rem]">
                      <template v-if="isLicenseType(d.doc_type)">
                        <span :class="VERIFICATION_UI[verificationOf(d)].cls" class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ VERIFICATION_UI[verificationOf(d)].label }}</span>
                        <p v-if="verificationOf(d) === 'Verified' && d.verified_at" class="text-xs text-gray-400 dark:text-gray-500 mt-1">on {{ formatDate(d.verified_at) }}</p>
                        <p v-if="verificationOf(d) === 'Rejected' && d.verification_note" class="text-xs text-red-600 dark:text-red-400 mt-1 break-words">{{ d.verification_note }}</p>
                        <button v-if="canSubmit(d)" @click="doSubmitVerification(d)" :disabled="verifyBusyId === d.document_id" class="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mt-1 disabled:opacity-50">{{ verificationOf(d) === 'Rejected' ? 'Resubmit' : 'Submit for verification' }}</button>
                        <button v-else-if="verificationOf(d) === 'Pending'" @click="doWithdrawVerification(d)" :disabled="verifyBusyId === d.document_id" class="block text-xs font-semibold text-gray-600 dark:text-gray-300 hover:underline mt-1 disabled:opacity-50">Withdraw</button>
                      </template>
                      <span v-else class="text-gray-400 dark:text-gray-500">—</span>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button @click="openFile(d)" class="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline mr-3">View</button>
                      <button @click="downloadFile(d)" class="text-gray-600 dark:text-gray-300 font-semibold hover:underline mr-3">Download</button>
                      <button @click="openEdit(d)" class="text-gray-600 dark:text-gray-300 font-semibold hover:underline mr-3">Edit</button>
                      <button @click="confirmDelete = d" class="text-red-600 dark:text-red-400 font-semibold hover:underline">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- UPLOAD / EDIT MODAL -->
    <div v-if="showModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="onBackdropClick"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ editing ? 'Edit Document' : 'Upload Document' }}</h3>

        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>
        <div v-if="modalHint" class="text-amber-600 dark:text-amber-400 text-sm font-medium mb-3">{{ modalHint }}</div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document title</label>
        <input v-model="form.title" type="text" maxlength="150" placeholder="e.g. Mayor's Permit 2026" class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document type</label>
        <select v-model="form.doc_type" class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="" disabled>Choose a type</option>
          <optgroup v-for="c in CATEGORIES" :key="c" :label="c">
            <option v-for="t in DOC_TYPES.filter((x) => x.category === c)" :key="t.value" :value="t.value">{{ t.value }}</option>
          </optgroup>
        </select>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party / issuer <span class="text-gray-400">(optional)</span></label>
            <input v-model="form.party_name" type="text" maxlength="120" placeholder="Client, supplier or agency" class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference no. <span class="text-gray-400">(optional)</span></label>
            <input v-model="form.reference_no" type="text" maxlength="80" placeholder="Permit / contract no." class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue date <span class="text-gray-400">(optional)</span></label>
            <input v-model="form.issue_date" type="date" class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry date <span class="text-gray-400">(optional)</span></label>
            <input v-model="form.expiry_date" type="date" :min="form.issue_date || undefined" class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes <span class="text-gray-400">(optional)</span></label>
        <textarea v-model="form.notes" rows="2" maxlength="500" placeholder="e.g. Renew at City Hall every January" class="mb-3 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>

        <p v-if="verificationReady && editing && isLicenseType(editing.doc_type) && verificationOf(editing) !== 'Unverified'" class="mb-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2">
          Changing the type, reference no., dates or file of a license that was already submitted resets it to "Not submitted" — you will need to submit it for verification again.
        </p>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File <span v-if="editing" class="text-gray-400">(leave empty to keep the current file)</span></label>
        <input ref="fileInput" type="file" :accept="ACCEPT_ATTR" @change="onFileChosen" class="w-full mb-1 text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:px-3 file:py-2 file:border-0 file:rounded-none file:bg-gray-100 dark:file:bg-gray-700 file:text-sm file:font-semibold file:text-gray-700 dark:file:text-gray-200" />
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-5">
          <template v-if="editing && !chosenFile">Current: {{ editing.file_name }} ({{ formatFileSize(editing.file_size) }}). </template>
          PDF, Word, JPG or PNG, up to 10 MB.
        </p>

        <div class="flex gap-3">
          <button @click="onCancelClick" :disabled="isSaving" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button @click="submitForm" :disabled="isSaving" class="flex-1 py-2.5 bg-emerald-600 text-white rounded-none text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">{{ isSaving ? (editing ? 'Saving...' : 'Uploading...') : (editing ? 'Save changes' : 'Upload') }}</button>
        </div>
      </div>
    </div>

    <!-- DISCARD CHANGES CONFIRM -->
    <div v-if="confirmDiscard" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="confirmDiscard = false"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Discard your changes?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-5">What you typed or chose will be lost.</p>
        <div class="flex gap-3">
          <button @click="confirmDiscard = false" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Keep editing</button>
          <button @click="discardAndClose" class="flex-1 py-2.5 bg-red-600 text-white rounded-none text-sm font-semibold hover:bg-red-700 transition">Discard</button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="confirmDelete" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="confirmDelete = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Delete document?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-5">"{{ confirmDelete.title }}" and its uploaded file will be permanently removed. This can't be undone.</p>
        <div class="flex gap-3">
          <button @click="confirmDelete = null" :disabled="isDeleting" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button @click="doDelete" :disabled="isDeleting" class="flex-1 py-2.5 bg-red-600 text-white rounded-none text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition">{{ isDeleting ? 'Deleting...' : 'Delete' }}</button>
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
import { useReviewAlerts } from '../composables/useReviewAlerts'
import { useRouter } from 'vue-router'
import {
  getLegalDocuments, uploadLegalDocument, updateLegalDocument,
  deleteLegalDocument, getDocumentUrl,
  submitLicenseForVerification, withdrawLicenseSubmission
} from '../services/legalDocumentService'
import {
  DOC_TYPES, CATEGORIES, STATUS_UI, EXPIRY_WARN_DAYS, ACCEPT_ATTR,
  docStatus, expiryNote, categoryOf, summarize, formatDate, formatFileSize,
  isLicenseType, verificationOf, VERIFICATION_UI, LICENSE_STATE_UI, complianceReport
} from '../utils/legaldocs'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
const { reviewPending } = useReviewAlerts()
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
const businessId = ref(null)

const docs = ref([])
const isLoading = ref(false)
const pageError = ref('')
const successMessage = ref('')
const setupMissing = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const editing = ref(null)
const isSaving = ref(false)
const modalError = ref('')
const chosenFile = ref(null)
const fileInput = ref(null)
const confirmDelete = ref(null)
const isDeleting = ref(false)
const emptyForm = () => ({ title: '', doc_type: '', party_name: '', reference_no: '', issue_date: '', expiry_date: '', notes: '' })
const form = ref(emptyForm())

// Unsaved-changes protection: a stray click on the dark backdrop used to close the
// modal and the next open wiped everything the user had typed.
const modalHint = ref('')
const confirmDiscard = ref(false)
let initialSnapshot = ''
let hintTimer = null
const snapshotForm = () => { initialSnapshot = JSON.stringify(form.value) }
const isDirty = computed(() => showModal.value && (JSON.stringify(form.value) !== initialSnapshot || !!chosenFile.value))

const summary = computed(() => summarize(docs.value))

// ---- License verification (compliance) ----
const verificationUnavailable = computed(() => docs.value.some((d) => d.verification_unavailable))
const verificationReady = computed(() => !setupMissing.value && !verificationUnavailable.value)
const compliance = computed(() => complianceReport(docs.value))
const verifyBusyId = ref(null)

// A license can be (re)submitted when it was never submitted, or was rejected,
// and it is not already expired.
function canSubmit(d) {
  return ['Unverified', 'Rejected'].includes(verificationOf(d)) && docStatus(d) !== 'expired'
}

async function changeVerification(d, action, okMessage) {
  pageError.value = ''
  verifyBusyId.value = d.document_id
  try {
    const updated = await action(d)
    docs.value = docs.value.map((x) => (x.document_id === updated.document_id ? updated : x))
    flash(okMessage)
  } catch (error) {
    pageError.value = error?.message || 'Could not update the verification status.'
    console.error(error)
  } finally {
    verifyBusyId.value = null
  }
}

const doSubmitVerification = (d) => changeVerification(d, submitLicenseForVerification, 'Submitted. The platform admin will review it.')
const doWithdrawVerification = (d) => changeVerification(d, withdrawLicenseSubmission, 'Submission withdrawn.')

const filteredDocs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return docs.value.filter((d) => {
    if (categoryFilter.value && categoryOf(d.doc_type) !== categoryFilter.value) return false
    if (statusFilter.value && docStatus(d) !== statusFilter.value) return false
    if (!q) return true
    return [d.title, d.party_name, d.reference_no, d.doc_type, d.file_name]
      .some((v) => (v || '').toLowerCase().includes(q))
  })
})

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  // Contracts and permits are sensitive: Admin / Owner-Manager only
  // (route guard in main.js and RLS in legal_documents.sql enforce the same).
  if (!['Admin', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  businessId.value = user.business_id || null

  loadDocs()
})

async function loadDocs() {
  isLoading.value = true
  pageError.value = ''
  setupMissing.value = false
  try {
    docs.value = await getLegalDocuments()
  } catch (error) {
    if (error?.code === 'LEGAL_NOT_SET_UP') setupMissing.value = true
    else pageError.value = error?.message || 'Failed to load documents.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function flash(message) {
  successMessage.value = message
  setTimeout(() => { if (successMessage.value === message) successMessage.value = '' }, 4000)
}

function openUpload() {
  editing.value = null
  form.value = emptyForm()
  chosenFile.value = null
  modalError.value = ''
  modalHint.value = ''
  confirmDiscard.value = false
  snapshotForm()
  showModal.value = true
}

function openEdit(d) {
  editing.value = d
  form.value = {
    title: d.title || '', doc_type: d.doc_type || '', party_name: d.party_name || '',
    reference_no: d.reference_no || '', issue_date: d.issue_date || '',
    expiry_date: d.expiry_date || '', notes: d.notes || ''
  }
  chosenFile.value = null
  modalError.value = ''
  modalHint.value = ''
  confirmDiscard.value = false
  snapshotForm()
  showModal.value = true
}

function closeModal() {
  if (isSaving.value) return
  showModal.value = false
}

// Click on the dark area outside the modal: only closes it if nothing was typed/chosen.
function onBackdropClick() {
  if (isSaving.value) return
  if (!isDirty.value) { closeModal(); return }
  modalHint.value = 'You have unsaved changes. Save them, or press Cancel to discard.'
  clearTimeout(hintTimer)
  hintTimer = setTimeout(() => { modalHint.value = '' }, 3500)
}

// Cancel button: asks first if there is something to lose.
function onCancelClick() {
  if (isSaving.value) return
  if (isDirty.value) { confirmDiscard.value = true; return }
  closeModal()
}

function discardAndClose() {
  confirmDiscard.value = false
  closeModal()
}

function onFileChosen(e) {
  chosenFile.value = e.target.files?.[0] || null
  // Pre-fill the title from the file name so uploads take one less step.
  if (chosenFile.value && !editing.value && !form.value.title.trim()) {
    form.value.title = chosenFile.value.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 150)
  }
}

async function submitForm() {
  modalError.value = ''
  isSaving.value = true
  try {
    if (editing.value) {
      const updated = await updateLegalDocument(editing.value, form.value, chosenFile.value, businessId.value)
      docs.value = docs.value.map((d) => (d.document_id === updated.document_id ? updated : d))
      flash('Document updated.')
    } else {
      const created = await uploadLegalDocument(businessId.value, form.value, chosenFile.value)
      docs.value = [created, ...docs.value]
      flash('Document uploaded.')
    }
    showModal.value = false
  } catch (error) {
    modalError.value = error?.message || 'Something went wrong.'
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

// Open the tab first (inside the click) so browsers don't block it as a popup
// while we wait for the signed URL.
async function openFile(d) {
  pageError.value = ''
  const tab = window.open('', '_blank')
  try {
    const url = await getDocumentUrl(d)
    if (tab) { tab.opener = null; tab.location.href = url } else window.location.href = url
  } catch (error) {
    if (tab) tab.close()
    pageError.value = error?.message || 'Could not open the file.'
  }
}

async function downloadFile(d) {
  pageError.value = ''
  try {
    const url = await getDocumentUrl(d, { download: true })
    const a = document.createElement('a')
    a.href = url
    a.download = d.file_name
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch (error) {
    pageError.value = error?.message || 'Could not download the file.'
  }
}

async function doDelete() {
  isDeleting.value = true
  pageError.value = ''
  try {
    await deleteLegalDocument(confirmDelete.value)
    docs.value = docs.value.filter((d) => d.document_id !== confirmDelete.value.document_id)
    confirmDelete.value = null
    flash('Document deleted.')
  } catch (error) {
    pageError.value = error?.message || 'Failed to delete the document.'
    confirmDelete.value = null
  } finally {
    isDeleting.value = false
  }
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

const legalIcon = 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
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
  { name: 'Legal Documents', path: '/admin/legal-documents', iconPath: legalIcon },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Admin / Owner-Manager only (route + onMounted already enforce this).
const navItems = computed(() => allNavItems)
</script>