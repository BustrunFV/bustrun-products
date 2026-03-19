// Примітка: цей скрипт рендерить товари, підтримує до 10 зображень на товар,
// показ каруселі в модальному вікні, пошук і категорії.
// Адмін-панель генерує new-product.json і дозволяє скачати оновлений products.json локально.

// !! Адмін-пароль встановлено на: фвsitepass2026

async function load() {
  const res = await fetch('products.json');
  let products = await res.json();
  const container = document.getElementById('products');
  const tmpl = document.getElementById('card-template');
  const searchEl = document.getElementById('search');
  const categoriesEl = document.getElementById('categories');
  const empty = document.getElementById('empty');
  const year = document.getElementById('year');
  year.textContent = new Date().getFullYear();

  function getCats(list){
    return Array.from(new Set(list.map(p=>p.category || 'Без категорії'))).sort();
  }

  function renderCategories(){
    categoriesEl.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.textContent = 'Усі';
    allBtn.dataset.cat = '';
    categoriesEl.appendChild(allBtn);

    getCats(products).forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.textContent = c;
      btn.dataset.cat = c;
      categoriesEl.appendChild(btn);
    });
  }

  function render(list){
    container.innerHTML = '';
    if(!list.length){ empty.style.display='block'; return }
    empty.style.display='none';
    list.forEach(p=>{
      const node = tmpl.content.cloneNode(true);
      const img = node.querySelector('.card-main-img');
      const thumbs = node.querySelector('.thumbs');
      const title = node.querySelector('.card-title');
      const desc = node.querySelector('.card-desc');
      const price = node.querySelector('.price');
      const btn = node.querySelector('.details');

      const mainSrc = (p.images && p.images.length) ? p.images[0] : 'images/placeholder.png';
      img.src = mainSrc;
      img.alt = p.name || '';
      // thumbs
      thumbs.innerHTML = '';
      (p.images || []).slice(0,10).forEach(src=>{
        const t = document.createElement('img');
        t.className = 'thumb';
        t.src = src;
        t.alt = p.name || '';
        thumbs.appendChild(t);
      });

      title.textContent = p.name || '';
      desc.textContent = p.description || '';
      price.textContent = `${p.price || ''} ${p.currency || ''}`;
      btn.addEventListener('click', ()=>openModal(p));
      container.appendChild(node);
    });
  }

  function matches(p, q, cat){
    const ql = q.trim().toLowerCase();
    if(cat && p.category !== cat) return false;
    if(!ql) return true;
    return (p.name + ' ' + p.description).toLowerCase().includes(ql);
  }

  function update(){
    const q = searchEl.value || '';
    const active = document.querySelector('.category-btn.active');
    const cat = active ? active.dataset.cat : '';
    const filtered = products.filter(p => matches(p,q,cat));
    render(filtered);
  }

  // categories click
  categoriesEl.addEventListener('click', (e)=>{
    if(!e.target.matches('.category-btn')) return;
    document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    update();
  });

  searchEl.addEventListener('input', update);

  // modal
  const modal = document.getElementById('modal');
  const close = document.getElementById('close');
  const midImg = document.getElementById('modal-img');
  const midTitle = document.getElementById('modal-title');
  const midDesc = document.getElementById('modal-desc');
  const midPrice = document.getElementById('modal-price');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  let currentImages = [];
  let currentIndex = 0;

  function openModal(p){
    currentImages = p.images && p.images.length ? p.images : ['images/placeholder.png'];
    currentIndex = 0;
    renderModal();
    midTitle.textContent = p.name || '';
    midDesc.textContent = p.description || '';
    midPrice.textContent = p.price ? `Ціна: ${p.price} ${p.currency || ''}` : '';
    modal.setAttribute('aria-hidden','false');
  }
  function renderModal(){
    midImg.src = currentImages[currentIndex];
  }
  function closeModal(){ modal.setAttribute('aria-hidden','true'); }
  prev.addEventListener('click', ()=>{ currentIndex = (currentIndex-1 + currentImages.length) % currentImages.length; renderModal(); });
  next.addEventListener('click', ()=>{ currentIndex = (currentIndex+1) % currentImages.length; renderModal(); });
  close.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

  // admin panel (client-side)
  const adminBtn = document.getElementById('admin-btn');
  const adminPanel = document.getElementById('admin');
  const adminClose = document.getElementById('admin-close');
  const adminForm = document.getElementById('admin-form');
  const imagesInput = document.getElementById('images-input');
  const downloadAllBtn = document.getElementById('download-all');

  function showAdmin(){
    const pass = prompt('Введіть пароль адміністратора:');
    if(pass === 'фвsitepass2026'){
      adminPanel.setAttribute('aria-hidden','false');
    } else {
      alert('Невірний пароль.');
    }
  }

  function hideAdmin(){ adminPanel.setAttribute('aria-hidden','true'); }

  adminBtn.addEventListener('click', showAdmin);
  adminClose.addEventListener('click', hideAdmin);

  // helper to generate id
  function genId(){
    return 'p-' + Math.random().toString(36).slice(2,9);
  }

  adminForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const form = new FormData(adminForm);
    const name = form.get('name');
    const price = Number(form.get('price'));
    const currency = form.get('currency') || 'UAH';
    const category = form.get('category') || 'Без категорії';
    const description = form.get('description') || '';
    const files = imagesInput.files || [];
    const maxFiles = 10;
    if(files.length > maxFiles){ alert('Максимум 10 зображень.'); return; }

    const newProd = {
      id: genId(),
      name,
      price,
      currency,
      category,
      description,
      images: [],
      available: true
    };

    for(let i=0;i<files.length;i++){
      const f = files[i];
      newProd.images.push('images/' + f.name);
    }

    const blob = new Blob([JSON.stringify(newProd, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new-product.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Згенеровано new-product.json. Завантажте ваші зображення в папку images/ репозиторію і додайте цей обʼєкт у products.json.');

    products.push(newProd);
    renderCategories();
    update();
  });

  downloadAllBtn.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(products, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Скачано оновлений products.json. Завантажте його в репозиторій, щоб зберегти додані товари.');
  });

  // initial render
  renderCategories();
  render(products);
}

window.addEventListener('DOMContentLoaded', load);