import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCategories, createCategory, deleteCategory, fetchTags, createTag, deleteTag } from './blogService.js';
import { slugifyUnique } from '../../utils/blogSlug.js';

// ==========================================================
// QUẢN LÝ DANH MỤC & THẺ — trang riêng, đầy đủ hơn phần "quick add"
// trong form soạn bài (đúng theo spec liệt kê "Categories"/"Tags" là tính
// năng riêng, không chỉ là 1 trường trong form).
// ==========================================================
const AdminBlogTaxonomy = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newTagName, setNewTagName] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()]);
            setCategories(cats);
            setTags(tgs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const cat = await createCategory(newCategoryName.trim(), slugifyUnique(newCategoryName));
            setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCategoryName('');
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!window.confirm(`Xoá danh mục "${cat.name}"? Các bài viết thuộc danh mục này sẽ chuyển về "Không có danh mục".`)) return;
        try {
            await deleteCategory(cat.id);
            setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const tag = await createTag(newTagName.trim(), slugifyUnique(newTagName));
            setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
            setNewTagName('');
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleDeleteTag = async (tag) => {
        if (!window.confirm(`Xoá thẻ "${tag.name}"?`)) return;
        try {
            await deleteTag(tag.id);
            setTags((prev) => prev.filter((t) => t.id !== tag.id));
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/blog')} className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-slate-600 font-medium transition text-sm cursor-pointer flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-left"></i> Quay lại
                </button>
                <h1 className="text-2xl font-extrabold text-[#2d3748]">Danh mục &amp; Thẻ</h1>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CATEGORIES */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fa-solid fa-folder text-[#1e40a1]"></i> Danh mục ({categories.length})</h2>
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Tên danh mục mới..." className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1e40a1]" onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                            <button onClick={handleAddCategory} className="bg-[#1e40a1] text-white px-4 rounded-lg text-sm font-bold shrink-0">+ Thêm</button>
                        </div>
                        {categories.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có danh mục nào.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {categories.map((cat) => (
                                    <li key={cat.id} className="flex justify-between items-center py-2.5">
                                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                        <button onClick={() => handleDeleteCategory(cat)} className="text-slate-400 hover:text-rose-600 text-sm"><i className="fa-solid fa-trash-can"></i></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* TAGS */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fa-solid fa-tag text-[#1e40a1]"></i> Thẻ ({tags.length})</h2>
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Tên thẻ mới..." className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1e40a1]" onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
                            <button onClick={handleAddTag} className="bg-[#1e40a1] text-white px-4 rounded-lg text-sm font-bold shrink-0">+ Thêm</button>
                        </div>
                        {tags.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có thẻ nào.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span key={tag.id} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                                        {tag.name}
                                        <button onClick={() => handleDeleteTag(tag)} className="text-slate-400 hover:text-rose-600"><i className="fa-solid fa-xmark"></i></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlogTaxonomy;
