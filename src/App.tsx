import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import PublicLayout from '@/components/PublicLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import GlobalWhatsApp from '@/components/GlobalWhatsApp';

// Public Pages
import Home from '@/pages/public/Home';
import Experiences from '@/pages/public/Experiences';
import Accommodation from '@/pages/public/Accommodation';
import Transfers from '@/pages/public/Transfers';
import Concierge from '@/pages/public/Concierge';
import Destinations from '@/pages/public/Destinations';
import About from '@/pages/public/About';
import Partners from '@/pages/public/Partners';
import Contact from '@/pages/public/Contact';
import Privacy from '@/pages/public/Privacy';
import Terms from '@/pages/public/Terms';
import Sitemap from '@/pages/public/Sitemap';
import Journal from '@/pages/public/Journal';
import JournalArticleDetail from '@/pages/public/JournalArticleDetail';
import HerTurn from '@/pages/public/HerTurn';
import HerTurnEditionDetail from '@/pages/public/HerTurnEditionDetail';
import HerTurnCheckout from '@/pages/public/HerTurnCheckout';
import HerTurnConfirmation from '@/pages/public/HerTurnConfirmation';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Planner
import JourneyPlanner from '@/pages/planner/JourneyPlanner';

// Customer Portal
import PortalLayout from '@/pages/portal/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';
import Trips from '@/pages/portal/Trips';
import Bookings from '@/pages/portal/Bookings';
import Itineraries from '@/pages/portal/Itineraries';
import Payments from '@/pages/portal/Payments';
import Documents from '@/pages/portal/Documents';
import Messages from '@/pages/portal/Messages';
import Notifications from '@/pages/portal/Notifications';
import Wishlist from '@/pages/portal/Wishlist';
import Profile from '@/pages/portal/Profile';

// Admin Portal
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminHomeContent from '@/pages/admin/AdminHomeContent';
import AdminAbout from '@/pages/admin/AdminAbout';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminBriefs from '@/pages/admin/AdminBriefs';
import AdminPlanner from '@/pages/admin/AdminPlanner'; // <-- Newly added import
import AdminQuotes from '@/pages/admin/AdminQuotes';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminHotels from '@/pages/admin/AdminHotels';
import AdminRestaurants from '@/pages/admin/AdminRestaurants';
import AdminDrivers from '@/pages/admin/AdminDrivers';
import AdminGuides from '@/pages/admin/AdminGuides';
import AdminTransfers from '@/pages/admin/AdminTransfers';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminCalendar from '@/pages/admin/AdminCalendar';
import AdminDocuments from '@/pages/admin/AdminDocuments';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminSuper from '@/pages/admin/AdminSuper';
import AdminExperiences from '@/pages/admin/AdminExperiences';
import AdminAccommodations from '@/pages/admin/AdminAccomodations';
import AdminPartners from '@/pages/admin/AdminPartners';
import AdminConcierge from '@/pages/admin/AdminConcierge';
import AdminDestinations from '@/pages/admin/AdminDestinations';
import AdminJournal from '@/pages/admin/AdminJournal';
import AdminHerTurn from '@/pages/admin/AdminHerTurn';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminSubscribers from '@/pages/admin/AdminSubscribers';

// Partner Portals
import HotelLayout from '@/pages/partner/hotel/HotelLayout';
import HotelDashboard from '@/pages/partner/hotel/HotelDashboard';
import HotelRooms from '@/pages/partner/hotel/HotelRooms';
import HotelAvailability from '@/pages/partner/hotel/HotelAvailability';
import HotelReservations from '@/pages/partner/hotel/HotelReservations';
import HotelPayments from '@/pages/partner/hotel/HotelPayments';

import RestaurantLayout from '@/pages/partner/restaurant/RestaurantLayout';
import RestaurantDashboard from '@/pages/partner/restaurant/RestaurantDashboard';
import RestaurantReservations from '@/pages/partner/restaurant/RestaurantReservations';
import RestaurantPayments from '@/pages/partner/restaurant/RestaurantPayments';

import DriverLayout from '@/pages/partner/driver/DriverLayout';
import DriverDashboard from '@/pages/partner/driver/DriverDashboard';
import DriverTrips from '@/pages/partner/driver/DriverTrips';
import DriverVehicle from '@/pages/partner/driver/DriverVehicle';
import DriverPayments from '@/pages/partner/driver/DriverPayments';

import GuideLayout from '@/pages/partner/guide/GuideLayout';
import GuideDashboard from '@/pages/partner/guide/GuideDashboard';
import GuideAssignments from '@/pages/partner/guide/GuideAssignments';
import GuideRatings from '@/pages/partner/guide/GuideRatings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <GlobalWhatsApp />
        <Routes>
          {/* Public website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/accommodation" element={<Accommodation />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/concierge" element={<Concierge />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/about" element={<About />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalArticleDetail />} />

            {/* Her Turn */}
            <Route path="/her-turn" element={<HerTurn />} />
            <Route path="/her-turn/confirmation" element={<HerTurnConfirmation />} />
            <Route path="/her-turn/:slug/checkout" element={<HerTurnCheckout />} />
            <Route path="/her-turn/:slug" element={<HerTurnEditionDetail />} />

            <Route path="/contact" element={<Contact />} />

            {/* Legal / Site info */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/sitemap" element={<Sitemap />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Journey Planner */}
          <Route path="/planner" element={<JourneyPlanner />} />

          {/* Customer Portal */}
          <Route path="/portal" element={<ProtectedRoute roles={['customer']}><PortalLayout /></ProtectedRoute>}>
            <Route index element={<PortalDashboard />} />
            <Route path="trips" element={<Trips />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="itineraries" element={<Itineraries />} />
            <Route path="payments" element={<Payments />} />
            <Route path="documents" element={<Documents />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="home-content" element={<AdminHomeContent />} />
            <Route path="about" element={<AdminAbout />} />
            <Route path="destinations" element={<AdminDestinations />} />
            <Route path="experiences" element={<AdminExperiences />} />
            <Route path="accommodations" element={<AdminAccommodations />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="concierge" element={<AdminConcierge />} />
            <Route path="journal" element={<AdminJournal />} />
            <Route path="her-turn" element={<AdminHerTurn />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="briefs" element={<AdminBriefs />} />
            <Route path="planner-admin" element={<AdminPlanner />} /> {/* <-- Newly added route */}
            <Route path="quotes" element={<AdminQuotes />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="hotels" element={<AdminHotels />} />
            <Route path="restaurants" element={<AdminRestaurants />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="guides" element={<AdminGuides />} />
            <Route path="transfers" element={<AdminTransfers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="super" element={<AdminSuper />} />
            <Route path="newsletter" element={<AdminSubscribers />} />
          </Route>

          {/* Partner Portals */}
          <Route path="/partner/hotel" element={<ProtectedRoute roles={['hotel']}><HotelLayout /></ProtectedRoute>}>
            <Route index element={<HotelDashboard />} />
            <Route path="rooms" element={<HotelRooms />} />
            <Route path="availability" element={<HotelAvailability />} />
            <Route path="reservations" element={<HotelReservations />} />
            <Route path="payments" element={<HotelPayments />} />
          </Route>

          <Route path="/partner/restaurant" element={<ProtectedRoute roles={['restaurant']}><RestaurantLayout /></ProtectedRoute>}>
            <Route index element={<RestaurantDashboard />} />
            <Route path="reservations" element={<RestaurantReservations />} />
            <Route path="payments" element={<RestaurantPayments />} />
          </Route>

          <Route path="/partner/driver" element={<ProtectedRoute roles={['driver']}><DriverLayout /></ProtectedRoute>}>
            <Route index element={<DriverDashboard />} />
            <Route path="trips" element={<DriverTrips />} />
            <Route path="vehicle" element={<DriverVehicle />} />
            <Route path="payments" element={<DriverPayments />} />
          </Route>

          <Route path="/partner/guide" element={<ProtectedRoute roles={['guide']}><GuideLayout /></ProtectedRoute>}>
            <Route index element={<GuideDashboard />} />
            <Route path="assignments" element={<GuideAssignments />} />
            <Route path="ratings" element={<GuideRatings />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}