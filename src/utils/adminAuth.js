// ==========================================
// TIỆN ÍCH XÁC THỰC ADMIN (CLIENT-SIDE)
// FIX BUG: Trước đây cờ 'isAdminLoggedIn' lưu vĩnh viễn trong localStorage,
// không bao giờ hết hạn. Trên máy tính dùng chung (phòng máy/thư viện),
// bất kỳ ai mở lại trình duyệt sau đó cũng nghiễm nhiên có quyền Admin.
// Giải pháp này thêm mốc thời gian đăng nhập và tự hết hạn sau SESSION_DURATION_MS.
//
// LƯU Ý QUAN TRỌNG: Đây vẫn là xác thực phía CLIENT, chỉ ẩn UI admin khỏi người
// dùng thường, KHÔNG thay thế cho bảo mật thực sự ở tầng Supabase. Để an toàn
// triệt để, cần bật Row Level Security (RLS) trên Supabase và dùng Supabase Auth
// thật cho các thao tác insert/update/delete.
// ==========================================

const STORAGE_KEY = 'ielts_tv_admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 tiếng

export const setAdminSession = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedInAt: Date.now() }));
};

export const clearAdminSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    // Xoá luôn cờ cũ (nếu còn sót từ phiên bản trước) để đảm bảo đăng xuất triệt để
    localStorage.removeItem('isAdminLoggedIn');
};

export const isAdminSessionValid = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const { loggedInAt } = JSON.parse(raw);
        if (!loggedInAt) return false;

        const expired = Date.now() - loggedInAt > SESSION_DURATION_MS;
        if (expired) {
            clearAdminSession();
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};
