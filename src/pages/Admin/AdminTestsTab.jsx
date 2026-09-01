import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';

// ==========================================================
// TAB "ĐỀ THI" TRONG ADMIN PORTAL
// ==========================================================
// Thay vì quản lý đề thi lẫn trong trang public /tests (dạng card lưới),
// giờ có 1 nơi quản lý riêng dạng LIST (theo hàng), gọn hơn để rà soát nhanh
// nhiều đề thi, có search/filter/sort giống hệt logic ở TestsScreen.jsx +
// icon Sửa/Xoá trên từng hàng + nút "Upload đề thi" ở trên cùng.
// ==========================================================
const LEVEL_MAP = {
    '45': { label: 'Band 4.0 - 5.0', className: 'bg-[#4caf50] text-white' },
    '56': { label: 'Band 5.0 - 6.0', className: 'bg-[#81d4fa] text-[#2d3748]' },
    '78': { label: 'Band 7.0 - 8.0', className: 'bg-[#ffca28] text-[#2d3748]' },
    '89': { label: 'Band 8.0 - 9.0', className: 'bg-[#f48fb1] text-[#2d3748]' },
};

const AdminTestsTab = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [sortOrder, setSortOrder] = useState('Newest');

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reading_tests')
                .select('id, title, level, created_at')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTests(data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách đề thi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (testId, testTitle) => {
        const confirmDelete = window.confirm(`Xoá đề thi "${testTitle}"? Toàn bộ kết quả thi liên quan cũng sẽ bị xoá.`);
        if (!confirmDelete) return;
        try {
            const { error: resultsError } = await supabase.from('test_results').delete().eq('test_id', testId);
            if (resultsError) throw resultsError;
            const { error } = await supabase.from('reading_tests').delete().eq('id', testId);
            if (error) throw error;
            setTests((prev) => prev.filter((t) => t.id !== testId));
        } catch (error) {
            alert('Có lỗi khi xoá: ' + error.message);
        }
    };

    const filteredAndSorted = tests
        .filter((t) => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = filterLevel === 'All' || t.level === filterLevel;
            return matchesSearch && matchesLevel;
        })
        .sort((a, b) => {
            if (sortOrder === 'A-Z') return a.title.localeCompare(b.title);
            if (sortOrder === 'Z-A') return b.title.localeCompare(a.title);
            return new Date(b.created_at) - new Date(a.created_at);
        });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-extrabold text-[#2d3748]">Quản lý đề thi</h1>
                {/* Nút Upload đề thi ở trên cùng, theo đúng yêu cầu */}
                <button
                    onClick={() => navigate('/admin/tests/new')}
                    className="bg-[#1e40a1] hover:brightness-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all w-fit"
                >
                    <i className="fa-solid fa-cloud-arrow-up"></i> Upload đề thi
                </button>
            </div>

            {/* Thanh search + filter — logic giống hệt TestsScreen.jsx */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề đề thi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e40a1] outline-none text-sm"
                    />
                </div>
                <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-[#1e40a1]">
                    <option value="All">Tất cả độ khó</option>
                    <option value="45">Band 4.0 - 5.0</option>
                    <option value="56">Band 5.0 - 6.0</option>
                    <option value="78">Band 7.0 - 8.0</option>
                    <option value="89">Band 8.0 - 9.0</option>
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-[#1e40a1]">
                    <option value="Newest">Mới nhất</option>
                    <option value="A-Z">Tên bài: A - Z</option>
                    <option value="Z-A">Tên bài: Z - A</option>
                </select>
            </div>

            {/* Danh sách dạng LIST/hàng, không phải card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-slate-400">
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải...
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <i className="fa-regular fa-folder-open text-3xl mb-2 block"></i>
                        Không có đề thi nào phù hợp.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="text-left px-5 py-3 font-bold">Tiêu đề</th>
                                <th className="text-left px-5 py-3 font-bold">Độ khó</th>
                                <th className="text-left px-5 py-3 font-bold">Ngày tạo</th>
                                <th className="text-right px-5 py-3 font-bold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSorted.map((test) => {
                                const levelConfig = LEVEL_MAP[test.level] || { label: test.level || '—', className: 'bg-slate-100 text-slate-600' };
                                return (
                                    <tr key={test.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-[#2d3748] max-w-md truncate" title={test.title}>{test.title}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${levelConfig.className}`}>{levelConfig.label}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">{new Date(test.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
                                                    title="Sửa"
                                                    className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-[#1e40a1]/5 hover:text-[#1e40a1] hover:border-[#1e40a1]/30 flex items-center justify-center transition-all"
                                                >
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(test.id, test.title)}
                                                    title="Xoá"
                                                    className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-all"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminTestsTab;
