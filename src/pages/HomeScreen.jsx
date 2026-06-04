// ==========================================
// MÀN HÌNH TRANG CHỦ (DANH SÁCH BÀI THI)
// ==========================================
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const HomeScreen = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    // State cho filter, search, sort
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [sortOrder, setSortOrder] = useState('Newest');

    const LEVEL_MAP = {
        '45': { label: 'Band 4.0 - 5.0', className: 'bg-green-100 text-green-700' },
        '56': { label: 'Band 5.0 - 6.0', className: 'bg-blue-100 text-blue-700' },
        '78': { label: 'Band 7.0 - 8.0', className: 'bg-yellow-100 text-yellow-700' },
        '89': { label: 'Band 8.0 - 9.0', className: 'bg-red-100 text-red-700' }
    };

    useEffect(() => {
        fetchTestsList();
        // Kiểm tra xem trong bộ nhớ trình duyệt có biến isAdminLoggedIn không
        const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
        setIsAdmin(loggedIn);
    }, []);

    const fetchTestsList = async () => {
        try {
            // Chỉ select những trường cần thiết cho list để tối ưu tốc độ
            const { data, error } = await supabase
                .from('reading_tests')
                .select('id, title, level, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTests(data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài thi:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOGIC XÓA BÀI THI DÀNH CHO ADMIN
    // ==========================================
    const handleDeleteTest = async (testId, testTitle) => {
        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa bài thi "${testTitle}" không? Hành động này không thể hoàn tác.`);
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('reading_tests')
                .delete()
                .eq('id', testId);

            if (error) throw error;

            // Xóa thành công, cập nhật lại state danh sách ngay lập tức
            setTests(tests.filter(test => test.id !== testId));
            alert('Đã xóa bài thi thành công!');
        } catch (error) {
            console.error('Lỗi khi xóa bài thi:', error);
            alert('Có lỗi xảy ra khi xóa bài thi. Vui lòng thử lại.');
        }
    };

    // Logic Lọc và Sắp xếp
    const filteredAndSortedTests = tests
        .filter(test => {
            const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = filterLevel === 'All' || test.level === filterLevel;
            return matchesSearch && matchesLevel;
        })
        .sort((a, b) => {
            if (sortOrder === 'A-Z') return a.title.localeCompare(b.title);
            if (sortOrder === 'Z-A') return b.title.localeCompare(a.title);
            // Mặc định Newest (vì đã order by created_at từ Supabase nên chỉ cần giữ nguyên)
            return new Date(b.created_at) - new Date(a.created_at);
        });

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Trang Chủ */}
            <header className="bg-indigo-900 text-white p-6 shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-graduation-cap"></i> IELTS-TV
                    </h1>
                    {isAdmin ? (
                        <Link to="/admin" className="bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded text-indigo-100 font-medium transition flex items-center gap-2">
                            <i className="fa-solid fa-cloud-arrow-up"></i> Upload tài liệu
                        </Link>
                    ) : (
                        <Link to="/admin" className="text-indigo-200 hover:text-white font-medium transition flex items-center gap-2">
                            <i className="fa-solid fa-shield-halved"></i> Admin Portal
                        </Link>
                    )}
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 mt-8">
                {/* Thanh Công Cụ (Search, Filter, Sort) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên bài thi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Newest">Mới nhất</option>
                            <option value="A-Z">A - Z</option>
                            <option value="Z-A">Z - A</option>
                        </select>
                    </div>
                </div>

                {/* Danh Sách Bài Thi */}
                {loading ? (
                    <div className="text-center py-20">
                        <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                        <p className="text-gray-600 font-medium">Đang tải danh sách bài thi...</p>
                    </div>
                ) : filteredAndSortedTests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">Không tìm thấy bài thi nào phù hợp.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedTests.map((test) => {
                            const levelConfig = LEVEL_MAP[test.level] || { label: test.level || 'Chưa phân loại', className: 'bg-gray-100 text-gray-700' };
                            return (
                                <div key={test.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            {/* Hiển thị màu sắc và nhãn đã được map chuẩn */}
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${levelConfig.className}`}>
                                                {levelConfig.label}
                                            </span>
                                            <span className="text-gray-400 text-sm">
                                                <i className="fa-regular fa-calendar mr-1"></i>
                                                {new Date(test.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2" title={test.title}>
                                            {test.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm mb-4">Reading Passage & Questions Set.</p>
                                    </div>

                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
                                        <Link
                                            to={`/test/${test.id}`}
                                            className="block w-full text-center bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
                                        >
                                            Bắt Đầu Làm Bài <i className="fa-solid fa-arrow-right ml-1"></i>
                                        </Link>

                                        {/* CÁC NÚT DÀNH RIÊNG CHO ADMIN */}
                                        {isAdmin && (
                                            <div className="flex gap-2 pt-2 border-t border-gray-200 mt-2">
                                                <button
                                                    onClick={() => navigate(`/admin?edit=${test.id}`)}
                                                    className="flex-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded-lg text-sm font-medium transition flex justify-center items-center gap-1"
                                                >
                                                    <i className="fa-solid fa-pen-to-square"></i> Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTest(test.id, test.title)}
                                                    className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-1.5 rounded-lg text-sm font-medium transition flex justify-center items-center gap-1"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i> Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeScreen;