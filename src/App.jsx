import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingScreen from './pages/LandingScreen.jsx';
import TestsScreen from './pages/TestsScreen.jsx';
import TestScreen from './pages/TestScreen/TestScreen.jsx';
import AdminScreen from './pages/AdminScreen.jsx';
import ShareResultScreen from './pages/TestScreen/ShareResultScreen.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// ==========================================
// COMPONENT CHÍNH APP (ĐÓNG VAI TRÒ ROUTER)
// BỌC ErrorBoundary để 1 bài thi lỗi dữ liệu
// không làm sập trắng trang cho mọi học viên
//
// FIX CẤU TRÚC: "/" trước đây tải thẳng danh sách đề thi (HomeScreen.jsx).
// Giờ "/" là trang giới thiệu (LandingScreen.jsx), còn danh sách đề thi đầy
// đủ chuyển sang route riêng "/tests" (TestsScreen.jsx).
// ==========================================
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/tests" element={<TestsScreen />} />
          <Route path="/test/:id" element={<TestScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
          <Route path="/share-result/:resultId" element={<ShareResultScreen />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}