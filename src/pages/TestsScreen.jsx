// ==========================================
// MÀN HÌNH DANH SÁCH ĐỀ THI (PUBLIC — KHÔNG CÒN CONTROL ADMIN)
// ==========================================
// FIX CẤU TRÚC: trước đây trang này vừa là trang public vừa lồng control
// Sửa/Xoá cho admin (chỉ hiện khi đã đăng nhập). Giờ có Admin Portal riêng
// biệt hoàn chỉnh (/admin/tests) để quản lý đề thi dạng list + search/filter,
// nên trang public này được đơn giản hoá lại — chỉ để học viên duyệt & làm bài.
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import { BRAND_FONT } from '../theme/brand.js';

const LEVEL_MAP = {
    '45': { label: 'Band 4.0 - 5.0', className: 'bg-[#4caf50] text-white' },
    '56': { label: 'Band 5.0 - 6.0', className: 'bg-[#81d4fa] text-[#2d3748]' },
    '78': { label: 'Band 7.0 - 8.0', className: 'bg-[#ffca28] text-[#2d3748]' },
    '89': { label: 'Band 8.0 - 9.0', className: 'bg-[#f48fb1] text-[#2d3748]' }
};

const TestsScreen = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [sortOrder, setSortOrder] = useState('Newest');

    useEffect(() => {
        fetchTestsList();
    }, []);

    const fetchTestsList = async () => {
        try {
            const { data, error } = await supabase
                .from('reading_tests')
                .select('id, title, level, created_at')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTests(data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài thi:', error);
        } finally {
            setTimeout(() => setLoading(false), 400);
        }
    };

    const filteredAndSortedTests = tests
        .filter(test => {
            const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = filterLevel === 'All' || test.level === filterLevel;
            return matchesSearch && matchesLevel;
        })
        .sort((a, b) => {
            if (sortOrder === 'A-Z') return a.title.localeCompare(b.title);
            if (sortOrder === 'Z-A') return b.title.localeCompare(a.title);
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const SkeletonLoader = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-[24px] h-64 border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between mb-4">
                            <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                            <div className="h-4 w-16 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-5 bg-slate-200 rounded w-5/6 mb-2"></div>
                        <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-10 bg-slate-200 rounded-[16px] w-full"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fff8e1] pb-16 antialiased selection:bg-[#1e40a1] selection:text-white" style={BRAND_FONT}>
            <header className="bg-[#faf8ff] sticky top-0 z-50 border-b-4 border-[#1e40a1] shadow-[4px_4px_0px_0px_rgba(30,64,161,0.9)]">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-extrabold text-[#1e40a1] cursor-pointer" onClick={() => navigate('/')}>
                            IELTS-TV
                        </h1>
                        <Link to="/" className="hidden sm:flex items-center gap-1.5 text-[#444652] hover:text-[#1e40a1] text-xs font-bold transition-colors border-l border-slate-300 pl-4">
                            <i className="fa-solid fa-house"></i> Trang chủ
                        </Link>
                    </div>
                    <Link to="/admin" className="bg-[#1e40a1] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        <i className="fa-solid fa-shield-halved"></i> Admin Portal
                    </Link>
                </div>
            </header>

            <div className="bg-[#36517e] text-white py-14 px-6 border-b border-[#2a4365]">
                <div className="max-w-4xl mx-auto text-center space-y-3">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        Danh sách <span className="text-[#ffca28]">đề thi</span> luyện tập
                    </h2>
                    <p className="text-slate-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        Chọn 1 đề thi bên dưới để bắt đầu luyện tập, hoặc dùng bộ lọc để tìm đúng trình độ của bạn.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-7 relative z-10">
                <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-slate-200/70 border border-slate-200/60 flex flex-col md:flex-row gap-4 mb-10">
                    <div className="flex-1 relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm tiêu đề bài thi hoặc từ khóa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-[16px] focus:ring-2 focus:ring-[#1e40a1] focus:border-[#1e40a1] outline-none transition-all text-slate-700 text-sm"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="border border-slate-200 rounded-[16px] px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-[#1e40a1] outline-none cursor-pointer">
                            <option value="All">Tất cả độ khó</option>
                            <option value="45">Band 4.0 - 5.0</option>
                            <option value="56">Band 5.0 - 6.0</option>
                            <option value="78">Band 7.0 - 8.0</option>
                            <option value="89">Band 8.0 - 9.0</option>
                        </select>
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border border-slate-200 rounded-[16px] px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-[#1e40a1] outline-none cursor-pointer">
                            <option value="Newest">Mới nhất</option>
                            <option value="A-Z">Tên bài: A - Z</option>
                            <option value="Z-A">Tên bài: Z - A</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <SkeletonLoader />
                ) : filteredAndSortedTests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300 shadow-sm">
                        <i className="fa-regular fa-folder-open text-4xl text-slate-300 mb-3"></i>
                        <p className="text-slate-400 font-medium">Không tìm thấy bài thi nào phù hợp với bộ lọc.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
                        {filteredAndSortedTests.map((test) => {
                            const levelConfig = LEVEL_MAP[test.level] || { label: test.level || 'Chưa phân loại', className: 'bg-slate-100 text-slate-700' };
                            return (
                                <div key={test.id} className="bg-white rounded-[24px] border-2 border-[#1a1b21]/10 hover:border-[#1e40a1]/40 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${levelConfig.className}`}>
                                                {levelConfig.label}
                                            </span>
                                            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                                                <i className="fa-regular fa-calendar"></i>
                                                {new Date(test.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#2d3748] mb-2 line-clamp-2 group-hover:text-[#1e40a1] transition-colors duration-200" title={test.title}>
                                            {test.title}
                                        </h3>
                                        <p className="text-slate-400 text-xs font-normal">IELTS Reading Full Passage & Questions Practice Set.</p>
                                    </div>
                                    <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100">
                                        <Link
                                            to={`/test/${test.id}`}
                                            className="block w-full text-center bg-[#ffca28] hover:-translate-y-0.5 text-[#2d3748] font-bold py-2.5 px-4 rounded-[14px] shadow-[3px_3px_0px_0px_#1a1b21] hover:shadow-[4px_4px_0px_0px_#1a1b21] active:translate-y-0.5 active:shadow-none transition-all text-sm"
                                        >
                                            Bắt Đầu Làm Bài <i className="fa-solid fa-arrow-right ml-0.5 group-hover:translate-x-1 transition-transform"></i>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestsScreen;
