import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from './../../utils/timeUtils.js';

const TestingHeader = React.memo(({ testData, isSubmitted, onHandleSubmitTest, onRetakeTest, seconds, isAllAnswered, answeredCount, totalCount }) => {
    const navigate = useNavigate();
    return (
        <header className="bg-indigo-950 text-white px-5 py-3.5 shadow-md flex justify-between items-center shrink-0 z-30 border-b border-indigo-900">
            <div className="flex items-center gap-4 max-w-[60%]">
                <button onClick={() => navigate('/')} className="text-indigo-300 hover:text-white transition-colors bg-white/5 p-2 rounded-xl" title="Về trang chủ">
                    <i className="fa-solid fa-chevron-left text-base cursor-pointer"></i>
                </button>
                <h1 className="text-lg font-black tracking-tight line-clamp-1 text-slate-100">{testData.title}</h1>
            </div>

            <div className="flex items-center gap-3">
                {testData.level && (
                    <span className="hidden lg:inline-block bg-indigo-800/40 text-xs px-3 py-1.5 rounded-lg text-indigo-300 font-bold border border-indigo-700/50 uppercase tracking-wider">
                        Target Band {testData.level === '45' ? '4.0 - 5.0' : testData.level === '56' ? '5.0 - 6.0' : testData.level === '78' ? '7.0 - 8.0' : '8.0 - 9.0'}
                    </span>
                )}

                <div className="font-mono bg-slate-900/80 text-amber-400 font-bold px-4 py-1.5 rounded-xl border border-slate-800 text-base shadow-inner flex items-center gap-2">
                    <i className="fa-regular fa-clock text-sm animate-pulse text-amber-500"></i> {formatTime(seconds)}
                </div>

                {isSubmitted ? (
                    <button
                        onClick={onRetakeTest}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 cursor-pointer font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95"
                    >
                        <i className="fa-solid fa-arrow-rotate-left"></i> Làm lại bài
                    </button>
                ) : isAllAnswered ? (
                    <button
                        onClick={onHandleSubmitTest}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95"
                    >
                        <i className="fa-solid fa-paper-plane"></i> Nộp bài thi
                    </button>
                ) : (
                    <>
                        <i className="fa-solid fa-lock text-[10px]"></i> Trả lời ({answeredCount}/{totalCount})
                    </>
                )}
            </div>
        </header>
    );
});

export default TestingHeader;