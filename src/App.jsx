import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingScreen from './pages/LandingScreen.jsx';
import TestsScreen from './pages/TestsScreen.jsx';
import TestScreen from './pages/TestScreen/TestScreen.jsx';
import ShareResultScreen from './pages/TestScreen/ShareResultScreen.jsx';
import BlogListScreen from './pages/BlogListScreen.jsx';
import BlogDetailScreen from './pages/BlogDetailScreen.jsx';
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminTestsTab from './pages/Admin/AdminTestsTab.jsx';
import AdminTestForm from './pages/Admin/AdminTestForm.jsx';
import AdminBlogTab from './pages/Admin/AdminBlogTab.jsx';
import AdminBlogForm from './pages/Admin/AdminBlogForm.jsx';
import AdminBlogTaxonomy from './pages/Admin/AdminBlogTaxonomy.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// ==========================================
// COMPONENT CHÍNH APP (ĐÓNG VAI TRÒ ROUTER)
// BỌC ErrorBoundary để 1 bài thi lỗi dữ liệu
// không làm sập trắng trang cho mọi học viên
//
// FIX CẤU TRÚC: "/admin" trước đây là 1 trang duy nhất vừa đăng nhập vừa lo
// soạn đề thi. Giờ là 1 Admin Portal có tab "Đề thi" / "Blog", dùng route
// lồng nhau (nested routes qua <Outlet /> trong AdminLayout.jsx).
// ==========================================
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/tests" element={<TestsScreen />} />
          <Route path="/test/:id" element={<TestScreen />} />
          <Route path="/share-result/:resultId" element={<ShareResultScreen />} />
          <Route path="/blogs" element={<BlogListScreen />} />
          <Route path="/blogs/:slug" element={<BlogDetailScreen />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminTestsTab />} />
            <Route path="tests" element={<AdminTestsTab />} />
            <Route path="tests/new" element={<AdminTestForm />} />
            <Route path="tests/edit/:id" element={<AdminTestForm />} />
            <Route path="blog" element={<AdminBlogTab />} />
            <Route path="blog/new" element={<AdminBlogForm />} />
            <Route path="blog/edit/:id" element={<AdminBlogForm />} />
            <Route path="blog/taxonomy" element={<AdminBlogTaxonomy />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}