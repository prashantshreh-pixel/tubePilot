import React from 'react';
import { Sparkles, Image, Repeat, UploadCloud, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAppStore, PageId } from '../store/useAppStore';

export const WorkflowBar: React.FC = () => {
  const { selectedIdea, ideas, setSelectedIdea, currentPage, setCurrentPage, thumbnails, loopVideos, uploadKits } = useAppStore();

  if (!selectedIdea && ideas.length > 0) {
    return null;
  }

  const currentIdea = selectedIdea || ideas[0];
  if (!currentIdea) return null;

  const hasThumbnail = thumbnails.some((t) => t.ideaId === currentIdea.id && t.variations?.length > 0);
  const hasLoop = loopVideos.some((l) => l.ideaId === currentIdea.id && l.status === 'completed');
  const hasKit = uploadKits.some((k) => k.ideaId === currentIdea.id);

  const steps: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }>; completed: boolean }[] = [
    { id: 'thumbnails', label: '1. Thumbnail Studio', icon: Image, completed: hasThumbnail },
    { id: 'loop-videos', label: '2. Seamless Loop', icon: Repeat, completed: hasLoop },
    { id: 'upload-kits', label: '3. Upload Kit & Tags', icon: UploadCloud, completed: hasKit },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-brand-500/20 bg-dark-card/40">
      {/* Current Idea Identity */}
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <button
          onClick={() => setCurrentPage('today')}
          className="p-1.5 rounded-lg bg-dark-bg hover:bg-dark-hover border border-dark-border text-slate-400 hover:text-white transition shrink-0"
          title="Back to Today's Plan"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="overflow-hidden">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                currentIdea.type === 'Short'
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {currentIdea.type}
            </span>
            <span className="text-xs font-bold text-white truncate max-w-sm">
              {currentIdea.title}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-md italic mt-0.5">
            "{currentIdea.hook}"
          </p>
        </div>
      </div>

      {/* 3 Step Interactive Workflow Stepper */}
      <div className="flex items-center space-x-2 bg-dark-bg/80 p-1.5 rounded-xl border border-dark-border/80 text-xs shrink-0">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentPage === step.id;

          return (
            <React.Fragment key={step.id}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
              <button
                onClick={() => setCurrentPage(step.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-brand-500 text-white font-bold shadow-md shadow-brand-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-dark-card'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{step.label}</span>
                {step.completed && (
                  <CheckCircle2 className={`w-3 h-3 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
