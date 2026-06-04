// ==========================================
// MÀN HÌNH TRANG CHỦ (DANH SÁCH BÀI THI)
// ==========================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';

const HomeScreen = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // State cho filter, search, sort
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [sortOrder, setSortOrder] = useState('Newest');

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

            {/* Hero Section */}
            {/* <div className="bg-indigo-800 text-white py-16 px-6 text-center shadow-inner">
        <h2 className="text-4xl font-extrabold mb-4">Reading Practice Library</h2>
        <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
          Cải thiện kỹ năng đọc IELTS của bạn với kho đề thi đa dạng, giao diện chia đôi màn hình chuẩn kỳ thi thật.
        </p>
      </div> */}

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
                            <option value="Foundation">Foundation</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
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
                        {filteredAndSortedTests.map((test) => (
                            <div key={test.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${test.level === 'Foundation' ? 'bg-green-100 text-green-700' :
                                            test.level === 'Advanced' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700' // Default / Intermediate
                                            }`}>
                                            {test.level || 'Chưa phân loại'}
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
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                    <Link
                                        to={`/test/${test.id}`}
                                        className="block w-full text-center bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
                                    >
                                        Bắt Đầu Làm Bài <i className="fa-solid fa-arrow-right ml-1"></i>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeScreen;