import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Hand, ScrollText, ChevronLeft, ChevronRight, Info, Star, List, X, Plus, Minus, Heart, Edit2, Trash2, GripVertical } from 'lucide-react';
import { QURAN_DUAS, SUNNAH_DUAS, KHATM_QURAN_DUA } from '../data/duas';

type DuaCategory = 'quran' | 'sunnah' | 'khatm' | 'custom';

interface DuasViewProps {
  onBack?: () => void;
  isDarkMode?: boolean;
}

interface CustomDua {
  id: string;
  text: string;
  virtue?: string;
  hadith?: string;
}

const DuasView: React.FC<DuasViewProps> = ({ onBack, isDarkMode }) => {
  const [activeCategory, setActiveCategory] = useState<DuaCategory>(() => {
    const saved = localStorage.getItem('dua_active_category');
    return (saved as DuaCategory) || 'quran';
  });
  const [categoryIndices, setCategoryIndices] = useState<Record<DuaCategory, number>>(() => {
    const saved = localStorage.getItem('dua_category_indices');
    return saved ? JSON.parse(saved) : { quran: 0, sunnah: 0, khatm: 0, custom: 0 };
  });
  const [customDuas, setCustomDuas] = useState<CustomDua[]>(() => {
    const saved = localStorage.getItem('custom_duas');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDuaText, setNewDuaText] = useState('');
  const [newDuaVirtue, setNewDuaVirtue] = useState('');
  const [newDuaHadith, setNewDuaHadith] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [showVirtue, setShowVirtue] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_duas');
    return saved ? JSON.parse(saved) : [];
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('dua_font_size');
    return saved ? parseInt(saved) : 24;
  });

  useEffect(() => {
    localStorage.setItem('favorite_duas', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('dua_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('dua_active_category', activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    localStorage.setItem('dua_category_indices', JSON.stringify(categoryIndices));
  }, [categoryIndices]);

  useEffect(() => {
    localStorage.setItem('custom_duas', JSON.stringify(customDuas));
  }, [customDuas]);

  const getActiveData = () => {
    switch (activeCategory) {
      case 'quran': return QURAN_DUAS;
      case 'sunnah': return SUNNAH_DUAS;
      case 'khatm': return KHATM_QURAN_DUA;
      case 'custom': return customDuas.length > 0 ? customDuas : [{ id: 'empty', text: 'لا توجد أدعية خاصة بك بعد. أضف دعاءك الأول!' }];
      default: return QURAN_DUAS;
    }
  };

  const activeData = getActiveData();
  const currentIndex = categoryIndices[activeCategory] || 0;
  const currentDua = activeData[currentIndex] || activeData[0];

  const handleNext = () => {
    setShowVirtue(false);
    if (activeData.length === 0) return;
    const nextIndex = (currentIndex + 1) % activeData.length;
    setCategoryIndices(prev => ({ ...prev, [activeCategory]: nextIndex }));
  };

  const handlePrev = () => {
    setShowVirtue(false);
    if (activeData.length === 0) return;
    const prevIndex = (currentIndex - 1 + activeData.length) % activeData.length;
    setCategoryIndices(prev => ({ ...prev, [activeCategory]: prevIndex }));
  };

  const handleCategoryChange = (category: DuaCategory) => {
    setActiveCategory(category);
    setShowVirtue(false);
  };

  const toggleFavorite = (id: string) => {
    if (id === 'empty') return;
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const handleSaveCustomDua = () => {
    if (!newDuaText.trim()) return;
    
    if (isEditing) {
      setCustomDuas(prev => prev.map(d => d.id === isEditing ? {
        ...d,
        text: newDuaText,
        virtue: newDuaVirtue,
        hadith: newDuaHadith
      } : d));
    } else {
      const newDua: CustomDua = {
        id: `custom_${Date.now()}`,
        text: newDuaText,
        virtue: newDuaVirtue,
        hadith: newDuaHadith
      };
      setCustomDuas(prev => [...prev, newDua]);
      setActiveCategory('custom');
      setCategoryIndices(prev => ({ ...prev, custom: customDuas.length }));
    }
    
    setNewDuaText('');
    setNewDuaVirtue('');
    setNewDuaHadith('');
    setIsEditing(null);
    setShowAddModal(false);
  };

  const handleDeleteCustomDua = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomDuas(prev => prev.filter(d => d.id !== id));
    if (currentIndex >= customDuas.length - 1) {
      setCategoryIndices(prev => ({ ...prev, custom: Math.max(0, customDuas.length - 2) }));
    }
  };

  const handleEditCustomDua = (dua: CustomDua, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewDuaText(dua.text);
    setNewDuaVirtue(dua.virtue || '');
    setNewDuaHadith(dua.hadith || '');
    setIsEditing(dua.id);
    setShowAddModal(true);
  };

  const moveDua = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index > 0) {
      const newDuas = [...customDuas];
      [newDuas[index - 1], newDuas[index]] = [newDuas[index], newDuas[index - 1]];
      setCustomDuas(newDuas);
      if (currentIndex === index) setCategoryIndices(prev => ({ ...prev, custom: index - 1 }));
      else if (currentIndex === index - 1) setCategoryIndices(prev => ({ ...prev, custom: index }));
    } else if (direction === 'down' && index < customDuas.length - 1) {
      const newDuas = [...customDuas];
      [newDuas[index + 1], newDuas[index]] = [newDuas[index], newDuas[index + 1]];
      setCustomDuas(newDuas);
      if (currentIndex === index) setCategoryIndices(prev => ({ ...prev, custom: index + 1 }));
      else if (currentIndex === index + 1) setCategoryIndices(prev => ({ ...prev, custom: index }));
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-secondary text-primary font-sans overflow-hidden relative">
      {/* Top Navigation */}
      <div className="flex w-full items-center bg-surface border-b border-primary/10 sticky top-0 z-10">
        <div className="flex flex-1 justify-around items-center overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleCategoryChange('quran')}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 min-w-[80px] transition-all duration-300 ${
              activeCategory === 'quran' ? 'text-accent' : 'text-primary/60 opacity-70'
            }`}
          >
            <Book size={24} />
            <span className="text-[10px] font-medium uppercase tracking-widest">من القرآن</span>
            {activeCategory === 'quran' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-accent mt-1" />
            )}
          </button>
          <button
            onClick={() => handleCategoryChange('sunnah')}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 min-w-[80px] transition-all duration-300 ${
              activeCategory === 'sunnah' ? 'text-accent' : 'text-primary/60 opacity-70'
            }`}
          >
            <Hand size={24} />
            <span className="text-[10px] font-medium uppercase tracking-widest">من السنة</span>
            {activeCategory === 'sunnah' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-accent mt-1" />
            )}
          </button>
          <button
            onClick={() => handleCategoryChange('khatm')}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 min-w-[80px] transition-all duration-300 ${
              activeCategory === 'khatm' ? 'text-accent' : 'text-primary/60 opacity-70'
            }`}
          >
            <ScrollText size={24} />
            <span className="text-[10px] font-medium uppercase tracking-widest">ختم القرآن</span>
            {activeCategory === 'khatm' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-accent mt-1" />
            )}
          </button>
          <button
            onClick={() => handleCategoryChange('custom')}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 min-w-[80px] transition-all duration-300 ${
              activeCategory === 'custom' ? 'text-accent' : 'text-primary/60 opacity-70'
            }`}
          >
            <Heart size={24} />
            <span className="text-[10px] font-medium uppercase tracking-widest">أدعيتي</span>
            {activeCategory === 'custom' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-accent mt-1" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-6 relative overflow-y-auto pb-48">
        <div className="w-full max-w-md flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
              className="p-2 rounded-xl bg-surface border border-primary/10 text-primary/60 hover:text-accent transition-all"
              title="تصغير الخط"
            >
              <Minus size={18} />
            </button>
            <button 
              onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
              className="p-2 rounded-xl bg-surface border border-primary/10 text-primary/60 hover:text-accent transition-all"
              title="تكبير الخط"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => toggleFavorite(currentDua.id)}
              className={`p-2 rounded-xl transition-all ${isFavorite(currentDua.id) ? 'bg-accent/20 text-accent' : 'bg-surface border border-primary/10 text-primary/60'}`}
              title="تفضيل"
            >
              <Star size={20} fill={isFavorite(currentDua.id) ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => setShowListModal(true)}
              className="p-2 rounded-xl bg-surface border border-primary/10 text-primary/60 hover:text-accent hover:border-accent transition-all"
              title="قائمة الأدعية"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md bg-surface rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-primary/10 flex flex-col items-center justify-center text-center min-h-[320px] h-fit shrink-0 dir-rtl"
          >
            <div 
              className="leading-relaxed font-serif italic text-primary w-full"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            >
              {currentDua.text}
            </div>
            
            {(currentDua.hadith || currentDua.virtue) && (
              <div className="w-full mt-8 pt-6 border-t border-primary/5 flex flex-col items-center">
                {currentDua.hadith && (
                  <div className="text-sm text-primary/50 font-medium mb-4 opacity-80">
                    {currentDua.hadith}
                  </div>
                )}

                {currentDua.virtue && (
                  <div className="w-full">
                    <button
                      onClick={() => setShowVirtue(!showVirtue)}
                      className="flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity mx-auto"
                    >
                      <Info size={14} />
                      {showVirtue ? 'إخفاء الفضل' : 'عرض الفضل'}
                    </button>
                    
                    <AnimatePresence>
                      {showVirtue && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 text-sm text-primary/80 leading-relaxed bg-secondary p-4 rounded-xl border border-primary/10 w-full overflow-hidden text-right"
                        >
                          {currentDua.virtue}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center items-center pointer-events-none z-50">
        <div className="flex justify-between w-full max-w-md px-10 items-center pointer-events-auto">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-full bg-surface border border-primary/10 flex items-center justify-center text-primary/60 hover:text-accent hover:border-accent transition-all shadow-md"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="text-[10px] font-mono text-primary/60 tracking-[0.2em] bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 shadow-sm">
            {currentIndex + 1} / {activeData.length}
          </div>

          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-surface border border-primary/10 flex items-center justify-center text-primary/60 hover:text-accent hover:border-accent transition-all shadow-md"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>

      {/* Dua List Modal */}
      <AnimatePresence>
        {showListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowListModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-surface w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-primary/10 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-primary">قائمة الأدعية</h3>
                <div className="flex items-center gap-2">
                  {activeCategory === 'custom' && customDuas.length > 0 && (
                    <button
                      onClick={() => setIsReordering(!isReordering)}
                      className={`p-2 rounded-xl transition-all ${isReordering ? 'bg-accent text-white' : 'bg-secondary text-primary/60 hover:text-accent'}`}
                      title="ترتيب الأدعية"
                    >
                      <GripVertical size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setNewDuaText('');
                      setNewDuaVirtue('');
                      setNewDuaHadith('');
                      setIsEditing(null);
                      setShowAddModal(true);
                      setShowListModal(false);
                    }}
                    className="p-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
                    title="إضافة دعاء جديد"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => setShowListModal(false)}
                    className="p-2 rounded-xl bg-secondary text-primary/60 hover:text-accent"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeData.map((dua, index) => (
                  <div key={dua.id} className="flex items-center gap-2">
                    {activeCategory === 'custom' && isReordering && (
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={(e) => moveDua(index, 'up', e)}
                          disabled={index === 0}
                          className="p-1 text-primary/40 hover:text-accent disabled:opacity-30"
                        >
                          <ChevronRight size={16} className="rotate-90" />
                        </button>
                        <button 
                          onClick={(e) => moveDua(index, 'down', e)}
                          disabled={index === customDuas.length - 1}
                          className="p-1 text-primary/40 hover:text-accent disabled:opacity-30"
                        >
                          <ChevronRight size={16} className="-rotate-90" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCategoryIndices(prev => ({ ...prev, [activeCategory]: index }));
                        setShowListModal(false);
                      }}
                      className={`flex-1 w-full text-right p-4 rounded-2xl transition-all flex items-start gap-4 ${
                        currentIndex === index 
                          ? 'bg-accent/10 border border-accent/20' 
                          : 'bg-secondary hover:bg-primary/5 border border-transparent'
                      }`}
                    >
                      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono ${
                        currentIndex === index ? 'bg-accent text-white' : 'bg-primary/5 text-primary/60'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="arabic-text text-base leading-relaxed line-clamp-2 text-primary">
                          {dua.text}
                        </p>
                        {isFavorite(dua.id) && (
                          <Star size={12} className="text-accent mt-1" fill="currentColor" />
                        )}
                      </div>
                      {activeCategory === 'custom' && !isReordering && dua.id !== 'empty' && (
                        <div className="flex gap-1 shrink-0">
                          <div
                            onClick={(e) => handleEditCustomDua(dua as CustomDua, e)}
                            className="p-2 text-primary/40 hover:text-accent transition-colors"
                          >
                            <Edit2 size={16} />
                          </div>
                          <div
                            onClick={(e) => handleDeleteCustomDua(dua.id, e)}
                            className="p-2 text-primary/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Add/Edit Custom Dua Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-primary/10 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-primary">{isEditing ? 'تعديل الدعاء' : 'إضافة دعاء جديد'}</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl bg-secondary text-primary/60 hover:text-accent"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary/80 mb-2">نص الدعاء (مطلوب)</label>
                  <textarea
                    value={newDuaText}
                    onChange={(e) => setNewDuaText(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary/10 text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all min-h-[120px] resize-none arabic-text text-lg"
                    placeholder="اكتب دعاءك هنا..."
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary/80 mb-2">فضل الدعاء (اختياري)</label>
                  <textarea
                    value={newDuaVirtue}
                    onChange={(e) => setNewDuaVirtue(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary/10 text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all min-h-[80px] resize-none"
                    placeholder="فضل أو شرح الدعاء..."
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary/80 mb-2">الحديث / المصدر (اختياري)</label>
                  <input
                    type="text"
                    value={newDuaHadith}
                    onChange={(e) => setNewDuaHadith(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary/10 text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    placeholder="مصدر الدعاء..."
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-primary/10 bg-secondary/50 shrink-0">
                <button
                  onClick={handleSaveCustomDua}
                  disabled={!newDuaText.trim()}
                  className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? 'حفظ التعديلات' : 'إضافة الدعاء'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DuasView;
