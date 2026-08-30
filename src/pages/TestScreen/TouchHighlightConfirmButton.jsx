import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ==========================================================
// TouchHighlightConfirmButton — TÁCH RIÊNG khỏi TestingPassage.jsx.
//
// FIX BUG QUAN TRỌNG (đã xác minh bằng thực nghiệm với MutationObserver):
// Ban đầu state `confirmState` (theo dõi vùng chọn trên cảm ứng để hiện nút
// nổi) được đặt NGAY BÊN TRONG component sở hữu div chứa `dangerouslySetInnerHTML`
// của bài đọc. Hệ quả: mỗi khi `confirmState` đổi, TOÀN BỘ hàm render của
// component đó chạy lại — kể cả JSX của div bài đọc cũng bị tính toán lại.
// Dù giá trị chuỗi HTML truyền vào không đổi, việc này vẫn khiến React thiết
// lập lại DOM node của div (xác nhận qua MutationObserver: đúng lúc debounce
// 200ms kết thúc, div bị thay 5/5 node con) — xoá sạch mọi <mark> vừa được
// chèn thủ công vào DOM trước đó, dù code báo "thành công" không lỗi gì.
//
// GIẢI PHÁP: đưa state này sang HẲN 1 COMPONENT RIÊNG BIỆT. Component này chỉ
// nhận `passageRef` (ref đã tồn tại sẵn, trỏ tới div bài đọc) và hàm `onApply`
// qua props — khi state nội bộ của NÓ thay đổi, chỉ chính nó re-render, hoàn
// toàn không đụng tới component cha sở hữu div bài đọc.
// ==========================================================
const TouchHighlightConfirmButton = ({ passageRef, onApply, enabled }) => {
    const [confirmState, setConfirmState] = useState(null); // { top, left, range } | null

    useEffect(() => {
        if (!enabled) {
            setConfirmState(null);
            return;
        }

        let debounceId = null;

        const handleSelectionChange = () => {
            // Debounce nhẹ để nút không nhấp nháy/nhảy vị trí liên tục trong lúc
            // người dùng vẫn đang kéo tay cầm chọn text.
            if (debounceId) clearTimeout(debounceId);
            debounceId = setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
                    setConfirmState(null);
                    return;
                }

                const range = selection.getRangeAt(0);
                if (!passageRef.current || !passageRef.current.contains(range.commonAncestorContainer)) {
                    setConfirmState(null);
                    return;
                }

                const rect = range.getBoundingClientRect();
                if (!rect || (rect.width === 0 && rect.height === 0)) {
                    setConfirmState(null);
                    return;
                }

                // Ưu tiên hiện nút phía TRÊN vùng chọn; nếu quá sát mép trên màn hình
                // (dễ bị header che) thì đổi sang hiện phía DƯỚI vùng chọn.
                const buttonHeight = 44;
                const showBelow = rect.top < buttonHeight + 16;
                const top = showBelow ? rect.bottom + 8 : rect.top - buttonHeight - 8;
                const left = Math.min(
                    Math.max(rect.left + rect.width / 2, 70),
                    window.innerWidth - 70
                );

                // Snapshot Range làm phương án dự phòng (xem lý do ở handleConfirm bên dưới).
                setConfirmState({ top, left, range: range.cloneRange() });
            }, 200);
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            if (debounceId) clearTimeout(debounceId);
        };
    }, [enabled, passageRef]);

    const handleConfirm = useCallback((e) => {
        e.preventDefault(); // Ngăn trình duyệt tự thu gọn selection khi chạm vào nút này
        if (!confirmState) return;

        // Ưu tiên đọc LIVE selection ngay lúc bấm nút, KHÔNG dùng thẳng bản Range
        // đã "chụp ảnh" (clone) từ lúc selectionchange. Lý do: khi 1 vùng chọn
        // text tồn tại 1 khoảng thời gian, trình duyệt có thể âm thầm tách/thay
        // thế text node bên trong (phục vụ việc vẽ vùng bôi xanh chọn), khiến
        // Range cũ trỏ vào node đã lỗi thời dù không báo lỗi gì. Đọc lại selection
        // sống tại đúng thời điểm bấm mới đảm bảo các node tham chiếu còn hợp lệ.
        const liveSelection = window.getSelection();
        let rangeToApply = null;
        if (liveSelection && !liveSelection.isCollapsed && liveSelection.toString().trim() !== '') {
            const liveRange = liveSelection.getRangeAt(0);
            if (passageRef.current && passageRef.current.contains(liveRange.commonAncestorContainer)) {
                rangeToApply = liveRange;
            }
        }
        // Dự phòng: nếu vì lý do nào đó selection sống đã bị trình duyệt thu gọn
        // trước khi handler này kịp chạy (dù đã preventDefault), dùng bản chụp ảnh cũ.
        if (!rangeToApply) {
            rangeToApply = confirmState.range;
        }

        onApply(rangeToApply);
        window.getSelection()?.removeAllRanges();
        setConfirmState(null);
    }, [confirmState, onApply, passageRef]);

    if (!confirmState) return null;

    return createPortal(
        <button
            type="button"
            onPointerDown={handleConfirm}
            className="fixed z-40 -translate-x-1/2 bg-[#1e40a1] text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
            style={{ top: confirmState.top, left: confirmState.left }}
        >
            <i className="fa-solid fa-highlighter"></i> Đánh dấu
        </button>,
        document.body
    );
};

export default TouchHighlightConfirmButton;
