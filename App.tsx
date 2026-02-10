import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  UserCircle,
  X,
  Check,
  Rocket,
  DownloadCloud,
  LibraryBig,
  LayoutGrid,
  Zap,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Copy
} from 'lucide-react';
import { generateGeminiImage } from './services/geminiService';
import { GeneratedImage, GenerationStatus } from './types';

const STORAGE_KEY = 'gemini_image_studio_gallery_v5';
const MAX_BATCH_SIZE = 20;

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(10);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<GeneratedImage[]>([]);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkKeyStatus = useCallback(async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true);
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
      } catch (e) {
        console.error("Gallery loading failed", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
  }, [gallery]);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      setHasKey(null);
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setError(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || count < 1) return;

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setCurrentResults([]);
    setProgress(0);

    const actualCount = Math.min(count, MAX_BATCH_SIZE);
    const results: GeneratedImage[] = [];
    
    try {
      for (let i = 0; i < actualCount; i++) {
        try {
          const url = await generateGeminiImage(prompt);
          const newImg: GeneratedImage = {
            id: crypto.randomUUID(),
            url,
            prompt: prompt,
            timestamp: Date.now()
          };
          results.push(newImg);
          setCurrentResults(prev => [...prev, newImg]);
          setGallery(prev => [newImg, ...prev]);
        } catch (err: any) {
          if (err.message.includes('AUTH_REQUIRED')) {
            setHasKey(false);
            throw err;
          }
          await new Promise(r => setTimeout(r, 800));
        }
        setProgress(Math.round(((i + 1) / actualCount) * 100));
      }
      
      if (results.length === 0) {
        throw new Error("ไม่สามารถสร้างรูปภาพได้ โปรดตรวจสอบการตั้งค่าบัญชีของคุณ");
      }
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message.replace('AUTH_REQUIRED: ', ''));
      setStatus(GenerationStatus.ERROR);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (hasKey === false || hasKey === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-md w-full glass p-10 rounded-[3rem] text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="flex justify-center">
            <div className="bg-blue-600 p-6 rounded-[2rem] shadow-2xl shadow-blue-500/40 animate-pulse-soft">
              <UserCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Gemini Studio</h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
              {error ? error : "โปรดเลือกบัญชี Google AI Studio ที่มีการตั้งค่า Billing เพื่อเริ่มต้นสร้างสรรค์ผลงาน"}
            </p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleSelectKey}
              className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-4 h-4" />
              SELECT ACCOUNT
            </button>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic leading-relaxed">
              * ข้อมูลบัญชีจะถูกใช้งานผ่าน Secure Proxy ของระบบ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative">
      {showCopied && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest">
            <Check className="w-4 h-4" /> Copied to clipboard
          </div>
        </div>
      )}

      {/* Header */}
      <header className="safe-top glass border-b border-white/5 px-6 py-5 shrink-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Studio Pro</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInstallModal(true)}
              className="px-5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 transition-all active:scale-95 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase hidden sm:inline">Setup App</span>
            </button>
            <button 
              onClick={handleSelectKey} 
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 active:scale-95 flex items-center gap-2 hover:bg-slate-800 transition-colors"
              title="Switch Account"
            >
              <UserCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto scroll-container p-6 pb-40">
        <div className="max-w-5xl mx-auto space-y-12">
          {activeTab === 'create' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="text-center space-y-4 pt-4">
                <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">IMAGINE</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Neural Engine v5.4</p>
              </div>

              <form onSubmit={handleGenerate} className="glass p-8 md:p-12 rounded-[3.5rem] space-y-10 shadow-2xl border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600"></div>
                
                <div className="space-y-4">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vision Prompt</label>
                  </div>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your creative vision in detail..."
                    className="w-full bg-black/40 border border-white/5 rounded-[2.5rem] px-8 py-8 h-48 md:h-60 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 outline-none transition-all resize-none text-xl font-medium placeholder:text-slate-800"
                    required
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="bg-black/40 p-2 rounded-2xl border border-white/5 flex gap-1.5 flex-1">
                    {[1, 3, 5, 10, 20].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${count === n ? 'bg-white text-slate-950 shadow-xl scale-[1.05]' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={status === GenerationStatus.GENERATING}
                    type="submit"
                    className="md:w-64 bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-blue-600/30 uppercase text-xs tracking-widest disabled:bg-slate-900"
                  >
                    {status === GenerationStatus.GENERATING ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {status === GenerationStatus.GENERATING ? `BATCHING ${progress}%` : `GENERATE BATCH`}
                  </button>
                </div>

                {status === GenerationStatus.GENERATING && (
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </form>

              {currentResults.length > 0 && (
                <div className="space-y-8 pt-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-6 px-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Session Output</h3>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">{currentResults.length} IMAGES</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {currentResults.map(img => (
                      <ImageCard 
                        key={img.id} 
                        image={img} 
                        onDelete={() => setGallery(g => g.filter(i => i.id !== img.id))} 
                        onCopy={() => copyToClipboard(img.prompt)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2.5rem] flex items-center gap-4 text-red-400">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="flex items-center justify-between border-b border-white/10 pb-10">
                <div>
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter">COLLECTION</h2>
                  <p className="text-slate-600 text-[10px] font-black uppercase mt-2 tracking-widest">Local Storage ({gallery.length})</p>
                </div>
                {gallery.length > 0 && (
                  <button onClick={() => confirm('ลบข้อมูลทั้งหมดในเครื่อง?') && setGallery([])} className="p-4 bg-red-500/10 text-red-500 rounded-2xl active:scale-90 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>

              {gallery.length === 0 ? (
                <div className="py-40 text-center space-y-6 bg-slate-900/30 rounded-[4rem] border-2 border-dashed border-white/5">
                  <ImageIcon className="w-16 h-16 text-slate-800 mx-auto" />
                  <p className="text-slate-600 font-black uppercase text-xs tracking-widest italic">Gallery Empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {gallery.map(img => (
                    <ImageCard 
                      key={img.id} 
                      image={img} 
                      onDelete={() => setGallery(g => g.filter(i => i.id !== img.id))} 
                      onCopy={() => copyToClipboard(img.prompt)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Install App Info Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-2xl w-full glass p-8 md:p-12 rounded-[3.5rem] border border-white/10 space-y-8 relative overflow-y-auto max-h-[90vh] scroll-container shadow-2xl">
            <button onClick={() => setShowInstallModal(false)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
            <div className="text-center space-y-3">
              <div className="inline-block p-4 bg-blue-600/20 rounded-3xl mb-2">
                <Smartphone className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">App Installation</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Convert web to app</p>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-400 font-black uppercase italic">Progressive Web App</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open in Chrome (Android) or Safari (iOS) and select <b>"Add to Home Screen"</b>. This app will run full-screen without address bar.
                </p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <Rocket className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs text-indigo-400 font-black uppercase italic">Native APK Wrap</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Use <b>Web2APK</b> or <b>Capacitor</b> to bundle this source code into a native .apk file for Android distribution.
                </p>
              </div>
            </div>
            <div className="text-center pt-4">
              <button onClick={() => setShowInstallModal(false)} className="px-12 py-5 bg-white text-slate-950 font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95 shadow-xl">
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass p-2 rounded-[2.5rem] border-white/10 z-[100] shadow-2xl flex items-center gap-1.5 safe-bottom backdrop-blur-3xl">
        <button 
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] transition-all duration-500 ${activeTab === 'create' ? 'bg-white text-slate-950 shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-white/5'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Create</span>
        </button>
        <button 
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] transition-all duration-500 ${activeTab === 'gallery' ? 'bg-white text-slate-950 shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-white/5'}`}
        >
          <LibraryBig className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
        </button>
      </nav>
    </div>
  );
};

interface ImageCardProps {
  image: GeneratedImage;
  onDelete: () => void;
  onCopy: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onCopy }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <div className="group relative glass rounded-[2rem] overflow-hidden aspect-square border-white/5 hover:translate-y-[-8px] transition-all duration-500 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
        </div>
      )}
      <img 
        src={image.url} 
        alt={image.prompt} 
        onLoad={() => setLoading(false)}
        className={`w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-125 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
        <div className="flex gap-2">
          <a 
            href={image.url} 
            download={`gemini-${image.id}.png`}
            className="flex-1 bg-white text-slate-950 py-3 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shadow-xl active:scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            <DownloadCloud className="w-4 h-4 mr-2" /> Save
          </a>
          <button 
            onClick={(e) => { e.stopPropagation(); onCopy(); }} 
            className="p-3 bg-white/10 text-white rounded-xl border border-white/5 hover:bg-white/20 active:scale-95 transition-all"
            title="Copy Prompt"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="p-3 bg-red-600/20 text-white rounded-xl border border-red-500/10 hover:bg-red-600/30 active:scale-95 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;