# 🚨 INSTRUKSI MANUAL - APACHE TIDAK BERJALAN

## ⚠️ SITUASI SAAT INI:

**Apache di Laragon TIDAK BERJALAN**

Ini sebabnya error `Unexpected token '<'` masih terjadi.

---

## 📋 LANGKAH-LANGKAH YANG HARUS ANDA LAKUKAN:

### **STEP 1: Buka Laragon**

1. Tekan tombol **Windows** di keyboard
2. Ketik: **"Laragon"**
3. Klik aplikasi **Laragon**
4. Tunggu sampai window Laragon terbuka

---

### **STEP 2: Start Apache & MySQL**

Di window Laragon, Anda akan melihat:

```
┌─────────────────────────────┐
│         LARAGON             │
├─────────────────────────────┤
│  Apache:  [●] Stopped       │  ← Harus HIJAU (Running)
│  MySQL:   [●] Running       │  ← Harus HIJAU (Running)
├─────────────────────────────┤
│     [  START ALL  ]         │  ← KLIK TOMBOL INI!
└─────────────────────────────┘
```

**KLIK TOMBOL "START ALL"** (tombol besar di tengah)

Tunggu sampai:
- Apache: **[●] Running** (HIJAU)
- MySQL: **[●] Running** (HIJAU)

---

### **STEP 3: Verify API Berfungsi**

1. Buka **browser** (Chrome/Firefox/Edge)
2. Ketik di address bar:
   ```
   http://testtt.test/api/index.php?action=get_products
   ```
3. Tekan **Enter**

**EXPECTED RESULT:**
```json
[{"id_produk":"11","nama_produk":"Test",...}]
```

Anda harus melihat **JSON data produk** (bukan error page).

---

### **STEP 4: Restart Vite Dev Server**

1. Buka **Command Prompt** atau **PowerShell**
2. Jalankan:
   ```bash
   cd C:\Users\Mas Ajid\Downloads\testtt\mimatcha
   npm run dev
   ```

3. Tunggu sampai muncul:
   ```
   VITE v8.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ```

---

### **STEP 5: Test Add Product**

1. Buka browser
2. Akses: `http://localhost:5173/products`
3. Tekan **Ctrl + Shift + R** (hard refresh)
4. Klik tombol **"Add New Product"**
5. Isi form:
   - Product Name: **Test Product**
   - Category: **Beverages**
   - Price: **25000**
   - Stock: **20**
6. Klik **"Save Product"**

**EXPECTED:** Product berhasil ditambahkan! ✅

---

## 🔧 JIKA APACHE TIDAK MAU START:

### **Masalah 1: Port 80 Sudah Dipakai**

**Cek aplikasi yang pakai port 80:**

1. Buka **Command Prompt as Administrator**
2. Jalankan:
   ```bash
   netstat -ano | findstr :80
   ```

3. Lihat hasilnya:
   ```
   TCP    0.0.0.0:80    0.0.0.0:0    LISTENING    1234
                                                   ^^^^
                                                   PID
   ```

4. Cari tahu aplikasi apa (ganti 1234 dengan PID yang Anda dapat):
   ```bash
   tasklist | findstr 1234
   ```

5. **Jika Skype:** Matikan Skype atau ubah settingnya
6. **Jika IIS:** Stop IIS di Services
7. **Jika aplikasi lain:** Stop aplikasi tersebut

---

### **Masalah 2: Apache Config Error**

**Cek error log:**

1. Buka file:
   ```
   C:\laragon\bin\apache\httpd-2.4.54-win64-VS16\logs\error.log
   ```

2. Scroll ke bawah, lihat error terakhir
3. Screenshot dan kirim ke saya

---

### **Masalah 3: Laragon Tidak Bisa Start Apache**

**Solusi alternatif - Gunakan PHP Built-in Server:**

1. Buka **Command Prompt**
2. Jalankan:
   ```bash
   cd C:\laragon\www\testtt\api
   php -S localhost:8000
   ```

3. Edit file:
   ```
   C:\Users\Mas Ajid\Downloads\testtt\mimatcha\src\api\service.js
   ```

4. Ubah line 1:
   ```javascript
   const API_URL = 'http://localhost:8000/index.php';
   ```

5. Restart Vite dan test lagi

---

## 📸 YANG PERLU ANDA SCREENSHOT:

Jika masih error, screenshot ini dan kirim ke saya:

1. **Laragon window** - Status Apache & MySQL
2. **Browser** - Hasil akses `http://testtt.test/api/index.php?action=get_products`
3. **Browser Console** (F12) - Error message
4. **Command Prompt** - Hasil `netstat -ano | findstr :80`

---

## ✅ CHECKLIST:

- [ ] Laragon dibuka
- [ ] Klik "Start All"
- [ ] Apache status: **Running** (HIJAU)
- [ ] MySQL status: **Running** (HIJAU)
- [ ] Browser: `http://testtt.test/api/index.php?action=get_products` → JSON ✅
- [ ] Vite: `npm run dev` → Running ✅
- [ ] Browser: `http://localhost:5173/products` → Bisa diakses ✅
- [ ] Test add product → **BERHASIL!** ✅

---

**Silakan ikuti langkah-langkah di atas dan beritahu saya hasilnya!** 🚀

Jika ada error, screenshot dan kirim ke saya untuk bantuan lebih lanjut.
