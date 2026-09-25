import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { firebaseConfig } from '../lib/firebase-config';
import { 
  ShieldCheck, 
  LogIn, 
  Sparkles, 
  Building2, 
  CheckCircle, 
  Database,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface AuthGateProps {
  onSignInSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSignInSuccess, onContinueAsGuest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyHostname = () => {
    if (!currentHostname) return;
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorizedDomain(false);

    try {
      await signInWithGoogle();
      onSignInSuccess?.();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      
      const isDomainError = 
        err.code === 'auth/unauthorized-domain' || 
        (err.message && err.message.includes('auth/unauthorized-domain'));

      if (isDomainError) {
        setIsUnauthorizedDomain(true);
        setError(
          `Domain (${currentHostname}) belum didaftarkan dalam senarai Authorized Domains Firebase Console untuk projek "${firebaseConfig.projectId}".`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Tetingkap log masuk telah ditutup sebelum selesai. Sila cuba lagi.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Permintaan log masuk dibatalkan.');
      } else {
        setError(err.message || 'Gagal log masuk dengan Google. Sila cuba sebentar lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-white text-base sm:text-lg">
                  PROJECT AGENT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 uppercase">
                  KPSTI Sabah
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistem Pemantauan Projek Kerajaan Negeri Sabah
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Akses Terkawal & Selamat</span>
          </div>
        </div>
      </header>

      {/* Hero & Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Log Masuk Pengguna
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Sila log masuk dengan Akaun Google untuk mengakses portal pemantauan dan pangkalan data Firestore.
              </p>
            </div>

            {/* Unauthorized Domain Specific Warning & Guidance */}
            {isUnauthorizedDomain && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-300">Domain Belum Didaftarkan di Firebase</p>
                    <p className="text-[11px] leading-relaxed text-amber-200/90">
                      Firebase memerlukan domain web didaftarkan di bawah senarai <em>Authorized domains</em> sebelum membenarkan popup Google Sign-In.
                    </p>
                  </div>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-lg border border-amber-900/50 flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="truncate text-amber-300 select-all">{currentHostname}</span>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-sans flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-900/50 hover:bg-amber-900/70 text-amber-300 font-medium text-[11px] border border-amber-700/60 transition-colors"
                  >
                    <span>Buka Firebase Console &gt; Authorized Domains</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {onContinueAsGuest && (
                    <button
                      type="button"
                      onClick={onContinueAsGuest}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Teruskan Sebagai Pegawai KPSTI (Mod Pratonton)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Generic Error message if not unauthorized domain */}
            {error && !isUnauthorizedDomain && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              id="btn-google-sign-in"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loading ? 'Menghubungkan...' : 'Log Masuk dengan Google'}</span>
            </button>

            {/* Quick Preview Access for Officers / Facilitators */}
            {onContinueAsGuest && !isUnauthorizedDomain && (
              <>
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <span className="relative bg-slate-950 px-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Atau
                  </span>
                </div>

                <button
                  id="btn-guest-preview-sign-in"
                  type="button"
                  onClick={onContinueAsGuest}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-medium text-xs transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Log Masuk Pantas (Pratonton Pegawai KPSTI)</span>
                </button>
              </>
            )}

            {/* Feature Highlights */}
            <div className="mt-7 pt-5 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Penyegerakan Awan Firestore:</strong> Pangkalan data rasmi <code className="text-emerald-300 font-mono text-[11px]">{firebaseConfig.firestoreDatabaseId || firebaseConfig.projectId}</code>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Jejak Audit Submisi:</strong> Rekod cap masa server rasmi untuk pemantauan projek negeri Sabah.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Integrasi Ekosistem KPSTI:</strong> JTDI, JPSM, PNS, SSTC, SCENIC, DGD dan rakan kerjasama.
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-[11px] text-slate-500">
              Kementerian Pendidikan, Sains, Teknologi dan Inovasi Negeri Sabah &copy; 2026
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        Dilindungi oleh Firebase Authentication &amp; Cloud Firestore Security Rules
      </footer>
    </div>
  );
};

