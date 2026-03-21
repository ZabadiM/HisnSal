import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sun, Moon, CheckCircle2, BookOpen, RotateCcw, Edit2, Trash2, Plus, ArrowUp, ArrowDown, Share2, ArrowLeftCircle, BarChart3, X } from 'lucide-react';
import { MORNING_ADHKAR, EVENING_ADHKAR, AdhkarItem, TASBEEH_MAPPING } from '../data/morningEvening';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  onClose: () => void;
  onNavigateToTasbeeh?: (item: AdhkarItem, isEvening: boolean) => void;
  onResetTasbeehSessions?: (mappedIds: string[]) => void;
  dailyStats?: Record<string, Record<string, { count: number, sessionCount?: number }>>;
  dhikrList?: { id: string; text: string }[];
}


const SortableItem = ({ item, index, isEditMode, handleIncrement, onDelete, showVirtueFor, setShowVirtueFor, getProgress, onEdit, onMoveUp, onMoveDown, isFirst, isLast, onShare, onNavigateToTasbeeh }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const count = getProgress(item.id);
    const completed = count >= item.count;

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...(isEditMode ? listeners : {})} className="w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`glass-panel p-5 rounded-3xl transition-all duration-300 ${completed ? 'opacity-60 bg-primary/5' : ''} ${isEditMode ? 'border-2 border-accent cursor-grab' : ''}`}
          onClick={() => {
            if (isEditMode) {
              const isBasic = item.id.startsWith('m') || item.id.startsWith('e');
              if (!isBasic) onEdit(item);
            } else {
              handleIncrement(item);
            }
          }}
        >
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="flex-1">
              <p className="font-serif arabic-text text-lg leading-loose whitespace-pre-line">
                {item.text}
              </p>
            </div>
            {isEditMode && (
              <div className="flex gap-2">
                {!(item.id.startsWith('m') || item.id.startsWith('e')) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                    className="p-2 rounded-full bg-primary/10 text-primary/70 hover:bg-primary/20 transition-colors h-fit"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
                <div className="flex flex-col gap-1 items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                      disabled={isFirst}
                      className={`p-1.5 rounded-lg transition-all ${isFirst ? 'text-primary/10 cursor-not-allowed' : 'text-primary/60 hover:text-primary hover:bg-primary/10 shadow-sm'}`}
                      title="تحريك للأعلى"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                      disabled={isLast}
                      className={`p-1.5 rounded-lg transition-all ${isLast ? 'text-primary/10 cursor-not-allowed' : 'text-primary/60 hover:text-primary hover:bg-primary/10 shadow-sm'}`}
                      title="تحريك للأسفل"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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
              {item.source && (
                <p><span className="font-bold text-accent">المصدر:</span> {item.source}</p>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10">
            <div className="flex gap-2">
              {!isEditMode && (item.virtue || item.hadith || item.meaning || item.source) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVirtueFor(showVirtueFor === item.id ? null : item.id);
                  }}
                  className="p-2 rounded-full bg-primary/5 text-primary/70 hover:bg-primary/10 hover:text-primary transition-colors"
                  title="التفاصيل"
                >
                  <BookOpen size={18} />
                </button>
              )}
              {!isEditMode && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(item);
                  }}
                  className="p-2 rounded-full bg-primary/5 text-primary/70 hover:bg-primary/10 hover:text-primary transition-colors"
                  title="مشاركة"
                >
                  <Share2 size={18} />
                </button>
              )}
              {!isEditMode && item.count > 5 && onNavigateToTasbeeh && !completed && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTasbeeh(item);
                  }}
                  className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  title="تسبيح"
                >
                  <ArrowLeftCircle size={18} />
                </button>
              )}
            </div>

            {!isEditMode && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary/60">
                  {count} / {item.count}
                </span>
                <button 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${completed ? 'bg-green-500 text-white' : 'bg-primary text-secondary shadow-md hover:scale-105'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIncrement(item);
                  }}
                  disabled={completed}
                >
                  {completed ? <CheckCircle2 size={24} /> : <span className="font-bold text-lg">{item.count - count}</span>}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

export default function MorningEveningView({ onClose, onNavigateToTasbeeh, onResetTasbeehSessions, dailyStats = {}, dhikrList = [] }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = 'morning_evening_progress';
  const listStorageKey = 'user_adhkar_list';

  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [isEditMode, setIsEditMode] = useState(false);
  const [userList, setUserList] = useState<Record<string, AdhkarItem[]>>(() => {
    const saved = localStorage.getItem(listStorageKey);
    return saved ? JSON.parse(saved) : { morning: MORNING_ADHKAR, evening: EVENING_ADHKAR };
  });
  const [progress, setProgress] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr) {
          return parsed.data || {};
        }
      } catch (e) {
        console.error('Error parsing morning/evening progress', e);
      }
    }
    return {};
  });
  const [showVirtueFor, setShowVirtueFor] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetListConfirm, setShowResetListConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdhkarItem | null>(null);

  const [showStats, setShowStats] = useState(false);

  const [newDhikr, setNewDhikr] = useState({ text: '', count: 1, virtue: '', hadith: '', meaning: '' });

  const historyStorageKey = 'morning_evening_history';
  const [history, setHistory] = useState<Record<string, { morning: number, evening: number }>>(() => {
    const saved = localStorage.getItem(historyStorageKey);
    return saved ? JSON.parse(saved) : {};
  });

  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state && state.view === 'morning_evening') {
        setShowResetConfirm(state.modal === 'meReset');
        setShowResetListConfirm(state.modal === 'meResetList');
        setShowDeleteConfirm(state.modal === 'meDelete' ? state.deleteId : null);
        setIsAddModalOpen(state.modal === 'meAdd');
        setShowStats(state.modal === 'meStats');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openModal = (modalName: 'meReset' | 'meResetList' | 'meDelete' | 'meAdd' | 'meStats', deleteId?: string) => {
    window.history.pushState({ view: 'morning_evening', modal: modalName, deleteId }, '');
    if (modalName === 'meReset') setShowResetConfirm(true);
    if (modalName === 'meResetList') setShowResetListConfirm(true);
    if (modalName === 'meDelete') setShowDeleteConfirm(deleteId || null);
    if (modalName === 'meAdd') setIsAddModalOpen(true);
    if (modalName === 'meStats') setShowStats(true);
  };

  const closeModal = (modalName: 'meReset' | 'meResetList' | 'meDelete' | 'meAdd' | 'meStats') => {
    if (window.history.state?.modal === modalName) {
      window.history.back();
    } else {
      if (modalName === 'meReset') setShowResetConfirm(false);
      if (modalName === 'meResetList') setShowResetListConfirm(false);
      if (modalName === 'meDelete') setShowDeleteConfirm(null);
      if (modalName === 'meAdd') setIsAddModalOpen(false);
      if (modalName === 'meStats') setShowStats(false);
    }
  };

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ date: todayStr, data: progress }));
    
    // Update history
    setHistory(prev => {
      const morningCompleted = userList.morning.filter(item => {
        const localProgress = progress[item.id] || 0;
        const mappedId = TASBEEH_MAPPING[item.id] || item.id;
        const stats = dailyStats[todayStr]?.[mappedId];
        const tasbeehProgress = stats?.sessionCount !== undefined ? stats.sessionCount : (stats?.count || 0);
        return Math.max(localProgress, tasbeehProgress) >= item.count;
      }).length;
      
      const eveningCompleted = userList.evening.filter(item => {
        const localProgress = progress[item.id] || 0;
        const mappedId = TASBEEH_MAPPING[item.id] || item.id;
        const stats = dailyStats[todayStr]?.[mappedId];
        const tasbeehProgress = stats?.sessionCount !== undefined ? stats.sessionCount : (stats?.count || 0);
        return Math.max(localProgress, tasbeehProgress) >= item.count;
      }).length;
      
      const newHistory = {
        ...prev,
        [todayStr]: {
          morning: userList.morning.length > 0 ? morningCompleted / userList.morning.length : 0,
          evening: userList.evening.length > 0 ? eveningCompleted / userList.evening.length : 0,
        }
      };
      localStorage.setItem(historyStorageKey, JSON.stringify(newHistory));
      return newHistory;
    });
  }, [progress, todayStr, userList, dailyStats]);

  React.useEffect(() => {
    localStorage.setItem(listStorageKey, JSON.stringify(userList));
  }, [userList]);

  const currentList = userList[activeTab];

  const handleIncrement = (item: AdhkarItem) => {
    if (isEditMode) return;
    setProgress(prev => {
      const current = prev[item.id] || 0;
      if (current < item.count) {
        return { ...prev, [item.id]: current + 1 };
      }
      return prev;
    });
  };

  const handleDelete = (id: string) => {
    setUserList(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(item => item.id !== id)
    }));
    closeModal('meDelete');
  };

  const resetProgress = () => {
    setProgress({});
    
    // Reset sessionCount for mapped Tasbeeh items
    if (onResetTasbeehSessions) {
      const mappedIdsToReset: string[] = [];
      [...userList.morning, ...userList.evening].forEach(item => {
        const mappedId = TASBEEH_MAPPING[item.id];
        if (mappedId && !mappedIdsToReset.includes(mappedId)) {
          mappedIdsToReset.push(mappedId);
        }
      });
      if (mappedIdsToReset.length > 0) {
        onResetTasbeehSessions(mappedIdsToReset);
      }
    }
    
    closeModal('meReset');
  };

  const resetListToDefault = () => {
    setUserList({ morning: MORNING_ADHKAR, evening: EVENING_ADHKAR });
    
    // Reset sessionCount for mapped Tasbeeh items
    if (onResetTasbeehSessions) {
      const mappedIdsToReset: string[] = [];
      [...MORNING_ADHKAR, ...EVENING_ADHKAR].forEach(item => {
        const mappedId = TASBEEH_MAPPING[item.id];
        if (mappedId && !mappedIdsToReset.includes(mappedId)) {
          mappedIdsToReset.push(mappedId);
        }
      });
      if (mappedIdsToReset.length > 0) {
        onResetTasbeehSessions(mappedIdsToReset);
      }
    }
    
    closeModal('meResetList');
  };

  const handleEdit = (item: AdhkarItem) => {
    setEditingItem(item);
    setNewDhikr({
      text: item.text,
      count: item.count,
      virtue: item.virtue || '',
      hadith: item.hadith || '',
      meaning: item.meaning || ''
    });
    openModal('meAdd');
  };

  const handleAddOrEdit = () => {
    if (!newDhikr.text) return;

    if (editingItem) {
      setUserList(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item => item.id === editingItem.id ? { ...item, ...newDhikr } : item)
      }));
    } else {
      setUserList(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], { id: Date.now().toString(), ...newDhikr }]
      }));
    }
    closeModal('meAdd');
    setEditingItem(null);
    setNewDhikr({ text: '', count: 1, virtue: '', hadith: '', meaning: '' });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setUserList((items) => {
        const oldIndex = items[activeTab].findIndex(item => item.id === active.id);
        const newIndex = items[activeTab].findIndex(item => item.id === over.id);
        return {
          ...items,
          [activeTab]: arrayMove(items[activeTab], oldIndex, newIndex)
        };
      });
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setUserList(prev => {
      const newList = [...prev[activeTab]];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return { ...prev, [activeTab]: newList };
    });
  };

  const moveDown = (index: number) => {
    if (index === currentList.length - 1) return;
    setUserList(prev => {
      const newList = [...prev[activeTab]];
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
      return { ...prev, [activeTab]: newList };
    });
  };

  const getProgress = (id: string) => {
    const localProgress = progress[id] || 0;
    const mappedId = TASBEEH_MAPPING[id] || id;
    const stats = dailyStats[todayStr]?.[mappedId];
    const tasbeehProgress = stats?.sessionCount !== undefined ? stats.sessionCount : (stats?.count || 0);
    return Math.max(localProgress, tasbeehProgress);
  };
  const handleShare = (item: AdhkarItem) => {
    const text = `${item.text}\n\n${item.virtue ? `الفضل: ${item.virtue}\n` : ''}${item.hadith ? `الحديث: ${item.hadith}\n` : ''}${item.meaning ? `المعنى: ${item.meaning}\n` : ''}\n بواسطة تطبيق AzkarSal`;
    if (navigator.share) {
      navigator.share({
        title: 'ذكر',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ النص');
    }
  };
  const isComplete = (item: AdhkarItem) => getProgress(item.id) >= item.count;

  const completedCount = currentList.filter(isComplete).length;
  const totalCount = currentList.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="h-[100dvh] flex flex-col bg-secondary text-primary relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <header className="z-20 glass-panel px-4 py-4 rounded-b-3xl shadow-sm shrink-0 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
            <ChevronRight size={24} />
          </button>
          <h1 className="text-xl font-bold">أذكار الصباح والمساء</h1>
          <button onClick={() => openModal('meStats')} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
            <BarChart3 size={24} />
          </button>
        </div>

        <div className="flex bg-primary/10 p-1 rounded-2xl relative">
          <div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface rounded-xl shadow-sm transition-all duration-300 ease-in-out"
            style={{ left: activeTab === 'morning' ? 'calc(50% + 2px)' : '2px' }}
          />
          <button
            onClick={() => setActiveTab('morning')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'morning' ? 'text-primary' : 'text-primary/60'}`}
          >
            <Sun size={18} />
            أذكار الصباح
          </button>
          <button
            onClick={() => setActiveTab('evening')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'evening' ? 'text-primary' : 'text-primary/60'}`}
          >
            <Moon size={18} />
            أذكار المساء
          </button>
        </div>

        <div className="mt-4 px-2 flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2 rounded-xl transition-colors ${isEditMode ? 'bg-accent text-white' : 'hover:bg-primary/10 text-primary/70'}`}
            title="تعديل الأذكار"
          >
            <Edit2 size={18} />
          </button>
          {isEditMode && (
            <button
              onClick={() => openModal('meResetList')}
              className="p-2 rounded-xl hover:bg-red-100 text-red-600 transition-colors"
              title="استعادة القائمة الافتراضية"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <div className="flex-1 h-4 bg-primary/10 rounded-full overflow-hidden relative flex items-center justify-center">
            <motion.div 
              className="absolute right-0 top-0 bottom-0 bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
            <span className="text-[10px] font-bold text-primary z-10 mix-blend-difference drop-shadow-sm">
              {completedCount} / {totalCount}
            </span>
          </div>
          <button
            onClick={() => openModal('meReset')}
            className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-primary/70"
            title="تصفير التقدم"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => closeModal('meStats')}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">إحصائيات بناء العادة</h3>
                <button onClick={() => closeModal('meStats')} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-2xl text-center">
                  <p className="text-sm font-bold text-primary/60 mb-1">إنجاز اليوم ({activeTab === 'morning' ? 'الصباح' : 'المساء'})</p>
                  <p className="text-3xl font-bold text-accent">{Math.round(progressPercentage)}%</p>
                </div>
                
                {(() => {
                  const today = new Date();
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();
                  
                  let monthCompleted = 0;
                  let yearCompleted = 0;
                  
                  Object.keys(history).forEach(dateStr => {
                    const d = new Date(dateStr);
                    const data = history[dateStr];
                    const target = activeTab === 'morning' ? data.morning : data.evening;
                    
                    if (d.getFullYear() === currentYear) {
                      if (target >= 1) yearCompleted++;
                      if (d.getMonth() === currentMonth) {
                        if (target >= 1) monthCompleted++;
                      }
                    }
                  });

                  const days = [];
                  for (let i = 29; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayData = history[dateStr];
                    
                    let statusColor = 'bg-red-500/10 border-red-500/20 text-red-500/50';
                    if (dayData) {
                      const target = activeTab === 'morning' ? dayData.morning : dayData.evening;
                      if (target >= 1) {
                        statusColor = 'bg-green-500 border-green-600 text-white shadow-sm';
                      } else if (target > 0) {
                        statusColor = 'bg-yellow-500 border-yellow-600 text-white shadow-sm';
                      }
                    }
                    
                    days.push(
                      <div 
                        key={dateStr} 
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${statusColor}`}
                        title={`${dateStr}: ${dayData ? Math.round((activeTab === 'morning' ? dayData.morning : dayData.evening) * 100) : 0}%`}
                      >
                        {d.getDate()}
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/5 p-4 rounded-2xl text-center">
                          <p className="text-sm font-bold text-primary/60 mb-1">هذا الشهر</p>
                          <p className="text-2xl font-bold text-green-500">{monthCompleted} <span className="text-sm text-primary/40 font-normal">يوم</span></p>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-2xl text-center">
                          <p className="text-sm font-bold text-primary/60 mb-1">هذه السنة</p>
                          <p className="text-2xl font-bold text-green-500">{yearCompleted} <span className="text-sm text-primary/40 font-normal">يوم</span></p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-sm font-bold text-primary/60 mb-3 text-center">سجل آخر 30 يوم</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {days}
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-xs font-bold text-primary/60">
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-500"></div> مكتمل</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-500"></div> جزئي</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/10 border border-red-500/20"></div> لم يبدأ</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => closeModal('meReset')}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">تأكيد التصفير</h3>
              <p className="text-primary/70 mb-6">هل أنت متأكد من أنك تريد تصفير تقدم أذكار {activeTab === 'morning' ? 'الصباح' : 'المساء'}؟</p>
              <div className="flex gap-3">
                <button
                  onClick={() => closeModal('meReset')}
                  className="flex-1 py-3 rounded-xl bg-primary/10 font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={resetProgress}
                  className="flex-1 py-3 rounded-xl bg-accent text-white font-bold"
                >
                  تصفير
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showResetListConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => closeModal('meResetList')}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 text-red-600">استعادة القائمة الافتراضية</h3>
              <p className="text-primary/70 mb-6">هل أنت متأكد من أنك تريد استعادة القائمة الافتراضية؟ سيتم حذف جميع الأذكار التي أضفتها أو عدلتها.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => closeModal('meResetList')}
                  className="flex-1 py-3 rounded-xl bg-primary/10 font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={resetListToDefault}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold"
                >
                  استعادة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => closeModal('meDelete')}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">تأكيد الحذف</h3>
              <p className="text-primary/70 mb-6">هل أنت متأكد من أنك تريد حذف هذا الذكر؟</p>
              <div className="flex gap-3">
                <button
                  onClick={() => closeModal('meDelete')}
                  className="flex-1 py-3 rounded-xl bg-primary/10 font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => closeModal('meAdd')}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">{editingItem ? 'تعديل الذكر' : 'إضافة ذكر جديد'}</h3>
              <input
                type="text"
                placeholder="نص الذكر"
                value={newDhikr.text}
                onChange={(e) => setNewDhikr({ ...newDhikr, text: e.target.value })}
                className="w-full p-3 rounded-xl bg-primary/5 mb-3"
              />
              <input
                type="number"
                placeholder="التكرار"
                value={newDhikr.count}
                onChange={(e) => setNewDhikr({ ...newDhikr, count: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl bg-primary/5 mb-3"
              />
              <input
                type="text"
                placeholder="الفضل"
                value={newDhikr.virtue}
                onChange={(e) => setNewDhikr({ ...newDhikr, virtue: e.target.value })}
                className="w-full p-3 rounded-xl bg-primary/5 mb-3"
              />
              <input
                type="text"
                placeholder="الحديث"
                value={newDhikr.hadith}
                onChange={(e) => setNewDhikr({ ...newDhikr, hadith: e.target.value })}
                className="w-full p-3 rounded-xl bg-primary/5 mb-3"
              />
              <input
                type="text"
                placeholder="المعنى"
                value={newDhikr.meaning}
                onChange={(e) => setNewDhikr({ ...newDhikr, meaning: e.target.value })}
                className="w-full p-3 rounded-xl bg-primary/5 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-primary/10 font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddOrEdit}
                  className="flex-1 py-3 rounded-xl bg-accent text-white font-bold"
                >
                  {editingItem ? 'حفظ' : 'إضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-24 z-10 space-y-4 w-full max-w-md mx-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={currentList.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {currentList.map((item, index) => (
              <SortableItem 
                key={item.id} 
                item={item} 
                index={index} 
                isEditMode={isEditMode} 
                handleIncrement={handleIncrement} 
                onDelete={(id: string) => openModal('meDelete', id)} 
                showVirtueFor={showVirtueFor} 
                setShowVirtueFor={setShowVirtueFor} 
                getProgress={getProgress}
                onEdit={handleEdit}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                isFirst={index === 0}
                isLast={index === currentList.length - 1}
                onShare={handleShare}
                onNavigateToTasbeeh={(item: AdhkarItem) => onNavigateToTasbeeh?.(item, activeTab === 'evening')}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isEditMode && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-primary/20 flex items-center justify-center gap-2 text-primary/60 hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={20} />
            إضافة ذكر جديد
          </button>
        )}
      </main>
    </div>
  );
}
