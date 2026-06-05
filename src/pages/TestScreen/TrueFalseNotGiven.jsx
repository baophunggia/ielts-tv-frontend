// ==========================================
// COMPONENT 2: TRUE / FALSE / NOT GIVEN
// ==========================================
const TrueFalseNotGiven = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-sky-100 text-sky-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">T / F / NG</span>
      Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-5">{group.instruction}</p>

    <div className="space-y-4">
      {group.questions.map((q) => {
        const isCorrect = answers[q.id] === q.answer;
        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className={`flex flex-col space-y-3 p-4 rounded-xl border border-slate-100 transition-all ${isSubmitted ? (isCorrect ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100') : 'bg-slate-50/40 hover:bg-slate-50'}`}>
            <p className="text-slate-800 flex items-start text-sm leading-relaxed font-medium">
              <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
              <span className="flex-1 text-slate-700">{q.text}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 ml-8 justify-between">
              <div className="flex space-x-2">
                {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => {
                  const isChecked = answers[q.id] === opt;
                  return (
                    <label key={opt} className={`flex items-center space-x-1.5 cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${isChecked
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      } ${isSubmitted ? 'pointer-events-none opacity-80' : ''}`}>
                      <input
                        type="radio"
                        name={q.id}
                        disabled={isSubmitted}
                        checked={isChecked}
                        onChange={() => onAnswerChange(q.id, opt)}
                        className="hidden"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {isSubmitted && !isCorrect && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1 animate-fade-in">
                  <i className="fa-solid fa-circle-check"></i> Đáp án: {q.answer}
                </span>
              )}
              {isSubmitted && isCorrect && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Chính xác</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default TrueFalseNotGiven;