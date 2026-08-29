// ==========================================================
// BRAND TOKENS DÙNG CHUNG
// ==========================================================
// Trích xuất từ LandingScreen.jsx để dùng lại ở các trang khác
// (TestsScreen, TestScreen...) nhằm đồng bộ màu sắc + font chữ toàn site,
// tránh mỗi trang tự định nghĩa 1 bảng màu riêng gây lệch thương hiệu.
// ==========================================================

export const BRAND_FONT = { fontFamily: "'Be Vietnam Pro', sans-serif" };

export const BRAND = {
    navy: '#1e40a1',      // Xanh dương thương hiệu chính (nav, nút CTA đặc)
    navyDark: '#2a4365',  // Nền section tối (Resources...)
    heroNavy: '#36517e',  // Nền Hero / header khu vực làm bài thi
    yellow: '#ffca28',    // Màu nhấn CTA quan trọng nhất
    pink: '#f48fb1',
    green: '#4caf50',
    orange: '#ff9800',
    lightBlue: '#81d4fa',
    cream: '#fff8e1',     // Nền trang sáng
    ink: '#2d3748',       // Chữ tiêu đề trên nền sáng
    inkBody: '#4a5568',   // Chữ mô tả trên nền sáng
};

// Style bo góc + shadow "hard-edge" đặc trưng của các nút CTA trên LandingScreen,
// dùng lại cho nút quan trọng ở TestsScreen/TestScreen để đồng bộ cảm giác bấm.
export const HARD_SHADOW_BTN = 'shadow-[4px_4px_0px_0px_#1a1b21] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1a1b21] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all';
