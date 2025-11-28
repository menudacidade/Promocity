/* 
  ========================================
  PROMOCITY VAÍ - CORE JS (VERSÃO FINAL BLINDADA)
  Lê tudo de data/database.json e ignora erros
  ========================================
*/

const state = {
  lojas: [],
  categorias: []
};

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  // Inicia funções vitais IMEDIATAMENTE
  setupSearch();
  setupNotifications();
  startLiveCounter();
  
  // Depois carrega os dados
  await loadDatabase();
  renderAll();
  
  // Atualiza notificações com dados reais
  renderNotifications();
}

async function loadDatabase() {
  try {
    console.log("Carregando arquivos locais...");

    // GERA UM NÚMERO ALEATÓRIO PARA NUNCA USAR CACHE
    const noCache = '?t=' + Math.random();

    // Carrega o arquivo mestre e categorias
    const [dbRes, catRes] = await Promise.all([
      fetch('data/database.json' + noCache),
      fetch('data/categorias.json' + noCache)
    ]);

    if (!dbRes.ok) throw new Error("Erro ao ler database.json");

    const rawData = await dbRes.json();
    
    // Filtra os separadores (linhas que começam com _SEPARADOR)
    state.lojas = rawData.filter(item => !item._SEPARADOR);
    
    state.categorias = await catRes.json();
    
    console.log('Sucesso! Lojas carregadas:', state.lojas.length);

  } catch (error) {
    console.error('Erro fatal ao ler JSON:', error);
    // Não mostra alerta para o usuário final, apenas no console
  }
}

function renderAll() {
  renderStories();
  renderPromotions();
  renderLojas();
  renderCategories();
}

/* --- 1. STORIES --- */
function renderStories() {
  const container = document.getElementById('storiesContainer');
  if (!container) return;

  // Filtra quem tem story válido (lista com pelo menos 1 item)
  const stories = state.lojas.filter(l => l.stories && l.stories.length > 0);

  container.innerHTML = stories.map(loja => `
    <div class="story-item" onclick="openStory(${loja.id})">
      <div class="story-preview ${loja.plano === 'premium' ? 'pro' : ''}">
        <img src="${loja.stories[0].imagem}" alt="Story">
        <span class="story-badge">NOVO</span>
      </div>
      <span class="story-name">${loja.nome}</span>
    </div>
  `).join('');
}

/* --- 2. PROMOÇÕES (FEED) --- */
function renderPromotions(filterTerm = '') {
  const container = document.getElementById('promosContainer');
  if (!container) return;

  let promos = state.lojas.filter(l => l.promocao);

  if (filterTerm) {
    promos = promos.filter(l => 
      l.promocao.titulo.toLowerCase().includes(filterTerm) || 
      l.nome.toLowerCase().includes(filterTerm)
    );
  }

  container.innerHTML = promos.map(loja => `
    <article class="promo-card" onclick="window.location.href='comercio.html?id=${loja.id}'" style="cursor: pointer;">
      <div class="promo-tag">OFERTA</div>
      <img src="${loja.promocao.imagem}" class="promo-img" alt="${loja.promocao.titulo}">
      <div class="promo-content">
        <div class="promo-store">
          <i class='bx bxs-store'></i> ${loja.nome}
        </div>
        <h3 class="promo-title">${loja.promocao.titulo}</h3>
        <div class="promo-price-row">
          <div>
            <span class="price-old">R$ ${loja.promocao.precoOriginal}</span>
            <div class="price-new">R$ ${loja.promocao.preco}</div>
          </div>
          
          <div class="actions-row">
            <!-- Botão Compartilhar -->
            <button class="btn-icon-action btn-share-mini" onclick="sharePromo('${loja.promocao.titulo}', '${loja.nome}', event)">
              <i class='bx bxs-share-alt'></i>
            </button>
            <!-- Botão WhatsApp -->
            <a href="https://wa.me/${loja.telefone}?text=Vi a oferta ${loja.promocao.titulo} no PromoCity!" target="_blank" class="btn-icon-action btn-wa-mini" onclick="event.stopPropagation()">
              <i class='bx bxl-whatsapp'></i>
            </a>
          </div>

        </div>
      </div>
    </article>
  `).join('');
}

function sharePromo(titulo, loja, e) {
  e.stopPropagation(); // Não abre o perfil
  if (navigator.share) {
    navigator.share({
      title: 'Promoção Imperdível!',
      text: `Olha essa oferta de ${titulo} na ${loja}! Vi no PromoCity.`,
      url: window.location.href
    }).catch(console.log);
  } else {
    alert("Compartilhe este link com seus amigos!");
  }
}

/* --- 3. LISTA DE LOJAS --- */
function renderLojas() {
  const container = document.getElementById('storesContainer');
  if (!container) return;

  // Ordena: Premium > Pro > Free
  const sorted = [...state.lojas].sort((a, b) => {
    const pesos = { premium: 3, pro: 2, free: 1 };
    return (pesos[b.plano] || 0) - (pesos[a.plano] || 0);
  });

  container.innerHTML = sorted.map(loja => `
    <div class="store-card" onclick="window.location.href='comercio.html?id=${loja.id}'">
      <img src="${loja.logo}" class="store-logo" alt="${loja.nome}">
      <div class="store-info">
        <div class="store-name">
          ${loja.nome} 
          ${loja.plano === 'premium' || loja.plano === 'pro' ? '<i class="bx bxs-badge-check verified-badge"></i>' : ''}
        </div>
        <div class="store-cat">${formatCatName(loja.categoria)}</div>
        <div class="store-meta">
          <span><i class='bx bxs-star' style="color:#ffc107"></i> 4.8</span>
          <span>• ${loja.horario}</span>
        </div>
      </div>
      <i class='bx bx-chevron-right' style="font-size:1.5rem; color:#ccc;"></i>
    </div>
  `).join('');
}

/* --- 4. NOTIFICAÇÕES REAIS --- */
function renderNotifications() {
  const notifList = document.querySelector('.notif-list');
  const badge = document.querySelector('.notif-badge');
  
  if (!notifList) return;

  // Pega as 5 lojas mais recentes com promoção
  const news = state.lojas.filter(l => l.promocao).reverse().slice(0, 5);

  if (badge) {
    badge.innerText = news.length;
    badge.style.display = news.length > 0 ? 'flex' : 'none';
  }

  if (news.length === 0) {
    notifList.innerHTML = `
      <div class="notif-item">
        <div class="notif-icon bg-green"><i class='bx bxl-whatsapp'></i></div>
        <div class="notif-text">
          <strong>Bem-vindo!</strong>
          <p>Fique ligado nas próximas ofertas.</p>
        </div>
      </div>`;
    return;
  }

  notifList.innerHTML = news.map(loja => `
    <div class="notif-item unread" onclick="window.location.href='comercio.html?id=${loja.id}'">
      <div class="notif-icon bg-blue"><i class='bx bxs-discount'></i></div>
      <div class="notif-text">
        <strong>Nova Oferta: ${loja.promocao.titulo}</strong>
        <p>${loja.nome} acabou de postar uma promoção.</p>
        <small>Recentemente</small>
      </div>
    </div>
  `).join('');
}

/* --- 5. PERFIL DA LOJA --- */
async function loadCommerceProfile(id) {
  if (state.lojas.length === 0) await loadDatabase();

  const loja = state.lojas.find(c => c.id == id);
  const container = document.getElementById('profileContainer');
  const promosContainer = document.getElementById('storePromosContainer');

  if (!loja) {
    if(container) container.innerHTML = '<p class="text-center">Loja não encontrada.</p>';
    return;
  }

  if(container) {
    container.innerHTML = `
      <div class="profile-header">
        <img src="${loja.capa}" class="cover-img" alt="Capa">
        <div class="profile-logo-wrap">
          <img src="${loja.logo}" alt="Logo">
        </div>
      </div>

      <div class="profile-details">
        <h1 class="profile-name">
          ${loja.nome} 
          ${loja.plano !== 'free' ? '<i class="bx bxs-badge-check verified-badge"></i>' : ''}
        </h1>
        <span class="profile-cat">${formatCatName(loja.categoria)}</span>
        <p class="profile-desc">${loja.descricao || ''}</p>
        
        <div class="action-buttons">
          <a href="https://wa.me/${loja.telefone}" target="_blank" class="btn btn-wa-full">
            <i class='bx bxl-whatsapp'></i> Chamar no Whats
          </a>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <i class='bx bx-time-five info-icon'></i>
            <span class="info-label">Horário</span>
            <span class="info-value">${loja.horario}</span>
          </div>
          <div class="info-card" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loja.endereco)}', '_blank')" style="cursor: pointer;">
            <i class='bx bx-map info-icon'></i>
            <span class="info-label">Local</span>
            <span class="info-value">Ver no Mapa</span>
          </div>
        </div>
        
        <div style="margin-top: 10px; text-align:left; font-size:0.9rem; color:var(--text-muted);">
          <i class='bx bx-map-pin'></i> ${loja.endereco}
        </div>
      </div>
    `;
  }

  if (loja.promocao && promosContainer) {
    promosContainer.innerHTML = `
      <article class="promo-card">
        <div class="promo-tag">OFERTA</div>
        <img src="${loja.promocao.imagem}" class="promo-img">
        <div class="promo-content">
          <h3 class="promo-title">${loja.promocao.titulo}</h3>
          <div class="promo-price-row">
            <div>
              <span class="price-old">R$ ${loja.promocao.precoOriginal}</span>
              <div class="price-new">R$ ${loja.promocao.preco}</div>
            </div>
          </div>
        </div>
      </article>
    `;
  }
}

/* --- STORY VIEWER LOGIC (PLAYLIST) --- */
let currentStoryIndex = 0;
let currentStoreId = null;
let storyTimer = null;

function openStory(storeId) {
  const loja = state.lojas.find(l => l.id == storeId);
  if (!loja || !loja.stories) return;

  currentStoreId = storeId;
  currentStoryIndex = 0;

  document.getElementById('storyUserImg').src = loja.logo;
  const nameEl = document.getElementById('storyUserName');
  nameEl.innerText = loja.nome;
  nameEl.onclick = () => { window.location.href = `comercio.html?id=${storeId}`; };
  nameEl.style.cursor = 'pointer';
  
  document.getElementById('storyViewer').classList.remove('d-none');
  showStorySlide(loja);
}

function showStorySlide(loja) {
  clearTimeout(storyTimer);
  const story = loja.stories[currentStoryIndex];
  
  document.getElementById('storyImage').src = story.imagem;
  document.getElementById('storyCaption').innerText = story.titulo || "";

  // Atualiza link do WhatsApp
  const waBtn = document.getElementById('storyWaBtn');
  if(waBtn) {
    const msg = `Olá! Vi o story "${story.titulo}" no PromoCity e fiquei interessado!`;
    waBtn.href = `https://wa.me/${loja.telefone}?text=${encodeURIComponent(msg)}`;
  }

  const barsContainer = document.getElementById('storyBars');
  barsContainer.innerHTML = loja.stories.map((_, idx) => `
    <div class="story-bar">
      <div class="story-bar-fill" style="width: ${idx < currentStoryIndex ? '100%' : (idx === currentStoryIndex ? '0%' : '0%')}; transition: ${idx === currentStoryIndex ? 'width 5s linear' : 'none'}"></div>
    </div>
  `).join('');

  setTimeout(() => {
    const fills = document.querySelectorAll('.story-bar-fill');
    if(fills[currentStoryIndex]) fills[currentStoryIndex].style.width = '100%';
  }, 50);

  storyTimer = setTimeout(() => {
    nextStory();
  }, 5000);
}

function nextStory() {
  const loja = state.lojas.find(l => l.id == currentStoreId);
  if (!loja) return;

  if (currentStoryIndex < loja.stories.length - 1) {
    currentStoryIndex++;
    showStorySlide(loja);
  } else {
    const storesWithStories = state.lojas.filter(l => l.stories && l.stories.length > 0);
    const currentStoreIndex = storesWithStories.findIndex(l => l.id == currentStoreId);
    
    if (currentStoreIndex < storesWithStories.length - 1) {
      const nextStore = storesWithStories[currentStoreIndex + 1];
      openStory(nextStore.id);
    } else {
      closeStory();
    }
  }
}

function prevStory() {
  const loja = state.lojas.find(l => l.id == currentStoreId);
  if (!loja) return;

  if (currentStoryIndex > 0) {
    currentStoryIndex--;
    showStorySlide(loja);
  } else {
    const storesWithStories = state.lojas.filter(l => l.stories && l.stories.length > 0);
    const currentStoreIndex = storesWithStories.findIndex(l => l.id == currentStoreId);

    if (currentStoreIndex > 0) {
      const prevStore = storesWithStories[currentStoreIndex - 1];
      currentStoreId = prevStore.id;
      currentStoryIndex = prevStore.stories.length - 1;
      
      document.getElementById('storyUserImg').src = prevStore.logo;
      const nameEl = document.getElementById('storyUserName');
      nameEl.innerText = prevStore.nome;
      nameEl.onclick = () => { window.location.href = `comercio.html?id=${prevStore.id}`; };
      
      showStorySlide(prevStore);
    } else {
      showStorySlide(loja); 
    }
  }
}

window.closeStory = function() {
  document.getElementById('storyViewer').classList.add('d-none');
  clearTimeout(storyTimer);
}

window.openStory = openStory;
window.nextStory = nextStory;
window.prevStory = prevStory;

/* --- HELPERS & EVENTOS --- */

function formatCatName(slug) {
  const cat = state.categorias.find(c => c.slug === slug);
  return cat ? cat.nome : slug;
}

function filterByCategory(slug) {
  activeCategory = slug; 
  const cards = document.querySelectorAll('.store-card');
  
  if(!slug) {
    renderLojas(); 
  } else {
    const container = document.getElementById('storesContainer');
    const filtered = state.lojas.filter(l => l.categoria === slug);
    
    if(filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Nenhuma loja encontrada.</p>';
        return;
    }

    container.innerHTML = filtered.map(loja => `
      <div class="store-card" onclick="window.location.href='comercio.html?id=${loja.id}'">
        <img src="${loja.logo}" class="store-logo">
        <div class="store-info">
          <div class="store-name">${loja.nome}</div>
          <div class="store-cat">${formatCatName(loja.categoria)}</div>
        </div>
      </div>
    `).join('');
  }
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderPromotions(term);
    const cards = document.querySelectorAll('.store-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(term) ? 'flex' : 'none';
    });
  });
}

function setupNotifications() {
  const btn = document.getElementById('btnNotificacoes');
  const modal = document.getElementById('notificacoesModal');
  const close = document.getElementById('fecharNotificacoes');
  if (!btn || !modal || !close) return;

  btn.addEventListener('click', () => {
    modal.classList.remove('d-none');
    const badge = btn.querySelector('.notif-badge');
    if(badge) badge.style.display = 'none';
  });

  close.addEventListener('click', () => modal.classList.add('d-none'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('d-none');
  });
}

/* --- PWA INSTALL --- */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

const btnBaixe = document.getElementById('btnBaixeApp');
if(btnBaixe) {
  btnBaixe.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt = null;
    } else {
      alert("Para instalar:\nAndroid: Menu > Instalar App\niPhone: Compartilhar > Adicionar à Tela de Início");
    }
  });
}

if (window.matchMedia('(display-mode: standalone)').matches) {
  if(btnBaixe) btnBaixe.style.display = 'none';
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

/* --- LIVE COUNTER (SMART & REALISTIC) --- */
function startLiveCounter() {
  const el = document.getElementById('counterNum');
  if (!el) return;

  function updateCounter() {
    const now = new Date();
    const hour = now.getHours();
    let min, max;

    if (hour >= 0 && hour < 6) { min = 3; max = 12; } 
    else if (hour >= 6 && hour < 11) { min = 15; max = 50; } 
    else if (hour >= 11 && hour < 18) { min = 40; max = 120; } 
    else { min = 80; max = 250; }

    let current = parseInt(el.innerText);
    if (isNaN(current) || current < min || current > max) {
      current = Math.floor(Math.random() * (max - min) + min);
    }

    const change = Math.floor(Math.random() * 7) - 2; 
    let next = current + change;

    if (next > max) next = max;
    if (next < min) next = min;

    el.innerText = next;
    setTimeout(updateCounter, Math.random() * 4000 + 3000);
  }
  updateCounter();
}

/* --- BOTTOM NAVIGATION --- */
function navTo(section, btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');

  if (section === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } 
  else if (section === 'promos') {
    const el = document.getElementById('promosContainer');
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } 
  else if (section === 'stores') {
    const el = document.getElementById('storesContainer');
    const title = el.previousElementSibling; 
    if(title) title.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
