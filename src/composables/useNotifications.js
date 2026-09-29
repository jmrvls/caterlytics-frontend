import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabaseClient'
import { getLowStockItems } from '../services/inventoryService'
import { getMyAssignedBookings } from '../services/staffassignmentservice'

// Shared, app-wide notification state: low-stock alerts + new booking alerts
// (Admin/Owner), and event-assignment alerts (Staff).
//
// Per the study's objective (1.2.2): "...performs automatic stock
// deductions, and generates low-stock notifications." This composable is
// the single source of truth for that alert so it stays consistent no
// matter which page (Admin/Owner) mounts it.
//
// New-booking alerts and the Staff assignment feed are both added
// enhancements on top of the manuscript's Use Case Diagram (Figure 3) scope
// (not explicitly required there): a client booking online shows up live on
// the Admin/Owner dashboard bell, and a Staff member sees it the moment
// they're assigned to an event.
//
// Usage in any View:
//   import { useNotifications } from '../composables/useNotifications'
//   const { lowStockItems, newBookings, myAssignments, unreadCount, loading, markAllRead } = useNotifications()

const lowStockItems = ref([])
const newBookings = ref([]) // most recent first, capped
const myAssignments = ref([]) // Staff-only: events they've just been assigned to
const pendingBusinesses = ref([]) // Super-Admin-only: businesses awaiting approval
const loading = ref(true)
const stockUnreadCount = ref(0)
const bookingUnreadCount = ref(0)
const assignmentUnreadCount = ref(0)
const pendingBusinessUnreadCount = ref(0)
const unreadCount = ref(0) // combined, for the bell badge
const seenIds = new Set() // low-stock item ids already "read"
const seenBookingIds = new Set() // booking ids already "read"
const seenAssignmentIds = new Set() // booking_ids already "read"
const seenPendingBusinessIds = new Set() // business_ids already "read"
let stockChannel = null
let bookingChannel = null
let assignmentChannel = null
let pendingBusinessChannel = null
let pendingBusinessPollTimer = null
let subscriberCount = 0

// The refs/Sets above are module-level (shared app-wide), so they survive
// logout -> login inside the same tab (SPA, no page reload). Without a reset,
// a Super Admin logging in after an Admin would still see that Admin's
// leftover "X just booked" alerts and unread badge. Wipe everything whenever
// the logged-in user changes.
let lastUserKey = null
let currentUserId = null

// "Read" state for Super Admin's pending-business alerts lives in
// localStorage (per user) so a page refresh doesn't bring the red badge back
// for businesses that were already marked read.
const seenPendingStorageKey = () => `caterlytics:seenPendingBusinesses:${currentUserId || 'anon'}`
function loadSeenPending() {
  seenPendingBusinessIds.clear()
  try {
    const raw = JSON.parse(localStorage.getItem(seenPendingStorageKey()) || '[]')
    if (Array.isArray(raw)) raw.forEach((id) => seenPendingBusinessIds.add(id))
  } catch { /* storage unavailable or corrupted -- start empty */ }
}
function saveSeenPending() {
  try {
    localStorage.setItem(seenPendingStorageKey(), JSON.stringify([...seenPendingBusinessIds]))
  } catch { /* ignore quota / private-mode errors */ }
}
function resetNotificationState() {
  lowStockItems.value = []
  newBookings.value = []
  myAssignments.value = []
  pendingBusinesses.value = []
  stockUnreadCount.value = 0
  bookingUnreadCount.value = 0
  assignmentUnreadCount.value = 0
  pendingBusinessUnreadCount.value = 0
  unreadCount.value = 0
  loading.value = true
  seenIds.clear()
  seenBookingIds.clear()
  seenAssignmentIds.clear()
  seenPendingBusinessIds.clear()
}

// Call on logout so the next person to log in on this tab starts clean.
export function resetNotifications() {
  resetNotificationState()
  lastUserKey = null
}

function recomputeUnread() {
  unreadCount.value = stockUnreadCount.value + bookingUnreadCount.value
    + assignmentUnreadCount.value + pendingBusinessUnreadCount.value
}

// Super-Admin-only feed: "a new business is waiting for your approval."
// Polls get_platform_businesses() (a SECURITY DEFINER RPC every Super Admin
// call can already reach) on an interval AND listens for Realtime inserts on
// tbl_business directly -- the poll is the reliable path (works regardless
// of RLS/Realtime config), the channel just makes it feel instant when it's
// available. Either path alone is enough for the badge to stay correct.
async function refreshPendingBusinesses() {
  try {
    const { getPlatformBusinesses } = await import('../services/superAdminService')
    const rows = await getPlatformBusinesses()
    const pending = rows.filter((b) => b.status === 'Pending')
    pendingBusinesses.value = pending
    pendingBusinessUnreadCount.value = pending.filter((b) => !seenPendingBusinessIds.has(b.business_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load pending-business notifications:', err)
  } finally {
    loading.value = false
  }
}

// Staff-only feed: "you've been put on this event." Staff has no Bookings
// or Inventory page (see NotificationBell), so those two feeds above are
// dead-ends for them -- this is the one alert that's actually theirs.
function pushNewAssignment(booking) {
  if (!booking) return
  myAssignments.value = [booking, ...myAssignments.value].slice(0, 10)
  assignmentUnreadCount.value = myAssignments.value.filter((b) => !seenAssignmentIds.has(b.booking_id)).length
  recomputeUnread()
}

// A confirmed booking deducts many ingredients at once -> many realtime
// events in a burst. Debounce so we refetch once instead of once per row.
let stockRefreshTimer = null
function scheduleStockRefresh() {
  clearTimeout(stockRefreshTimer)
  stockRefreshTimer = setTimeout(refreshStock, 400)
}

async function refreshStock() {
  try {
    const items = await getLowStockItems()
    lowStockItems.value = items
    stockUnreadCount.value = items.filter((i) => !seenIds.has(i.item_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load low-stock notifications:', err)
  } finally {
    loading.value = false
  }
}

// Adds a freshly-inserted booking row to the live feed (via the Realtime
// INSERT event below).
function pushNewBooking(booking) {
  newBookings.value = [booking, ...newBookings.value].slice(0, 10)
  bookingUnreadCount.value = newBookings.value.filter((b) => !seenBookingIds.has(b.booking_id)).length
  recomputeUnread()
}

// Initial load: bookings that are still Pending, regardless of whether
// they were created before or after the bell mounted. Without this, a
// booking made while nobody had the dashboard open (e.g. overnight, or
// before this browser session started) would never surface -- Realtime
// only reports inserts that happen *while* subscribed, not what already
// exists. RLS ("staff view own business bookings") already scopes this
// to the caller's own business, same as everywhere else.
async function refreshBookings() {
  try {
    const { data, error } = await supabase
      .from('tbl_bookings')
      .select('booking_id, client_name, event_date, guest_count, booking_status, created_at')
      .eq('booking_status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    newBookings.value = data || []
    bookingUnreadCount.value = newBookings.value.filter((b) => !seenBookingIds.has(b.booking_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load booking notifications:', err)
  }
}

// Initial load for the Staff feed: their own currently-upcoming assigned
// events (Pending/Confirmed), so the bell isn't empty on first login and
// only genuinely-new inserts after that count as "unread".
async function refreshAssignments() {
  try {
    const rows = await getMyAssignedBookings()
    myAssignments.value = rows
    assignmentUnreadCount.value = rows.filter((b) => !seenAssignmentIds.has(b.booking_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load your assigned events:', err)
  } finally {
    loading.value = false
  }
}

function markAllRead() {
  lowStockItems.value.forEach((i) => seenIds.add(i.item_id))
  stockUnreadCount.value = 0
  newBookings.value.forEach((b) => seenBookingIds.add(b.booking_id))
  bookingUnreadCount.value = 0
  myAssignments.value.forEach((b) => seenAssignmentIds.add(b.booking_id))
  assignmentUnreadCount.value = 0
  pendingBusinesses.value.forEach((b) => seenPendingBusinessIds.add(b.business_id))
  saveSeenPending()
  pendingBusinessUnreadCount.value = 0
  recomputeUnread()
}

export function useNotifications() {
  onMounted(() => {
    subscriberCount++

    let storedUser = null
    try {
      storedUser = JSON.parse(sessionStorage.getItem('user'))
    } catch {
      storedUser = null
    }
    const businessId = storedUser?.business_id || null
    const isStaff = storedUser?.role === 'Staff'
    const isSuperAdmin = storedUser?.role === 'Super Admin'

    const userKey = `${storedUser?.user_id || storedUser?.id || storedUser?.email || 'anon'}:${storedUser?.role || ''}`
    if (lastUserKey !== null && lastUserKey !== userKey) {
      resetNotificationState()
    }
    lastUserKey = userKey
    currentUserId = storedUser?.user_id || storedUser?.id || null

    // Super Admin has no business_id of their own -- no inventory, no
    // bookings -- so the tenant feeds below don't apply to them either.
    // Their one alert is "a new business just registered and needs review."
    if (isSuperAdmin) {
      loadSeenPending()
      newBookings.value = []
      lowStockItems.value = []
      bookingUnreadCount.value = 0
      stockUnreadCount.value = 0
      recomputeUnread()
      refreshPendingBusinesses()

      if (!pendingBusinessPollTimer) {
        pendingBusinessPollTimer = setInterval(refreshPendingBusinesses, 20000)
      }

      // Best-effort: requires the "super admin view all businesses" SELECT
      // policy on tbl_business so Realtime can see the row. The poll above
      // keeps the badge correct even if that policy isn't present yet.
      if (!pendingBusinessChannel) {
        pendingBusinessChannel = supabase
          .channel('super-admin-new-businesses')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tbl_business' },
            () => refreshPendingBusinesses()
          )
          .subscribe()
      }
      return
    }

    // Staff has no Bookings or Inventory page (see NotificationBell), so the
    // low-stock/new-booking feeds below are dead-ends for them. They get
    // their own feed instead: "you've been assigned to this event." Beyond
    // the manuscript's Use Case Diagram (Figure 3) scope for Staff, same as
    // the "My Assigned Events" dashboard card this mirrors.
    if (isStaff) {
      refreshAssignments()

      if (!assignmentChannel) {
        supabase.auth.getUser().then(({ data }) => {
          const staffId = data?.user?.id
          if (!staffId || assignmentChannel) return
          assignmentChannel = supabase
            .channel('my-event-assignments')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'tbl_booking_staff',
                filter: `staff_id=eq.${staffId}`,
              },
              async (payload) => {
                const { data: booking } = await supabase
                  .from('tbl_bookings')
                  .select('booking_id, client_name, event_date, event_time, event_location, booking_status')
                  .eq('booking_id', payload.new.booking_id)
                  .single()
                pushNewAssignment(booking)
              }
            )
            .subscribe()
        })
      }
      return
    }

    refreshStock()

    // Only one Realtime channel of each kind needs to exist app-wide;
    // every component using this composable shares them.
    if (!stockChannel) {
      stockChannel = supabase
        .channel('inventory-stock-alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tbl_inventory' },
          () => scheduleStockRefresh()
        )
        .subscribe()
    }

    // Scope the feed to the logged-in user's own business -- without this,
    // every Admin/Owner across every tenant would get pinged for every
    // OTHER business's bookings too (and, worse, if RLS doesn't separately
    // allow it, the event may just silently never arrive at all).
    if (businessId) {
      refreshBookings()
    }

    if (!bookingChannel && businessId) {
      bookingChannel = supabase
        .channel('new-booking-alerts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tbl_bookings',
            filter: `business_id=eq.${businessId}`,
          },
          (payload) => pushNewBooking(payload.new)
        )
        .subscribe()
    }
  })

  onUnmounted(() => {
    subscriberCount--
    if (subscriberCount <= 0) {
      clearTimeout(stockRefreshTimer)
      if (stockChannel) {
        supabase.removeChannel(stockChannel)
        stockChannel = null
      }
      if (bookingChannel) {
        supabase.removeChannel(bookingChannel)
        bookingChannel = null
      }
      if (assignmentChannel) {
        supabase.removeChannel(assignmentChannel)
        assignmentChannel = null
      }
      if (pendingBusinessChannel) {
        supabase.removeChannel(pendingBusinessChannel)
        pendingBusinessChannel = null
      }
      if (pendingBusinessPollTimer) {
        clearInterval(pendingBusinessPollTimer)
        pendingBusinessPollTimer = null
      }
    }
  })

  return {
    lowStockItems,
    newBookings,
    myAssignments,
    pendingBusinesses,
    unreadCount,
    stockUnreadCount,
    bookingUnreadCount,
    assignmentUnreadCount,
    pendingBusinessUnreadCount,
    loading,
    markAllRead,
    refresh: refreshStock,
  }
}