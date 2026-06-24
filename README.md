# Payload Injector - QA & Input Validation Test Extension

[English](#english) | [Türkçe](#türkçe)

---

## English

Payload Injector is a high-scalability, offline-first browser extension built for Software Quality Assurance (QA), input validation, boundary checking, and fuzzing tests.

It dynamically reads test cases from a local data file (`vectors.json`) and populates nested right-click context menus. It also supports manual configuration and TXT file uploads to build custom categories.

### 🚀 Key Features
- **Dynamic Right-Click Menus**: Automatically loads categories and test strings from `vectors.json`.
- **Bilingual Interface**: Choose between English (default) and Turkish locales via the Settings page. Official payloads in the right-click menu instantly rebuild in the selected language.
- **Offline First**: Runs completely locally. No internet connection required to execute test cases.
- **Official GitHub Updates**: Checks raw files on the official repository for version and payload schema updates automatically.
- **Custom TXT File Imports**: Upload custom payload lists (one per line) from the settings page, name your custom category, and populate it into the right-click menu.
- **Bypass Validation Restrictions**: Simulates Clipboard events, programmatic state updates, and key-by-key keystroke actions to ensure React, Vue, and Angular validation states register the changes.
- **Shadow DOM Support**: Recursively traverses deep active nodes to inject payloads inside shadow roots and editors.

### 🛠️ Installation
1. Download this repository as a ZIP archive and unpack it.
2. Navigate to `chrome://extensions/` (or `about:debugging` for Firefox).
3. Enable **Developer Mode** (top-right in Chrome).
4. Click **Load unpacked** and select the extension directory.

---

## Türkçe

Payload Injector, Software Quality Assurance (QA), girdi doğrulama (input validation), sınır kontrolü ve fuzzing testleri gerçekleştiren ekipler için geliştirilmiş Manifest V3 tabanlı bir tarayıcı eklentisidir.

Test verilerini kod içinde sabit (hardcoded) tutmak yerine dinamik olarak `vectors.json` dosyasından okur ve sağ tık menüsünü otomatik oluşturur.

### 🚀 Öne Çıkan Özellikler
- **Dinamik Sağ Tık Bağlam Menüsü**: Kategorileri ve test dizilerini `vectors.json` üzerinden dinamik okuyup hiyerarşik menüler oluşturur.
- **Çift Dil Desteği**: Ayarlar sayfasından Türkçe veya İngilizce dil seçimi yapabilirsiniz. Seçilen dile göre sağ tık menü başlıkları ve açıklamaları anında yeniden oluşturulur.
- **Yerel Öncelikli (Offline)**: İnternet bağlantınız olmasa dahi tüm test listelerinize erişebilirsiniz.
- **Resmi GitHub Güncellemesi**: Resmi depo üzerindeki `vectors.json` güncellemelerini arka planda otomatik denetler ve günceller.
- **Özel TXT Dosyası Yükleme (Sekme Ekleme)**: Kendi hazırladığınız TXT listelerini (her satıra bir girdi gelecek şekilde) istediğiniz sekme adıyla yükleyebilirsiniz.
- **Modern Arayüz Korumalarını Aşma**: React, Vue, Angular gibi kütüphanelerde girdi alanlarının güncellenmeme sorununu aşmak için pano yapıştırma (paste event) simülasyonu ve karakter karakter tuş vuruşu simülasyonu yapar.
- **Shadow DOM Desteği**: Shadow Root arkasında kalan metin kutularını derinlemesine tarayarak yakalar ve enjeksiyonu gerçekleştirir.

### 🛠️ Kurulum Yönergeleri
1. Bu depoyu ZIP olarak indirin ve bir klasöre çıkartın.
2. Tarayıcınızda `chrome://extensions/` adresine gidin.
3. **Geliştirici Modu**'nu aktif hale getirin.
4. **Paketlenmemiş öğe yükle** butonuna tıklayın ve eklenti klasörünü seçin.
