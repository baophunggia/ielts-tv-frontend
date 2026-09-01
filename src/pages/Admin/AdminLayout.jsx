import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminSignIn, adminSignOut, getAdminSession, onAdminAuthChange } from '../../utils/adminAuth';
import { BRAND_FONT } from '../../theme/brand.js';

// ==========================================================
// ADMIN LAYOUT — CẤU TRÚC MỚI CỦA ADMIN PORTAL
// ==========================================================
// Trước đây "/admin" là 1 component DUY NHẤT vừa lo đăng nhập vừa lo cả form
// soạn đề thi khổng lồ — không có chỗ cho tính năng Blog. Giờ tách thành:
//   - AdminLayout.jsx (file này): gác cổng đăng nhập + khung tab điều hướng
//     "Đề thi" / "Blog", dùng <Outlet /> để hiện đúng nội dung theo route con.
//   - AdminTestsTab.jsx + AdminTestForm.jsx: quản lý đề thi (tách từ AdminScreen.jsx cũ)
//   - AdminBlogTab.jsx + AdminBlogForm.jsx: quản lý blog (tính năng mới)
// Route con nằm dưới "/admin/tests/*" và "/admin/blog/*" — xem App.jsx.
// ==========================================================
const AdminLayout = () => {
    const navigate = useNavigate();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        let isMounted = true;
        getAdminSession().then((session) => {
            if (!isMounted) return;
            setIsAuthenticated(!!session);
            setCheckingSession(false);
        });
        const unsubscribe = onAdminAuthChange((session) => setIsAuthenticated(!!session));
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);
        try {
            const { error } = await adminSignIn(emailInput, passwordInput);
            if (error) {
                setLoginError('Sai email hoặc mật khẩu!');
                setPasswordInput('');
                return;
            }
            setIsAuthenticated(true);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await adminSignOut();
        setIsAuthenticated(false);
        navigate('/tests');
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-[#1e40a1]"></i>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" style={BRAND_FONT}>
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full relative">
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Admin Access</h2>
                    <form onSubmit={handleLoginSubmit}>
                        <input type="email" required autoFocus value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Email admin..." className="w-full border border-gray-300 rounded-lg p-3 mb-3 outline-none focus:ring-2 focus:ring-[#1e40a1]" />
                        <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Nhập mật khẩu..." className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-[#1e40a1]" />
                        {loginError && <p className="text-red-500 text-sm font-medium mb-4 text-center">{loginError}</p>}
                        <button type="submit" disabled={isLoggingIn} className="w-full bg-[#1e40a1] hover:brightness-95 text-white font-semibold py-3 rounded-lg transition cursor-pointer disabled:opacity-50">
                            {isLoggingIn ? 'Đang kiểm tra...' : 'Xác nhận'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const tabLinkClass = ({ isActive }) =>
        `px-5 py-3 text-sm font-bold rounded-t-xl transition-colors flex items-center gap-2 ${isActive
            ? 'bg-white text-[#1e40a1] border border-b-0 border-slate-200'
            : 'text-slate-500 hover:text-[#1e40a1]'
        }`;

    return (
        <div className="min-h-screen bg-slate-50" style={BRAND_FONT}>
            <header className="bg-[#1a1b21] text-white px-6 py-3.5 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-lg">IELTS-TV</span>
                    <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-slate-300">Admin Portal</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/tests" target="_blank" className="text-slate-300 hover:text-white text-sm font-semibold flex items-center gap-1.5">
                        <i className="fa-solid fa-up-right-from-square"></i> Xem site
                    </Link>
                    <button onClick={handleLogout} className="bg-white/10 hover:bg-rose-500/80 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5">
                        <i className="fa-solid fa-right-from-bracket"></i> Thoát
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 pt-6">
                <nav className="flex gap-1 border-b border-slate-200">
                    <NavLink to="/admin/tests" className={tabLinkClass}>
                        <i className="fa-solid fa-file-lines"></i> Đề thi
                    </NavLink>
                    <NavLink to="/admin/blog" className={tabLinkClass}>
                        <i className="fa-solid fa-newspaper"></i> Blog
                    </NavLink>
                </nav>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
