import { useState } from 'react';
import PageContentManager from '@/components/her-turn/admin/PageContentManager';
import EditionsManager from '@/components/her-turn/admin/EditionsManager';
import AttendeesDirectory from '@/components/her-turn/admin/AttendeesDirectory';
import CheckInScanner from '@/components/her-turn/admin/CheckInScanner';
import WaitlistManager from '@/components/her-turn/admin/WaitlistManager';
import NotificationsBroadcast from '@/components/her-turn/admin/NotificationsBroadcast';
import { FileText, Calendar, Users, QrCode, Clock, Bell } from 'lucide-react';

type Tab = 'content' | 'editions' | 'attendees' | 'checkin' | 'waitlist' | 'notifications';

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
  { id: 'content', label: 'Page Content', icon: FileText },
  { id: 'editions', label: 'Editions & Tickets', icon: Calendar },
  { id: 'attendees', label: 'Attendees', icon: Users },
  { id: 'checkin', label: 'Check-In Scanner', icon: QrCode },
  { id: 'waitlist', label: 'Waitlist', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function AdminHerTurn() {
  const [activeTab, setActiveTab] = useState<Tab>('editions');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-cocoa-700">Her Turn Management</h1>
        <p className="text-slate-600 text-sm mt-1">Page content, editions, ticketing, check-in, waitlist, and attendee communications — all in one place.</p>
      </div>

      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-sand-200 shadow-sm overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id ? 'bg-coral-600 text-white' : 'text-slate-600 hover:bg-sand-100'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'content' && <PageContentManager />}
        {activeTab === 'editions' && <EditionsManager />}
        {activeTab === 'attendees' && <AttendeesDirectory />}
        {activeTab === 'checkin' && <CheckInScanner />}
        {activeTab === 'waitlist' && <WaitlistManager />}
        {activeTab === 'notifications' && <NotificationsBroadcast />}
      </div>
    </div>
  );
}