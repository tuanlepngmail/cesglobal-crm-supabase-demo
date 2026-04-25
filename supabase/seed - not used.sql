-- =============================================================================
-- CRM Pro — Seed demo data
--
-- Cách chạy:
--   1. Đã chạy migration (supabase/migrations/20260417032000_initial_schema.sql)
--   2. Đã tạo user trên Supabase Dashboard (Auth → Users → Add user,
--      bật Auto Confirm User)
--   3. Nếu user của bạn KHÔNG phải admin@crmpro.local, đổi biến v_email
--      ở dòng đầu DO block bên dưới (Find & Replace hoặc sửa trực tiếp).
--   4. Paste toàn bộ file này vào SQL Editor trên Supabase → Run.
--
-- Idempotent: chạy lại sẽ xoá toàn bộ leads + interactions cũ của user đó,
-- rồi tạo mới. User record không bị đụng.
-- =============================================================================

do $$
declare
  v_email text := 'admin@cesglobal.com.vn';  -- <-- Đổi email tại đây nếu cần
  v_owner uuid;
  v_lead_count int;
  v_intr_count int;
begin
  -- -------- 1. Lookup owner (raise nếu chưa có user) --------
  select id into v_owner from auth.users where email = v_email limit 1;
  if v_owner is null then
    raise exception
      'User % chưa tồn tại. Vào Auth → Users → Add user, bật Auto Confirm, rồi chạy lại seed.',
      v_email;
  end if;

  raise notice 'Seeding data cho user: % (id=%)', v_email, v_owner;

  -- -------- 2. Clear existing (idempotent) --------
  delete from public.interactions
    where lead_id in (select id from public.leads where owner_id = v_owner);
  delete from public.leads where owner_id = v_owner;

  -- -------- 3. Insert 18 leads --------
  insert into public.leads
    (owner_id, full_name, phone, email, status, source, position, location, notes, created_at)
  select
    v_owner,
    v.full_name,
    v.phone,
    v.email,
    v.status::public.lead_status,
    v.source::public.lead_source,
    v.position,
    v.location,
    v.notes,
    now() - v.age_interval::interval
  from (values
    -- ---- Hôm nay / hôm qua: "new" ----
    ('Nguyễn Thanh Tùng',  '090-111-2233', 'tung.nguyen@vntech.vn',    'new',        'facebook', 'CTO @ VNTech',               'Quận 1, TP. Hồ Chí Minh',   'Tìm giải pháp CRM thay thế HubSpot. Đội 80 người.',                                                       '2 hours'),
    ('Trần Mỹ Linh',       '094-888-9999', 'linh.tran@startup.io',     'new',        'google',   'Founder',                    'Đà Nẵng',                    'Đăng ký demo trên landing page.',                                                                         '5 hours'),
    ('Phan Thanh Bình',    '094-567-8901', null,                        'new',        'other',    null,                         null,                         'Khách đi ngang ghé hỏi — chưa rõ nhu cầu.',                                                               '8 hours'),
    ('Vũ Hoàng Phúc',      '097-222-8888', 'phuc.vu@realestate.vn',    'new',        'zalo',     'Giám đốc kinh doanh',         'Quận 7, TP. Hồ Chí Minh',   'Cần CRM cho đội sales BĐS 25 người.',                                                                     '22 hours'),
    ('Lý Ngọc Mai',        '093-234-5678', 'mai.ly@hrplus.vn',          'new',        'referral', 'HR Director @ HR Plus',       'Quận 5, TP. Hồ Chí Minh',   'Giới thiệu từ Lê Thị Thu. Đang tìm CRM cho team recruit.',                                                '1 day'),

    -- ---- Consulting (đang hot, nhiều nhất) ----
    ('Nguyễn Văn Hùng',    '090-123-4567', 'hung.nguyen@abccorp.com',  'consulting', 'facebook', 'Tech Lead @ ABC Corp',        'Quận 1, TP. Hồ Chí Minh',   'Quan tâm gói Opus cho đội 30 engineer. Cần SLA 99.9% và đào tạo onsite 2 ngày.',                          '3 days'),
    ('Lê Hoàng Nam',       '090-123-4888', 'nam.lehoang@sme.com',      'consulting', 'facebook', 'Giám đốc SME',                'Quận 1, TP. Hồ Chí Minh',   'Khách hàng quan tâm đến giải pháp CRM cho doanh nghiệp SME quy mô 50 nhân sự. Cần tích hợp với hệ thống kế toán hiện tại. Ưu tiên bảo mật dữ liệu và hỗ trợ tiếng Việt hoàn chỉnh.', '5 days'),
    ('Quách Khải',         '093-555-1212', 'khai.q@jtech.io',          'consulting', 'zalo',     'Lead Dev @ J-Tech',           'Quận 7, TP. Hồ Chí Minh',   'Cần tích hợp chatbot với Zalo OA hiện có. Đội 12 dev.',                                                   '6 days'),
    ('Đỗ Thị Hương',       '098-123-4567', 'huong.do@fashion.vn',      'consulting', 'referral', 'CMO @ Fashion House',         'Quận 3, TP. Hồ Chí Minh',   'Được giới thiệu từ StartUp X. Đang so sánh với Salesforce.',                                              '7 days'),
    ('Bùi Quang Vinh',     '091-456-7788', 'vinh.bui@edutech.vn',      'consulting', 'google',   'Head of Sales @ EduTech',     'Hà Nội',                     'EdTech 200 nhân viên. Cần CRM tích hợp email marketing.',                                                 '9 days'),
    ('Hoàng Thị Dung',     '093-456-7890', 'dung.hoang@retail.vn',     'consulting', 'facebook', 'COO @ Retail Co',             'Hải Phòng',                  'Chuỗi bán lẻ 15 cửa hàng. Ưu tiên app mobile cho sales.',                                                 '11 days'),
    ('Tạ Văn Khoa',        '092-789-1234', 'khoa.ta@cloudops.vn',      'consulting', 'zalo',     'DevOps Lead',                 'Quận 1, TP. Hồ Chí Minh',   'Đánh giá tính năng API cho tích hợp nội bộ.',                                                             '12 days'),

    -- ---- Won ----
    ('Lê Thị Thu',         '098-765-4321', 'thu.le@startupx.vn',       'won',        'referral', 'Founder @ StartUp X',         'Quận 2, TP. Hồ Chí Minh',   'Đã chốt gói Sonnet 12 tháng thanh toán theo quý. Go-live 15/05.',                                         '14 days'),
    ('Trương Minh Đức',    '090-999-1122', 'duc.truong@logisco.vn',    'won',        'direct',   'CEO @ LogisCo',               'Bình Dương',                 'Chốt hợp đồng sau 3 buổi demo. Annual plan.',                                                             '18 days'),
    ('Nguyễn Thị Hồng',    '094-111-3344', 'hong.nguyen@agency.vn',    'won',        'facebook', 'Director @ Marketing Agency', 'Quận 10, TP. Hồ Chí Minh',  'Upgrade từ Free lên Pro. Team 22 người.',                                                                 '22 days'),

    -- ---- Rejected ----
    ('Phạm Minh Quân',     '091-222-3333', 'quan.pham@greenco.com',    'rejected',   'direct',   'Manager @ Green Co.',         'Hà Nội',                     'Ngân sách không đủ Q2, hẹn xem xét lại Q3.',                                                              '15 days'),
    ('Đinh Văn Sáng',      '097-333-4444', 'sang.dinh@manufacture.vn', 'rejected',   'google',   'Director @ Manufacturing Co', 'Đồng Nai',                   'Chọn đối thủ vì giá rẻ hơn 30%.',                                                                         '25 days'),
    ('Ngô Thị Lan',        '098-555-6677', null,                        'rejected',   'other',    null,                         'Cần Thơ',                    'Chưa có nhu cầu CRM — công ty mới 5 người.',                                                              '30 days')
  ) as v(full_name, phone, email, status, source, position, location, notes, age_interval);

  get diagnostics v_lead_count = row_count;
  raise notice '  → Đã insert % leads', v_lead_count;

  -- -------- 4. Insert interactions (join leads theo full_name + owner) --------
  insert into public.interactions
    (lead_id, user_id, type, title, content, duration_minutes, occurred_at)
  select
    l.id,
    v_owner,
    i.type::public.interaction_type,
    i.title,
    i.content,
    i.duration_minutes,
    now() - i.age_interval::interval
  from (values
    -- Tùng (new)
    ('Nguyễn Thanh Tùng', 'email',   'Email chào mừng',                    'Đã gửi email giới thiệu và brochure sản phẩm.',                                                                       null, '1 hour'),

    -- Linh (new)
    ('Trần Mỹ Linh',      'call',    'Cuộc gọi chào hỏi',                  'Gọi xác nhận đăng ký demo. Hẹn thứ 5 14:00.',                                                                          8, '4 hours'),

    -- Phúc (new)
    ('Vũ Hoàng Phúc',     'chat',    'Trao đổi Zalo đầu tiên',             'Khách hỏi về khả năng import data từ Excel.',                                                                          null, '20 hours'),

    -- Mai (new, referral)
    ('Lý Ngọc Mai',       'call',    'Intro call từ referral',             'Chị Thu giới thiệu. Mai quan tâm module recruit + tracking CV.',                                                        18, '10 hours'),

    -- Hùng (consulting — rich)
    ('Nguyễn Văn Hùng',   'call',    'Cuộc gọi tư vấn lần 1',              'Tư vấn gói Opus và Sonnet. Khách phân vân chi phí đào tạo nhân sự.',                                                   25, '2 days'),
    ('Nguyễn Văn Hùng',   'email',   'Gửi báo giá',                        'Gửi brochure + bảng so sánh tính năng chi tiết.',                                                                       null, '1 day'),
    ('Nguyễn Văn Hùng',   'meeting', 'Demo online Zoom',                   'Demo 60 phút qua Zoom. Khách ấn tượng với module automation.',                                                         65, '6 hours'),

    -- Nam (consulting — rich)
    ('Lê Hoàng Nam',      'call',    'Cuộc gọi tư vấn lần 1',              'Tư vấn giải pháp cho đội 50 người. Cần tích hợp phần mềm kế toán Misa.',                                              30, '4 days'),
    ('Lê Hoàng Nam',      'email',   'Gửi báo giá chi tiết',               'Báo giá gói Opus + add-on tích hợp Misa.',                                                                              null, '3 days'),
    ('Lê Hoàng Nam',      'chat',    'Phản hồi qua Zalo',                  'Khách đang thảo luận nội bộ. Hẹn demo thứ 6 tuần này.',                                                                 null, '1 day'),
    ('Lê Hoàng Nam',      'meeting', 'Demo + Q&A tại văn phòng',           'Demo trực tiếp tại HCM. 5 stakeholders tham dự. Phản hồi tích cực.',                                                   90, '3 hours'),

    -- Khải (consulting)
    ('Quách Khải',        'chat',    'Trao đổi Zalo ban đầu',              'Khách hỏi khả năng tích hợp Zalo OA. Gửi tài liệu kỹ thuật.',                                                          null, '5 days'),
    ('Quách Khải',        'call',    'Cuộc gọi kỹ thuật',                  'Thảo luận webhook Zalo + rate limit. Đội tech của khách rất chuyên.',                                                  40, '2 days'),

    -- Hương (consulting)
    ('Đỗ Thị Hương',      'email',   'Intro email từ giới thiệu',          'Chị Thu giới thiệu. Gửi thư giới thiệu + case study fashion.',                                                          null, '6 days'),
    ('Đỗ Thị Hương',      'call',    'Discovery call',                     'Tìm hiểu nhu cầu. Khách đang so sánh với Salesforce Lightning.',                                                       45, '3 days'),

    -- Vinh (consulting)
    ('Bùi Quang Vinh',    'meeting', 'Demo onsite Hà Nội',                 'Demo cho CMO + 3 department heads. Focus module email marketing.',                                                     75, '4 days'),
    ('Bùi Quang Vinh',    'email',   'Follow-up + proposal',               'Gửi đề xuất triển khai 3 giai đoạn.',                                                                                    null, '1 day'),

    -- Dung (consulting)
    ('Hoàng Thị Dung',    'call',    'Khảo sát nhu cầu',                   'Chuỗi 15 cửa hàng. App mobile là must-have.',                                                                          35, '8 days'),
    ('Hoàng Thị Dung',    'email',   'Gửi mockup mobile app',              'Đính kèm Figma link + video demo app iOS.',                                                                              null, '4 days'),

    -- Khoa (consulting)
    ('Tạ Văn Khoa',       'email',   'Gửi API docs',                       'Đính kèm Postman collection + OpenAPI spec.',                                                                           null, '10 days'),
    ('Tạ Văn Khoa',       'chat',    'Trao đổi technical',                 'Khách confirm webhook format OK. Sẽ demo POC tuần sau.',                                                                null, '3 days'),

    -- Thu (won)
    ('Lê Thị Thu',        'meeting', 'Demo trực tiếp tại văn phòng',       'Họp demo 60 phút. Phản hồi rất tích cực, chốt deal ngay.',                                                             60, '12 days'),
    ('Lê Thị Thu',        'email',   'Gửi hợp đồng + hướng dẫn thanh toán','Đã gửi hợp đồng phiên bản cuối + invoice quý 1.',                                                                        null, '10 days'),
    ('Lê Thị Thu',        'call',    'Kick-off triển khai',                'Call kick-off với team. Go-live dự kiến 15/05.',                                                                         50, '5 days'),

    -- Đức (won)
    ('Trương Minh Đức',   'meeting', 'Demo lần 3 + ký hợp đồng',           'Ký annual plan. Team logistics 40 user.',                                                                              80, '14 days'),
    ('Trương Minh Đức',   'email',   'Welcome email',                      'Gửi onboarding pack + login credentials.',                                                                               null, '13 days'),

    -- Hồng (won)
    ('Nguyễn Thị Hồng',   'call',    'Upgrade discussion',                 'Free → Pro. Team 22 người cần thêm ghế + module reporting.',                                                           20, '20 days'),
    ('Nguyễn Thị Hồng',   'email',   'Invoice Pro plan',                   'Gửi invoice annual Pro. Confirm thanh toán.',                                                                            null, '19 days'),

    -- Quân (rejected)
    ('Phạm Minh Quân',    'call',    'Follow-up ngân sách',                'Khách xác nhận hoãn Q3. Note lại để re-engage sau.',                                                                   15, '10 days')
  ) as i(lead_full_name, type, title, content, duration_minutes, age_interval)
  join public.leads l
    on l.full_name = i.lead_full_name
   and l.owner_id  = v_owner;

  get diagnostics v_intr_count = row_count;
  raise notice '  → Đã insert % interactions', v_intr_count;

  -- -------- 5. Update profile full_name cho đẹp (optional) --------
  update public.profiles
    set full_name = 'Văn An Admin'
    where id = v_owner and (full_name is null or full_name = v_email);

  raise notice 'Done!  Mở app → login bằng % → tận hưởng dashboard đầy đặn.', v_email;
end $$;
