import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { slugify, slugifyUnique } from '../../utils/blogSlug.js';
import {
    fetchCategories, createCategory, fetchTags, createTag,
    fetchBlogById, createBlog, updateBlog, isSlugTaken,
    uploadBlogImage, validateImageFile,
} from './blogService.js';

// ==========================================================
// FORM VIẾT/SỬA BÀI BLOG — 5 SECTION THEO ĐÚNG SPEC:
// Content / Publishing / Category & Tags / Featured Image / SEO
// ==========================================================
const QUILL_MODULES = {
    toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean'],
    ],
};

const EMPTY_FORM = {
    title: '', slug: '', excerpt: '', content: '',
    status: 'draft', category_id: '', featured_image_url: '',
    seo_title: '', seo_description: '', canonical_url: '',
    og_title: '', og_description: '', og_image_url: '',
    published_at: '', scheduled_at: '',
};

const AdminBlogForm = () => {
    const navigate = useNavigate();
    const { id: editId } = useParams();

    const [form, setForm] = useState(EMPTY_FORM);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newTagName, setNewTagName] = useState('');

    const [loading, setLoading] = useState(!!editId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [showPreview, setShowPreview] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!editId);

    useEffect(() => {
        loadTaxonomies();
        if (editId) loadExistingPost(editId);
    }, [editId]);

    const loadTaxonomies = async () => {
        try {
            const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()]);
            setCategories(cats);
            setTags(tgs);
        } catch (err) {
            console.error('Lỗi tải danh mục/thẻ:', err);
        }
    };

    const loadExistingPost = async (id) => {
        try {
            const data = await fetchBlogById(id);
            setForm({
                title: data.title || '', slug: data.slug || '', excerpt: data.excerpt || '', content: data.content || '',
                status: data.status || 'draft', category_id: data.category_id || '', featured_image_url: data.featured_image_url || '',
                seo_title: data.seo_title || '', seo_description: data.seo_description || '', canonical_url: data.canonical_url || '',
                og_title: data.og_title || '', og_description: data.og_description || '', og_image_url: data.og_image_url || '',
                published_at: data.published_at ? data.published_at.slice(0, 16) : '',
                scheduled_at: data.scheduled_at ? data.scheduled_at.slice(0, 16) : '',
            });
            setSelectedTagIds((data.blog_tags || []).map((t) => t.tag_id));
        } catch (err) {
            setStatus({ type: 'error', msg: 'Không tải được bài viết: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleTitleChange = (value) => {
        updateField('title', value);
        // Tự động sinh slug theo tiêu đề CHO ĐẾN KHI người dùng tự tay sửa slug
        if (!slugManuallyEdited) {
            updateField('slug', slugify(value));
        }
    };

    const toggleTag = (tagId) => {
        setSelectedTagIds((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const cat = await createCategory(newCategoryName.trim(), slugifyUnique(newCategoryName));
            setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
            updateField('category_id', cat.id);
            setNewCategoryName('');
        } catch (err) {
            alert('Lỗi khi tạo danh mục: ' + err.message);
        }
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const tag = await createTag(newTagName.trim(), slugifyUnique(newTagName));
            setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedTagIds((prev) => [...prev, tag.id]);
            setNewTagName('');
        } catch (err) {
            alert('Lỗi khi tạo thẻ: ' + err.message);
        }
    };

    const handleImageUpload = useCallback(async (file, field) => {
        const validationError = validateImageFile(file);
        if (validationError) {
            alert(validationError);
            return;
        }
        setUploadingImage(true);
        try {
            const url = await uploadBlogImage(file);
            updateField(field, url);
        } catch (err) {
            alert('Lỗi khi tải ảnh lên: ' + err.message);
        } finally {
            setUploadingImage(false);
        }
    }, []);

    const buildPayload = (overrideStatus) => {
        const nowIso = new Date().toISOString();
        const finalStatus = overrideStatus || form.status;
        const payload = {
            title: form.title.trim(),
            slug: form.slug.trim(),
            excerpt: form.excerpt.trim(),
            content: form.content,
            status: finalStatus,
            category_id: form.category_id || null,
            featured_image_url: form.featured_image_url || null,
            seo_title: form.seo_title.trim() || null,
            seo_description: form.seo_description.trim() || null,
            canonical_url: form.canonical_url.trim() || null,
            og_title: form.og_title.trim() || null,
            og_description: form.og_description.trim() || null,
            og_image_url: form.og_image_url.trim() || null,
            scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        };
        // published_at: tự gán thời điểm hiện tại khi publish lần đầu, giữ nguyên nếu đã có
        if (finalStatus === 'published') {
            payload.published_at = form.published_at ? new Date(form.published_at).toISOString() : nowIso;
        } else {
            payload.published_at = form.published_at ? new Date(form.published_at).toISOString() : null;
        }
        return payload;
    };

    const handleSave = async (e, overrideStatus) => {
        e?.preventDefault();
        setStatus({ type: '', msg: '' });

        if (!form.title.trim()) return setStatus({ type: 'error', msg: 'Vui lòng nhập tiêu đề bài viết!' });
        if (!form.slug.trim()) return setStatus({ type: 'error', msg: 'Vui lòng nhập slug (đường dẫn URL)!' });
        if (!/^[a-z0-9-]+$/.test(form.slug.trim())) return setStatus({ type: 'error', msg: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.' });
        if ((overrideStatus || form.status) === 'scheduled' && !form.scheduled_at) {
            return setStatus({ type: 'error', msg: 'Vui lòng chọn thời gian lên lịch đăng!' });
        }

        try {
            setIsSubmitting(true);
            const taken = await isSlugTaken(form.slug.trim(), editId);
            if (taken) {
                setStatus({ type: 'error', msg: 'Slug này đã được dùng cho bài viết khác. Vui lòng đổi slug khác.' });
                return;
            }

            const payload = buildPayload(overrideStatus);
            if (editId) {
                await updateBlog(editId, payload, selectedTagIds);
            } else {
                await createBlog(payload, selectedTagIds);
            }
            setStatus({ type: 'success', msg: editId ? 'Đã cập nhật bài viết!' : 'Đã tạo bài viết!' });
            setTimeout(() => navigate('/admin/blog'), 800);
        } catch (err) {
            setStatus({ type: 'error', msg: 'Lỗi: ' + err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải bài viết...</div>;
    }

    const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1e40a1] focus:border-[#1e40a1] bg-white";
    const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <button onClick={() => navigate('/admin/blog')} className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-slate-600 font-medium transition text-sm cursor-pointer flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-left"></i> Quay lại danh sách
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{editId ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h2>
                <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                    <i className={`fa-solid ${showPreview ? 'fa-pen' : 'fa-eye'}`}></i> {showPreview ? 'Sửa tiếp' : 'Xem trước'}
                </button>
            </div>

            {status.msg && (
                <div className={`p-4 mb-6 rounded font-medium ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{status.msg}</div>
            )}

            {showPreview ? (
                // TÍNH NĂNG "PREVIEW": render nội dung y hệt cách sẽ hiện trên trang blog công khai sau này.
                // Sanitize bằng DOMPurify trước khi render để chống XSS, theo đúng yêu cầu bảo mật trong spec.
                <div className="prose max-w-none border border-slate-200 rounded-xl p-8">
                    {form.featured_image_url && <img src={form.featured_image_url} alt={form.title} className="w-full h-72 object-cover rounded-xl mb-6" />}
                    <h1 className="text-3xl font-extrabold text-[#2d3748] mb-2">{form.title || '(Chưa có tiêu đề)'}</h1>
                    <p className="text-slate-500 italic mb-6">{form.excerpt}</p>
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.content) }} />
                </div>
            ) : (
                <form onSubmit={(e) => handleSave(e)} className="space-y-8">
                    {/* SECTION 1: CONTENT */}
                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fa-solid fa-pen-nib text-[#1e40a1]"></i> Nội dung</h3>
                        <div>
                            <label className={labelClass}>Tiêu đề *</label>
                            <input type="text" required value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} placeholder="VD: 5 mẹo làm dạng Matching Headings hiệu quả" />
                        </div>
                        <div>
                            <label className={labelClass}>Slug (đường dẫn URL) *</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm shrink-0">/blog/</span>
                                <input
                                    type="text"
                                    required
                                    value={form.slug}
                                    onChange={(e) => { setSlugManuallyEdited(true); updateField('slug', slugify(e.target.value)); }}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Mô tả ngắn (Excerpt)</label>
                            <textarea rows={2} value={form.excerpt} onChange={(e) => updateField('excerpt', e.target.value)} className={inputClass} placeholder="Câu tóm tắt hiện ở trang danh sách blog..." />
                        </div>
                        <div>
                            <label className={labelClass}>Nội dung bài viết</label>
                            <div className="bg-white rounded-md">
                                <ReactQuill theme="snow" value={form.content} onChange={(v) => updateField('content', v)} modules={QUILL_MODULES} className="h-64 mb-12" />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: PUBLISHING */}
                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fa-solid fa-paper-plane text-[#1e40a1]"></i> Xuất bản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Trạng thái</label>
                                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass + ' cursor-pointer'}>
                                    <option value="draft">Nháp (Draft)</option>
                                    <option value="scheduled">Lên lịch (Scheduled)</option>
                                    <option value="published">Đăng ngay (Published)</option>
                                    <option value="archived">Lưu trữ (Archived)</option>
                                </select>
                            </div>
                            {form.status === 'scheduled' && (
                                <div>
                                    <label className={labelClass}>Thời gian lên lịch đăng *</label>
                                    <input type="datetime-local" value={form.scheduled_at} onChange={(e) => updateField('scheduled_at', e.target.value)} className={inputClass} />
                                    <p className="text-[11px] text-amber-600 mt-1">
                                        <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                        Bản hiện tại chỉ LƯU thời gian này — việc tự động chuyển sang "Đã đăng" đúng giờ
                                        cần bổ sung Supabase Edge Function/cron (xem README/báo cáo bàn giao).
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* SECTION 3: CATEGORY / TAGS */}
                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fa-solid fa-tags text-[#1e40a1]"></i> Danh mục &amp; Thẻ</h3>
                        <div>
                            <label className={labelClass}>Danh mục</label>
                            <div className="flex gap-2">
                                <select value={form.category_id} onChange={(e) => updateField('category_id', e.target.value)} className={inputClass + ' cursor-pointer'}>
                                    <option value="">-- Không chọn --</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Tạo danh mục mới..." className={inputClass + ' text-xs'} />
                                <button type="button" onClick={handleAddCategory} className="bg-slate-700 hover:bg-slate-800 text-white px-4 rounded-lg text-xs font-bold shrink-0">+ Thêm</button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Thẻ (Tags)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag) => (
                                    <button
                                        type="button"
                                        key={tag.id}
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedTagIds.includes(tag.id)
                                            ? 'bg-[#1e40a1] text-white border-[#1e40a1]'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-[#1e40a1]/40'
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Tạo thẻ mới..." className={inputClass + ' text-xs'} />
                                <button type="button" onClick={handleAddTag} className="bg-slate-700 hover:bg-slate-800 text-white px-4 rounded-lg text-xs font-bold shrink-0">+ Thêm</button>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4: FEATURED IMAGE */}
                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-3">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fa-solid fa-image text-[#1e40a1]"></i> Ảnh đại diện</h3>
                        {form.featured_image_url && (
                            <div className="relative w-fit">
                                <img src={form.featured_image_url} alt="Ảnh đại diện" className="h-40 rounded-lg border border-slate-200 object-cover" />
                                <button type="button" onClick={() => updateField('featured_image_url', '')} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full text-xs shadow"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            disabled={uploadingImage}
                            onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'featured_image_url')}
                            className="text-sm"
                        />
                        {uploadingImage && <p className="text-xs text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-1"></i> Đang tải ảnh lên...</p>}
                        <p className="text-[11px] text-slate-400">JPG/PNG/WEBP/GIF, tối đa 4MB.</p>
                    </section>

                    {/* SECTION 5: SEO */}
                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fa-solid fa-magnifying-glass-chart text-[#1e40a1]"></i> SEO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>SEO Title</label>
                                <input type="text" value={form.seo_title} onChange={(e) => updateField('seo_title', e.target.value)} className={inputClass} placeholder="Mặc định dùng Tiêu đề nếu để trống" />
                            </div>
                            <div>
                                <label className={labelClass}>Canonical URL</label>
                                <input type="text" value={form.canonical_url} onChange={(e) => updateField('canonical_url', e.target.value)} className={inputClass} placeholder="https://..." />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>SEO Description</label>
                            <textarea rows={2} value={form.seo_description} onChange={(e) => updateField('seo_description', e.target.value)} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>OG Title</label>
                                <input type="text" value={form.og_title} onChange={(e) => updateField('og_title', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>OG Image URL</label>
                                <input type="text" value={form.og_image_url} onChange={(e) => updateField('og_image_url', e.target.value)} className={inputClass} placeholder="Mặc định dùng ảnh đại diện nếu để trống" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>OG Description</label>
                            <textarea rows={2} value={form.og_description} onChange={(e) => updateField('og_description', e.target.value)} className={inputClass} />
                        </div>
                    </section>

                    {/* HÀNG NÚT HÀNH ĐỘNG */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu (giữ nguyên trạng thái hiện tại)'}
                        </button>
                        <button type="button" onClick={(e) => handleSave(e, 'published')} disabled={isSubmitting} className="flex-1 bg-[#1e40a1] hover:brightness-95 text-white px-6 py-3.5 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer">
                            <i className="fa-solid fa-paper-plane mr-1.5"></i> Đăng ngay
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminBlogForm;
