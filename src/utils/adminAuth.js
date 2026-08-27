import supabase from '../supabaseClient';

// ==========================================================
// XÁC THỰC ADMIN QUA SUPABASE AUTH (THAY THẾ MẬT KHẨU HARDCODE)
// ==========================================================
// Trước đây: mật khẩu "P@ssw0rd" nằm thẳng trong file JS gửi tới trình duyệt,
// và trạng thái đăng nhập chỉ là 1 cờ boolean trong localStorage — không có
// giá trị bảo mật thực sự, và các thao tác ghi (insert/update/delete) vẫn
// dùng chung 1 anon key cho tất cả mọi người.
//
// Giờ đây: admin đăng nhập bằng email/mật khẩu THẬT qua Supabase Auth.
// Supabase tự cấp 1 JWT hợp lệ, RLS policy sẽ dựa vào JWT này (role
// "authenticated") để quyết định cho phép ghi dữ liệu hay không — dù kẻ xấu
// có mở Console gọi thẳng API cũng không ghi được nếu chưa đăng nhập đúng.
//
// CÁCH TẠO TÀI KHOẢN ADMIN: vào Supabase Dashboard > Authentication > Users
// > Add user, nhập email + mật khẩu cho giáo viên. KHÔNG dùng form đăng ký
// công khai nào cả (xem thêm hướng dẫn tắt Sign Up trong rls_policies.sql).
// ==========================================================

export const adminSignIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

export const adminSignOut = () => supabase.auth.signOut();

export const getAdminSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Lỗi khi lấy phiên đăng nhập:', error);
        return null;
    }
    return data.session;
};

// Đăng ký lắng nghe khi trạng thái đăng nhập đổi (đăng nhập/đăng xuất/token hết hạn)
// Trả về hàm huỷ đăng ký để gọi trong cleanup của useEffect.
export const onAdminAuthChange = (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
    return () => subscription.unsubscribe();
};
