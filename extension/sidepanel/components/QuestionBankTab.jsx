import React, { useState, useEffect } from 'react';
import { getAllQuestions, deleteQuestion, updateAnswer } from '../../utils/question-bank';

const QuestionBankTab = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const q = await getAllQuestions();
    setQuestions(q);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this saved answer?')) {
      await deleteQuestion(id);
      loadQuestions();
    }
  };

  const filtered = questions.filter(q =>
    q.label.toLowerCase().includes(search.toLowerCase()) ||
    q.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-md pb-2 pt-2 transition-colors">
        <div className="relative">
          <input
            type="text"
            placeholder="Search saved questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors"
          />
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-[#333] rounded-lg bg-zinc-50 dark:bg-[#171717]/50 transition-colors">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">No questions found</p>
          </div>
        ) : (
          filtered.map(q => (
            <div key={q.id} className="bg-white dark:bg-[#171717] p-3 rounded-lg border border-zinc-200 dark:border-[#333] hover:border-zinc-300 dark:hover:border-[#444] shadow-sm dark:shadow-none transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-[#222] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#333]">
                  {q.fieldType}
                </span>
                <button onClick={() => handleDelete(q.id)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-300 mb-1.5 line-clamp-1">{q.label}</h4>
              <p className="text-xs text-zinc-700 dark:text-zinc-400 bg-zinc-50 dark:bg-[#0f0f0f] p-2 rounded border border-zinc-100 dark:border-[#222] line-clamp-2">
                {q.answer}
              </p>
              <div className="mt-2 flex justify-between items-center text-[10px] text-zinc-500">
                <span>Used {q.timesUsed || 0} times</span>
                <span className={`px-1.5 py-0.5 rounded-full ${q.source === 'gemini' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'}`}>
                  {q.source === 'gemini' ? 'AI Generated' : 'User Input'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionBankTab;
