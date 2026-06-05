import React from 'react';
import { formatTime } from '../../utils/timeUtils.js';
import TestingBodyRenderQuestion from './TestingBodyRenderQuestion.jsx';
import TestingPassage from './TestingPassage.jsx';

const TestingBody = React.memo(({
    isResizing,
    splitWidth,
    testData,
    onHandleAnswerChange,
    startResizing,
    isSubmitted, seconds, score, allDisplayNumbers, answers 
}) => (
    // Thêm class ép trình duyệt giữ nguyên màu sắc highlight xanh/đỏ khi xuất file: print:[color-adjust:exact]
    <div className="flex flex-1 overflow-hidden relative print:[color-adjust:exact] print:block print:overflow-visible" style={{ cursor: isResizing ? 'col-resize' : 'default' }}>
        
        {/* CỘT TRÁI: ĐOẠN VĂN READING PASSAGE - TỰ ĐỘNG ẨN KHI XUẤT PDF */}
        <div
            className="h-full bg-white border-r border-slate-200 shadow-sm relative flex flex-col print:hidden"
            style={{ width: `${splitWidth}%` }}
        >
            <div className="bg-amber-50/80 border-b border-amber-100 text-amber-800 text-[11px] font-semibold px-4 py-2 flex items-center gap-1.5 shrink-0 select-none shadow-sm">
                <i className="fa-solid fa-marker text-amber-600"></i>
                <span>Mẹo phòng thi: Bôi đen text để đánh dấu (Highlight). Click trực tiếp vào vùng Highlight để xóa bỏ.</span>
            </div>

            <TestingPassage passageHtml={testData.passage_html.replace(/&nbsp;/g, ' ')} />
        </div>

        {/* ĐƯỜNG KÉO BAR - ẨN KHI XUẤT PDF */}
        <div
            className={`w-1.5 h-full cursor-col-resize shrink-0 transition-colors z-20 relative flex items-center justify-center print:hidden ${
                isResizing ? 'bg-indigo-600' : 'bg-slate-300 hover:bg-indigo-400'
            }`}
            onMouseDown={startResizing}
        >
            <div className="absolute w-4 h-8 bg-white border border-slate-300 rounded-md shadow-sm flex items-center justify-center gap-0.5 select-none pointer-events-none">
                <div className="w-[1px] h-3 bg-slate-400"></div>
                <div className="w-[1px] h-3 bg-slate-400"></div>
            </div>
        </div>

        {/* CỘT PHẢI: PHÓNG TO 100% CHIỀU RỘNG TRÊN TRANG GIẤY KHI XUẤT PDF */}
        <div
            className="h-full bg-[#f8fafc] flex overflow-hidden print:w-full print:h-auto print:bg-white print:overflow-visible"
            style={{ width: `${100 - splitWidth}%` }}
        >
            {/* Form câu hỏi chính */}
            <div className="flex-1 h-full overflow-y-auto px-8 py-10 print:px-0 print:py-4 print:overflow-visible">
                {isSubmitted && (
                    // Bảng điểm kết quả sẽ được giữ lại ở đầu file PDF rất chuyên nghiệp
                    <div className="mb-6 p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg flex justify-between items-center border border-emerald-400/20 print:bg-emerald-50 print:text-slate-800 print:border-slate-300 print:shadow-none">
                        <div>
                            <h4 className="text-lg font-black mb-0.5 flex items-center gap-2 print:text-emerald-900">
                                <i className="fa-solid fa-square-poll-vertical text-xl"></i> Kết quả thi trực tuyến
                            </h4>
                            <p className="text-xs text-emerald-100/90 font-medium print:text-slate-600">
                                Thời gian làm bài: <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded font-bold ml-0.5 print:bg-slate-200 print:text-slate-800">{formatTime(seconds)}</span>
                            </p>
                        </div>
                        <div className="text-center bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-inner print:bg-emerald-100 print:border-emerald-200">
                            <span className="text-3xl font-black tracking-tight print:text-emerald-900">{score.correct}</span>
                            <span className="text-sm mx-1 text-emerald-200 print:text-slate-400">/</span>
                            <span className="text-sm text-emerald-200 font-bold print:text-slate-600">{score.total}</span>
                            <p className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold mt-0.5 print:text-emerald-800">Câu trả lời đúng</p>
                        </div>
                    </div>
                )}

                <h2 className="text-xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2 print:text-slate-900">
                    <i className="fa-solid fa-file-signature text-indigo-500 print:hidden"></i> Phiếu trả lời chi tiết
                </h2>

                <TestingBodyRenderQuestion
                    testData={testData}
                    answers={answers}
                    onHandleAnswerChange={onHandleAnswerChange}
                    isSubmitted={isSubmitted}
                />
            </div>

            {/* BẢNG ĐỊNH VỊ MINI-MAP - ẨN KHI XUẤT PDF VÌ KHÔNG CẦN THIẾT TRÊN GIẤY */}
            <div className="w-48 h-full bg-white border-l border-slate-200 p-4 flex flex-col justify-between shrink-0 select-none print:hidden">
                <div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1">
                        <i className="fa-solid fa-grip text-[10px]"></i> Điều hướng
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[70vh] pr-1">
                        {allDisplayNumbers.map((item) => {
                            const hasAnswer = !!answers[item.id]?.toString().trim();
                            return (
                                <button
                                    key={item.num}
                                    className={`h-8 rounded-lg text-xs font-bold transition-all ${isSubmitted
                                        ? 'border border-slate-200 bg-slate-50 text-slate-600'
                                        : hasAnswer
                                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.num}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <span className="w-3 h-3 bg-indigo-600 rounded-md"></span>
                        <span>Đã trả lời</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-md"></span>
                        <span>Chưa làm</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
));

export default TestingBody;