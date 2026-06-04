import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

// ==========================================
// COMPONENT CÁC DẠNG CÂU HỎI
// ==========================================
const MatchingHeadings = ({ group }) => (
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
            {group.questions.map(q => (
                <div key={q.id} className="flex items-center space-x-3">
                    <span className="font-medium w-16">{q.displayNumber}:</span>
                    <input type="text" className="border border-gray-300 rounded px-3 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="..." />
                </div>
            ))}
        </div>
    </div>
);

const TrueFalseNotGiven = ({ group }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="space-y-4">
            {group.questions.map((q) => (
                <div key={q.id} className="flex flex-col space-y-2">
                    <p className="text-gray-800"><span className="font-bold mr-2">{q.displayNumber}.</span> {q.text}</p>
                    <div className="flex space-x-4 ml-6">
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                            <label key={opt} className="flex items-center space-x-1 cursor-pointer">
                                <input type="radio" name={q.id} className="text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const MultipleChoice = ({ group }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="space-y-4">
            {group.questions.map(q => (
                <div key={q.id}>
                    <p className="font-medium text-gray-800 mb-2"><span className="font-bold mr-2">{q.displayNumber}.</span> {q.text}</p>
                    <div className="space-y-2 ml-6">
                        {q.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                <input type="radio" name={q.id} className="text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-gray-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const GapFill = ({ group }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-indigo-700">
            Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
        </h3>
        <p className="italic text-gray-600 mb-4">{group.instruction}</p>
        <div className="space-y-4">
            {group.questions.map(q => {
                // Hỗ trợ Admin gõ [GAP] hoặc gõ nhiều dấu ___ (từ 3 dấu trở lên)
                const parts = q.text.split(/\[GAP\]|_{3,}/);

                return (
                    <div key={q.id} className="text-gray-800 leading-loose flex flex-wrap items-center">
                        <span className="font-bold mr-2">{q.displayNumber}.</span>
                        <span>{parts[0]}</span>

                        {/* Nếu có đục lỗ thì hiển thị Input ở giữa, ngược lại đẩy Input ra cuối cùng */}
                        {parts.length > 1 ? (
                            <>
                                <input type="text" className="border-b-2 border-gray-400 mx-2 w-32 px-1 focus:outline-none focus:border-indigo-600 bg-transparent text-center" />
                                <span>{parts[1]}</span>
                            </>
                        ) : (
                            <input type="text" className="border-b-2 border-gray-400 mx-2 w-32 px-1 focus:outline-none focus:border-indigo-600 bg-transparent text-center" />
                        )}
                    </div>
                )
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

            // TIỀN XỬ LÝ: Tự động đánh số thứ tự câu hỏi (1, 2, 3...) trước khi hiển thị
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

            // Ghi đè lại mảng JSON đã đánh số
            data.questions_json = processedQuestions;

            setTestData(data);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu bài thi:', error);
        } finally {
            setLoading(false);
        }
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
        switch (group.type) {
            case 'matching_headings': return <MatchingHeadings key={group.id} group={group} />;
            case 'true_false_not_given': return <TrueFalseNotGiven key={group.id} group={group} />;
            case 'multiple_choice': return <MultipleChoice key={group.id} group={group} />;
            case 'gap_fill': return <GapFill key={group.id} group={group} />;
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
                        <i className="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold line-clamp-1">{testData.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {testData.level && (
                        <span className="hidden md:inline-block bg-indigo-800 px-3 py-1 rounded text-indigo-100 font-medium border border-indigo-700">
                            {testData.level}
                        </span>
                    )}
                    <span><i className="fa-regular fa-clock mr-1"></i> 60:00</span>
                    <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-semibold transition">Submit Test</button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 h-full bg-white border-r border-gray-300 relative">
                    <div className="absolute top-0 left-0 w-full bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs px-4 py-2 text-center z-10 shadow-sm">
                        <i className="fa-solid fa-lightbulb mr-1"></i> Mẹo: Dùng chuột bôi đen đoạn văn để highlight. Click vào đoạn đã bôi đen để xóa.
                    </div>
                    <div
                        className="h-full overflow-y-auto overflow-x-hidden pl-8 pr-12 py-12 text-left leading-loose text-gray-800 reading-content selection:bg-indigo-100 selection:text-indigo-900"
                        ref={contentRef}
                        onMouseUp={handleMouseUp}
                        dangerouslySetInnerHTML={{ __html: testData.passage_html.replace(/&nbsp;/g, ' ') }}
                    />
                </div>
                <div className="w-1/2 h-full bg-slate-50 overflow-y-auto p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Bộ câu hỏi</h2>
                    {testData.questions_json.map(group => renderQuestionGroup(group))}
                </div>
            </div>
        </div>
    );
};

export default TestScreen;