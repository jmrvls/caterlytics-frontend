import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabaseClient'
import { getLowStockItems } from '../services/inventoryService'

// Shared, app-wide notification state: low-stock alerts + new booking alerts.
//
// Per the study's objective (1.2.2): "...performs automatic stock
// deductions, and generates low-stock notifications." This composable is
// the single source of truth for that alert so it stays consistent no
// matter which page (Admin/Staff) mounts it.
//
// New-booking alerts are an added enhancement on top of the manuscript's
// scope (not explicitly required there), so a client booking online shows
// up live on the Admin/Owner dashboard bell.
//
// Usage in any View:
//   import { useNotifications } from '../composables/useNotifications'
//   const { lowStockItems, newBookings, unreadCount, loading, markAllRead } = useNotifications()

const lowStockItems = ref([])
const newBookings = ref([]) // most recent first, capped
const loading = ref(true)
const stockUnreadCount = ref(0)
const bookingUnreadCount = ref(0)
const unreadCount = ref(0) // combined, for the bell badge
const seenIds = new Set() // low-stock item ids already "read"
const seenBookingIds = new Set() // booking ids already "read"
let stockChannel = null
let bookingChannel = null
let subscriberCount = 0

function recomputeUnread() {
  unreadCount.value = stockUnreadCount.value + bookingUnreadCount.value
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

function markAllRead() {
  lowStockItems.value.forEach((i) => seenIds.add(i.item_id))
  stockUnreadCount.value = 0
  newBookings.value.forEach((b) => seenBookingIds.add(b.booking_id))
  bookingUnreadCount.value = 0
  recomputeUnread()
}

export function useNotifications() {
  onMounted(() => {
    subscriberCount++
    refreshStock()

    // Only one Realtime channel of each kind needs to exist app-wide;
    // every component using this composable shares them.
    if (!stockChannel) {
      stockChannel = supabase
        .channel('inventory-stock-alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tbl_inventory' },
          () => refreshStock()
        )
        .subscribe()
    }

    // Scope the feed to the logged-in user's own business -- without this,
    // every Admin/Owner across every tenant would get pinged for every
    // OTHER business's bookings too (and, worse, if RLS doesn't separately
    // allow it, the event may just silently never arrive at all).
    let storedUser = null
    try {
      storedUser = JSON.parse(sessionStorage.getItem('user'))
    } catch {
      storedUser = null
    }
    const businessId = storedUser?.business_id || null

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
      if (stockChannel) {
        supabase.removeChannel(stockChannel)
        stockChannel = null
      }
      if (bookingChannel) {
        supabase.removeChannel(bookingChannel)
        bookingChannel = null
      }
    }
  })

  return {
    lowStockItems,
    newBookings,
    unreadCount,
    stockUnreadCount,
    bookingUnreadCount,
    loading,
    markAllRead,
    refresh: refreshStock,
  }
}