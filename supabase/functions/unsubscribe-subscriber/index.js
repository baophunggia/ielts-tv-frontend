// ==========================================================
// SUPABASE EDGE FUNCTION: unsubscribe-subscriber
// ==========================================================
// Được gọi khi người nhận email bấm link "Hủy đăng ký" — vì vậy PHẢI truy
// cập công khai được (không yêu cầu đăng nhập/JWT), khác với
// notify-new-posts (chỉ Cron Trigger nội bộ gọi tới).
//
// QUAN TRỌNG khi deploy: phải thêm cờ --no-verify-jwt, nếu không Supabase
// sẽ chặn mọi request không có JWT hợp lệ — người dùng bấm link trong email
// sẽ gặp lỗi 401 Unauthorized:
//   supabase functions deploy unsubscribe-subscriber --no-verify-jwt
//
// Dùng service_role key (chỉ tồn tại phía server, không lộ ra frontend) để
// xoá đúng 1 dòng subscriber theo id — bỏ qua RLS 1 cách AN TOÀN vì logic
// đã tự giới hạn đúng phạm vi (chỉ xoá theo id cụ thể trong URL, không có
// thao tác nào khác).
// ==========================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

function htmlPage(message, isError = false) {
    return new Response(
        `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IELTS-TV</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #fff8e1; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { background: #fff; padding: 32px 40px; border-radius: 20px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.08); max-width: 380px; }
    h1 { color: #1e40a1; font-size: 20px; margin: 0 0 12px; }
    p { color: #4a5568; margin: 0; line-height: 1.6; }
    .icon { font-size: 40px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${isError ? '⚠️' : '✅'}</div>
    <h1>IELTS-TV</h1>
    <p>${message}</p>
  </div>
</body>
</html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return htmlPage('Liên kết hủy đăng ký không hợp lệ.', true);
    }

    try {
        const { error } = await supabaseAdmin.from('subscribers').delete().eq('id', id);
        if (error) throw error;
        return htmlPage('Bạn đã hủy đăng ký nhận bài viết mới thành công. Rất tiếc phải chia tay bạn!');
    } catch (err) {
        console.error('unsubscribe-subscriber lỗi:', err);
        return htmlPage('Có lỗi xảy ra, vui lòng thử lại sau hoặc liên hệ trực tiếp với IELTS-TV.', true);
    }
});
