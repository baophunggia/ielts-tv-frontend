// ==========================================
// MÀN HÌNH ADMIN UPLOAD ĐỀ MỚI
// ==========================================
import { useState, useEffect  } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const AdminScreen = () => {
    const navigate = useNavigate();

    // Trạng thái hiển thị form upload hay popup đăng nhập
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // State cho popup
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState('');

    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('Intermediate'); // Thêm trường Level
    const [html, setHtml] = useState('');
    const [json, setJson] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Kiểm tra trạng thái ngay khi vào trang /admin
    useEffect(() => {
        const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);
    }, []);

    // Xử lý submit popup nhập mật khẩu
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

    // Xử lý nút Thoát
    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        setIsAuthenticated(false);
        navigate('/'); // Thoát xong tự động về trang chủ
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        try {
            setIsSubmitting(true);
            const parsedJson = JSON.parse(json);

            const { error } = await supabase
                .from('reading_tests')
                .insert([{ title, level, passage_html: html, questions_json: parsedJson }]);

            if (error) throw error;

            setStatus({ type: 'success', msg: 'Upload thành công! Bạn có thể tiếp tục upload đề mới.' });
            // Upload xong xoá trắng form để nhập tiếp, nhưng VẪN Ở LẠI TRANG
            setTitle('');
            setLevel('Intermediate');
            setHtml('');
            setJson('');
        } catch (error) {
            setStatus({ type: 'error', msg: 'Lỗi: ' + (error.message || 'JSON không đúng định dạng.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // VIEW 1: POPUP NHẬP MẬT KHẨU (NẾU CHƯA XÁC THỰC)
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
                        <input
                            type="password"
                            required
                            autoFocus
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Nhập mật khẩu..."
                            className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {loginError && <p className="text-red-500 text-sm font-medium mb-4 text-center">{loginError}</p>}

                        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition">
                            Xác nhận
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW 2: TRANG UPLOAD (SAU KHI NHẬP ĐÚNG PASS)
    // ==========================================
    return (
        <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        <i className="fa-solid fa-cloud-arrow-up mr-2 text-indigo-600"></i>Upload đề thi mới
                    </h2>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-indigo-600 hover:underline font-medium text-sm">Về trang chủ</Link>
                        {/* Nút thoát */}
                        <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2">
                            <i className="fa-solid fa-right-from-bracket"></i> Thoát phiên
                        </button>
                    </div>
                </div>

                {status.msg && (
                    <div className={`p-4 mb-6 rounded font-medium ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {status.msg}
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề bài thi</label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="VD: Cambridge IELTS 16..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Độ khó (Level)</label>
                            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                                <option value="Foundation">Foundation (Cơ bản)</option>
                                <option value="Intermediate">Intermediate (Trung bình)</option>
                                <option value="Advanced">Advanced (Nâng cao)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung bài đọc (HTML)</label>
                        <textarea required value={html} onChange={e => setHtml(e.target.value)} rows="5" className="w-full border border-gray-300 rounded-md p-3 font-mono text-sm outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="<h2>Tiêu đề</h2> <p>Nội dung đoạn văn...</p>"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Cấu trúc câu hỏi (JSON)</label>
                        <textarea required value={json} onChange={e => setJson(e.target.value)} rows="5" className="w-full border border-gray-300 rounded-md p-3 font-mono text-sm outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder='[ { "type": "multiple_choice", ... } ]'></textarea>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition w-full md:w-auto">
                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminScreen;