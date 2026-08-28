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
