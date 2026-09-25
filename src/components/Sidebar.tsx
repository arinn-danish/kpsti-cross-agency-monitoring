import React from 'react';
import {
  BarChart3,
  SlidersHorizontal,
  History,
  Bot,
  Building2,
  Plus,
  Database,
  RotateCcw,
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';
import { User, logOut } from '../lib/firebase';
import { AppPage } from './Navbar';

interface SidebarProps {
  currentView: AppPage;
  onNavigate: (view: AppPage) => void;
  projectCount: number;
  agencyCount: number;
  onOpenCreateModal: () => void;
  onOpenManageAgencies: () => void;
  onLoadSampleData: () => void;
  onResetData: () => void;
  currentUser: User | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  projectCount,
  agencyCount,
  onOpenCreateModal,
  onOpenManageAgencies,
  onLoadSampleData,
  onResetData,
  currentUser,
  isOpenMobile,
  onCloseMobile
}) => {
  const [showResetConfirm, setShowResetConfirm] = React.useState<boolean>(false);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('kpsti_preview_user');
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleNavClick = (view: AppPage) => {
    onNavigate(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header / Brand - Clean and Non-Duplicated */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">KPSTI Sabah</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 uppercase">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Navigasi Sistem</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation & Actions Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* 1. Menu Utama (Non-Sequential Clean Labels) */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Menu Utama
            </div>
            <nav className="space-y-1.5">
              
              {/* Analytics Engine (Default Landing Page) */}
              <button
                id="sidebar-nav-analytics"
                type="button"
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'analytics'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-4 h-4 ${currentView === 'analytics' ? 'text-white' : 'text-emerald-400'}`} />
                  <span>Analytics Engine</span>
                </div>
              </button>

              {/* Core Interface */}
              <button
                id="sidebar-nav-core"
                type="button"
                onClick={() => handleNavClick('core')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'core' || currentView === 'detail'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className={`w-4 h-4 ${currentView === 'core' || currentView === 'detail' ? 'text-white' : 'text-emerald-400'}`} />
                  <span>Core Interface</span>
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  currentView === 'core' || currentView === 'detail' ? 'bg-emerald-700/80 text-emerald-100' : 'bg-slate-800 text-slate-300'
                }`}>
                  {projectCount}
                </span>
              </button>

              {/* Audit Trail */}
              <button
                id="sidebar-nav-audit"
                type="button"
                onClick={() => handleNavClick('audit')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'audit'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className={`w-4 h-4 ${currentView === 'audit' ? 'text-white' : 'text-teal-400'}`} />
                  <span>Audit Trail</span>
                </div>
              </button>

              {/* Chatbot AI */}
              <button
                id="sidebar-nav-chatbot"
                type="button"
                onClick={() => handleNavClick('chatbot')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'chatbot'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bot className={`w-4 h-4 ${currentView === 'chatbot' ? 'text-white' : 'text-emerald-400'}`} />
                  <span>Chatbot AI</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

            </nav>
          </div>

          {/* 2. Tindakan & Pengurusan */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Tindakan & Pengurusan
            </div>
            <div className="space-y-2">
              {/* Daftar Projek Baharu */}
              <button
                id="btn-sidebar-create-project"
                type="button"
                onClick={() => {
                  onOpenCreateModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Daftar Projek Baharu</span>
              </button>

              {/* Urus Agensi / Jabatan */}
              <button
                id="btn-sidebar-manage-agencies"
                type="button"
                onClick={() => {
                  onOpenManageAgencies();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Urus Agensi / Jabatan</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                  {agencyCount}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Utiliti Pentadbiran Sistem (Separated Administrative Section) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Pentadbiran Sistem
            </div>
            <div className="space-y-1.5">
              <button
                id="btn-sidebar-sync-data"
                type="button"
                onClick={onLoadSampleData}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Segerakkan data inisiatif rasmi KPSTI ke Firestore"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Segerak Data Sampel</span>
              </button>

              {showResetConfirm ? (
                <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl space-y-2 mt-2">
                  <p className="text-[11px] text-rose-200 font-medium leading-tight">
                    Adakah anda pasti mahu memadamkan data projek di Firestore? Tindakan ini tidak boleh diundur.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetData();
                        setShowResetConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Pasti, Padam
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="btn-sidebar-reset-data"
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Kosongkan data projek dalam Firestore"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Set Semula Data</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* User Account / Footer Strip in Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          {currentUser && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Pengguna'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-emerald-500/60 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                  </div>
                )}
                <div className="truncate text-left">
                  <div className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Pegawai'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <button
                id="btn-sidebar-sign-out"
                type="button"
                onClick={handleSignOut}
                title="Log Keluar"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};
