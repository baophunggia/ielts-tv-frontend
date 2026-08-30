import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useIsTouchDevice } from '../../utils/responsive.js';
import TouchHighlightConfirmButton from './TouchHighlightConfirmButton.jsx';

// ==========================================================
// TestingPassage — NGUỒN LOGIC DUY NHẤT cho tính năng Highlight.
//
// FIX BUG (lịch sử): Trước đây TestScreen.jsx có 1 bản sao y hệt logic
// highlight này, không hề được TestingBody sử dụng (dead code) và khiến
// ShareResultScreen.jsx cố disable highlight nhưng không có tác dụng.
// Đã gộp về đúng 1 nơi duy nhất từ trước.
//
// TÍNH NĂNG MỚI (RESPONSIVE CẢM ỨNG): trên chuột, "nhả chuột sau khi bôi đen"
// là tín hiệu rõ ràng để tạo highlight ngay. Trên cảm ứng, việc chọn text bằng
// ngón tay KHÔNG có sự kiện nào đáng tin cậy báo "người dùng đã chọn xong" —
// nên với cảm ứng, việc theo dõi selectionchange + hiện nút xác nhận được xử
// lý ở component RIÊNG BIỆT `TouchHighlightConfirmButton.jsx` (xem file đó để
// biết lý do kỹ thuật quan trọng vì sao phải tách riêng — tránh việc state của
// nút nổi làm reset nội dung dangerouslySetInnerHTML của bài đọc mỗi khi đổi).
// TestingPassage chỉ cần cung cấp `passageRef` + hàm `applyHighlightToRange`
// dùng chung cho cả 2 đường (chuột lẫn cảm ứng).
// ==========================================================
const TestingPassage = React.memo(forwardRef(({ passageHtml, disabled = false, onHighlightCountChange }, ref) => {
    const passageRef = useRef(null);
    const isTouchDevice = useIsTouchDevice();

    // Bóc 1 thẻ <mark> ra khỏi DOM, giữ lại nguyên vẹn nội dung bên trong nó
    const unwrapMarkNode = useCallback((markNode) => {
        const parent = markNode.parentNode;
        if (!parent) return;
        while (markNode.firstChild) {
            parent.insertBefore(markNode.firstChild, markNode);
        }
        parent.removeChild(markNode);
    }, []);

    const notifyHighlightCount = useCallback(() => {
        if (onHighlightCountChange && passageRef.current) {
            onHighlightCountChange(passageRef.current.querySelectorAll('mark').length);
        }
    }, [onHighlightCountChange]);

    // Hàm dùng chung: biến 1 Range thành highlight <mark>. Dùng cho cả 2 đường:
    // nhả chuột (desktop) và bấm nút xác nhận (cảm ứng, qua TouchHighlightConfirmButton).
    const applyHighlightToRange = useCallback((range) => {
        const markNode = document.createElement('mark');
        markNode.className = 'bg-yellow-200 text-slate-900 cursor-pointer rounded px-0.5 transition-colors duration-200 hover:bg-yellow-300';
        markNode.title = 'Chạm/Click để xóa highlight này';

        markNode.onclick = function (e) {
            e.stopPropagation();
            unwrapMarkNode(this);
            notifyHighlightCount();
        };

        try {
            // Cách 1: Áp dụng khi bôi đen trong phạm vi 1 thẻ (an toàn nhất)
            range.surroundContents(markNode);
        } catch (e) {
            // Cách 2: Fallback khi bôi đen vắt ngang qua nhiều đoạn văn hoặc thẻ in đậm
            try {
                const fragment = range.extractContents();
                markNode.appendChild(fragment);
                range.insertNode(markNode);
            } catch (err) {
                console.warn('Vùng bôi đen chéo cấu trúc quá phức tạp.', err);
            }
        }

        notifyHighlightCount();
    }, [unwrapMarkNode, notifyHighlightCount]);

    // TÍNH NĂNG MỚI: Xoá toàn bộ highlight cùng lúc, gọi được từ component cha qua ref,
    // không cần học viên phải chọn từng vùng một để xoá.
    useImperativeHandle(ref, () => ({
        clearAllHighlights: () => {
            if (!passageRef.current) return;
            const marks = passageRef.current.querySelectorAll('mark');
            marks.forEach(unwrapMarkNode);
            passageRef.current.normalize();
            notifyHighlightCount();
        },
    }), [unwrapMarkNode, notifyHighlightCount]);

    // ---------- ĐƯỜNG DÀNH CHO CHUỘT (giữ nguyên hành vi cũ) ----------
    const handleMouseUpHighlight = useCallback(() => {
        if (disabled || isTouchDevice) return; // Cảm ứng dùng đường riêng (TouchHighlightConfirmButton)

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') return;

        const range = selection.getRangeAt(0);
        if (passageRef.current && !passageRef.current.contains(range.commonAncestorContainer)) return;

        applyHighlightToRange(range);
        selection.removeAllRanges();
    }, [disabled, isTouchDevice, applyHighlightToRange]);

    return (
        <>
            <div
                className={`flex-1 overflow-y-auto pl-10 pr-12 py-10 text-left leading-relaxed text-slate-700 reading-content selection:bg-[#dbe4fb] ${disabled ? '' : 'select-text'}`}
                ref={passageRef}
                onMouseUp={handleMouseUpHighlight}
                style={{ fontSize: '15px', wordSpacing: '0.5px' }}
                dangerouslySetInnerHTML={{ __html: passageHtml }}
            />

            {/* Component RIÊNG BIỆT xử lý nút xác nhận highlight trên cảm ứng — xem
                comment chi tiết lý do tách riêng trong chính file TouchHighlightConfirmButton.jsx */}
            <TouchHighlightConfirmButton
                passageRef={passageRef}
                onApply={applyHighlightToRange}
                enabled={isTouchDevice && !disabled}
            />
        </>
    );
}));

export default TestingPassage;
