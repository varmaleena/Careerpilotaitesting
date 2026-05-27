import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Building, Clock, ExternalLink, BookmarkPlus, Search, GripVertical, CheckCircle, MessageSquare, XCircle, Award, ChevronDown } from 'lucide-react';
import { UserProfile, JobApplication } from '../types';
import { fetchAllVerifiedJobs, VerifiedJob } from '../services/jobFetchers';


const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
        case 'Saved': return '#60a5fa'; // blue-400
        case 'Applied': return '#facc15'; // yellow-400
        case 'Interviewing': return '#c084fc'; // purple-400
        case 'Offer': return '#34d399'; // emerald-400
        case 'Rejected': return '#f87171'; // red-400
        default: return '#a1a1aa'; // zinc-400
    }
};

interface JobsViewProps {
  userProfile: UserProfile;
  uid: string;
  onSaveJob: (job: VerifiedJob) => void;
  onUpdateJobStatus: (jobId: string, status: JobApplication['status']) => void;
  onDeleteJob: (jobId: string) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ 
    userProfile, 
    uid, 
    onSaveJob, 
    onUpdateJobStatus,
    onDeleteJob 
}) => {
  const [activeTab, setActiveTab] = useState<'find' | 'tracker'>('find');
  const [availableJobs, setAvailableJobs] = useState<VerifiedJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [searchQuery, setSearchQuery] = useState(userProfile.targetRole || '');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Kanban Columns
  const columns: { id: JobApplication['status']; label: string; icon: any; color: string }[] = [
    { id: 'Saved', label: 'Saved', icon: BookmarkPlus, color: 'text-blue-400' },
    { id: 'Applied', label: 'Applied', icon: Briefcase, color: 'text-yellow-400' },
    { id: 'Interviewing', label: 'Interviewing', icon: MessageSquare, color: 'text-purple-400' },
    { id: 'Offer', label: 'Offer', icon: Award, color: 'text-emerald-400' },
    { id: 'Rejected', label: 'Rejected', icon: XCircle, color: 'text-red-400' }
  ];

  const fetchJobs = async (force: boolean = false) => {
    if (!searchQuery) return;
    setIsLoadingJobs(true);
    try {
        const jobs = await fetchAllVerifiedJobs(searchQuery, uid, force);
        setAvailableJobs(jobs);
    } catch (error) {
        // Fetch failed
    } finally {
        setIsLoadingJobs(false);
    }
  };

  // Initial fetch — the service-level cache in jobFetchers handles in-memory caching,
  // so navigating back to Job Hub is instant after the first fetch.
  useEffect(() => {
    if (activeTab !== 'find') return;
    if (availableJobs.length > 0) return; // already loaded in this React lifecycle

    // fetchAllVerifiedJobs checks in-memory cache first (zero latency),
    // then Firestore, then live network. No spinner on cache hit.
    const hasGeneratedInSession = sessionStorage.getItem('careerPilot_session_jobs_generated') === 'true';
    if (!hasGeneratedInSession) {
        fetchJobs(true);
        sessionStorage.setItem('careerPilot_session_jobs_generated', 'true');
    } else {
        fetchJobs(false); // will return from in-memory cache instantly
    }
  }, [activeTab]);

  const trackedJobs = userProfile.jobApplications || [];
  const savedJobIds = new Set(trackedJobs.map(j => j.jobId));

  return (
    <div className="w-full space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-emerald-400" />
            Job Hub
          </h1>
          <p className="text-zinc-400 mt-1">Find roles and track your applications in one place.</p>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('find')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'find' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Find Jobs
          </button>
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'tracker' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Tracker 
            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs">
                {trackedJobs.length}
            </span>
          </button>
        </div>
      </div>

      {/* FIND JOBS TAB */}
      {activeTab === 'find' && (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search roles (e.g. Frontend Developer)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && fetchJobs(true)}
                    />
                </div>
                <button 
                    onClick={() => fetchJobs(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors whitespace-nowrap"
                >
                    Search Jobs
                </button>
            </div>

            {isLoadingJobs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 h-48"></div>
                    ))}
                </div>
            ) : availableJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableJobs.map((job) => {
                        const isSaved = savedJobIds.has(job.id);
                        return (
                            <div key={job.id} className="bg-black/40 border border-white/10 hover:border-emerald-500/50 transition-all rounded-xl p-5 flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white line-clamp-2">{job.title}</h3>
                                        <div className="flex items-center gap-2 text-zinc-400 mt-1">
                                            <Building className="w-4 h-4" />
                                            <span>{job.company}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-white/10 text-zinc-300 rounded-lg">
                                        {job.sourceType}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <MapPin className="w-4 h-4 text-emerald-400" />
                                        <span>{job.location}</span>
                                    </div>
                                    {job.salary && (
                                        <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                                            <Award className="w-4 h-4" />
                                            <span>{job.salary}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{job.postedAt}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <a 
                                        href={job.applyLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
                                    >
                                        View
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button 
                                        onClick={() => !isSaved && onSaveJob(job)}
                                        disabled={isSaved}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${
                                            isSaved 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        }`}
                                    >
                                        {isSaved ? (
                                            <><CheckCircle className="w-4 h-4" /> Saved</>
                                        ) : (
                                            <><BookmarkPlus className="w-4 h-4" /> Save Job</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                    <Briefcase className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
                    <p className="text-zinc-400">Try adjusting your search query.</p>
                </div>
            )}
        </div>
      )}

      {/* KANBAN TRACKER TAB */}
      {activeTab === 'tracker' && (
        <div className="flex gap-3 overflow-x-auto pb-6 snap-x custom-scrollbar -mx-1 px-1">
            {columns.map(column => {
                const columnJobs = trackedJobs.filter(j => j.status === column.id).sort((a,b) => b.dateUpdated - a.dateUpdated);
                const Icon = column.icon;
                
                return (
                    <div key={column.id} className="flex-1 min-w-[260px] lg:min-w-[200px] xl:min-w-[220px] max-w-[320px] bg-zinc-950/40 border border-zinc-800/60 rounded-2xl p-4 flex flex-col h-[calc(100vh-340px)] md:h-[calc(100vh-280px)] min-h-[400px] snap-start shadow-xl">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800/40">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${column.color}`} />
                                {column.label}
                            </h3>
                            <span className="bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                {columnJobs.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-24 custom-scrollbar">
                            {columnJobs.map(job => (
                                <div key={job.id} className="bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 group transition-colors shadow-md relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-white line-clamp-2 pr-6">{job.title}</h4>
                                        <button onClick={() => onDeleteJob(job.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-4">{job.company}</p>
                                    
                                    <div className="flex justify-between items-center mt-4">
                                        {job.applyLink ? (
                                            <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                                                Link <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : <span></span>}

                                        {/* Custom Status Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveDropdownId(activeDropdownId === job.id ? null : job.id)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[10px] text-zinc-300 hover:text-white transition-all font-semibold cursor-pointer shadow-lg active:scale-95"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(job.status) }}></span>
                                                {job.status}
                                                <ChevronDown className="w-3 h-3 text-zinc-500" />
                                            </button>

                                            {activeDropdownId === job.id && (
                                                <>
                                                    {/* Click-away backdrop */}
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)}></div>
                                                    
                                                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                                        {columns.map(c => {
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        onUpdateJobStatus(job.id, c.id);
                                                                        setActiveDropdownId(null);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                                                        job.status === c.id 
                                                                        ? 'bg-violet-500/10 text-violet-400' 
                                                                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                                                    }`}
                                                                >
                                                                    {c.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {columnJobs.length === 0 && (
                                <div className="text-center py-8 text-zinc-600 text-xs border-2 border-dashed border-zinc-800/40 rounded-xl">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};
