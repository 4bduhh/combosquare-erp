import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { CompanySettings } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { Field, TextInput, TextArea, Button } from '@/components/Form';
import { Save, LogOut, Building2, Mail } from 'lucide-react';
import logoUrl from '/Combo_Square_Logo.png';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    company_name: 'Combo Square', tagline: '', email: '', phone: '', address: '', logo_url: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('company_settings').select('*').maybeSingle();
      if (data) {
        setSettings(data);
        setForm({
          company_name: data.company_name, tagline: data.tagline ?? '', email: data.email ?? '',
          phone: data.phone ?? '', address: data.address ?? '', logo_url: data.logo_url ?? '',
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      company_name: form.company_name, tagline: form.tagline || null, email: form.email || null,
      phone: form.phone || null, address: form.address || null, logo_url: form.logo_url || null,
      updated_at: new Date().toISOString(),
    };
    if (settings) {
      await supabase.from('company_settings').update(payload).eq('id', settings.id);
    } else {
      await supabase.from('company_settings').insert(payload);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#E8E5F0] border-t-[#7653B8] rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage your company profile and account" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Company Profile */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#7653B8]/10"><Building2 className="text-[#7653B8]" size={22} /></div>
            <div>
              <h3 className="text-lg font-bold text-[#1F1B2E]">Company Profile</h3>
              <p className="text-sm text-[#6B6580]">Update your company information</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#E8E5F0] flex items-center justify-center shrink-0 p-1">
                <img src={form.logo_url || logoUrl} alt="Logo" className="w-full h-full rounded-xl object-contain" />
              </div>
              <Field label="Logo URL (optional)"><TextInput value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></Field>
            </div>

            <Field label="Company Name"><TextInput value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required /></Field>
            <Field label="Tagline"><TextInput value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Creative & Tech Agency" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="hello@combosquare.com" /></Field>
              <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" /></Field>
            </div>
            <Field label="Address"><TextArea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, Country" /></Field>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saved && <span className="text-sm text-green-600 animate-fade-in">Saved successfully!</span>}
            </div>
          </form>
        </div>

        {/* Account */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#7653B8]/10"><Mail className="text-[#7653B8]" size={22} /></div>
              <div>
                <h3 className="text-lg font-bold text-[#1F1B2E]">Admin Account</h3>
                <p className="text-sm text-[#6B6580]">Your login details</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#4B2A87]">
                <Mail size={16} className="text-[#7653B8] shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-3">
            <h3 className="text-lg font-bold text-[#1F1B2E] mb-2">Sign Out</h3>
            <p className="text-sm text-[#6B6580] mb-4">End your current session</p>
            <Button variant="danger" onClick={signOut} className="w-full"><LogOut size={18} /> Sign Out</Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
