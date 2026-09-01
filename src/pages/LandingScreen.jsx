// ==========================================================
// TRANG CHỦ MỚI (LANDING PAGE) — lấy cảm hứng từ classroom.html
// ==========================================================
// Trước đây route "/" load thẳng danh sách + bộ lọc đề thi (giống trang
// quản trị hơn là trang giới thiệu). Giờ đây "/" là trang giới thiệu nền
// tảng theo phong cách "bảng tin lớp học" nhiều màu sắc, hình khối bo tròn
// hữu cơ — còn danh sách đề thi đầy đủ chuyển qua "/tests" (xem TestsScreen.jsx).
//
// Mục "Resources" bên dưới hiển thị xem trước vài đề thi mới nhất + nút dẫn
// vào trang danh sách đầy đủ, thay vì tải toàn bộ danh sách ngay khi vào trang.
// ==========================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';
import teacherPhoto from '../assets/tv_img.png';
import { BRAND_FONT } from '../theme/brand.js';
import { fetchLatestPublishedBlogs } from '../services/blogPublicService.js';

const LEVEL_LABEL = {
    '45': 'Band 4.0 - 5.0',
    '56': 'Band 5.0 - 6.0',
    '78': 'Band 7.0 - 8.0',
    '89': 'Band 8.0 - 9.0',
};

// Bảng màu xoay vòng cho card bài viết ở mục Class News (giữ đúng phong cách brand)
const NEWS_CARD_COLORS = ['bg-[#ff9800]', 'bg-[#4caf50]', 'bg-[#2a4365]'];

// Icon "mặt cười" tối giản tái hiện tinh thần các khối "nhân vật" trong classroom.html,
// dùng SVG nội tuyến (không phụ thuộc ảnh ngoài) để giữ trang nhẹ và luôn hiển thị đúng.
const FaceDots = ({ className = '' }) => (
    <div className={`flex gap-3 items-center ${className}`}>
        <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#1a1b21] rounded-full"></div>
        </div>
        <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#1a1b21] rounded-full"></div>
        </div>
    </div>
);

// ==========================================================
// THÔNG TIN LIÊN HỆ CỦA GIÁO VIÊN
// TODO: Dán link Facebook cá nhân thật của Thu Vân vào facebookUrl bên dưới,
// và thay email/phone bằng thông tin thật trước khi công khai trang.
// ==========================================================
const CONTACT_INFO = {
    facebookUrl: 'https://facebook.com/your-profile-here', // <-- dán link Facebook thật vào đây
    email: 'contact@ielts-tv.vn', // <-- thay email thật vào đây
    phone: '0123 456 789', // <-- thay số điện thoại thật vào đây
};

// TÍNH NĂNG MỚI: nút icon tròn cho mục Liên hệ.
// - mode="link": Facebook — click mở link trong tab mới, không có popup.
// - mode="copy": Email / SĐT — click sẽ copy giá trị vào clipboard và hiện
//   popup nhỏ xác nhận ngay phía trên icon, tự ẩn sau 2 giây. Cách này tránh
//   hiển thị thẳng chuỗi email/SĐT dài trong khối "Liên hệ" gây tràn chữ.
const ContactIconButton = ({ mode, icon, label, href, value, copiedField, onCopy }) => {
    const isCopied = copiedField === label;

    const buttonClass = 'relative w-11 h-11 md:w-12 md:h-12 rounded-full bg-white hover:bg-white/90 flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer';

    const Popup = () => (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-30 whitespace-nowrap bg-[#2d3748] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
            {isCopied ? (
                <>
                    <i className="fa-solid fa-check text-emerald-400"></i> Đã copy: {value}
                </>
            ) : (
                <span>{value}</span>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-[#2d3748] rotate-45"></div>
        </div>
    );

    if (mode === 'link') {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass} title={label} aria-label={label}>
                <i className="fa-brands fa-facebook-f text-lg text-[#1877f2]"></i>
            </a>
        );
    }

    return (
        <div className="relative">
            <button type="button" onClick={() => onCopy(label, value)} className={buttonClass} title={label} aria-label={`Copy ${label}`}>
                <i className={`fa-solid ${icon} text-lg text-[#2d3748]`}></i>
            </button>
            {copiedField === label && <Popup />}
        </div>
    );
};

const LandingScreen = () => {
    const [previewTests, setPreviewTests] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [copiedField, setCopiedField] = useState(null);

    // TÍNH NĂNG MỚI (PHASE 2): 3 bài blog mới nhất cho mục "Class News"
    const [previewPosts, setPreviewPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                // TÍNH NĂNG MỚI: chỉ lấy 3 đề thi mới nhất làm xem trước ở mục Resources,
                // KHÔNG tải toàn bộ danh sách ngay trên trang chủ như trước đây.
                const { data, error } = await supabase
                    .from('reading_tests')
                    .select('id, title, level, created_at')
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (error) throw error;
                setPreviewTests(data || []);
            } catch (err) {
                console.error('Không tải được đề thi xem trước:', err);
            } finally {
                setLoadingPreview(false);
            }
        };
        fetchPreview();

        const fetchPosts = async () => {
            try {
                const data = await fetchLatestPublishedBlogs(3);
                setPreviewPosts(data);
            } catch (err) {
                console.error('Không tải được bài viết blog xem trước:', err);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, []);

    const scrollTo = (id) => (e) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    // TÍNH NĂNG MỚI: copy email/SĐT vào clipboard khi click icon, hiện popup xác
    // nhận 2 giây rồi tự ẩn. Có fallback nếu trình duyệt chặn Clipboard API.
    const handleCopyContact = async (label, value) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (err) {
            console.warn('Không thể tự động copy, người dùng cần copy thủ công:', err);
        }
        setCopiedField(label);
        setTimeout(() => {
            setCopiedField((current) => (current === label ? null : current));
        }, 2000);
    };

    const previewCardColors = ['bg-[#81d4fa]', 'bg-[#4caf50]', 'bg-[#ffca28]'];

    return (
        <div className="bg-[#fff8e1] overflow-x-hidden" style={BRAND_FONT}>
            {/* ============ TOP NAV ============ */}
            <nav className="bg-[#faf8ff] sticky top-0 z-50 border-b-4 border-[#1e40a1] shadow-[4px_4px_0px_0px_rgba(30,64,161,0.9)] w-full">
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
                    <div className="text-2xl font-extrabold text-[#1e40a1]">IELTS-TV</div>
                    <div className="hidden md:flex items-center gap-7">
                        <a href="#teacher" onClick={scrollTo('teacher')} className="text-[#444652] hover:text-[#1e40a1] font-bold text-sm transition-colors">Giáo viên</a>
                        <a href="#why" onClick={scrollTo('why')} className="text-[#444652] hover:text-[#1e40a1] font-bold text-sm transition-colors">Vì sao chọn</a>
                        <a href="#how" onClick={scrollTo('how')} className="text-[#444652] hover:text-[#1e40a1] font-bold text-sm transition-colors">Cách hoạt động</a>
                        <a href="#news" onClick={scrollTo('news')} className="text-[#444652] hover:text-[#1e40a1] font-bold text-sm transition-colors">Class News</a>
                        <a href="#resources" onClick={scrollTo('resources')} className="text-[#444652] hover:text-[#1e40a1] font-bold text-sm transition-colors">Resources</a>
                    </div>
                    <Link
                        to="/admin"
                        className="bg-[#1e40a1] text-white font-bold text-sm py-2 px-6 rounded-full shadow-[4px_4px_0px_0px_#1a1b21] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1a1b21] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                    >
                        Admin
                    </Link>
                </div>
            </nav>

            <main>
                {/* ============ 1. HERO ============ */}
                <section className="bg-[#36517e] min-h-[70vh] flex items-center relative overflow-hidden py-20">
                    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center relative z-10 w-full">
                        <div className="text-white space-y-6">
                            <h1 className="text-5xl md:text-[72px] md:leading-[1.05] text-[#ffca28] font-extrabold">
                                IELTS<br />Reading<br />Practice
                            </h1>
                            <p className="text-lg md:text-xl text-white font-medium max-w-lg">
                                Luyện đọc hiểu IELTS với giao diện mô phỏng phòng thi thật: tách đôi màn hình, đồng hồ đếm giờ, bôi đen ghi chú, chấm điểm &amp; chia sẻ kết quả tức thì.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Link
                                    to="/tests"
                                    className="bg-[#ffca28] text-[#2d3748] font-bold text-base py-4 px-8 rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none transition-all"
                                >
                                    Bắt đầu luyện tập <i className="fa-solid fa-arrow-right ml-1"></i>
                                </Link>
                                <a
                                    href="#how"
                                    onClick={scrollTo('how')}
                                    className="border-2 border-white/40 text-white font-bold text-base py-4 px-8 rounded-[20px] hover:bg-white/10 transition-all"
                                >
                                    Xem cách hoạt động
                                </a>
                            </div>
                        </div>

                        <div className="relative h-[420px] hidden md:block">
                            {/* TÍNH NĂNG MỚI: 4 khối hình chuyển động nhẹ nhàng (float) giống bản gốc classroom.html,
                                so le animate-float / animate-float-delayed để tạo cảm giác sống động, không đồng loạt cứng nhắc. */}
                            <div className="absolute right-[18%] top-[8%] w-32 h-32 bg-[#f48fb1] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] flex items-center justify-center animate-float">
                                <FaceDots />
                            </div>
                            <div className="absolute right-[42%] top-[35%] w-48 h-48 bg-[#4267b2] rounded-[40px] rotate-[20deg] shadow-lg flex items-center justify-center animate-float-delayed">
                                <FaceDots className="-rotate-[20deg]" />
                            </div>
                            <div className="absolute right-[8%] bottom-[15%] w-40 h-28 bg-[#ff9800] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] flex items-center justify-center animate-float">
                                <FaceDots />
                            </div>
                            <div className="absolute right-[48%] bottom-[5%] w-28 h-40 bg-[#81d4fa] rounded-full flex items-center justify-center animate-float-delayed">
                                <FaceDots className="rotate-90" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ 2. TEACHER NAME (Thông tin giáo viên) ============ */}
                {/* TÍNH NĂNG MỚI: theo đúng mẫu classroom.html — nội dung bên dưới
                    là chỗ trống hướng dẫn để giáo viên tự điền thông tin thật của mình
                    trước khi công khai trang (tên, chuyên môn, kinh nghiệm, liên hệ). */}
                <section id="teacher" className="bg-white py-20 relative overflow-hidden scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-4xl md:text-[56px] font-extrabold text-[#2d3748] leading-tight">
                                Giáo viên<br />phụ trách
                            </h2>
                            <h3 className="text-2xl font-extrabold text-[#1e40a1]">Mrs.Thu Vân</h3>
                            <div className="text-base text-[#4a5568] max-w-md space-y-3">
                                <p>Giới thiệu ngắn gọn về giáo viên phụ trách nội dung các đề thi trên IELTS-TV, ví dụ:</p>
                                <ul className="list-disc pl-6 space-y-1.5">
                                    <li>Trình độ chuyên môn (bằng cấp, chứng chỉ IELTS/TESOL...)</li>
                                    <li>Số năm kinh nghiệm giảng dạy / luyện thi IELTS</li>
                                    <li>Thành tích nổi bật (band điểm học viên đạt được, số lượng học viên...)</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex-1 relative flex justify-center items-center h-[340px] md:h-[500px] w-full">
                            {/* TÍNH NĂNG MỚI: khung ảnh tăng lên 380px (trước là 240px) để ảnh giáo viên
                                trông rõ nét hơn — có breakpoint riêng cho mobile để tránh tràn màn hình nhỏ. */}
                            {/* TÍNH NĂNG MỚI: vòng tròn nền "thở" nhẹ (breathe) — thuần trang trí, phía
                                sau ảnh, không xoay/không có chữ nên co giãn nhẹ không gây khó nhìn. */}
                            <div className="absolute w-[300px] h-[300px] md:w-[440px] md:h-[440px] bg-[#9b7ebd] rounded-full z-0 animate-breathe"></div>
                            <div className="relative z-10 w-[260px] h-[260px] md:w-[380px] md:h-[380px] rounded-full overflow-hidden border-8 border-white shadow-lg">
                                <img
                                    src={teacherPhoto}
                                    alt="Ảnh giáo viên Mrs.Thu Vân"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* TÍNH NĂNG MỚI: Liên hệ hiển thị dạng 3 icon tròn thay vì text dài
                                (tránh tràn chữ trong khối màu). Facebook -> mở link; Email/SĐT ->
                                copy vào clipboard + popup xác nhận khi click.
                                Dùng "sway" (trượt ngang nhẹ, KHÔNG xoay) vì khối này có chữ + nút bấm
                                — xoay sẽ khó đọc/khó bấm chính xác, trượt ngang nhẹ vẫn giữ dễ tương tác. */}
                            <div className="absolute -right-2 md:-right-6 bottom-2 md:bottom-6 z-20 bg-[#f48fb1] rounded-[28px] px-5 py-4 md:px-6 md:py-5 shadow-lg flex flex-col items-center gap-3 animate-sway">
                                <h4 className="text-sm md:text-base font-extrabold text-[#2d3748]">Liên hệ</h4>
                                <div className="flex items-center gap-3">
                                    <ContactIconButton mode="link" label="Facebook" href={CONTACT_INFO.facebookUrl} />
                                    <ContactIconButton mode="copy" icon="fa-envelope" label="Email" value={CONTACT_INFO.email} copiedField={copiedField} onCopy={handleCopyContact} />
                                    <ContactIconButton mode="copy" icon="fa-phone" label="Điện thoại" value={CONTACT_INFO.phone} copiedField={copiedField} onCopy={handleCopyContact} />
                                </div>
                            </div>
                            {/* TÍNH NĂNG MỚI: blob thuần trang trí (chỉ có FaceDots, không chữ) -> dùng
                                "wiggle" (lắc xoay nhẹ), tạo cảm giác như 1 nhân vật tinh nghịch. */}
                            <div className="absolute -left-2 md:-left-6 top-4 md:top-10 z-20 w-16 h-16 md:w-24 md:h-24 bg-[#4caf50] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] flex items-center justify-center animate-wiggle">
                                <FaceDots className="scale-75" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ 3. VÌ SAO CHỌN IELTS-TV ============ */}
                <section id="why" className="bg-[#81d4fa] py-20 relative overflow-hidden scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-4xl md:text-[56px] font-extrabold text-[#2d3748] leading-tight mb-14 text-center">
                            Vì sao chọn IELTS-TV?
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: 'fa-table-columns',
                                    bg: 'bg-[#4267b2]',
                                    title: 'Giao diện y hệt phòng thi thật',
                                    desc: 'Tách đôi màn hình bài đọc & câu hỏi, kéo giãn tuỳ ý, đồng hồ đếm giờ trực tiếp — làm quen với đúng format thi thật.',
                                },
                                {
                                    icon: 'fa-highlighter',
                                    bg: 'bg-[#4caf50]',
                                    title: 'Bôi đen ghi chú, xoá nhanh 1 chạm',
                                    desc: 'Đánh dấu từ khoá ngay trong bài đọc như trên giấy thi, và xoá sạch toàn bộ chỉ với 1 nút bấm khi cần làm lại.',
                                },
                                {
                                    icon: 'fa-share-nodes',
                                    bg: 'bg-[#f48fb1]',
                                    title: 'Chấm điểm & chia sẻ kết quả ngay',
                                    desc: 'Nộp bài là có điểm tức thì kèm đáp án đúng/sai từng câu, tạo sẵn link chia sẻ để gửi giáo viên xem lại.',
                                },
                            ].map((f) => (
                                <div key={f.title} className="bg-white rounded-[32px] p-8 shadow-lg flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                                    <div className={`w-20 h-20 rounded-full ${f.bg} flex items-center justify-center shadow-md`}>
                                        <i className={`fa-solid ${f.icon} text-3xl text-white`}></i>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#2d3748]">{f.title}</h3>
                                    <p className="text-[#4a5568] text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ 4. CÁCH HOẠT ĐỘNG ============ */}
                <section id="how" className="bg-[#fff8e1] py-20 relative scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-[52px] font-extrabold text-[#2d3748] leading-tight">
                                Cách hoạt động
                            </h2>
                            <div className="space-y-5">
                                {[
                                    ['1', 'Chọn 1 đề thi', 'Vào mục Resources bên dưới hoặc trang "Đề thi" để chọn bài phù hợp trình độ.'],
                                    ['2', 'Làm bài như thi thật', 'Đọc bài, trả lời câu hỏi, bôi đen ghi chú tự do trong thời gian quy định.'],
                                    ['3', 'Nhận điểm & chia sẻ', 'Nộp bài để xem điểm ngay, copy link kết quả gửi cho giáo viên nếu cần.'],
                                ].map(([num, title, desc]) => (
                                    <div key={num} className="flex gap-4 items-start">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-[#1e40a1] text-white font-extrabold flex items-center justify-center">{num}</div>
                                        <div>
                                            <h3 className="font-bold text-[#2d3748] text-lg">{title}</h3>
                                            <p className="text-[#4a5568] text-sm">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex justify-center h-[380px] items-center">
                            {/* TÍNH NĂNG MỚI: vòng tròn có chữ -> dùng "breathe" (co giãn nhẹ, KHÔNG
                                xoay) để giữ nội dung dễ đọc, khác kiểu "float" của Hero cho đa dạng. */}
                            <div className="absolute w-[340px] h-[340px] bg-[#f48fb1] rounded-full flex flex-col justify-center items-center text-center p-10 shadow-md animate-breathe-delayed">
                                <h3 className="text-2xl font-extrabold text-[#2d3748] mb-3">Mẹo làm bài</h3>
                                <p className="text-sm text-[#2d3748] leading-relaxed">
                                    Đọc câu hỏi trước, bôi đen từ khoá trong bài đọc, và luôn theo dõi đồng hồ để phân bổ thời gian hợp lý.
                                </p>
                            </div>
                            {/* 2 blob thuần trang trí (không chữ) -> mỗi blob 1 kiểu động khác nhau
                                (wiggle vs float) để tổng thể trang không lặp lại 1 nhịp chuyển động duy nhất. */}
                            <div className="absolute -top-6 left-4 w-24 h-24 bg-[#4caf50] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] flex items-center justify-center animate-wiggle-delayed">
                                <FaceDots />
                            </div>
                            <div className="absolute -bottom-6 right-4 w-32 h-20 bg-[#ff9800] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] flex items-center justify-center animate-float">
                                <FaceDots />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ 4b. CLASS NEWS — Ghép nối dữ liệu blog thật (PHASE 2) ============ */}
                {/* TÍNH NĂNG MỚI: hiển thị 3 bài viết mới nhất đã publish, click vào mở
                    thẳng trang chi tiết (/blogs/:slug). Nút "Xem tất cả bài viết" dẫn sang
                    trang danh sách đầy đủ (/blogs) — cùng pattern với mục Resources bên dưới. */}
                <section id="news" className="bg-[#ffca28] py-20 scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-6 space-y-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <h2 className="text-4xl md:text-[56px] font-extrabold text-[#2d3748] leading-tight">
                                Class News
                            </h2>
                            <p className="text-[#2d3748]/80 text-sm max-w-md pb-1 font-medium">
                                Chia sẻ kinh nghiệm, mẹo làm bài và tin tức mới nhất từ IELTS-TV.
                            </p>
                        </div>

                        {loadingPosts ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((n) => <div key={n} className="bg-white/20 rounded-[32px] h-64 animate-pulse"></div>)}
                            </div>
                        ) : previewPosts.length === 0 ? (
                            <div className="bg-white/20 rounded-[32px] p-10 text-center text-[#2d3748]/70 font-medium">
                                Chưa có bài viết nào được đăng. Quay lại sau nhé!
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {previewPosts.map((post, idx) => (
                                    <Link
                                        key={post.id}
                                        to={`/blogs/${post.slug}`}
                                        className={`${NEWS_CARD_COLORS[idx % NEWS_CARD_COLORS.length]} rounded-[32px] p-8 flex flex-col h-full shadow-lg hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200`}
                                    >
                                        {post.categories?.name && (
                                            <span className="inline-block w-fit text-[11px] font-bold uppercase tracking-wide bg-white/20 text-white px-2.5 py-1 rounded-md mb-4">
                                                {post.categories.name}
                                            </span>
                                        )}
                                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{post.title}</h3>
                                        <p className="text-sm text-white/80 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                                        <span className="text-white text-sm font-bold underline decoration-2 underline-offset-4 mt-4">Đọc tiếp →</span>
                                    </Link>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center pt-2">
                            <Link
                                to="/blogs"
                                className="bg-[#2d3748] text-white font-extrabold text-base py-4 px-10 rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none transition-all"
                            >
                                Xem tất cả bài viết <i className="fa-solid fa-arrow-right ml-1"></i>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ============ 5. RESOURCES — MỤC QUAN TRỌNG NHẤT ============ */}
                {/* Đây là nơi thay thế cho việc tải toàn bộ danh sách đề thi ngay
                    trên trang chủ: chỉ xem trước vài đề mới nhất + dẫn vào /tests. */}
                <section id="resources" className="bg-[#2a4365] py-20 relative scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-6 space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <h2 className="text-4xl md:text-[56px] font-extrabold text-[#ffca28] leading-tight">
                                Resources
                            </h2>
                            <p className="text-white/80 text-base max-w-lg pb-1">
                                Kho đề thi Reading được cập nhật liên tục, chia theo từng mức band điểm mục tiêu.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {loadingPreview ? (
                                [1, 2, 3].map((n) => (
                                    <div key={n} className="bg-white/10 rounded-[24px] h-40 animate-pulse"></div>
                                ))
                            ) : previewTests.length === 0 ? (
                                <div className="md:col-span-3 bg-white/10 rounded-[24px] p-8 text-center text-white/70">
                                    Chưa có đề thi nào được đăng. Quay lại sau nhé!
                                </div>
                            ) : (
                                previewTests.map((test, idx) => (
                                    <Link
                                        key={test.id}
                                        to={`/test/${test.id}`}
                                        className={`${previewCardColors[idx % previewCardColors.length]} rounded-[24px] p-6 flex flex-col justify-between gap-4 shadow-lg hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200 min-h-[160px]`}
                                    >
                                        <span className="inline-block w-fit text-[11px] font-bold uppercase tracking-wide bg-white/70 text-[#2d3748] px-2.5 py-1 rounded-md">
                                            {LEVEL_LABEL[test.level] || 'Chưa phân loại'}
                                        </span>
                                        <h3 className="font-bold text-[#2d3748] text-lg leading-snug line-clamp-2">{test.title}</h3>
                                        <span className="text-[#2d3748] text-sm font-bold underline decoration-2 underline-offset-4">Làm bài ngay →</span>
                                    </Link>
                                ))
                            )}
                        </div>

                        <div className="flex justify-center pt-4">
                            <Link
                                to="/tests"
                                className="bg-[#ffca28] text-[#2d3748] font-extrabold text-base py-4 px-10 rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.35)] active:translate-y-1 active:shadow-none transition-all"
                            >
                                Xem toàn bộ đề thi <i className="fa-solid fa-arrow-right ml-1"></i>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ============ FOOTER ============ */}
            <footer className="bg-[#1a1b21] py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xl font-extrabold text-[#b6c4ff]">IELTS-TV</div>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link to="/" className="text-[#b6c4ff]/80 hover:text-[#ffca28] font-bold text-sm transition-colors">Trang chủ</Link>
                        <Link to="/tests" className="text-[#b6c4ff]/80 hover:text-[#ffca28] font-bold text-sm transition-colors">Danh sách đề thi</Link>
                        <Link to="/blogs" className="text-[#b6c4ff]/80 hover:text-[#ffca28] font-bold text-sm transition-colors">Blog</Link>
                        <Link to="/admin" className="text-[#b6c4ff]/80 hover:text-[#ffca28] font-bold text-sm transition-colors">Admin Portal</Link>
                    </div>
                    <div className="text-white/50 text-sm">© {new Date().getFullYear()} IELTS-TV</div>
                </div>
            </footer>
        </div>
    );
};

export default LandingScreen;
