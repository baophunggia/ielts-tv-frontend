// ==========================================
// MÀN HÌNH TRANG CHỦ (DANH SÁCH BÀI THI NÂNG CẤP UI/UX)
// ==========================================
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const HomeScreen = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [sortOrder, setSortOrder] = useState('Newest');

    const LEVEL_MAP = {
        '45': { label: 'Band 4.0 - 5.0', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        '56': { label: 'Band 5.0 - 6.0', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
        '78': { label: 'Band 7.0 - 8.0', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
        '89': { label: 'Band 8.0 - 9.0', className: 'bg-rose-50 text-rose-700 border border-rose-200' }
    };

    useEffect(() => {
        fetchTestsList();
        const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
        setIsAdmin(loggedIn);
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
            // Cố tình delay 400ms để người dùng kịp nhìn thấy hiệu ứng Skeleton mượt mà
            setTimeout(() => setLoading(false), 400);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        setIsAdmin(false); 
        navigate('/');
    };

    const handleDeleteTest = async (testId, testTitle) => {
        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa bài thi "${testTitle}" không?`);
        if (!confirmDelete) return;

        try {
            const { error } = await supabase.from('reading_tests').delete().eq('id', testId);
            if (error) throw error;
            setTests(tests.filter(test => test.id !== testId));
            alert('Đã xóa bài thi thành công!');
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra.');
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

    // COMPONENT CON: HIỆN KHUNG XÁM KHI ĐANG LOAD (SKELETON SCREEN)
    const SkeletonLoader = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-64 border border-gray-200 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between mb-4">
                            <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-5/6 mb-2"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-16 antialiased selection:bg-indigo-500 selection:text-white">
            {/* Header Hiện Đại */}
            <header className="bg-indigo-900 text-white p-5 shadow-sm sticky top-0 z-50 backdrop-blur-md bg-indigo-900/95">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">IELTS</span>-TV
                    </h1>
                    
                    {isAdmin ? (
                        <div className="flex items-center gap-3">
                            <Link to="/admin" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 text-sm shadow-sm active:scale-95">
                                <i className="fa-solid fa-cloud-arrow-up"></i> Upload tài liệu
                            </Link>
                            <button onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 text-sm flex items-center gap-2 shadow-sm active:scale-95">
                                <i className="fa-solid fa-right-from-bracket"></i> Thoát
                            </button>
                        </div>
                    ) : (
                        <Link to="/admin" className="text-indigo-200 hover:text-white font-semibold transition-colors duration-200 flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl hover:bg-white/10">
                            <i className="fa-solid fa-shield-halved"></i> Admin Portal
                        </Link>
                    )}
                </div>
            </header>

            {/* MỞ KHÓA HERO SECTION CỰC ĐẸP VỚI GRADIENT */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white py-16 px-6 shadow-md border-b border-indigo-950">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <span className="bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-indigo-500/30">Nền tảng công nghệ mới 2026</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Reading Practice Library</h2>
                    <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
                        Nâng cao tốc độ đọc và kỹ năng xử lý keyword với hệ thống phân tích phòng thi thực tế, chia đôi màn hình thông minh.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
                {/* Thanh Công Cụ mượt mà */}
                <div className="bg-white p-4 rounded-2xl shadow-xl shadow-slate-100/70 border border-slate-200/60 flex flex-col md:flex-row gap-4 mb-10">
                    <div className="flex-1 relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm tiêu đề bài thi hoặc từ khóa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 text-sm"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="All">Tất cả độ khó</option>
                            <option value="45">Band 4.0 - 5.0</option>
                            <option value="56">Band 5.0 - 6.0</option>
                            <option value="78">Band 7.0 - 8.0</option>
                            <option value="89">Band 8.0 - 9.0</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="Newest">Mới nhất</option>
                            <option value="A-Z">Tên bài: A - Z</option>
                            <option value="Z-A">Tên bài: Z - A</option>
                        </select>
                    </div>
                </div>

                {/* Phần Render Dữ Liệu */}
                {loading ? (
                    <SkeletonLoader />
                ) : filteredAndSortedTests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                        <i className="fa-regular fa-folder-open text-4xl text-slate-300 mb-3"></i>
                        <p className="text-slate-400 font-medium">Không tìm thấy bài thi nào phù hợp với bộ lọc.</p>
                    </div>
                ) : (
                    // Hiệu ứng fade-in nhẹ khi hiển thị grid danh sách
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
                        {filteredAndSortedTests.map((test) => {
                            const levelConfig = LEVEL_MAP[test.level] || { label: test.level || 'Chưa phân loại', className: 'bg-slate-100 text-slate-700' };
                            return (
                                /* ÁP DỤNG HIỆU ỨNG HOVER CHO CARD */
                                <div key={test.id} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${levelConfig.className}`}>
                                                {levelConfig.label}
                                            </span>
                                            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                                                <i className="fa-regular fa-calendar"></i>
                                                {new Date(test.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        {/* Hiệu ứng đổi màu chữ tiêu đề khi di chuột vào Card */}
                                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200" title={test.title}>
                                            {test.title}
                                        </h3>
                                        <p className="text-slate-400 text-xs font-normal">IELTS Reading Full Passage & Questions Practice Set.</p>
                                    </div>

                                    <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 space-y-2.5">
                                        <Link
                                            to={`/test/${test.id}`}
                                            className="block w-full text-center bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 hover:shadow-md hover:shadow-indigo-200 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
                                        >
                                            Bắt Đầu Làm Bài <i className="fa-solid fa-arrow-right ml-0.5 group-hover:translate-x-1 transition-transform"></i>
                                        </Link>

                                        {isAdmin && (
                                            <div className="flex gap-2 pt-1 border-t border-slate-200/60 mt-1">
                                                <button
                                                    onClick={() => navigate(`/admin?edit=${test.id}`)}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 py-2 rounded-xl text-xs font-semibold transition-all flex justify-center items-center gap-1 active:scale-95"
                                                >
                                                    <i className="fa-solid fa-pen-to-square"></i> Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTest(test.id, test.title)}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 py-2 rounded-xl text-xs font-semibold transition-all flex justify-center items-center gap-1 active:scale-95"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i> Xóa
                                                </button>
                                            </div>
                                        )}
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

export default HomeScreen;