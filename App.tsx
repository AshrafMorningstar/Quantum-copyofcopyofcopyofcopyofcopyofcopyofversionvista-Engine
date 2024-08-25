/**
 * @license
 * Copyright © 2026 Ashraf Morningstar
 * https://github.com/AshrafMorningstar
 * 
 * Licensed under the MIT License.
 * This is a personal educational recreation.
 * Original concepts remain property of their respective creators.
 * 
 * @author Ashraf Morningstar
 * @see https://github.com/AshrafMorningstar
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Terminal, 
  Settings, 
  Play, 
  CheckCircle, 
  Cpu, 
  Activity,
  Shield,
  Zap,
  Users,
  Trophy,
  Loader2,
  ChevronRight,
  Github,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UserConfig, GitEvent, SimulationPhase, LogEntry } from './types';
import { DEFAULT_CONFIG, ACHIEVEMENTS, TECH_STACKS } from './constants';
import { generateSimulationPlan } from './services/geminiService';
import { initGitHub, executeGitEvent } from './services/githubService';

// --- Sub-components (Internal to avoid file sprawl for this specific constraints) ---

const StepIndicator = ({ step, currentStep, icon: Icon, label }: any) => {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep; 
  
  let colorClass = "text-slate-500 border-slate-700";
  if (isActive) colorClass = "text-cyan-400 border-cyan-400 bg-cyan-950/30";
  if (isCompleted) colorClass = "text-emerald-400 border-emerald-400 bg-emerald-950/30";

  return (
    <div className={`flex flex-col items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 ${colorClass} flex-1`}>
      <Icon size={24} />
      <span className="font-mono text-sm font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

const AchievementCard = ({ achievement, selected, onClick }: any) => {
  const Icon = {
    GitPullRequest, Zap, Users, Trophy, Crosshair: Users
  }[achievement.icon] || Trophy;

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center gap-3
        ${selected ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}
      `}
    >
      <div className={`p-3 rounded-full bg-slate-900 ${achievement.color}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-bold text-slate-100">{achievement.name}</h4>
        <p className="text-xs text-slate-400 mt-1">{achievement.description}</p>
      </div>
    </div>
  );
};

const SetupView = ({ config, setConfig, onNext }: any) => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      await initGitHub(config.githubToken, config.targetRepo, config.username);
      onNext();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRepoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Try to parse URL if pasted
    if (val.includes('github.com')) {
      try {
        const url = new URL(val);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          setConfig({
            ...config,
            username: parts[0],
            targetRepo: parts[1]
          });
          return;
        }
      } catch (err) {
        // ignore invalid urls, just treat as text
      }
    }
    setConfig({...config, targetRepo: val});
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-cyan-400">
          <Github className="w-5 h-5" /> Account Integration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Target Repository</label>
            <div className="relative">
                <input 
                type="text" 
                value={config.targetRepo}
                onChange={handleRepoInput}
                placeholder="Repository Name or URL"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <LinkIcon className="absolute left-3 top-3.5 text-slate-600 w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">Paste a full GitHub URL (e.g. <code>https://github.com/user/repo</code>) to auto-fill.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">GitHub Username (Owner)</label>
            <input 
              type="text" 
              value={config.username}
              onChange={(e) => setConfig({...config, username: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-400">GitHub Personal Access Token</label>
            <div className="relative">
              <input 
                type="password" 
                value={config.githubToken}
                onChange={(e) => setConfig({...config, githubToken: e.target.value})}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
              />
              <Shield className="absolute right-3 top-3.5 text-slate-600 w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">
              Token requires <code>repo</code> and <code>workflow</code> scopes.
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="shrink-0" size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button 
          onClick={handleVerify}
          disabled={verifying || !config.githubToken || !config.targetRepo}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
        >
          {verifying ? (
            <><Loader2 className="animate-spin" size={20} /> Verifying Access...</>
          ) : (
            <>Connect & Configure <ChevronRight size={20} /></>
          )}
        </button>
      </div>
    </div>
  );
};

const ConfigView = ({ config, setConfig, onNext, onBack }: any) => {
  const toggleAchievement = (id: string) => {
    const newAchievements = config.achievements.includes(id)
      ? config.achievements.filter((a: string) => a !== id)
      : [...config.achievements, id];
    setConfig({ ...config, achievements: newAchievements });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Tech & Time */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" /> Project DNA
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Tech Stack</label>
                <select 
                  value={config.techStack}
                  onChange={(e) => setConfig({...config, techStack: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100"
                >
                  {TECH_STACKS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Branching Strategy</label>
                <div className="flex gap-2">
                  {['gitflow', 'github-flow', 'trunk'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setConfig({...config, strategy: s})}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm border font-mono
                        ${config.strategy === s 
                          ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400' 
                          : 'border-slate-700 bg-slate-900 text-slate-400'}
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> Velocity & Time
            </h3>
            <div className="space-y-4">
               <div>
                <label className="text-sm text-slate-400 block mb-1">Intensity (Commits/Week)</label>
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={config.intensity}
                  onChange={(e) => setConfig({...config, intensity: parseInt(e.target.value)})}
                  className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                  <span>Casual (1)</span>
                  <span>Obsessive (10)</span>
                </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Start Date</label>
                    <input type="date" value={config.startDate} onChange={(e) => setConfig({...config, startDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">End Date</label>
                    <input type="date" value={config.endDate} onChange={(e) => setConfig({...config, endDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-sm" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Achievements */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
           <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" /> Target Achievements
            </h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {ACHIEVEMENTS.map(ach => (
                <AchievementCard 
                  key={ach.id} 
                  achievement={ach} 
                  selected={config.achievements.includes(ach.id)}
                  onClick={() => toggleAchievement(ach.id)}
                />
              ))}
            </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white px-6 py-2 font-medium">Back</button>
        <button 
          onClick={onNext}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-900/20"
        >
          Generate Blueprint <Cpu size={20} />
        </button>
      </div>
    </div>
  );
};

const BlueprintView = ({ plan, onWeave, onBack, isLoading }: any) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 animate-pulse">
        <Loader2 size={64} className="text-cyan-500 animate-spin" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-200">Consulting AI Architect...</h3>
          <p className="text-slate-400">Analyzing tech stack structure, generating conventional commits, and weaving narrative.</p>
        </div>
      </div>
    );
  }

  // Process data for Chart
  const chartData = plan.reduce((acc: any[], event: GitEvent) => {
    const date = event.date.split('T')[0];
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Timeline Visualization */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-64">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Activity Projection</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(d) => d.slice(5)} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} 
              itemStyle={{ color: '#22d3ee' }}
            />
            <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Event List Preview */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[400px]">
         <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-200">Generated History ({plan.length} Events)</h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800">
              AI-OPTIMIZED
            </span>
         </div>
         <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
            {plan.map((event: GitEvent, i: number) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-slate-800/50 rounded-lg group transition-colors border border-transparent hover:border-slate-700">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                   <span className="text-xs font-mono text-slate-500">{event.date.split('T')[0]}</span>
                   <div className="h-full w-px bg-slate-800 group-hover:bg-slate-600 transition-colors"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {event.type === 'commit' && <GitCommit size={16} className="text-blue-400" />}
                    {event.type === 'branch' && <GitBranch size={16} className="text-purple-400" />}
                    {event.type === 'pr' && <GitPullRequest size={16} className="text-green-400" />}
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      event.type === 'commit' ? 'bg-blue-900/30 text-blue-300' :
                      event.type === 'pr' ? 'bg-green-900/30 text-green-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>{event.type}</span>
                    <span className="text-xs font-mono text-slate-500">by {event.author}</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-200">{event.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{event.description}</p>
                </div>
              </div>
            ))}
         </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white px-6 py-2 font-medium">Refine Configuration</button>
        <button 
          onClick={onWeave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse hover:animate-none"
        >
          Start Live Weaving <Play size={20} />
        </button>
      </div>
    </div>
  );
};

const ExecutionView = ({ logs, progress, onDone, isWeaving }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-700">
      <div className="bg-slate-950 rounded-2xl border border-slate-800 flex flex-col flex-1 shadow-2xl overflow-hidden font-mono text-sm">
        <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="ml-4 text-slate-400 text-xs">bot@history-weaver:~/simulating</span>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 text-slate-300">
          {logs.map((log: LogEntry, i: number) => (
            <div key={i} className="flex gap-3">
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={
                log.level === 'error' ? 'text-red-400' :
                log.level === 'success' ? 'text-emerald-400' :
                log.level === 'warning' ? 'text-yellow-400' : 'text-slate-300'
              }>
                {log.level === 'success' && '✔ '}
                {log.level === 'error' && '✖ '}
                {log.message}
              </span>
            </div>
          ))}
          {isWeaving && (
             <div className="animate-pulse text-cyan-500">_</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
         <div className="flex justify-between text-xs font-mono text-cyan-400">
            <span>{isWeaving ? 'EXECUTING LIVE ON GITHUB...' : 'EXECUTION COMPLETE'}</span>
            <span>{Math.round(progress)}%</span>
         </div>
         <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${progress}%` }}
            ></div>
         </div>
      </div>

      {!isWeaving && progress === 100 && (
        <div className="flex justify-center pt-4 animate-in slide-in-from-bottom-4">
           <button 
            onClick={onDone}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-900 font-bold py-3 px-12 rounded-lg flex items-center gap-2"
          >
            <CheckCircle size={20} /> New Simulation
          </button>
        </div>
      )}
    </div>
  );
};


// --- Main Component ---

export default function App() {
  const [phase, setPhase] = useState<SimulationPhase>('setup');
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [plan, setPlan] = useState<GitEvent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWeaving, setIsWeaving] = useState(false);

  // Gemini AI Planning
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setPhase('blueprint');
    
    // Simulate thinking delay if API is super fast, for UX
    const planData = await generateSimulationPlan(config);
    setPlan(planData);
    setIsGenerating(false);
  };

  const addLog = (message: string, level: 'info'|'success'|'warning'|'error' = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      message
    }]);
  };

  // Execution Simulation with REAL GitHub API
  const handleWeave = async () => {
    setPhase('weaving');
    setLogs([]);
    setProgress(0);
    setIsWeaving(true);

    addLog(`Initializing GitHub connection for ${config.username}/${config.targetRepo}...`, 'info');

    try {
      // Re-init just in case (though we check in setup)
      await initGitHub(config.githubToken, config.targetRepo, config.username);
      addLog(`Connected securely. Starting sequence of ${plan.length} events.`, 'success');

      for (let i = 0; i < plan.length; i++) {
        const event = plan[i];
        addLog(`Processing [${event.type.toUpperCase()}] ${event.title}...`, 'info');
        
        try {
          // Execute REAL API call
          const resultMsg = await executeGitEvent(event, config);
          addLog(resultMsg, 'success');
        } catch (e: any) {
          addLog(`Failed: ${e.message}`, 'error');
          // We continue despite errors to try and finish the chain
        }

        const p = ((i + 1) / plan.length) * 100;
        setProgress(p);
        
        // Add a small delay to avoid rate limiting and allow UI updates
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      addLog('All events processed successfully.', 'success');
    } catch (e: any) {
      addLog(`Critical Error: ${e.message}`, 'error');
    } finally {
      setIsWeaving(false);
      setProgress(100);
      setPhase('complete');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-900/50">
                <GitBranch className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                GitHub History Weaver
              </h1>
           </div>
           <div className="text-xs font-mono text-slate-500 border border-slate-800 rounded px-2 py-1">
              v3.0.0-PRO
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 mt-6 pb-20">
        
        {/* Progress Stepper */}
        {phase !== 'complete' && (
          <div className="flex rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden mb-8">
            <StepIndicator step={0} currentStep={['setup', 'config', 'blueprint', 'weaving'].indexOf(phase)} icon={Settings} label="Setup" />
            <StepIndicator step={1} currentStep={['setup', 'config', 'blueprint', 'weaving'].indexOf(phase)} icon={Cpu} label="Config" />
            <StepIndicator step={2} currentStep={['setup', 'config', 'blueprint', 'weaving'].indexOf(phase)} icon={Activity} label="Plan" />
            <StepIndicator step={3} currentStep={['setup', 'config', 'blueprint', 'weaving'].indexOf(phase)} icon={Terminal} label="Weave" />
          </div>
        )}

        {/* Phase Components */}
        <div className="min-h-[500px]">
          {phase === 'setup' && (
            <SetupView 
              config={config} 
              setConfig={setConfig} 
              onNext={() => setPhase('config')} 
            />
          )}

          {phase === 'config' && (
            <ConfigView 
              config={config} 
              setConfig={setConfig} 
              onBack={() => setPhase('setup')}
              onNext={handleGeneratePlan}
            />
          )}

          {phase === 'blueprint' && (
            <BlueprintView 
              plan={plan} 
              isLoading={isGenerating}
              onBack={() => setPhase('config')}
              onWeave={handleWeave}
            />
          )}

          {(phase === 'weaving' || phase === 'complete') && (
             <ExecutionView 
               logs={logs}
               progress={progress}
               onDone={() => {
                 setPhase('setup');
                 setLogs([]);
                 setPlan([]);
               }}
               isWeaving={isWeaving}
             />
          )}
        </div>
      </main>
    </div>
  );
}