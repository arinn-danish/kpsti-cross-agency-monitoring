import React, { useState, useMemo } from 'react';
import { Agency, Project } from '../types';
import { DEFAULT_KPSTI_AGENCIES } from '../data/mockData';
import {
  X,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  AlertTriangle,
  RotateCcw,
  Layers,
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';

interface ManageAgenciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
  projects: Project[];
  onAddAgency: (agency: Agency) => void;
  onUpdateAgency: (oldName: string, updatedAgency: Agency) => void;
  onDeleteAgency: (agencyId: string, agencyName: string) => void;
  onResetAgenciesToDefault: () => void;
}

const PRESET_CATEGORIES = [
  'KPSTI (Kementerian)',
  'KPSTI (Jabatan)',
  'KPSTI (Agensi)',
  'KPSTI (Bahagian)',
  'Agensi Negeri (Others)',
  'Agensi Persekutuan (Others)',
  'Lain-lain (Others)'
];

export const ManageAgenciesModal: React.FC<ManageAgenciesModalProps> = ({
  isOpen,
  onClose,
  agencies,
  projects,
  onAddAgency,
  onUpdateAgency,
  onDeleteAgency,
  onResetAgenciesToDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [deletingAgency, setDeletingAgency] = useState<Agency | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'KPSTI (Jabatan)',
    description: '',
    customCategory: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  // Filter agencies
  const filteredAgencies = agencies.filter((agency) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = agency.name.toLowerCase().includes(q);
      const matchCode = agency.code.toLowerCase().includes(q);
      const matchDesc = agency.description?.toLowerCase().includes(q);
      const matchCat = agency.category?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc && !matchCat) return false;
    }

    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'KPSTI') {
        return agency.category?.toLowerCase().includes('kpsti');
      } else if (selectedCategory === 'OTHERS') {
        return !agency.category?.toLowerCase().includes('kpsti');
      } else {
        return agency.category === selectedCategory;
      }
    }

    return true;
  });

  const kpstiCount = agencies.filter((a) => a.category?.toLowerCase().includes('kpsti')).length;
  const othersCount = agencies.length - kpstiCount;

  // Calculate project usage for an agency
  const getAgencyUsage = (agencyName: string) => {
    const leadCount = projects.filter((p) => p.leadAgency === agencyName).length;
    const partnerCount = projects.filter(
      (p) => p.participatingAgencies && p.participatingAgencies.includes(agencyName)
    ).length;
    return { leadCount, partnerCount, totalCount: leadCount + partnerCount };
  };

  // Open add form
  const handleOpenAdd = () => {
    setEditingAgency(null);
    setFormData({
      name: '',
      code: '',
      category: 'KPSTI (Jabatan)',
      description: '',
      customCategory: ''
    });
    setFormErrors({});
    setIsAdding(true);
  };

  // Open edit form
  const handleOpenEdit = (agency: Agency) => {
    setIsAdding(false);
    setEditingAgency(agency);
    const isPreset = PRESET_CATEGORIES.includes(agency.category || '');
    setFormData({
      name: agency.name,
      code: agency.code,
      category: isPreset ? (agency.category || 'KPSTI (Jabatan)') : 'Custom',
      description: agency.description || '',
      customCategory: isPreset ? '' : (agency.category || '')
    });
    setFormErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errs.name = 'Nama agensi / jabatan diperlukan.';
    } else {
      // Check duplicate name
      const duplicateName = agencies.find(
        (a) =>
          a.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          (!editingAgency || a.id !== editingAgency.id)
      );
      if (duplicateName) {
        errs.name = 'Agensi dengan nama ini telah didaftarkan.';
      }
    }

    if (!formData.code.trim()) {
      errs.code = 'Kod / Akronim diperlukan (cth: JTDI, SSTC).';
    } else if (formData.code.length > 12) {
      errs.code = 'Kod akronim terlalu panjang (maksimum 12 aksara).';
    }

    const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
    if (!finalCategory.trim()) {
      errs.category = 'Sila pilih atau masukkan kategori agensi.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save new agency
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalCategory = formData.category === 'Custom' ? formData.customCategory.trim() : formData.category;
    const newAgency: Agency = {
      id: `agency-custom-${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: finalCategory,
      description: formData.description.trim(),
      isCustom: true
    };

    onAddAgency(newAgency);
    setIsAdding(false);
  };

  // Save edited agency
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency || !validateForm()) return;

    const finalCategory = formData.category === 'Custom' ? formData.customCategory.trim() : formData.category;
    const updatedAgency: Agency = {
      ...editingAgency,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: finalCategory,
      description: formData.description.trim()
    };

    onUpdateAgency(editingAgency.name, updatedAgency);
    setEditingAgency(null);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deletingAgency) return;
    onDeleteAgency(deletingAgency.id, deletingAgency.name);
    setDeletingAgency(null);
  };

  return (
    <div
      id="modal-manage-agencies-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="modal-manage-agencies-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Pengurusan Agensi & Jabatan</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  {agencies.length} Agensi Berdaftar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Urus dan sesuaikan senarai Kementerian, Jabatan & Agensi KPSTI serta Agensi Rakan Kerjasama (Others)
              </p>
            </div>
          </div>
          <button
            id="btn-close-manage-agencies"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari agensi, akronim atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua ({agencies.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('KPSTI')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedCategory === 'KPSTI'
                    ? 'bg-slate-900 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                KPSTI ({kpstiCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('OTHERS')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedCategory === 'OTHERS'
                    ? 'bg-slate-900 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Others ({othersCount})
              </button>
            </div>

            {/* Add Agency Button */}
            <button
              id="btn-add-new-agency"
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Agensi Baru</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          
          {/* Add / Edit Form Panel (if active) */}
          {(isAdding || editingAgency) && (
            <div
              id="panel-agency-form"
              className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-xs space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    {isAdding ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isAdding ? 'Daftar Agensi / Jabatan Baru' : `Kemaskini: ${editingAgency?.name}`}
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Masukkan butiran rasmi agensi atau rakan strategik kerajaan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingAgency(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={isAdding ? handleSaveAdd : handleSaveEdit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Agency Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nama Penuh Agensi / Jabatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Jabatan Hal Ehwal Wanita Sabah (JHEWA)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full text-xs bg-white border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.name}</p>}
                  </div>

                  {/* Agency Code / Acronym */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Kod / Akronim <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cth: JHEWA"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className={`w-full text-xs bg-white border rounded-lg px-3 py-2 text-slate-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.code ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.code && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.code}</p>}
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Kategori Kluster <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {PRESET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Custom">Kategori Tersuai (Masukkan Sendiri)...</option>
                    </select>

                    {formData.category === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Nama kategori tersuai..."
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        className="w-full mt-2 text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                    {formErrors.category && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.category}</p>
                    )}
                  </div>

                  {/* Description / Objectives */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Penerangan Ringkas / Peranan
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Peneraju pemerkasaan dan kebajikan hal ehwal wanita..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingAgency(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAdding ? 'Simpan Agensi Baru' : 'Kemaskini Agensi'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {deletingAgency && (
            <div
              id="dialog-confirm-delete-agency"
              className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs space-y-2 animate-in fade-in duration-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-rose-950 text-sm mb-1">
                    Sahkan Pemadaman Agensi: {deletingAgency.name} ({deletingAgency.code})
                  </h4>
                  {(() => {
                    const usage = getAgencyUsage(deletingAgency.name);
                    if (usage.totalCount > 0) {
                      return (
                        <p className="text-rose-800">
                          <strong>Amaran:</strong> Agensi ini sedang digunakan oleh{' '}
                          <span className="font-bold underline">{usage.leadCount} projek</span> sebagai Agensi Peneraju (Lead) dan{' '}
                          <span className="font-bold underline">{usage.partnerCount} projek</span> sebagai Agensi Rakan Kerjasama. 
                          Memadam agensi ini akan membiarkan rekod projek tersebut tanpa agensi berdaftar.
                        </p>
                      );
                    }
                    return (
                      <p className="text-rose-800">
                        Adakah anda pasti ingin memadam agensi ini daripada sistem? Tindakan ini boleh dibatalkan bila-bila masa dengan memulihkan senarai asal.
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200">
                <button
                  type="button"
                  onClick={() => setDeletingAgency(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam Agensi Ini</span>
                </button>
              </div>
            </div>
          )}

          {/* Agencies Table / List */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-4">Kod</th>
                    <th className="py-3 px-4">Nama Agensi / Jabatan</th>
                    <th className="py-3 px-3">Kategori Kluster</th>
                    <th className="py-3 px-3 text-center">Projek Aktif</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAgencies.map((agency) => {
                    const usage = getAgencyUsage(agency.name);
                    const isKPSTI = agency.category?.toLowerCase().includes('kpsti');

                    return (
                      <tr
                        key={agency.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Code Badge */}
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs inline-block ${
                              isKPSTI
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {agency.code}
                          </span>
                        </td>

                        {/* Name & Description */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{agency.name}</span>
                            {agency.isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Tersuai
                              </span>
                            )}
                          </div>
                          {agency.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl line-clamp-1">
                              {agency.description}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              isKPSTI
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {agency.category || 'Agensi'}
                          </span>
                        </td>

                        {/* Usage Stats */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-medium">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                usage.totalCount > 0
                                  ? 'bg-slate-100 text-slate-900 border border-slate-200'
                                  : 'text-slate-400'
                              }`}
                              title={`${usage.leadCount} projek diterajui, ${usage.partnerCount} projek rakan kerjasama`}
                            >
                              {usage.totalCount} {usage.totalCount === 1 ? 'projek' : 'projek'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(agency)}
                              title="Kemaskini agensi ini"
                              className="p-1.5 rounded-md text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingAgency(agency)}
                              title="Padam agensi ini"
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredAgencies.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tiada agensi atau jabatan yang sepadan dengan carian anda.
              </div>
            )}
          </div>

          {/* KPSTI Reference Guide */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Jabatan & Agensi di Bawah KPSTI (Kementerian Pendidikan, Sains, Teknologi & Inovasi Sabah)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Struktur agensi ini merangkumi Kementerian Induk (KPSTI), Jabatan Negeri (JTDI, JPSM, PNS), Agensi Pembangunan Kemahiran & Inovasi (SSTC, SCENIC), serta Bahagian Kerajaan Digital (DGD). Anda boleh menambah jabatan baharu, meminda nama, atau menyelaraskan agensi rakan strategik (Others).
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetAgenciesToDefault}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:underline"
            title="Pulihkan senarai agensi standard KPSTI"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Pulihkan Senarai Asal KPSTI (Reset)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
