import fs from 'fs';
const code = fs.readFileSync('src/components/admin/PricingTab.tsx', 'utf8');

const newSection = `
                {/* 4. Advanced: City Pricing */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-mono text-gold uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} /> City-Based Overrides
                    </h4>
                    <button 
                      onClick={() => {
                        const city = prompt('Enter city name (e.g. Goa, Chandigarh):');
                        if (city) {
                           const cp = { ...(form.city_pricing || {}) };
                           cp[city] = { standard_price: form.standard_price };
                           updateForm('city_pricing', cp);
                        }
                      }}
                      className="text-xs font-mono text-gold flex items-center gap-1 hover:text-cream transition-colors">
                      <Plus size={14} /> Add City Rule
                    </button>
                  </div>
                  <div className="space-y-3">
                    {Object.keys(form.city_pricing || {}).length === 0 ? (
                      <div className="bg-black/50 border border-white/10 rounded-lg p-4 text-center">
                        <p className="text-sm text-text-secondary">No city overrides configured.</p>
                      </div>
                    ) : (
                      Object.entries(form.city_pricing || {}).map(([cityName, pricingData]) => (
                        <div key={cityName} className="flex items-center gap-4 bg-black/50 border border-white/10 p-3 rounded-lg">
                           <div className="w-1/3">
                             <p className="text-cream text-sm font-medium">{cityName}</p>
                           </div>
                           <div className="w-1/3 relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-mono text-xs">₹</span>
                             <input type="number" 
                               value={pricingData.standard_price || ''}
                               onChange={e => {
                                 const cp = { ...(form.city_pricing || {}) };
                                 cp[cityName] = { ...cp[cityName], standard_price: Number(e.target.value) };
                                 updateForm('city_pricing', cp);
                               }}
                               className="w-full bg-black/50 border border-white/10 rounded p-1 pl-6 text-cream text-sm font-mono outline-none focus:border-gold" 
                               placeholder="Standard Price" />
                           </div>
                           <div className="w-1/3 text-right">
                             <button onClick={() => {
                               const cp = { ...(form.city_pricing || {}) };
                               delete cp[cityName];
                               updateForm('city_pricing', cp);
                             }} className="text-red-400 hover:text-red-300 p-1">
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
`;

const replaced = code.replace(/\{\/\* 4\. Advanced: City Pricing \*\/\}[\s\S]*?(?=\{\/\* 5\. Advanced: Season Pricing \*\/})/, newSection);
fs.writeFileSync('src/components/admin/PricingTab.tsx', replaced);
