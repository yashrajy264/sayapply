import React from 'react';

const JobStatusCard = ({ job }) => {
  const { jobTitle, company, status, error } = job;

  return (
    <div className="bg-[#171717] px-4 py-3 rounded-lg border border-[#333] hover:border-[#444] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="font-medium text-zinc-200 text-sm truncate">{job.role || jobTitle || 'Unknown Job'}</h4>
          <p className="text-xs text-zinc-500 truncate">{job.company || company || 'Unknown Company'}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium rounded-full">
            {status || 'Running...'}
          </span>
        </div>
      </div>

      {job.match_score && (
        <div className="mt-2 text-xs border-t border-[#333] pt-2">
          <span className={`font-semibold ${job.match_score > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
            Fit Score: {job.match_score}%
          </span>
        </div>
      )}

      {job.red_flags && job.red_flags.length > 0 && (
        <div className="mt-1 space-y-1">
          {job.red_flags.map((flag, idx) => (
            <p key={idx} className="text-[10px] text-red-400 truncate flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {flag}
            </p>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 mt-1 truncate">{error}</p>}
    </div>
  );
};

export default JobStatusCard;
