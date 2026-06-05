import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import TestingHeader from './TestingHeader.jsx';
import TestingBody from './TestingBody.jsx';

const ShareResultScreen = () => {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [testData, setTestData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [seconds, setSeconds] = useState(0);
    const [splitWidth, setSplitWidth] = useState(50);

    // Thu thập danh sách ID câu hỏi để điều hướng
    const [allDisplayNumbers, setAllDisplayNumbers] = useState([]);

    useEffect(() => {
        if (resultId) fetchResultData(resultId);
    }, [resultId]);

    const fetchResultData = async (id) => {
        try {
            // 1. Lấy dữ liệu kết quả học viên đã làm
            const { data: resultData, error: resultError } = await supabase
                .from('test_results')
                .select('*')
                .eq('id', id)
                .single();

            if (resultError || !resultData) throw new Error('Không tìm thấy kết quả!');

            // THUẬT TOÁN HẾT HẠN (5 NGÀY)
            const createdAt = new Date(resultData.created_at);
            const now = new Date();
            const diffTime = Math.abs(now - createdAt);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 5) {
                setIsExpired(true);
                setLoading(false);
                return;
            }

            // 2. Lấy dữ liệu bài thi gốc để render giao diện
            const { data: testDataObj, error: testError } = await supabase
                .from('reading_tests')
                .select('*')
                .eq('id', resultData.test_id)
                .single();

            if (testError) throw testError;

            // Xử lý lại cấu trúc câu hỏi
            let currentQuestionNumber = 1;
            const displayNums = [];
            const processedQuestions = testDataObj.questions_json.map(group => {
                const newGroup = { ...group };
                newGroup.questions = group.questions.map(q => {
                    displayNums.push({ num: currentQuestionNumber, id: q.id });
                    const newQ = { ...q, displayNumber: currentQuestionNumber };
                    currentQuestionNumber++;
                    return newQ;
                });
                return newGroup;
            });

            testDataObj.questions_json = processedQuestions;

            // Nạp dữ liệu vào state
            setTestData(testDataObj);
            setAnswers(resultData.student_answers);
            setScore({ correct: resultData.score_correct, total: resultData.score_total });
            setSeconds(resultData.time_taken);
            setAllDisplayNumbers(displayNums);

        } catch (error) {
            console.error('Lỗi khi tải kết quả:', error);
            setIsExpired(true); // Hiển thị lỗi chung nếu link sai hoặc bị xóa
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                    <p className="text-sm text-slate-500 font-semibold tracking-wide">Đang tải phiếu kết quả...</p>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4">
                <i className="fa-solid fa-link-slash text-6xl text-slate-300"></i>
                <h2 className="text-2xl text-slate-800 font-bold">Liên kết không khả dụng</h2>
                <p className="text-slate-500 max-w-md text-center">Phiếu kết quả này không tồn tại hoặc đã hết hạn lưu trữ sau 5 ngày theo quy định bảo mật hệ thống.</p>
                <button onClick={() => navigate('/')} className="mt-2 text-sm bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition">Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden antialiased">
            <header className="bg-slate-900 text-white px-5 py-3.5 shadow-md flex justify-between items-center shrink-0 z-30 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                        <i className="fa-solid fa-eye text-emerald-400"></i>
                        {testData.title} <span className="font-normal text-slate-400 text-sm ml-2">- Chế độ xem kết quả</span>
                    </h1>
                </div>
                <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                    Thoát
                </button>
            </header>

            <TestingBody
                isResizing={false}
                splitWidth={splitWidth}
                testData={testData}
                contentRef={contentRef}
                onHandleMouseUpHighlight={() => { }} // Vô hiệu hóa highlight
                onHandleAnswerChange={() => { }} // Vô hiệu hóa thay đổi đáp án
                startResizing={() => { }} // Khóa thanh kéo
                isSubmitted={true} // Bật chế độ đã nộp bài (hiện đáp án xanh/đỏ)
                seconds={seconds}
                score={score}
                allDisplayNumbers={allDisplayNumbers}
                answers={answers}
            />
        </div>
    );
};

export default ShareResultScreen;