// ==========================================
// COMPONENT 1: MATCHING HEADINGS
// ==========================================
const MatchingHeadings = ({ group, answers, onAnswerChange, isSubmitted }) => (
    <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 transition-all">
        <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Headings</span>
            Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
        </h3>
        <p className="text-xs text-slate-400 italic mb-4">{group.instruction}</p>

        <div className="bg-slate-50 p-4 rounded-xl mb-5 border border-slate-200/60 shadow-inner">
            <p className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
                <i className="fa-solid fa-list-ol text-xs text-indigo-500"></i> List of Headings
            </p>
            <ul className="space-y-2">
                {group.options?.map((opt, idx) => (
                    <li key={idx} className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm font-medium">
                        {opt}
                    </li>
                ))}
            </ul>
        </div>

        <div className="space-y-4">
            {group.questions.map(q => {
                const isCorrect = answers[q.id]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
                return (
                    <div key={q.id} id={`q-${q.displayNumber}`} className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-700 text-sm w-24 pl-2">Question {q.displayNumber}:</span>
                            <input
                                type="text"
                                disabled={isSubmitted}
                                value={answers[q.id] || ''}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                className={`border rounded-lg px-3 py-2 w-28 focus:outline-none uppercase text-center font-bold text-base transition-all ${isSubmitted
                                    ? (isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm shadow-rose-100')
                                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white'
                                    }`}
                                placeholder="..."
                            />
                            {isSubmitted && !isCorrect && (
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in flex items-center gap-1">
                                    <i className="fa-solid fa-circle-check"></i> Key: {q.answer}
                                </span>
                            )}
                            {isSubmitted && isCorrect && (
                                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Correct</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default MatchingHeadings;