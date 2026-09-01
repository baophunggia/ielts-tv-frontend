import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchPublishedBlogBySlug } from '../services/blogPublicService.js';
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

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetchPublishedBlogBySlug(slug)
            .then((data) => {
                if (!data) { setNotFound(true); return; }
                setPost(data);
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

    return (
        <div className="min-h-screen bg-[#fff8e1] pb-16 antialiased" style={BRAND_FONT}>
            <header className="bg-[#faf8ff] sticky top-0 z-50 border-b-4 border-[#1e40a1] shadow-[4px_4px_0px_0px_rgba(30,64,161,0.9)]">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-extrabold text-[#1e40a1] cursor-pointer" onClick={() => navigate('/')}>
                            IELTS-TV
                        </h1>
                        <Link to="/blogs" className="hidden sm:flex items-center gap-1.5 text-[#444652] hover:text-[#1e40a1] text-xs font-bold transition-colors border-l border-slate-300 pl-4">
                            <i className="fa-solid fa-arrow-left"></i> Tất cả bài viết
                        </Link>
                    </div>
                    <Link to="/tests" className="bg-[#1e40a1] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1b21] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        <i className="fa-solid fa-file-lines"></i> Đề thi luyện tập
                    </Link>
                </div>
            </header>

            <article className="max-w-3xl mx-auto px-6 pt-10">
                {post.categories?.name && (
                    <Link to="/blogs" className="inline-block text-[11px] font-bold uppercase tracking-wide bg-[#eef2fc] text-[#1e40a1] px-3 py-1.5 rounded-md mb-4">
                        {post.categories.name}
                    </Link>
                )}
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#2d3748] leading-tight mb-3">{post.title}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-6">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{new Date(post.published_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>

                {post.featured_image_url && (
                    <img src={post.featured_image_url} alt={post.title} className="w-full h-72 md:h-96 object-cover rounded-[24px] mb-8 shadow-md" />
                )}

                {post.excerpt && (
                    <p className="text-lg text-slate-600 italic border-l-4 border-[#ffca28] pl-4 mb-8">{post.excerpt}</p>
                )}

                {/* Nội dung đã sanitize bằng DOMPurify trước khi render — chống XSS */}
                <div
                    className="reading-content prose max-w-none"
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

                <div className="mt-10 flex justify-center">
                    <Link to="/blogs" className="bg-white border-2 border-[#1a1b21]/10 hover:border-[#1e40a1]/40 text-[#2d3748] font-bold px-6 py-3 rounded-full transition-all flex items-center gap-2">
                        <i className="fa-solid fa-arrow-left"></i> Xem thêm bài viết khác
                    </Link>
                </div>
            </article>
        </div>
    );
};

export default BlogDetailScreen;
