/* Admin Logic */

let db = [];

document.addEventListener('DOMContentLoaded', initAdmin);

async function initAdmin() {
  try {
    const res = await fetch('../data/database.json?v=' + new Date().getTime());
    const data = await res.json();
    db = data.filter(item => !item._SEPARADOR); // Remove separadores se houver
    renderLojas();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    alert("Erro ao carregar database.json");
  }
}

function showSection(id) {
  // Esconde todos
  document.getElementById('sec-lojas').classList.add('d-none');
  document.getElementById('sec-json').classList.add('d-none');
  
  // Mostra o desejado
  if (id === 'lojas') document.getElementById('sec-lojas').classList.remove('d-none');
  if (id === 'json') {
    document.getElementById('sec-json').classList.remove('d-none');
    renderJSON();
  }

  // Atualiza menu
  document.querySelectorAll('.admin-menu button').forEach(b => b.classList.remove('active'));
  // (Lógica simplificada para menu active)
}

function renderLojas() {
  const container = document.getElementById('lojasList');
  if (!container) return;

  container.innerHTML = db.map(loja => `
    <div class="admin-item">
      <div style="display:flex; align-items:center; flex:1;">
        <img src="${loja.logo.startsWith('http') || loja.logo.startsWith('../') ? loja.logo : '../' + loja.logo}" class="admin-item-img" onerror="this.src='../assets/img/app-icon.png'">
        <div class="admin-item-content">
          <div class="admin-item-title">${loja.nome}</div>
          <div class="admin-item-sub">${loja.categoria} • ${loja.plano}</div>
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn-sm btn-edit" onclick="editLoja(${loja.id})"><i class='bx bxs-pencil'></i></button>
        <button class="btn-sm btn-delete" onclick="deleteLoja(${loja.id})"><i class='bx bxs-trash'></i></button>
      </div>
    </div>
  `).join('');
}

function renderJSON() {
  const output = document.getElementById('jsonOutput');
  output.innerText = JSON.stringify(db, null, 2);
}

function copyJSON() {
  const text = document.getElementById('jsonOutput').innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("JSON copiado! Cole no arquivo data/database.json");
  });
}

function deleteLoja(id) {
  if(confirm("Tem certeza que deseja excluir esta loja?")) {
    db = db.filter(l => l.id != id);
    renderLojas();
  }
}

function editLoja(id) {
  alert("Funcionalidade de edição completa seria implementada aqui (Modal com formulário preenchido).");
}

function openModalLoja() {
  alert("Funcionalidade de criação seria implementada aqui.");
}

// Expor funções globais
window.showSection = showSection;
window.openModalLoja = openModalLoja;
window.copyJSON = copyJSON;
window.deleteLoja = deleteLoja;
window.editLoja = editLoja;
