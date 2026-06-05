import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from './../../utils/timeUtils.js';

const TestingHeader = React.memo(({
    testData,
    isSubmitted,
    onHandleSubmitTest,
    onRetakeTest,
    seconds,
    isAllAnswered,
    answeredCount,
    totalCount,
    shareLink
}) => {
    const navigate = useNavigate();

    return (
        // Thêm class print:hidden để ẩn toàn bộ header khi in, hoặc giữ lại để làm tiêu đề file PDF
        <header className="bg-indigo-950 text-white px-5 py-3.5 shadow-md flex justify-between items-center shrink-0 z-30 border-b border-indigo-900 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-300">
            <div className="flex items-center gap-4 max-w-[60%]">
                <button
                    onClick={() => navigate('/')}
                    className="text-indigo-300 hover:text-white transition-colors bg-white/5 p-2 rounded-xl print:hidden"
                    title="Về trang chủ"
                >
                    <i className="fa-solid fa-chevron-left text-base cursor-pointer"></i>
                </button>
                <h1 className="text-lg font-black tracking-tight line-clamp-1 text-slate-100 print:text-slate-900">
                    {testData.title} <span className="hidden print:inline-block text-sm font-normal text-slate-500"> - Phiếu điểm học viên</span>
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {testData.level && (
                    <span className="hidden lg:inline-block bg-indigo-800/40 text-xs px-3 py-1.5 rounded-lg text-indigo-300 font-bold border border-indigo-700/50 uppercase tracking-wider print:border-slate-300 print:text-slate-700">
                        Target Band {testData.level === '45' ? '4.0 - 5.0' : testData.level === '56' ? '5.0 - 6.0' : testData.level === '78' ? '7.0 - 8.0' : '8.0 - 9.0'}
                    </span>
                )}

                {/* Ẩn đồng hồ đếm giờ khi in ra file PDF */}
                <div className="font-mono bg-slate-900/80 text-amber-400 font-bold px-4 py-1.5 rounded-xl border border-slate-800 text-base shadow-inner flex items-center gap-2 print:hidden">
                    <i className="fa-regular fa-clock text-sm animate-pulse text-amber-500"></i> {formatTime(seconds)}
                </div>

                {isSubmitted && (
                    <div className="flex items-center gap-2">
                        {shareLink && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareLink);
                                    alert("Đã copy link kết quả! Bạn có thể gửi cho giáo viên (Link hết hạn sau 5 ngày).");
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                <i className="fa-solid fa-link"></i> Copy Link Share
                            </button>
                        )}

                        <button
                            onClick={onRetakeTest}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95 print:hidden"
                        >
                            <i className="fa-solid fa-arrow-rotate-left"></i> Làm lại bài
                        </button>
                    </div>
                )}

                <button
                    onClick={onHandleSubmitTest}
                    disabled={isSubmitted || !isAllAnswered}
                    className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 print:hidden ${isSubmitted
                        ? 'hidden' // Ẩn luôn nút nộp bài sau khi đã nộp thành công
                        : isAllAnswered
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none opacity-80'
                        }`}
                >
                    {isAllAnswered ? 'Nộp bài thi' : `Chưa làm đủ (${answeredCount}/${totalCount})`}
                </button>
            </div>
        </header>
    );
});

export default TestingHeader;