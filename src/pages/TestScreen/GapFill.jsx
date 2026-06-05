// ==========================================
// COMPONENT 4: GAP FILL (ĐIỀN TỪ)
// ==========================================
const GapFill = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Gap Fill</span>
      Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-5">{group.instruction}</p>

    <div className="space-y-4">
      {group.questions.map(q => {
        const parts = q.text.split(/\[GAP\]|_{3,}/);
        const isCorrect = answers[q.id]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();

        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className="text-slate-700 leading-relaxed text-sm flex flex-wrap items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100/70">
            <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
            <span>{parts[0]}</span>

            <input
              type="text"
              disabled={isSubmitted}
              value={answers[q.id] || ''}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              className={`border-b-2 mx-2 w-40 px-2 focus:outline-none bg-transparent text-center font-bold text-sm transition-all py-0.5 ${isSubmitted
                ? (isCorrect ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded' : 'border-rose-500 text-rose-600 bg-rose-50/50 rounded')
                : 'border-slate-300 focus:border-indigo-600 text-indigo-900 font-semibold'
                }`}
              placeholder="Nhập đáp án..."
            />

            {parts.length > 1 && <span>{parts[1]}</span>}

            {isSubmitted && !isCorrect && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md ml-2 flex items-center gap-1 animate-fade-in">
                <i className="fa-solid fa-lightbulb"></i> Đáp án đúng: {q.answer}
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default GapFill;