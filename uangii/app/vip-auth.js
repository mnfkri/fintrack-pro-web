// Firebase Auth + Firestore VIP Entitlement Gate for Uangii Web
// Reads server-managed entitlements from users/{uid}/entitlements/{entitlementId}
(() => {
  'use strict';

  const TYPE_PRIORITY = {
    LIFETIME_FAMILY: 5,
    PLAY_SUBSCRIPTION: 4,
    PERSONAL_PRO: 3,
    TRIAL_EXTENDED: 2,
    TRIAL_PERSONAL: 1
  };

  const TYPE_LABELS = {
    LIFETIME_FAMILY: 'Family VIP (Lifetime)',
    PLAY_SUBSCRIPTION: 'VIP Aktif (Google Play)',
    PERSONAL_PRO: 'Personal Pro',
    TRIAL_EXTENDED: 'Trial VIP',
    TRIAL_PERSONAL: 'Trial Personal Pro'
  };

  const ALLOWED_PLAY_STATES = new Set([
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    'SUBSCRIPTION_STATE_CANCELED'
  ]);

  let auth = null;
  let db = null;
  let initialized = false;
  let currentUser = null;
  let currentEntitlement = null;

  function hasFirebaseConfig() {
    const cfg = window.UANGII_WEB_CONFIG?.firebase;
    return Boolean(cfg && cfg.apiKey && cfg.projectId && cfg.appId);
  }

  function isDocValid(doc, uid) {
    if (!doc || doc.isActive !== true) return false;
    if (doc.hostUid && doc.hostUid !== uid) return false;
    const now = Date.now();
    if (doc.expiresAt !== null && doc.expiresAt !== undefined) {
      const exp = Number(doc.expiresAt);
      if (!Number.isFinite(exp) || exp <= now) return false;
    }
    if (doc.source === 'GOOGLE_PLAY' && doc.state && !ALLOWED_PLAY_STATES.has(doc.state)) {
      return false;
    }
    return true;
  }

  function pickBestEntitlement(docs, uid) {
    const valid = docs.filter((d) => isDocValid(d, uid));
    if (!valid.length) return null;
    valid.sort((a, b) => {
      const pa = TYPE_PRIORITY[a.entitlementType] || 0;
      const pb = TYPE_PRIORITY[b.entitlementType] || 0;
      if (pb !== pa) return pb - pa;
      const ea = a.expiresAt == null ? Number.MAX_SAFE_INTEGER : Number(a.expiresAt);
      const eb = b.expiresAt == null ? Number.MAX_SAFE_INTEGER : Number(b.expiresAt);
      return eb - ea;
    });
    const top = valid[0];
    return {
      entitlementType: top.entitlementType || 'VIP',
      label: TYPE_LABELS[top.entitlementType] || 'VIP Aktif',
      source: top.source || '',
      expiresAt: top.expiresAt ?? null,
      verifiedAt: top.verifiedAt ?? null,
      state: top.state || null
    };
  }

  async function fetchEntitlement(uid) {
    if (!db || !uid) return null;
    const snap = await db.collection('users').doc(uid).collection('entitlements').get();
    const docs = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    return pickBestEntitlement(docs, uid);
  }

  function init(onStateChange) {
    if (!hasFirebaseConfig()) {
      onStateChange({ status: 'unconfigured', user: null, entitlement: null });
      return;
    }
    if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
      onStateChange({ status: 'sdk_error', user: null, entitlement: null, error: 'Firebase SDK gagal dimuat.' });
      return;
    }
    if (!initialized) {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.UANGII_WEB_CONFIG.firebase);
      }
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      initialized = true;
    }
    auth.onAuthStateChanged(async (user) => {
      currentUser = user || null;
      currentEntitlement = null;
      if (!user) {
        onStateChange({ status: 'signed_out', user: null, entitlement: null });
        return;
      }
      onStateChange({ status: 'checking', user, entitlement: null });
      try {
        const ent = await fetchEntitlement(user.uid);
        currentEntitlement = ent;
        onStateChange({
          status: ent ? 'vip_active' : 'not_vip',
          user,
          entitlement: ent
        });
      } catch (err) {
        onStateChange({
          status: 'error',
          user,
          entitlement: null,
          error: err.message || 'Gagal memverifikasi status VIP.'
        });
      }
    });
  }

  async function signInGoogle() {
    if (!auth) throw new Error('Firebase Auth belum terkonfigurasi.');
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithPopup(provider);
  }

  async function signOut() {
    if (auth) await auth.signOut();
    currentUser = null;
    currentEntitlement = null;
  }

  async function refreshEntitlement() {
    if (!currentUser) return null;
    const ent = await fetchEntitlement(currentUser.uid);
    currentEntitlement = ent;
    return ent;
  }

  window.UangiiVipAuth = {
    hasFirebaseConfig,
    init,
    signInGoogle,
    signOut,
    refreshEntitlement,
    getUser: () => currentUser,
    getEntitlement: () => currentEntitlement
  };
})();
