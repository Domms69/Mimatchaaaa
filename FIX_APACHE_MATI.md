# 🚨 APACHE TIDAK BERJALAN - CARA MEMPERBAIKI

## ⚠️ MASALAH SAAT INI:

Apache di Laragon **TIDAK BERJALAN** (stopped/crashed)

Ini sebabnya error masih terjadi - API tidak bisa diakses karena web server mati.

---

## 🔧 SOLUSI CEPAT:

### **Cara 1: Jalankan Script Otomatis (RECOMMENDED)**

1. **Double-click file ini:**
   ```
   C:\Users\Mas Ajid\Downloads\testtt\mimatcha\restart_laragon.bat
   ```

2. Script akan:
   - ✅ Stop Apache yang error
   - ✅ Start Laragon
   - ✅ Test API
   - ✅ Tampilkan hasilnya

---

### **Cara 2: Manual via Laragon GUI**

1. **Buka Laragon:**
   - Cari di Start Menu: "Laragon"
   - Atau double-click: `C:\laragon\laragon.exe`

2. **Start All Services:**
   - Klik tombol **"Start All"** (tombol besar di tengah)
   - Tunggu sampai Apache dan MySQL hijau

3. **Verify:**
   - Buka browser: `http://testtt.test/api/index.php?action=get_products`
   - Harus menampilkan JSON produk

---

### **Cara 3: Manual via Command Line**

```bash
# 1. Stop Apache yang error
taskkill /F /IM httpd.exe

# 2. Start Laragon
start C:\laragon\laragon.exe

# 3. Tunggu 5 detik, lalu test
curl http://testtt.test/api/index.php?action=get_products
```

---

## 🎯 SETELAH LARAGON BERJALAN:

### **1. Verify API Berfungsi:**

Buka browser dan akses:
```
http://testtt.test/api/index.php?action=get_products
```

**Expected:** JSON array produk ✅

**Jika masih error:** Screenshot dan kirim ke saya

---

### **2. Test Frontend React:**

```bash
# Terminal 1: Pastikan Laragon running
# (Apache dan MySQL harus hijau di Laragon GUI)

# Terminal 2: Start Vite
cd C:\Users\Mas Ajid\Downloads\testtt\mimatcha
npm run dev
```

Buka: `http://localhost:5173/products`

---

## 🔍 KENAPA APACHE MATI?

Kemungkinan penyebab:
1. **Port 80 conflict** - Ada aplikasi lain pakai port 80 (Skype, IIS, dll)
2. **Config error** - Ada error di `httpd.conf`
3. **Manual stop** - Apache di-stop manual sebelumnya
4. **Crash** - Apache crash karena error

---

## 📋 CHECKLIST:

- [ ] Buka Laragon GUI
- [ ] Klik "Start All"
- [ ] Apache status: **HIJAU** ✅
- [ ] MySQL status: **HIJAU** ✅
- [ ] Test API: `http://testtt.test/api/index.php?action=get_products`
- [ ] Dapat JSON response ✅
- [ ] Start Vite: `npm run dev`
- [ ] Test add product di `http://localhost:5173/products`

---

## 🆘 JIKA APACHE TIDAK MAU START:

### **Cek Port 80 Conflict:**

```bash
# Cek apa yang pakai port 80
netstat -ano | findstr :80
```

Jika ada aplikasi lain pakai port 80:
- Stop aplikasi tersebut
- Atau ubah port Apache di Laragon

### **Cek Apache Error Log:**

```
C:\laragon\bin\apache\httpd-2.4.54-win64-VS16\logs\error.log
```

Buka file ini dan lihat error terakhir.

---

## 💡 QUICK FIX:

**Jalankan file BAT yang sudah saya buat:**

```
C:\Users\Mas Ajid\Downloads\testtt\mimatcha\restart_laragon.bat
```

Double-click file tersebut dan lihat hasilnya!

---

**Setelah Laragon berjalan, test lagi add product di frontend!** 🚀
