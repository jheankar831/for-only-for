import React, { useState, useCallback, useEffect } from 'react';
import { JobDescription, MatchResult } from './types';
import { analyzeJobMatches } from './services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon } from './components/icons';

const App: React.FC = () => {
  const [resume, setResume] = useState<string>(() => localStorage.getItem('resume') || '');
  const [jobs, setJobs] = useState<JobDescription[]>(() => {
    try {
      const savedJobs = localStorage.getItem('jobs');
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs);
        if (Array.isArray(parsedJobs) && parsedJobs.length > 0) {
          return parsedJobs;
        }
      }
    } catch (e) {
      console.error("Failed to parse jobs from localStorage", e);
    }
    return [{ id: 'job-1', title: '', description: '' }];
  });
  
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('resume', resume);
    }, 2000);
    return () => clearTimeout(timer);
  }, [resume]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('jobs', JSON.stringify(jobs));
    }, 2000);
    return () => clearTimeout(timer);
  }, [jobs]);

  const addJob = () => {
    setJobs([...jobs, { id: `job-${Date.now()}`, title: '', description: '' }]);
  };

  const removeJob = (id: string) => {
    setJobs(jobs.filter((job) => job.id !== id));
  };

  const updateJob = (id: string, field: 'title' | 'description', value: string) => {
    setJobs(
      jobs.map((job) => (job.id === id ? { ...job, [field]: value } : job))
    );
  };

  const handleAnalyze = useCallback(async () => {
    if (!resume.trim() || jobs.some(job => !job.title.trim() || !job.description.trim())) {
      setError('Please fill in your resume and all job titles and descriptions.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResults([]);

    try {
      const matchResults = await analyzeJobMatches(resume, jobs);
      const sortedResults = matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setResults(sortedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [resume, jobs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500" />
            AI Job Matcher
          </h1>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">1. Your Resume</h2>
            <p className="text-sm text-slate-500 mb-4">Paste the full text of your resume below. For best results, include a comprehensive list of your skills, experiences, and achievements.</p>
            <textarea
              className="w-full h-60 p-4 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 bg-white"
              placeholder="Paste your resume here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              aria-label="Resume text area"
            />
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">2. Job Descriptions</h2>
            <p className="text-sm text-slate-500 mb-4">Add one or more job descriptions you are interested in. The AI will analyze your resume against each one.</p>
            <div className="space-y-6">
              {jobs.map((job, index) => (
                <div key={job.id} className="p-4 border border-slate-200 rounded-lg relative">
                  <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-600">Job #{index + 1}</span>
                      {jobs.length > 1 && (
                        <button
                          onClick={() => removeJob(job.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove job #${index + 1}`}
                          title="Remove Job"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded-md mb-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    placeholder="Job Title (e.g., Senior Frontend Developer)"
                    value={job.title}
                    onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                    aria-label={`Title for job #${index + 1}`}
                  />
                  <textarea
                    className="w-full h-40 p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    placeholder="Paste job description here..."
                    value={job.description}
                    onChange={(e) => updateJob(job.id, 'description', e.target.value)}
                    aria-label={`Description for job #${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addJob}
              className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              title="Add a new job description form"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Another Job
            </button>
          </div>

          <div className="flex justify-center sticky bottom-4">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="flex items-center justify-center w-full max-w-sm px-6 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              title="Analyze resume against job descriptions"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6 mr-2" />
                  Analyze Match
                </>
              )}
            </button>
          </div>
          
          {error && <div role="alert" className="mt-6 text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</div>}

          {results.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-center mb-8 text-slate-800">Analysis Results</h2>
              <div className="space-y-6">
                {results.map((result) => {
                  const originalJob = jobs.find(j => j.id === result.jobId);
                  return (
                    <ResultCard 
                        key={result.jobId} 
                        result={result}
                        jobDescription={originalJob ? originalJob.description : "Description not found."}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
}

const ResultCard: React.FC<{ result: MatchResult, jobDescription: string }> = ({ result, jobDescription }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">{result.jobTitle}</h3>
                        <p className="text-sm text-slate-500 mt-1">{result.summary}</p>
                    </div>
                    <div className="ml-6 flex-shrink-0 flex flex-col items-center">
                         <div className={`text-4xl font-extrabold ${getScoreColor(result.matchPercentage).replace('bg-', 'text-')}`}>{result.matchPercentage}%</div>
                         <div className="text-sm font-medium text-slate-600">Match Score</div>
                    </div>
                </div>
                <div className="mt-4" aria-label={`Match score of ${result.matchPercentage} percent`}>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className={`${getScoreColor(result.matchPercentage)} h-2.5 rounded-full`} style={{ width: `${result.matchPercentage}%` }}></div>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-green-700 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Matching Skills
                        </h4>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                            {result.matchingSkills.map((skill, i) => <li key={i} className="pl-4 border-l-2 border-green-100">{skill}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-700 flex items-center">
                            <XCircleIcon className="w-5 h-5 mr-2" />
                            Missing Skills
                        </h4>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                             {result.missingSkills.map((missingSkill, i) => (
                                <li 
                                    key={i} 
                                    className="pl-4 border-l-2 border-red-100 cursor-help"
                                    title={missingSkill.context}
                                >
                                    {missingSkill.skill}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 w-full"
                        aria-expanded={isExpanded}
                        title={isExpanded ? "Hide full description" : "View full description"}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUpIcon className="w-4 h-4 mr-2" />
                                Hide Full Description
                            </>
                        ) : (
                            <>
                                <ChevronDownIcon className="w-4 h-4 mr-2" />
                                View Full Description
                            </>
                        )}
                    </button>
                </div>

                {isExpanded && (
                    <div className="mt-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                        <h5 className="font-semibold text-slate-800 mb-2">Full Job Description</h5>
                        <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">
                            {jobDescription}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
