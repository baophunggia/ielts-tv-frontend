import React from 'react';

const MultipleChoiceMulti = ({ group, answers, onAnswerChange, isSubmitted }) => {
  
  const handleToggleOption = (qId, optionLetter, maxLimit) => {
    if (isSubmitted) return;
    const currentSelected = answers[qId] || [];
    
    if (currentSelected.includes(optionLetter)) {
      onAnswerChange(qId, currentSelected.filter(letter => letter !== optionLetter));
    } else {
      if (currentSelected.length < maxLimit) {
        onAnswerChange(qId, [...currentSelected, optionLetter].sort());
      } else {
        alert(`Bạn chỉ được phép chọn tối đa ${maxLimit} đáp án!`);
      }
    }
  };

  return (
    <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
      <h3 className="font-bold text-lg mb-2 text-indigo-900 flex items-center gap-2">
        <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Multiple Choice (Multiple)</span>
      </h3>
      <p className="text-sm text-slate-500 font-medium italic mb-5">
        {group.instruction} <strong className="text-amber-600">(Choose {group.requiredSelectCount || 2})</strong>
      </p>

      <div className="space-y-6">
        {group.questions.map(q => {
          const selectedArr = answers[q.id] || [];
          const correctArr = q.answer || []; // Vd: ['B', 'D']
          
          return (
            <div key={q.id} id={`q-${q.displayNumber}`} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="font-bold text-slate-800 text-sm flex items-start mb-4">
                <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
                {q.text}
              </p>
              
              <div className="space-y-2 ml-8">
                {group.options?.map(opt => {
                  const letter = opt.charAt(0);
                  const isChecked = selectedArr.includes(letter);
                  const isThisCorrectKey = correctArr.includes(letter);
                  
                  // Style logic hiển thị đúng / sai
                  let boxStyle = "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
                  if (isChecked && !isSubmitted) boxStyle = "bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-400";
                  if (isSubmitted) {
                    if (isChecked && isThisCorrectKey) boxStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400"; // Chọn trúng đáp án
                    if (isChecked && !isThisCorrectKey) boxStyle = "bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-400"; // Chọn sai
                    if (!isChecked && isThisCorrectKey) boxStyle = "bg-emerald-50/50 border-dashed border-emerald-400 text-emerald-700"; // Bỏ sót đáp án đúng
                  }

                  return (
                    <div 
                      key={letter} 
                      onClick={() => handleToggleOption(q.id, letter, group.requiredSelectCount || 2)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${boxStyle} ${isSubmitted ? 'pointer-events-none' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                        {isChecked && <i className="fa-solid fa-check text-white text-xs"></i>}
                      </div>
                      <span className="text-sm font-medium">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="ml-8 mt-4 space-y-2">
                   <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 inline-block">
                     Correct Keys: {Array.isArray(correctArr) ? correctArr.join(', ') : correctArr}
                   </div>
                   {q.explanation && (
                     <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg italic leading-relaxed">
                       {q.explanation}
                     </div>
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

export default MultipleChoiceMulti;