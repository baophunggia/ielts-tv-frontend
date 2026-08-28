import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { generateUUID } from '../../utils/uuid.js';
import TestingHeader from './TestingHeader.jsx';
import TestingBody from './TestingBody.jsx';

// ==========================================
// MÀN HÌNH THI CHÍNH
// ==========================================
const TestScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // TÍNH NĂNG MỚI: ref trỏ tới component bài đọc (TestingPassage) để gọi
  // clearAllHighlights() từ nút "Xoá tất cả", + state đếm số lượng highlight
  // hiện có (để disable nút khi chưa bôi đen gì).
  const passagePanelRef = useRef(null);
  const [highlightCount, setHighlightCount] = useState(0);

  // State quản lý việc kéo thả chiều rộng màn hình (Resizable)
  const [splitWidth, setSplitWidth] = useState(50); // Tỉ lệ phần trăm (%) vùng bên trái bài đọc
  const [isResizing, setIsResizing] = useState(false);

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [seconds, setSeconds] = useState(0);
  const [shareLink, setShareLink] = useState('');

  // FIX BUG: Dùng ref (không phải state) làm khoá chống nộp bài trùng lặp (double-submit).
  // State cập nhật bất đồng bộ nên double-click nhanh vẫn có thể lọt qua; ref chặn ngay lập tức.
  const isSubmittingRef = useRef(false);

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

      // FIX BUG: Khôi phục đáp án đã lưu tạm (autosave) nếu học viên lỡ refresh/mất mạng
      // giữa chừng, tránh mất toàn bộ bài đang làm.
      try {
        const savedDraft = localStorage.getItem(`ielts_tv_draft_${testId}`);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          if (parsedDraft && typeof parsedDraft === 'object' && Object.keys(parsedDraft).length > 0) {
            setAnswers(parsedDraft);
          }
        }
      } catch (e) {
        console.warn('Không đọc được dữ liệu nháp đã lưu:', e);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bài thi:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIX BUG: Tự động lưu tạm đáp án vào localStorage mỗi khi thay đổi, theo từng đề thi
  // (giúp học viên không mất bài nếu vô tình đóng tab/mất kết nối trước khi nộp)
  useEffect(() => {
    if (!id || isSubmitted) return;
    try {
      localStorage.setItem(`ielts_tv_draft_${id}`, JSON.stringify(answers));
    } catch (e) {
      // Bỏ qua nếu localStorage đầy hoặc bị chặn (chế độ ẩn danh...)
    }
  }, [answers, id, isSubmitted]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitTest = useCallback(async () => {
    // FIX BUG (double-submit race condition): kiểm tra + khoá bằng ref ngay lập tức,
    // không phụ thuộc vào state isSubmitted (vốn cập nhật bất đồng bộ và có thể bị
    // double-click vượt qua trước khi UI kịp disable nút Nộp bài).
    if (isSubmittingRef.current || isSubmitted) return;

    if (!testData || !testData.questions_json) {
      console.warn("testData chưa sẵn sàng để chấm bài");
      return;
    }

    const confirmSubmit = window.confirm("Bạn có chắc chắn muốn nộp bài thi này để chấm điểm không?");
    if (!confirmSubmit) return;

    isSubmittingRef.current = true;

    let correctCount = 0;
    let totalCount = 0;

    try {
      // 1. VÒNG LẶP CHẤM ĐIỂM AN TOÀN
      testData.questions_json.forEach(group => {
        group.questions.forEach(q => {

          if (group.type === 'multiple_choice_multi') {
            // A. LOGIC CHẤM ĐIỂM: NHIỀU ĐÁP ÁN (ARRAY)
            const correctKeys = Array.isArray(q.answer) ? q.answer : [];
            const userKeys = Array.isArray(answers[q.id]) ? answers[q.id] : [];

            // FIX BUG: Tổng điểm tối đa phải dựa trên SỐ ĐÁP ÁN ĐÚNG THỰC TẾ đã nhập
            // (correctKeys.length), không phải requiredSelectCount. Nếu admin lỡ nhập
            // thiếu/thừa đáp án đúng so với số lượng yêu cầu chọn, dùng requiredSelectCount
            // sẽ khiến học viên không bao giờ đạt được điểm tối đa (hoặc ngược lại).
            totalCount += (correctKeys.length || group.requiredSelectCount || 0);

            // Chấm điểm từng lựa chọn
            userKeys.forEach(k => {
              if (correctKeys.includes(k)) correctCount++;
            });

          } else {
            // B. LOGIC CHẤM ĐIỂM: 1 ĐÁP ÁN (STRING)
            totalCount++;

            // Ép kiểu về String an toàn trước khi .trim() để tránh lỗi crash app
            const studentAns = String(answers[q.id] || '').trim().toUpperCase();
            const correctAns = String(q.answer || '').trim().toUpperCase();

            if (studentAns === correctAns && correctAns !== '') {
              correctCount++;
            }
          }
        });
      });

      // 2. CẬP NHẬT TRẠNG THÁI GIAO DIỆN
      setScore({ correct: correctCount, total: totalCount });
      setIsSubmitted(true);

      // 3. LƯU KẾT QUẢ LÊN SUPABASE
      // TÍNH NĂNG MỚI: Tự sinh sẵn id + link chia sẻ ở phía trình duyệt TRƯỚC khi
      // insert, để lưu luôn cột share_link trong CÙNG 1 lượt gọi DB (không cần
      // insert xong rồi update lại lần 2).
      const resultId = generateUUID();
      const shareLinkUrl = `${window.location.origin}/share-result/${resultId}`;

      const { error } = await supabase
        .from('test_results')
        .insert([{
          id: resultId,
          test_id: testData.id,
          student_answers: answers,
          score_correct: correctCount,
          score_total: totalCount,
          time_taken: seconds,
          share_link: shareLinkUrl
        }]);

      if (error) throw error;

      // Tạo link share động
      setShareLink(shareLinkUrl);

      // FIX BUG: Xoá bản nháp autosave sau khi nộp bài thành công, tránh việc
      // "Làm lại bài" hoặc mở lại đề vô tình nạp lại đáp án cũ đã nộp.
      try {
        localStorage.removeItem(`ielts_tv_draft_${id}`);
      } catch (e) {
        // Bỏ qua nếu localStorage bị chặn
      }

    } catch (err) {
      console.error("Lỗi trong quá trình chấm bài:", err);
      alert("Hệ thống gặp lỗi khi chấm điểm. Vui lòng mở F12 xem Console hoặc thử lại!");
      // FIX BUG: Nếu lưu lên Supabase thất bại (vd mất mạng), phải mở lại khoá để
      // học viên có thể bấm "Nộp bài" thử lại, tránh bị kẹt vĩnh viễn.
      isSubmittingRef.current = false;
      setIsSubmitted(false);
    }
  }, [testData, answers, isSubmitted, seconds, id]);

  const handleRetakeTest = useCallback(() => {
    const confirmRetake = window.confirm("Bạn có muốn làm lại bài thi này không? Toàn bộ kết quả cũ sẽ bị xóa bỏ.");
    if (!confirmRetake) return;

    setAnswers({});
    setIsSubmitted(false);
    setScore({ correct: 0, total: 0 });
    setSeconds(0);
    isSubmittingRef.current = false; // FIX BUG: mở lại khoá nộp bài để có thể nộp lại lần nữa
    try {
      localStorage.removeItem(`ielts_tv_draft_${id}`);
    } catch (e) {
      // Bỏ qua
    }
  }, [id]);

  // FIX BUG: Logic bôi đen/xoá highlight trước đây bị lặp lại y hệt ở cả
  // đây (TestScreen.jsx) và bên trong TestingPassage.jsx, nhưng bản ở đây
  // KHÔNG hề được TestingBody sử dụng (dead code) — TestingPassage tự chạy
  // bản riêng của nó. Đã gộp về TestingPassage.jsx làm nguồn duy nhất.
  // Ở đây chỉ còn giữ lại phần điều khiển "Xoá tất cả highlight".
  const handleClearAllHighlights = useCallback(() => {
    if (!passagePanelRef.current || !highlightCount) return;
    const confirmClear = window.confirm(`Xoá toàn bộ ${highlightCount} vùng đã bôi đen trong bài đọc?`);
    if (!confirmClear) return;
    passagePanelRef.current.clearAllHighlights();
  }, [highlightCount]);

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
  // FIX BUG: Mang theo groupType + requiredCount để Panel định vị (minimap) tô đúng
  // trạng thái "đã trả lời" cho dạng "Chọn nhiều đáp án", đồng bộ với logic answeredCount ở trên.
  const allDisplayNumbers = [];
  testData.questions_json.forEach(g => {
    g.questions.forEach(q => {
      allDisplayNumbers.push({
        num: q.displayNumber,
        id: q.id,
        groupType: g.type,
        requiredCount: g.type === 'multiple_choice_multi' ? (g.requiredSelectCount || (Array.isArray(q.answer) ? q.answer.length : 2)) : 1
      });
    });
  });

  // FIX BUG: Đếm số câu "đã trả lời" phải xét đúng theo từng loại câu hỏi.
  // Trước đây, với dạng "Chọn nhiều đáp án" (multiple_choice_multi), chỉ cần chọn
  // 1/2 đáp án yêu cầu đã bị tính là "đã trả lời", khiến học viên có thể nộp bài
  // khi chưa chọn đủ số lượng đáp án bắt buộc.
  let answeredCount = 0;
  testData.questions_json.forEach(group => {
    group.questions.forEach(q => {
      const val = answers[q.id];
      if (group.type === 'multiple_choice_multi') {
        const requiredCount = group.requiredSelectCount || (Array.isArray(q.answer) ? q.answer.length : 2);
        if (Array.isArray(val) && val.length >= requiredCount) answeredCount++;
      } else if (val && val.toString().trim() !== '') {
        answeredCount++;
      }
    });
  });
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
        shareLink={shareLink}
      />
      <TestingBody
        isResizing={isResizing}
        splitWidth={splitWidth}
        testData={testData}
        onHandleAnswerChange={handleAnswerChange}
        startResizing={startResizing}
        isSubmitted={isSubmitted}
        seconds={seconds}
        score={score}
        allDisplayNumbers={allDisplayNumbers}
        answers={answers}
        onScrollToQuestion={scrollToQuestion}
        passageRef={passagePanelRef}
        highlightCount={highlightCount}
        onHighlightCountChange={setHighlightCount}
        onClearAllHighlights={handleClearAllHighlights} />
    </div>
  );
};

export default TestScreen;