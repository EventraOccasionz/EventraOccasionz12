import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Copy, Eye, EyeOff, Loader2, Image as ImageIcon, 
  Settings, Sparkles, HelpCircle, Film, DollarSign, ArrowUp, ArrowDown, 
  Link as LinkIcon, Search, Upload, Check, ChevronRight, RefreshCcw
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Category, SubCategory, Service, MediaItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ServicesTabProps {
  filteredServices?: any[];
  services?: any[];
  handleShiftServiceOrder?: any;
  toggleServiceVisibility?: any;
  openServiceModal?: any;
  handleDeleteService?: any;
}

export default function ServicesTab(props: ServicesTabProps) {
  const [cmsTab, setCmsTab] = useState<'categories' | 'subcategories' | 'services' | 'media'>('categories');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);

  // Action/Modal states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form States (Modals)
  const [categoryModal, setCategoryModal] = useState<{ show: boolean; mode: 'add' | 'edit'; data: Partial<Category> | null }>({ show: false, mode: 'add', data: null });
  const [subcategoryModal, setSubcategoryModal] = useState<{ show: boolean; mode: 'add' | 'edit'; data: Partial<SubCategory> | null }>({ show: false, mode: 'add', data: null });
  const [serviceModal, setServiceModal] = useState<{ show: boolean; mode: 'add' | 'edit'; data: Partial<Service> | null }>({ show: false, mode: 'add', data: null });

  // Load all data
  const loadCmsData = async () => {
    setLoading(true);
    try {
      let [cats, subs, servs, media] = await Promise.all([
        dataService.getCategories(),
        dataService.getSubCategories(),
        dataService.getServices(),
        dataService.getMediaLibrary()
      ]);

      // Auto-populate trigger
      if (cats.length === 0 && servs.length === 0) {
        console.log("Database is empty. Auto-populating initial data...");
        try {
          const { seedDatabase } = await import('../../services/seed/seedDatabase');
          await seedDatabase();
          // Reload after seeding
          const [newCats, newSubs, newServs] = await Promise.all([
            dataService.getCategories(),
            dataService.getSubCategories(),
            dataService.getServices(),
          ]);
          cats = newCats;
          subs = newSubs;
          servs = newServs;
        } catch (seedErr) {
          console.error("Auto-population failed:", seedErr);
        }
      }

      setCategories(cats);
      setSubCategories(subs);
      setServices(servs);
      setMediaLibrary(media);
    } catch (err) {
      console.error('Error loading CMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  // Utility to generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Image upload helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, onComplete: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const b64 = await dataService.uploadImage(file);
      onComplete(b64);
      // Automatically index in Central Media Library too
      await dataService.addMediaItem({
        name: file.name,
        url: b64,
        type: 'image',
        folder: cmsTab.toUpperCase(),
        size: file.size
      });
      // Refresh media state
      const media = await dataService.getMediaLibrary();
      setMediaLibrary(media);
    } catch (err) {
      alert('Upload failed: ' + err);
    } finally {
      setUploadingImage(false);
    }
  };

  // CATEGORIES LOGIC
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryModal.data?.name) return;
    const cleanData = {
      ...categoryModal.data,
      slug: categoryModal.data.slug || generateSlug(categoryModal.data.name)
    };

    try {
      if (categoryModal.mode === 'add') {
        await dataService.addCategory(cleanData);
      } else {
        await dataService.updateCategory(categoryModal.data.id!, cleanData);
      }
      setCategoryModal({ show: false, mode: 'add', data: null });
      loadCmsData();
    } catch (err) {
      alert('Save Category failed: ' + err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Category? All children Sub-Categories and Services may be orphaned.')) return;
    try {
      await dataService.deleteCategory(id);
      loadCmsData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleDuplicateCategory = async (cat: Category) => {
    try {
      await dataService.duplicateCategory(cat);
      loadCmsData();
    } catch (e) {
      alert('Duplicate failed.');
    }
  };

  const handleShiftCategoryOrder = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const itemA = categories[idx];
    const itemB = categories[targetIdx];

    try {
      await dataService.updateCategory(itemA.id, { display_order: itemB.display_order });
      await dataService.updateCategory(itemB.id, { display_order: itemA.display_order });
      loadCmsData();
    } catch (err) {
      alert('Reorder failed.');
    }
  };

  // SUBCATEGORIES LOGIC
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryModal.data?.name || !subcategoryModal.data?.category_id) return;
    
    // Auto populate category slug
    const parentCat = categories.find(c => c.id === subcategoryModal.data?.category_id);
    const cleanData = {
      ...subcategoryModal.data,
      category_slug: parentCat?.slug || '',
      slug: subcategoryModal.data.slug || generateSlug(subcategoryModal.data.name)
    };

    try {
      if (subcategoryModal.mode === 'add') {
        await dataService.addSubCategory(cleanData);
      } else {
        await dataService.updateSubCategory(subcategoryModal.data.id!, cleanData);
      }
      setSubcategoryModal({ show: false, mode: 'add', data: null });
      loadCmsData();
    } catch (err) {
      alert('Save Sub-Category failed.');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Sub-Category?')) return;
    try {
      await dataService.deleteSubCategory(id);
      loadCmsData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleShiftSubcategoryOrder = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= subCategories.length) return;

    const itemA = subCategories[idx];
    const itemB = subCategories[targetIdx];

    try {
      await dataService.updateSubCategory(itemA.id, { display_order: itemB.display_order });
      await dataService.updateSubCategory(itemB.id, { display_order: itemA.display_order });
      loadCmsData();
    } catch (err) {
      alert('Reorder failed.');
    }
  };

  // SERVICES LOGIC
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModal.data?.name || !serviceModal.data?.category_id) return;

    const parentCat = categories.find(c => c.id === serviceModal.data?.category_id);
    const parentSub = subCategories.find(s => s.id === serviceModal.data?.sub_category_id);

    const cleanData = {
      ...serviceModal.data,
      category_slug: parentCat?.slug || '',
      sub_category_slug: parentSub?.slug || '',
      slug: serviceModal.data.slug || generateSlug(serviceModal.data.name)
    };

    try {
      if (serviceModal.mode === 'add') {
        await dataService.addService(cleanData);
      } else {
        await dataService.updateService(serviceModal.data.id!, cleanData);
      }
      setServiceModal({ show: false, mode: 'add', data: null });
      loadCmsData();
    } catch (err) {
      alert('Save Service failed: ' + err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Service Portfolio?')) return;
    try {
      await dataService.deleteService(id);
      loadCmsData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleShiftServiceOrder = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= services.length) return;

    const itemA = services[idx];
    const itemB = services[targetIdx];

    try {
      await dataService.updateService(itemA.id, { display_order: itemB.display_order || 0 });
      await dataService.updateService(itemB.id, { display_order: itemA.display_order || 0 });
      loadCmsData();
    } catch (err) {
      alert('Reorder failed.');
    }
  };

  // MEDIA LOGIC
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const b64 = await dataService.uploadImage(file);
      await dataService.addMediaItem({
        name: file.name,
        url: b64,
        type: 'image',
        folder: 'MediaLibrary',
        size: file.size
      });
      loadCmsData();
    } catch (err) {
      alert('Media Upload failed: ' + err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Permanently delete this item from the media pool?')) return;
    try {
      await dataService.deleteMediaItem(id);
      loadCmsData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Search Filter
  const filteredCategories = categories.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.desc || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#121212] p-8 border border-white/5 rounded-2xl shadow-2xl relative text-cream">
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div>
          <span className="text-[0.6rem] tracking-[0.3em] uppercase text-gold block mb-1">Central Website Control</span>
          <h2 className="font-serif text-3xl text-cream flex items-center gap-2">
            <Sparkles className="text-gold" size={24} />
            Occasionz CMS Portfolio
          </h2>
        </div>

        <button 
          onClick={loadCmsData}
          className="p-3 bg-white/5 hover:bg-gold/10 hover:text-gold border border-white/10 rounded-xl transition-all flex items-center gap-2 text-xs uppercase tracking-widest font-mono cursor-pointer"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Sync Firestore
        </button>
      </div>

      {/* Main CMS Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/5 w-fit">
        <button 
          onClick={() => { setCmsTab('categories'); setSearchTerm(''); }}
          className={`px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-mono font-bold transition-all ${
            cmsTab === 'categories' ? 'bg-gold text-dark shadow-lg' : 'text-text-secondary hover:text-cream'
          }`}
        >
          Level 1: Categories ({categories.length})
        </button>
        <button 
          onClick={() => { setCmsTab('subcategories'); setSearchTerm(''); }}
          className={`px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-mono font-bold transition-all ${
            cmsTab === 'subcategories' ? 'bg-gold text-dark shadow-lg' : 'text-text-secondary hover:text-cream'
          }`}
        >
          Level 2: Sub-Categories ({subCategories.length})
        </button>
        <button 
          onClick={() => { setCmsTab('services'); setSearchTerm(''); }}
          className={`px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-mono font-bold transition-all ${
            cmsTab === 'services' ? 'bg-gold text-dark shadow-lg' : 'text-text-secondary hover:text-cream'
          }`}
        >
          Level 3: Services Details ({services.length})
        </button>
        <button 
          onClick={() => { setCmsTab('media'); setSearchTerm(''); }}
          className={`px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-mono font-bold transition-all ${
            cmsTab === 'media' ? 'bg-gold text-dark shadow-lg' : 'text-text-secondary hover:text-cream'
          }`}
        >
          Media Library ({mediaLibrary.length})
        </button>
      </div>

      {/* Search Bar & Primary Actions bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 text-text-secondary" size={16} />
          <input
            type="text"
            placeholder={`Filter ${cmsTab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
          />
        </div>

        {/* Primary Action Button based on Active CmsTab */}
        <div>
          {cmsTab === 'categories' && (
            <button 
              onClick={() => setCategoryModal({ show: true, mode: 'add', data: { display_order: categories.length + 1, status: 'Published', show_on_homepage: true, featured: false, robots_index: true } })}
              className="px-6 py-3.5 bg-gold text-dark font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:bg-gold/90 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Category
            </button>
          )}
          {cmsTab === 'subcategories' && (
            <button 
              onClick={() => setSubcategoryModal({ show: true, mode: 'add', data: { display_order: subCategories.length + 1, status: 'Published', show_on_homepage: true, featured: false, robots_index: true } })}
              className="px-6 py-3.5 bg-gold text-dark font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:bg-gold/90 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Sub-Category
            </button>
          )}
          {cmsTab === 'services' && (
            <button 
              onClick={() => setServiceModal({ show: true, mode: 'add', data: { display_order: services.length + 1, status: 'Published', show_on_homepage: true, featured: false, robots_index: true, feats: [], highlights: [], faqs: [] } })}
              className="px-6 py-3.5 bg-gold text-dark font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:bg-gold/90 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Service Portfolio
            </button>
          )}
          {cmsTab === 'media' && (
            <div className="relative">
              <input
                type="file"
                id="media-library-upload"
                className="hidden"
                accept="image/*"
                onChange={handleMediaUpload}
              />
              <label 
                htmlFor="media-library-upload"
                className="px-6 py-3.5 bg-gold text-dark font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:bg-gold/90 flex items-center gap-2 cursor-pointer"
              >
                <Upload size={16} /> Upload Media
              </label>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="text-gold animate-spin" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          
          {/* LEVEL 1: CATEGORIES CONSOLE */}
          {cmsTab === 'categories' && (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="text-[10px] text-gold uppercase tracking-widest border-b border-white/10 font-mono">
                <tr>
                  <th className="py-4 px-4">Display Order</th>
                  <th className="py-4 px-4">Category Curation</th>
                  <th className="py-4 px-4">URL Slug</th>
                  <th className="py-4 px-4">Visibility</th>
                  <th className="py-4 px-4">Homepage / Featured</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-text-secondary">
                {filteredCategories.map((cat, idx) => (
                  <tr key={cat.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-mono">
                        <button 
                          disabled={idx === 0}
                          onClick={() => handleShiftCategoryOrder(idx, 'up')}
                          className="p-1 hover:text-gold disabled:opacity-20"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button 
                          disabled={idx === categories.length - 1}
                          onClick={() => handleShiftCategoryOrder(idx, 'down')}
                          className="p-1 hover:text-gold disabled:opacity-20"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <span className="text-[10px] opacity-40 ml-2">#{cat.display_order}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon || '✨'}</span>
                        <div>
                          <p className="text-cream text-sm font-serif font-semibold">{cat.name}</p>
                          <p className="text-[10px] opacity-60 line-clamp-1 max-w-xs">{cat.short_desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-gold/80">
                      /services/{cat.slug}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold ${
                        cat.status === 'Published' ? 'bg-green-500/10 text-green-400' : cat.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[10px] space-y-1">
                      <p>Show on Homepage: <span className={cat.show_on_homepage ? 'text-green-400' : 'text-red-400'}>{cat.show_on_homepage ? 'YES' : 'NO'}</span></p>
                      <p>Featured Category: <span className={cat.featured ? 'text-gold' : 'text-cream/40'}>{cat.featured ? 'YES' : 'NO'}</span></p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => handleDuplicateCategory(cat)}
                          className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded-lg"
                          title="Duplicate Category Profile"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => setCategoryModal({ show: true, mode: 'edit', data: cat })}
                          className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded-lg"
                          title="Edit Category Properties"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded-lg"
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* LEVEL 2: SUB-CATEGORIES CONSOLE */}
          {cmsTab === 'subcategories' && (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="text-[10px] text-gold uppercase tracking-widest border-b border-white/10 font-mono">
                <tr>
                  <th className="py-4 px-4">Display Order</th>
                  <th className="py-4 px-4">Sub-Category Curation</th>
                  <th className="py-4 px-4">Parent Category</th>
                  <th className="py-4 px-4">URL Slug</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-text-secondary">
                {filteredSubCategories.map((sub, idx) => {
                  const parent = categories.find(c => c.id === sub.category_id);
                  return (
                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 font-mono">
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleShiftSubcategoryOrder(idx, 'up')}
                            className="p-1 hover:text-gold disabled:opacity-20"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            disabled={idx === subCategories.length - 1}
                            onClick={() => handleShiftSubcategoryOrder(idx, 'down')}
                            className="p-1 hover:text-gold disabled:opacity-20"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <span className="text-[10px] opacity-40 ml-2">#{sub.display_order}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-cream text-sm font-serif font-semibold">{sub.name}</p>
                        <p className="text-[10px] opacity-60 line-clamp-1 max-w-xs">{sub.short_desc}</p>
                      </td>
                      <td className="py-4 px-4 text-gold/90 font-serif font-medium">
                        {parent?.name || sub.category_slug}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-text-secondary/70">
                        /services/{parent?.slug || sub.category_slug}/{sub.slug}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold ${
                          sub.status === 'Published' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setSubcategoryModal({ show: true, mode: 'edit', data: sub })}
                            className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded-lg"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubcategory(sub.id)}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* LEVEL 3: SERVICES CONSOLE */}
          {cmsTab === 'services' && (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="text-[10px] text-gold uppercase tracking-widest border-b border-white/10 font-mono">
                <tr>
                  <th className="py-4 px-4">Display Order</th>
                  <th className="py-4 px-4">Service Details</th>
                  <th className="py-4 px-4">Category Curation Map</th>
                  <th className="py-4 px-4">SEO Route Mapping</th>
                  <th className="py-4 px-4">Estimated Rate</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-text-secondary">
                {filteredServices.map((serv, idx) => {
                  const parentCat = categories.find(c => c.id === serv.category_id || c.slug === serv.category_slug);
                  const parentSub = subCategories.find(s => s.id === serv.sub_category_id || s.slug === serv.sub_category_slug);
                  return (
                    <tr key={serv.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 font-mono">
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleShiftServiceOrder(idx, 'up')}
                            className="p-1 hover:text-gold disabled:opacity-20"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            disabled={idx === services.length - 1}
                            onClick={() => handleShiftServiceOrder(idx, 'down')}
                            className="p-1 hover:text-gold disabled:opacity-20"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <span className="text-[10px] opacity-40 ml-2">#{serv.display_order || idx + 1}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2">
                          <span className="text-2xl pt-0.5">{serv.ico || '✨'}</span>
                          <div>
                            <p className="text-cream text-sm font-serif font-semibold">{serv.name}</p>
                            <p className="text-[10px] opacity-65 line-clamp-1 max-w-xs">{serv.desc || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[10px] leading-relaxed">
                        <p className="text-gold">Cat: {parentCat?.name || serv.category_slug || 'General'}</p>
                        <p className="text-text-secondary">Sub: {parentSub?.name || serv.sub_category_slug || 'General'}</p>
                      </td>
                      <td className="py-4 px-4 font-mono text-[9px] text-text-secondary/70 truncate max-w-[200px]" title={`/services/${parentCat?.slug || 'general'}/${parentSub?.slug || 'general'}/${serv.slug || serv.id}`}>
                        /{parentCat?.slug || 'general'}/{parentSub?.slug || 'general'}/{serv.slug || serv.id}
                      </td>
                      <td className="py-4 px-4 font-mono text-gold text-xs font-semibold">
                        {serv.starting_from || serv.price || 'Custom pricing'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold ${
                          (serv.status || 'Published') === 'Published' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {serv.status || 'Published'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setServiceModal({ show: true, mode: 'edit', data: serv })}
                            className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded-lg"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteService(serv.id)}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* MEDIA LIBRARY CONSOLE */}
          {cmsTab === 'media' && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {mediaLibrary.map((item) => (
                  <div key={item.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                    <div>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/5 mb-3">
                        <img 
                          src={item.url} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-dark/80 backdrop-blur border border-white/10 rounded text-[9px] font-mono text-text-secondary">
                          {item.folder}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-cream truncate mb-1" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[9px] font-mono opacity-50 mb-3">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 pt-2 border-t border-white/5">
                      <button
                        onClick={() => copyToClipboard(item.url, item.id)}
                        className="w-full py-2 bg-white/5 hover:bg-gold/15 hover:text-gold text-[10px] uppercase tracking-widest font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check size={12} className="text-green-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <LinkIcon size={12} /> Copy link
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded-lg"
                        title="Delete Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {mediaLibrary.length === 0 && (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                  <ImageIcon className="text-white/20 mx-auto mb-3" size={40} />
                  <p className="text-text-secondary uppercase tracking-widest font-mono text-xs opacity-50">
                    Media library empty. Upload assets above.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* CMS CATEGORY EDITOR MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {categoryModal.show && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCategoryModal({ show: false, mode: 'add', data: null })}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-dark-2 border border-gold/30 p-8 z-[5001] rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="font-serif text-2xl text-gold mb-6 border-b border-white/5 pb-3">
                {categoryModal.mode === 'add' ? 'Create Luxury Category' : `Edit Category Settings`}
              </h3>

              <form onSubmit={handleSaveCategory} className="space-y-6">
                
                {/* 1. Core Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Category Name *</label>
                    <input
                      required
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-cream"
                      placeholder="e.g. Destination Weddings"
                      value={categoryModal.data?.name || ''}
                      onChange={e => {
                        const name = e.target.value;
                        const slug = generateSlug(name);
                        setCategoryModal(prev => ({
                          ...prev,
                          data: { ...prev.data, name, slug }
                        }));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">URL Slug *</label>
                    <input
                      required
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-gold"
                      placeholder="destination-weddings"
                      value={categoryModal.data?.slug || ''}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Category Icon (Emoji/Char)</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-center text-lg"
                      placeholder="💍"
                      maxLength={4}
                      value={categoryModal.data?.icon || ''}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, icon: e.target.value } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Display Order Index</label>
                    <input
                      type="number"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-center font-mono"
                      value={categoryModal.data?.display_order || ''}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, display_order: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Status Visibility</label>
                    <select
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl cursor-pointer text-cream"
                      value={categoryModal.data?.status || 'Published'}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as any } }))}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Short Description</label>
                  <textarea
                    rows={2}
                    className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-text-primary"
                    placeholder="Short summary for luxury portfolio cards..."
                    value={categoryModal.data?.short_desc || ''}
                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, short_desc: e.target.value } }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Full Description (Markdown / Detailed)</label>
                  <textarea
                    rows={4}
                    className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-text-primary"
                    placeholder="Grand, multi-paragraph visual description detailing the scope..."
                    value={categoryModal.data?.full_desc || ''}
                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, full_desc: e.target.value } }))}
                  />
                </div>

                {/* Media Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 border border-white/5 rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Thumbnail Asset URL</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-cream"
                      placeholder="Base64 / URL path"
                      value={categoryModal.data?.thumbnail_image || ''}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, thumbnail_image: e.target.value } }))}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="cat-thumb-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, thumbnail_image: url } })))}
                      />
                      <label htmlFor="cat-thumb-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                        <Upload size={10} /> Auto compress file
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Featured Banner URL</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-cream"
                      placeholder="Base64 / URL path"
                      value={categoryModal.data?.banner_image || ''}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, banner_image: e.target.value } }))}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="cat-banner-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, banner_image: url } })))}
                      />
                      <label htmlFor="cat-banner-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                        <Upload size={10} /> Auto compress file
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Homepage control parameters */}
                <div className="p-4 bg-gold/5 border border-gold/15 rounded-xl space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-gold font-mono font-bold">Homepage & Featured Controls</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categoryModal.data?.show_on_homepage || false}
                        onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, show_on_homepage: e.target.checked } }))}
                      />
                      Show On Homepage
                    </label>
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categoryModal.data?.featured || false}
                        onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, featured: e.target.checked } }))}
                      />
                      Featured Category
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">Homepage Custom Description</label>
                      <input
                        type="text"
                        className="bg-black/40 border border-white/10 p-2.5 text-xs outline-none focus:border-gold rounded-xl text-cream"
                        placeholder="Brief banner subtitle"
                        value={categoryModal.data?.homepage_desc || ''}
                        onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, homepage_desc: e.target.value } }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">Homepage Button Custom Text</label>
                      <input
                        type="text"
                        className="bg-black/40 border border-white/10 p-2.5 text-xs outline-none focus:border-gold rounded-xl text-cream"
                        placeholder="e.g. Learn More"
                        value={categoryModal.data?.homepage_btn_text || ''}
                        onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, homepage_btn_text: e.target.value } }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SEO Settings */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-text-secondary font-mono font-bold flex items-center gap-2">
                    <Settings size={12} /> SEO & Indexing Meta (Dynamic Sitemap Integration)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">Meta Title Override</label>
                      <input
                        type="text"
                        className="bg-black/40 border border-white/10 p-2.5 text-xs outline-none focus:border-gold rounded-xl text-cream"
                        placeholder="Leave empty to use Category Name"
                        value={categoryModal.data?.seo_title || ''}
                        onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, seo_title: e.target.value } }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">Meta Keywords</label>
                      <input
                        type="text"
                        className="bg-black/40 border border-white/10 p-2.5 text-xs outline-none focus:border-gold rounded-xl text-cream"
                        placeholder="wedding planner, luxury decor, stage props"
                        value={categoryModal.data?.seo_keywords || ''}
                        onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, seo_keywords: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">Meta Description</label>
                    <textarea
                      rows={2}
                      className="bg-black/40 border border-white/10 p-2.5 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream"
                      placeholder="Google Search Snippet copy..."
                      value={categoryModal.data?.seo_description || ''}
                      onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, seo_description: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setCategoryModal({ show: false, mode: 'add', data: null })}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase tracking-widest font-mono font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gold text-dark text-xs uppercase tracking-widest font-mono font-bold rounded-xl transition-all"
                  >
                    {uploadingImage ? 'Uploading assets...' : 'Commit Category to Database'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* CMS SUB-CATEGORY EDITOR MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {subcategoryModal.show && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSubcategoryModal({ show: false, mode: 'add', data: null })}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-dark-2 border border-gold/30 p-8 z-[5001] rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="font-serif text-2xl text-gold mb-6 border-b border-white/5 pb-3">
                {subcategoryModal.mode === 'add' ? 'Create Sub-Category' : 'Edit Sub-Category'}
              </h3>

              <form onSubmit={handleSaveSubcategory} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Parent Category *</label>
                    <select
                      required
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl cursor-pointer text-cream"
                      value={subcategoryModal.data?.category_id || ''}
                      onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, category_id: e.target.value } }))}
                    >
                      <option value="">Select a Parent Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Sub-Category Name *</label>
                    <input
                      required
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-cream"
                      placeholder="e.g. Venue Selection"
                      value={subcategoryModal.data?.name || ''}
                      onChange={e => {
                        const name = e.target.value;
                        const slug = generateSlug(name);
                        setSubcategoryModal(prev => ({
                          ...prev,
                          data: { ...prev.data, name, slug }
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">URL Slug Override *</label>
                    <input
                      required
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-gold"
                      placeholder="venue-selection"
                      value={subcategoryModal.data?.slug || ''}
                      onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Display Order Index</label>
                    <input
                      type="number"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-center font-mono"
                      value={subcategoryModal.data?.display_order || ''}
                      onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, display_order: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Status Visibility</label>
                    <select
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl cursor-pointer text-cream"
                      value={subcategoryModal.data?.status || 'Published'}
                      onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as any } }))}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Short Description</label>
                  <textarea
                    rows={2}
                    className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream"
                    placeholder="Brief scope summary..."
                    value={subcategoryModal.data?.short_desc || ''}
                    onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, short_desc: e.target.value } }))}
                  />
                </div>

                {/* Media assets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 border border-white/5 rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Thumbnail URL</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-cream"
                      value={subcategoryModal.data?.thumbnail_image || ''}
                      onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, thumbnail_image: e.target.value } }))}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="sub-thumb-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, thumbnail_image: url } })))}
                      />
                      <label htmlFor="sub-thumb-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                        <Upload size={10} /> Auto compress file
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Featured Banner URL</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-cream"
                      value={subcategoryModal.data?.banner_image || ''}
                      onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, banner_image: e.target.value } }))}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="sub-banner-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, banner_image: url } })))}
                      />
                      <label htmlFor="sub-banner-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                        <Upload size={10} /> Auto compress file
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setSubcategoryModal({ show: false, mode: 'add', data: null })}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase tracking-widest font-mono font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gold text-dark text-xs uppercase tracking-widest font-mono font-bold rounded-xl"
                  >
                    Commit Sub-Category
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* CMS SERVICE EDITOR MODAL (Level 3 / Detail Curation) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {serviceModal.show && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setServiceModal({ show: false, mode: 'add', data: null })}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-dark-2 border border-gold/30 p-8 z-[5001] rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6"
            >
              <h3 className="font-serif text-2xl text-gold border-b border-white/5 pb-3">
                {serviceModal.mode === 'add' ? 'Create Luxury Service Detail Curation' : 'Edit Service Portfolio Detail'}
              </h3>

              <form onSubmit={handleSaveService} className="space-y-6">
                
                {/* Parents Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Root Category Parent *</label>
                    <select
                      required
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl cursor-pointer text-cream"
                      value={serviceModal.data?.category_id || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, category_id: e.target.value } }))}
                    >
                      <option value="">Select Category Parent</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Sub-Category Parent (Optional)</label>
                    <select
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl cursor-pointer text-cream"
                      value={serviceModal.data?.sub_category_id || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, sub_category_id: e.target.value } }))}
                    >
                      <option value="">Select Sub-Category Parent</option>
                      {subCategories
                        .filter(sub => !serviceModal.data?.category_id || sub.category_id === serviceModal.data?.category_id)
                        .map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Core Naming */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Service Name *</label>
                    <input
                      required
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-cream"
                      placeholder="e.g. Premium Stage & Mandap Curation"
                      value={serviceModal.data?.name || ''}
                      onChange={e => {
                        const name = e.target.value;
                        const slug = generateSlug(name);
                        setServiceModal(prev => ({
                          ...prev,
                          data: { ...prev.data, name, slug }
                        }));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">URL SlugOverride *</label>
                    <input
                      required
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-gold"
                      placeholder="premium-stage-and-mandap"
                      value={serviceModal.data?.slug || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Service Icon</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-center text-lg"
                      placeholder="🌸"
                      maxLength={4}
                      value={serviceModal.data?.ico || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, ico: e.target.value } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Estimated Pricing</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-cream font-mono text-center"
                      placeholder="e.g. ₹1,50,000"
                      value={serviceModal.data?.starting_from || serviceModal.data?.price || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, starting_from: e.target.value, price: e.target.value } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Display Order Index</label>
                    <input
                      type="number"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl text-center font-mono"
                      value={serviceModal.data?.display_order || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, display_order: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Visibility Status</label>
                    <select
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl cursor-pointer text-cream"
                      value={serviceModal.data?.status || 'Published'}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as any } }))}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Short Summary Description *</label>
                  <textarea
                    required
                    rows={2}
                    className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream"
                    placeholder="Short description for preview layouts..."
                    value={serviceModal.data?.desc || ''}
                    onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, desc: e.target.value } }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Full Rich-Text Details Description</label>
                  <textarea
                    rows={4}
                    className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream"
                    placeholder="Extended narrative details for Level 3 dynamic portfolio detail page..."
                    value={serviceModal.data?.full_desc || ''}
                    onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, full_desc: e.target.value } }))}
                  />
                </div>

                {/* Checklist list and highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Inclusions / Features List (one per line)</label>
                    <textarea
                      rows={3}
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream font-mono"
                      placeholder="e.g. Dedicated coordinator&#10;Premium fresh flowers&#10;Uplighting setups"
                      value={(serviceModal.data?.feats || []).join('\n')}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, feats: e.target.value.split('\n') } }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Execution Highlights (one per line)</label>
                    <textarea
                      rows={3}
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream font-mono"
                      placeholder="e.g. 100% Bespoke design&#10;Artisanal florist networks"
                      value={(serviceModal.data?.highlights || []).join('\n')}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, highlights: e.target.value.split('\n') } }))}
                    />
                  </div>
                </div>

                {/* Custom Image Links & uploaders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 border border-white/5 rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Thumbnail Asset URL</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-cream"
                      value={serviceModal.data?.thumbnail || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, thumbnail: e.target.value } }))}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="serv-thumb-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setServiceModal(prev => ({ ...prev, data: { ...prev.data, thumbnail: url } })))}
                      />
                      <label htmlFor="serv-thumb-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                        <Upload size={10} /> Compress File
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Cover Banner URL</label>
                    <input
                      type="text"
                      className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl font-mono text-cream"
                      value={serviceModal.data?.banner || ''}
                      onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, banner: e.target.value } }))}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="serv-banner-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setServiceModal(prev => ({ ...prev, data: { ...prev.data, banner: url } })))}
                      />
                      <label htmlFor="serv-banner-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                        <Upload size={10} /> Compress File
                      </label>
                    </div>
                  </div>
                </div>

                {/* Multi-Image Gallery links list */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Multi-Image Gallery URLs (comma separated or one per line)</label>
                  <textarea
                    rows={2}
                    className="bg-black/40 border border-white/10 p-3 text-xs outline-none focus:border-gold rounded-xl resize-none text-cream font-mono text-xs"
                    placeholder="Base64 strings or public urls..."
                    value={(serviceModal.data?.gallery || []).join('\n')}
                    onChange={e => setServiceModal(prev => ({ ...prev, data: { ...prev.data, gallery: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) } }))}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="file"
                      id="serv-gallery-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, (url) => setServiceModal(prev => {
                        const current = prev.data?.gallery || [];
                        return { ...prev, data: { ...prev.data, gallery: [...current, url] } };
                      }))}
                    />
                    <label htmlFor="serv-gallery-upload" className="text-[10px] text-gold cursor-pointer hover:underline flex items-center gap-1 font-mono">
                      <Plus size={10} /> Add new photo to Gallery
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setServiceModal({ show: false, mode: 'add', data: null })}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase tracking-widest font-mono font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gold text-dark text-xs uppercase tracking-widest font-mono font-bold rounded-xl"
                  >
                    Commit Service Portfolio Curation
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
