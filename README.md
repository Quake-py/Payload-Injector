# Payload Injector - QA & Input Validation Test Eklentisi

Payload Injector, Software Quality Assurance (QA), girdi doğrulama (input validation) ve sınır testleri gerçekleştiren güvenlik ve test ekipleri için geliştirilmiş, yüksek ölçeklenebilirliğe sahip ve **tamamen yerel (local)** çalışan bir tarayıcı eklentisidir.

Bu eklenti, test senaryolarını kod içinde barındırmak yerine dinamik olarak `vectors.json` dosyasından okur ve kullanıcılara kendi test setlerini (.txt formatında) yükleme imkanı sunar.

---

## 🚀 Öne Çıkan Özellikler

- **Dinamik Sağ Tık Bağlam Menüsü**: Kod dosyalarını değiştirmeden `vectors.json` dosyasından okunan kategoriler ve payload'lar sağ tık menüsünde otomatik olarak listelenir.
- **Yerel Öncelikli Çalışma**: Eklenti tamamen yerel verilerle çalışır. İnternet bağlantınız olmasa bile tüm test senaryolarına erişebilirsiniz.
- **Resmi GitHub Güncelleme Sunucusu**: Eklenti açıldığında veya manuel tetiklendiğinde resmi GitHub reposu üzerinden yeni sürüm denetimi yapar ve `vectors.json` veritabanını arka planda otomatik günceller.
- **Özel TXT Dosyası Yükleme (Sekme Ekleme)**: Ayarlar sayfasından kendi hazırladığınız `.txt` listelerini (her satıra bir payload gelecek şekilde) istediğiniz kategori başlığıyla yükleyip anında sağ tık menünüze ekleyebilirsiniz.
- **Framework Engelini Aşma (Gelişmiş Enjeksiyon Motoru)**: React, Vue, Angular gibi modern arayüz kütüphanelerinde değer atama engellerini aşmak için klavye olaylarını (KeyboardEvents) ve dahili setter kancalarını (value setter bypass) simüle ederek sorunsuz enjeksiyon sağlar.
- **Gelişmiş Arama Arayüzü**: Ayarlar sayfasında yüklü tüm payload'ları filtreleyip inceleyebilirsiniz.

---

## 🛠️ Kurulum Yönergeleri

Eklenti Manifest V3 tabanlı olup derleme gerektirmez. Doğrudan tarayıcınıza kurup kullanabilirsiniz.

### Google Chrome, Brave, Opera veya Edge:
1. Bu depoyu ZIP olarak indirin ve bir klasöre çıkartın.
2. Tarayıcınızda `chrome://extensions/` adresine gidin.
3. Sağ üst köşedeki **Geliştirici Modu** (Developer Mode) seçeneğini aktif hale getirin.
4. Sol üst köşedeki **Paketlenmemiş öğe yükle** (Load unpacked) butonuna tıklayın.
5. Depoyu çıkarttığınız ana klasörü seçerek kurulumu tamamlayın.

### Mozilla Firefox:
1. Firefox tarayıcısını açıp `about:debugging#/runtime/this-firefox` adresine gidin.
2. **Geçici Eklenti Yükle** (Load Temporary Add-on) butonuna tıklayın.
3. İndirdiğiniz klasörün içindeki `manifest.json` dosyasını seçerek yükleyin.

---

## 📂 Dosya Yapısı

- `manifest.json`: Eklenti izinleri ve tarayıcı entegrasyonu ayarları.
- `vectors.json`: Varsayılan yerel payload listeleri ve kategorileri.
- `background.js`: Sağ tık menülerini oluşturan ve güncelleme kontrolü yapan servis yöneticisi.
- `content.js`: Girdi alanlarına enjeksiyon yapan ve korumaları aşan sayfa betiği.
- `options.html` & `options.js`: Güncelleme yönetimi ve özel TXT yükleme arayüzü.

## 🤝 Katkıda Bulunma

Bu proje açık kaynaklıdır! Yeni payload kategorileri eklemek veya kod kalitesini artırmak için PR (Pull Request) gönderebilirsiniz. Katkılarınız `vectors.json` dosyasının otomatik güncellenen resmi listesinde yayınlanacaktır.
