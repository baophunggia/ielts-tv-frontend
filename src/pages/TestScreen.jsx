import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

// ==========================================
// COMPONENT 1: MATCHING HEADINGS
// ==========================================
const MatchingHeadings = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 transition-all">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Headings</span>
      Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-4">{group.instruction}</p>

    <div className="bg-slate-50 p-4 rounded-xl mb-5 border border-slate-200/60 shadow-inner">
      <p className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
        <i className="fa-solid fa-list-ol text-xs text-indigo-500"></i> List of Headings
      </p>
      <ul className="space-y-2">
        {group.options?.map((opt, idx) => (
          <li key={idx} className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm font-medium">
            {opt}
          </li>
        ))}
      </ul>
    </div>

    <div className="space-y-4">
      {group.questions.map(q => {
        const isCorrect = answers[q.id]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className="flex flex-col space-y-1">
            <div className="flex items-center space-x-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700 text-sm w-24 pl-2">Question {q.displayNumber}:</span>
              <input
                type="text"
                disabled={isSubmitted}
                value={answers[q.id] || ''}
                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                className={`border rounded-lg px-3 py-2 w-28 focus:outline-none uppercase text-center font-bold text-base transition-all ${isSubmitted
                    ? (isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm shadow-rose-100')
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white'
                  }`}
                placeholder="..."
              />
              {isSubmitted && !isCorrect && (
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in flex items-center gap-1">
                  <i className="fa-solid fa-circle-check"></i> Key: {q.answer}
                </span>
              )}
              {isSubmitted && isCorrect && (
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Correct</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ==========================================
// COMPONENT 2: TRUE / FALSE / NOT GIVEN
// ==========================================
const TrueFalseNotGiven = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-sky-100 text-sky-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">T / F / NG</span>
      Questions {group.questions[0].displayNumber} - {group.questions[group.questions.length - 1].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-5">{group.instruction}</p>

    <div className="space-y-4">
      {group.questions.map((q) => {
        const isCorrect = answers[q.id] === q.answer;
        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className={`flex flex-col space-y-3 p-4 rounded-xl border border-slate-100 transition-all ${isSubmitted ? (isCorrect ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100') : 'bg-slate-50/40 hover:bg-slate-50'}`}>
            <p className="text-slate-800 flex items-start text-sm leading-relaxed font-medium">
              <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
              <span className="flex-1 text-slate-700">{q.text}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 ml-8 justify-between">
              <div className="flex space-x-2">
                {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => {
                  const isChecked = answers[q.id] === opt;
                  return (
                    <label key={opt} className={`flex items-center space-x-1.5 cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${isChecked
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      } ${isSubmitted ? 'pointer-events-none opacity-80' : ''}`}>
                      <input
                        type="radio"
                        name={q.id}
                        disabled={isSubmitted}
                        checked={isChecked}
                        onChange={() => onAnswerChange(q.id, opt)}
                        className="hidden"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {isSubmitted && !isCorrect && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1 animate-fade-in">
                  <i className="fa-solid fa-circle-check"></i> Đáp án: {q.answer}
                </span>
              )}
              {isSubmitted && isCorrect && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Chính xác</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ==========================================
// COMPONENT 3: MULTIPLE CHOICE
// ==========================================
const MultipleChoice = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Multiple Choice</span>
      Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-5">{group.instruction}</p>

    <div className="space-y-5">
      {group.questions.map(q => {
        const isCorrect = answers[q.id] === q.answer;
        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className={`p-4 rounded-xl border border-slate-100 ${isSubmitted ? (isCorrect ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100') : 'bg-slate-50/30'}`}>
            <p className="font-bold text-slate-800 text-sm flex items-start mb-3 leading-relaxed">
              <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
              <span className="flex-1 text-slate-700">{q.text}</span>
            </p>
            <div className="space-y-2 ml-6">
              {q.options?.map((opt, idx) => {
                const optionLetter = String.fromCharCode(65 + idx);
                const isChecked = answers[q.id] === optionLetter;
                const isThisKey = q.answer === optionLetter;

                return (
                  <label key={idx} className={`flex items-start space-x-2.5 cursor-pointer p-2.5 rounded-xl border text-sm transition-all ${isChecked
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    } ${isSubmitted && isThisKey ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : ''} ${isSubmitted ? 'pointer-events-none' : ''}`}>
                    <input
                      type="radio"
                      name={q.id}
                      disabled={isSubmitted}
                      checked={isChecked}
                      onChange={() => onAnswerChange(q.id, optionLetter)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <span className={`font-black mr-1 ${isSubmitted && isThisKey ? 'text-emerald-600' : isChecked ? 'text-indigo-600' : 'text-slate-400'}`}>{optionLetter}.</span> {opt}
                    </span>
                  </label>
                );
              })}
            </div>
            {isSubmitted && !isCorrect && (
              <p className="text-xs font-bold text-emerald-600 ml-6 mt-2 flex items-center gap-1 animate-fade-in">
                <i className="fa-solid fa-circle-check"></i> Đáp án đúng phải là: {q.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ==========================================
// COMPONENT 4: GAP FILL (ĐIỀN TỪ)
// ==========================================
const GapFill = ({ group, answers, onAnswerChange, isSubmitted }) => (
  <div id={`group-${group.id}`} className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <h3 className="font-bold text-lg mb-1 text-indigo-900 flex items-center gap-2">
      <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Gap Fill</span>
      Question {group.questions.length > 1 ? `${group.questions[0].displayNumber} - ${group.questions[group.questions.length - 1].displayNumber}` : group.questions[0].displayNumber}
    </h3>
    <p className="text-xs text-slate-400 italic mb-5">{group.instruction}</p>

    <div className="space-y-4">
      {group.questions.map(q => {
        const parts = q.text.split(/\[GAP\]|_{3,}/);
        const isCorrect = answers[q.id]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();

        return (
          <div key={q.id} id={`q-${q.displayNumber}`} className="text-slate-700 leading-relaxed text-sm flex flex-wrap items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100/70">
            <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{q.displayNumber}</span>
            <span>{parts[0]}</span>

            <input
              type="text"
              disabled={isSubmitted}
              value={answers[q.id] || ''}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              className={`border-b-2 mx-2 w-40 px-2 focus:outline-none bg-transparent text-center font-bold text-sm transition-all py-0.5 ${isSubmitted
                  ? (isCorrect ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded' : 'border-rose-500 text-rose-600 bg-rose-50/50 rounded')
                  : 'border-slate-300 focus:border-indigo-600 text-indigo-900 font-semibold'
                }`}
              placeholder="Nhập đáp án..."
            />

            {parts.length > 1 && <span>{parts[1]}</span>}

            {isSubmitted && !isCorrect && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md ml-2 flex items-center gap-1 animate-fade-in">
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

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitTest = () => {
    if (isSubmitted) return;

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
  };

  const handleRetakeTest = () => {
    const confirmRetake = window.confirm("Bạn có muốn làm lại bài thi này không? Toàn bộ kết quả cũ sẽ bị xóa bỏ.");
    if (!confirmRetake) return;

    setAnswers({});
    setIsSubmitted(false);
    setScore({ correct: 0, total: 0 });
    setSeconds(0);
  };

  // SỬA LỖI HIGHLIGHT: Trả về cơ chế đơn giản, an toàn với nền vàng chữ tối màu
  const handleMouseUpHighlight = () => {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') return;

    const range = selection.getRangeAt(0);

    // Kiểm tra xem vùng chọn có nằm trọn vẹn trong vùng bài đọc không
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const markNode = document.createElement('mark');
    // Trả về UI đơn giản, dễ nhìn: Nền vàng nhạt truyền thống, chữ tối màu
    markNode.className = 'bg-yellow-200 text-slate-800 cursor-pointer rounded px-1 transition-colors hover:bg-yellow-300';
    markNode.title = "Click để xóa highlight này";

    markNode.onclick = function (e) {
      e.stopPropagation();
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

  // Điều hướng nhanh đến câu hỏi bên cột phải
  const scrollToQuestion = (displayNum) => {
    const el = document.getElementById(`q-${displayNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2'), 2000);
    }
  };

  const renderQuestionGroup = (group) => {
    const props = { group, answers, onAnswerChange: handleAnswerChange, isSubmitted };
    switch (group.type) {
      case 'matching_headings': return <MatchingHeadings key={group.id} {...props} />;
      case 'true_false_not_given': return <TrueFalseNotGiven key={group.id} {...props} />;
      case 'multiple_choice': return <MultipleChoice key={group.id} {...props} />;
      case 'gap_fill': return <GapFill key={group.id} {...props} />;
      default: return <div key={group.id} className="p-4 bg-amber-50 rounded">Unknown question type</div>;
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

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden antialiased">
      {/* Header Thanh Lịch */}
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

          {isSubmitted && (
            <button
              onClick={handleRetakeTest}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95"
            >
              <i className="fa-solid fa-arrow-rotate-left"></i> Làm lại bài
            </button>
          )}

          <button
            onClick={handleSubmitTest}
            disabled={isSubmitted}
            className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all shadow-md active:scale-95 ${isSubmitted
                ? 'bg-emerald-600 text-white cursor-not-allowed shadow-none'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
              }`}
          >
            {isSubmitted ? 'Đã nộp bài' : 'Nộp bài thi'}
          </button>
        </div>
      </header>

      {/* Vùng không gian thi chính */}
      <div className="flex flex-1 overflow-hidden relative" style={{ cursor: isResizing ? 'col-resize' : 'default' }}>

        {/* CỘT TRÁI: ĐOẠN VĂN READING PASSAGE */}
        <div
          className="h-full bg-white border-r border-slate-200 shadow-sm relative flex flex-col"
          style={{ width: `${splitWidth}%` }}
        >
          <div className="bg-amber-50/80 border-b border-amber-100 text-amber-800 text-[11px] font-semibold px-4 py-2 flex items-center gap-1.5 shrink-0 select-none shadow-sm">
            <i className="fa-solid fa-marker text-amber-600"></i>
            <span>Mẹo phòng thi: Bôi đen text để đánh dấu (Highlight). Click trực tiếp vào vùng Highlight để xóa bỏ.</span>
          </div>

          <div
            className="flex-1 overflow-y-auto pl-10 pr-12 py-10 text-left leading-relaxed text-slate-700 reading-content selection:bg-indigo-100 select-text"
            ref={contentRef}
            onMouseUp={handleMouseUpHighlight}
            style={{ fontSize: '15px', wordSpacing: '0.5px' }}
            dangerouslySetInnerHTML={{ __html: testData.passage_html.replace(/&nbsp;/g, ' ') }}
          />
        </div>

        {/* ĐƯỜNG KÉO THAY ĐỔI CHIỀU RỘNG TRỰC QUAN (RESIZABLE BAR) */}
        <div
          className={`w-1.5 h-full cursor-col-resize shrink-0 transition-colors z-20 relative flex items-center justify-center ${isResizing ? 'bg-indigo-600' : 'bg-slate-300 hover:bg-indigo-400'
            }`}
          onMouseDown={startResizing}
        >
          <div className="absolute w-4 h-8 bg-white border border-slate-300 rounded-md shadow-sm flex items-center justify-center gap-0.5 select-none pointer-events-none">
            <div className="w-[1px] h-3 bg-slate-400"></div>
            <div className="w-[1px] h-3 bg-slate-400"></div>
          </div>
        </div>

        {/* CỘT PHẢI: BỘ CÂU HỎI VÀ PANEL ĐỊNH VỊ NHANH */}
        <div
          className="h-full bg-[#f8fafc] flex overflow-hidden"
          style={{ width: `${100 - splitWidth}%` }}
        >
          {/* Form câu hỏi chính */}
          <div className="flex-1 h-full overflow-y-auto px-8 py-10">
            {isSubmitted && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/10 flex justify-between items-center animate-fade-in border border-emerald-400/20">
                <div>
                  <h4 className="text-lg font-black mb-0.5 flex items-center gap-2">
                    <i className="fa-solid fa-square-poll-vertical text-xl"></i> Kết quả thi trực tuyến
                  </h4>
                  <p className="text-xs text-emerald-100/90 font-medium">
                    Thời gian hoàn thành: <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded font-bold ml-0.5">{formatTime(seconds)}</span>
                  </p>
                </div>
                <div className="text-center bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                  <span className="text-3xl font-black tracking-tight">{score.correct}</span>
                  <span className="text-sm mx-1 text-emerald-200">/</span>
                  <span className="text-sm text-emerald-200 font-bold">{score.total}</span>
                  <p className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold mt-0.5">Câu trả lời đúng</p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-file-signature text-indigo-500"></i> Phiếu trả lời
            </h2>

            {testData.questions_json.map(group => renderQuestionGroup(group))}
          </div>

          {/* BẢNG ĐỊNH VỊ MINI-MAP (QUESTION NAVIGATION PALETTE) */}
          <div className="w-48 h-full bg-white border-l border-slate-200 p-4 flex flex-col justify-between shrink-0 select-none">
            <div>
              <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1">
                <i className="fa-solid fa-grip text-[10px]"></i> Điều hướng
              </p>
              <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[70vh] pr-1">
                {allDisplayNumbers.map((item) => {
                  const hasAnswer = !!answers[item.id]?.toString().trim();
                  return (
                    <button
                      key={item.num}
                      onClick={() => scrollToQuestion(item.num)}
                      className={`h-8 rounded-lg text-xs font-bold transition-all ${isSubmitted
                          ? 'border border-slate-200 bg-slate-50 text-slate-600'
                          : hasAnswer
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
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
                <span className="w-3 h-3 bg-indigo-600 rounded-md"></span>
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
    </div>
  );
};

export default TestScreen;