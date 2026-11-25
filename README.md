# Dua Kelinci Commercial Cockpit

Aplikasi web lokal untuk memantau kinerja penjualan **per Region dan Brand**, menandai serta mendiagnosis **5 Outlet Terlemah**, dan menyusun **ringkasan satu paragraf siap kirim ke Telegram** bagi Sales Manager — seluruhnya dihitung secara lokal di browser tanpa memerlukan backend atau API key.

## Cara Menjalankan

Prasyarat: **Node.js 18+** (disarankan Node 20+).

```bash
npm install
npm run dev
```

Buka URL lokal yang tampil di terminal (default: `http://localhost:5173`). File `sales.csv` di root repository akan dimuat dan dibersihkan secara otomatis saat aplikasi dibuka.

### Perintah Tambahan

```bash
# Menjalankan unit test analitik, pembersihan data, dan ringkasan Telegram
npm test

# Build produksi & preview lokal
npm run build
npm run preview
```

Anda juga dapat menguji dataset lain dengan tombol **Upload CSV** atau cukup **drag-and-drop** file `.csv` langsung ke jendela aplikasi.

---

## Fitur Utama

1. **Ringkasan 1 Paragraf untuk Telegram (Siap Kirim)**
   - Disusun otomatis dan sinkron 100% dengan filter aktif (periode, region, brand, kanal outlet).
   - Mendukung sintaks native klien Telegram (`**bold**`) dan teks polos, pilihan gaya **Ringkas** (eksekutif) maupun **Operasional** (dengan nama salesman & radar outlet dormant), editor manual, pratinjau tampilan mobile Telegram, tombol **Salin Pesan**, serta **Buka Telegram**.
2. **Tren Penjualan & Momentum Run-Rate Harian**
   - Grafik interaktif harian/mingguan yang menandai batas bulan dan mendeteksi periode parsial (Oktober 1–14 Okt) lengkap dengan perbandingan **daily run-rate** (`+5,8%/hari` Okt vs Sep) agar angka Oktober parsial tidak salah dibaca sebagai penurunan omzet.
   - Bar komposisi kanal outlet (*Grosir*, *Toko Kelontong*, *Warung*, *Minimarket*) yang memperlihatkan kontribusi 8 Grosir (~64% total penjualan).
3. **Penjualan per Region, Brand & Matriks Region × Brand**
   - **Non-collapsing cross-filtering:** mengklik bar Region/Brand atau sel Matriks menyorot pilihan tanpa menghilangkan pembanding lain, sehingga perpindahan filter cukup 1 klik.
   - Toggle 3 metrik pada matriks heatmap (**Net Sales Rp**, **Share di Region %**, **Karton**) beserta sorotan *white-space* penetrasi terendah.
4. **5 Outlet Terlemah + Diagnosis Otomatis & Radar Churn**
   - Dikelompokkan ketat per `outlet_id` dan dibandingkan terhadap **peer-group tipe outlet yang sama** (bukan rata-rata nasional yang terdistorsi Grosir).
   - Diagnosis otomatis per outlet (mis. *drop size 1,0 ktn/inv* vs rata-rata peer 5,4 ktn/inv, absennya brand flagship *Kacang Dua Kelinci*, frekuensi order rendah, dan 0% diskon).
   - Klik baris outlet mana pun untuk membuka **Panel Diagnosis & Riwayat Transaksi** (*slide-over drawer*).
   - Dilengkapi **Radar Churn** untuk memantau outlet aktif periode sebelumnya yang belum melakukan *repeat order* di bulan berjalan.

---

## Catatan Audit & Pembersihan Data (`sales.csv`)

Pada dataset bawaan (`sales.csv`, periode **1 Sep–14 Okt 2026**), pipeline pembersihan lokal otomatis menangani beberapa anomali data mentah (dapat dilihat lengkap melalui tombol **Audit Data** di header aplikasi):

- **1.351 baris mentah → 1.349 baris bersih**: 2 baris duplikat identik otomatis dihapus.
- **8 normalisasi nama region**: menyatukan variasi penulisan (`Jabar`, `JAWA BARAT`, `JABODETABEK`) ke nama kanonis.
- **2 salesman kosong di-backfill**: dilengkapi otomatis dari baris lain pada nomor invoice yang sama.
- **Spasi berlebih (leading/trailing whitespace)** dirapikan pada seluruh kolom teks.
- **Transaksi retur (`RTR900001`, `-Rp528.000`)** dipertahankan mengurangi Net Sales agar mencerminkan penjualan bersih aktual (dan tidak dipakai sebagai tanggal order terakhir).
- **Nama toko kembar** (mis. *Toko Sinar Abadi* pada beberapa `outlet_id` berbeda) selalu diagregasi berdasarkan `outlet_id`.

---

## Struktur Ringkas

```text
├── sales.csv                          # Dataset penjualan bawaan
├── src/
│   ├── lib/
│   │   ├── salesAnalytics.ts          # Parser CSV, data cleaning, peer benchmark, run-rate, churn & cross-filter
│   │   ├── telegramSummary.ts         # Generator ringkasan 1 paragraf Telegram
│   │   ├── formatters.ts              # Formatter mata uang IDR, persen, & tanggal lokal Indonesia
│   │   └── salesAnalytics.test.ts     # Unit test (Vitest)
│   └── components/
│       ├── KpiStrip.tsx               # Hero Net Sales & KPI eksekutif
│       ├── TelegramSummaryCard.tsx    # Editor, pratinjau mobile, copy & share Telegram
│       ├── SalesTrendCard.tsx         # Grafik tren harian/mingguan, run-rate & komposisi kanal
│       ├── SalesBarChartCard.tsx      # Ranking interaktif Region & Brand
│       ├── RegionBrandMatrix.tsx      # Heatmap Region × Brand multi-metrik
│       ├── WeakestOutletsCard.tsx     # 5 Outlet Terlemah + diagnosis peer & Radar Churn
│       ├── OutletDetailDrawer.tsx     # Panel detail riwayat transaksi & gap brand per outlet
│       └── DataQualityModal.tsx       # Modal audit pembersihan data
└── vite.config.ts                     # Konfigurasi Vite + serving sales.csv lokal
```
