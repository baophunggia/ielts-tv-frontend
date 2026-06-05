import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import MatchingHeadings from './MatchingHeadings';
import TrueFalseNotGiven from './TrueFalseNotGiven';
import MultipleChoice from './MultipleChoice';
import GapFill from './GapFill';
import TestingHeader from './TestingHeader.jsx';
import TestingBody from './TestingBody.jsx';
import { formatTime } from './../../utils/timeUtils.js';

// ==========================================
// MÀN HÌNH THI CHÍNH
// ==========================================
const TestScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  // State quản lý việc kéo thả chiều rộng màn hình (Resizable)
  const [splitWidth, setSplitWidth] = useState(50); // Tỉ lệ phần trăm (%) vùng bên trái bài đọc
  const [isResizing, setIsResizing] = useState(false);

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [seconds, setSeconds] = useState(0);

  // Bộ đếm thời gian
  useEffect(() => {
    let timerInterval = null;
    if (!isSubmitted && !loading && testData) {
      timerInterval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isSubmitted, loading, testData]);

  // Handler phục vụ kéo thả thanh chia đôi màn hình (SỬA LỖI GIỚI HẠN TỐI ĐA 70%)
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const minWidthPercent = 25;
      const maxWidthPercent = 70; // Giới hạn kéo tối đa 70% để bên phải không bị vỡ layout
      let newLeftWidth = (e.clientX / document.body.clientWidth) * 100;

      if (newLeftWidth < minWidthPercent) newLeftWidth = minWidthPercent;
      if (newLeftWidth > maxWidthPercent) newLeftWidth = maxWidthPercent;

      setSplitWidth(newLeftWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitTest = useCallback(() => {
    if (isSubmitted) return;

    if (!testData || !testData.questions_json) {
      console.warn("testData chưa sẵn sàng để chấm bài");
      return;
    }

    const confirmSubmit = window.confirm("Bạn có chắc chắn muốn nộp bài thi này để chấm điểm không?");
    if (!confirmSubmit) return;

    let correctCount = 0;
    let totalCount = 0;

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
  }, [testData, answers, isSubmitted, setScore, setIsSubmitted]);

  const handleRetakeTest = useCallback(() => {
    const confirmRetake = window.confirm("Bạn có muốn làm lại bài thi này không? Toàn bộ kết quả cũ sẽ bị xóa bỏ.");
    if (!confirmRetake) return;

    setAnswers({});
    setIsSubmitted(false);
    setScore({ correct: 0, total: 0 });
    setSeconds(0);
  }, []);

  const handleMouseUpHighlight = useCallback(() => {
    const selection = window.getSelection();
    // Bỏ qua nếu click chuột mà không bôi đen chữ nào
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') return;

    const range = selection.getRangeAt(0);

    // Kiểm tra xem vùng chọn có nằm trọn vẹn trong vùng bài đọc không
    if (contentRef.current && !contentRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Tạo thẻ mark với màu nền vàng truyền thống, chữ tối màu dễ đọc
    const markNode = document.createElement('mark');
    markNode.className = 'bg-yellow-200 text-slate-900 cursor-pointer rounded px-0.5 transition-colors duration-200 hover:bg-yellow-300';
    markNode.title = "Click để xóa highlight này";

    // Xử lý sự kiện click để xóa highlight
    markNode.onclick = function (e) {
      e.stopPropagation();
      const parent = this.parentNode;
      while (this.firstChild) {
        parent.insertBefore(this.firstChild, this);
      }
      parent.removeChild(this);
    };

    try {
      // Cách 1: Áp dụng khi bôi đen trong phạm vi 1 thẻ (an toàn nhất)
      range.surroundContents(markNode);
    } catch (e) {
      // Cách 2: Fallback khi bôi đen vắt ngang qua nhiều đoạn văn hoặc thẻ in đậm
      try {
        const fragment = range.extractContents();
        markNode.appendChild(fragment);
        range.insertNode(markNode);
      } catch (err) {
        console.warn("Vùng bôi đen chéo cấu trúc quá phức tạp.", err);
      }
    }

    // Bỏ vệt bôi đen mặc định của trình duyệt đi để nhìn cho rõ màu vàng
    selection.removeAllRanges();
  }, []);

  // Điều hướng nhanh đến câu hỏi bên cột phải
  const scrollToQuestion = (displayNum) => {
    const el = document.getElementById(`q-${displayNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2'), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-sm text-slate-500 font-semibold tracking-wide">Đang đồng bộ phòng thi ảo...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-3">
        <p className="text-lg text-rose-600 font-bold">Dữ liệu bài thi không khả dụng!</p>
        <button onClick={() => navigate('/')} className="text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition">Quay lại trang chủ</button>
      </div>
    );
  }

  // Thu thập danh sách toàn bộ số câu hỏi để dựng Panel định vị nhanh
  const allDisplayNumbers = [];
  testData.questions_json.forEach(g => {
    g.questions.forEach(q => {
      allDisplayNumbers.push({ num: q.displayNumber, id: q.id });
    });
  });

  // Đếm số lượng câu đã được trả lời (bỏ qua khoảng trắng)
  const answeredCount = Object.values(answers).filter(val => val && val.toString().trim() !== '').length;
  const totalCount = allDisplayNumbers.length;

  // Xác định cờ: Đã làm đủ tất cả các câu hay chưa?
  const isAllAnswered = totalCount > 0 && answeredCount === totalCount;

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden antialiased">
      <TestingHeader
        testData={testData}
        isSubmitted={isSubmitted}
        onHandleSubmitTest={handleSubmitTest}
        onRetakeTest={handleRetakeTest}
        seconds={seconds}
        isAllAnswered={isAllAnswered}
        answeredCount={answeredCount}
        totalCount={totalCount}
      />
      <TestingBody
        isResizing={isResizing}
        splitWidth={splitWidth}
        testData={testData}
        contentRef={contentRef}
        onHandleMouseUpHighlight={handleMouseUpHighlight}
        onHandleAnswerChange={handleAnswerChange}
        startResizing={startResizing}
        isSubmitted={isSubmitted}
        seconds={seconds}
        score={score}
        allDisplayNumbers={allDisplayNumbers}
        answers={answers} />
    </div>
  );
};

export default TestScreen;