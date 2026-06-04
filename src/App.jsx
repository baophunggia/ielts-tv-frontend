import { useRef } from 'react';

// ==========================================
// DỮ LIỆU MẪU (JSON) - Admin sẽ cấu hình phần này
// ==========================================
const MOCK_DATA = {
  testTitle: "Cambridge IELTS 15 - Test 1 - Reading Passage 1",
  passageHTML: `
        <h2>Nutmeg - a valuable spice</h2>
        <p><strong>A.</strong> The nutmeg tree, Myristica fragrans, is a large evergreen tree native to Southeast Asia. Until the late 18th century, it only grew in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas – or Spice Islands – in Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruits.</p>
        <p><strong>B.</strong> The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits into two halves along a ridge running the length of the fruit. Inside is a purple-brown shiny seed, 2–3 cm long by about 2 cm across, surrounded by a lacy red or crimson covering called an 'aril'. These are the sources of the two spices nutmeg and mace, the former being produced from the dried seed and the latter from the aril.</p>
        <p><strong>C.</strong> In the Middle Ages, nutmeg was a highly prized and costly ingredient in European cuisine, and was used as a flavouring, medicinal, and preservative agent. Throughout this period, the Arabs were the exclusive importers of the spice to Europe. They sold nutmeg for high prices to merchants based in Venice, but they never revealed the exact location of the source of this extremely valuable cargo.</p>
        <h2>Nutmeg - a valuable spice</h2>
        <p><strong>A.</strong> The nutmeg tree, Myristica fragrans, is a large evergreen tree native to Southeast Asia. Until the late 18th century, it only grew in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas – or Spice Islands – in Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruits.</p>
        <p><strong>B.</strong> The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits into two halves along a ridge running the length of the fruit. Inside is a purple-brown shiny seed, 2–3 cm long by about 2 cm across, surrounded by a lacy red or crimson covering called an 'aril'. These are the sources of the two spices nutmeg and mace, the former being produced from the dried seed and the latter from the aril.</p>
        <p><strong>C.</strong> In the Middle Ages, nutmeg was a highly prized and costly ingredient in European cuisine, and was used as a flavouring, medicinal, and preservative agent. Throughout this period, the Arabs were the exclusive importers of the spice to Europe. They sold nutmeg for high prices to merchants based in Venice, but they never revealed the exact location of the source of this extremely valuable cargo.</p>
        <h2>Nutmeg - a valuable spice</h2>
        <p><strong>A.</strong> The nutmeg tree, Myristica fragrans, is a large evergreen tree native to Southeast Asia. Until the late 18th century, it only grew in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas – or Spice Islands – in Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruits.</p>
        <p><strong>B.</strong> The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits into two halves along a ridge running the length of the fruit. Inside is a purple-brown shiny seed, 2–3 cm long by about 2 cm across, surrounded by a lacy red or crimson covering called an 'aril'. These are the sources of the two spices nutmeg and mace, the former being produced from the dried seed and the latter from the aril.</p>
        <p><strong>C.</strong> In the Middle Ages, nutmeg was a highly prized and costly ingredient in European cuisine, and was used as a flavouring, medicinal, and preservative agent. Throughout this period, the Arabs were the exclusive importers of the spice to Europe. They sold nutmeg for high prices to merchants based in Venice, but they never revealed the exact location of the source of this extremely valuable cargo.</p>
        <h2>Nutmeg - a valuable spice</h2>
        <p><strong>A.</strong> The nutmeg tree, Myristica fragrans, is a large evergreen tree native to Southeast Asia. Until the late 18th century, it only grew in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas – or Spice Islands – in Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruits.</p>
        <p><strong>B.</strong> The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits into two halves along a ridge running the length of the fruit. Inside is a purple-brown shiny seed, 2–3 cm long by about 2 cm across, surrounded by a lacy red or crimson covering called an 'aril'. These are the sources of the two spices nutmeg and mace, the former being produced from the dried seed and the latter from the aril.</p>
        <p><strong>C.</strong> In the Middle Ages, nutmeg was a highly prized and costly ingredient in European cuisine, and was used as a flavouring, medicinal, and preservative agent. Throughout this period, the Arabs were the exclusive importers of the spice to Europe. They sold nutmeg for high prices to merchants based in Venice, but they never revealed the exact location of the source of this extremely valuable cargo.</p>
    `,
  questionGroups: [
    {
      id: "g1",
      type: "matching_headings",
      instruction: "Choose the correct heading for each paragraph from the list of headings below.",
      options: [
        "i. The mysterious origins of the spice",
        "ii. Anatomy of the tree and its fruit",
        "iii. A monopoly on the trade"
      ],
      questions: [
        { id: "q1", text: "Paragraph A" },
        { id: "q2", text: "Paragraph B" },
        { id: "q3", text: "Paragraph C" }
      ]
    },
    {
      id: "g2",
      type: "true_false_not_given",
      instruction: "Do the following statements agree with the information given in the Reading Passage? Choose TRUE, FALSE or NOT GIVEN.",
      questions: [
        { id: "q4", text: "In the Middle Ages, most Europeans knew where nutmeg was grown." },
        { id: "q5", text: "The leaves of the nutmeg tree are pale yellow and bell-shaped." }
      ]
    },
    {
      id: "g3",
      type: "multiple_choice",
      instruction: "Choose the correct letter, A, B, C or D.",
      questions: [
        {
          id: "q6",
          text: "The aril of the nutmeg fruit is...",
          options: [
            "A. used to produce mace.",
            "B. purple-brown in colour.",
            "C. the fleshy outer husk.",
            "D. exactly 2 cm long."
          ]
        }
      ]
    },
    {
      id: "g4",
      type: "gap_fill",
      instruction: "Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.",
      questions: [
        { id: "q7", text: "The Arabs sold nutmeg to merchants from [GAP]." }
      ]
    }
  ]
};

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

  // Hàm xử lý bôi đen (Highlight)
  const handleMouseUp = () => {
    const selection = window.getSelection();
    // Bỏ qua nếu không bôi đen chữ nào
    if (selection.isCollapsed || selection.toString().trim() === '') return;

    const range = selection.getRangeAt(0);

    // Tạo thẻ mark để bọc vùng bôi đen
    const markNode = document.createElement('mark');
    markNode.className = 'bg-yellow-200 cursor-pointer rounded px-0.5 transition hover:bg-red-200 group relative';
    markNode.title = "Click để xóa highlight";

    // Click vào để xóa highlight
    markNode.onclick = function () {
      const parent = this.parentNode;
      while (this.firstChild) {
        parent.insertBefore(this.firstChild, this);
      }
      parent.removeChild(this);
    };

    try {
      // Bọc nội dung lại
      range.surroundContents(markNode);
    } catch (e) {
      console.warn("Không thể highlight khi bôi đen chéo qua các đoạn văn (cross-block).", e);
    }

    // Xóa con trỏ bôi đen sau khi hoàn tất
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

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-indigo-900 text-white p-4 shadow-md flex justify-between items-center shrink-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap"></i> IELTS TV - Reading Practice
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <span><i className="fa-regular fa-clock mr-1"></i> 60:00</span>
          <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-semibold transition">Submit Test</button>
        </div>
      </header>

      {/* Main Content: 2 Columns */}
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
            dangerouslySetInnerHTML={{ __html: MOCK_DATA.passageHTML }}
          />
        </div>

        {/* CỘT PHẢI: QUESTIONS */}
        <div className="w-1/2 h-full bg-slate-50 overflow-y-auto p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{MOCK_DATA.testTitle}</h2>

          {/* Tự động render các dạng câu hỏi từ JSON */}
          {MOCK_DATA.questionGroups.map(group => renderQuestionGroup(group))}

        </div>

      </div>
    </div>
  );
}