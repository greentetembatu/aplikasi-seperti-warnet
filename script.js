// Data Default
const DEFAULT_RATES = {
    edit: 10000,
    ketik: 10000,
    gambar: 10000,
    browsing: 10000,
    rental: 10000
};

// KREDENSIAL ADMIN
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// State Aplikasi - Sekarang menggunakan Timestamp (Date.now)
let rates = JSON.parse(localStorage.getItem('appRates')) || { ...DEFAULT_RATES };

// Ambil data timer dari localStorage jika ada (Anti-Refresh)
let timers = JSON.parse(localStorage.getItem('appTimers')) || {
    edit: { startTime: null, accumulated: 0, running: false },
    ketik: { startTime: null, accumulated: 0, running: false },
    gambar: { startTime: null, accumulated: 0, running: false },
    browsing: { startTime: null, accumulated: 0, running: false },
    rental: { startTime: null, accumulated: 0, running: false }
};

let masterInterval = null;

// Inisialisasi saat load
document.addEventListener('DOMContentLoaded', () => {
    loadRatesToForm();
    startMasterLoop(); // Jalankan loop utama
});

// --- FUNGSI NAVIGASI & LOGIN (Tetap Sama) ---
function switchView(viewId) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if(viewId === 'loginView') {
        document.getElementById('login-name').value = '';
        document.getElementById('login-pass').value = '';
        document.getElementById('login-error').style.display = 'none';
    }
}

function loginAdmin() {
    const nameInput = document.getElementById('login-name').value;
    const passInput = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');

    if (nameInput === ADMIN_CREDENTIALS.username && passInput === ADMIN_CREDENTIALS.password) {
        errorMsg.style.display = 'none';
        document.getElementById('admin-name-display').innerText = nameInput.toUpperCase();
        switchView('adminView');
    } else {
        errorMsg.style.display = 'block';
    }
}

function logoutAdmin() {
    switchView('dashboardView');
}

// --- FUNGSI TIMER BARU (BERBASIS TIMESTAMP) ---

// Satu loop untuk menghitung semua timer
function startMasterLoop() {
    if (masterInterval) clearInterval(masterInterval);
    
    // Interval 50ms agar angka milidetik (2 digit terakhir) berjalan mulus
    masterInterval = setInterval(() => {
        updateAllDisplay();
    }, 50); 
}

function startTimer(type) {
    if (timers[type].running) return;
    
    // Catat waktu mulai saat ini
    timers[type].running = true;
    timers[type].startTime = Date.now();
    
    saveTimers(); // Simpan ke local storage
}

function stopTimer(type) {
    if (!timers[type].running) return;
    
    // Hitung total waktu yang sudah berjalan sebelum di-stop
    const elapsed = Date.now() - timers[type].startTime;
    timers[type].accumulated += elapsed;
    
    // Reset state
    timers[type].running = false;
    timers[type].startTime = null;
    
    saveTimers();
    updateAllDisplay(); // Update sekali lagi agar angka terakhir pas
}

function resetAll() {
    if(!confirm("Reset semua waktu dan biaya?")) return;
    
    for (let key in timers) {
        timers[key] = { startTime: null, accumulated: 0, running: false };
    }
    
    saveTimers();
    updateAllDisplay();
}

// Simpan state timer ke localStorage agar tidak hilang saat refresh
function saveTimers() {
    localStorage.setItem('appTimers', JSON.stringify(timers));
}

// --- FUNGSI TAMPILAN ---
function updateAllDisplay() {
    const now = Date.now();
    let grandTotal = 0;

    for (let key in timers) {
        const timer = timers[key];
        
        // Hitung total centiseconds (1/100 detik)
        let totalCS = Math.floor(timer.accumulated / 10); // Konversi ms ke CS
        
        // Jika sedang berjalan (running), tambahkan waktu yang sudah berjalan sejak startTime
        if (timer.running && timer.startTime) {
            const currentElapsed = now - timer.startTime;
            totalCS += Math.floor(currentElapsed / 10);
        }

        // Tampilkan Waktu
        updateTimerDisplay(key, totalCS);

        // Hitung Biaya
        const ratePerHour = rates[key];
        const cost = Math.floor((totalCS / 360000) * ratePerHour);
        document.getElementById(`cost-${key}`).innerText = formatRupiah(cost);
        
        grandTotal += cost;
    }

    // Tampilkan Total Keseluruhan
    document.getElementById('grand-total').innerText = formatRupiah(grandTotal);
}

function updateTimerDisplay(type, totalCS) {
    const cs = totalCS % 100;
    const totalSeconds = Math.floor(totalCS / 100);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const h = Math.floor(totalSeconds / 3600);

    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    const csStr = cs.toString().padStart(2, '0');

    document.getElementById(`time-${type}`).innerText = `${hStr}:${mStr}:${sStr}:${csStr}`;
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// --- FUNGSI ADMIN ---
function loadRatesToForm() {
    for (let key in rates) {
        document.getElementById(`rate-${key}`).value = rates[key];
    }
}

function saveRates() {
    for (let key in rates) {
        rates[key] = parseInt(document.getElementById(`rate-${key}`).value) || 0;
    }
    localStorage.setItem('appRates', JSON.stringify(rates));
    
    updateAllDisplay(); // Langsung update biaya di dashboard
    
    document.getElementById('save-status').style.display = 'block';
    setTimeout(() => {
        document.getElementById('save-status').style.display = 'none';
    }, 2000);
}

// --- LOGIKA INSTALL PWA (SELALU TAMPIL) ---
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

if (installBtn) {
    installBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.innerText = "✅ APLIKASI TERINSTAL";
                installBtn.style.background = "#555";
            }
            deferredPrompt = null;
        } else {
            alert(
                "Cara Install Manual:\n\n" +
                "1. Klik ikon titik tiga (menu) di pojok kanan atas browser Anda.\n" +
                "2. Pilih 'Aplikasi' atau 'Apps'.\n" +
                "3. Pilih 'Install situs ini sebagai aplikasi'.\n\n" +
                "Jika aplikasi sudah pernah diinstal, buka dari Desktop/Home Screen."
            );
        }
    });
}

// Sembunyikan tombol jika dibuka sebagai PWA standalone
if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installBtn) {
        installBtn.style.display = 'none';
    }
}