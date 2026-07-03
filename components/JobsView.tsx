import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Building, Clock, ExternalLink, BookmarkPlus, Search, GripVertical, CheckCircle, MessageSquare, XCircle, Award, ChevronDown } from 'lucide-react';
import { UserProfile, JobApplication } from '../types';
import { fetchAllVerifiedJobs, VerifiedJob } from '../services/jobFetchers';

const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
        case 'Saved': return '#3b82f6'; // blue-500
        case 'Applied': return '#eab308'; // yellow-500
        case 'Interviewing': return '#a855f7'; // purple-500
        case 'Offer': return '#10b981'; // emerald-500
        case 'Rejected': return '#ef4444'; // red-500
        default: return '#71717a'; // zinc-500
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
    { id: 'Saved', label: 'Saved', icon: BookmarkPlus, color: 'text-blue-500' },
    { id: 'Applied', label: 'Applied', icon: Briefcase, color: 'text-amber-500' },
    { id: 'Interviewing', label: 'Interviewing', icon: MessageSquare, color: 'text-purple-500' },
    { id: 'Offer', label: 'Offer', icon: Award, color: 'text-emerald-500' },
    { id: 'Rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500' }
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

  useEffect(() => {
    if (activeTab !== 'find') return;
    if (availableJobs.length > 0) return;

    const hasGeneratedInSession = sessionStorage.getItem('careerPilot_session_jobs_generated') === 'true';
    if (!hasGeneratedInSession) {
        fetchJobs(true);
        sessionStorage.setItem('careerPilot_session_jobs_generated', 'true');
    } else {
        fetchJobs(false);
    }
  }, [activeTab]);

  const trackedJobs = userProfile.jobApplications || [];
  const savedJobIds = new Set(trackedJobs.map(j => j.jobId));

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-zinc-700" />
            Job Hub
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Find roles and track your applications in one place.</p>
        </div>
        
        <div className="flex bg-zinc-200/60 p-1 rounded-xl border border-zinc-300/40">
          <button 
            onClick={() => setActiveTab('find')}
            className={`px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer border-0 ${
                activeTab === 'find' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 bg-transparent'
            }`}
          >
            Find Jobs
          </button>
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border-0 ${
                activeTab === 'tracker' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 bg-transparent'
            }`}
          >
            My Tracker 
            <span className="bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search roles (e.g. Frontend Developer)"
                        className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-12 pr-4 text-zinc-900 placeholder-zinc-450 focus:border-zinc-400 focus:outline-none focus:ring-0 shadow-sm"
                        onKeyDown={(e) => e.key === 'Enter' && fetchJobs(true)}
                    />
                </div>
                <button 
                    onClick={() => fetchJobs(true)}
                    className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition-colors whitespace-nowrap cursor-pointer border-0 shadow-sm"
                >
                    Search Jobs
                </button>
            </div>

            {isLoadingJobs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-5 h-48"></div>
                    ))}
                </div>
            ) : availableJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableJobs.map((job) => {
                        const isSaved = savedJobIds.has(job.id);
                        return (
                            <div key={job.id} className="bg-zinc-50 border border-zinc-200/60 hover:border-zinc-350 transition-all rounded-xl p-5 flex flex-col h-full group shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-900 line-clamp-2">{job.title}</h3>
                                        <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                                            <Building className="w-3.5 h-3.5" />
                                            <span>{job.company}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 bg-white text-zinc-600 rounded-lg border border-zinc-200 shadow-sm">
                                        {job.sourceType}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>{job.location}</span>
                                    </div>
                                    {job.salary && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-700 font-bold">
                                            <Award className="w-3.5 h-3.5 text-zinc-500" />
                                            <span>{job.salary}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{job.postedAt}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <a 
                                        href={job.applyLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-bold text-xs shadow-sm"
                                    >
                                        View
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button 
                                        onClick={() => !isSaved && onSaveJob(job)}
                                        disabled={isSaved}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-colors border-0 cursor-pointer ${
                                            isSaved 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                                        }`}
                                    >
                                        {isSaved ? (
                                            <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
                                        ) : (
                                            <><BookmarkPlus className="w-3.5 h-3.5" /> Save Job</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-zinc-50 rounded-xl border border-zinc-200">
                    <Briefcase className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">No jobs found</h3>
                    <p className="text-sm text-zinc-500">Try adjusting your search query.</p>
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
                    <div key={column.id} className="flex-1 min-w-[260px] lg:min-w-[200px] xl:min-w-[220px] max-w-[320px] bg-zinc-50 border border-zinc-200/60 rounded-2xl p-4 flex flex-col h-[calc(100vh-340px)] md:h-[calc(100vh-280px)] min-h-[400px] snap-start shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-200">
                            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${column.color}`} />
                                {column.label}
                            </h3>
                            <span className="bg-zinc-200/60 text-zinc-650 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                {columnJobs.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-24 custom-scrollbar">
                            {columnJobs.map(job => (
                                <div key={job.id} className="bg-white hover:bg-zinc-50/50 border border-zinc-200 rounded-xl p-4 group transition-colors shadow-sm relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-xs text-zinc-900 line-clamp-2 pr-6 leading-normal">{job.title}</h4>
                                        <button onClick={() => onDeleteJob(job.id)} className="text-zinc-400 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 cursor-pointer border-0 bg-transparent">
                                            <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mb-4">{job.company}</p>
                                    
                                    <div className="flex justify-between items-center mt-4">
                                        {job.applyLink ? (
                                            <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                                                Link <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : <span></span>}

                                        {/* Custom Status Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveDropdownId(activeDropdownId === job.id ? null : job.id)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 rounded-xl text-[10px] text-zinc-600 hover:text-zinc-900 transition-all font-bold cursor-pointer shadow-sm active:scale-95"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(job.status) }}></span>
                                                {job.status}
                                                <ChevronDown className="w-3 h-3 text-zinc-400" />
                                            </button>

                                            {activeDropdownId === job.id && (
                                                <>
                                                    {/* Click-away backdrop */}
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)}></div>
                                                    
                                                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-zinc-200 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                                        {columns.map(c => {
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        onUpdateJobStatus(job.id, c.id);
                                                                        setActiveDropdownId(null);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${
                                                                        job.status === c.id 
                                                                        ? 'bg-zinc-100 text-zinc-900' 
                                                                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 bg-transparent'
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
                                <div className="text-center py-8 text-zinc-400 text-xs border-2 border-dashed border-zinc-200 rounded-xl font-medium">
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
