import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Search, BookOpen, ChevronDown, Star, CheckCircle2, RotateCcw } from 'lucide-react';
import { HISN_MUSLIM, HisnCategory } from '../data/hisnMuslim';
import { HISN_MUSLIM_GROUPS, HISN_MUSLIM_GROUP_ORDER } from '../data/hisnMuslimGroups';

interface Props {
  onClose: () => void;
}

export default function HisnMuslimView({ onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [showVirtueFor, setShowVirtueFor] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('hisn_muslim_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('hisn_muslim_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleIncrement = (item: any) => {
    if (!item.count) return;
    setProgress(prev => {
      const current = prev[item.id] || 0;
      if (current < item.count) {
        return { ...prev, [item.id]: current + 1 };
      }
      return prev;
    });
  };

  const getProgress = (id: string) => progress[id] || 0;

  const filteredCategories = HISN_MUSLIM.filter(cat => {
    const matchesSearch = cat.title.includes(searchTerm) || cat.adhkar.some(a => 
      a.text.includes(searchTerm) || 
      (a.meaning && a.meaning.includes(searchTerm)) ||
      (a.virtue && a.virtue.includes(searchTerm)) ||
      (a.hadith && a.hadith.includes(searchTerm))
    );
    const matchesFavorite = showFavoritesOnly ? favorites.includes(cat.id) : true;
    return matchesSearch && matchesFavorite;
  });

  const groupedCategories = HISN_MUSLIM_GROUP_ORDER.map(group => {
    return {
      group,
      categories: filteredCategories.filter(cat => HISN_MUSLIM_GROUPS[cat.id] === group)
    };
  }).filter(g => g.categories.length > 0);

  const ungroupedCategories = filteredCategories.filter(cat => !HISN_MUSLIM_GROUPS[cat.id]);
  if (ungroupedCategories.length > 0) {
    groupedCategories.push({
      group: 'أخرى',
      categories: ungroupedCategories
    });
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const isGroupExpanded = (group: string) => searchTerm !== '' || expandedGroups.includes(group);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.category) {
        const category = HISN_MUSLIM.find(c => c.id === e.state.category);
        setSelectedCategory(category || null);
      } else {
        setSelectedCategory(null);
        setTimeout(() => {
          if (mainRef.current) mainRef.current.scrollTop = scrollPosition;
        }, 10);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [scrollPosition]);

  const handleCategorySelect = (category: HisnCategory) => {
    if (mainRef.current) {
      setScrollPosition(mainRef.current.scrollTop);
    }
    window.history.pushState({ category: category.id }, '');
    setSelectedCategory(category);
    setSearchTerm(''); // Clear search term when a category is selected
    setTimeout(() => {
      if (mainRef.current) mainRef.current.scrollTop = 0;
    }, 10);
  };

  const handleBack = () => {
    if (selectedCategory) {
      window.history.back();
    } else {
      onClose();
    }
  };

  const resetCategoryProgress = () => {
    if (!selectedCategory) return;
    setProgress(prev => {
      const newProgress = { ...prev };
      selectedCategory.adhkar.forEach(item => {
        delete newProgress[item.id];
      });
      return newProgress;
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-secondary text-primary relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <header className="z-20 glass-panel px-4 py-4 rounded-b-3xl shadow-sm shrink-0 w-full max-w-md mx-auto">
        {selectedCategory && (
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleBack} 
              className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
            <h1 className="text-xl font-bold font-serif">
              {selectedCategory.title}
            </h1>
            <button
              onClick={resetCategoryProgress}
              className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-primary/70"
              title="تصفير القسم"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        )}

        <div className="relative mt-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
            <input
              type="text"
              placeholder={selectedCategory ? `ابحث في ${selectedCategory.title}...` : "ابحث في أذكار حصن المسلم..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary/5 border border-primary/10 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-primary/40"
              dir="rtl"
            />
          </div>
          {!selectedCategory && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-3 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${showFavoritesOnly ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-primary/5 border-primary/10 text-primary/40 hover:text-primary hover:bg-primary/10'}`}
              title={showFavoritesOnly ? "إظهار الكل" : "إظهار المفضلة فقط"}
            >
              <Star size={20} fill={showFavoritesOnly ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-24 z-10 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div 
              key="categories"
              ref={(el) => {
                if (el && mainRef.current) {
                  // Use a microtask to ensure DOM is fully laid out
                  queueMicrotask(() => {
                    if (mainRef.current) mainRef.current.scrollTop = scrollPosition;
                  });
                }
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {groupedCategories.length === 0 ? (
                <div className="text-center py-12 text-primary/60">
                  لا توجد نتائج مطابقة لبحثك
                </div>
              ) : (
                groupedCategories.map((groupData) => (
                  <div key={groupData.group} className="glass-panel rounded-2xl overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => toggleGroup(groupData.group)}
                    >
                      <h2 className="text-lg font-bold font-serif text-accent">
                        {groupData.group}
                      </h2>
                      <ChevronDown 
                        size={20} 
                        className={`text-primary/40 transition-transform duration-300 ${isGroupExpanded(groupData.group) ? 'rotate-180' : ''}`} 
                      />
                    </div>
                    
                    <AnimatePresence>
                      {isGroupExpanded(groupData.group) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {groupData.categories.map((category, index) => (
                              <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => handleCategorySelect(category)}
                                className="p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors group border border-primary/5"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-accent font-bold shrink-0 text-sm">
                                    {HISN_MUSLIM.findIndex(c => c.id === category.id) + 1}
                                  </div>
                                  <h3 className="font-bold text-base">{category.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => toggleFavorite(e, category.id)}
                                    className={`p-2 rounded-full transition-colors ${favorites.includes(category.id) ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-primary/20 hover:text-primary/50 hover:bg-primary/5'}`}
                                  >
                                    <Star size={18} fill={favorites.includes(category.id) ? "currentColor" : "none"} />
                                  </button>
                                  <ChevronLeft size={18} className="text-primary/30 group-hover:text-primary/70 transition-colors shrink-0" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {selectedCategory.adhkar
                .filter(item => 
                  item.text.includes(searchTerm) || 
                  (item.meaning && item.meaning.includes(searchTerm)) ||
                  (item.virtue && item.virtue.includes(searchTerm)) ||
                  (item.hadith && item.hadith.includes(searchTerm))
                )
                .map((item, index) => {
                const isCountable = selectedCategory.id !== 'cat_2' && selectedCategory.id !== 'cat_109' && selectedCategory.id !== 'cat_127' && selectedCategory.id !== 'cat_128' && selectedCategory.id !== 'cat_129' && selectedCategory.id !== 'cat_130' && item.count;
                const count = getProgress(item.id);
                const completed = isCountable && count >= item.count!;

                return (
                  <motion.div 
                    key={item.id} 
                    className={`glass-panel p-5 rounded-3xl transition-all duration-300 ${completed ? 'opacity-60 bg-primary/5' : ''}`}
                    onClick={() => isCountable && handleIncrement(item)}
                  >
                    <p className="font-serif arabic-text text-lg leading-loose whitespace-pre-line mb-4">
                      {item.text}
                    </p>
                    
                    {showVirtueFor === item.id && (item.virtue || item.hadith || item.meaning) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 p-3 bg-primary/5 rounded-xl text-sm space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.meaning && (
                          <p><span className="font-bold text-accent">المعنى:</span> {item.meaning}</p>
                        )}
                        {item.virtue && (
                          <p><span className="font-bold text-accent">الفضل:</span> {item.virtue}</p>
                        )}
                        {item.hadith && (
                          <p><span className="font-bold text-accent">الحديث:</span> {item.hadith}</p>
                        )}
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10">
                      <div className="flex gap-2">
                        {(item.virtue || item.hadith || item.meaning) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowVirtueFor(showVirtueFor === item.id ? null : item.id);
                            }}
                            className="p-2 rounded-full bg-primary/5 text-primary/70 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <BookOpen size={18} />
                          </button>
                        )}
                      </div>
                      {isCountable && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary/60">
                            {count} / {item.count}
                          </span>
                          <button 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${completed ? 'bg-green-500 text-white' : 'bg-primary text-secondary shadow-md hover:scale-105'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncrement(item);
                            }}
                            disabled={completed}
                          >
                            {completed ? <CheckCircle2 size={20} /> : <span className="font-bold">{item.count! - count}</span>}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
