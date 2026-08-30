import { useState, useEffect } from 'react';

// ==========================================================
// HOOKS RESPONSIVE DÙNG CHUNG
// ==========================================================
// Tách riêng để TestingBody.jsx (layout chia đôi màn hình vs tab mobile)
// và TestingPassage.jsx (cơ chế highlight chuột vs cảm ứng) dùng chung,
// tránh lặp code phát hiện breakpoint/loại con trỏ ở nhiều nơi.
// ==========================================================

/**
 * true khi màn hình >= breakpoint (mặc định 768px, trùng breakpoint "md" của Tailwind).
 * Lắng nghe thay đổi realtime (xoay ngang điện thoại, kéo giãn cửa sổ trình duyệt...).
 */
export const useIsDesktop = (breakpointPx = 768) => {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(`(min-width: ${breakpointPx}px)`).matches
    );

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
        const handleChange = (e) => setIsDesktop(e.matches);
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, [breakpointPx]);

    return isDesktop;
};

/**
 * true khi thiết bị chính dùng con trỏ "thô" (ngón tay chạm), false khi dùng chuột/trackpad.
 * Dùng để chọn cơ chế highlight phù hợp: chuột bôi đen tức thì khi nhả chuột,
 * cảm ứng cần chọn xong rồi bấm nút xác nhận (vì không có sự kiện "nhả chuột"
 * tương đương đáng tin cậy khi kéo tay cầm chọn text bằng ngón tay).
 */
export const useIsTouchDevice = () => {
    const [isTouch] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    );
    return isTouch;
};
