import supabase from '../../supabaseClient';

// ==========================================================
// BLOG SERVICE — tập trung mọi truy vấn Supabase liên quan Blog vào 1 nơi
// ==========================================================
// Theo đúng yêu cầu "React gọi trực tiếp Supabase API, không backend riêng":
// mọi hàm ở đây gọi thẳng supabase-js client hiện có của project. Toàn bộ
// bảo mật (ai được đọc/ghi gì) nằm ở RLS trên Supabase (xem
// supabase/schema_and_policies.sql mục 6-7), KHÔNG dựa vào việc component
// nào gọi hàm nào — kể cả khi frontend có bug, RLS vẫn chặn được ở tầng DB.
// ==========================================================

// ---------- CATEGORIES ----------
export const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data || [];
};

export const createCategory = async (name, slug) => {
    const { data, error } = await supabase.from('categories').insert([{ name, slug }]).select().single();
    if (error) throw error;
    return data;
};

export const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
};

// ---------- TAGS ----------
export const fetchTags = async () => {
    const { data, error } = await supabase.from('tags').select('*').order('name');
    if (error) throw error;
    return data || [];
};

export const createTag = async (name, slug) => {
    const { data, error } = await supabase.from('tags').insert([{ name, slug }]).select().single();
    if (error) throw error;
    return data;
};

export const deleteTag = async (id) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;
};

// ---------- BLOGS ----------
// Admin: lấy TẤT CẢ bài viết (mọi trạng thái) kèm tên category, để hiển thị trong AdminBlogTab.
// RLS "blogs_select_admin_all" cho phép authenticated đọc mọi dòng — nếu chưa đăng nhập
// (hoặc bị đăng xuất giữa chừng) Supabase sẽ tự trả về theo policy anon (chỉ published).
export const fetchAdminBlogList = async () => {
    const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, status, category_id, featured_image_url, published_at, scheduled_at, notified_at, created_at, updated_at, categories(name)')
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const fetchBlogById = async (id) => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*, blog_tags(tag_id)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

// Kiểm tra slug đã tồn tại chưa (trừ chính bài đang sửa) — dùng để validate trước khi lưu
export const isSlugTaken = async (slug, excludeId) => {
    let query = supabase.from('blogs').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).length > 0;
};

// payload: { title, slug, excerpt, content, status, category_id, featured_image_url,
//            seo_title, seo_description, canonical_url, og_title, og_description,
//            og_image_url, published_at, scheduled_at }
// tagIds: mảng id các tag đã chọn (đồng bộ lại bảng nối blog_tags)
export const createBlog = async (payload, tagIds = []) => {
    // author_id KHÔNG gửi lên — trigger enforce_blog_author() ở DB tự gán auth.uid(),
    // gửi lên cũng sẽ bị trigger ghi đè, nhưng không gửi cho rõ ràng ý đồ.
    const { data, error } = await supabase.from('blogs').insert([payload]).select().single();
    if (error) throw error;
    if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id) => ({ blog_id: data.id, tag_id }));
        const { error: tagError } = await supabase.from('blog_tags').insert(rows);
        if (tagError) throw tagError;
    }
    return data;
};

export const updateBlog = async (id, payload, tagIds = []) => {
    const { error } = await supabase.from('blogs').update(payload).eq('id', id);
    if (error) throw error;

    // Đồng bộ lại toàn bộ tag: xoá hết liên kết cũ rồi chèn lại theo lựa chọn mới
    // (đơn giản, đủ nhanh với số lượng tag/bài viết ở quy mô 1 blog cá nhân/lớp học).
    const { error: delError } = await supabase.from('blog_tags').delete().eq('blog_id', id);
    if (delError) throw delError;
    if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id) => ({ blog_id: id, tag_id }));
        const { error: insError } = await supabase.from('blog_tags').insert(rows);
        if (insError) throw insError;
    }
};

export const deleteBlog = async (id) => {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;
};

// ---------- STORAGE (ảnh đại diện) ----------
const MAX_IMAGE_SIZE_MB = 4;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const validateImageFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Chỉ chấp nhận ảnh định dạng JPG, PNG, WEBP hoặc GIF.';
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        return `Ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`;
    }
    return null;
};

export const uploadBlogImage = async (file) => {
    const validationError = validateImageFile(file);
    if (validationError) throw new Error(validationError);

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from('blog-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
    return data.publicUrl;
};
