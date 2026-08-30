import React from 'react';
import { formatTime } from '../../utils/timeUtils.js';
import TestingBodyRenderQuestion from './TestingBodyRenderQuestion.jsx';
import TestingPassage from './TestingPassage.jsx';
import { useIsDesktop, useIsTouchDevice } from '../../utils/responsive.js';

// ==========================================================
// RESPONSIVE MOBILE: thay vì chia đôi màn hình (bài đọc | câu hỏi) như desktop,
// dưới breakpoint "md" chuyển sang mô hình TAB — chỉ hiện 1 panel tại 1 thời
// điểm (mặc định "Bài đọc" trước theo yêu cầu), và bảng điều hướng câu hỏi
// (trước đây là sidebar cố định 192px bên phải) chuyển thành 1 thanh cuộn
// ngang dính ở đáy màn hình.
//
// QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG: panel bài đọc và panel câu hỏi luôn được
// MOUNT SẴN trong DOM (không unmount/remount theo tab), chỉ ẩn/hiện bằng class
// CSS `hidden`/`flex`. Điều này giúp: (1) chỉ có DUY NHẤT 1 bản TestingPassage
// -> không bị nhân đôi ref/state highlight; (2) bấm số câu hỏi ở thanh điều
// hướng mobile vẫn scrollIntoView được ngay cả khi trước đó đang ở tab khác,
// vì phần tử đã tồn tại sẵn trong DOM, không cần chờ mount.
// ==========================================================
const TestingBody = React.memo(({
    isResizing,
    splitWidth,
    testData,
    onHandleAnswerChange,
    startResizing,
    isSubmitted, seconds, score, allDisplayNumbers, answers, onScrollToQuestion,
    passageRef, highlightCount, onHighlightCountChange, onClearAllHighlights, disableHighlight,
    activeMobileTab = 'passage', onChangeMobileTab
}) => {
    const isDesktop = useIsDesktop();
    const isTouchDevice = useIsTouchDevice();

    // FIX MOBILE: style width bằng % (dùng cho layout chia đôi màn hình) CHỈ áp
    // dụng khi ở desktop. Style inline có độ ưu tiên cao hơn mọi class Tailwind,
    // nên nếu vẫn áp width% trên mobile sẽ đè lên class w-full và làm vỡ layout
    // tab (panel bị co lại theo đúng % thay vì chiếm trọn màn hình).
    const passageWidthStyle = isDesktop ? { width: `${splitWidth}%` } : undefined;
    const questionsWidthStyle = isDesktop ? { width: `${100 - splitWidth}%` } : undefined;

    const answeredSet = (item) => {
        const val = answers[item.id];
        return item.groupType === 'multiple_choice_multi'
            ? Array.isArray(val) && val.length >= (item.requiredCount || 1)
            : !!val?.toString().trim();
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden relative print:[color-adjust:exact] print:block print:overflow-visible">

            {/* ============ TAB SWITCHER — CHỈ HIỂN THỊ TRÊN MOBILE ============ */}
            {!isDesktop && (
                <div className="md:hidden flex shrink-0 bg-white border-b border-slate-200 shadow-sm z-20 print:hidden">
                    <button
                        type="button"
                        onClick={() => onChangeMobileTab && onChangeMobileTab('passage')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeMobileTab === 'passage'
                            ? 'text-[#1e40a1] border-b-2 border-[#1e40a1] bg-[#eef2fc]/50'
                            : 'text-slate-400 border-b-2 border-transparent'
                            }`}
                    >
                        <i className="fa-solid fa-book-open"></i> Bài đọc
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeMobileTab && onChangeMobileTab('questions')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeMobileTab === 'questions'
                            ? 'text-[#1e40a1] border-b-2 border-[#1e40a1] bg-[#eef2fc]/50'
                            : 'text-slate-400 border-b-2 border-transparent'
                            }`}
                    >
                        <i className="fa-solid fa-list-check"></i> Câu hỏi
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative" style={{ cursor: isResizing ? 'col-resize' : 'default' }}>

                {/* CỘT TRÁI: ĐOẠN VĂN READING PASSAGE */}
                {/* Mobile: full width, chỉ hiện khi activeMobileTab === 'passage'. Desktop: luôn hiện, rộng theo % kéo thả. */}
                <div
                    className={`h-full bg-white border-r border-slate-200 shadow-sm relative flex-col print:flex print:hidden md:flex md:w-auto w-full ${activeMobileTab === 'passage' ? 'flex' : 'hidden'
                        }`}
                    style={passageWidthStyle}
                >
                    <div className="bg-amber-50/80 border-b border-amber-100 text-amber-800 text-[11px] font-semibold px-4 py-2 flex items-center justify-between gap-2 shrink-0 select-none shadow-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <i className="fa-solid fa-marker text-amber-600 shrink-0"></i>
                            <span className="truncate">
                                {disableHighlight
                                    ? 'Chế độ xem kết quả: đáp án đúng/sai đã được tô màu sẵn trong phiếu trả lời bên phải.'
                                    : isTouchDevice
                                        // FIX MOBILE HIGHLIGHT: hướng dẫn đúng thao tác cảm ứng (chọn xong rồi bấm nút xác nhận),
                                        // khác với hướng dẫn cho chuột (bôi đen là highlight ngay).
                                        ? 'Chạm giữ để chọn từ, sau đó bấm nút "Đánh dấu" hiện ra để tô màu. Chạm vào vùng đã tô để xoá.'
                                        : 'Mẹo phòng thi: Bôi đen text để đánh dấu (Highlight). Click trực tiếp vào vùng Highlight để xóa bỏ.'}
                            </span>
                        </div>
                        {!disableHighlight && (
                            <button
                                type="button"
                                onClick={onClearAllHighlights}
                                disabled={!highlightCount}
                                title="Xoá toàn bộ vùng đã bôi đen trong bài đọc"
                                className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                            >
                                <i className="fa-solid fa-eraser"></i>
                                <span className="hidden sm:inline">Xoá tất cả</span>{highlightCount ? ` (${highlightCount})` : ''}
                            </button>
                        )}
                    </div>

                    <TestingPassage
                        ref={passageRef}
                        passageHtml={testData.passage_html.replace(/&nbsp;/g, ' ')}
                        disabled={disableHighlight}
                        onHighlightCountChange={onHighlightCountChange}
                    />
                </div>

                {/* ĐƯỜNG KÉO BAR — CHỈ CÓ Ý NGHĨA Ở DESKTOP (chia đôi màn hình) */}
                <div
                    className={`hidden md:flex w-1.5 h-full cursor-col-resize shrink-0 transition-colors z-20 relative items-center justify-center print:hidden ${isResizing ? 'bg-[#1e40a1]' : 'bg-slate-300 hover:bg-[#1e40a1]/60'
                        }`}
                    onMouseDown={startResizing}
                >
                    <div className="absolute w-4 h-8 bg-white border border-slate-300 rounded-md shadow-sm flex items-center justify-center gap-0.5 select-none pointer-events-none">
                        <div className="w-[1px] h-3 bg-slate-400"></div>
                        <div className="w-[1px] h-3 bg-slate-400"></div>
                    </div>
                </div>

                {/* CỘT PHẢI: CÂU HỎI + MINIMAP (desktop) */}
                {/* Mobile: full width, chỉ hiện khi activeMobileTab === 'questions'. */}
                <div
                    className={`h-full bg-[#f8fafc] flex-col md:flex-row overflow-hidden print:w-full print:h-auto print:bg-white print:overflow-visible print:flex print:hidden md:flex w-full ${activeMobileTab === 'questions' ? 'flex' : 'hidden'
                        }`}
                    style={questionsWidthStyle}
                >
                    {/* Form câu hỏi chính */}
                    <div
                        className={`flex-1 h-full overflow-y-auto px-5 md:px-8 py-6 md:py-10 print:px-0 print:py-4 print:overflow-visible ${
                            // Chừa khoảng trống phía dưới trên mobile để thanh điều hướng dính đáy
                            // không đè lên câu hỏi cuối cùng.
                            !isDesktop ? 'pb-24' : ''
                            }`}
                    >
                        {isSubmitted && (
                            <div className="mb-6 p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row gap-4 justify-between sm:items-center border border-emerald-400/20 print:bg-emerald-50 print:text-slate-800 print:border-slate-300 print:shadow-none">
                                <div>
                                    <h4 className="text-lg font-black mb-0.5 flex items-center gap-2 print:text-emerald-900">
                                        <i className="fa-solid fa-square-poll-vertical text-xl"></i> Kết quả thi trực tuyến
                                    </h4>
                                    <p className="text-xs text-emerald-100/90 font-medium print:text-slate-600">
                                        Thời gian làm bài: <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded font-bold ml-0.5 print:bg-slate-200 print:text-slate-800">{formatTime(seconds)}</span>
                                    </p>
                                </div>
                                <div className="text-center bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-inner print:bg-emerald-100 print:border-emerald-200 self-start sm:self-auto">
                                    <span className="text-3xl font-black tracking-tight print:text-emerald-900">{score.correct}</span>
                                    <span className="text-sm mx-1 text-emerald-200 print:text-slate-400">/</span>
                                    <span className="text-sm text-emerald-200 font-bold print:text-slate-600">{score.total}</span>
                                    <p className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold mt-0.5 print:text-emerald-800">Câu trả lời đúng</p>
                                </div>
                            </div>
                        )}

                        <h2 className="text-xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2 print:text-slate-900">
                            <i className="fa-solid fa-file-signature text-[#1e40a1] print:hidden"></i> Phiếu trả lời chi tiết
                        </h2>

                        <TestingBodyRenderQuestion
                            testData={testData}
                            answers={answers}
                            onHandleAnswerChange={onHandleAnswerChange}
                            isSubmitted={isSubmitted}
                        />
                    </div>

                    {/* BẢNG ĐỊNH VỊ MINI-MAP — CHỈ HIỂN THỊ TỪ DESKTOP TRỞ LÊN.
                        Trên mobile được thay bằng thanh điều hướng dính đáy màn hình bên dưới. */}
                    <div className="hidden md:flex w-48 h-full bg-white border-l border-slate-200 p-4 flex-col justify-between shrink-0 select-none print:hidden">
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1">
                                <i className="fa-solid fa-grip text-[10px]"></i> Điều hướng
                            </p>
                            <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[70vh] pr-1">
                                {allDisplayNumbers.map((item) => {
                                    const hasAnswer = answeredSet(item);
                                    return (
                                        <button
                                            key={item.num}
                                            type="button"
                                            onClick={() => onScrollToQuestion && onScrollToQuestion(item.num)}
                                            className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSubmitted
                                                ? 'border border-slate-200 bg-slate-50 text-slate-600'
                                                : hasAnswer
                                                    ? 'bg-[#1e40a1] text-white shadow-sm shadow-[#1e40a1]/20'
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
                                <span className="w-3 h-3 bg-[#1e40a1] rounded-md"></span>
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

            {/* ============ THANH ĐIỀU HƯỚNG DÍNH ĐÁY — CHỈ MOBILE ============ */}
            {/* TÍNH NĂNG MỚI: thay thế bảng điều hướng sidebar 192px (không đủ chỗ trên
                mobile) bằng 1 thanh cuộn ngang dính ở đáy màn hình, luôn thấy được số câu. */}
            {!isDesktop && (
                <div className="md:hidden shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-20 print:hidden">
                    <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2.5 scrollbar-hide">
                        {allDisplayNumbers.map((item) => {
                            const hasAnswer = answeredSet(item);
                            return (
                                <button
                                    key={item.num}
                                    type="button"
                                    onClick={() => onScrollToQuestion && onScrollToQuestion(item.num)}
                                    className={`shrink-0 w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSubmitted
                                        ? 'border border-slate-200 bg-slate-50 text-slate-600'
                                        : hasAnswer
                                            ? 'bg-[#1e40a1] text-white shadow-sm shadow-[#1e40a1]/20'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    {item.num}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

export default TestingBody;
