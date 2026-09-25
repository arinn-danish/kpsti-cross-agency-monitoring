import React, { useState, useEffect } from 'react';
import { Project, Agency } from './types';
import { MOCK_AGENCIES, DEFAULT_KPSTI_AGENCIES, INITIAL_SAMPLE_PROJECTS } from './data/mockData';
import { 
  auth, 
  onAuthStateChanged, 
  User, 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  logSubmission,
  serverTimestamp 
} from './lib/firebase';
import { AuthGate } from './components/AuthGate';
import { Navbar, AppPage } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CoreInterfaceView } from './components/CoreInterfaceView';
import { AnalyticsEngineView } from './components/AnalyticsEngineView';
import { AuditTrailView } from './components/AuditTrailView';
import { ChatbotPageView } from './components/ChatbotPageView';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { CreateProjectModal } from './components/CreateProjectModal';
import { UpdateProgressModal } from './components/UpdateProgressModal';
import { ManageAgenciesModal } from './components/ManageAgenciesModal';
import { SubmissionsAuditModal } from './components/SubmissionsAuditModal';
import { Toast, ToastMessage } from './components/Toast';
import { ChatbotWidget } from './components/ChatbotWidget';
import { Cloud, CloudCheck, Loader2 } from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Firestore sync state
  const [projects, setProjects] = useState<Project[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigation & modals (Landing page: Analytics Engine by default)
  const [currentView, setCurrentView] = useState<AppPage>('analytics');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<AppPage>('analytics');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isManageAgenciesModalOpen, setIsManageAgenciesModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // 1. Listen to Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.removeItem('kpsti_preview_user');
      } else {
        const savedPreview = localStorage.getItem('kpsti_preview_user');
        if (savedPreview) {
          try {
            setCurrentUser(JSON.parse(savedPreview));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGuestSignIn = () => {
    const previewUser = {
      uid: 'kpsti-officer-preview',
      email: 'lyeanafeesaj@gmail.com',
      displayName: 'Pegawai KPSTI (Pratonton)',
      emailVerified: true
    } as unknown as User;
    localStorage.setItem('kpsti_preview_user', JSON.stringify(previewUser));
    setCurrentUser(previewUser);
  };

  // 2. Real-time sync with Firestore when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setAgencies([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    // Sync Projects from Firestore
    const projectsCol = collection(db, 'projects');
    const unsubscribeProjects = onSnapshot(
      projectsCol,
      async (snapshot) => {
        if (!snapshot.empty) {
          const loadedProjects: Project[] = snapshot.docs.map((docSnap) => docSnap.data() as Project);
          // Sort projects with latest on top
          loadedProjects.sort((a, b) => (b.lastUpdatedDate || '').localeCompare(a.lastUpdatedDate || ''));
          setProjects(loadedProjects);
          setDataLoading(false);
        } else {
          // Initialize first-time dataset in Firestore if completely empty
          console.log('No projects in Firestore, bootstrapping with initial KPSTI projects...');
          setProjects(INITIAL_SAMPLE_PROJECTS);
          setDataLoading(false);

          // Bootstrap to Firestore in background
          try {
            for (const sample of INITIAL_SAMPLE_PROJECTS) {
              await setDoc(doc(db, 'projects', sample.id), {
                ...sample,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: currentUser.uid,
                creatorEmail: currentUser.email
              });
            }
            // Log submission
            await logSubmission({
              type: 'INITIALIZE_SAMPLE_DATA',
              userId: currentUser.uid,
              userEmail: currentUser.email,
              userName: currentUser.displayName || 'Sistem Awal',
              details: { count: INITIAL_SAMPLE_PROJECTS.length }
            });
          } catch (initErr) {
            console.error('Error seeding initial projects to Firestore:', initErr);
          }
        }
      },
      (error) => {
        console.error('Firestore projects listener error:', error);
        // Fallback to local default so UI is never blank
        setProjects(INITIAL_SAMPLE_PROJECTS);
        setDataLoading(false);
      }
    );

    // Sync Agencies from Firestore
    const agenciesCol = collection(db, 'agencies');
    const unsubscribeAgencies = onSnapshot(
      agenciesCol,
      async (snapshot) => {
        if (!snapshot.empty) {
          const loadedAgencies: Agency[] = snapshot.docs.map((docSnap) => docSnap.data() as Agency);
          setAgencies(loadedAgencies);
        } else {
          // Initialize default KPSTI agencies in Firestore if collection is empty
          console.log('No agencies in Firestore, initializing KPSTI default agencies...');
          setAgencies(DEFAULT_KPSTI_AGENCIES);
          try {
            for (const agency of DEFAULT_KPSTI_AGENCIES) {
              await setDoc(doc(db, 'agencies', agency.id), {
                ...agency,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.uid
              });
            }
          } catch (agencyInitErr) {
            console.error('Error seeding initial agencies to Firestore:', agencyInitErr);
          }
        }
      },
      (error) => {
        console.error('Firestore agencies listener error:', error);
        setAgencies(DEFAULT_KPSTI_AGENCIES);
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeAgencies();
    };
  }, [currentUser]);

  // Active selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // View navigation handler for all pages
  const handleNavigate = (view: AppPage) => {
    setCurrentView(view);
    if (view !== 'detail') {
      setPreviousPage(view);
    }
    setSelectedProjectId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select project to inspect details
  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    if (currentView !== 'detail') {
      setPreviousPage(currentView);
    }
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from project detail view
  const handleBackFromDetail = () => {
    setCurrentView(previousPage);
    setSelectedProjectId(null);
  };

  // Load sample dataset directly to Firestore
  const handleLoadSampleData = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      for (const sample of INITIAL_SAMPLE_PROJECTS) {
        await setDoc(doc(db, 'projects', sample.id), {
          ...sample,
          updatedAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          creatorEmail: currentUser.email
        });
      }

      await logSubmission({
        type: 'INITIALIZE_SAMPLE_DATA',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: { count: INITIAL_SAMPLE_PROJECTS.length, source: 'Manual Reset/Reload' }
      });

      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Data Disegerakkan ke Firestore',
        description: `Berjaya memuat naik ${INITIAL_SAMPLE_PROJECTS.length} projek KPSTI ke pangkalan data Firestore.`
      });
    } catch (err: any) {
      console.error('Error syncing sample data to Firestore:', err);
      setToast({
        id: `toast-${Date.now()}`,
        type: 'error',
        title: 'Ralat Penyegerakan Firestore',
        description: err.message || 'Gagal memuat naik data sampel ke Firestore.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset dataset in Firestore
  const handleResetData = async () => {
    if (!currentUser) return;
    if (!window.confirm('Adakah anda pasti untuk mengosongkan semua rekod projek di Firestore?')) {
      return;
    }

    setIsSyncing(true);
    try {
      // Delete all current project docs
      for (const p of projects) {
        await deleteDoc(doc(db, 'projects', p.id));
      }

      await logSubmission({
        type: 'DELETE_PROJECT',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: { action: 'Wipe all projects' }
      });

      setSelectedProjectId(null);
      setCurrentView('core');
      setToast({
        id: `toast-${Date.now()}`,
        type: 'info',
        title: 'Pangkalan Data Dikosongkan',
        description: 'Semua rekod projek telah dipadam dari Firestore.'
      });
    } catch (err: any) {
      console.error('Error clearing Firestore projects:', err);
      setToast({
        id: `toast-${Date.now()}`,
        type: 'error',
        title: 'Ralat Mengosongkan Data',
        description: err.message || 'Gagal memadam data dari Firestore.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle new project creation (Save to Firestore + Submissions log with timestamp)
  const handleProjectCreated = async (newProject: Project) => {
    if (!currentUser) return;
    setIsSyncing(true);

    try {
      const nowIso = new Date().toISOString();
      const projectPayload: Project = {
        ...newProject,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: currentUser.uid,
        creatorEmail: currentUser.email || undefined
      };

      // 1. Write Project document to Firestore
      await setDoc(doc(db, 'projects', newProject.id), projectPayload);

      // 2. Write Submission audit entry to Firestore with serverTimestamp
      await logSubmission({
        type: 'CREATE_PROJECT',
        projectId: newProject.id,
        projectTitle: newProject.title,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: {
          leadAgency: newProject.leadAgency,
          participatingAgencies: newProject.participatingAgencies,
          status: newProject.status,
          progressPercentage: newProject.progressPercentage,
          startDate: newProject.startDate,
          targetCompletionDate: newProject.targetCompletionDate
        }
      });

      setSelectedProjectId(newProject.id);
      setCurrentView('detail');
      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Projek Disimpan di Firestore',
        description: `${newProject.id}: "${newProject.title}" telah direkodkan bersama cap masa rasmi.`
      });
    } catch (err: any) {
      console.error('Error creating project in Firestore:', err);
      setToast({
        id: `toast-${Date.now()}`,
        type: 'error',
        title: 'Gagal Menyimpan Projek',
        description: err.message || 'Ralat semasa berhubung dengan Firestore.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle project progress update (Save to Firestore + Submissions log with timestamp)
  const handleProgressUpdated = async (updatedProject: Project) => {
    if (!currentUser) return;
    setIsSyncing(true);

    try {
      const nowIso = new Date().toISOString();
      const payload: Project = {
        ...updatedProject,
        updatedAt: nowIso
      };

      // 1. Update Project document in Firestore
      await setDoc(doc(db, 'projects', updatedProject.id), payload);

      // 2. Write Submission audit entry to Firestore with serverTimestamp
      await logSubmission({
        type: 'UPDATE_PROGRESS',
        projectId: updatedProject.id,
        projectTitle: updatedProject.title,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: {
          leadAgency: updatedProject.leadAgency,
          status: updatedProject.status,
          progressPercentage: updatedProject.progressPercentage,
          latestProgressUpdate: updatedProject.latestProgressUpdate,
          currentIssueBlocker: updatedProject.currentIssueBlocker,
          nextAction: updatedProject.nextAction
        }
      });

      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Kemajuan Disimpan di Firestore',
        description: `Status dan peratusan bagi ${updatedProject.id} telah dikemaskini (${updatedProject.progressPercentage}%).`
      });
    } catch (err: any) {
      console.error('Error updating progress in Firestore:', err);
      setToast({
        id: `toast-${Date.now()}`,
        type: 'error',
        title: 'Gagal Menyimpan Kemajuan',
        description: err.message || 'Ralat semasa berhubung dengan Firestore.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Agency Management Handlers with Firestore sync
  const handleAddAgency = async (newAgency: Agency) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'agencies', newAgency.id), {
        ...newAgency,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });

      await logSubmission({
        type: 'MANAGE_AGENCY',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: { action: 'ADD_AGENCY', name: newAgency.name, code: newAgency.code }
      });

      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Agensi Disimpan di Firestore',
        description: `${newAgency.name} (${newAgency.code}) telah didaftarkan.`
      });
    } catch (err: any) {
      console.error('Error adding agency to Firestore:', err);
    }
  };

  const handleUpdateAgency = async (oldName: string, updatedAgency: Agency) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'agencies', updatedAgency.id), {
        ...updatedAgency,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });

      // Cascade update to projects if agency name changed
      if (oldName !== updatedAgency.name) {
        for (const p of projects) {
          let hasChanges = false;
          let newLead = p.leadAgency;
          let newParticipating = p.participatingAgencies ? [...p.participatingAgencies] : [];

          if (p.leadAgency === oldName) {
            newLead = updatedAgency.name;
            hasChanges = true;
          }
          if (newParticipating.includes(oldName)) {
            newParticipating = newParticipating.map((name) => (name === oldName ? updatedAgency.name : name));
            hasChanges = true;
          }

          if (hasChanges) {
            await setDoc(doc(db, 'projects', p.id), {
              ...p,
              leadAgency: newLead,
              participatingAgencies: newParticipating,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      await logSubmission({
        type: 'MANAGE_AGENCY',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: { action: 'UPDATE_AGENCY', oldName, newName: updatedAgency.name }
      });

      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Agensi Dikemaskini',
        description: `Profil ${updatedAgency.name} telah disimpan ke Firestore.`
      });
    } catch (err: any) {
      console.error('Error updating agency in Firestore:', err);
    }
  };

  const handleDeleteAgency = async (agencyId: string, agencyName: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'agencies', agencyId));
      await logSubmission({
        type: 'MANAGE_AGENCY',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        details: { action: 'DELETE_AGENCY', agencyName }
      });
      setToast({
        id: `toast-${Date.now()}`,
        type: 'info',
        title: 'Agensi Dipadam',
        description: `${agencyName} telah dipadam daripada Firestore.`
      });
    } catch (err: any) {
      console.error('Error deleting agency from Firestore:', err);
    }
  };

  const handleResetAgenciesToDefault = async () => {
    if (!currentUser) return;
    try {
      for (const agency of DEFAULT_KPSTI_AGENCIES) {
        await setDoc(doc(db, 'agencies', agency.id), {
          ...agency,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      }
      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Senarai Agensi KPSTI Dipulihkan',
        description: 'Senarai agensi rasmi telah dimuat semula ke Firestore.'
      });
    } catch (err: any) {
      console.error('Error resetting agencies:', err);
    }
  };

  // Loading spinner during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Memeriksa pengesahan pengguna...</p>
      </div>
    );
  }

  // If user is NOT signed in, Gate access with AuthGate
  const getGreetingName = (user: User | null): string => {
    if (!user) return 'Pegawai';
    if (user.displayName && user.displayName.trim().length > 0) {
      return user.displayName.trim();
    }
    if (user.email) {
      const userPart = user.email.split('@')[0];
      return userPart.charAt(0).toUpperCase() + userPart.slice(1);
    }
    return 'Pegawai';
  };

  if (!currentUser) {
    return (
      <AuthGate 
        onSignInSuccess={() => {}} 
        onContinueAsGuest={handleGuestSignIn} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header - Application Identity & Account */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Syncing indicator banner if operations are active */}
      {isSyncing && (
        <div className="bg-emerald-600 text-white text-xs py-1 px-4 text-center flex items-center justify-center gap-2 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Menyegerakkan data ke Google Cloud Firestore...</span>
        </div>
      )}

      {/* App Body: Sidebar + Main Workspace */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          projectCount={projects.length}
          agencyCount={agencies.length}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenManageAgencies={() => setIsManageAgenciesModalOpen(true)}
          onLoadSampleData={handleLoadSampleData}
          onResetData={handleResetData}
          currentUser={currentUser}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-w-0 pb-16">
          {dataLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-slate-600 font-medium">
                Menyambung ke pangkalan data Google Cloud Firestore...
              </p>
            </div>
          ) : (
            <>
              {/* 1. Analytics Engine (Default Landing Page) */}
              {currentView === 'analytics' && (
                <AnalyticsEngineView
                  projects={projects}
                  agencies={agencies}
                  currentUser={currentUser}
                  greetingName={getGreetingName(currentUser)}
                  onSelectProject={handleSelectProject}
                  onNavigateToCore={() => handleNavigate('core')}
                />
              )}

              {/* 2. Core Interface */}
              {currentView === 'core' && (
                <CoreInterfaceView
                  projects={projects}
                  agencies={agencies}
                  onSelectProject={handleSelectProject}
                  onProjectCreated={handleProjectCreated}
                  onLoadSampleData={handleLoadSampleData}
                  onOpenManageAgencies={() => setIsManageAgenciesModalOpen(true)}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onNavigate={handleNavigate}
                />
              )}

              {/* 3. Audit Trail */}
              {currentView === 'audit' && (
                <AuditTrailView
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  onNavigateToCore={() => handleNavigate('core')}
                />
              )}

              {/* 4. Chatbot AI Dedicated Page */}
              {currentView === 'chatbot' && (
                <ChatbotPageView
                  projects={projects}
                  agencies={agencies}
                  onOpenCreateProject={(initialData) => {
                    setIsCreateModalOpen(true);
                  }}
                  onNavigateToCore={() => handleNavigate('core')}
                  onNavigateToAnalytics={() => handleNavigate('analytics')}
                />
              )}

              {/* Sub-view: Project Detail View */}
              {currentView === 'detail' && selectedProject && (
                <ProjectDetailView
                  project={selectedProject}
                  onBack={handleBackFromDetail}
                  onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
                />
              )}

              {currentView === 'detail' && !selectedProject && (
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Projek tidak dijumpai</h2>
                  <p className="text-sm text-slate-500 mb-6">ID projek yang diminta mungkin telah dipadam atau diubah di Firestore.</p>
                  <button
                    onClick={() => handleNavigate('analytics')}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-500 cursor-pointer"
                  >
                    Kembali ke Analytics Engine
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Project Agent</span>
            <span>•</span>
            <span>KPSTI Sabah</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Cloud Firestore Synchronized</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Log masuk sebagai:</span>
            <span className="font-semibold text-slate-300">{currentUser.email}</span>
          </div>
        </div>
      </footer>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        agencies={agencies}
        onProjectCreated={handleProjectCreated}
        existingProjectCount={projects.length}
        onOpenManageAgencies={() => setIsManageAgenciesModalOpen(true)}
      />

      {/* Manage Agencies Modal */}
      <ManageAgenciesModal
        isOpen={isManageAgenciesModalOpen}
        onClose={() => setIsManageAgenciesModalOpen(false)}
        agencies={agencies}
        projects={projects}
        onAddAgency={handleAddAgency}
        onUpdateAgency={handleUpdateAgency}
        onDeleteAgency={handleDeleteAgency}
        onResetAgenciesToDefault={handleResetAgenciesToDefault}
      />

      {/* Update Progress Modal */}
      {selectedProject && (
        <UpdateProgressModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          project={selectedProject}
          onProgressUpdated={handleProgressUpdated}
        />
      )}

      {/* Submissions Audit Modal (Firestore Audit Trail) */}
      <SubmissionsAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSelectProject={(projId) => {
          const target = projects.find((p) => p.id === projId);
          if (target) {
            handleSelectProject(target);
          }
        }}
      />

      {/* Floating & Expandable Chatbot Assistant (Hidden on dedicated Chatbot page) */}
      {currentView !== 'chatbot' && (
        <ChatbotWidget
          projects={projects}
          agencies={agencies}
          isOpenExternal={isChatbotOpen}
          onToggleExternal={() => setIsChatbotOpen(prev => !prev)}
          onOpenCreateProject={(initialData) => {
            setIsCreateModalOpen(true);
          }}
        />
      )}

      {/* Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
