import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [vipLevel, setVipLevel] = useState('Standard');
  const [notes, setNotes] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('customers').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
        setNationality(data.nationality ?? '');
        setVipLevel(data.vip_level ?? 'Standard');
        setNotes(data.notes ?? '');
        setDateOfBirth(data.date_of_birth ?? '');
        setPassportNumber(data.passport_number ?? '');
        setDietaryRequirements(data.dietary_requirements ?? '');
        setEmergencyContactName(data.emergency_contact_name ?? '');
        setEmergencyContactPhone(data.emergency_contact_phone ?? '');
      }
      setLoading(false);
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('customers').upsert({
      user_id: user.id,
      full_name: fullName,
      phone,
      nationality,
      notes,
      date_of_birth: dateOfBirth || null,
      passport_number: passportNumber || null,
      dietary_requirements: dietaryRequirements || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) return <p className="text-base text-slate-400">Loading...</p>;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your personal and travel information" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-coral-50 flex items-center justify-center mx-auto mb-3">
            <span className="font-serif text-2xl font-semibold text-coral-600">{fullName.charAt(0) || 'G'}</span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-cocoa-700">{fullName || 'Guest'}</h3>
          <p className="text-base text-slate-500">{user?.email}</p>
          <span className="badge-teal mt-3">{vipLevel} Member</span>
        </div>
        <div className="lg:col-span-2">
          <form onSubmit={save} className="card-md p-6 space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Phone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Nationality</label>
                <input className="input" value={nationality} onChange={(e) => setNationality(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div>
                <label className="label">Passport Number</label>
                <input className="input" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="For travel documents" />
              </div>
            </div>
            <div>
              <label className="label">Dietary Requirements</label>
              <input className="input" value={dietaryRequirements} onChange={(e) => setDietaryRequirements(e.target.value)} placeholder="Allergies, preferences, restrictions" />
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-serif text-base font-semibold text-cocoa-700 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Contact Name</label>
                  <input className="input" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Contact Phone</label>
                  <input className="input" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any preferences we should know" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
              {saved && <span className="text-sm text-teal-600">Saved successfully</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
