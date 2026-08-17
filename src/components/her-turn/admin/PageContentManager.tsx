import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { HerTurnPageSettings } from '@/types/herTurn';
import { DEFAULT_HER_TURN_PAGE_SETTINGS } from '@/types/herTurn';
import { Save, CheckCircle2, AlertCircle, X, Eye } from 'lucide-react';

export default function PageContentManager() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState<HerTurnPageSettings>(DEFAULT_HER_TURN_PAGE_SETTINGS);
  const [checklistInput, setChecklistInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error: fetchError } = await supabase
        .from('her_turn_page_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettingsId(data.id);
        setForm({
          hero_badge_text: data.hero_badge_text ?? '',
          hero_title: data.hero_title ?? '',
          hero_subtitle: data.hero_subtitle ?? '',
          value_heading: data.value_heading ?? '',
          value_body: data.value_body ?? '',
          value_checklist: data.value_checklist || [],
          sisterhood_heading: data.sisterhood_heading ?? '',
          sisterhood_body: data.sisterhood_body ?? '',
          sisterhood_cta_text: data.sisterhood_cta_text ?? '',
          sisterhood_cta_link: data.sisterhood_cta_link ?? '',
        });
      } else {
        const { data: created, error: createError } = await supabase
          .from('her_turn_page_settings')
          .insert([DEFAULT_HER_TURN_PAGE_SETTINGS])
          .select()
          .single();

        if (createError) throw createError;
        setSettingsId(created.id);
      }
    } catch (err) {
      console.error('Error fetching page settings:', err);
      setError('Could not load page content. Ensure database migrations have been executed.');
    } finally {
      setLoading(false);
    }
  }

  function addChecklistItem() {
    const item = checklistInput.trim();
    if (!item) return;
    setForm(prev => ({ ...prev, value_checklist: [...prev.value_checklist, item] }));
    setChecklistInput('');
  }

  function removeChecklistItem(indexToRemove: number) {
    setForm(prev => ({
      ...prev,
      value_checklist: prev.value_checklist.filter((_, idx) => idx !== indexToRemove),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settingsId) return;

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const { error: saveError } = await supabase
        .from('her_turn_page_settings')
        .update(form)
        .eq('id', settingsId);

      if (saveError) throw saveError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving page settings:', err);
      setError('Failed to save settings. Please check network connectivity and permissions.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Loading page content...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-slate-600">
          Controls hero banner, value proposition, and call-to-action blocks on the live{' '}
          <a
            href="/her-turn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 font-semibold inline-flex items-center gap-1"
          >
            /her-turn page <Eye size={13} />
          </a>.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-cocoa-700 uppercase">Hero Banner</h3>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Badge Text</label>
            <input
              type="text"
              value={form.hero_badge_text}
              onChange={e => setForm({ ...form, hero_badge_text: e.target.value })}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Title</label>
            <input
              type="text"
              value={form.hero_title}
              onChange={e => setForm({ ...form, hero_title: e.target.value })}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Subtitle</label>
            <textarea
              rows={3}
              value={form.hero_subtitle}
              onChange={e => setForm({ ...form, hero_subtitle: e.target.value })}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
            />
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-cocoa-700 uppercase">Value Proposition</h3>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Heading</label>
            <input
              type="text"
              value={form.value_heading}
              onChange={e => setForm({ ...form, value_heading: e.target.value })}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Body Copy</label>
            <textarea
              rows={3}
              value={form.value_body}
              onChange={e => setForm({ ...form, value_body: e.target.value })}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Checklist Items</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {form.value_checklist.map((item, idx) => (
                <span
                  key={`${item}-${idx}`}
                  className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(idx)}
                    className="cursor-pointer hover:text-teal-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={checklistInput}
                onChange={e => setChecklistInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                placeholder="Add checklist item and press Enter"
                className="flex-1 bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="bg-sand-100 hover:bg-sand-200 text-cocoa-700 px-4 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Sisterhood CTA Card */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-cocoa-700 uppercase">"Join the Sisterhood" Card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Heading</label>
              <input
                type="text"
                value={form.sisterhood_heading}
                onChange={e => setForm({ ...form, sisterhood_heading: e.target.value })}
                className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Button Text</label>
              <input
                type="text"
                value={form.sisterhood_cta_text}
                onChange={e => setForm({ ...form, sisterhood_cta_text: e.target.value })}
                className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Body Copy</label>
            <textarea
              rows={2}
              value={form.sisterhood_body}
              onChange={e => setForm({ ...form, sisterhood_body: e.target.value })}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-700 uppercase mb-1">Button Link</label>
            <input
              type="text"
              value={form.sisterhood_cta_link}
              onChange={e => setForm({ ...form, sisterhood_cta_link: e.target.value })}
              placeholder="/contact"
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs">
            <CheckCircle2 size={14} className="shrink-0" /> Saved — live on /her-turn now.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-coral-600 hover:bg-coral-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm cursor-pointer transition-colors"
        >
          <Save size={15} /> {saving ? 'Saving...' : 'Save Page Content'}
        </button>
      </form>
    </div>
  );
}