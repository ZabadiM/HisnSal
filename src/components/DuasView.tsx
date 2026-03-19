import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Heart, ScrollText, ChevronLeft, ChevronRight, Info, Star, List, X, Plus, Minus } from 'lucide-react';
import { QURAN_DUAS, SUNNAH_DUAS, KHATM_QURAN_DUA } from '../data/duas';

type DuaCategory = 'quran' | 'sunnah' | 'khatm';

interface DuasViewProps {
  onBack?: () => void;
}

const DuasView: React.FC<DuasViewProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<DuaCategory>(() => {
    const saved = localStorage.getItem('dua_active_category');
    return (saved as DuaCategory) || 'quran';
  });
  const [categoryIndices, setCategoryIndices] = useState<Record<DuaCategory, number>>(() => {
    const saved = localStorage.getItem('dua_category_indices');
    return saved ? JSON.parse(saved) : { quran: 0, sunnah: 0, khatm: 0 };
  });
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

  const getActiveData = () => {
    switch (activeCategory) {
      case 'quran': return QURAN_DUAS;
      case 'sunnah': return SUNNAH_DUAS;
      case 'khatm': return KHATM_QURAN_DUA;
      default: return QURAN_DUAS;
    }
  };

  const activeData = getActiveData();
  const currentIndex = categoryIndices[activeCategory] || 0;
  const currentDua = activeData[currentIndex] || activeData[0];

  const handleNext = () => {
    setShowVirtue(false);
    const nextIndex = (currentIndex + 1) % activeData.length;
    setCategoryIndices(prev => ({ ...prev, [activeCategory]: nextIndex }));
  };

  const handlePrev = () => {
    setShowVirtue(false);
    const prevIndex = (currentIndex - 1 + activeData.length) % activeData.length;
    setCategoryIndices(prev => ({ ...prev, [activeCategory]: prevIndex }));
  };

  const handleCategoryChange = (category: DuaCategory) => {
    setActiveCategory(category);
    setShowVirtue(false);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#fdfcf9] text-[#2c2c2c] font-sans overflow-hidden relative">
      {/* Top Navigation */}
      <div className="flex justify-around items-center p-4 bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        {onBack && (
          <button 
            onClick={onBack} 
            className="absolute right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ChevronRight size={24} />
          </button>
        )}
        <div className="flex gap-6">
          <button
            onClick={() => handleCategoryChange('quran')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeCategory === 'quran' ? 'text-[#c19a6b] scale-110' : 'text-[#8e8e8e] opacity-70'
            }`}
          >
            <Book size={20} />
            <span className="text-[10px] font-medium uppercase tracking-widest">من القرآن</span>
            {activeCategory === 'quran' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-[#c19a6b] mt-1" />
            )}
          </button>
          <button
            onClick={() => handleCategoryChange('sunnah')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeCategory === 'sunnah' ? 'text-[#c19a6b] scale-110' : 'text-[#8e8e8e] opacity-70'
            }`}
          >
            <Heart size={20} />
            <span className="text-[10px] font-medium uppercase tracking-widest">من السنة</span>
            {activeCategory === 'sunnah' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-[#c19a6b] mt-1" />
            )}
          </button>
          <button
            onClick={() => handleCategoryChange('khatm')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeCategory === 'khatm' ? 'text-[#c19a6b] scale-110' : 'text-[#8e8e8e] opacity-70'
            }`}
          >
            <ScrollText size={20} />
            <span className="text-[10px] font-medium uppercase tracking-widest">ختم القرآن</span>
            {activeCategory === 'khatm' && (
              <motion.div layoutId="activeTab" className="h-0.5 w-full bg-[#c19a6b] mt-1" />
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
              className="p-2 rounded-xl bg-white border border-[#e5e5e5] text-[#8e8e8e] hover:text-[#c19a6b] transition-all"
              title="تصغير الخط"
            >
              <Minus size={18} />
            </button>
            <button 
              onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
              className="p-2 rounded-xl bg-white border border-[#e5e5e5] text-[#8e8e8e] hover:text-[#c19a6b] transition-all"
              title="تكبير الخط"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => toggleFavorite(currentDua.id)}
              className={`p-2 rounded-xl transition-all ${isFavorite(currentDua.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-white border border-[#e5e5e5] text-[#8e8e8e]'}`}
              title="تفضيل"
            >
              <Star size={20} fill={isFavorite(currentDua.id) ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => setShowListModal(true)}
              className="p-2 rounded-xl bg-white border border-[#e5e5e5] text-[#8e8e8e] hover:text-[#c19a6b] hover:border-[#c19a6b] transition-all"
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
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#f0f0f0] flex flex-col items-center text-center min-h-[300px]"
          >
            <div 
              className="leading-relaxed mb-8 font-serif italic text-[#1a1a1a] dir-rtl"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentDua.text}
            </div>
            
            {currentDua.hadith && (
              <div className="text-xs text-[#8e8e8e] font-mono tracking-tighter mb-4 opacity-60">
                {currentDua.hadith}
              </div>
            )}

            {currentDua.virtue && (
              <div className="w-full mt-4">
                <button
                  onClick={() => setShowVirtue(!showVirtue)}
                  className="flex items-center gap-2 text-[#c19a6b] text-[11px] font-semibold uppercase tracking-widest hover:opacity-80 transition-opacity mx-auto"
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
                      className="mt-4 text-sm text-[#5a5a5a] leading-relaxed bg-[#fdfcf9] p-4 rounded-xl border border-[#f0f0f0] w-full overflow-hidden"
                    >
                      {currentDua.virtue}
                    </motion.div>
                  )}
                </AnimatePresence>
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
            className="w-12 h-12 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-[#8e8e8e] hover:text-[#c19a6b] hover:border-[#c19a6b] transition-all shadow-md"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="text-[10px] font-mono text-[#8e8e8e] tracking-[0.2em] bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#e5e5e5] shadow-sm">
            {currentIndex + 1} / {activeData.length}
          </div>

          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-[#8e8e8e] hover:text-[#c19a6b] hover:border-[#c19a6b] transition-all shadow-md"
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
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-[#1a1a1a]">قائمة الأدعية</h3>
                <button 
                  onClick={() => setShowListModal(false)}
                  className="p-2 rounded-xl bg-[#fdfcf9] text-[#8e8e8e] hover:text-[#c19a6b]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeData.map((dua, index) => (
                  <button
                    key={dua.id}
                    onClick={() => {
                      setCategoryIndices(prev => ({ ...prev, [activeCategory]: index }));
                      setShowListModal(false);
                    }}
                    className={`w-full text-right p-4 rounded-2xl transition-all flex items-start gap-4 ${
                      currentIndex === index 
                        ? 'bg-[#c19a6b]/10 border border-[#c19a6b]/20' 
                        : 'bg-[#fdfcf9] hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono ${
                      currentIndex === index ? 'bg-[#c19a6b] text-white' : 'bg-gray-100 text-[#8e8e8e]'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="arabic-text text-base leading-relaxed line-clamp-2 text-[#1a1a1a]">
                        {dua.text}
                      </p>
                      {isFavorite(dua.id) && (
                        <Star size={12} className="text-yellow-500 mt-1" fill="currentColor" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DuasView;
