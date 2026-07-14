import React, { useState, useEffect } from 'react';
import { Sparkles, Upload, X, Save, Loader2, User, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface AboutSettingsForm {
  id: string;
  founder_name: string;
  founder_image: string;
  team_image: string;
  heading: string;
  description: string;
  stats: {
    years_experience: string;
    events_managed: string;
    trusted_vendors: string;
    happy_clients: string;
  };
  features: string[];
}

interface AboutTabProps {
  showToast: (type: 'success' | 'error', message: string) => void;
  onRefreshAll?: () => void;
}

export default function AboutTab({ showToast, onRefreshAll }: AboutTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFounder, setUploadingFounder] = useState(false);
  const [uploadingTeam, setUploadingTeam] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const [form, setForm] = useState<AboutSettingsForm>({
    id: 'default',
    founder_name: '',
    founder_image: '',
    team_image: '',
    heading: '',
    description: '',
    stats: {
      years_experience: '',
      events_managed: '',
      trusted_vendors: '',
      happy_clients: ''
    },
    features: []
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await dataService.getAboutSettings();
        if (settings) {
          setForm({
            id: settings.id || 'default',
            founder_name: settings.founder_name || '',
            founder_image: settings.founder_image || '',
            team_image: settings.team_image || '',
            heading: settings.heading || '',
            description: settings.description || '',
            stats: {
              years_experience: settings.stats?.years_experience || '',
              events_managed: settings.stats?.events_managed || '',
              trusted_vendors: settings.stats?.trusted_vendors || '',
              happy_clients: settings.stats?.happy_clients || ''
            },
            features: settings.features || []
          });
        }
      } catch (err: any) {
        console.error('Failed fetching about settings:', err);
        showToast('error', 'Failed retrieving About Eventra settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatChange = (statKey: keyof AboutSettingsForm['stats'], value: string) => {
    setForm(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statKey]: value
      }
    }));
  };

  const handleImageUpload = async (file: File, type: 'founder' | 'team') => {
    if (type === 'founder') setUploadingFounder(true);
    else setUploadingTeam(true);

    try {
      console.log(`[Upload] Starting image upload for ${type}...`);
      const base64Url = await dataService.uploadImage(file);
      console.log(`[Upload] Image compressed & read to base64 successfully.`);

      // Update form state for instant preview
      setForm(prev => {
        const updatedForm = {
          ...prev,
          [type === 'founder' ? 'founder_image' : 'team_image']: base64Url
        };

        // Instantly save to database for persistence across reloads
        console.log(`[Upload] Saving updated settings with ${type} image to DB...`);
        dataService.updateAboutSettings(updatedForm)
          .then(() => {
            console.log(`[Upload] DB save successful for ${type} image.`);
            showToast('success', `${type === 'founder' ? 'Founder' : 'Team'} image uploaded and saved successfully!`);
            if (onRefreshAll) onRefreshAll();
          })
          .catch((err: any) => {
            console.error(`[Upload] DB save failed:`, err);
            showToast('error', `Image prepared, but failed saving to database: ${err.message || err}`);
          });

        return updatedForm;
      });
    } catch (err: any) {
      console.error('[Upload] Error during image optimization:', err);
      showToast('error', err?.message || 'Error processing file upload.');
    } finally {
      if (type === 'founder') setUploadingFounder(false);
      else setUploadingTeam(false);
    }
  };

  const handleDeleteImage = async (type: 'founder' | 'team') => {
    console.log(`[Upload] Deleting ${type} image...`);
    try {
      setForm(prev => {
        const updatedForm = {
          ...prev,
          [type === 'founder' ? 'founder_image' : 'team_image']: ''
        };

        console.log(`[Upload] Saving cleared settings to DB...`);
        dataService.updateAboutSettings(updatedForm)
          .then(() => {
            console.log(`[Upload] DB save successful (image cleared).`);
            showToast('success', `${type === 'founder' ? 'Founder' : 'Team'} image deleted and saved successfully!`);
            if (onRefreshAll) onRefreshAll();
          })
          .catch((err: any) => {
            console.error(`[Upload] DB save failed on delete:`, err);
            showToast('error', `Failed saving image deletion to database: ${err.message || err}`);
          });

        return updatedForm;
      });
    } catch (err: any) {
      console.error('[Upload] Error deleting image:', err);
      showToast('error', err?.message || 'Error deleting image.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'founder' | 'team') => {
    const file = e.target.files?.[0];
    if (file) handleFileChangeAsync(file, type);
  };

  const handleFileChangeAsync = async (file: File, type: 'founder' | 'team') => {
    await handleImageUpload(file, type);
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    if (form.features.includes(newFeature.trim())) {
      showToast('error', 'This feature is already listed.');
      return;
    }
    setForm(prev => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    setNewFeature('');
  };

  const handleRemoveFeature = (idx: number) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.founder_name || !form.heading || !form.description) {
      showToast('error', 'Founder Name, Heading, and Description can never be left blank.');
      return;
    }

    setSaving(true);
    try {
      await dataService.updateAboutSettings(form);
      showToast('success', 'About Eventra Occasionz settings successfully updated!');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed saving About Us settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div id="about-tab-loader" className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-gold" size={40} />
        <p className="text-xs text-text-secondary uppercase tracking-[0.2em] font-mono">Loading About settings...</p>
      </div>
    );
  }

  return (
    <div id="about-tab-setup-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Settings Form Column */}
      <div className="lg:col-span-8 bg-[#121212]/50 border border-white/5 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-gold" size={24} />
          <div>
            <h3 className="font-serif text-xl text-cream">About Us Manager</h3>
            <p className="text-xs text-text-secondary">Manage the premium About Us content, founder details, features, and key statistics on the homepage.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Bio */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-gold font-mono font-semibold">Core Bio Details</h4>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-mono">Founder Name</label>
              <input 
                type="text" 
                name="founder_name"
                value={form.founder_name}
                onChange={handleInputChange}
                className="w-full bg-[#1A1A1A] border border-white/10 text-cream text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                placeholder="e.g. Shivam Chawla"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-mono">Large Catchy Heading</label>
              <input 
                type="text" 
                name="heading"
                value={form.heading}
                onChange={handleInputChange}
                className="w-full bg-[#1A1A1A] border border-white/10 text-cream text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                placeholder="e.g. Crafting Extraordinary Celebrations with Passion & Precision"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-mono">Complete Description / About Story</label>
              <textarea 
                name="description"
                rows={8}
                value={form.description}
                onChange={handleInputChange}
                className="w-full bg-[#1A1A1A] border border-white/10 text-cream text-sm rounded-lg p-4 focus:outline-none focus:border-gold/50 font-light leading-relaxed"
                placeholder="Write the stories here. Break paragraphs with double enters."
                required
              />
              <span className="text-[0.65rem] text-text-secondary/60 mt-1 block">💡 Protip: Break paragraphs with blank lines (double enters) to display them as distinct, elegant paragraphs.</span>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs uppercase tracking-widest text-gold font-mono font-semibold">Statistic Accents</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider text-text-secondary mb-1.5 font-mono">Years of Experience</label>
                <input 
                  type="text"
                  value={form.stats.years_experience}
                  onChange={(e) => handleStatChange('years_experience', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 text-gold font-bold text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold/50"
                  placeholder="e.g. 12+"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider text-text-secondary mb-1.5 font-mono">Events Managed</label>
                <input 
                  type="text"
                  value={form.stats.events_managed}
                  onChange={(e) => handleStatChange('events_managed', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 text-gold font-bold text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold/50"
                  placeholder="e.g. 650+"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider text-text-secondary mb-1.5 font-mono">Trusted Vendors</label>
                <input 
                  type="text"
                  value={form.stats.trusted_vendors}
                  onChange={(e) => handleStatChange('trusted_vendors', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 text-gold font-bold text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold/50"
                  placeholder="e.g. 150+"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider text-text-secondary mb-1.5 font-mono">Happy Clients</label>
                <input 
                  type="text"
                  value={form.stats.happy_clients}
                  onChange={(e) => handleStatChange('happy_clients', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 text-gold font-bold text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold/50"
                  placeholder="e.g. 1,200+"
                />
              </div>
            </div>
          </div>

          {/* Signature Feature Standards */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs uppercase tracking-widest text-gold font-mono font-semibold">Signature Feature Standards</h4>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                className="flex-grow bg-[#1A1A1A] border border-white/10 text-cream text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-gold/50"
                placeholder="Add custom feature (e.g. Destination Weddings)"
              />
              <button 
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-gold/15 text-gold border border-gold/30 rounded-lg text-xs uppercase tracking-wider hover:bg-gold/25 transition-all flex items-center gap-1.5"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {form.features.map((feat, index) => (
                <div key={index} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-4 py-2">
                  <span className="text-xs text-cream font-serif">{feat}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFeature(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gold text-dark font-mono text-xs uppercase tracking-widest rounded-lg font-bold hover:bg-gold/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save About Us Setup
            </button>
          </div>
        </form>
      </div>

      {/* Media Curator Column */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Founder Image Card */}
        <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-6">
          <h4 className="text-xs uppercase tracking-widest text-gold font-mono font-semibold mb-4 flex items-center gap-2">
            <User size={16} /> Founder Portrait
          </h4>
          
          {uploadingFounder ? (
            <div className="flex flex-col items-center justify-center border border-white/10 rounded-lg aspect-[4/5] bg-[#1A1A1A]/40">
              <Loader2 className="animate-spin text-gold mb-2" size={32} />
              <span className="text-xs text-text-secondary font-mono">Uploading & Optimizing...</span>
            </div>
          ) : form.founder_image ? (
            <div className="relative group rounded-lg overflow-hidden border border-white/10 aspect-[4/5] bg-dark-2">
              <img 
                src={form.founder_image} 
                alt="Founder Portrait Preview" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="p-3 bg-gold text-dark rounded-full cursor-pointer hover:scale-105 transition-transform">
                  <Upload size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'founder')} />
                </label>
                <button 
                  type="button"
                  onClick={() => handleDeleteImage('founder')}
                  className="p-3 bg-red-600 text-cream rounded-full hover:scale-105 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-gold/30 rounded-lg aspect-[4/5] bg-[#1A1A1A]/40 cursor-pointer transition-all duration-300">
              <Upload className="text-text-secondary mb-2" size={32} />
              <span className="text-xs text-text-secondary font-mono">Upload Photo</span>
              <span className="text-[0.6rem] text-text-secondary/50 font-mono mt-1">Accepts PNG, JPG, WEBP</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'founder')} />
            </label>
          )}

          <div className="mt-4">
            <label className="block text-[0.65rem] uppercase tracking-wider text-text-secondary mb-1.5 font-mono">Or Paste Image URL / Base64</label>
            <input 
              type="text"
              value={form.founder_image}
              onChange={(e) => {
                const val = e.target.value;
                setForm(prev => {
                  const updated = { ...prev, founder_image: val };
                  dataService.updateAboutSettings(updated)
                    .then(() => {
                      if (onRefreshAll) onRefreshAll();
                    })
                    .catch(console.error);
                  return updated;
                });
              }}
              placeholder="Paste a custom image URL or base64..."
              className="w-full bg-[#1A1A1A] border border-white/10 text-cream text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold/50 font-mono"
            />
          </div>
        </div>

        {/* Team/Event Image Card */}
        <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-6">
          <h4 className="text-xs uppercase tracking-widest text-gold font-mono font-semibold mb-4 flex items-center gap-2">
            <ImageIcon size={16} /> Showcase/Team Scene
          </h4>
          
          {uploadingTeam ? (
            <div className="flex flex-col items-center justify-center border border-white/10 rounded-lg aspect-video bg-[#1A1A1A]/40">
              <Loader2 className="animate-spin text-gold mb-2" size={32} />
              <span className="text-xs text-text-secondary font-mono">Uploading & Optimizing...</span>
            </div>
          ) : form.team_image ? (
            <div className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-dark-2">
              <img 
                src={form.team_image} 
                alt="Showcase Scene Preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="p-3 bg-gold text-dark rounded-full cursor-pointer hover:scale-105 transition-transform">
                  <Upload size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'team')} />
                </label>
                <button 
                  type="button"
                  onClick={() => handleDeleteImage('team')}
                  className="p-3 bg-red-600 text-cream rounded-full hover:scale-105 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-gold/30 rounded-lg aspect-video bg-[#1A1A1A]/40 cursor-pointer transition-all duration-300">
              <Upload className="text-text-secondary mb-2" size={32} />
              <span className="text-xs text-text-secondary font-mono">Upload Office/Event Setup</span>
              <span className="text-[0.6rem] text-text-secondary/50 font-mono mt-1">Accepts PNG, JPG, WEBP</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'team')} />
            </label>
          )}

          <div className="mt-4">
            <label className="block text-[0.65rem] uppercase tracking-wider text-text-secondary mb-1.5 font-mono">Or Paste Image URL / Base64</label>
            <input 
              type="text"
              value={form.team_image}
              onChange={(e) => {
                const val = e.target.value;
                setForm(prev => {
                  const updated = { ...prev, team_image: val };
                  dataService.updateAboutSettings(updated)
                    .then(() => {
                      if (onRefreshAll) onRefreshAll();
                    })
                    .catch(console.error);
                  return updated;
                });
              }}
              placeholder="Paste a custom image URL or base64..."
              className="w-full bg-[#1A1A1A] border border-white/10 text-cream text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold/50 font-mono"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
