(() => {
  'use strict';
  // Require an explicit currency marker or unit: a quantity or date is not a price.
  const money = /(?:\bRp\.?\s*(\d[\d.,]*)(?:\s*(ribu|rb|juta|jt|k)\b)?|\b(\d[\d.,]*)\s*(ribu|rb|juta|jt|k)\b)/giu;
  const number = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/;
  const factors = {ribu:1000,rb:1000,k:1000,juta:1000000,jt:1000000};
  window.parseStudioTransaction = function(text) {
    const matches = [...text.matchAll(money)];
    if (matches.length !== 1) return {error: matches.length ? 'Ada beberapa nominal. Coba satu transaksi per contoh.' : 'Tulis nominal dengan Rp, rb, atau jt.'};
    const [token, prefixed, prefixedUnit, suffixed, suffixedUnit] = matches[0];
    const raw = (prefixed || suffixed).replace(/\.$/, '');
    const amount = Number(raw.replaceAll('.', '').replace(',', '.')) * (factors[(prefixedUnit || suffixedUnit || '').toLowerCase()] || 1);
    if (!number.test(raw) || !Number.isSafeInteger(amount) || amount <= 0) return {error:'Nominal belum valid. Contoh: Rp50.000 atau 2,5 jt.'};
    const lower = text.toLowerCase();
    const transfer = /\btransfer\b/.test(lower) && !/\btransfer dari\b/.test(lower);
    const expense = /\b(beli|bayar|belanja|pengeluaran)\b/.test(lower);
    const income = !expense && /\b(terima|pemasukan|gaji|masuk|bonus|dividen|cashback|transfer dari|dapat uang)\b/.test(lower);
    if (!transfer && !expense && !income && !/\b(kopi|makan|bensin|parkir|pulsa|wifi|listrik)\b/.test(lower)) return {error:'Tambahkan konteks, misalnya “beli kopi Rp25.000”.'};
    return {amount, type:transfer ? 'transfer' : income ? 'income' : 'expense', description:text.replace(token, '').replace(/\s+/g,' ').trim()};
  };
})();
