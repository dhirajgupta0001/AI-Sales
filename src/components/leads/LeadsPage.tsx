import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { Lead, SalesStatus } from '../../types';
import { formatCurrency, formatDuration } from '../../utils/cn';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import {
  Users,
  Search,
  Plus,
  Filter,
  PhoneCall,
  Mail,
  Phone,
  Building,
  Globe,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Disc,
  ListTodo,
  Check
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const {
    leads,
    products,
    calls,
    followUpTasks,
    addLead,
    updateLead,
    deleteLead,
    startCallWithLead,
    setSelectedCallId,
    setCurrentTab,
    markTaskComplete,
  } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'dealValue' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal / Drawer state
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    preferredLanguage: 'English',
    associatedProductId: products[0]?.id || 'prod-1',
    salesStatus: 'Interested' as SalesStatus,
    dealValue: 15000,
    notes: '',
    city: 'San Francisco',
    country: 'United States'
  });

  const allStatuses: SalesStatus[] = [
    'Converted',
    'Interested',
    'Follow-up Required',
    'Not Interested',
    'Demo Requested',
    'No Response',
  ];

  // Filtering & Sorting
  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery);

      const matchesStatus = statusFilter === 'All' || lead.salesStatus === statusFilter;
      const matchesProduct = productFilter === 'All' || lead.associatedProductId === productFilter;

      return matchesSearch && matchesStatus && matchesProduct;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'dealValue') {
        comparison = a.dealValue - b.dealValue;
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination calculation
  const totalLeads = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      preferredLanguage: 'English',
      associatedProductId: products[0]?.id || 'prod-1',
      salesStatus: 'Interested',
      dealValue: 15000,
      notes: '',
      city: '',
      country: ''
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddLeadModalOpen(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      preferredLanguage: lead.preferredLanguage,
      associatedProductId: lead.associatedProductId,
      salesStatus: lead.salesStatus,
      dealValue: lead.dealValue,
      notes: lead.notes,
      city: lead.city || '',
      country: lead.country || ''
    });
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Validation Error', 'Lead name and email are required.', 'warning');
      return;
    }

    const matchedProduct = products.find((p) => p.id === formData.associatedProductId);
    const prodName = matchedProduct ? matchedProduct.name : 'OmniFlow CRM';

    if (editingLead) {
      updateLead(editingLead.id, {
        ...formData,
        associatedProductName: prodName,
      });
      showToast('Lead Updated', `${formData.name} record updated successfully.`, 'success');
      setEditingLead(null);
      if (selectedLeadForDetail?.id === editingLead.id) {
        setSelectedLeadForDetail({
          ...selectedLeadForDetail,
          ...formData,
          associatedProductName: prodName,
        });
      }
    } else {
      addLead({
        ...formData,
        associatedProductName: prodName,
      });
      showToast('Lead Created', `${formData.name} added to pipeline.`, 'success');
      setIsAddLeadModalOpen(false);
    }
  };

  const handleDeleteLead = (id: string) => {
    const lead = leads.find((l) => l.id === id);
    deleteLead(id);
    setDeleteConfirmId(null);
    if (selectedLeadForDetail?.id === id) {
      setSelectedLeadForDetail(null);
    }
    showToast('Lead Removed', `${lead?.name || 'Lead'} removed from pipeline.`, 'info');
  };

  const toggleSort = (field: 'name' | 'dealValue' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Leads & Qualification Pipeline
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage prospect profiles, track multilingual engagement status, and launch instant AI voice calls tailored to specific SaaS value propositions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, company, email, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses ({leads.length})</option>
                {allStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Product:</span>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters if active */}
            {(statusFilter !== 'All' || productFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setProductFilter('All');
                  setSearchQuery('');
                  showToast('Filters Reset', 'Showing all leads in workspace.', 'info');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th
                  className="py-3.5 pl-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Lead & Company</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5">Contact Details</th>
                <th className="py-3.5">Target Product</th>
                <th className="py-3.5">Language</th>
                <th className="py-3.5">Sales Status</th>
                <th
                  className="py-3.5 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('dealValue')}
                >
                  <div className="flex items-center gap-1">
                    <span>Deal Value</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3.5 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Last Contacted</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No leads found matching current search or filters.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadForDetail(lead)}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    {/* Name & Company */}
                    <td className="py-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {lead.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            <span>{lead.company}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3.5 text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>

                    {/* Target Product */}
                    <td className="py-3.5">
                      <span className="font-medium text-slate-200">
                        {lead.associatedProductName}
                      </span>
                    </td>

                    {/* Language */}
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/60">
                        {lead.preferredLanguage}
                      </span>
                    </td>

                    {/* Sales Status */}
                    <td className="py-3.5">
                      <StatusBadge status={lead.salesStatus} size="sm" />
                    </td>

                    {/* Deal Value */}
                    <td className="py-3.5 font-mono text-slate-200 font-semibold">
                      {lead.dealValue > 0 ? formatCurrency(lead.dealValue) : '—'}
                    </td>

                    {/* Last Contacted */}
                    <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                      {lead.lastContactedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Instant Voice Call button */}
                        <button
                          onClick={() => {
                            startCallWithLead(lead);
                            showToast(
                              'Launching Voice Call',
                              `Pre-loaded ${lead.name} (${lead.preferredLanguage}) into Live Voice Studio.`,
                              'info'
                            );
                          }}
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                          title="Launch Voice Call with Lead"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(lead)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Lead Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(lead.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                          title="Remove Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing {totalLeads === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(startIndex + pageSize, totalLeads)} of {totalLeads} leads
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={effectivePage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              Page {effectivePage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={effectivePage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lead Detail Drawer / Modal with Linked Calls & Associated Product */}
      {selectedLeadForDetail && (() => {
        const associatedProd = products.find(
          (p) =>
            p.id === selectedLeadForDetail.associatedProductId ||
            p.name === selectedLeadForDetail.associatedProductName
        );

        const linkedCalls = calls.filter(
          (c) =>
            (selectedLeadForDetail.email &&
              c.customerEmail.toLowerCase() === selectedLeadForDetail.email.toLowerCase()) ||
            (c.lead_id && c.lead_id === selectedLeadForDetail.id)
        );

        const linkedTasks = followUpTasks.filter(
          (t) =>
            (selectedLeadForDetail.email &&
              t.customerEmail &&
              t.customerEmail.toLowerCase() === selectedLeadForDetail.email.toLowerCase()) ||
            (t.lead_id && t.lead_id === selectedLeadForDetail.id)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedLeadForDetail.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {selectedLeadForDetail.name}
                      </h3>
                      <StatusBadge status={selectedLeadForDetail.salesStatus} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400">
                      {selectedLeadForDetail.company} • {selectedLeadForDetail.city || 'Global'} ({selectedLeadForDetail.country || 'Global'})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLeadForDetail(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
                {/* Quick Stat Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Target SaaS</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {selectedLeadForDetail.associatedProductName}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Language</span>
                    <span className="font-semibold text-slate-200">
                      {selectedLeadForDetail.preferredLanguage}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Deal Value</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {formatCurrency(selectedLeadForDetail.dealValue)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Voice Calls</span>
                    <span className="font-bold text-indigo-400 font-mono">
                      {linkedCalls.length} logged
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[11px]">
                    Direct Contact Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedLeadForDetail.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedLeadForDetail.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Associated SaaS Product Card */}
                {associatedProd ? (
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs">
                          Associated Product: {associatedProd.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-indigo-300 font-mono">
                        {associatedProd.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {associatedProd.tagline || associatedProd.description}
                    </p>

                    {/* Features Badges */}
                    {associatedProd.features && associatedProd.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {associatedProd.features.slice(0, 4).map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-indigo-900/40 text-indigo-200 text-[10px] border border-indigo-500/20"
                          >
                            • {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                    Target Product: {selectedLeadForDetail.associatedProductName}
                  </div>
                )}

                {/* Linked Historical Calls */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Linked Voice Calls ({linkedCalls.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        const l = selectedLeadForDetail;
                        setSelectedLeadForDetail(null);
                        startCallWithLead(l);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Dial Now</span>
                    </button>
                  </div>

                  {linkedCalls.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-slate-400 text-xs">
                      No historical voice calls logged yet for this lead.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {linkedCalls.map((call) => (
                        <div
                          key={call.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{call.productName}</span>
                              <StatusBadge status={call.status} size="sm" />
                              {call.recordingAvailable && (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                                  <Disc className="w-3 h-3" />
                                  <span>Audio</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                              <span>{call.date} {call.timestamp}</span>
                              <span>•</span>
                              <span>{formatDuration(call.durationSeconds)}</span>
                              <span>•</span>
                              <span>Score: {call.aiScore}%</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedLeadForDetail(null);
                              setSelectedCallId(call.id);
                              setCurrentTab('call-history');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition-all shrink-0"
                          >
                            Inspect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Follow-Up Tasks */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-amber-400" />
                      <span>Associated Follow-Up Tasks ({linkedTasks.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedLeadForDetail(null);
                        setCurrentTab('tasks');
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      View All Tasks
                    </button>
                  </div>

                  {linkedTasks.length === 0 ? (
                    <p className="text-slate-400 italic text-xs">No pending follow-up tasks for this prospect.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {linkedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{task.assigned_to}</span>
                            </div>
                          </div>

                          {task.status !== 'completed' ? (
                            <button
                              onClick={() => markTaskComplete(task.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-semibold transition-all"
                            >
                              Complete
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">Done</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SDR & Qualification Notes */}
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                  <span className="font-semibold text-indigo-300 block uppercase tracking-wider text-[11px] mb-1">
                    AI Qualification & SDR Notes
                  </span>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {selectedLeadForDetail.notes || 'No qualification notes recorded yet.'}
                  </p>
                </div>

                {/* Status Update Quick Selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Update Lead Sales Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allStatuses.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          updateLead(selectedLeadForDetail.id, { salesStatus: st });
                          setSelectedLeadForDetail({
                            ...selectedLeadForDetail,
                            salesStatus: st,
                          });
                          showToast('Status Updated', `${selectedLeadForDetail.name} marked as ${st}.`, 'success');
                        }}
                        className={`p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                          selectedLeadForDetail.salesStatus === st
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Created: {selectedLeadForDetail.createdAt}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLeadForDetail(null)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const l = selectedLeadForDetail;
                      setSelectedLeadForDetail(null);
                      startCallWithLead(l);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Launch Live Voice Call</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Lead Modal */}
      {(isAddLeadModalOpen || editingLead) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleSaveLead}
            className="relative w-full max-w-xl rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingLead ? `Edit ${editingLead.name}` : 'Add New Prospect Lead'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure prospect details and target product for automated voice outreach.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddLeadModalOpen(false);
                  setEditingLead(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 text-xs">
              {/* Name & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikramaditya Sharma"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. FinApex Technologies"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98201 44521"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Product & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target SaaS Product</label>
                  <select
                    value={formData.associatedProductId}
                    onChange={(e) => setFormData({ ...formData, associatedProductId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Preferred Dialect</label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.name}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sales Status & Deal Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sales Status</label>
                  <select
                    value={formData.salesStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, salesStatus: e.target.value as SalesStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {allStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Estimated Deal Value ($)
                  </label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Discovery & Qualification Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record prospect pain points, timeline, tech stack, and specific objections..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddLeadModalOpen(false);
                  setEditingLead(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                {editingLead ? 'Update Lead' : 'Add Lead to Pipeline'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6">
            <h3 className="text-base font-bold text-white">Delete Lead from Pipeline?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to remove this lead record? This action will remove all associated call histories and qualification notes.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLead(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
