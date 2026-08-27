import React from 'react';

// ==========================================
// ERROR BOUNDARY: Ngăn 1 bài thi lỗi làm sập
// trắng trang cho toàn bộ học viên đang thi
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log ra console để dev/teacher debug qua F12, không làm rơi dữ liệu người dùng
    console.error('ErrorBoundary bắt được lỗi:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4 p-6 text-center">
          <i className="fa-solid fa-triangle-exclamation text-6xl text-amber-400"></i>
          <h2 className="text-2xl text-slate-800 font-bold">Đã có lỗi xảy ra khi hiển thị trang này</h2>
          <p className="text-slate-500 max-w-md">
            Có thể dữ liệu bài thi bị thiếu hoặc lỗi định dạng. Vui lòng quay lại trang chủ.
            Nếu bạn là giáo viên, hãy kiểm tra lại đề thi này trong trang Admin (có nhóm câu hỏi nào không có câu hỏi nào bên trong không).
          </p>
          <button
            onClick={this.handleReload}
            className="mt-2 text-sm bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            Về trang chủ
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
