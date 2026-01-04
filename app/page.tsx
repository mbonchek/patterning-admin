'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Eye, RefreshCw, ShieldAlert, Lock } from 'lucide-react';
import Link from 'next/link';

// Simple type for our flattened data
interface PatternRecord {
  id: string; // Voicing ID
  word: string;
  voicing: string;
  essence: string;
  image_url: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [patterns, setPatterns] = useState<PatternRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Simple client-side check (sufficient for MVP internal tool)
  // In production, use NextAuth or Middleware for real security.
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded fallback or env var check (client-side env var must be NEXT_PUBLIC_)
    // For better security, we'd do this server-side, but this stops casual snooping.
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === correctPassword) {
      setIsAuthenticated(true);
      fetchPatterns();
    } else {
      alert('Incorrect password');
    }
  };

  const fetchPatterns = async () => {
    setLoading(true);
    // Fetch from normalized tables
    const { data, error } = await supabase
      .from('voicings')
      .select(`
        id,
        content,
        created_at,
        layer:layers(word),
        essences(
          content,
          images(image_url)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching patterns:', error);
    } else if (data) {
      const flattened = data.map((item: any) => ({
        id: item.id,
        word: item.layer?.word || 'Unknown',
        voicing: item.content,
        essence: item.essences?.[0]?.content || '',
        image_url: item.essences?.[0]?.images?.[0]?.image_url || '',
        created_at: item.created_at,
      }));
      setPatterns(flattened);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voicing? This cannot be undone.')) return;
    
    setDeleting(id);
    const { error } = await supabase
      .from('voicings')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      setPatterns(patterns.filter(p => p.id !== id));
    }
    setDeleting(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full space-y-6 border border-slate-100">
          <div className="text-center space-y-2">
            <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <Lock size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Admin Access</h1>
            <p className="text-sm text-slate-500">Enter the access code to continue.</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="Access Code"
            autoFocus
          />
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-indigo-600" />
          <h1 className="font-bold text-xl tracking-tight">Patterning Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchPatterns} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin text-slate-400' : 'text-slate-600'} />
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-6 py-4">Word</th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4 w-1/3">Voicing</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                      {pattern.word}
                    </td>
                    <td className="px-6 py-4">
                      {pattern.image_url ? (
                        <img 
                          src={pattern.image_url} 
                          alt={pattern.word} 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <span className="text-slate-400 text-xs">No Image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="line-clamp-2">{pattern.voicing}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(pattern.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Link (assuming patterning-web is deployed) */}
                        <Link 
                          href={`https://patterning-web-production.up.railway.app/v/${pattern.id}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(pattern.id)}
                          disabled={deleting === pattern.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {!loading && patterns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No patterns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
