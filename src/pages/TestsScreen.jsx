// ==========================================
// MÀN HÌNH DANH SÁCH ĐỀ THI (TRƯỚC ĐÂY LÀ TRANG CHỦ)
// ==========================================
// FIX CẤU TRÚC: Trước đây toàn bộ nội dung này (search/filter/lưới đề thi)
// nằm ngay ở route "/" — tức là load ngay khi vào trang, không có landing
// page giới thiệu nào. Nay tách riêng thành route "/tests", còn "/" trở
// thành trang giới thiệu (LandingScreen.jsx) có mục "Resources" dẫn vào đây.
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import { getAdminSession, onAdminAuthChange, adminSignOut } from '../utils/adminAuth';
import { BRAND_FONT } from '../theme/brand.js';

const TestsScreen = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [sortOrder, setSortOrder] = useState('Newest');

    // ĐỒNG BỘ GIAO DIỆN: đổi bảng màu nhãn band điểm từ tông pastel Tailwind
    // mặc định sang đúng các màu thương hiệu (brand colors) đang dùng ở LandingScreen.
    const LEVEL_MAP = {
        '45': { label: 'Band 4.0 - 5.0', className: 'bg-[#4caf50] text-white' },
        '56': { label: 'Band 5.0 - 6.0', className: 'bg-[#81d4fa] text-[#2d3748]' },
        '78': { label: 'Band 7.0 - 8.0', className: 'bg-[#ffca28] text-[#2d3748]' },
        '89': { label: 'Band 8.0 - 9.0', className: 'bg-[#f48fb1] text-[#2d3748]' }
    };

    useEffect(() => {
        fetchTestsList();

        let isMounted = true;
        // Kiểm tra phiên đăng nhập Supabase Auth thật thay vì cờ localStorage tự chế
        getAdminSession().then((session) => {
            if (isMounted) setIsAdmin(!!session);
        });
        const unsubscribe = onAdminAuthChange((session) => {
            setIsAdmin(!!session);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
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

    const handleLogout = async () => {
        await adminSignOut();
        setIsAdmin(false); 
        navigate('/tests');
    };

    const handleDeleteTest = async (testId, testTitle) => {
        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa bài thi "${testTitle}" không?`);
        if (!confirmDelete) return;

        try {
            // FIX BUG: Xoá các kết quả thi (test_results) liên quan TRƯỚC khi xoá đề thi gốc,
            // tránh để lại dữ liệu mồ côi (orphan) khiến các link share cũ bị lỗi không rõ nguyên nhân.
            const { error: resultsError } = await supabase.from('test_results').delete().eq('test_id', testId);
            if (resultsError) throw resultsError;

            const { error } = await supabase.from('reading_tests').delete().eq('id', testId);
            if (error) throw error;
            setTests(tests.filter(test => test.id !== testId));
            alert('Đã xóa bài thi thành công (bao gồm cả kết quả thi liên quan)!');
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
            {/* Nav — đồng bộ với LandingScreen: nền sáng, viền dưới dày, chữ đậm */}
            <header className="bg-[#faf8ff] sticky top-0 z-50 border-b-4 border-[#1e40a1] shadow-[4px_4px_0px_0px_rgba(30,64,161,0.9)]">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-extrabold text-[#1e40a1] cursor-pointer" onClick={() => navigate('/')}>
                            IELTS-TV
                        </h1>
                        {/* Breadcrumb nhỏ để định hướng: trang này là 1 nhánh con của trang chủ */}
                        <Link to="/" className="hidden sm:flex items-center gap-1.5 text-[#444652] hover:text-[#1e40a1] text-xs font-bold transition-colors border-l border-slate-300 pl-4">
                            <i className="fa-solid fa-house"></i> Trang chủ
                        </Link>
                    </div>

                    {isAdmin ? (
                        <div className="flex items-center gap-3">
                            <Link to="/admin" className="bg-[#1e40a1] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                                <i className="fa-solid fa-cloud-arrow-up"></i> Upload tài liệu
                            </Link>
                            <button onClick={handleLogout} className="bg-white border-2 border-[#1a1b21] text-[#2d3748] px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-rose-50 transition-all">
                                <i className="fa-solid fa-right-from-bracket"></i> Thoát
                            </button>
                        </div>
                    ) : (
                        <Link to="/admin" className="bg-[#1e40a1] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                            <i className="fa-solid fa-shield-halved"></i> Admin Portal
                        </Link>
                    )}
                </div>
            </header>

            {/* Header trang thu gọn — cùng tông "heroNavy" với Hero của LandingScreen */}
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
                {/* Thanh công cụ tìm kiếm/lọc — bo góc lớn hơn (24px) đồng bộ ngôn ngữ thiết kế Landing */}
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
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="border border-slate-200 rounded-[16px] px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-[#1e40a1] outline-none cursor-pointer"
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
                            className="border border-slate-200 rounded-[16px] px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-[#1e40a1] outline-none cursor-pointer"
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
                    <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300 shadow-sm">
                        <i className="fa-regular fa-folder-open text-4xl text-slate-300 mb-3"></i>
                        <p className="text-slate-400 font-medium">Không tìm thấy bài thi nào phù hợp với bộ lọc.</p>
                    </div>
                ) : (
                    // Hiệu ứng fade-in nhẹ khi hiển thị grid danh sách
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
                        {filteredAndSortedTests.map((test) => {
                            const levelConfig = LEVEL_MAP[test.level] || { label: test.level || 'Chưa phân loại', className: 'bg-slate-100 text-slate-700' };
                            return (
                                /* Card bo góc 24px, viền dày kiểu "hard outline" đồng bộ Landing */
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
                                        {/* Hiệu ứng đổi màu chữ tiêu đề khi di chuột vào Card */}
                                        <h3 className="text-lg font-bold text-[#2d3748] mb-2 line-clamp-2 group-hover:text-[#1e40a1] transition-colors duration-200" title={test.title}>
                                            {test.title}
                                        </h3>
                                        <p className="text-slate-400 text-xs font-normal">IELTS Reading Full Passage & Questions Practice Set.</p>
                                    </div>

                                    <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 space-y-2.5">
                                        <Link
                                            to={`/test/${test.id}`}
                                            className="block w-full text-center bg-[#ffca28] hover:-translate-y-0.5 text-[#2d3748] font-bold py-2.5 px-4 rounded-[14px] shadow-[3px_3px_0px_0px_#1a1b21] hover:shadow-[4px_4px_0px_0px_#1a1b21] active:translate-y-0.5 active:shadow-none transition-all text-sm"
                                        >
                                            Bắt Đầu Làm Bài <i className="fa-solid fa-arrow-right ml-0.5 group-hover:translate-x-1 transition-transform"></i>
                                        </Link>

                                        {isAdmin && (
                                            <div className="flex gap-2 pt-1 border-t border-slate-200/60 mt-1">
                                                <button
                                                    onClick={() => navigate(`/admin?edit=${test.id}`)}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-[#1e40a1]/5 hover:text-[#1e40a1] hover:border-[#1e40a1]/30 py-2 rounded-[12px] text-xs font-semibold transition-all flex justify-center items-center gap-1 active:scale-95"
                                                >
                                                    <i className="fa-solid fa-pen-to-square"></i> Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTest(test.id, test.title)}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 py-2 rounded-[12px] text-xs font-semibold transition-all flex justify-center items-center gap-1 active:scale-95"
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

export default TestsScreen;