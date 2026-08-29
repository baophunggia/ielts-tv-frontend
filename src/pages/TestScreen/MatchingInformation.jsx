import React from 'react';

const MatchingInformation = ({ group, answers, onAnswerChange, isSubmitted }) => {
  return (
    <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
      <h3 className="font-bold text-lg mb-2 text-[#2a4365] flex items-center gap-2">
        <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Matching Information</span>
      </h3>
      <p className="text-sm text-slate-500 font-medium italic mb-3">{group.instruction}</p>

      {/* FIX BUG: Trước đây không có hướng dẫn nào cho dạng câu hỏi này, học viên
          dễ bối rối vì mỗi ô nhập đều hiện chữ "A" y hệt nhau (placeholder cứng),
          trông giống như đáp án gợi ý sẵn. Giờ thay bằng 1 khối hướng dẫn rõ ràng,
          giải thích rằng đáp án là chữ cái đoạn văn (đã đánh dấu trong bài đọc). */}
      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-5 flex items-start gap-2">
        <i className="fa-solid fa-circle-info mt-0.5 shrink-0"></i>
        <span>Mỗi đoạn văn trong bài đọc bên trái được đánh dấu bằng 1 chữ cái (A, B, C...) ở đầu đoạn. Hãy tìm đoạn văn chứa thông tin phù hợp với câu hỏi rồi điền đúng chữ cái đoạn văn đó vào ô bên dưới.</span>
      </div>

      <div className="space-y-4">
        {group.questions.map(q => {
          const isCorrect = answers[q.id]?.trim().toUpperCase() === (q.answer || '').toUpperCase();
          return (
            <div key={q.id} id={`q-${q.displayNumber}`} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-black text-[#1e40a1] bg-[#eef2fc] px-2 py-0.5 rounded-md text-sm">{q.displayNumber}</span>
                <input
                  type="text"
                  maxLength={1}
                  disabled={isSubmitted}
                  value={answers[q.id] || ''}
                  onChange={(e) => onAnswerChange(q.id, e.target.value.toUpperCase())}
                  className={`w-12 h-10 text-center font-bold text-lg rounded-lg border-2 outline-none transition-all ${
                    isSubmitted
                      ? isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'
                      : 'bg-white border-slate-300 focus:border-[#1e40a1] text-[#2a4365]'
                  }`}
                  aria-label={`Đáp án câu ${q.displayNumber}: nhập chữ cái đoạn văn`}
                />
              </div>
              <div className="flex-1 text-slate-700 text-sm mt-1">{q.text}</div>
              
              {isSubmitted && (
                <div className="w-full sm:w-auto mt-2 sm:mt-0 text-sm">
                   {!isCorrect && (
                      <div className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block mb-2">
                        Key: {q.answer}
                      </div>
                   )}
                   {q.explanation && (
                     <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg italic">
                       <i className="fa-solid fa-lightbulb text-amber-500 mr-1"></i> {q.explanation}
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

export default MatchingInformation;