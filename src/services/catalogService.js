import { supabase } from '../supabaseClient';

// Event types the owner can choose from for a package.
export const PACKAGE_TYPES = ['Wedding', 'Birthday', 'Debut', 'Corporate', 'Christening', 'Anniversary', 'Fiesta / Community', 'Others'];

// Dietary tags for menu items. key = stored in the database, label = shown in the UI.
export const DIETARY_TAGS = [
  { key: 'vegetarian', label: 'Vegetarian', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { key: 'halal', label: 'Halal', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'spicy', label: 'Spicy', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
];

// ---------- 19 / 25: popularity + rating stats ----------
// Returns { packages: { [package_id]: {...} }, businesses: { [business_id]: {...} } }
export async function getCatalogStats() {
  const [pkg, biz] = await Promise.all([
    supabase.rpc('get_catalog_stats'),
    supabase.rpc('get_business_stats')
  ]);
  if (pkg.error) throw pkg.error;
  if (biz.error) throw biz.error;

  const packages = {};
  for (const r of pkg.data || []) {
    packages[r.package_id] = {
      booking_count: Number(r.booking_count) || 0,
      review_count: Number(r.review_count) || 0,
      avg_rating: r.avg_rating == null ? null : Number(r.avg_rating)
    };
  }
  const businesses = {};
  for (const r of biz.data || []) {
    businesses[r.business_id] = {
      booking_count: Number(r.booking_count) || 0,
      review_count: Number(r.review_count) || 0,
      avg_rating: r.avg_rating == null ? null : Number(r.avg_rating)
    };
  }
  return { packages, businesses };
}

// ---------- 20: photo gallery ----------
export async function getPackagePhotos(packageId) {
  const { data, error } = await supabase
    .from('tbl_package_photos')
    .select('photo_id, image_url, sort_order')
    .eq('package_id', packageId)
    .order('sort_order', { ascending: true })
    .order('photo_id', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Owner-side: upload a new photo to the gallery (uses the "avatars" bucket, like the other uploads).
export async function uploadPackagePhoto(ownerId, packageId, file) {
  const ext = file.name.split('.').pop();
  const filePath = `${ownerId}/package-${packageId}-gallery-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: false, cacheControl: '3600' });
  if (uploadError) throw new Error('Failed to upload photo.');

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const { data, error } = await supabase
    .from('tbl_package_photos')
    .insert({ package_id: packageId, image_url: pub.publicUrl })
    .select()
    .single();
  if (error) throw new Error('Failed to save photo.');
  return data;
}

export async function deletePackagePhoto(photoId) {
  const { error } = await supabase.from('tbl_package_photos').delete().eq('photo_id', photoId);
  if (error) throw new Error('Failed to delete photo.');
}

// ---------- 22: included / not included ----------
export async function getPackageInclusions(packageId) {
  const { data, error } = await supabase
    .from('tbl_package_inclusions')
    .select('inclusion_id, label, is_included, sort_order')
    .eq('package_id', packageId)
    .order('sort_order', { ascending: true })
    .order('inclusion_id', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Owner-side: replace the whole list. items = [{ label, is_included }]
export async function setPackageInclusions(packageId, items) {
  const clean = (items || [])
    .map((it, i) => ({ package_id: packageId, label: String(it.label || '').trim(), is_included: it.is_included !== false, sort_order: i }))
    .filter((it) => it.label);

  const { error: delErr } = await supabase.from('tbl_package_inclusions').delete().eq('package_id', packageId);
  if (delErr) throw new Error('Failed to update inclusions.');
  if (!clean.length) return [];

  const { data, error } = await supabase.from('tbl_package_inclusions').insert(clean).select();
  if (error) throw new Error('Failed to update inclusions.');
  return data || [];
}

// ---------- 21: menu item details (owner-side helper) ----------
export async function updateMenuItemDetails(itemId, { description, image_url, tags }) {
  const allowed = DIETARY_TAGS.map((t) => t.key);
  const { data, error } = await supabase
    .from('tbl_menu_items')
    .update({
      description: description || null,
      image_url: image_url || null,
      tags: (tags || []).filter((t) => allowed.includes(t))
    })
    .eq('item_id', itemId)
    .select()
    .single();
  if (error) throw new Error('Failed to update dish details.');
  return data;
}

export async function uploadMenuItemImage(ownerId, itemId, file) {
  const ext = file.name.split('.').pop();
  const filePath = `${ownerId}/menu-item-${itemId}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, cacheControl: '3600' });
  if (uploadError) throw new Error('Failed to upload image.');
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const image_url = `${pub.publicUrl}?t=${Date.now()}`;
  const { data, error } = await supabase
    .from('tbl_menu_items')
    .update({ image_url })
    .eq('item_id', itemId)
    .select()
    .single();
  if (error) throw new Error('Failed to save image.');
  return data;
}

// ---------- 24: business profile ----------
export async function getBusinessProfile(businessId) {
  const { data, error } = await supabase
    .from('tbl_business')
    .select('business_id, business_name, address, contact_number, contact_email, logo_url, about, opening_hours, policies')
    .eq('business_id', businessId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Owner-side: update the about / hours / policies of the owner's own business.
export async function updateBusinessProfile(businessId, { about, opening_hours, policies }) {
  const { data, error } = await supabase
    .from('tbl_business')
    .update({ about: about || null, opening_hours: opening_hours || null, policies: policies || null })
    .eq('business_id', businessId)
    .select()
    .maybeSingle();
  if (error) throw new Error('Failed to update business profile.');
  return data;
}

// ---------- 25: reviews ----------
export async function getBusinessReviews(businessId, limit = 50) {
  const { data, error } = await supabase.rpc('get_business_reviews', {
    p_business_id: businessId,
    p_limit: limit
  });
  if (error) throw error;
  return data || [];
}

export async function submitReview(bookingId, rating, comment) {
  const { data, error } = await supabase.rpc('submit_review', {
    p_booking_id: String(bookingId),
    p_rating: rating,
    p_comment: comment || null
  });
  if (error) throw new Error(error.message || 'Failed to submit review.');
  return data;
}

// Which booking IDs the current user has already reviewed (used to hide the "Rate" button).
export async function getMyReviewedBookingIds() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase.from('tbl_reviews').select('booking_id').eq('client_id', user.id);
  if (error) throw error;
  return new Set((data || []).map((r) => String(r.booking_id)));
}

// ---------- 26: favorites ----------
export async function getMyFavorites() {
  const [biz, pkg] = await Promise.all([
    supabase.from('tbl_favorite_businesses').select('business_id'),
    supabase.from('tbl_favorite_packages').select('package_id')
  ]);
  if (biz.error) throw biz.error;
  if (pkg.error) throw pkg.error;
  return {
    businesses: new Set((biz.data || []).map((r) => r.business_id)),
    packages: new Set((pkg.data || []).map((r) => r.package_id))
  };
}

export async function setFavoriteBusiness(businessId, on) {
  if (on) {
    const { error } = await supabase.from('tbl_favorite_businesses').insert({ business_id: businessId });
    if (error && error.code !== '23505') throw new Error('Failed to save favorite.');
  } else {
    const { error } = await supabase.from('tbl_favorite_businesses').delete().eq('business_id', businessId);
    if (error) throw new Error('Failed to remove favorite.');
  }
}

export async function setFavoritePackage(packageId, on) {
  if (on) {
    const { error } = await supabase.from('tbl_favorite_packages').insert({ package_id: packageId });
    if (error && error.code !== '23505') throw new Error('Failed to save favorite.');
  } else {
    const { error } = await supabase.from('tbl_favorite_packages').delete().eq('package_id', packageId);
    if (error) throw new Error('Failed to remove favorite.');
  }
}