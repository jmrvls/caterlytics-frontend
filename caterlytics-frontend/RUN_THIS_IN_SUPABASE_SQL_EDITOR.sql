-- Prevents the same booking from being texted (and charged) twice.
alter table public.tbl_bookings
  add column if not exists confirmation_sms_sent_at timestamptz;
