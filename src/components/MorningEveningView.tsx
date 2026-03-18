import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sun, Moon, CheckCircle2, BookOpen, RotateCcw, Edit2, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { MORNING_ADHKAR, EVENING_ADHKAR, AdhkarItem } from '../data/morningEvening';
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
}


const SortableItem = ({ item, index, isEditMode, handleIncrement, setShowDeleteConfirm, showVirtueFor, setShowVirtueFor, getProgress, onEdit, onMoveUp, onMoveDown, isFirst, isLast }: any) => {
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
          onClick={() => isEditMode ? onEdit(item) : handleIncrement(item)}
        >
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="flex-1">
              <p className="font-serif arabic-text text-lg leading-loose whitespace-pre-line">
                {item.text}
              </p>
            </div>
            {isEditMode && (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="p-2 rounded-full bg-primary/10 text-primary/70 hover:bg-primary/20 transition-colors h-fit"
                >
                  <Edit2 size={18} />
                </button>
                <div className="flex flex-col gap-1 items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(item.id); }}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                      disabled={isFirst}
                      className={`p-1 rounded-lg transition-colors ${isFirst ? 'text-primary/20 cursor-not-allowed' : 'text-primary/60 hover:text-primary hover:bg-primary/10'}`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                      disabled={isLast}
                      className={`p-1 rounded-lg transition-colors ${isLast ? 'text-primary/20 cursor-not-allowed' : 'text-primary/60 hover:text-primary hover:bg-primary/10'}`}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showVirtueFor === item.id && (item.virtue || item.hadith) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-primary/5 rounded-xl text-sm space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
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
              {!isEditMode && (item.virtue || item.hadith) && (
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

export default function MorningEveningView({}: Props) {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdhkarItem | null>(null);

  const [newDhikr, setNewDhikr] = useState({ text: '', count: 1, virtue: '', hadith: '' });

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ date: todayStr, data: progress }));
  }, [progress, todayStr]);

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
    setShowDeleteConfirm(null);
  };

  const resetProgress = () => {
    setProgress({});
    setShowResetConfirm(false);
  };

  const handleEdit = (item: AdhkarItem) => {
    setEditingItem(item);
    setNewDhikr({
      text: item.text,
      count: item.count,
      virtue: item.virtue || '',
      hadith: item.hadith || ''
    });
    setIsAddModalOpen(true);
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
    setIsAddModalOpen(false);
    setEditingItem(null);
    setNewDhikr({ text: '', count: 1, virtue: '', hadith: '' });
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

  const getProgress = (id: string) => progress[id] || 0;
  const isComplete = (item: AdhkarItem) => getProgress(item.id) >= item.count;

  const completedCount = currentList.filter(isComplete).length;
  const totalCount = currentList.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="h-[100dvh] flex flex-col bg-secondary text-primary relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <header className="z-20 glass-panel px-4 py-4 rounded-b-3xl shadow-sm shrink-0 w-full max-w-md mx-auto">
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
            onClick={() => setShowResetConfirm(true)}
            className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-primary/70"
            title="تصفير التقدم"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowResetConfirm(false)}
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
                  onClick={() => setShowResetConfirm(false)}
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
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
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
                  onClick={() => setShowDeleteConfirm(null)}
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
            onClick={() => setIsAddModalOpen(false)}
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
                setShowDeleteConfirm={setShowDeleteConfirm} 
                showVirtueFor={showVirtueFor} 
                setShowVirtueFor={setShowVirtueFor} 
                getProgress={getProgress}
                onEdit={handleEdit}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                isFirst={index === 0}
                isLast={index === currentList.length - 1}
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
