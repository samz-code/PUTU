export type UserRole = 'customer' | 'admin' | 'hotel' | 'restaurant' | 'driver' | 'guide';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Quote & Booking Statuses matching Putu's operational pipeline
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'revision_requested';
export type BookingStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';