import { supabase } from '@/lib/supabase';

export interface DBNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// 1. READ: Fetch all notifications
export async function fetchNotifications(): Promise<DBNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}

// 2. CREATE: Add a new notification
export async function createNotification(
  title: string,
  message: string,
  link?: string
): Promise<DBNotification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ title, message, link, is_read: false }])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  return data;
}

// 3. UPDATE: Mark a single notification as read
export async function markAsRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  return true;
}

// 3b. UPDATE: Mark all notifications as read
export async function markAllAsRead(): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
  return true;
}

// 4. DELETE: Delete a specific notification
export async function deleteNotification(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
  return true;
}