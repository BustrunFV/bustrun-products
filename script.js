// заміна fetch шляху
async function load() {
  let products = [];
  try {
    const res = await fetch('./products.json');
    products = await res.json();
  } catch (err) {
    console.error('Не вдалося завантажити products.json:', err);
    products = []; // щоб скрипт не ламався
  }

  // ... інший код залишається

  // місце, де вибирається mainSrc — встановимо зовнішній плейсхолдер, якщо немає локального
  const mainSrc = (p.images && p.images.length) ? p.images[0] : 'https://via.placeholder.com/600x400?text=No+image';
