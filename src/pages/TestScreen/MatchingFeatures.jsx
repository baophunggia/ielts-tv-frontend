import React from 'react';

const MatchingFeatures = ({ group, answers, onAnswerChange, isSubmitted }) => {
  return (
    <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
      <h3 className="font-bold text-lg mb-2 text-indigo-900 flex items-center gap-2">
        <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Matching Features</span>
      </h3>
      <p className="text-sm text-slate-500 font-medium italic mb-4">{group.instruction}</p>

      {/* Box Options */}
      <div className="bg-indigo-50/50 p-4 rounded-xl mb-5 border border-indigo-100">
        <p className="font-bold text-sm text-indigo-900 mb-2">List of Options:</p>
        <div className="grid grid-cols-1 gap-2">
          {group.options?.map((opt, idx) => (
            <div key={idx} className="text-sm text-slate-700 font-medium bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              {opt}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {group.questions.map(q => {
          const isCorrect = answers[q.id]?.trim().toUpperCase() === (q.answer || '').toUpperCase();
          return (
            <div key={q.id} id={`q-${q.displayNumber}`} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-sm shrink-0">{q.displayNumber}</span>
                <span className="text-slate-700 text-sm flex-1">{q.text}</span>
                <select
                  disabled={isSubmitted}
                  value={answers[q.id] || ''}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  className={`w-20 p-2 font-bold text-center rounded-lg border-2 outline-none cursor-pointer ${
                    isSubmitted
                      ? isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'
                      : 'bg-white border-slate-300 focus:border-indigo-500'
                  }`}
                >
                  <option value="">-</option>
                  {group.options?.map(opt => {
                    const letter = opt.charAt(0); // Lấy chữ cái đầu (A, B, C)
                    return <option key={letter} value={letter}>{letter}</option>;
                  })}
                </select>
              </div>

              {isSubmitted && (
                <div className="pl-12 text-sm">
                   {!isCorrect && (
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mr-2">
                        Key: {q.answer}
                      </span>
                   )}
                   {q.explanation && (
                     <p className="text-xs text-slate-500 mt-2 bg-slate-100 p-2 rounded-lg italic">
                       {q.explanation}
                     </p>
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchingFeatures;