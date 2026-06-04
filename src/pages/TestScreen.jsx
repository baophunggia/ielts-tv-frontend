import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

// ==========================================
// COMPONENT CÁC DẠNG CÂU HỎI (ĐÃ THÊM LOGIC CHẤM ĐIỂM)
// ==========================================
const MatchingHeadings = ({ group, answers, onAnswerChange, isSubmitted }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
            <p className="font-semibold mb-2">List of Headings</p>
            <ul className="space-y-1">
                {group.options?.map((opt, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{opt}</li>
                ))}
            </ul>
        </div>
        <div className="space-y-3">
            {group.questions.map(q => {
                const isCorrect = answers[q.id]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
                return (
                    <div key={q.id} className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-3">
                            <span className="font-medium w-16">Question {q.displayNumber}:</span>
                            <input
                                type="text"
                                disabled={isSubmitted}
                                value={answers[q.id] || ''}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                className={`border rounded px-3 py-1 w-24 focus:outline-none uppercase text-center font-semibold ${isSubmitted
                                        ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700')
                                        : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                                    }`}
                                placeholder="..."
                            />
                            {isSubmitted && !isCorrect && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <i className="fa-solid fa-check mr-1"></i>Key: {q.answer}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const TrueFalseNotGiven = ({ group, answers, onAnswerChange, isSubmitted }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="space-y-4">
            {group.questions.map((q) => {
                const isCorrect = answers[q.id] === q.answer;
                return (
                    <div key={q.id} className="flex flex-col space-y-2 p-2 rounded-lg transition ${isSubmitted ? (isCorrect ? 'bg-green-50/50' : 'bg-red-50/50') : ''}">
                        <p className="text-gray-800 flex items-start">
                            <span className="font-bold mr-2">{q.displayNumber}.</span>
                            <span className="flex-1">{q.text}</span>
                        </p>
                        <div className="flex items-center gap-6 ml-6">
                            <div className="flex space-x-4">
                                {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                                    <label key={opt} className={`flex items-center space-x-1 cursor-pointer ${isSubmitted ? 'pointer-events-none' : ''}`}>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            disabled={isSubmitted}
                                            checked={answers[q.id] === opt}
                                            onChange={() => onAnswerChange(q.id, opt)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className={`text-sm ${isSubmitted && answers[q.id] === opt ? 'font-bold' : 'text-gray-700'}`}>{opt}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Hiển thị đáp án đúng bên cạnh nếu làm sai */}
                            {isSubmitted && !isCorrect && (
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                                    <i className="fa-solid fa-circle-check"></i> Đáp án: {q.answer}
                                </span>
                            )}
                            {isSubmitted && isCorrect && (
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Chính xác</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const MultipleChoice = ({ group, answers, onAnswerChange, isSubmitted }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="space-y-4">
            {group.questions.map(q => {
                const isCorrect = answers[q.id] === q.answer;
                return (
                    <div key={q.id} className={`p-2 rounded-lg ${isSubmitted ? (isCorrect ? 'bg-green-50/50' : 'bg-red-50/50') : ''}`}>
                        <p className="font-medium text-gray-800 mb-2"><span className="font-bold mr-2">{q.displayNumber}.</span> {q.text}</p>
                        <div className="space-y-2 ml-6">
                            {q.options?.map((opt, idx) => {
                                const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
                                return (
                                    <label key={idx} className={`flex items-center space-x-2 cursor-pointer p-1.5 rounded transition ${isSubmitted ? 'pointer-events-none' : 'hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            disabled={isSubmitted}
                                            checked={answers[q.id] === optionLetter}
                                            onChange={() => onAnswerChange(q.id, optionLetter)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className={`text-gray-700 ${isSubmitted && q.answer === optionLetter ? 'text-green-600 font-bold' : ''}`}>
                                            <span className="font-semibold mr-1">{optionLetter}.</span> {opt}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        {isSubmitted && !isCorrect && (
                            <p className="text-xs font-bold text-green-600 ml-6 mt-1"><i className="fa-solid fa-circle-check"></i> Đáp án đúng phải là: {q.answer}</p>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

const GapFill = ({ group, answers, onAnswerChange, isSubmitted }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="space-y-4">
            {group.questions.map(q => {
                const parts = q.text.split(/\[GAP\]|_{3,}/);
                const isCorrect = answers[q.id]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();

                return (
                    <div key={q.id} className="text-gray-800 leading-loose flex flex-wrap items-center bg-white p-2 rounded border border-gray-50">
                        <span className="font-bold mr-2">{q.displayNumber}.</span>
                        <span>{parts[0]}</span>

                        <input
                            type="text"
                            disabled={isSubmitted}
                            value={answers[q.id] || ''}
                            onChange={(e) => onAnswerChange(q.id, e.target.value)}
                            className={`border-b-2 mx-2 w-36 px-2 focus:outline-none bg-transparent text-center font-semibold text-sm transition-all ${isSubmitted
                                    ? (isCorrect ? 'border-green-500 text-green-600 font-bold bg-green-50/50' : 'border-red-500 text-red-600 font-bold bg-red-50/50')
                                    : 'border-gray-400 focus:border-indigo-600'
                                }`}
                            placeholder="Gõ đáp án..."
                        />

                        {parts.length > 1 && <span>{parts[1]}</span>}

                        {/* Hiện key nếu học viên điền sai */}
                        {isSubmitted && !isCorrect && (
                            <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded ml-2">
                                <i className="fa-solid fa-lightbulb"></i> Đáp án đúng: {q.answer}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

// ==========================================
// MÀN HÌNH THI CHÍNH
// ==========================================
const TestScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);

    // CÁC STATE QUẢN LÝ ĐÁP ÁN & ĐIỂM SỐ
    const [answers, setAnswers] = useState({}); // Lưu câu trả lời dưới dạng: { q_id: 'đáp án' }
    const [isSubmitted, setIsSubmitted] = useState(false); // Trạng thái đã nộp bài chưa
    const [score, setScore] = useState({ correct: 0, total: 0 }); // Lưu điểm số

    useEffect(() => {
        if (id) fetchTestFromDatabase(id);
    }, [id]);

    const fetchTestFromDatabase = async (testId) => {
        try {
            const { data, error } = await supabase
                .from('reading_tests')
                .select('*')
                .eq('id', testId)
                .single();

            if (error) throw error;

            let currentQuestionNumber = 1;
            const processedQuestions = data.questions_json.map(group => {
                const newGroup = { ...group };
                newGroup.questions = group.questions.map(q => {
                    const newQ = { ...q, displayNumber: currentQuestionNumber };
                    currentQuestionNumber++;
                    return newQ;
                });
                return newGroup;
            });

            data.questions_json = processedQuestions;
            setTestData(data);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu bài thi:', error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm lắng nghe thay đổi ô nhập liệu / radio của học viên
    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    // Logic nộp bài và đối chiếu đáp án tự động
    const handleSubmitTest = () => {
        if (isSubmitted) return;

        const confirmSubmit = window.confirm("Bạn có chắc chắn muốn nộp bài thi này để chấm điểm không?");
        if (!confirmSubmit) return;

        let correctCount = 0;
        let totalCount = 0;

        // Duyệt qua toàn bộ câu hỏi trong DB để tính điểm
        testData.questions_json.forEach(group => {
            group.questions.forEach(q => {
                totalCount++;
                const studentAns = (answers[q.id] || '').trim().toLowerCase();
                const correctAns = (q.answer || '').trim().toLowerCase();

                if (studentAns === correctAns && correctAns !== '') {
                    correctCount++;
                }
            });
        });

        setScore({ correct: correctCount, total: totalCount });
        setIsSubmitted(true);

        // Tự động cuộn phần câu hỏi lên đầu trang để nhìn bảng điểm
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection.isCollapsed || selection.toString().trim() === '') return;

        const range = selection.getRangeAt(0);
        const markNode = document.createElement('mark');
        markNode.className = 'bg-yellow-200 cursor-pointer rounded px-0.5 transition hover:bg-red-200 group relative';
        markNode.title = "Click để xóa highlight";

        markNode.onclick = function () {
            const parent = this.parentNode;
            while (this.firstChild) {
                parent.insertBefore(this.firstChild, this);
            }
            parent.removeChild(this);
        };

        try {
            range.surroundContents(markNode);
        } catch (e) {
            console.warn("Không thể highlight khi bôi đen chéo qua các đoạn văn.", e);
        }
        selection.removeAllRanges();
    };

    const renderQuestionGroup = (group) => {
        const props = { group, answers, onAnswerChange: handleAnswerChange, isSubmitted };
        switch (group.type) {
            case 'matching_headings': return <MatchingHeadings key={group.id} {...props} />;
            case 'true_false_not_given': return <TrueFalseNotGiven key={group.id} {...props} />;
            case 'multiple_choice': return <MultipleChoice key={group.id} {...props} />;
            case 'gap_fill': return <GapFill key={group.id} {...props} />;
            default: return <div key={group.id}>Unknown question type</div>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                    <p className="text-lg text-gray-700 font-medium">Đang tải đề thi...</p>
                </div>
            </div>
        );
    }

    if (!testData) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 flex-col gap-4">
                <p className="text-xl text-red-600 font-semibold">Bài thi không tồn tại!</p>
                <button onClick={() => navigate('/')} className="text-indigo-600 underline hover:text-indigo-800 font-medium">Quay lại danh sách</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            <header className="bg-indigo-900 text-white p-4 shadow-md flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-indigo-200 hover:text-white transition" title="Về trang chủ">
                        <i className="fa-solid fa-arrow-left text-xl cursor-pointer"></i>
                    </button>
                    <h1 className="text-xl font-bold line-clamp-1">{testData.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {testData.level && (
                        <span className="hidden md:inline-block bg-indigo-800 px-3 py-1 rounded text-indigo-100 font-medium border border-indigo-700">
                            Band {testData.level === '45' ? '4.0 - 5.0' : testData.level === '56' ? '5.0 - 6.0' : testData.level === '78' ? '7.0 - 8.0' : '8.0 - 9.0'}
                        </span>
                    )}
                    <span><i className="fa-regular fa-clock mr-1"></i> 60:00</span>

                    <button
                        onClick={handleSubmitTest}
                        disabled={isSubmitted}
                        className={`px-4 py-2 rounded font-semibold transition ${isSubmitted ? 'bg-gray-500 text-gray-200 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                    >
                        {isSubmitted ? 'Đã nộp bài' : 'Nộp bài'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 h-full bg-white border-r border-gray-300 relative">
                    <div className="absolute top-0 left-0 w-full bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs px-4 py-2 text-center z-10 shadow-sm">
                        <i className="fa-solid fa-lightbulb mr-1"></i> Mẹo: Dùng chuột bôi đen đoạn văn để highlight. Click vào đoạn đã bôi đen để xóa.
                    </div>

                    <div
                        className="h-full overflow-y-auto pl-8 pr-12 py-12 text-left leading-loose text-gray-800 reading-content selection:bg-indigo-100 selection:text-indigo-900"
                        ref={contentRef}
                        onMouseUp={handleMouseUp}
                        dangerouslySetInnerHTML={{ __html: testData.passage_html.replace(/&nbsp;/g, ' ') }}
                    />
                </div>

                {/* BÊN PHẢI: BỘ CÂU HỎI & KẾT QUẢ CHẤM ĐIỂM */}
                <div className="w-1/2 h-full bg-slate-50 overflow-y-auto p-8">
                    {/* HIỂN THỊ BẢNG ĐIỂM NẾU ĐÃ SUBMIT */}
                    {isSubmitted && (
                        <div className="mb-6 p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-md flex justify-between items-center animate-fade-in">
                            <div>
                                <h4 className="text-xl font-bold mb-1"><i className="fa-solid fa-square-poll-vertical mr-2"></i>Kết quả làm bài</h4>
                                <p className="text-sm text-green-100">Hệ thống đã tự động đối chiếu với đáp án chuẩn.</p>
                            </div>
                            <div className="text-center bg-white/20 px-5 py-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                <span className="text-3xl font-extrabold">{score.correct}</span>
                                <span className="text-lg mx-1">/</span>
                                <span className="text-lg">{score.total}</span>
                                <p className="text-[10px] uppercase tracking-wider text-green-100 mt-1">Số câu đúng</p>
                            </div>
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Bộ câu hỏi</h2>
                    {testData.questions_json.map(group => renderQuestionGroup(group))}
                </div>
            </div>
        </div>
    );
};

export default TestScreen;