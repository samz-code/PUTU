import { supabase } from '@/lib/supabase';

export type NotifType = 
  | 'booking' 
  | 'payment' 
  | 'document' 
  | 'trip' 
  | 'experience' 
  | 'partner_alert' 
  | 'system';

interface SendNotificationParams {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
}

/**
 * Send a real-time notification directly to a target client.
 */
export async function sendClientNotification({
  userId,
  type,
  title,
  body,
}: SendNotificationParams) {
  try {
    const { data, error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        type,
        title,
        body,
        is_read: false,
      },
    ]);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to dispatch client notification:', err);
    return { success: false, error: err };
  }
}