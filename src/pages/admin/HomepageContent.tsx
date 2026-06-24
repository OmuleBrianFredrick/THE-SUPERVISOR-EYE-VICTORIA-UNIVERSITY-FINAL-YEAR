import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Save, LayoutTemplate } from 'lucide-react';

export default function HomepageContent() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [content, setContent] = useState({
    heroHeadline: '',
    heroSubheadline: '',
    companyOverview: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/admin/homepage-content', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContent({
          heroHeadline: data.heroHeadline || '',
          heroSubheadline: data.heroSubheadline || '',
          companyOverview: data.companyOverview || ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/admin/homepage-content', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(content)
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Homepage content updated successfully' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to update content' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-pink-600" /> Platform Content Options
        </h2>
        <p className="text-slate-500 text-sm">Manage dynamic content for the Enterprise Homepage. Changes apply immediately.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Hero Headline</label>
          <input 
            type="text"
            className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-800"
            value={content.heroHeadline}
            onChange={(e) => setContent({...content, heroHeadline: e.target.value})}
            placeholder="Welcome to Supervisor Eye"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Hero Subheadline</label>
          <textarea 
            className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-800"
            rows={3}
            value={content.heroSubheadline}
            onChange={(e) => setContent({...content, heroSubheadline: e.target.value})}
            placeholder="Movit Group's Intelligent Workforce Supervision..."
          />
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 mb-1">Company Overview</label>
           <textarea 
            className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-800"
            rows={4}
            value={content.companyOverview}
            onChange={(e) => setContent({...content, companyOverview: e.target.value})}
            placeholder="Empowering personal care through manufacturing excellence..."
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
           <button 
             type="submit" 
             disabled={saving}
             className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
           >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
             Save Changes
           </button>
        </div>
      </form>
    </div>
  );
}
