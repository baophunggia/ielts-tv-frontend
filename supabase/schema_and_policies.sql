-- ==========================================================
-- RLS POLICIES CHO DỰ ÁN IELTS-TV — FILE NGUỒN SỰ THẬT (SOURCE OF TRUTH)
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor.
-- An toàn để chạy lại nhiều lần (idempotent) trên cùng 1 project.
-- ==========================================================
-- MÔ HÌNH QUYỀN:
--   - Khách/học viên (role "anon"): chỉ ĐỌC đề thi, ĐỌC kết quả (mở link share),
--     và TẠO MỚI (insert) kết quả khi nộp bài. Không sửa/xoá được gì.
--   - Admin/giáo viên (role "authenticated" qua Supabase Auth): toàn quyền
--     thêm/sửa/xoá đề thi và xoá kết quả thi.
--
-- LƯU Ý: "authenticated" = BẤT KỲ ai đăng nhập được qua Supabase Auth. Vì vậy
-- BẮT BUỘC phải tắt "Allow new users to sign up" ở Authentication > Providers
-- > Email, và chỉ tạo tài khoản admin thủ công qua Authentication > Users.
-- Nếu không, ai cũng có thể tự đăng ký rồi có toàn quyền admin.
-- ==========================================================


-- ----------------------------------------------------------
-- 0. Xoá đề thi sẽ tự xoá kết quả liên quan ở tầng database
-- ----------------------------------------------------------
alter table public.test_results
    drop constraint if exists test_results_test_id_fkey;

alter table public.test_results
    add constraint test_results_test_id_fkey
    foreign key (test_id) references public.reading_tests(id)
    on delete cascade;

-- ----------------------------------------------------------
-- 0b. Thêm cột lưu link chia sẻ kết quả thi
--     (Frontend tự sinh UUID + build link TRƯỚC khi insert, xem
--     src/pages/TestScreen/TestScreen.jsx phần handleSubmitTest)
-- ----------------------------------------------------------
alter table public.test_results
    add column if not exists share_link text;


-- ----------------------------------------------------------
-- 1. BẬT ROW LEVEL SECURITY
-- ----------------------------------------------------------
alter table public.reading_tests enable row level security;
alter table public.test_results  enable row level security;


-- ----------------------------------------------------------
-- 2. DỌN CÁC POLICY CŨ QUÁ LỎNG LẺO (nếu project từng có sẵn)
--    Lý do: RLS cộng dồn kiểu OR — chỉ cần 1 policy public write là
--    các policy admin_only bên dưới trở nên vô nghĩa.
-- ----------------------------------------------------------
drop policy if exists "Cho phép xóa từ frontend" on public.reading_tests;
drop policy if exists "Cho phép upload từ frontend" on public.reading_tests;
drop policy if exists "Cho phép cập nhật từ frontend" on public.reading_tests;
drop policy if exists "Cho phép mọi người xem bài test" on public.reading_tests;
drop policy if exists "Cho phép xem kết quả" on public.test_results;
drop policy if exists "Cho phép thêm kết quả" on public.test_results;


-- ----------------------------------------------------------
-- 3. BẢNG reading_tests
-- ----------------------------------------------------------
drop policy if exists "reading_tests_select_public" on public.reading_tests;
create policy "reading_tests_select_public"
on public.reading_tests for select
to anon, authenticated
using (true);

drop policy if exists "reading_tests_insert_admin_only" on public.reading_tests;
create policy "reading_tests_insert_admin_only"
on public.reading_tests for insert
to authenticated
with check (true);

drop policy if exists "reading_tests_update_admin_only" on public.reading_tests;
create policy "reading_tests_update_admin_only"
on public.reading_tests for update
to authenticated
using (true)
with check (true);

drop policy if exists "reading_tests_delete_admin_only" on public.reading_tests;
create policy "reading_tests_delete_admin_only"
on public.reading_tests for delete
to authenticated
using (true);


-- ----------------------------------------------------------
-- 4. BẢNG test_results
-- ----------------------------------------------------------
drop policy if exists "test_results_insert_anyone" on public.test_results;
create policy "test_results_insert_anyone"
on public.test_results for insert
to anon, authenticated
with check (true);

drop policy if exists "test_results_select_by_link" on public.test_results;
create policy "test_results_select_by_link"
on public.test_results for select
to anon, authenticated
using (true);

drop policy if exists "test_results_delete_admin_only" on public.test_results;
create policy "test_results_delete_admin_only"
on public.test_results for delete
to authenticated
using (true);

-- Không có policy UPDATE cho test_results (không cần chức năng sửa điểm sau khi nộp)
-- => mặc định RLS sẽ CHẶN mọi update, kể cả gọi thẳng API.


-- ----------------------------------------------------------
-- 5. KIỂM TRA NHANH — chạy riêng câu này sau khi apply xong
-- ----------------------------------------------------------
-- select tablename, policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, cmd;
--
-- Kết quả mong đợi (đúng 7 dòng):
--   reading_tests | reading_tests_select_public      | SELECT | {anon,authenticated}
--   reading_tests | reading_tests_insert_admin_only  | INSERT | {authenticated}
--   reading_tests | reading_tests_update_admin_only  | UPDATE | {authenticated}
--   reading_tests | reading_tests_delete_admin_only  | DELETE | {authenticated}
--   test_results  | test_results_insert_anyone       | INSERT | {anon,authenticated}
--   test_results  | test_results_select_by_link      | SELECT | {anon,authenticated}
--   test_results  | test_results_delete_admin_only   | DELETE | {authenticated}


-- ==========================================================
-- 6. BLOG MANAGEMENT — categories, tags, blogs, blog_tags
-- ==========================================================
-- MÔ HÌNH QUYỀN (giữ nhất quán với reading_tests ở trên):
--   - Khách (anon): chỉ đọc được category/tag, và chỉ đọc được bài blog đã
--     status = 'published' VÀ đã tới giờ published_at (không thấy draft/scheduled/archived).
--   - Admin (authenticated): đọc/ghi mọi thứ, kể cả bài draft/scheduled/archived để quản lý.
--   - author_id KHÔNG do client tự set — 1 trigger tự gán/khoá giá trị này để
--     chống giả mạo tác giả (yêu cầu bảo mật trong spec).
-- ==========================================================

create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_at timestamptz default now()
);

create table if not exists public.tags (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_at timestamptz default now()
);

create table if not exists public.blogs (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    excerpt text,
    content text,
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
    author_id uuid references auth.users(id),
    category_id uuid references public.categories(id) on delete set null,
    featured_image_url text,
    seo_title text,
    seo_description text,
    canonical_url text,
    og_title text,
    og_description text,
    og_image_url text,
    published_at timestamptz,
    scheduled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.blog_tags (
    blog_id uuid not null references public.blogs(id) on delete cascade,
    tag_id uuid not null references public.tags(id) on delete cascade,
    primary key (blog_id, tag_id)
);

create index if not exists idx_blogs_status on public.blogs(status);
create index if not exists idx_blogs_category on public.blogs(category_id);
create index if not exists idx_blogs_published_at on public.blogs(published_at desc);
create index if not exists idx_blog_tags_tag on public.blog_tags(tag_id);

-- Tự động cập nhật updated_at mỗi khi sửa 1 bài blog
create or replace function public.set_blog_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_blogs_updated_at on public.blogs;
create trigger trg_blogs_updated_at
before update on public.blogs
for each row execute function public.set_blog_updated_at();

-- FIX BẢO MẬT (theo yêu cầu "user không thể tự giả mạo author_id"): trigger này
-- ép author_id = auth.uid() lúc tạo mới, và KHOÁ CỨNG không cho đổi tác giả sau
-- khi đã tạo — bất kể client gửi giá trị gì lên. Mạnh hơn RLS "with check" vì
-- không phụ thuộc vào việc admin app có gửi đúng field hay không.
create or replace function public.enforce_blog_author()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        new.author_id := auth.uid();
    elsif TG_OP = 'UPDATE' then
        new.author_id := old.author_id;
    end if;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_blogs_enforce_author on public.blogs;
create trigger trg_blogs_enforce_author
before insert or update on public.blogs
for each row execute function public.enforce_blog_author();

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.blogs enable row level security;
alter table public.blog_tags enable row level security;

-- categories: đọc công khai (cần hiển thị filter theo category ở trang blog công khai sau này), ghi chỉ admin
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories for select to anon, authenticated using (true);
drop policy if exists "categories_write_admin_only" on public.categories;
create policy "categories_write_admin_only" on public.categories for all to authenticated using (true) with check (true);

-- tags: tương tự categories
drop policy if exists "tags_select_public" on public.tags;
create policy "tags_select_public" on public.tags for select to anon, authenticated using (true);
drop policy if exists "tags_write_admin_only" on public.tags;
create policy "tags_write_admin_only" on public.tags for all to authenticated using (true) with check (true);

-- blogs: khách chỉ thấy bài published & đã tới giờ đăng; admin thấy & sửa mọi trạng thái
drop policy if exists "blogs_select_public_published" on public.blogs;
create policy "blogs_select_public_published"
on public.blogs for select to anon
using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "blogs_select_admin_all" on public.blogs;
create policy "blogs_select_admin_all"
on public.blogs for select to authenticated
using (true);

drop policy if exists "blogs_insert_admin_only" on public.blogs;
create policy "blogs_insert_admin_only"
on public.blogs for insert to authenticated
with check (true);

drop policy if exists "blogs_update_admin_only" on public.blogs;
create policy "blogs_update_admin_only"
on public.blogs for update to authenticated
using (true) with check (true);

drop policy if exists "blogs_delete_admin_only" on public.blogs;
create policy "blogs_delete_admin_only"
on public.blogs for delete to authenticated
using (true);

-- blog_tags: đọc công khai (để join hiển thị tag ở trang blog công khai sau này), ghi admin
drop policy if exists "blog_tags_select_public" on public.blog_tags;
create policy "blog_tags_select_public" on public.blog_tags for select to anon, authenticated using (true);
drop policy if exists "blog_tags_write_admin_only" on public.blog_tags;
create policy "blog_tags_write_admin_only" on public.blog_tags for all to authenticated using (true) with check (true);


-- ==========================================================
-- 7. SUPABASE STORAGE — bucket lưu ảnh đại diện bài blog
-- ==========================================================
-- Bucket public=true để ảnh hiển thị được trực tiếp qua URL công khai (giống
-- cách hầu hết blog hiển thị ảnh), nhưng CHỈ admin (authenticated) mới upload/xoá được.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "blog_images_select_public" on storage.objects;
create policy "blog_images_select_public"
on storage.objects for select to anon, authenticated
using (bucket_id = 'blog-images');

drop policy if exists "blog_images_insert_admin_only" on storage.objects;
create policy "blog_images_insert_admin_only"
on storage.objects for insert to authenticated
with check (bucket_id = 'blog-images');

drop policy if exists "blog_images_update_admin_only" on storage.objects;
create policy "blog_images_update_admin_only"
on storage.objects for update to authenticated
using (bucket_id = 'blog-images');

drop policy if exists "blog_images_delete_admin_only" on storage.objects;
create policy "blog_images_delete_admin_only"
on storage.objects for delete to authenticated
using (bucket_id = 'blog-images');


-- ----------------------------------------------------------
-- 8. KIỂM TRA NHANH BLOG — chạy riêng sau khi apply xong
-- ----------------------------------------------------------
-- select tablename, policyname, cmd, roles from pg_policies
-- where schemaname = 'public' and tablename in ('categories','tags','blogs','blog_tags')
-- order by tablename, cmd;
