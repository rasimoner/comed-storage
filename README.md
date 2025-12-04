# Comed Storage – Chrome Extension
_Comed ekosistemi için geliştirilen yardımcı depolama ve entegrasyon aracı._

## 🚀 Amaç
**Comed Storage**, Comed uygulamalarıyla çalışan geliştiricilerin;
- Tarayıcı üzerinde geçici/veri saklama işlemlerini yönetmesi,
- Session Storage daki parametre ve yetki verilerini hızlıca görmesi ve düzenlemesi,
- Test ve debug süreçlerini hızlandırması,
- Comed modülleri arasında veri paylaşımını kolaylaştırması  
  için hazırlanmış bir Chrome eklentisidir.

---

## 📦 Özellikler
- 🔐 Session Storage görüntüleme
- ✏️ Anahtar–Value düzenleme
- 🗑️ Hızlı temizleme işlemleri
- 🔄 Aktif tab ile otomatik senkronizasyon
- ⚙️ Comed modülleriyle entegre çalışma
- 🧩 Manifest v3 destekli modern eklenti mimarisi
- 🖼️ Özel Comed ikon seti (16 / 32 / 48 / 128 px)

---

## 📁 Proje Yapısı
```
comed-storage/
├── dist/                 # Build çıktıları
├── src/
│   ├── main.ts           # Entry point
│   ├── popup.html        # Extension popup UI
│   ├── components/       # Vue bileşenleri
├── public/
│   ├── icons/            # PNG ikonlar
├── manifest.json         # Chrome Extension Manifest (v3)
├── vite.config.ts        # Build config
└── package.json

```

---

## 🛠️ Teknolojiler
- Vue 3
- TypeScript
- Vite
- Manifest v3

---

## ▶️ Geliştirme
Chrome extension’lar dev-server desteklemediği için **watch mode** kullanılır:

**yarn watch:build**

Bu komut, `dist` klasörünü otomatik olarak yeniden üretir.

---

## 🧪 Chrome'da Yükleme
1. **Chrome → Extensions → Developer Mode** aç
2. **Load unpacked** butonuna tıkla
3. Proje klasöründeki **dist/** dizinini seç
4. Eklenti yüklenir ve kullanılabilir hale gelir

---

## 🔧 Build
yarn build
---

## 🖼️ İkonlar
Manifest üzerinden kullanılan ikonlar:
```
public/icons/
├── logo_16.png
├── logo_32.png
├── logo_48.png
└── logo_128.png
```

---

## 📌 Notlar
- Bu eklenti yalnızca Comed geliştirme ekibi iç kullanımına yöneliktir.
- Dışarıya dağıtılması veya paylaşılması uygun değildir.
- Comed modüllerine özel key/value yapıları içerebilir.

---

## 📄 Lisans
Bu proje Comed iç kullanım lisansı altındadır.
