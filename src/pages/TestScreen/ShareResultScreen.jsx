import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import TestingHeader from './TestingHeader.jsx';
import TestingBody from './TestingBody.jsx';

import { BRAND_FONT } from '../../theme/brand.js';

const ShareResultScreen = () => {
    const { resultId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [testData, setTestData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [seconds, setSeconds] = useState(0);
    const [splitWidth, setSplitWidth] = useState(50);
    // TÍNH NĂNG MỚI: tab mobile — trang xem kết quả cũng dùng chung TestingBody
    // nên cần state này để layout mobile hoạt động nhất quán.
    const [activeMobileTab, setActiveMobileTab] = useState('passage');

    // Thu thập danh sách ID câu hỏi để điều hướng
    const [allDisplayNumbers, setAllDisplayNumbers] = useState([]);

    // Điều hướng nhanh đến câu hỏi — đồng bộ cách làm với TestScreen.jsx để
    // thanh điều hướng mobile (bottom bar) hoạt động nhất quán ở cả 2 trang.
    const scrollToQuestion = (displayNum) => {
        setActiveMobileTab('questions');
        requestAnimationFrame(() => {
            const el = document.getElementById(`q-${displayNum}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-[#1e40a1]', 'ring-offset-2');
                setTimeout(() => el.classList.remove('ring-2', 'ring-[#1e40a1]', 'ring-offset-2'), 2000);
            }
        });
    };

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
            <div className="flex h-screen items-center justify-center bg-[#fff8e1]" style={BRAND_FONT}>
                <div className="flex flex-col items-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-[#1e40a1] mb-4"></i>
                    <p className="text-sm text-slate-500 font-semibold tracking-wide">Đang tải phiếu kết quả...</p>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fff8e1] flex-col gap-4" style={BRAND_FONT}>
                <i className="fa-solid fa-link-slash text-6xl text-slate-300"></i>
                <h2 className="text-2xl text-slate-800 font-bold">Liên kết không khả dụng</h2>
                <p className="text-slate-500 max-w-md text-center">Phiếu kết quả này không tồn tại hoặc đã hết hạn lưu trữ sau 5 ngày theo quy định bảo mật hệ thống.</p>
                <button onClick={() => navigate('/tests')} className="mt-2 text-sm bg-[#1e40a1] text-white font-bold px-6 py-2.5 rounded-full shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">Xem danh sách đề thi</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden antialiased" style={BRAND_FONT}>
            <header className="bg-[#36517e] text-white px-5 py-3.5 shadow-md flex justify-between items-center shrink-0 z-30 border-b border-[#2a4365]">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                        <i className="fa-solid fa-eye text-[#ffca28]"></i>
                        {testData.title} <span className="font-normal text-slate-300 text-sm ml-2">- Chế độ xem kết quả</span>
                    </h1>
                </div>
                <button onClick={() => navigate('/tests')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                    Thoát
                </button>
            </header>

            <TestingBody
                isResizing={false}
                splitWidth={splitWidth}
                testData={testData}
                onHandleAnswerChange={() => { }} // Vô hiệu hóa thay đổi đáp án
                startResizing={() => { }} // Khóa thanh kéo
                isSubmitted={true} // Bật chế độ đã nộp bài (hiện đáp án xanh/đỏ)
                seconds={seconds}
                score={score}
                activeMobileTab={activeMobileTab}
                onChangeMobileTab={setActiveMobileTab}
                onScrollToQuestion={scrollToQuestion}
                allDisplayNumbers={allDisplayNumbers}
                answers={answers}
                disableHighlight={true} // FIX BUG: trước đây prop cũ (onHandleMouseUpHighlight) không có tác dụng gì, highlight vẫn hoạt động dù đây là trang chỉ-xem. Giờ khoá đúng cách.
            />
        </div>
    );
};

export default ShareResultScreen;