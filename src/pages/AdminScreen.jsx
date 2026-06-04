// ==========================================
// MÀN HÌNH ADMIN UPLOAD ĐỀ MỚI
// ==========================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';

const AdminScreen = () => {
    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('Intermediate'); // Thêm trường Level
    const [html, setHtml] = useState('');
    const [json, setJson] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        if (password !== 'admin123') {
            setStatus({ type: 'error', msg: 'Sai mật khẩu!' });
            return;
        }

        try {
            setIsSubmitting(true);
            const parsedJson = JSON.parse(json);

            // Insert kèm trường level
            const { error } = await supabase
                .from('reading_tests')
                .insert([{ title, level, passage_html: html, questions_json: parsedJson }]);

            if (error) throw error;

            setStatus({ type: 'success', msg: 'Upload thành công! Trở về trang chủ để xem.' });
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

    return (
        <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800"><i className="fa-solid fa-upload mr-2 text-indigo-600"></i>Quản trị viên - Upload đề thi</h2>
                    <Link to="/" className="text-indigo-600 hover:underline font-medium"><i className="fa-solid fa-arrow-left mr-2"></i>Về trang chủ</Link>
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
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu xác thực</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full md:w-1/3 border border-gray-300 rounded-md p-3 outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nhập mật khẩu..." />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition">
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng Đề Thi Lên Hệ Thống'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminScreen;