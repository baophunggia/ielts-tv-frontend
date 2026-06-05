import React, { useRef } from 'react';

const TestingPassage = React.memo(({ passageHtml }) => {
  const passageRef = useRef(null);

  const handleMouseUpHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') return;

    const range = selection.getRangeAt(0);

    // Kiểm tra vùng chọn nằm trọn vẹn trong vùng bài đọc
    if (passageRef.current && !passageRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const markNode = document.createElement('mark');
    markNode.className = 'bg-yellow-200 text-slate-900 cursor-pointer rounded px-0.5 transition-colors duration-200 hover:bg-yellow-300';
    markNode.title = "Click để xóa highlight này";

    markNode.onclick = function (e) {
      e.stopPropagation();
      const parent = this.parentNode;
      while (this.firstChild) {
        parent.insertBefore(this.firstChild, this);
      }
      parent.removeChild(this);
    };

    try {
      range.surroundContents(markNode);
    } catch (e) {
      try {
        const fragment = range.extractContents();
        markNode.appendChild(fragment);
        range.insertNode(markNode);
      } catch (err) {
        console.warn("Vùng bôi đen quá phức tạp.", err);
      }
    }

    selection.removeAllRanges();
  };

  return (
    <div
      className="flex-1 overflow-y-auto pl-10 pr-12 py-10 text-left leading-relaxed text-slate-700 reading-content selection:bg-indigo-100 select-text"
      ref={passageRef}
      onMouseUp={handleMouseUpHighlight}
      style={{ fontSize: '15px', wordSpacing: '0.5px' }}
      dangerouslySetInnerHTML={{ __html: passageHtml }}
    />
  );
});

export default TestingPassage;