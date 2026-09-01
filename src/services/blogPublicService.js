import supabase from '../supabaseClient';

// ==========================================================
// BLOG PUBLIC SERVICE — dùng cho khách (chưa đăng nhập): LandingScreen
// (mục Class News), BlogListScreen (/blogs), BlogDetailScreen (/blogs/:slug).
// ==========================================================
// Khác với "pages/Admin/blogService.js" (dành cho admin, thấy mọi trạng
// thái), các hàm ở đây LUÔN lọc thêm status = 'published' và đã tới giờ
// published_at ở phía CLIENT — dù RLS đã tự chặn tầng DB rồi (anon chỉ thấy
// bài published), việc lọc thêm 1 lớp ở đây giúp: nếu 1 admin đang đăng nhập
// mở các trang công khai này, họ vẫn chỉ thấy đúng những gì khách thấy
// (không lẫn bài draft), vì RLS "admin thấy tất cả" sẽ trả về nhiều hơn.
// ==========================================================

const PUBLISHED_SELECT = 'id, title, slug, excerpt, featured_image_url, published_at, category_id, categories(name, slug)';

const isCurrentlyPublished = (post) =>
    post.status === 'published' && (!post.published_at || new Date(post.published_at) <= new Date());

export const fetchLatestPublishedBlogs = async (limit = 3) => {
    const { data, error } = await supabase
        .from('blogs')
        .select(`${PUBLISHED_SELECT}, status`)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return (data || []).filter(isCurrentlyPublished);
};

export const fetchPublishedBlogsPage = async ({ search = '', categoryId = 'All', page = 1, pageSize = 9 }) => {
    let query = supabase
        .from('blogs')
        .select(`${PUBLISHED_SELECT}, status`, { count: 'exact' })
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);
    if (categoryId !== 'All') query = query.eq('category_id', categoryId);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { posts: (data || []).filter(isCurrentlyPublished), total: count || 0 };
};

export const fetchPublishedCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name, slug').order('name');
    if (error) throw error;
    return data || [];
};

export const fetchPublishedBlogBySlug = async (slug) => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*, categories(name, slug), blog_tags(tags(id, name, slug))')
        .eq('slug', slug)
        .single();
    if (error) throw error;
    if (!data || !isCurrentlyPublished(data)) return null; // chưa publish/chưa tới giờ -> coi như không tồn tại với khách
    return data;
};
