import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { FollowUpTask } from '../../types';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  PhoneCall,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Check,
  Building,
  Mail,
  ArrowRight
} from 'lucide-react';

export const FollowUpTasksPage: React.FC = () => {
  const {
    followUpTasks,
    createFollowUpTask,
    updateFollowUpTask,
    markTaskComplete,
    deleteFollowUpTask,
    leads,
    products,
    startCallWithLead,
    setSelectedCallId,
    setCurrentTab,
  } = useApp();
  const { showToast } = useToast();

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FollowUpTask | null>(null);

  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [priorityInput, setPriorityInput] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignedToInput, setAssignedToInput] = useState('Enterprise AE Team');
  const [selectedLeadIdInput, setSelectedLeadIdInput] = useState<string>('');

  const now = new Date();

  // Helper: check if task is overdue
  const isOverdue = (task: FollowUpTask) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.due_date) < now;
  };

  // Filter tasks
  const filteredTasks = followUpTasks.filter((task) => {
    // Tab filter
    if (activeTabFilter === 'pending') {
      if (task.status === 'completed' || task.status === 'cancelled' || isOverdue(task)) return false;
    } else if (activeTabFilter === 'overdue') {
      if (!isOverdue(task)) return false;
    } else if (activeTabFilter === 'completed') {
      if (task.status !== 'completed') return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Assigned filter
    if (assignedFilter !== 'all' && task.assigned_to !== assignedFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        (task.customerName && task.customerName.toLowerCase().includes(q)) ||
        (task.productName && task.productName.toLowerCase().includes(q)) ||
        task.assigned_to.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const pendingCount = followUpTasks.filter((t) => t.status !== 'completed' && !isOverdue(t)).length;
  const overdueCount = followUpTasks.filter((t) => isOverdue(t)).length;
  const completedCount = followUpTasks.filter((t) => t.status === 'completed').length;

  const handleOpenCreateModal = () => {
    setTitleInput('');
    setDescriptionInput('');
    setDueDateInput(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setPriorityInput('high');
    setAssignedToInput('Enterprise AE Team');
    setSelectedLeadIdInput(leads[0]?.id || '');
    setEditingTask(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (task: FollowUpTask) => {
    setEditingTask(task);
    setTitleInput(task.title);
    setDescriptionInput(task.description);
    setDueDateInput(task.due_date ? task.due_date.split('T')[0] : '');
    setPriorityInput(task.priority);
    setAssignedToInput(task.assigned_to);
    setSelectedLeadIdInput(task.lead_id || '');
    setIsCreateModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    const matchedLead = leads.find((l) => l.id === selectedLeadIdInput);

    if (editingTask) {
      await updateFollowUpTask(editingTask.id, {
        title: titleInput.trim(),
        description: descriptionInput.trim(),
        due_date: `${dueDateInput}T17:00:00Z`,
        priority: priorityInput,
        assigned_to: assignedToInput.trim() || 'Enterprise AE Team',
        lead_id: selectedLeadIdInput || undefined,
        customerName: matchedLead?.name || editingTask.customerName,
        customerEmail: matchedLead?.email || editingTask.customerEmail,
        productName: matchedLead?.associatedProductName || editingTask.productName,
      });
    } else {
      await createFollowUpTask({
        title: titleInput.trim(),
        description: descriptionInput.trim(),
        due_date: `${dueDateInput}T17:00:00Z`,
        priority: priorityInput,
        status: 'pending',
        assigned_to: assignedToInput.trim() || 'Enterprise AE Team',
        lead_id: selectedLeadIdInput || undefined,
        customerName: matchedLead?.name || 'Inbound Prospect',
        customerEmail: matchedLead?.email || '',
        productName: matchedLead?.associatedProductName || products[0]?.name || 'OmniFlow CRM',
      });
    }

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Sales Follow-Up & Task Pipeline
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Automated task dispatch derived from post-call AI recommendations. Assign owners, set SLAs, track overdue outreach, and guarantee prompt prospect engagement.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Follow-Up Task</span>
        </button>
      </div>

      {/* SLA & Integration Integrity Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white block">
            Integration Integrity Policy:
          </span>
          <p className="leading-relaxed text-[11px] text-slate-300">
            VoiceSell AI never marks calendar appointments, email dispatches, or telephony callbacks as completed unless verified by the respective CRM or calendar API integration response.
          </p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabFilter('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTabFilter === 'pending'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>Pending Tasks</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-950 text-indigo-300 font-mono text-[10px]">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTabFilter('overdue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTabFilter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
              <span>Overdue Tasks</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-950 text-rose-300 font-mono text-[10px]">
                {overdueCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTabFilter('completed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTabFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300 font-mono text-[10px]">
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTabFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTabFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>All ({followUpTasks.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} shown
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, prospect, product, or assigned SDR..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Priority & Assignee filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Assignee:</span>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Assignees</option>
                <option value="Enterprise AE Team">Enterprise AE Team</option>
                <option value="Enterprise Solutions Architect">Enterprise Solutions Architect</option>
                <option value="Customer Success Manager">Customer Success Manager</option>
                <option value="Compliance & Legal AE">Compliance & Legal AE</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-2xl bg-[#0B132B]/80 border border-slate-800 p-8 space-y-3">
            <ListTodo className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No follow-up tasks match this view</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Completed calls with demo requests or follow-up requirements automatically enqueue new tasks.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task Manually</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  task.status === 'completed'
                    ? 'bg-slate-900/40 border-slate-800 opacity-75'
                    : overdue
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                    : 'bg-[#0B132B]/90 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges: Priority + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : task.priority === 'medium'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    <div className="flex items-center gap-1.5">
                      {overdue ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>OVERDUE</span>
                        </span>
                      ) : task.status === 'completed' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className={`font-bold text-sm text-white ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                      {task.description}
                    </p>
                  </div>

                  {/* Customer & Product Linkage */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-semibold text-white">{task.customerName || 'Inbound Lead'}</span>
                      <span className="text-slate-400">{task.productName || 'SaaS'}</span>
                    </div>
                    {task.customerEmail && (
                      <span className="text-slate-400 text-[10px] block truncate font-mono">
                        {task.customerEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className={`w-3.5 h-3.5 ${overdue ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className={overdue ? 'text-rose-300 font-semibold' : ''}>
                        {new Date(task.due_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate max-w-[120px]">{task.assigned_to}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {task.status !== 'completed' ? (
                      <button
                        onClick={() => markTaskComplete(task.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Complete</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {/* Dial Customer */}
                      {task.customerEmail && (
                        <button
                          onClick={() => {
                            const matchedLead = leads.find((l) => l.email === task.customerEmail);
                            if (matchedLead) {
                              startCallWithLead(matchedLead);
                            } else {
                              setCurrentTab('live-call');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                          title="Call Lead directly"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* View Associated Call */}
                      {task.call_session_id && (
                        <button
                          onClick={() => {
                            setSelectedCallId(task.call_session_id!);
                            setCurrentTab('call-history');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Open origin call session"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteFollowUpTask(task.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Follow-Up Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleSaveTask}
            className="relative w-full max-w-lg rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingTask ? 'Edit Follow-Up Task' : 'Schedule New Follow-Up Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Schedule live sandbox demo with DevOps lead"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Detailed Context / Action Items
              </label>
              <textarea
                rows={3}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Include prospect requirements, objection counter-arguments, and agreed agenda..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Target Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Priority SLA *
                </label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="urgent">Urgent (&lt; 24h SLA)</option>
                  <option value="high">High (48h SLA)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="low">Low (Nurture)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Assigned Owner *
                </label>
                <select
                  value={assignedToInput}
                  onChange={(e) => setAssignedToInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Enterprise AE Team">Enterprise AE Team</option>
                  <option value="Enterprise Solutions Architect">Enterprise Solutions Architect</option>
                  <option value="Customer Success Manager">Customer Success Manager</option>
                  <option value="Compliance & Legal AE">Compliance & Legal AE</option>
                  <option value="Mid-Market AE Team">Mid-Market AE Team</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Associated Lead
                </label>
                <select
                  value={selectedLeadIdInput}
                  onChange={(e) => setSelectedLeadIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No specific lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
