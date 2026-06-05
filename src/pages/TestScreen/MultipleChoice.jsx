// ==========================================
// COMPONENT 3: MULTIPLE CHOICE
// ==========================================
const MultipleChoice = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Multiple Choice</span>
      Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-5">{group.instruction}</p>

    <div className="space-y-5">
      {group.questions.map(q => {
        const isCorrect = answers[q.id] === q.answer;
        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className={`p-4 rounded-xl border border-slate-100 ${isSubmitted ? (isCorrect ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100') : 'bg-slate-50/30'}`}>
            <p className="font-bold text-slate-800 text-sm flex items-start mb-3 leading-relaxed">
              <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
              <span className="flex-1 text-slate-700">{q.text}</span>
            </p>
            <div className="space-y-2 ml-6">
              {q.options?.map((opt, idx) => {
                const optionLetter = String.fromCharCode(65 + idx);
                const isChecked = answers[q.id] === optionLetter;
                const isThisKey = q.answer === optionLetter;

                return (
                  <label key={idx} className={`flex items-start space-x-2.5 cursor-pointer p-2.5 rounded-xl border text-sm transition-all ${isChecked
                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    } ${isSubmitted && isThisKey ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : ''} ${isSubmitted ? 'pointer-events-none' : ''}`}>
                    <input
                      type="radio"
                      name={q.id}
                      disabled={isSubmitted}
                      checked={isChecked}
                      onChange={() => onAnswerChange(q.id, optionLetter)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <span className={`font-black mr-1 ${isSubmitted && isThisKey ? 'text-emerald-600' : isChecked ? 'text-indigo-600' : 'text-slate-400'}`}>{optionLetter}.</span> {opt}
                    </span>
                  </label>
                );
              })}
            </div>
            {isSubmitted && !isCorrect && (
              <p className="text-xs font-bold text-emerald-600 ml-6 mt-2 flex items-center gap-1 animate-fade-in">
                <i className="fa-solid fa-circle-check"></i> Đáp án đúng phải là: {q.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default MultipleChoice;