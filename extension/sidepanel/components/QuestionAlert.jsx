import React, { useState } from 'react';

const QuestionAlert = ({ data, onResolve, onSkip }) => {
  const [answer, setAnswer] = useState('');
  const { questionLabel, fieldType, options } = data;

  return (
    <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-4 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-600/50"></div>
      <div className="flex items-start mb-3">
        <span className="text-yellow-500 mr-2 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wide">Manual Input Required</h3>
          <p className="text-sm text-zinc-300 mt-1 font-medium">{questionLabel}</p>
        </div>
      </div>

      <div className="mb-4 pl-6">
        {options && options.length > 0 ? (
          <select
            className="w-full px-3 py-2 text-sm bg-[#0f0f0f] border border-[#333] rounded-md text-white focus:border-yellow-600/50 focus:ring-0 outline-none"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          >
            <option value="">Select an option...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="w-full px-3 py-2 text-sm bg-[#0f0f0f] border border-[#333] rounded-md text-white focus:border-yellow-600/50 focus:ring-0 outline-none placeholder-zinc-600"
            placeholder="Type your answer..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
        )}
      </div>

      <div className="flex space-x-2 pl-6">
        <button
          onClick={() => onResolve(answer)}
          disabled={!answer}
          className="flex-1 bg-yellow-600 text-white py-1.5 rounded text-xs font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save & Continue
        </button>
        <button
          onClick={onSkip}
          className="px-3 py-1.5 bg-transparent border border-yellow-700/30 text-yellow-600 rounded text-xs font-medium hover:bg-yellow-900/20 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default QuestionAlert;
