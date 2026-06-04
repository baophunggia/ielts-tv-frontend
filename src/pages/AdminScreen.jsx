import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AdminScreen = () => {
    const navigate = useNavigate();

    // ==========================================
    // 1. STATES CHUNG & AUTH
    // ==========================================
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState('');

    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('Intermediate');
    const [html, setHtml] = useState('');
    
    // THAY THẾ JSON STRING BẰNG MẢNG QUESTION GROUPS
    const [questionGroups, setQuestionGroups] = useState([]); 
    
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const modules = {
        toolbar: [
            [{ 'header': [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    useEffect(() => {
        const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);
    }, []);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === 'P@ssw0rd') {
            setIsAuthenticated(true);
            localStorage.setItem('isAdminLoggedIn', 'true');
            setLoginError('');
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
    // 2. LOGIC XỬ LÝ FORM ĐỘNG (BUILDER)
    // ==========================================
    const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const addQuestionGroup = (type) => {
        const newGroup = {
            id: generateId('g'),
            type: type,
            instruction: '',
            options: type === 'matching_headings' ? [''] : undefined,
            questions: [{ id: generateId('q'), text: '', options: type === 'multiple_choice' ? ['', '', '', ''] : undefined }]
        };
        setQuestionGroups([...questionGroups, newGroup]);
    };

    const removeGroup = (groupId) => {
        setQuestionGroups(questionGroups.filter(g => g.id !== groupId));
    };

    const updateGroup = (groupId, field, value) => {
        setQuestionGroups(questionGroups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
    };

    // Logic xử lý câu hỏi bên trong Group
    const addQuestion = (groupId, groupType) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            const newQ = { id: generateId('q'), text: '', options: groupType === 'multiple_choice' ? ['', '', '', ''] : undefined };
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

    // Logic đặc thù cho Multiple Choice Options và Matching Headings
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

    const addHeadingOption = (groupId) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, options: [...(g.options || []), ''] };
        }));
    };

    const updateHeadingOption = (groupId, index, value) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            const newOptions = [...g.options];
            newOptions[index] = value;
            return { ...g, options: newOptions };
        }));
    };

    const removeHeadingOption = (groupId, index) => {
        setQuestionGroups(questionGroups.map(g => {
            if (g.id !== groupId) return g;
            const newOptions = g.options.filter((_, i) => i !== index);
            return { ...g, options: newOptions };
        }));
    };


    // ==========================================
    // 3. XỬ LÝ UPLOAD LÊN DATABASE
    // ==========================================
    const handleUpload = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        if (!html || html === '<p><br></p>') {
            setStatus({ type: 'error', msg: 'Vui lòng nhập nội dung bài đọc!' });
            return;
        }

        if (questionGroups.length === 0) {
            setStatus({ type: 'error', msg: 'Vui lòng tạo ít nhất 1 nhóm câu hỏi!' });
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Không cần JSON.parse nữa vì questionGroups đã là mảng Javascript chuẩn
            const { error } = await supabase
                .from('reading_tests')
                .insert([{ title, level, passage_html: html, questions_json: questionGroups }]);

            if (error) throw error;

            setStatus({ type: 'success', msg: 'Upload thành công! Đề thi đã xuất hiện trên trang chủ.' });
            
            // Reset form
            setTitle('');
            setLevel('Intermediate');
            setHtml('');
            setQuestionGroups([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            setStatus({ type: 'error', msg: 'Lỗi: ' + error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================
    // VIEW 1: AUTH POPUP
    // ==========================================
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full relative">
                    <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                    <div className="text-center mb-6">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-lock text-2xl text-indigo-600"></i>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Admin Access</h2>
                        <p className="text-sm text-gray-500 mt-1">Vui lòng nhập mật khẩu để tiếp tục</p>
                    </div>
                    <form onSubmit={handleLoginSubmit}>
                        <input type="password" required autoFocus value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Nhập mật khẩu..." className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" />
                        {loginError && <p className="text-red-500 text-sm font-medium mb-4 text-center">{loginError}</p>}
                        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition">Xác nhận</button>
                    </form>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW 2: ADMIN PORTAL
    // ==========================================
    return (
        <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800"><i className="fa-solid fa-cloud-arrow-up mr-2 text-indigo-600"></i>Soạn thảo đề thi mới</h2>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-indigo-600 hover:underline font-medium text-sm">Về trang chủ</Link>
                        <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2">
                            <i className="fa-solid fa-right-from-bracket"></i> Thoát
                        </button>
                    </div>
                </div>

                {status.msg && (
                    <div className={`p-4 mb-6 rounded font-medium ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {status.msg}
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-8">
                    {/* THÔNG TIN CHUNG */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2"><i className="fa-solid fa-circle-info mr-2"></i>1. Thông tin chung</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề bài thi</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 outline-none" placeholder="VD: Cambridge IELTS 16..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Độ khó</label>
                                <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 outline-none bg-white">
                                    <option value="Foundation">Foundation (Cơ bản)</option>
                                    <option value="Intermediate">Intermediate (Trung bình)</option>
                                    <option value="Advanced">Advanced (Nâng cao)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* RICH TEXT EDITOR */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2"><i className="fa-solid fa-file-lines mr-2"></i>2. Nội dung bài đọc</h3>
                        <div className="bg-white rounded-md border-gray-300">
                            <ReactQuill theme="snow" value={html} onChange={setHtml} modules={modules} className="h-72 mb-12" placeholder="Soạn thảo hoặc dán nội dung bài đọc vào đây..." />
                        </div>
                    </div>

                    {/* BUILDER CÂU HỎI MỚI */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center border-b pb-2 mb-6">
                            <h3 className="font-bold text-gray-700"><i className="fa-solid fa-list-check mr-2"></i>3. Bộ câu hỏi</h3>
                            
                            {/* Nút thêm nhóm câu hỏi */}
                            <div className="flex gap-2">
                                <button type="button" onClick={() => addQuestionGroup('true_false_not_given')} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded text-sm font-medium transition">+ T/F/NG</button>
                                <button type="button" onClick={() => addQuestionGroup('multiple_choice')} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded text-sm font-medium transition">+ Trắc nghiệm</button>
                                <button type="button" onClick={() => addQuestionGroup('gap_fill')} className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1.5 rounded text-sm font-medium transition">+ Điền từ</button>
                                <button type="button" onClick={() => addQuestionGroup('matching_headings')} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded text-sm font-medium transition">+ Nối Heading</button>
                            </div>
                        </div>

                        {questionGroups.length === 0 ? (
                            <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                <i className="fa-regular fa-folder-open text-3xl mb-2"></i>
                                <p>Chưa có câu hỏi nào. Hãy bấm các nút bên trên để thêm!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {questionGroups.map((group, index) => (
                                    <div key={group.id} className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm relative">
                                        <button type="button" onClick={() => removeGroup(group.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                                        
                                        <div className="mb-4">
                                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded uppercase mr-2">{group.type.replace(/_/g, ' ')}</span>
                                            <span className="font-semibold text-gray-600">Nhóm {index + 1}</span>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm text-gray-600 mb-1">Lời chỉ dẫn (Instruction)</label>
                                            <input type="text" value={group.instruction} onChange={(e) => updateGroup(group.id, 'instruction', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="VD: Choose the correct letter, A, B, C or D..." />
                                        </div>

                                        {/* Giao diện nhập Headings cho loại Nối */}
                                        {group.type === 'matching_headings' && (
                                            <div className="mb-4 p-4 bg-purple-50 rounded border border-purple-100">
                                                <label className="block text-sm font-semibold text-purple-800 mb-2">Danh sách Headings</label>
                                                {group.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2 mb-2">
                                                        <input type="text" value={opt} onChange={(e) => updateHeadingOption(group.id, oIdx, e.target.value)} className="flex-1 border border-gray-300 rounded p-1.5 text-sm outline-none" placeholder="Nhập text heading..." />
                                                        <button type="button" onClick={() => removeHeadingOption(group.id, oIdx)} className="text-red-500 hover:bg-red-50 px-2 rounded"><i className="fa-solid fa-xmark"></i></button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addHeadingOption(group.id)} className="text-sm text-purple-600 hover:underline mt-1">+ Thêm Heading</button>
                                            </div>
                                        )}

                                        {/* Danh sách các câu hỏi trong nhóm */}
                                        <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
                                            {group.questions.map((q, qIdx) => (
                                                <div key={q.id} className="relative">
                                                    <div className="flex gap-2 items-start">
                                                        <span className="text-gray-400 font-bold mt-1.5">{qIdx + 1}.</span>
                                                        <input 
                                                            type="text" 
                                                            value={q.text} 
                                                            onChange={(e) => updateQuestion(group.id, q.id, 'text', e.target.value)} 
                                                            className="flex-1 border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                                                            placeholder={group.type === 'gap_fill' ? "Câu hỏi có chứa [GAP] ở giữa..." : "Nhập câu hỏi..."} 
                                                        />
                                                        <button type="button" onClick={() => removeQuestion(group.id, q.id)} className="text-red-400 hover:text-red-600 mt-2 ml-1"><i className="fa-solid fa-trash"></i></button>
                                                    </div>

                                                    {/* Nhập đáp án A B C D cho Trắc nghiệm */}
                                                    {group.type === 'multiple_choice' && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2 ml-6">
                                                            {q.options.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-gray-400">{String.fromCharCode(65 + optIdx)}.</span>
                                                                    <input type="text" value={opt} onChange={(e) => updateQuestionOption(group.id, q.id, optIdx, e.target.value)} className="flex-1 border border-gray-200 rounded p-1.5 text-xs outline-none focus:border-indigo-400" placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addQuestion(group.id, group.type)} className="text-sm text-indigo-600 hover:underline mt-2"><i className="fa-solid fa-plus mr-1"></i> Thêm câu hỏi vào nhóm này</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={isSubmitting || questionGroups.length === 0} className="bg-indigo-600 text-white px-8 py-4 rounded-md font-bold text-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition w-full shadow-md">
                        {isSubmitting ? 'Đang xuất bản...' : 'XUẤT BẢN ĐỀ THI LÊN HỆ THỐNG'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminScreen;