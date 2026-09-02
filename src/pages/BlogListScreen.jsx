import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPublishedBlogsPage, fetchPublishedCategories } from '../services/blogPublicService.js';
import { BRAND_FONT } from '../theme/brand.js';

// ==========================================================
// TRANG BLOG CÔNG KHAI — /blogs
// ==========================================================
// Hiển thị TẤT CẢ bài viết đã publish cho khách, giao diện đồng bộ với
// TestsScreen.jsx (cùng nav, cùng bảng màu, cùng bố cục toolbar search/filter
// + grid card) để không tạo cảm giác "trang lạ" trong cùng 1 website.
// ==========================================================
const PAGE_SIZE = 9;

const BlogListScreen = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('All');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchPublishedCategories().then(setCategories).catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchPublishedBlogsPage({ search, categoryId, page, pageSize: PAGE_SIZE })
            .then(({ posts, total }) => {
                if (cancelled) return;
                setPosts(posts);
                setTotal(total);
            })
            .catch((err) => console.error('Lỗi tải danh sách blog:', err))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [search, categoryId, page]);

    // Debounce nhẹ ô tìm kiếm để không bắn query liên tục theo từng phím gõ
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const SkeletonLoader = useMemo(() => () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-[24px] h-72 border border-slate-200"></div>
            ))}
        </div>
    ), []);

    return (
        <div className="min-h-screen bg-[#fff8e1] pb-16 antialiased selection:bg-[#1e40a1] selection:text-white" style={BRAND_FONT}>
            <header className="bg-[#faf8ff] sticky top-0 z-50 border-b-4 border-[#1e40a1] shadow-[4px_4px_0px_0px_rgba(30,64,161,0.9)]">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-extrabold text-[#1e40a1] cursor-pointer" onClick={() => navigate('/')}>
                            IELTS-TV
                        </h1>
                        <Link to="/" className="hidden sm:flex items-center gap-1.5 text-[#444652] hover:text-[#1e40a1] text-xs font-bold transition-colors border-l border-slate-300 pl-4">
                            <i className="fa-solid fa-house"></i> Trang chủ
                        </Link>
                    </div>
                    <Link to="/tests" className="bg-[#1e40a1] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        <i className="fa-solid fa-file-lines"></i> Đề thi luyện tập
                    </Link>
                </div>
            </header>

            <div className="bg-[#36517e] text-white py-14 px-6 border-b border-[#2a4365]">
                <div className="max-w-4xl mx-auto text-center space-y-3">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        <span className="text-[#ffca28]">Blog</span> IELTS-TV
                    </h2>
                    <p className="text-slate-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        Chia sẻ kinh nghiệm, mẹo làm bài Reading và tin tức mới nhất từ đội ngũ IELTS-TV.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-7 relative z-10">
                <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-slate-200/70 border border-slate-200/60 flex flex-col md:flex-row gap-4 mb-10">
                    <div className="flex-1 relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-[16px] focus:ring-2 focus:ring-[#1e40a1] focus:border-[#1e40a1] outline-none transition-all text-slate-700 text-sm"
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                        className="border border-slate-200 rounded-[16px] px-4 py-2.5 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-[#1e40a1] outline-none cursor-pointer"
                    >
                        <option value="All">Tất cả danh mục</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {loading ? (
                    <SkeletonLoader />
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300 shadow-sm">
                        <i className="fa-regular fa-folder-open text-4xl text-slate-300 mb-3"></i>
                        <p className="text-slate-400 font-medium">
                            {search || categoryId !== 'All' ? 'Không tìm thấy bài viết nào phù hợp.' : 'Chưa có bài viết nào được đăng.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blogs/${post.slug}`}
                                    className="bg-white rounded-[24px] border-2 border-[#1a1b21]/10 hover:border-[#1e40a1]/40 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group"
                                >
                                    <div className="h-40 bg-slate-100 overflow-hidden">
                                        {post.featured_image_url ? (
                                            <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#81d4fa] to-[#1e40a1]">
                                                <i className="fa-solid fa-newspaper text-3xl text-white/70"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        {post.categories?.name && (
                                            <span className="inline-block w-fit text-[11px] font-bold uppercase tracking-wide bg-[#eef2fc] text-[#1e40a1] px-2.5 py-1 rounded-md mb-3">
                                                {post.categories.name}
                                            </span>
                                        )}
                                        <h3 className="text-lg font-bold text-[#2d3748] mb-2 line-clamp-2 group-hover:text-[#1e40a1] transition-colors duration-200">
                                            {post.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                                        <p className="text-slate-400 text-xs mt-3 flex items-center gap-1.5">
                                            <i className="fa-regular fa-calendar"></i>
                                            {new Date(post.published_at).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-10">
                                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="w-10 h-10 rounded-xl border border-slate-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50">
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <span className="text-sm font-bold text-slate-600 px-3">Trang {page}/{totalPages}</span>
                                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="w-10 h-10 rounded-xl border border-slate-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50">
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default BlogListScreen;
