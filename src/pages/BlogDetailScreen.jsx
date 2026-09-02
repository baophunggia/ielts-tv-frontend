import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchPublishedBlogBySlug, fetchAdjacentPublishedPosts, subscribeToNewsletter } from '../services/blogPublicService.js';
import { BRAND_FONT } from '../theme/brand.js';

// ==========================================================
// TRANG CHI TIẾT BÀI VIẾT — /blogs/:slug
// ==========================================================
// Nội dung render qua dangerouslySetInnerHTML NHƯNG luôn đi qua DOMPurify
// trước — bắt buộc theo yêu cầu chống XSS trong spec, dù nội dung chỉ do
// admin (đã qua RLS xác thực) tạo ra, vẫn sanitize ở nơi hiển thị công khai
// để phòng vệ nhiều lớp (defense in depth).
//
// SEO: cập nhật document.title + các thẻ <meta> liên quan bằng useEffect vì
// đây là SPA client-side render, không có SSR. Cách này giúp tab trình duyệt
// hiện đúng tiêu đề và các công cụ đọc meta lúc trang đã tải xong vẫn thấy
// đúng thông tin — nhưng CHƯA tối ưu cho crawler đọc HTML tĩnh ban đầu (cần
// SSR/prerender nếu muốn SEO tối đa, ngoài phạm vi bản này).
// ==========================================================
const BlogDetailScreen = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // TÍNH NĂNG MỚI: điều hướng bài trước/sau theo dòng thời gian đăng bài
    const [adjacentPosts, setAdjacentPosts] = useState({ olderPost: null, newerPost: null });

    // TÍNH NĂNG MỚI: form đăng ký nhận bài viết mới qua email
    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [subscribeState, setSubscribeState] = useState({ status: 'idle', msg: '' }); // idle | loading | success | error

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        setAdjacentPosts({ olderPost: null, newerPost: null });
        fetchPublishedBlogBySlug(slug)
            .then((data) => {
                if (!data) { setNotFound(true); return; }
                setPost(data);
                // Tải bài trước/sau song song, không chặn hiển thị nội dung chính
                fetchAdjacentPublishedPosts(data).then(setAdjacentPosts).catch((err) => console.error('Lỗi tải bài trước/sau:', err));
            })
            .catch((err) => { console.error('Lỗi tải bài viết:', err); setNotFound(true); })
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        if (!post) return;
        const prevTitle = document.title;
        document.title = post.seo_title || post.title;

        const setMeta = (name, content, isProperty = false) => {
            if (!content) return null;
            const attr = isProperty ? 'property' : 'name';
            let tag = document.querySelector(`meta[${attr}="${name}"]`);
            const isNew = !tag;
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute(attr, name);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
            return isNew ? tag : null;
        };

        const createdTags = [
            setMeta('description', post.seo_description || post.excerpt),
            setMeta('og:title', post.og_title || post.title, true),
            setMeta('og:description', post.og_description || post.excerpt, true),
            setMeta('og:image', post.og_image_url || post.featured_image_url, true),
        ].filter(Boolean);

        let canonicalTag = null;
        if (post.canonical_url) {
            canonicalTag = document.querySelector('link[rel="canonical"]');
            const isNewCanonical = !canonicalTag;
            if (!canonicalTag) {
                canonicalTag = document.createElement('link');
                canonicalTag.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalTag);
            }
            canonicalTag.setAttribute('href', post.canonical_url);
            if (!isNewCanonical) canonicalTag = null; // chỉ tự xoá tag do chính mình tạo mới
        }

        return () => {
            document.title = prevTitle;
            createdTags.forEach((tag) => tag.remove());
            if (canonicalTag) canonicalTag.remove();
        };
    }, [post]);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        const email = subscribeEmail.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setSubscribeState({ status: 'error', msg: 'Vui lòng nhập đúng định dạng email.' });
            return;
        }
        setSubscribeState({ status: 'loading', msg: '' });
        try {
            await subscribeToNewsletter(email);
            setSubscribeState({ status: 'success', msg: 'Đăng ký thành công! Bạn sẽ nhận được bài viết mới sớm nhất.' });
            setSubscribeEmail('');
        } catch (err) {
            setSubscribeState({ status: 'error', msg: err.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fff8e1] flex items-center justify-center" style={BRAND_FONT}>
                <i className="fa-solid fa-spinner fa-spin text-3xl text-[#1e40a1]"></i>
            </div>
        );
    }

    if (notFound || !post) {
        return (
            <div className="min-h-screen bg-[#fff8e1] flex flex-col items-center justify-center gap-4 p-6 text-center" style={BRAND_FONT}>
                <i className="fa-regular fa-file-lines text-6xl text-slate-300"></i>
                <h2 className="text-2xl font-extrabold text-[#2d3748]">Không tìm thấy bài viết</h2>
                <p className="text-slate-500 max-w-md">Bài viết này không tồn tại, đã bị gỡ, hoặc chưa được đăng.</p>
                <Link to="/blogs" className="mt-2 bg-[#1e40a1] text-white font-bold px-6 py-2.5 rounded-full shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                    Xem tất cả bài viết
                </Link>
            </div>
        );
    }

    const tags = (post.blog_tags || []).map((bt) => bt.tags).filter(Boolean);
    const { olderPost, newerPost } = adjacentPosts;

    return (
        <div className="min-h-screen bg-[#fff8e1] pb-16 antialiased" style={BRAND_FONT}>
            <header className="bg-[#faf8ff] sticky top-0 z-50 border-b-4 border-[#1e40a1] shadow-[4px_4px_0px_0px_rgba(30,64,161,0.9)]">
                {/* ĐỒNG BỘ ĐỘ RỘNG: max-w-7xl khớp với LandingScreen.jsx (trước đây dùng
                    max-w-6xl, lệch với các section trên trang chủ). */}
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e40a1] cursor-pointer shrink-0" onClick={() => navigate('/')}>
                            IELTS-TV
                        </h1>
                        <Link to="/blogs" className="hidden sm:flex items-center gap-1.5 text-[#444652] hover:text-[#1e40a1] text-xs font-bold transition-colors border-l border-slate-300 pl-4 shrink-0">
                            <i className="fa-solid fa-arrow-left"></i> Tất cả bài viết
                        </Link>
                    </div>
                    <Link to="/tests" className="bg-[#1e40a1] text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0">
                        <i className="fa-solid fa-file-lines"></i> <span className="hidden xs:inline">Đề thi luyện tập</span>
                    </Link>
                </div>
            </header>

            {/* ĐỒNG BỘ ĐỘ RỘNG: bọc ngoài max-w-7xl (khớp Landing), nội dung bài viết
                (article) giữ max-w-3xl riêng để dễ đọc — giống cách các trang blog lớn
                (Medium, Substack...) vẫn căn giữa cột chữ hẹp trong khung trang rộng hơn,
                không phải "không đồng bộ" mà là chủ đích cho dễ đọc văn bản dài. */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <article className="max-w-3xl mx-auto pt-8 sm:pt-10">
                    {post.categories?.name && (
                        <Link to="/blogs" className="inline-block text-[11px] font-bold uppercase tracking-wide bg-[#eef2fc] text-[#1e40a1] px-3 py-1.5 rounded-md mb-4">
                            {post.categories.name}
                        </Link>
                    )}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2d3748] leading-tight mb-3 break-words">{post.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mb-6">
                        <i className="fa-regular fa-calendar"></i>
                        <span>{new Date(post.published_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {post.featured_image_url && (
                        <img src={post.featured_image_url} alt={post.title} className="w-full h-52 sm:h-72 md:h-96 object-cover rounded-[16px] sm:rounded-[24px] mb-6 sm:mb-8 shadow-md" />
                    )}

                    {post.excerpt && (
                        <p className="text-base sm:text-lg text-slate-600 italic border-l-4 border-[#ffca28] pl-4 mb-6 sm:mb-8">{post.excerpt}</p>
                    )}

                    {/* Nội dung đã sanitize bằng DOMPurify trước khi render — chống XSS.
                        FIX RESPONSIVE: bỏ class "prose" (không có tác dụng gì vì project
                        không cài @tailwindcss/typography) — style thật nằm ở .reading-content
                        trong index.css, đã bổ sung đầy đủ h3/list/quote/code/link/ẢNH RESPONSIVE
                        (trước đây ảnh chèn trong bài không giới hạn max-width, gây tràn ngang
                        trên mobile — đây là nguyên nhân chính của lỗi "không responsive"). */}
                    <div
                        className="reading-content"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
                    />

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-slate-200">
                            {tags.map((tag) => (
                                <span key={tag.id} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                    #{tag.name}
                                </span>
                            ))}
                        </div>
                    )}
                </article>

                {/* ============ TÍNH NĂNG MỚI: ĐIỀU HƯỚNG BÀI TRƯỚC / BÀI SAU ============ */}
                {/* Chuẩn logic điều hướng blog: "Bài trước" = đăng sớm hơn, "Bài sau" =
                    đăng muộn hơn bài đang xem (theo published_at) — không phải theo id. */}
                {(olderPost || newerPost) && (
                    <div className="max-w-3xl mx-auto mt-10 pt-8 border-t-2 border-[#1a1b21]/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {olderPost ? (
                            <Link
                                to={`/blogs/${olderPost.slug}`}
                                className="group bg-white border-2 border-[#1a1b21]/10 hover:border-[#1e40a1]/40 rounded-2xl p-5 flex flex-col gap-1.5 transition-all hover:-translate-y-0.5"
                            >
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <i className="fa-solid fa-arrow-left"></i> Bài trước
                                </span>
                                <span className="font-bold text-[#2d3748] group-hover:text-[#1e40a1] line-clamp-2 transition-colors">{olderPost.title}</span>
                            </Link>
                        ) : <div className="hidden sm:block" />}

                        {newerPost && (
                            <Link
                                to={`/blogs/${newerPost.slug}`}
                                className="group bg-white border-2 border-[#1a1b21]/10 hover:border-[#1e40a1]/40 rounded-2xl p-5 flex flex-col gap-1.5 text-left sm:text-right transition-all hover:-translate-y-0.5"
                            >
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 sm:justify-end">
                                    Bài sau <i className="fa-solid fa-arrow-right"></i>
                                </span>
                                <span className="font-bold text-[#2d3748] group-hover:text-[#1e40a1] line-clamp-2 transition-colors">{newerPost.title}</span>
                            </Link>
                        )}
                    </div>
                )}

                {/* ============ TÍNH NĂNG MỚI: FORM ĐĂNG KÝ NHẬN BÀI VIẾT MỚI ============ */}
                {/* Hiện tại chỉ LƯU email vào bảng "subscribers". Việc tự động gửi email
                    khi có bài mới sẽ triển khai sau (cần Edge Function + dịch vụ gửi mail). */}
                <div className="max-w-3xl mx-auto mt-8">
                    <div className="bg-[#2a4365] rounded-[24px] p-6 sm:p-10 text-center">
                        <i className="fa-solid fa-envelope-open-text text-3xl text-[#ffca28] mb-3"></i>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">Nhận bài viết mới qua email</h3>
                        <p className="text-slate-300 text-sm mb-5 max-w-md mx-auto">Đăng ký để nhận thông báo mỗi khi IELTS-TV đăng bài viết mới, không spam.</p>

                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                            <input
                                type="email"
                                required
                                value={subscribeEmail}
                                onChange={(e) => setSubscribeEmail(e.target.value)}
                                placeholder="Nhập email của bạn..."
                                disabled={subscribeState.status === 'loading'}
                                className="flex-1 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#ffca28] disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={subscribeState.status === 'loading'}
                                className="bg-[#ffca28] text-[#2d3748] font-bold px-6 py-3 rounded-full shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-60 shrink-0"
                            >
                                {subscribeState.status === 'loading' ? 'Đang gửi...' : 'Đăng ký'}
                            </button>
                        </form>

                        {subscribeState.msg && (
                            <p className={`text-sm font-semibold mt-3 ${subscribeState.status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
                                {subscribeState.msg}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <Link to="/blogs" className="bg-white border-2 border-[#1a1b21]/10 hover:border-[#1e40a1]/40 text-[#2d3748] font-bold px-6 py-3 rounded-full transition-all flex items-center gap-2">
                        <i className="fa-solid fa-arrow-left"></i> Xem thêm bài viết khác
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BlogDetailScreen;
