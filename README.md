# StudySphere

StudySphere, kullanıcıların derslerini/konularını organize edip çalışma seanslarını takip edebildiği, arkadaşlarıyla birlikte gerçek zamanlı çalışma odalarında buluşabildiği ve başarımlar kazanabildiği bir çalışma takip uygulamasıdır. Proje bir **backend API** (NestJS) ve bir **mobil uygulama** (Expo / React Native) olmak üzere iki parçadan oluşur.

## Özellikler

- **Kimlik doğrulama** — JWT access/refresh token akışı, şifre değiştirme
- **Evren / Ders / Konu (Universe / Subject / Topic)** — kullanıcı tanımlı, serbest bir hiyerarşi içinde ders ve konu yönetimi
- **Çalışma seansları** — başlatma/bitirme, geçmiş, özet istatistikler
- **İstatistikler** — konu/ders bazlı performans, toplam çalışma süresi, doğru/yanlış oranı
- **Görevlendirme (Topic Tasks)** — bir konuya özel görev atama, göreve not ekleme, "Görevlerim" ekranı
- **Arkadaşlık sistemi** — istek gönderme/kabul etme, çevrimiçi durum takibi (çalışıyor / molada / çevrimiçi / çevrimdışı), arkadaş profili görüntüleme
- **Çalışma Odaları (Study Rooms)** — Socket.IO ile gerçek zamanlı ortak çalışma odaları
- **Başarımlar (Achievements)** — 9 kategori: toplam soru, toplam doğru, hatasız seans, çalışma süresi, seri (streak), sosyal çalışma süresi, arkadaş sayısı, oda kurma sayısı, ders çeşitliliği

## Teknoloji Yığını

**Backend** (`studysphere-backend/`)
- NestJS + TypeScript
- TypeORM + PostgreSQL (`synchronize: true` — geliştirme aşamasında şema otomatik güncellenir, manuel migration yoktur)
- Passport + JWT (access/refresh token)
- Socket.IO (gerçek zamanlı çalışma odaları)
- class-validator / ValidationPipe, Throttler (rate limiting)

**Mobil** (`studysphere-mobile/`)
- Expo (SDK 57) / React Native
- React Navigation (iç içe stack + alt sekmeler)
- TanStack React Query (sunucu state yönetimi)
- Axios (interceptor'larla otomatik token ekleme ve 401'de refresh)
- Socket.IO client
- expo-secure-store (token'ların güvenli saklanması)
- react-native-chart-kit (istatistik grafikleri)

## Proje Yapısı

```
StudySphere/
├── studysphere-backend/     # NestJS API
│   ├── src/
│   │   ├── auth/             # Giriş, kayıt, JWT, refresh token
│   │   ├── users/
│   │   ├── universes/
│   │   ├── subjects/
│   │   ├── topics/
│   │   ├── topic-tasks/      # Görevlendirme
│   │   ├── study-sessions/
│   │   ├── study-room/       # Gerçek zamanlı çalışma odaları
│   │   ├── user-statistics/
│   │   ├── friends/          # Arkadaşlık + çevrimiçi durum
│   │   └── achievements/
│   └── docker-compose.yml    # Yerel PostgreSQL + pgAdmin
└── studysphere-mobile/       # Expo / React Native uygulaması
    └── src/
        ├── api/               # Backend istekleri (axios servisleri)
        ├── screens/
        ├── navigation/
        ├── hooks/
        ├── components/
        └── context/
```

## Kurulum

### Gereksinimler

- Node.js 18+
- Docker (yerel PostgreSQL için önerilir) veya kurulu bir PostgreSQL sunucusu
- Mobil test için [Expo Go](https://expo.dev/go) uygulaması ya da bir Android/iOS emulator

### Backend

```bash
cd studysphere-backend
npm install
cp .env.example .env
```

`.env` dosyasını açıp en azından `DB_PASSWORD` ve `JWT_SECRET` değerlerini kendi değerlerinizle değiştirin.

Yerel bir PostgreSQL başlatmak için (Docker kuruluysa):

```bash
docker compose up -d
```

Ardından API'yi geliştirme modunda başlatın:

```bash
npm run start:dev
```

`TypeOrmModule` `synchronize: true` ile çalıştığı için ilk açılışta gerekli tablolar otomatik oluşturulur. API varsayılan olarak `http://localhost:3000` üzerinde çalışır (`.env` içindeki `PORT` ile değiştirilebilir).

### Mobil uygulama

```bash
cd studysphere-mobile
npm install
cp .env.example .env
```

`.env` içindeki `EXPO_PUBLIC_API_URL` değerini backend'in çalıştığı bilgisayarın **yerel ağ IP adresi** ile güncelleyin (fiziksel telefondan test ediyorsanız `localhost` çalışmaz). Windows'ta `ipconfig`, macOS/Linux'ta `ifconfig` ya da `ip addr` ile IPv4 adresinizi öğrenebilirsiniz. Telefon ve bilgisayarın aynı Wi-Fi ağında olduğundan emin olun.

```bash
npx expo start
```

Açılan QR kodu Expo Go ile okutun veya bir emulator/simulator üzerinde çalıştırın.

## Ortam Değişkenleri

Gerçek `.env` dosyaları asla repoya girmez (`.gitignore`). Örnek/şablon değerler için:

- `studysphere-backend/.env.example`
- `studysphere-mobile/.env.example`

## Notlar

- Backend `synchronize: true` ile çalışır; production ortamı için TypeORM migration'larına geçilmesi önerilir.
- Bu proje aktif geliştirme aşamasındadır; bazı uç noktalarda (örn. `user-statistics`) yetkilendirme/sahiplik kontrolleri henüz eksiktir.
