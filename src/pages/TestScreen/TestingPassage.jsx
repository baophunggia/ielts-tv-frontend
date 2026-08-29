import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

// ==========================================================
// TestingPassage — NGUỒN LOGIC DUY NHẤT cho tính năng Highlight.
//
// FIX BUG: Trước đây TestScreen.jsx có 1 bản sao y hệt logic highlight này
// (hàm handleMouseUpHighlight + contentRef), truyền xuống qua prop
// `onHandleMouseUpHighlight`, nhưng TestingBody.jsx không hề dùng tới prop
// đó — component này tự chạy 1 bản highlight riêng của chính nó. Điều đó
// khiến việc ShareResultScreen.jsx cố tình vô hiệu hoá highlight bằng
// `onHandleMouseUpHighlight={() => {}}` HOÀN TOÀN KHÔNG CÓ TÁC DỤNG — học
// viên vẫn bôi đen được ở trang xem kết quả (đáng lẽ phải là read-only).
//
// Nay gộp về đúng 1 nơi duy nhất, nhận prop `disabled` để tắt hẳn tính năng
// khi cần (dùng cho trang xem kết quả), và expose hàm `clearAllHighlights`
// qua ref để nút "Xoá tất cả" ở TestingBody có thể gọi vào.
// ==========================================================
const TestingPassage = React.memo(forwardRef(({ passageHtml, disabled = false, onHighlightCountChange }, ref) => {
    const passageRef = useRef(null);

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

    // TÍNH NĂNG MỚI: Xoá toàn bộ highlight cùng lúc, gọi được từ component cha qua ref,
    // không cần học viên phải click từng vùng một để xoá.
    useImperativeHandle(ref, () => ({
        clearAllHighlights: () => {
            if (!passageRef.current) return;
            const marks = passageRef.current.querySelectorAll('mark');
            marks.forEach(unwrapMarkNode);
            // Gộp lại các text-node liền kề sau khi bóc thẻ, giúp DOM sạch sẽ
            passageRef.current.normalize();
            notifyHighlightCount();
        },
    }), [unwrapMarkNode, notifyHighlightCount]);

    const handleMouseUpHighlight = useCallback(() => {
        // FIX BUG: tôn trọng cờ disabled (trang xem kết quả qua link share)
        if (disabled) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') return;

        const range = selection.getRangeAt(0);
        if (passageRef.current && !passageRef.current.contains(range.commonAncestorContainer)) return;

        const markNode = document.createElement('mark');
        markNode.className = 'bg-yellow-200 text-slate-900 cursor-pointer rounded px-0.5 transition-colors duration-200 hover:bg-yellow-300';
        markNode.title = 'Click để xóa highlight này';

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

        selection.removeAllRanges();
        notifyHighlightCount();
    }, [disabled, unwrapMarkNode, notifyHighlightCount]);

    return (
        <div
            className={`flex-1 overflow-y-auto pl-10 pr-12 py-10 text-left leading-relaxed text-slate-700 reading-content selection:bg-[#dbe4fb] ${disabled ? '' : 'select-text'}`}
            ref={passageRef}
            onMouseUp={handleMouseUpHighlight}
            style={{ fontSize: '15px', wordSpacing: '0.5px' }}
            dangerouslySetInnerHTML={{ __html: passageHtml }}
        />
    );
}));

export default TestingPassage;
