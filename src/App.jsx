import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen.jsx';
import TestScreen from './pages/TestScreen/TestScreen.jsx';
import AdminScreen from './pages/AdminScreen.jsx';
import ShareResultScreen from './pages/TestScreen/ShareResultScreen.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// ==========================================
// COMPONENT CHÍNH APP (ĐÓNG VAI TRÒ ROUTER)
// BỌC ErrorBoundary để 1 bài thi lỗi dữ liệu
// không làm sập trắng trang cho mọi học viên
// ==========================================
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/test/:id" element={<TestScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
          <Route path="/share-result/:resultId" element={<ShareResultScreen />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}