import { supabase } from '../supabaseClient';

// Admin / Owner-Manager only (enforced by RLS on tbl_expenses).
export async function getAllExpenses() {
  const { data, error } = await supabase
    .from('tbl_expenses')
    .select('expense_id, description, category, amount, expense_date, created_at')
    .order('expense_date', { ascending: false });

  if (error) throw new Error('Failed to fetch expenses.');
  return data || [];
}

export async function createExpense(expenseData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const { data, error } = await supabase
    .from('tbl_expenses')
    .insert({
      description: expenseData.description,
      category: expenseData.category || 'Other',
      amount: expenseData.amount,
      expense_date: expenseData.expense_date,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to save expense.');
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('tbl_expenses')
    .delete()
    .eq('expense_id', id);

  if (error) throw new Error('Failed to delete expense.');
  return { message: 'Expense deleted successfully' };
}