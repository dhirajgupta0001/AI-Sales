import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Product, ProductPricing, ProductFaq, ObjectionGuidance } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  PhoneCall,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Users,
  Target,
  FileText,
  X,
  ChevronRight,
  TrendingUp,
  Globe
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, setCurrentTab } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    category: 'Sales Tech & CRM',
    description: '',
    productWebsite: '',
    targetAudience: '',
    customerPainPoints: [] as string[],
    competitorDifferentiation: '',
    demoBookingProcess: '',
    purchasingInstructions: '',
    salesPitch: '',
    tone: 'Consultative' as Product['tone'],
    preferredLanguage: 'English',
    callToAction: 'Book a 15-minute live architecture demo',
    aiInstructions: '',
    features: ['Instant integration', 'Automated workflow sync'],
    pricing: [
      { tier: 'Starter', price: '$49', period: '/user/mo', billing: 'Billed annually' }
    ] as ProductPricing[],
    faqs: [
      { q: 'What is the setup time?', a: 'Standard setup takes under 30 minutes.' }
    ] as ProductFaq[],
    objectionHandling: [
      { objection: 'We are already locked into another tool.', counter: 'We provide dual-running for 30 days with verified ROI.' }
    ] as ObjectionGuidance[],
    active: true
  });

  // Feature input temp state
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newPainPointText, setNewPainPointText] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newObjText, setNewObjText] = useState('');
  const [newObjCounter, setNewObjCounter] = useState('');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      tagline: '',
      category: 'DevOps & Cloud Infrastructure',
      description: '',
      productWebsite: 'https://',
      targetAudience: '',
      customerPainPoints: ['High manual overhead and repetitive workflows', 'Disconnected data silos slowing decision velocity'],
      competitorDifferentiation: 'Architected with modern zero-overhead automation, predictable pricing, and 30-minute self-serve onboarding.',
      demoBookingProcess: 'Offer two specific 15-minute time slots (tomorrow or Thursday) to walk through a live architecture demo. Confirm attendee email before submitting.',
      purchasingInstructions: 'Direct customer to self-serve sign up page or coordinate an enterprise evaluation invoice.',
      salesPitch: '',
      tone: 'Consultative',
      preferredLanguage: 'English',
      callToAction: 'Book a 15-minute live architecture demo',
      aiInstructions: 'Adopt an executive consultative posture and identify pain points before proposing tiers.',
      features: ['Automated cloud sync', 'Multi-tenant isolation'],
      pricing: [{ tier: 'Growth', price: '$99', period: '/mo', billing: 'Billed annually' }],
      faqs: [{ q: 'Is customer data private?', a: 'Yes, SOC-2 compliant and zero retention.' }],
      objectionHandling: [{ objection: 'Budget is frozen.', counter: 'Our customers save 3.4x ROI within 45 days.' }],
      active: true
    });
    setNewFeatureText('');
    setNewPainPointText('');
    setNewFaqQ('');
    setNewFaqA('');
    setNewObjText('');
    setNewObjCounter('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      tagline: prod.tagline,
      category: prod.category,
      description: prod.description,
      productWebsite: prod.productWebsite,
      targetAudience: prod.targetAudience,
      customerPainPoints: prod.customerPainPoints ? [...prod.customerPainPoints] : [],
      competitorDifferentiation: prod.competitorDifferentiation || '',
      demoBookingProcess: prod.demoBookingProcess || '',
      purchasingInstructions: prod.purchasingInstructions || '',
      salesPitch: prod.salesPitch,
      tone: prod.tone,
      preferredLanguage: prod.preferredLanguage,
      callToAction: prod.callToAction,
      aiInstructions: prod.aiInstructions,
      features: [...prod.features],
      pricing: [...prod.pricing],
      faqs: [...prod.faqs],
      objectionHandling: [...prod.objectionHandling],
      active: prod.active
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.salesPitch.trim()) {
      showToast('Validation Error', 'Product Name and Sales Pitch are required fields.', 'warning');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData
      });
      showToast('Product Updated', `${formData.name} updated with customized AI instructions.`, 'success');
      setEditingProduct(null);
    } else {
      addProduct({
        ...formData
      });
      showToast('Product Created', `${formData.name} has been added to VoiceSell AI playbook.`, 'success');
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    deleteProduct(id);
    setDeleteConfirmId(null);
    showToast('Product Deleted', `${prod?.name || 'Product'} was removed.`, 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              SaaS Products & AI Sales Playbooks
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Configure value propositions, pricing tiers, objection-handling logic, and tone of voice for each SaaS product sold by the voice agent fleet.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New SaaS Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, tagline, features..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
            <Package className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">No SaaS Products Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No products match your search or category filter. Click below to add a new product.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Create First Product
            </button>
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {prod.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300">
                        {prod.tone}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{prod.tagline}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                      title="Edit Product Playbook"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(prod.id)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {prod.description}
                </p>

                {/* Sales Pitch Box */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <span className="font-semibold text-indigo-400 block mb-1 text-[11px] uppercase tracking-wider">
                    Core AI Pitch
                  </span>
                  <p className="text-slate-200 italic">"{prod.salesPitch}"</p>
                </div>

                {/* Key Features pills */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                    Value Props & Features ({prod.features.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {prod.features.slice(0, 3).map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 truncate max-w-xs"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                    {prod.features.length > 3 && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                        +{prod.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Pain Points preview */}
                {prod.customerPainPoints && prod.customerPainPoints.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                      Target Pain Point ({prod.customerPainPoints.length} configured)
                    </span>
                    <p className="text-[11px] text-amber-200/90 line-clamp-1">
                      • {prod.customerPainPoints[0]}
                    </p>
                  </div>
                )}

                {/* Pricing summary */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Starts at: </span>
                    <strong className="text-white font-mono">
                      {prod.pricing[0]?.price} {prod.pricing[0]?.period}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Globe className="w-3 h-3 text-indigo-400" />
                    <span>{prod.preferredLanguage}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setViewProduct(prod)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <span>View Full Playbook & Objections</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('live-call');
                    showToast('Voice Pitch Loaded', `Pre-selected ${prod.name} for live voice agent studio.`, 'info');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Test in Live Call</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{viewProduct.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {viewProduct.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{viewProduct.tagline}</p>
              </div>
              <button
                onClick={() => setViewProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-2">
              {/* Pitch & CTA */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                  Configured Sales Pitch & Call-to-Action
                </span>
                <p className="text-sm text-slate-100 font-medium">"{viewProduct.salesPitch}"</p>
                <div className="flex items-center gap-2 pt-2 text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400">Target CTA:</span>
                  <span>{viewProduct.callToAction}</span>
                </div>
              </div>

              {/* Target Audience & Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">Target Audience</span>
                  <p className="text-slate-400 leading-relaxed">{viewProduct.targetAudience}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">Tone & Language</span>
                  <p className="text-slate-400">
                    Tone: <strong className="text-slate-200">{viewProduct.tone}</strong>
                    <br />
                    Default Dialect: <strong className="text-slate-200">{viewProduct.preferredLanguage}</strong>
                  </p>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Pricing Tiers Configured
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {viewProduct.pricing.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                    >
                      <span className="font-bold text-white block">{tier.tier}</span>
                      <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                        {tier.price} <span className="text-xs font-normal text-slate-400">{tier.period}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">{tier.billing}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objection Handling */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Objection-Handling Guidance ({viewProduct.objectionHandling.length})
                </span>
                <div className="space-y-2.5">
                  {viewProduct.objectionHandling.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="font-semibold text-amber-300 flex items-start gap-1.5">
                        <span>Prospect Objection:</span>
                        <span className="text-slate-200 font-normal">"{item.objection}"</span>
                      </div>
                      <div className="font-semibold text-indigo-300 flex items-start gap-1.5">
                        <span>Agent Counter:</span>
                        <span className="text-slate-300 font-normal">"{item.counter}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Pain Points */}
              {viewProduct.customerPainPoints && viewProduct.customerPainPoints.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Customer Pain Points Addressed ({viewProduct.customerPainPoints.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewProduct.customerPainPoints.map((pp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{pp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitor Differentiation */}
              {viewProduct.competitorDifferentiation && (
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Competitor Differentiation & Moat
                  </span>
                  <p className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {viewProduct.competitorDifferentiation}
                  </p>
                </div>
              )}

              {/* Demo Booking & Purchasing Protocols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {viewProduct.demoBookingProcess && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1 uppercase text-[10px] tracking-wider">
                      Demo Booking Protocol
                    </span>
                    <p className="text-slate-300 leading-relaxed">{viewProduct.demoBookingProcess}</p>
                  </div>
                )}
                {viewProduct.purchasingInstructions && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1 uppercase text-[10px] tracking-wider">
                      Purchasing Instructions / CTA
                    </span>
                    <p className="text-slate-300 leading-relaxed">{viewProduct.purchasingInstructions}</p>
                  </div>
                )}
              </div>

              {/* FAQs */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Product FAQs
                </span>
                <div className="space-y-2">
                  {viewProduct.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <p className="font-semibold text-slate-200">Q: {faq.q}</p>
                      <p className="text-slate-400 mt-1">A: {faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Prompt Instructions */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  System Prompt Instructions for Voice Agent
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {viewProduct.aiInstructions}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Created: {viewProduct.createdAt} • Calls: {viewProduct.callCount || 0}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    handleOpenEditModal(p);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                >
                  Edit Playbook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {(isCreateModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleSaveProduct}
            className="relative w-full max-w-3xl rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? `Edit ${editingProduct.name}` : 'Create New SaaS Product'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calibrate the AI sales agent's pitch, objections, and conversation boundaries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 text-xs">
              {/* Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. OmniFlow CRM"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Autonomous AI Sales & Pipeline Acceleration"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category, Website, Tone, Language */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sales Tech & CRM">Sales Tech & CRM</option>
                    <option value="DevOps & Cloud Infrastructure">DevOps & Cloud Infrastructure</option>
                    <option value="Cybersecurity & Compliance">Cybersecurity & Compliance</option>
                    <option value="Developer Productivity">Developer Productivity</option>
                    <option value="AI & Analytics">AI & Analytics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sales Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) =>
                      setFormData({ ...formData, tone: e.target.value as Product['tone'] })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Consultative">Consultative</option>
                    <option value="Challenger">Challenger</option>
                    <option value="Enthusiastic">Enthusiastic</option>
                    <option value="Friendly & Professional">Friendly & Professional</option>
                    <option value="Direct & ROI-focused">Direct & ROI-focused</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Default Dialect</label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) =>
                      setFormData({ ...formData, preferredLanguage: e.target.value })
                    }
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

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide an overview of the SaaS product..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target Audience & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="e.g. CTOs, VP of Engineering, SRE leads"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Website</label>
                  <input
                    type="url"
                    value={formData.productWebsite}
                    onChange={(e) => setFormData({ ...formData, productWebsite: e.target.value })}
                    placeholder="https://yourproduct.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sales Pitch & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Core Sales Pitch *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.salesPitch}
                    onChange={(e) => setFormData({ ...formData, salesPitch: e.target.value })}
                    placeholder="The 1-2 sentence hook the voice agent delivers..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Call to Action (CTA)</label>
                  <textarea
                    rows={2}
                    value={formData.callToAction}
                    onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                    placeholder="e.g. Schedule a 15-minute live architecture demo"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Customer Pain Points */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-300">Target Customer Pain Points</label>
                  <span className="text-[10px] text-slate-400">Used for discovery & qualification</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPainPointText}
                    onChange={(e) => setNewPainPointText(e.target.value)}
                    placeholder="e.g. Sales reps spending 65% of time on manual data entry..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPainPointText.trim()) return;
                      setFormData({
                        ...formData,
                        customerPainPoints: [...formData.customerPainPoints, newPainPointText.trim()],
                      });
                      setNewPainPointText('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0"
                  >
                    Add Pain Point
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.customerPainPoints.map((pp, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-200 border border-amber-800/60 text-xs"
                    >
                      <span>• {pp}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            customerPainPoints: formData.customerPainPoints.filter((_, idx) => idx !== i),
                          })
                        }
                        className="text-amber-400 hover:text-rose-400 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Competitor Differentiation */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Competitor Differentiation & Competitive Moat
                </label>
                <textarea
                  rows={2}
                  value={formData.competitorDifferentiation}
                  onChange={(e) => setFormData({ ...formData, competitorDifferentiation: e.target.value })}
                  placeholder="Explain how this product differentiates against key alternatives (e.g. Salesforce, Datadog)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Demo Booking Process & Purchasing Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Demo Booking Protocol</label>
                  <textarea
                    rows={2}
                    value={formData.demoBookingProcess}
                    onChange={(e) => setFormData({ ...formData, demoBookingProcess: e.target.value })}
                    placeholder="e.g. Propose 2 time slots for a 15-minute live demo..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Purchasing Instructions / CTA</label>
                  <textarea
                    rows={2}
                    value={formData.purchasingInstructions}
                    onChange={(e) => setFormData({ ...formData, purchasingInstructions: e.target.value })}
                    placeholder="e.g. Direct customer to https://example.com/pricing..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Features List */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="block font-semibold text-slate-300">Features & Capabilities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder="Add a new feature bullet..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFeatureText.trim()) return;
                      setFormData({ ...formData, features: [...formData.features, newFeatureText.trim()] });
                      setNewFeatureText('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            features: formData.features.filter((_, idx) => idx !== i)
                          })
                        }
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Instructions */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  AI Instructions & Conversation Boundary Rules
                </label>
                <textarea
                  rows={3}
                  value={formData.aiInstructions}
                  onChange={(e) => setFormData({ ...formData, aiInstructions: e.target.value })}
                  placeholder="Specific rules for the AI agent (e.g., Uncover SDR pain points before discussing tier pricing...)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                {editingProduct ? 'Save Changes' : 'Create SaaS Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6">
            <h3 className="text-base font-bold text-white">Delete Product Playbook?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to remove this product? Voice agents will no longer have access to this sales pitch and objection handling configuration.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
