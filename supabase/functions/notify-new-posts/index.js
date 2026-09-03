// ==========================================================
// SUPABASE EDGE FUNCTION: notify-new-posts
// ==========================================================
// Chạy ĐỊNH KỲ qua Cron Trigger (KHÔNG dùng setInterval trong trình duyệt —
// đúng theo yêu cầu ban đầu, vì trình duyệt của khách không phải lúc nào
// cũng mở, không thể dùng làm nơi chạy tác vụ nền đáng tin cậy).
//
// MỖI LẦN CHẠY, function này làm 2 việc:
//   1. Tự động chuyển các bài đang "scheduled" mà đã tới giờ `scheduled_at`
//      sang "published" (hoàn thiện nốt phần lên lịch đăng bài còn dang dở
//      từ Phase 1 — trước đây chỉ lưu scheduled_at, chưa có gì tự publish).
//   2. Tìm các bài đã "published" nhưng CHƯA từng gửi email thông báo
//      (cột notified_at còn NULL), gửi email cho toàn bộ subscriber, rồi
//      đánh dấu notified_at để lần chạy sau không gửi lặp lại.
//
// TRIỂN KHAI (xem thêm supabase/functions/README.md):
//   supabase functions deploy notify-new-posts
//   supabase secrets set RESEND_API_KEY=...
//   supabase secrets set SITE_URL=https://ielts-tv.com
//   supabase secrets set NOTIFY_FROM_EMAIL="IELTS-TV <notify@yourdomain.com>"
//   Rồi vào Supabase Dashboard > Edge Functions > notify-new-posts > Cron,
//   đặt lịch chạy định kỳ (khuyến nghị mỗi 10 phút): */10 * * * *
// ==========================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://ielts-tv.com'; // TODO: đổi thành domain thật
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') || 'IELTS-TV <notify@ielts-tv.com>'; // TODO: domain đã verify trên Resend

// service_role key CHỈ tồn tại trong môi trường Edge Function (server-side),
// KHÔNG BAO GIỜ lộ ra frontend — đây là lý do việc gửi email/publish tự động
// phải làm ở đây chứ không phải ở React.
const supabaseAdmin = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function renderEmailHtml(post, unsubscribeUrl) {
    const postUrl = `${SITE_URL}/blogs/${post.slug}`;
    return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; background:#fff8e1; padding: 32px 24px;">
    <h2 style="color:#1e40a1; margin: 0 0 4px; font-size: 22px;">IELTS-TV</h2>
    <p style="color:#4a5568; font-size: 13px; margin: 0 0 16px;">Có bài viết mới vừa được đăng</p>
    <div style="background:#ffffff; border-radius:16px; padding:24px;">
      <h1 style="font-size:20px; color:#2d3748; margin:0 0 12px;">${escapeHtml(post.title)}</h1>
      <p style="color:#4a5568; font-size:14px; line-height:1.6; margin:0;">${escapeHtml(post.excerpt)}</p>
      <a href="${postUrl}" style="display:inline-block; margin-top:18px; background:#ffca28; color:#2d3748; font-weight:bold; font-size:14px; padding:12px 26px; border-radius:999px; text-decoration:none;">Đọc bài viết →</a>
    </div>
    <p style="color:#94a3b8; font-size:11px; margin-top:24px; text-align:center; line-height:1.6;">
      Bạn nhận được email này vì đã đăng ký nhận bài viết mới từ IELTS-TV.<br/>
      <a href="${unsubscribeUrl}" style="color:#94a3b8;">Hủy đăng ký nhận email</a>
    </p>
  </div>`.trim();
}

// Gửi 1 lô email qua Resend Batch API (tối đa 100 email/lần gọi theo giới
// hạn của Resend — chia nhỏ subscriber thành từng lô nếu danh sách dài hơn).
async function sendBatch(emails) {
    const resp = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(emails),
    });
    if (!resp.ok) {
        const text = await resp.text();
        console.error('Gửi 1 lô email thất bại:', resp.status, text);
        return false;
    }
    return true;
}

Deno.serve(async (_req) => {
    try {
        if (!RESEND_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Thiếu biến môi trường RESEND_API_KEY — chưa cấu hình dịch vụ gửi email.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const nowIso = new Date().toISOString();

        // ---------- BƯỚC 1: Tự động publish các bài "scheduled" đã tới giờ ----------
        const { data: duePosts, error: dueError } = await supabaseAdmin
            .from('blogs')
            .update({ status: 'published', published_at: nowIso })
            .eq('status', 'scheduled')
            .lte('scheduled_at', nowIso)
            .select('id');
        if (dueError) throw dueError;

        // ---------- BƯỚC 2: Tìm bài đã published nhưng chưa gửi thông báo ----------
        const { data: unnotifiedPosts, error: fetchError } = await supabaseAdmin
            .from('blogs')
            .select('id, title, slug, excerpt')
            .eq('status', 'published')
            .is('notified_at', null)
            .lte('published_at', nowIso);
        if (fetchError) throw fetchError;

        if (!unnotifiedPosts || unnotifiedPosts.length === 0) {
            return new Response(
                JSON.stringify({ ok: true, autoPublished: duePosts?.length || 0, postsNotified: 0, emailsSent: 0 }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { data: subscribers, error: subError } = await supabaseAdmin.from('subscribers').select('id, email');
        if (subError) throw subError;

        let totalSent = 0;
        for (const post of unnotifiedPosts) {
            if (subscribers && subscribers.length > 0) {
                for (let i = 0; i < subscribers.length; i += 100) {
                    const batch = subscribers.slice(i, i + 100).map((sub) => ({
                        from: FROM_EMAIL,
                        to: [sub.email],
                        subject: `[IELTS-TV] Bài viết mới: ${post.title}`,
                        html: renderEmailHtml(post, `${SUPABASE_URL}/functions/v1/unsubscribe-subscriber?id=${sub.id}`),
                    }));
                    const ok = await sendBatch(batch);
                    if (ok) totalSent += batch.length;
                }
            }

            // Đánh dấu đã gửi thông báo cho bài này — dù danh sách subscriber rỗng
            // vẫn đánh dấu để không lặp lại việc kiểm tra bài này ở lần cron sau.
            await supabaseAdmin.from('blogs').update({ notified_at: nowIso }).eq('id', post.id);
        }

        return new Response(
            JSON.stringify({
                ok: true,
                autoPublished: duePosts?.length || 0,
                postsNotified: unnotifiedPosts.length,
                emailsSent: totalSent,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('notify-new-posts lỗi:', err);
        return new Response(JSON.stringify({ error: String(err?.message || err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
