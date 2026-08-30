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
        // ĐỒNG BỘ GIAO DIỆN: nền header dùng đúng màu "heroNavy" (#36517e) trùng với nền Hero
        // của LandingScreen, thay vì indigo-950 mặc định của Tailwind — nối liền cảm giác thương hiệu
        // giữa trang giới thiệu và phòng thi thật, nhưng vẫn giữ tối giản/tập trung, không thêm hoạt tiết.
        <header className="bg-[#36517e] text-white px-3 sm:px-5 py-3 sm:py-3.5 shadow-md flex justify-between items-center shrink-0 z-30 border-b border-[#2a4365] gap-2 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-300">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button
                    onClick={() => navigate('/tests')}
                    className="text-slate-300 hover:text-white transition-colors bg-white/10 p-2 rounded-xl print:hidden shrink-0"
                    title="Quay lại danh sách đề thi"
                >
                    <i className="fa-solid fa-chevron-left text-base cursor-pointer"></i>
                </button>
                <h1 className="text-sm sm:text-lg font-extrabold tracking-tight line-clamp-1 text-slate-100 print:text-slate-900 min-w-0">
                    {testData.title} <span className="hidden print:inline-block text-sm font-normal text-slate-500"> - Phiếu điểm học viên</span>
                </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {testData.level && (
                    <span className="hidden lg:inline-block bg-white/10 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-bold border border-white/20 uppercase tracking-wider print:border-slate-300 print:text-slate-700">
                        Target Band {testData.level === '45' ? '4.0 - 5.0' : testData.level === '56' ? '5.0 - 6.0' : testData.level === '78' ? '7.0 - 8.0' : '8.0 - 9.0'}
                    </span>
                )}

                {/* Ẩn đồng hồ đếm giờ khi in ra file PDF */}
                <div className="font-mono bg-[#1a1b21]/60 text-[#ffca28] font-bold px-2.5 sm:px-4 py-1.5 rounded-xl border border-white/10 text-sm sm:text-base shadow-inner flex items-center gap-1.5 sm:gap-2 print:hidden">
                    <i className="fa-regular fa-clock text-sm animate-pulse"></i> {formatTime(seconds)}
                </div>

                {isSubmitted && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {shareLink && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareLink);
                                    alert("Đã copy link kết quả! Bạn có thể gửi cho giáo viên (Link hết hạn sau 5 ngày).");
                                }}
                                title="Copy Link Share"
                                className="bg-[#1e40a1] hover:bg-[#1a3689] text-white px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                <i className="fa-solid fa-link"></i> <span className="hidden sm:inline">Copy Link Share</span>
                            </button>
                        )}

                        <button
                            onClick={onRetakeTest}
                            title="Làm lại bài"
                            className="bg-[#ffca28] hover:brightness-95 text-[#2d3748] font-bold px-2.5 sm:px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 print:hidden"
                        >
                            <i className="fa-solid fa-arrow-rotate-left"></i> <span className="hidden sm:inline">Làm lại bài</span>
                        </button>
                    </div>
                )}

                <button
                    onClick={onHandleSubmitTest}
                    disabled={isSubmitted || !isAllAnswered}
                    title={isAllAnswered ? 'Nộp bài thi' : `Chưa làm đủ (${answeredCount}/${totalCount})`}
                    className={`px-3 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 print:hidden whitespace-nowrap ${isSubmitted
                        ? 'hidden' // Ẩn luôn nút nộp bài sau khi đã nộp thành công
                        : isAllAnswered
                            ? 'bg-[#4caf50] hover:brightness-95 text-white shadow-md'
                            : 'bg-white/10 text-slate-400 cursor-not-allowed shadow-none opacity-80'
                        }`}
                >
                    {/* Trên mobile rút gọn chữ để không vỡ dòng, vẫn giữ đủ số liệu quan trọng */}
                    <span className="hidden sm:inline">{isAllAnswered ? 'Nộp bài thi' : `Chưa làm đủ (${answeredCount}/${totalCount})`}</span>
                    <span className="sm:hidden">{isAllAnswered ? 'Nộp bài' : `${answeredCount}/${totalCount}`}</span>
                </button>
            </div>
        </header>
    );
});

export default TestingHeader;