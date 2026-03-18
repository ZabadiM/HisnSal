import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sun, Moon, CheckCircle2, BookOpen } from 'lucide-react';
import { MORNING_ADHKAR, EVENING_ADHKAR, AdhkarItem } from '../data/morningEvening';

interface Props {
}

export default function MorningEveningView({}: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = 'morning_evening_progress';

  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
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

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ date: todayStr, data: progress }));
  }, [progress, todayStr]);

  const currentList = activeTab === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR;

  const handleIncrement = (item: AdhkarItem) => {
    setProgress(prev => {
      const current = prev[item.id] || 0;
      if (current < item.count) {
        return { ...prev, [item.id]: current + 1 };
      }
      return prev;
    });
  };

  const resetProgress = () => {
    setProgress({});
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

        <div className="mt-4 px-2">
          <div className="h-4 bg-primary/10 rounded-full overflow-hidden relative flex items-center justify-center">
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
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-24 z-10 space-y-4 w-full max-w-md mx-auto">
        {currentList.map((item, index) => {
          const count = getProgress(item.id);
          const completed = count >= item.count;

          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-panel p-5 rounded-3xl transition-all duration-300 ${completed ? 'opacity-60 bg-primary/5' : ''}`}
              onClick={() => handleIncrement(item)}
            >
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex-1">
                  <p className="font-serif arabic-text text-lg leading-loose whitespace-pre-line">
                    {item.text}
                  </p>
                </div>
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
                  {(item.virtue || item.hadith) && (
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
              </div>
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}
