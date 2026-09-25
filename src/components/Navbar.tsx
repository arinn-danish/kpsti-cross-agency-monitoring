import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Menu,
  CloudCheck
} from 'lucide-react';
import { User, logOut } from '../lib/firebase';

export type AppPage = 'analytics' | 'core' | 'audit' | 'chatbot' | 'detail';

interface NavbarProps {
  currentView: AppPage;
  onNavigate: (view: AppPage) => void;
  currentUser: User | null;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenMobileSidebar
}) => {
  const handleSignOut = async () => {
    try {
      localStorage.removeItem('kpsti_preview_user');
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile Sidebar Trigger & Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              id="btn-open-mobile-sidebar"
              type="button"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              id="brand-header-btn"
              onClick={() => onNavigate('analytics')}
              className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs ring-1 ring-emerald-400/30 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white">Project Agent</span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 uppercase tracking-wide">
                    <ShieldCheck className="w-3 h-3" />
                    Firestore Cloud
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Central Cross-Agency Monitoring • KPSTI Sabah</p>
              </div>
            </button>
          </div>

          {/* Right: Cloud Sync Status & User Profile */}
          <div className="flex items-center gap-3">
            
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-300">Firestore Bersambung</span>
            </div>

            {/* Current User & Quick Sign Out */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Pengguna'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-emerald-500/60 object-cover"
                    title={currentUser.email || currentUser.displayName || ''}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold text-white">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Pegawai'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  id="btn-header-sign-out"
                  onClick={handleSignOut}
                  title="Log Keluar"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

