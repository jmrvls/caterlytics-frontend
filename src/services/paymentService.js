import { supabase } from '../supabaseClient';

// Get all payment records (Admin/Staff/Owner see all, Client sees own via RLS)
export async function getAllPayments() {
  const { data, error } = await supabase
    .from('tbl_payments')
    .select(`
      payment_id,
      booking_id,
      total_amount,
      amount_paid,
      balance,
      payment_status,
      payment_date,
      tbl_bookings ( client_name, event_date, package_name )
    `)
    .order('payment_id', { ascending: false });

  if (error) throw new Error('Failed to fetch payments.');
  return data || [];
}

// Create a payment record for a booking (usually done once, when booking is confirmed)
export async function createPayment(paymentData) {
  const { data, error } = await supabase
    .from('tbl_payments')
    .insert([{
      booking_id: paymentData.booking_id,
      total_amount: paymentData.total_amount,
      amount_paid: paymentData.amount_paid || 0,
      payment_status: paymentData.amount_paid > 0 ? 'Partial' : 'Unpaid',
      payment_date: paymentData.amount_paid > 0 ? new Date().toISOString().slice(0, 10) : null,
    }])
    .select()
    .single();

  if (error) throw new Error('Failed to create payment record.');
  return { message: 'Payment record created', payment: data };
}

// Record an additional payment (e.g. client pays another installment)
export async function recordPayment(paymentId, additionalAmount) {
  const { data, error } = await supabase.rpc('record_payment', {
    p_payment_id: paymentId,
    p_additional_amount: additionalAmount,
  });

  if (error) throw new Error(error.message || 'Failed to record payment.');
  return { message: 'Payment recorded', payment: data };
}

export async function deletePayment(paymentId) {
  const { error } = await supabase.from('tbl_payments').delete().eq('payment_id', paymentId);
  if (error) throw new Error('Failed to delete payment record.');
  return { message: 'Payment record deleted' };
}