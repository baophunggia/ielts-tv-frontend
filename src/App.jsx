import { useRef, useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==========================================
// KHỞI TẠO KẾT NỐI SUPABASE
// ==========================================
// Cần tạo file .env.local chứa 2 biến này trước khi chạy local
const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    return '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// ==========================================
// COMPONENT CÁC DẠNG CÂU HỎI
// ==========================================
const MatchingHeadings = ({ group }) => (
  <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
    <h3 className="font-semibold text-lg mb-2 text-indigo-700">Questions {group.questions[0].id.replace('q', '')} - {group.questions[group.questions.length - 1].id.replace('q', '')}</h3>
    <p className="italic text-gray-600 mb-4">{group.instruction}</p>
    <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
      <p className="font-semibold mb-2">List of Headings</p>
      <ul className="space-y-1">
        {group.options.map((opt, idx) => (
          <li key={idx} className="text-sm text-gray-700">{opt}</li>
        ))}
      </ul>
    </div>
    <div className="space-y-3">
      {group.questions.map(q => (
        <div key={q.id} className="flex items-center space-x-3">
          <span className="font-medium w-24">{q.text}:</span>
          <input type="text" className="border border-gray-300 rounded px-3 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="..." />
        </div>
      ))}
    </div>
  </div>
);

const TrueFalseNotGiven = ({ group }) => (
  <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
    <h3 className="font-semibold text-lg mb-2 text-indigo-700">Questions {group.questions[0].id.replace('q', '')} - {group.questions[group.questions.length - 1].id.replace('q', '')}</h3>
    <p className="italic text-gray-600 mb-4">{group.instruction}</p>
    <div className="space-y-4">
      {group.questions.map((q) => (
        <div key={q.id} className="flex flex-col space-y-2">
          <p className="text-gray-800"><span className="font-bold mr-2">{q.id.replace('q', '')}.</span> {q.text}</p>
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
    <h3 className="font-semibold text-lg mb-2 text-indigo-700">Question {group.questions[0].id.replace('q', '')}</h3>
    <p className="italic text-gray-600 mb-4">{group.instruction}</p>
    <div className="space-y-4">
      {group.questions.map(q => (
        <div key={q.id}>
          <p className="font-medium text-gray-800 mb-2"><span className="font-bold mr-2">{q.id.replace('q', '')}.</span> {q.text}</p>
          <div className="space-y-2 ml-6">
            {q.options.map((opt, idx) => (
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
    <h3 className="font-semibold text-lg mb-2 text-indigo-700">Question {group.questions[0].id.replace('q', '')}</h3>
    <p className="italic text-gray-600 mb-4">{group.instruction}</p>
    <div className="space-y-4">
      {group.questions.map(q => {
        const parts = q.text.split('[GAP]');
        return (
          <div key={q.id} className="text-gray-800 leading-loose flex flex-wrap items-center">
            <span className="font-bold mr-2">{q.id.replace('q', '')}.</span>
            <span>{parts[0]}</span>
            <input type="text" className="border-b-2 border-gray-400 mx-2 w-32 px-1 focus:outline-none focus:border-indigo-600 bg-transparent text-center" />
            <span>{parts[1]}</span>
          </div>
        )
      })}
    </div>
  </div>
);

// ==========================================
// COMPONENT CHÍNH APP
// ==========================================
export default function App() {
  const contentRef = useRef(null);

  // State quản lý dữ liệu và trạng thái tải trang
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chạy 1 lần duy nhất khi Component vừa load lên
  useEffect(() => {
    fetchTestFromDatabase();
  }, []);

  const fetchTestFromDatabase = async () => {
    try {
      // Gọi API Supabase: Lấy bài thi đầu tiên
      const { data, error } = await supabase
        .from('reading_tests')
        .select('*')
        .limit(1)
        .single(); // Trả về object thay vì array

      if (error) throw error;
      setTestData(data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bài thi:', error);
      alert('Không thể tải bài thi. Vui lòng F5 thử lại.');
    } finally {
      setLoading(false); // Dù lỗi hay thành công cũng tắt Loading
    }
  };

  // Hàm xử lý bôi đen (Highlight)
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
      console.warn("Không thể highlight khi bôi đen chéo qua các đoạn văn (cross-block).", e);
    }
    selection.removeAllRanges();
  };

  // Hàm render câu hỏi dựa trên JSON type
  const renderQuestionGroup = (group) => {
    switch (group.type) {
      case 'matching_headings': return <MatchingHeadings key={group.id} group={group} />;
      case 'true_false_not_given': return <TrueFalseNotGiven key={group.id} group={group} />;
      case 'multiple_choice': return <MultipleChoice key={group.id} group={group} />;
      case 'gap_fill': return <GapFill key={group.id} group={group} />;
      default: return <div key={group.id}>Unknown question type</div>;
    }
  };

  // Nếu đang gọi API, hiển thị màn hình Loading...
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-lg text-gray-700 font-medium">Đang tải bài thi từ cơ sở dữ liệu của hệ thống, vui lòng chờ...</p>
        </div>
      </div>
    );
  }

  // Nếu không có data (Database trống)
  if (!testData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-xl text-red-600 font-semibold">Bài thi không tồn tại hoặc cơ sở dữ liệu trống!</p>
      </div>
    );
  }

  // Khi đã có data, Render giao diện chính thức
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-indigo-900 text-white p-4 shadow-md flex justify-between items-center shrink-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap"></i> IELTS TV - Reading Practice
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <span><i className="fa-regular fa-clock mr-1"></i> 60:00</span>
          <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-semibold transition">Submit Test</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* CỘT TRÁI: READING PASSAGE */}
        <div className="w-1/2 h-full bg-white border-r border-gray-300 relative">
          <div className="absolute top-0 left-0 w-full bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs px-4 py-2 text-center z-10">
            <i className="fa-solid fa-lightbulb mr-1"></i> Mẹo: Dùng chuột bôi đen đoạn văn để highlight. Click vào đoạn đã bôi đen để xóa.
          </div>

          <div
            className="h-full overflow-y-auto p-8 pt-12 reading-content selection:bg-indigo-100 selection:text-indigo-900"
            ref={contentRef}
            onMouseUp={handleMouseUp}
            dangerouslySetInnerHTML={{ __html: testData.passage_html }}
          />
        </div>

        {/* CỘT PHẢI: QUESTIONS */}
        <div className="w-1/2 h-full bg-slate-50 overflow-y-auto p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{testData.title}</h2>

          {/* Render mảng JSON lấy từ Database */}
          {testData.questions_json.map(group => renderQuestionGroup(group))}

        </div>
      </div>
    </div>
  );
}