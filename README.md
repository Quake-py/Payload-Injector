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

### 🛠️ Detailed Installation Guides

#### Google Chrome / Chromium-Based Browsers (Edge, Opera, Brave, etc.)
1. Download this repository as a `.zip` archive and unpack it into a folder.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** by toggling the switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select the root directory of the unpacked extension folder (the directory containing `manifest.json`).

#### Mozilla Firefox
Due to Firefox's security policies, unsigned extensions cannot be permanently installed from local `.zip` files in the standard release. Use these developer loading steps:
1. Open Firefox and type `about:debugging` in the address bar, then press Enter.
2. Click on **This Firefox** in the left sidebar.
3. Click the **Load Temporary Add-on...** button.
4. Navigate to your unpacked extension folder and select the `manifest.json` file (or select the `payload-injector.zip` file directly).
5. The extension will load immediately. *(Note: Temporary extensions are automatically removed when you restart Firefox. You can reload it in seconds using the same steps).*

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

### 🛠️ Detaylı Kurulum Yönergeleri

#### Google Chrome / Chromium Tabanlı Tarayıcılar (Edge, Opera, Brave, vb.)
1. Bu depoyu `.zip` arşivi olarak indirin ve bilgisayarınızda bir klasöre çıkartın.
2. Chrome tarayıcınızı açarak adres satırına `chrome://extensions/` yazın ve gidin.
3. Sağ üst köşedeki **Geliştirici Modu** (*Developer Mode*) anahtarını açık konuma getirin.
4. Sol üstte beliren **Paketlenmemiş öğe yükle** (*Load unpacked*) butonuna tıklayın.
5. Bilgisayarınızda eklenti dosyalarının bulunduğu (içinde `manifest.json` olan) ana klasörü seçin.

#### Mozilla Firefox
Firefox'un güvenlik politikaları nedeniyle, imzalanmamış uzantıların standart Firefox sürümüne kalıcı olarak yüklenmesi engellenmiştir. Eklentiyi test etmek için şu geçici yükleme adımlarını uygulayın:
1. Firefox tarayıcınızı açıp adres satırına `about:debugging` yazın ve Enter'a basın.
2. Sol menüden **Bu Firefox** (*This Firefox*) seçeneğine tıklayın.
3. Sağ taraftaki **Geçici Eklenti Yükle...** (*Load Temporary Add-on...*) butonuna tıklayın.
4. Eklenti klasörünüzü açıp **`manifest.json`** dosyasını (veya doğrudan derlenmiş `payload-injector.zip` arşivini) seçip açın.
5. Eklenti anında aktifleşecektir. *(Not: Geçici eklentiler Firefox kapatıldığında otomatik olarak silinir. Yeniden test etmek istediğinizde aynı adımlarla saniyeler içinde tekrar yükleyebilirsiniz).*
