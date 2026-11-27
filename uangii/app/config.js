// Uangii Web Configuration (Stage 1: Local IndexedDB + Google Drive AppData)
// Stage 2 will add Firebase Firestore Live Sync adapter alongside this config.
window.UANGII_WEB_CONFIG = {
  appVersion: '0.1.0-beta',
  schemaVersion: 1,
  // Firebase Web Config — ambil apiKey & appId dari:
  // Firebase Console -> Project Settings -> General -> Your apps (Web App)
  firebase: {
    apiKey: 'AIzaSyD9NohO9ERudLRZd1npwlBV67Q5DVf9kpA',
    authDomain: 'fintrack-pro-2419e.firebaseapp.com',
    projectId: 'fintrack-pro-2419e',
    storageBucket: 'fintrack-pro-2419e.firebasestorage.app',
    messagingSenderId: '897060124265',
    appId: '1:897060124265:web:f34800243bc2e99d0494f8'
  },
  // Kunci Uangii Web khusus akun dengan entitlement VIP aktif di users/{uid}/entitlements
  vipGateEnabled: true,
  // Isi dengan Google OAuth 2.0 Web Client ID dari Google Cloud Console
  // Authorized JavaScript origins: https://fintrack.digital
  // Scope: https://www.googleapis.com/auth/drive.appdata
  googleClientId: '897060124265-vcv2aho4mph0si8jahstmnsl3fk1pjef.apps.googleusercontent.com',
  driveFileName: 'uangii-web-vault-v1.json',
  defaultWallets: [
    { id: 'w-cash', name: 'Tunai', type: 'cash', initialBalance: 500000, currency: 'IDR', color: '#30D158' },
    { id: 'w-bca', name: 'Bank BCA', type: 'bank', initialBalance: 3500000, currency: 'IDR', color: '#0A84FF' },
    { id: 'w-ewallet', name: 'E-Wallet', type: 'ewallet', initialBalance: 450000, currency: 'IDR', color: '#06B6D4' },
    { id: 'w-rdn', name: 'Kas RDN', type: 'rdn', initialBalance: 2000000, currency: 'IDR', color: '#A78BFA' }
  ],
  categories: {
    expense: [
      'Makanan & Minuman',
      'Transportasi & Bensin',
      'Tagihan & Utilitas',
      'Belanja & Kebutuhan',
      'Kesehatan',
      'Hiburan',
      'Pendidikan',
      'Lainnya'
    ],
    income: [
      'Gaji & Karir',
      'Bonus & Freelance',
      'Dividen & Investasi',
      'Cashback & Hadiah',
      'Lainnya'
    ],
    transfer: ['Transfer Antardompet']
  }
};
