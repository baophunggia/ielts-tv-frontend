// ==========================================
// BỘ PHÂN TÍCH "NHẬP NHANH TỪ VĂN BẢN"
// Giúp giáo viên soạn đề trong Word/Notepad theo 1 cú pháp đơn giản,
// dán vào ô textarea và tự động sinh ra passage_html + questions_json,
// thay vì phải bấm tay từng nút/từng ô trên form.
//
// CÚ PHÁP MẪU (xem thêm hằng số QUICK_IMPORT_TEMPLATE bên dưới):
//
// TITLE: Cambridge IELTS 16 - Test 1 - Passage 1
// LEVEL: 56
//
// PASSAGE:
// <Dán nội dung bài đọc vào đây, có thể xuống dòng tự do>
//
// QUESTIONS:
//
// [TRUE_FALSE_NOT_GIVEN]
// Instruction: Do the following statements agree with the information given?
// 1. Some statement text -> TRUE
// 2. Another statement -> FALSE | Explanation: vì đoạn 2 có nói...
//
// [MULTIPLE_CHOICE]
// Instruction: Choose the correct letter, A, B, C or D.
// 3. What does the author mainly argue?
// A. Option A text
// B. Option B text
// C. Option C text
// D. Option D text
// -> B
//
// [GAP_FILL]
// Instruction: Complete the sentences below.
// 4. The invention of the [GAP] changed communication forever. -> telephone
//
// [MATCHING_INFORMATION]
// Instruction: Which paragraph contains the following information?
// Options:
// A. Paragraph A
// B. Paragraph B
// C. Paragraph C
// 5. Some specific detail -> C
//
// [MATCHING_HEADINGS]
// Instruction: Choose the correct heading for each paragraph.
// Options:
// i. Heading one
// ii. Heading two
// iii. Heading three
// 6. -> ii
//
// [MATCHING_FEATURES]
// Instruction: Match each researcher with the correct statement.
// Options:
// A. Dr. Smith
// B. Dr. Jones
// 7. Statement about a researcher -> A
//
// [MULTIPLE_CHOICE_MULTI] required=2
// Instruction: Choose TWO letters, A-E.
// Options:
// A. Option A
// B. Option B
// C. Option C
// D. Option D
// E. Option E
// 8. Which TWO are correct? -> A,C
// ==========================================

export const QUICK_IMPORT_TEMPLATE = `TITLE: Tên đề thi của bạn
LEVEL: 56

PASSAGE:
Dán nội dung bài đọc vào đây. Có thể xuống dòng tự do, mỗi dòng trống sẽ thành 1 đoạn văn mới.

QUESTIONS:

[TRUE_FALSE_NOT_GIVEN]
Instruction: Do the following statements agree with the information in the passage?
1. Câu khẳng định thứ nhất -> TRUE
2. Câu khẳng định thứ hai -> FALSE | Explanation: Giải thích ngắn gọn (không bắt buộc)
3. Câu khẳng định thứ ba -> NOT GIVEN

[MULTIPLE_CHOICE]
Instruction: Choose the correct letter, A, B, C or D.
4. Nội dung câu hỏi trắc nghiệm?
A. Phương án A
B. Phương án B
C. Phương án C
D. Phương án D
-> B

[GAP_FILL]
Instruction: Complete the sentences below. Write NO MORE THAN TWO WORDS.
5. Câu có chỗ trống [GAP] cần điền từ. -> đáp án đúng

[MATCHING_INFORMATION]
Instruction: Which paragraph contains the following information?
Options:
A. Paragraph A
B. Paragraph B
C. Paragraph C
6. Chi tiết cần tìm đoạn văn chứa nó -> C

[MATCHING_HEADINGS]
Instruction: Choose the correct heading for each paragraph.
Options:
i. Tiêu đề 1
ii. Tiêu đề 2
iii. Tiêu đề 3
7. -> ii

[MATCHING_FEATURES]
Instruction: Match each statement with the correct person.
Options:
A. Người A
B. Người B
8. Câu mô tả cần khớp với người tương ứng -> A

[MULTIPLE_CHOICE_MULTI] required=2
Instruction: Choose TWO letters, A-E.
Options:
A. Phương án A
B. Phương án B
C. Phương án C
D. Phương án D
E. Phương án E
9. Câu hỏi chọn 2 đáp án đúng -> A,C
`;

const TYPE_TAG_MAP = {
    TRUE_FALSE_NOT_GIVEN: 'true_false_not_given',
    MULTIPLE_CHOICE: 'multiple_choice',
    GAP_FILL: 'gap_fill',
    MATCHING_INFORMATION: 'matching_information',
    MATCHING_HEADINGS: 'matching_headings',
    MATCHING_FEATURES: 'matching_features',
    MULTIPLE_CHOICE_MULTI: 'multiple_choice_multi',
};

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const isOptionLine = (line) => /^[A-Za-z]{1,3}[\.\)]\s+/.test(line.trim());

const isQuestionLine = (line) => /^\d+([\-–]\d+)?\.\s?/.test(line.trim());

// Chuyển đoạn text thuần (nhiều dòng) thành các thẻ <p> để lưu vào passage_html
function plainTextToHtml(text) {
    const trimmed = text.trim();
    if (!trimmed) return '';
    // Nếu người dùng đã dán sẵn HTML (có thẻ <p> hoặc <div>...) thì giữ nguyên
    if (/<\/?(p|div|h[1-6]|ul|ol|br)[\s>]/i.test(trimmed)) return trimmed;

    return trimmed
        .split(/\n\s*\n/) // tách theo dòng trống thành từng đoạn
        .map(para => para.trim())
        .filter(Boolean)
        .map(para => `<p>${para.replace(/\n/g, ' ')}</p>`)
        .join('');
}

function parseQuestionLine(line) {
    // "1. Nội dung -> ĐÁP ÁN | Explanation: abc"
    const match = line.match(/^(\d+)([\-–]\d+)?\.\s?(.*)$/);
    if (!match) return null;
    const num = match[1];
    let rest = match[3] || '';

    let explanation = '';
    const explMatch = rest.match(/\|\s*Explanation:\s*(.*)$/i);
    if (explMatch) {
        explanation = explMatch[1].trim();
        rest = rest.slice(0, explMatch.index).trim();
    }

    let text = rest;
    let answer = '';
    const arrowIdx = rest.lastIndexOf('->');
    if (arrowIdx !== -1) {
        text = rest.slice(0, arrowIdx).trim();
        answer = rest.slice(arrowIdx + 2).trim();
    }

    return { num, text, answer, explanation };
}

function parseGroupBlock(headerLine, bodyLines) {
    const headerMatch = headerLine.match(/^\[([A-Z_]+)\]\s*(.*)$/);
    if (!headerMatch) return null;
    const tag = headerMatch[1];
    const type = TYPE_TAG_MAP[tag];
    if (!type) return null;

    let requiredSelectCount;
    const reqMatch = headerMatch[2].match(/required\s*=\s*(\d+)/i);
    if (reqMatch) requiredSelectCount = parseInt(reqMatch[1], 10);

    let instruction = '';
    let options;
    const questions = [];

    let i = 0;
    // Instruction (dòng đầu tiên, nếu có)
    if (bodyLines[i] && /^Instruction:/i.test(bodyLines[i].trim())) {
        instruction = bodyLines[i].trim().replace(/^Instruction:\s*/i, '');
        i++;
    }

    // Khối Options (dùng cho matching_headings / matching_information / matching_features / multiple_choice_multi)
    if (bodyLines[i] && /^Options:/i.test(bodyLines[i].trim())) {
        i++;
        options = [];
        while (bodyLines[i] && isOptionLine(bodyLines[i]) && !isQuestionLine(bodyLines[i])) {
            options.push(bodyLines[i].trim());
            i++;
        }
    }

    // Các câu hỏi
    while (i < bodyLines.length) {
        const line = bodyLines[i].trim();
        if (!line) { i++; continue; }

        if (type === 'multiple_choice' && isQuestionLine(line) && !line.includes('->')) {
            // Multiple choice có nhiều dòng: câu hỏi, 4 option A-D, rồi dòng "-> X"
            const qMatch = line.match(/^(\d+)\.\s?(.*)$/);
            const qNum = qMatch ? qMatch[1] : String(questions.length + 1);
            const qText = qMatch ? qMatch[2] : line;
            i++;
            const opts = [];
            while (bodyLines[i] && isOptionLine(bodyLines[i])) {
                opts.push(bodyLines[i].trim().replace(/^[A-Za-z][\.\)]\s*/, ''));
                i++;
            }
            let answer = '';
            let explanation = '';
            while (bodyLines[i] && bodyLines[i].trim() !== '' && !isQuestionLine(bodyLines[i])) {
                const arrowMatch = bodyLines[i].match(/^->\s*(.*)$/);
                const explMatch = bodyLines[i].match(/Explanation:\s*(.*)$/i);
                if (arrowMatch) answer = arrowMatch[1].trim();
                if (explMatch) explanation = explMatch[1].trim();
                i++;
            }
            questions.push({
                id: generateId('q'),
                text: qText,
                answer,
                explanation,
                options: opts.length ? opts : ['', '', '', ''],
            });
            continue;
        }

        if (isQuestionLine(line)) {
            const parsed = parseQuestionLine(line);
            if (parsed) {
                let answer = parsed.answer;
                if (type === 'multiple_choice_multi') {
                    answer = answer.replace(/[^A-Za-z]/g, '').toUpperCase().split('');
                } else if (type === 'matching_information' || type === 'matching_features') {
                    answer = answer.replace(/[^A-Za-z]/g, '').toUpperCase();
                }
                questions.push({
                    id: generateId('q'),
                    text: parsed.text,
                    answer,
                    explanation: parsed.explanation || '',
                });
            }
            i++;
            continue;
        }

        i++;
    }

    if (questions.length === 0) return null;

    return {
        id: generateId('g'),
        type,
        instruction,
        options,
        requiredSelectCount,
        questions,
    };
}

/**
 * Phân tích toàn bộ văn bản do giáo viên dán vào, trả về:
 * { title, level, passageHtml, questionGroups, warnings }
 * Ném lỗi (throw) nếu không tìm thấy cấu trúc tối thiểu (PASSAGE / QUESTIONS).
 */
export function parseQuickImportText(rawText) {
    const warnings = [];
    const lines = rawText.replace(/\r\n/g, '\n').split('\n');

    let title = '';
    let level = '';
    let passageLines = [];
    let questionsBlockLines = [];

    let section = null; // 'passage' | 'questions'

    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const trimmed = line.trim();

        if (/^TITLE:/i.test(trimmed)) {
            title = trimmed.replace(/^TITLE:\s*/i, '');
            continue;
        }
        if (/^LEVEL:/i.test(trimmed)) {
            level = trimmed.replace(/^LEVEL:\s*/i, '').trim();
            continue;
        }
        if (/^PASSAGE:/i.test(trimmed)) {
            section = 'passage';
            continue;
        }
        if (/^QUESTIONS:/i.test(trimmed)) {
            section = 'questions';
            continue;
        }

        if (section === 'passage') passageLines.push(line);
        if (section === 'questions') questionsBlockLines.push(line);
    }

    if (passageLines.length === 0) {
        throw new Error('Không tìm thấy phần "PASSAGE:" trong văn bản. Vui lòng theo đúng mẫu.');
    }
    if (questionsBlockLines.length === 0) {
        throw new Error('Không tìm thấy phần "QUESTIONS:" trong văn bản. Vui lòng theo đúng mẫu.');
    }

    const passageHtml = plainTextToHtml(passageLines.join('\n'));

    // Tách các nhóm câu hỏi theo dòng bắt đầu bằng [TAG]
    const questionGroups = [];
    let currentHeader = null;
    let currentBody = [];

    const flushGroup = () => {
        if (!currentHeader) return;
        const group = parseGroupBlock(currentHeader, currentBody);
        if (group) {
            questionGroups.push(group);
        } else {
            warnings.push(`Không phân tích được nhóm: "${currentHeader}"`);
        }
        currentHeader = null;
        currentBody = [];
    };

    questionsBlockLines.forEach(line => {
        if (/^\[[A-Z_]+\]/.test(line.trim())) {
            flushGroup();
            currentHeader = line.trim();
        } else if (currentHeader) {
            currentBody.push(line);
        }
    });
    flushGroup();

    if (questionGroups.length === 0) {
        throw new Error('Không tìm thấy nhóm câu hỏi hợp lệ nào (VD: [TRUE_FALSE_NOT_GIVEN], [MULTIPLE_CHOICE]...). Vui lòng kiểm tra lại cú pháp.');
    }

    return { title, level, passageHtml, questionGroups, warnings };
}
