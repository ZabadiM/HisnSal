import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Hand, ScrollText, ChevronLeft, ChevronRight, Info, Star, List, X, Plus, Minus, Heart, Edit2, Trash2, GripVertical, Quote, ArrowUp, ArrowDown, Share2, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { QURAN_DUAS, SUNNAH_DUAS, KHATM_QURAN_DUA } from '../data/duas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableDuaItemProps {
  dua: any;
  index: number;
  currentIndex: number;
  isReordering: boolean;
  isFavorite: boolean;
  isCustom: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onMove: (direction: 'up' | 'down', e: React.MouseEvent) => void;
  totalCount: number;
}

const SortableDuaItem: React.FC<SortableDuaItemProps> = ({
  dua,
  index,
  currentIndex,
  isReordering,
  isFavorite,
  isCustom,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  totalCount,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dua.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group ${isDragging ? 'relative' : ''}`}
    >
      {isReordering && (
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={(e) => onMove('up', e)}
            disabled={index === 0}
            className="p-1 text-primary/40 hover:text-accent disabled:opacity-10 transition-colors"
            title="تحريك للأعلى"
          >
            <ArrowUp size={16} />
          </button>
          <div 
            {...attributes} 
            {...listeners}
            className="p-1 text-primary/20 cursor-grab active:cursor-grabbing hover:text-accent transition-colors"
          >
            <GripVertical size={16} />
          </div>
          <button
            onClick={(e) => onMove('down', e)}
            disabled={index === totalCount - 1}
            className="p-1 text-primary/40 hover:text-accent disabled:opacity-10 transition-colors"
            title="تحريك للأسفل"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      )}
      
      <button
        onClick={onSelect}
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
          {isFavorite && (
            <Star size={12} className="text-accent mt-1" fill="currentColor" />
          )}
        </div>
        {!isReordering && isCustom && dua.id !== 'empty' && (
          <div className="flex gap-1 shrink-0">
            <div
              onClick={onEdit}
              className="p-2 text-primary/40 hover:text-accent transition-colors"
            >
              <Edit2 size={16} />
            </div>
            <div
              onClick={onDelete}
              className="p-2 text-primary/40 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

const DuasView: React.FC<DuasViewProps> = ({ onBack, isDarkMode }) => {
  const [activeCategory, setActiveCategory] = useState<DuaCategory>(() => {
    const saved = localStorage.getItem('dua_active_category');
    return (saved as DuaCategory) || 'quran';
  });
  const [categoryIndices, setCategoryIndices] = useState<Record<DuaCategory, number>>(() => {
    const saved = localStorage.getItem('dua_category_indices');
    return saved ? JSON.parse(saved) : { quran: 0, sunnah: 0, khatm: 0, custom: 0 };
  });
  const [quranDuas, setQuranDuas] = useState<any[]>(() => {
    const saved = localStorage.getItem('quran_duas_order');
    if (!saved) return QURAN_DUAS;
    const savedList = JSON.parse(saved);
    const newItems = QURAN_DUAS.filter(item => !savedList.some((s: any) => s.id === item.id));
    return [...savedList, ...newItems];
  });
  const [sunnahDuas, setSunnahDuas] = useState<any[]>(() => {
    const saved = localStorage.getItem('sunnah_duas_order');
    if (!saved) return SUNNAH_DUAS;
    const savedList = JSON.parse(saved);
    const newItems = SUNNAH_DUAS.filter(item => !savedList.some((s: any) => s.id === item.id));
    return [...savedList, ...newItems];
  });
  const [khatmDuas, setKhatmDuas] = useState<any[]>(() => {
    const saved = localStorage.getItem('khatm_duas_order');
    if (!saved) return KHATM_QURAN_DUA;
    const savedList = JSON.parse(saved);
    const newItems = KHATM_QURAN_DUA.filter(item => !savedList.some((s: any) => s.id === item.id));
    return [...savedList, ...newItems];
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
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state && state.view === 'duas') {
        setShowListModal(state.modal === 'duasList');
        setShowAddModal(state.modal === 'duasAdd');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openListModal = () => {
    window.history.pushState({ view: 'duas', modal: 'duasList' }, '', '#duas-list');
    setShowListModal(true);
  };

  const closeListModal = () => {
    if (window.history.state?.modal === 'duasList') {
      window.history.back();
    } else {
      setShowListModal(false);
    }
  };

  const openAddModal = (editingId: string | null = null) => {
    window.history.pushState({ view: 'duas', modal: 'duasAdd' }, '', '#duas-add');
    setIsEditing(editingId);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (window.history.state?.modal === 'duasAdd') {
      window.history.back();
    } else {
      setShowAddModal(false);
    }
  };

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

  useEffect(() => {
    localStorage.setItem('quran_duas_order', JSON.stringify(quranDuas));
  }, [quranDuas]);

  useEffect(() => {
    localStorage.setItem('sunnah_duas_order', JSON.stringify(sunnahDuas));
  }, [sunnahDuas]);

  useEffect(() => {
    localStorage.setItem('khatm_duas_order', JSON.stringify(khatmDuas));
  }, [khatmDuas]);

  const getActiveData = () => {
    switch (activeCategory) {
      case 'quran': return quranDuas;
      case 'sunnah': return sunnahDuas;
      case 'khatm': return khatmDuas;
      case 'custom': return customDuas.length > 0 ? customDuas : [{ id: 'empty', text: 'لا توجد أدعية خاصة بك بعد. أضف دعاءك الأول!' }];
      default: return quranDuas;
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
    setIsReordering(false);
  };

  const toggleFavorite = (id: string) => {
    if (id === 'empty') return;
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const handleShare = () => {
    if (!currentDua) return;
    const text = `${currentDua.text}\n\n${currentDua.hadith ? `${currentDua.hadith}\n` : ''}${currentDua.virtue ? `الفضل: ${currentDua.virtue}\n` : ''}\nتمت المشاركة من تطبيق الأذكار`;
    
    if (navigator.share) {
      navigator.share({
        title: 'دعاء',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text).then(() => {
        // You could add a toast here if you have one
      });
    }
  };

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
    closeAddModal();
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
    openAddModal(dua.id);
  };

  const handleExportDuas = () => {
    if (customDuas.length === 0) return;
    
    const exportData = customDuas.map(d => ({
      'المعرف': d.id,
      'الدعاء': d.text,
      'الفضل': d.virtue || '',
      'المصدر': d.hadith || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "أدعيتي");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = 'my_duas.xlsx';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  };

  const handleImportDuas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const importedDuas: CustomDua[] = jsonData
          .filter(row => row['الدعاء'] || row['text'])
          .map(row => ({
            id: row['المعرف'] || row['id'] || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: row['الدعاء'] || row['text'],
            virtue: row['الفضل'] || row['virtue'] || '',
            hadith: row['المصدر'] || row['hadith'] || ''
          }));

        if (importedDuas.length > 0) {
          setCustomDuas(prev => {
            const existingIds = new Set(prev.map(d => d.id));
            const uniqueNewDuas = importedDuas.filter(d => !existingIds.has(d.id));
            return [...prev, ...uniqueNewDuas];
          });
        }
      } catch (error) {
        console.error('Error importing Excel:', error);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    event.target.value = '';
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const updateList = (items: any[]) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update current index if needed
        if (currentIndex === oldIndex) {
          setCategoryIndices(prev => ({ ...prev, [activeCategory]: newIndex }));
        } else if (currentIndex > oldIndex && currentIndex <= newIndex) {
          setCategoryIndices(prev => ({ ...prev, [activeCategory]: currentIndex - 1 }));
        } else if (currentIndex < oldIndex && currentIndex >= newIndex) {
          setCategoryIndices(prev => ({ ...prev, [activeCategory]: currentIndex + 1 }));
        }
        
        return newItems;
      };

      if (activeCategory === 'custom') setCustomDuas(updateList);
      else if (activeCategory === 'quran') setQuranDuas(updateList);
      else if (activeCategory === 'sunnah') setSunnahDuas(updateList);
      else if (activeCategory === 'khatm') setKhatmDuas(updateList);
    }
  };

  const moveDua = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const updateList = (items: any[]) => {
      const newDuas = [...items];
      if (direction === 'up' && index > 0) {
        [newDuas[index - 1], newDuas[index]] = [newDuas[index], newDuas[index - 1]];
        if (currentIndex === index) setCategoryIndices(prev => ({ ...prev, [activeCategory]: index - 1 }));
        else if (currentIndex === index - 1) setCategoryIndices(prev => ({ ...prev, [activeCategory]: index }));
      } else if (direction === 'down' && index < items.length - 1) {
        [newDuas[index + 1], newDuas[index]] = [newDuas[index], newDuas[index + 1]];
        if (currentIndex === index) setCategoryIndices(prev => ({ ...prev, [activeCategory]: index + 1 }));
        else if (currentIndex === index + 1) setCategoryIndices(prev => ({ ...prev, [activeCategory]: index }));
      }
      return newDuas;
    };

    if (activeCategory === 'custom') setCustomDuas(updateList);
    else if (activeCategory === 'quran') setQuranDuas(updateList);
    else if (activeCategory === 'sunnah') setSunnahDuas(updateList);
    else if (activeCategory === 'khatm') setKhatmDuas(updateList);
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
            <Quote size={24} />
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
              onClick={handleShare}
              className="p-2 rounded-xl bg-surface border border-primary/10 text-primary/60 hover:text-accent hover:border-accent transition-all"
              title="مشاركة"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => toggleFavorite(currentDua.id)}
              className={`p-2 rounded-xl transition-all ${isFavorite(currentDua.id) ? 'bg-accent/20 text-accent' : 'bg-surface border border-primary/10 text-primary/60'}`}
              title="تفضيل"
            >
              <Star size={20} fill={isFavorite(currentDua.id) ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={openListModal}
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
            onClick={closeListModal}
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
                  {activeCategory === 'custom' && (
                    <>
                      <button
                        onClick={handleExportDuas}
                        disabled={customDuas.length === 0}
                        className="p-2 rounded-xl bg-secondary text-primary/60 hover:text-accent disabled:opacity-30"
                        title="تصدير الأدعية"
                      >
                        <Download size={20} />
                      </button>
                      <label className="p-2 rounded-xl bg-secondary text-primary/60 hover:text-accent cursor-pointer" title="استيراد الأدعية">
                        <Upload size={20} />
                        <input 
                          type="file" 
                          accept=".xlsx, .xls" 
                          className="hidden" 
                          onChange={handleImportDuas}
                        />
                      </label>
                    </>
                  )}
                  {activeData.length > 0 && activeData[0].id !== 'empty' && (
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
                      closeListModal();
                      // Wait for list modal to close before opening add modal
                      setTimeout(() => openAddModal(null), 100);
                    }}
                    className="p-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
                    title="إضافة دعاء جديد"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={closeListModal}
                    className="p-2 rounded-xl bg-secondary text-primary/60 hover:text-accent"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeData.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {activeData.length > 0 && activeData[0].id !== 'empty' ? (
                      activeData.map((dua, index) => (
                        <SortableDuaItem
                          key={dua.id}
                          dua={dua}
                          index={index}
                          currentIndex={currentIndex}
                          isReordering={isReordering}
                          isFavorite={isFavorite(dua.id)}
                          isCustom={activeCategory === 'custom'}
                          onSelect={() => {
                            setCategoryIndices(prev => ({ ...prev, [activeCategory]: index }));
                            closeListModal();
                          }}
                          onEdit={(e) => handleEditCustomDua(dua, e)}
                          onDelete={(e) => handleDeleteCustomDua(dua.id, e)}
                          onMove={(dir, e) => moveDua(index, dir, e)}
                          totalCount={activeData.length}
                        />
                      ))
                    ) : (
                      <div className="text-center p-8 text-primary/40">
                        لا توجد أدعية مضافة
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
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
            onClick={closeAddModal}
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
                  onClick={closeAddModal}
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
