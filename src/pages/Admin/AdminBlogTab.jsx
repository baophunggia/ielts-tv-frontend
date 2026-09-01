import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminBlogList, deleteBlog, updateBlog, fetchCategories } from './blogService.js';

// ==========================================================
// TAB "BLOG" TRONG ADMIN PORTAL — danh sách bài viết
// ==========================================================
const STATUS_CONFIG = {
    draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-600' },
    scheduled: { label: 'Đã lên lịch', className: 'bg-[#ffca28]/30 text-amber-700' },
    published: { label: 'Đã đăng', className: 'bg-[#4caf50]/15 text-emerald-700' },
    archived: { label: 'Lưu trữ', className: 'bg-slate-200 text-slate-500' },
};
const PAGE_SIZE = 10;

const AdminBlogTab = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortOrder, setSortOrder] = useState('Updated');
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [postsData, categoriesData] = await Promise.all([fetchAdminBlogList(), fetchCategories()]);
            setPosts(postsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Lỗi tải danh sách blog:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (post) => {
        if (!window.confirm(`Xoá bài viết "${post.title}"? Không thể hoàn tác.`)) return;
        try {
            await deleteBlog(post.id);
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
        } catch (error) {
            alert('Lỗi khi xoá: ' + error.message);
        }
    };

    // TÍNH NĂNG: publish/unpublish nhanh ngay trên danh sách, không cần mở form sửa
    const handleToggleStatus = async (post) => {
        const nextStatus = post.status === 'published' ? 'draft' : 'published';
        const payload = nextStatus === 'published'
            ? { status: 'published', published_at: post.published_at || new Date().toISOString() }
            : { status: 'draft' };
        try {
            await updateBlog(post.id, payload, (post.blog_tags || []).map((t) => t.tag_id));
            setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, ...payload } : p));
        } catch (error) {
            alert('Lỗi khi đổi trạng thái: ' + error.message);
        }
    };

    const filteredSorted = useMemo(() => {
        return posts
            .filter((p) => {
                const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
                const matchesCategory = filterCategory === 'All' || p.category_id === filterCategory;
                return matchesSearch && matchesStatus && matchesCategory;
            })
            .sort((a, b) => {
                if (sortOrder === 'Title-AZ') return a.title.localeCompare(b.title);
                if (sortOrder === 'Title-ZA') return b.title.localeCompare(a.title);
                if (sortOrder === 'Created') return new Date(b.created_at) - new Date(a.created_at);
                return new Date(b.updated_at) - new Date(a.updated_at); // Updated (mặc định)
            });
    }, [posts, searchQuery, filterStatus, filterCategory, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
    const pagedPosts = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset về trang 1 khi bộ lọc thay đổi để tránh "trang trống" khó hiểu
    useEffect(() => { setPage(1); }, [searchQuery, filterStatus, filterCategory, sortOrder]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-extrabold text-[#2d3748]">Quản lý Blog</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/admin/blog/taxonomy')}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                    >
                        <i className="fa-solid fa-tags"></i> Danh mục &amp; Thẻ
                    </button>
                    <button
                        onClick={() => navigate('/admin/blog/new')}
                        className="bg-[#1e40a1] hover:brightness-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                        <i className="fa-solid fa-pen"></i> Viết bài mới
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề bài viết..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e40a1] outline-none text-sm"
                    />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-[#1e40a1]">
                    <option value="All">Tất cả trạng thái</option>
                    <option value="draft">Nháp</option>
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="published">Đã đăng</option>
                    <option value="archived">Lưu trữ</option>
                </select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-[#1e40a1]">
                    <option value="All">Tất cả danh mục</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-[#1e40a1]">
                    <option value="Updated">Sửa gần nhất</option>
                    <option value="Created">Tạo gần nhất</option>
                    <option value="Title-AZ">Tên bài: A - Z</option>
                    <option value="Title-ZA">Tên bài: Z - A</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải...</div>
                ) : filteredSorted.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <i className="fa-regular fa-file-lines text-3xl mb-2 block"></i>
                        {posts.length === 0 ? 'Chưa có bài viết nào. Bấm "Viết bài mới" để bắt đầu.' : 'Không có bài viết nào phù hợp bộ lọc.'}
                    </div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="text-left px-5 py-3 font-bold">Tiêu đề</th>
                                    <th className="text-left px-5 py-3 font-bold">Danh mục</th>
                                    <th className="text-left px-5 py-3 font-bold">Trạng thái</th>
                                    <th className="text-left px-5 py-3 font-bold">Cập nhật</th>
                                    <th className="text-right px-5 py-3 font-bold">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedPosts.map((post) => {
                                    const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                                    return (
                                        <tr key={post.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-[#2d3748] max-w-sm truncate" title={post.title}>
                                                {post.title}
                                                {post.status === 'scheduled' && post.scheduled_at && (
                                                    <div className="text-[11px] font-normal text-amber-600 mt-0.5">
                                                        <i className="fa-regular fa-clock mr-1"></i>
                                                        {new Date(post.scheduled_at).toLocaleString('vi-VN')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500">{post.categories?.name || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.className}`}>{statusCfg.label}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500">{new Date(post.updated_at).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    {(post.status === 'published' || post.status === 'draft') && (
                                                        <button
                                                            onClick={() => handleToggleStatus(post)}
                                                            title={post.status === 'published' ? 'Chuyển về Nháp (Unpublish)' : 'Đăng ngay (Publish)'}
                                                            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${post.status === 'published'
                                                                ? 'border-slate-200 text-slate-500 hover:bg-slate-100'
                                                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                        >
                                                            <i className={`fa-solid ${post.status === 'published' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                                        title="Sửa"
                                                        className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-[#1e40a1]/5 hover:text-[#1e40a1] hover:border-[#1e40a1]/30 flex items-center justify-center transition-all"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(post)}
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

                        {totalPages > 1 && (
                            <div className="flex justify-between items-center px-5 py-3.5 border-t border-slate-100 text-sm text-slate-500">
                                <span>Trang {page}/{totalPages} — {filteredSorted.length} bài viết</span>
                                <div className="flex gap-2">
                                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="w-8 h-8 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"><i className="fa-solid fa-chevron-left"></i></button>
                                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"><i className="fa-solid fa-chevron-right"></i></button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminBlogTab;
