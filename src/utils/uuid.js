// ==========================================================
// TIỆN ÍCH SINH UUID Ở PHÍA TRÌNH DUYỆT
// ==========================================================
// Dùng để tự sinh sẵn "id" cho 1 bản ghi test_results TRƯỚC khi insert,
// nhờ đó có thể build link chia sẻ (/share-result/<id>) và lưu luôn vào
// cột share_link trong CÙNG 1 lượt insert, thay vì phải insert trước rồi
// update lại (tốn thêm 1 round-trip, và có khoảng hở nếu request thứ 2 lỗi).
// ==========================================================

export const generateUUID = () => {
    // crypto.randomUUID() có sẵn trên mọi trình duyệt hiện đại (Chrome 92+,
    // Firefox 95+, Safari 15.4+) khi chạy trên HTTPS (Vercel luôn dùng HTTPS).
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback cho trường hợp hiếm gặp (trình duyệt quá cũ / môi trường không
    // hỗ trợ), để tránh việc nộp bài bị lỗi hoàn toàn vì thiếu crypto.randomUUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
