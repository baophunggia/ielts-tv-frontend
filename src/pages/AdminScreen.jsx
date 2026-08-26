import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '../supabaseClient';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AdminScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    // ==========================================
    // 1. STATES CHUNG
    // ==========================================
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState('');

    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('45');
    const [html, setHtml] = useState('');
    const [questionGroups, setQuestionGroups] = useState([]);

    const [status, setStatus] = useState({ type: '', msg: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const modules = {
        toolbar: [
            [{ 'header': [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    useEffect(() => {
        const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);

        if (loggedIn && editId) {
            fetchOldTestData(editId);
        }
    }, [editId]);

    const fetchOldTestData = async (id) => {
        try {
            const { data, error } = await supabase
                .from('reading_tests')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setTitle(data.title);
            setLevel(data.level || '45');
            setHtml(data.passage_html);
            setQuestionGroups(data.questions_json || []);
        } catch (error) {
            setStatus({ type: 'error', msg: 'Không thể tải dữ liệu bài thi cũ: ' + error.message });
        }
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === 'P@ssw0rd') {
            setIsAuthenticated(true);
            localStorage.setItem('isAdminLoggedIn', 'true');
            setLoginError('');
            if (editId) fetchOldTestData(editId);
        } else {
            setLoginError('Sai mật khẩu!');
            setPasswordInput('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        setIsAuthenticated(false);
        navigate('/');
    };

    // ==========================================
    // 2. LOGIC FORM ĐỘNG
    // ==========================================
    const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const addQuestionGroup = (type) => {
        let defaultOptions = undefined;
        let defaultRequiredSelectCount = undefined;
        let defaultAnswer = '';

        if (type === 'matching_headings' || type === 'matching_features') {
            defaultOptions = [''];
        } else if (type === 'multiple_choice_multi') {
            defaultOptions = ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'];
            defaultRequiredSelectCount = 2;
            defaultAnswer = []; 
        }

        const newGroup = {
            id: generateId('g'),
            type: type,
            instruction: '',
            options: defaultOptions,
            requiredSelectCount: defaultRequiredSelectCount,
            questions: [{ 
                id: generateId('q'), 
                text: '', 
                answer: defaultAnswer, 
                explanation: '', 
                options: type === 'multiple_choice' ? ['', '', '', ''] : undefined 
            }]
        };
        setQuestionGroups([...questionGroups, newGroup]);
    };

    const removeGroup = (groupId) => setQuestionGroups(questionGroups.filter(g => g.id !== groupId));
    const updateGroup = (groupId, field, value) => setQuestionGroups(questionGroups.map(g => g.id === groupId ? { ...g, [field]: value } : g));

    const addQuestion = (groupId, groupType) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            const defaultAnswer = groupType === 'multiple_choice_multi' ? [] : '';
            const newQ = { 
                id: generateId('q'), 
                text: '', 
                answer: defaultAnswer, 
                explanation: '',
                options: groupType === 'multiple_choice' ? ['', '', '', ''] : undefined 
            };
            return { ...g, questions: [...g.questions, newQ] };
        }));
    };

    const removeQuestion = (groupId, questionId) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, questions: g.questions.filter(q => q.id !== questionId) };
        }));
    };

    const updateQuestion = (groupId, questionId, field, value) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            return {
                ...g,
                questions: g.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    };

    const updateQuestionOption = (groupId, questionId, optionIndex, value) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            return {
                ...g,
                questions: g.questions.map(q => {
                    if (q.id !== questionId) return q;
                    const newOptions = [...q.options];
                    newOptions[optionIndex] = value;
                    return { ...q, options: newOptions };
                })
            };
        }));
    };

    const addGroupOption = (groupId) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, options: [...(g.options || []), ''] };
        }));
    };

    const updateGroupOption = (groupId, index, value) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            const newOptions = [...g.options];
            newOptions[index] = value;
            return { ...g, options: newOptions };
        }));
    };

    const removeGroupOption = (groupId, index) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, options: g.options.filter((_, i) => i !== index) };
        }));
    };

    // ==========================================
    // 3. XỬ LÝ LƯU (INSERT HOẶC UPDATE)
    // ==========================================
    const handleUpload = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        if (!html || html === '<p><br></p>') return setStatus({ type: 'error', msg: 'Vui lòng nhập nội dung bài đọc!' });
        if (questionGroups.length === 0) return setStatus({ type: 'error', msg: 'Vui lòng tạo ít nhất 1 nhóm câu hỏi!' });

        try {
            setIsSubmitting(true);
            let resultError;

            if (editId) {
                const { error } = await supabase.from('reading_tests').update({ title, level, passage_html: html, questions_json: questionGroups }).eq('id', editId);
                resultError = error;
            } else {
                const { error } = await supabase.from('reading_tests').insert([{ title, level, passage_html: html, questions_json: questionGroups }]);
                resultError = error;
            }

            if (resultError) throw resultError;

            setStatus({ type: 'success', msg: editId ? 'Cập nhật đề thi thành công!' : 'Upload thành công!' });
            if (!editId) { setTitle(''); setLevel('45'); setHtml(''); setQuestionGroups([]); }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            setStatus({ type: 'error', msg: 'Lỗi: ' + error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full relative">
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Admin Access</h2>
                    <form onSubmit={handleLoginSubmit}>
                        <input type="password" required autoFocus value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Nhập mật khẩu..." className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" />
                        {loginError && <p className="text-red-500 text-sm font-medium mb-4 text-center">{loginError}</p>}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer">Xác nhận</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <Link to="/" className="bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded text-indigo-100 font-medium transition text-sm cursor-pointer">Về trang chủ</Link>
                    <h2 className="text-2xl font-bold text-gray-800">{editId ? 'Chỉnh sửa đề thi' : 'Soạn thảo đề thi mới'}</h2>
                    <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded font-medium text-sm transition cursor-pointer">Thoát</button>
                </div>

                {status.msg && (
                    <div className={`p-4 mb-6 rounded font-medium ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{status.msg}</div>
                )}

                <form onSubmit={handleUpload} className="space-y-8">
                    {/* 1. THÔNG TIN CHUNG */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề bài thi</label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 outline-none focus:ring-indigo-500" placeholder="VD: Cambridge IELTS 16..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Độ khó</label>
                            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 outline-none focus:ring-indigo-500 bg-white cursor-pointer">
                                <option value="45">Band 4.0 - 5.0</option><option value="56">Band 5.0 - 6.0</option><option value="78">Band 7.0 - 8.0</option><option value="89">Band 8.0 - 9.0</option>
                            </select>
                        </div>
                    </div>

                    {/* 2. BÀI ĐỌC */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Nội dung bài đọc (Passage)</label>
                        <div className="bg-white rounded-md border-gray-300">
                            <ReactQuill theme="snow" value={html} onChange={setHtml} modules={modules} className="h-72 mb-12" placeholder="Soạn thảo hoặc dán nội dung bài đọc vào đây..." />
                        </div>
                    </div>

                    {/* 3. CÂU HỎI */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 gap-4">
                            <h3 className="font-bold text-gray-700">Bộ câu hỏi</h3>
                            <div className="flex flex-wrap gap-2">
                                {/* FIX UI: Đã thêm cursor-pointer, hover:bg-[color]-200 và transition cho tất cả các nút */}
                                <button type="button" onClick={() => addQuestionGroup('true_false_not_given')} className="bg-sky-100 text-sky-700 hover:bg-sky-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ T/F/NG</button>
                                <button type="button" onClick={() => addQuestionGroup('multiple_choice')} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ Trắc nghiệm</button>
                                <button type="button" onClick={() => addQuestionGroup('gap_fill')} className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ Điền từ</button>
                                <button type="button" onClick={() => addQuestionGroup('matching_headings')} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ Headings</button>
                                <button type="button" onClick={() => addQuestionGroup('matching_information')} className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ Match Info</button>
                                <button type="button" onClick={() => addQuestionGroup('matching_features')} className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ Match Features</button>
                                <button type="button" onClick={() => addQuestionGroup('multiple_choice_multi')} className="bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer transition px-3 py-1.5 rounded text-sm font-medium">+ MC (Nhiều ĐÁ)</button>
                            </div>
                        </div>

                        {questionGroups.length === 0 ? (
                            <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">Chưa có câu hỏi nào.</div>
                        ) : (
                            <div className="space-y-6">
                                {questionGroups.map((group, index) => (
                                    <div key={group.id} className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm relative">
                                        {/* FIX UI: Nút xóa nhóm */}
                                        <button type="button" onClick={() => removeGroup(group.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 cursor-pointer transition"><i className="fa-solid fa-trash"></i></button>

                                        <div className="mb-4">
                                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded uppercase mr-2">{group.type.replace(/_/g, ' ')}</span>
                                            <span className="font-semibold text-gray-600">Nhóm {index + 1}</span>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm text-gray-600 mb-1">Lời chỉ dẫn (Instruction)</label>
                                            <input type="text" value={group.instruction} onChange={(e) => updateGroup(group.id, 'instruction', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm bg-gray-50 outline-none" placeholder="VD: Choose the correct letter..." />
                                        </div>

                                        {group.type === 'multiple_choice_multi' && (
                                            <div className="mb-4">
                                                <label className="block text-sm text-gray-600 mb-1 font-bold text-amber-600">Số lượng đáp án học viên phải chọn (Ví dụ: Choose TWO letters thì nhập số 2)</label>
                                                <input type="number" min="1" max="5" value={group.requiredSelectCount || 2} onChange={(e) => updateGroup(group.id, 'requiredSelectCount', parseInt(e.target.value))} className="w-32 border border-gray-300 rounded p-2 text-sm outline-none cursor-pointer" />
                                            </div>
                                        )}

                                        {['matching_headings', 'matching_features', 'multiple_choice_multi'].includes(group.type) && (
                                            <div className="mb-4 p-4 bg-purple-50 rounded border border-purple-100">
                                                <label className="block text-sm font-semibold text-purple-800 mb-2">Danh sách Options (Headings / Features / Choices)</label>
                                                {group.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2 mb-2">
                                                        <input type="text" value={opt} onChange={(e) => updateGroupOption(group.id, oIdx, e.target.value)} className="flex-1 border border-gray-300 rounded p-1.5 text-sm outline-none" placeholder={`Option ${oIdx + 1} (Ví dụ: A. Name of person)`} />
                                                        {/* FIX UI: Nút xóa Option */}
                                                        <button type="button" onClick={() => removeGroupOption(group.id, oIdx)} className="text-red-500 hover:bg-red-100 px-2 rounded cursor-pointer transition"><i className="fa-solid fa-xmark"></i></button>
                                                    </div>
                                                ))}
                                                {/* FIX UI: Nút thêm Option */}
                                                <button type="button" onClick={() => addGroupOption(group.id)} className="text-sm text-purple-600 hover:underline mt-1 cursor-pointer">+ Thêm Option</button>
                                            </div>
                                        )}

                                        <div className="space-y-4 pl-4 border-l-2 border-indigo-200">
                                            {group.questions.map((q, qIdx) => (
                                                <div key={q.id} className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                                                    <div className="flex gap-2 items-start mb-2">
                                                        <span className="text-gray-400 font-bold mt-1.5">{qIdx + 1}.</span>
                                                        <input type="text" value={q.text} onChange={(e) => updateQuestion(group.id, q.id, 'text', e.target.value)} className="flex-1 border border-gray-300 rounded p-2 text-sm outline-none bg-white" placeholder="Nội dung câu hỏi (Hoặc để trống nếu đề không yêu cầu)..." />
                                                        {/* FIX UI: Nút xóa Question */}
                                                        <button type="button" onClick={() => removeQuestion(group.id, q.id)} className="text-red-400 hover:text-red-600 mt-2 ml-1 cursor-pointer transition"><i className="fa-solid fa-trash"></i></button>
                                                    </div>

                                                    {group.type === 'multiple_choice' && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2 ml-6 mb-3">
                                                            {q.options.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-gray-400">{String.fromCharCode(65 + optIdx)}.</span>
                                                                    <input type="text" value={opt} onChange={(e) => updateQuestionOption(group.id, q.id, optIdx, e.target.value)} className="flex-1 border border-gray-200 rounded p-1.5 text-xs outline-none bg-white" placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3 ml-6 mt-2 pt-2 border-t border-dashed border-gray-200">
                                                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Đáp án đúng:</span>
                                                        
                                                        {/* FIX UI: Thêm cursor-pointer cho Select */}
                                                        {group.type === 'true_false_not_given' && (
                                                            <select value={q.answer || ''} onChange={(e) => updateQuestion(group.id, q.id, 'answer', e.target.value)} className="border border-indigo-300 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                                                                <option value="">-- Chọn đáp án --</option><option value="TRUE">TRUE</option><option value="FALSE">FALSE</option><option value="NOT GIVEN">NOT GIVEN</option>
                                                            </select>
                                                        )}
                                                        
                                                        {group.type === 'multiple_choice' && (
                                                            <select value={q.answer || ''} onChange={(e) => updateQuestion(group.id, q.id, 'answer', e.target.value)} className="border border-indigo-300 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                                                                <option value="">-- Chọn chữ cái --</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                                            </select>
                                                        )}

                                                        {(group.type === 'gap_fill' || group.type === 'matching_headings') && (
                                                            <input type="text" value={q.answer || ''} onChange={(e) => updateQuestion(group.id, q.id, 'answer', e.target.value)} className="border border-indigo-300 rounded px-3 py-1 text-xs outline-none w-48" placeholder="Nhập từ hoặc ký hiệu..." />
                                                        )}

                                                        {(group.type === 'matching_information' || group.type === 'matching_features') && (
                                                            <input type="text" maxLength="1" value={q.answer || ''} onChange={(e) => updateQuestion(group.id, q.id, 'answer', e.target.value.toUpperCase())} className="border border-indigo-300 rounded px-3 py-1 text-xs outline-none w-32 font-bold text-center uppercase" placeholder="VD: A, B, C..." />
                                                        )}

                                                        {group.type === 'multiple_choice_multi' && (
                                                            <input 
                                                                type="text" 
                                                                value={Array.isArray(q.answer) ? q.answer.join('') : q.answer} 
                                                                onChange={(e) => {
                                                                    const raw = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                                                                    updateQuestion(group.id, q.id, 'answer', raw.split(''));
                                                                }} 
                                                                className="border border-amber-400 bg-amber-50 rounded px-3 py-1 text-xs outline-none w-64 font-bold tracking-widest uppercase" 
                                                                placeholder="Gõ liền các chữ đúng (VD: AB hoặc BD)" 
                                                            />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="ml-6 mt-2">
                                                        <input 
                                                            type="text" 
                                                            value={q.explanation || ''} 
                                                            onChange={(e) => updateQuestion(group.id, q.id, 'explanation', e.target.value)} 
                                                            className="w-full border border-slate-200 bg-white rounded p-2 text-xs italic outline-none text-slate-600 focus:border-indigo-400" 
                                                            placeholder="Thêm lời giải thích hiển thị sau khi học viên nộp bài (Không bắt buộc)..." 
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {/* FIX UI: Nút thêm câu hỏi */}
                                            <button type="button" onClick={() => addQuestion(group.id, group.type)} className="text-sm text-indigo-600 hover:underline mt-2 font-medium cursor-pointer">+ Thêm câu hỏi</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* FIX UI: Nút submit */}
                    <button type="submit" disabled={isSubmitting || questionGroups.length === 0} className="bg-indigo-600 text-white px-8 py-4 rounded-md font-bold text-lg hover:bg-indigo-700 w-full uppercase transition disabled:bg-indigo-300 disabled:cursor-not-allowed cursor-pointer">
                        {isSubmitting ? 'Đang xử lý...' : (editId ? 'Cập Nhật Bài Đăng' : 'Xuất Bản Đề Thi')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminScreen;