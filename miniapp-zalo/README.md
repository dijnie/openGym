# openGym trên Zalo Mini App

Mini App ID: `3070714070908834081`

Backend: `https://gym.phungtiendung.dev`

Đây là ứng dụng **Testing** cho tài khoản openGym hiện có, nằm trong thư mục riêng
`miniapp-zalo/`, cùng cấp với `frontend/` và `api/`.

Ứng dụng có mã nguồn React, `package.json`, lockfile, dependency và cấu hình build
riêng. Mã nguồn được tách từ openGym v1.3.10 và tích hợp Zalo Native Storage, API
tuyệt đối cùng Bearer token. Build và deploy tại đây không đọc hay sửa mã nguồn
trong `frontend/`. Khi cập nhật giao diện web, cần chủ động chuyển những thay đổi
muốn áp dụng sang Mini App.

Backend vẫn là `https://gym.phungtiendung.dev`. Phần Coach còn sử dụng các module
thuần JavaScript trong `../api/coach/core/`, nên giữ ứng dụng trong repository này.

```text
openGym/
├── frontend/       # Website và Capacitor
├── miniapp-zalo/   # Mã nguồn, dependency và deploy Zalo
└── api/            # Backend
```

## Build và deploy

Từ thư mục gốc repository `openGym/`:

```bash
cd miniapp-zalo
npm ci
npm run build
npm run login
npm run deploy
```

`login` yêu cầu quét QR bằng tài khoản Zalo có quyền quản lý Mini App. Nếu CLI hỏi
Mini App ID, nhập `3070714070908834081`. Phiên đăng nhập có sẵn đã được chuyển từ
`frontend/.env` sang `miniapp-zalo/.env`; chỉ đăng nhập lại nếu phiên hết hạn.
CLI lưu thông tin đăng nhập trong `.env` đã được Git bỏ qua. Không đưa token hay
App Secret vào `.env.zalo`, mã nguồn hoặc các biến `VITE_*`.

`deploy` build lại rồi chỉ tải bản **Testing** lên Zalo, không Publish.
Đầu ra là `miniapp-zalo/dist/`. Cấu hình công khai nằm trong `.env.zalo`;
`app-config.json` trỏ tới entry cố định `assets/zalo.module.js`. Entry tải ứng dụng
và CSS qua dynamic import do Vite sinh, nên không cần cập nhật tên hash bằng tay.

Chạy `npm test` trong `miniapp-zalo/` để kiểm tra ghép tài khoản, khôi phục phiên,
đăng xuất và lưu dữ liệu qua Native Storage. Các alias `build:zalo`, `login:zalo`
và `deploy:zalo` cũng được giữ trong package này.

## Kết nối tài khoản

1. Mở website trong trình duyệt và đăng nhập tài khoản muốn sử dụng.
2. Vào **Settings → Account → Pair the mobile app** để lấy mã dùng một lần.
3. Mở bản Testing bằng QR do CLI cung cấp, nhập mã trong Mini App.
4. Nếu có câu hỏi về dữ liệu trên thiết bị, chọn cách hợp nhất phù hợp.

Phiên được lưu riêng trong Native Storage và gia hạn qua `/api/me`. Khi server
từ chối token, Mini App giữ bản dữ liệu đang có và cho phép ghép lại. Đăng xuất
xóa token trên thiết bị; quy tắc giữ dữ liệu chưa đồng bộ của openGym vẫn áp dụng.

## Kiểm tra trên điện thoại

- Android và iOS: mở ứng dụng, nhập mã, mở thư viện, ảnh/GIF và các trang thống kê.
- Ghi một buổi tập; xác nhận xuất hiện trên website. Sửa từ website và kiểm tra
  đồng bộ ngược lại trong Mini App.
- Đóng/mở Mini App; kiểm tra phiên đăng nhập và buổi tập được khôi phục.
- Ngắt mạng, ghi dữ liệu, bật mạng và kiểm tra đồng bộ. Đăng xuất rồi mở lại:
  ứng dụng phải yêu cầu ghép lại, không khôi phục phiên đã xóa.
- Kiểm tra ảnh/video tùy chỉnh, chọn file, xuất backup và nút quay lại trên thiết bị
  thật; các API trình duyệt này phụ thuộc môi trường WebView.

Native Storage của Zalo có giới hạn 5 MB và có thể loại dữ liệu cũ. Backend là nơi
giữ lịch sử lâu dài. Service worker, Web Push và tính năng Capacitor không được
bật trong bản Zalo; báo hết giờ khi ứng dụng ở nền chưa được hỗ trợ.

## Trước khi phát hành công khai

Bản này **chưa tích hợp đăng nhập tự động bằng Zalo**. Để triển khai SSO cần
Zalo App ID của ứng dụng cha và App Secret được cấu hình riêng trên server.
Backend cần xác minh access token qua Zalo Open API với `appsecret_proof`, rồi
liên kết Zalo user ID với tài khoản openGym. Mini App ID không thay thế App ID.

Hoàn tất xác thực chủ sở hữu, kiểm tra quyền/API, trải nghiệm và các liên kết ngoài
theo yêu cầu của Zalo, rồi gửi phiên bản Testing đi xét duyệt. Chỉ chọn **Publish**
sau khi được duyệt và đã kiểm thử trên điện thoại.

Tài liệu chính thức:

- [Chuyển ứng dụng web sang Mini App](https://docs.zaloplatforms.com/docs/MA/intro/getting-started/convert-web-app-to-mini-app)
- [Native Storage](https://docs.zaloplatforms.com/docs/MA/intro/best-practices/cache-data)
- [Đăng nhập Zalo](https://docs.zaloplatforms.com/docs/MA/intro/best-practices/authen-user)
- [Phát hành](https://docs.zaloplatforms.com/docs/MA/intro/public-mini-program)
