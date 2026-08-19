import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabaseClient'
import { getLowStockItems } from '../services/inventoryService'

// Shared, app-wide low-stock notification state.
//
// Per the study's objective (1.2.2): "...performs automatic stock
// deductions, and generates low-stock notifications." This composable is
// the single source of truth for that alert so it stays consistent no
// matter which page (Admin/Staff) mounts it.
//
// Usage in any View:
//   import { useNotifications } from '../composables/useNotifications'
//   const { lowStockItems, unreadCount, loading, markAllRead } = useNotifications()

const lowStockItems = ref([])
const loading = ref(true)
const unreadCount = ref(0)
const seenIds = new Set() // items already "read" so the badge doesn't nag forever
let channel = null
let subscriberCount = 0

async function refresh() {
  try {
    const items = await getLowStockItems()
    lowStockItems.value = items
    unreadCount.value = items.filter((i) => !seenIds.has(i.item_id)).length
  } catch (err) {
    console.error('Failed to load low-stock notifications:', err)
  } finally {
    loading.value = false
  }
}

function markAllRead() {
  lowStockItems.value.forEach((i) => seenIds.add(i.item_id))
  unreadCount.value = 0
}

export function useNotifications() {
  onMounted(() => {
    subscriberCount++
    refresh()

    // Only one Realtime channel needs to exist app-wide; every component
    // using this composable shares it.
    if (!channel) {
      channel = supabase
        .channel('inventory-stock-alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tbl_inventory' },
          () => refresh()
        )
        .subscribe()
    }
  })

  onUnmounted(() => {
    subscriberCount--
    if (subscriberCount <= 0 && channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  })

  return { lowStockItems, unreadCount, loading, markAllRead, refresh }
}