import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen.jsx';
import TestScreen from './pages/TestScreen/TestScreen.jsx';
import AdminScreen from './pages/AdminScreen.jsx';
import ShareResultScreen from './pages/TestScreen/ShareResultScreen.jsx';

// ==========================================
// COMPONENT CHÍNH APP (ĐÓNG VAI TRÒ ROUTER)
// ==========================================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/test/:id" element={<TestScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="/share-result/:resultId" element={<ShareResultScreen />} />
      </Routes>
    </Router>
  );
}