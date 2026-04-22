const menuItems = [
  'Dashboard',
  'Visão Financeira',
  'Receitas',
  'Despesas',
  'Dívidas',
  'Metas',
  'Saúde Financeira',
  'Relatórios',
  'Consultor IA',
  'Notificações',
  'Configurações',
  'Segurança',
  'Sair'
];

const state = { page: 'Dashboard', summary: null, incomes: [], expenses: [] };
const money = (value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateBR = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

function renderMenu() {
  const menu = document.getElementById('menu');
  menu.innerHTML = menuItems.map((item) => `<a href="#" class="menu-item ${state.page === item ? 'active' : ''}" data-page="${item}">${item}</a>`).join('');

  menu.querySelectorAll('.menu-item').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      const page = el.dataset.page;
      if (page === 'Sair') return alert('Sessão encerrada (simulação).');
      state.page = page;
      renderMenu();
      renderPage();
    });
  });
}

function statCard(title, value, className = '') {
  return `<div class="card ${className}"><h4>${title}</h4><div class="value">${value}</div></div>`;
}

function renderDashboard() {
  const s = state.summary;
  const categorias = s.categorias.slice(0, 6).map((c) => `<li><span>${c.categoria}</span><span>${money(c.valor)} (${c.percentual}%)</span></li>`).join('');
  const contas = s.proximasContas.map((c) => `<li><span>${c.descricao} (${c.vencimentoFormatado})</span><strong>${money(c.valor)}</strong></li>`).join('');

  return `
    <div class="header-block">
      <h2>Olá, ${s.perfil.name} 👋</h2>
      <p>Sua saúde financeira está sendo monitorada. Bom trabalho!</p>
    </div>
    <div class="action-row">
      <button class="btn green">+ Receita</button>
      <button class="btn red" id="open-expense">+ Despesa</button>
      <button class="btn orange">+ Dívida</button>
      <button class="btn purple">+ Meta</button>
    </div>
    <div class="cards">
      ${statCard('Receita Total', money(s.receitaTotal), 'highlight')}
      ${statCard('Despesas Totais', money(s.despesaTotal))}
      ${statCard('Saldo Líquido', money(s.saldoLiquido))}
      ${statCard('Dívidas', money(s.dividasTotal))}
    </div>
    <div class="row">
      <div class="card"><h4>Score de Saúde</h4><div class="value">${s.scoreSaude}/100</div><div class="sub">${s.scoreSaude > 65 ? 'Bom' : 'Regular'}</div></div>
      <div class="card"><h4>Progresso das Metas</h4><div class="value">${s.metasProgresso}%</div><div class="sub">2 metas ativas</div></div>
    </div>
    <div class="row">
      <div class="card"><h4>Distribuição por Categoria</h4><ul class="list">${categorias}</ul></div>
      <div class="card"><h4>Próximas contas</h4><ul class="list">${contas}</ul></div>
    </div>
  `;
}

function renderOverview() {
  const s = state.summary;
  const bars = s.categorias.map((c) => `
    <div style="margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between;"><span>${c.categoria}</span><strong>${money(c.valor)} (${c.percentual}%)</strong></div>
      <div style="background:#e2e8f0; border-radius:999px; height:10px;"><div style="width:${c.percentual}%; background:#10b981; height:10px; border-radius:999px;"></div></div>
    </div>
  `).join('');
  return `
    <div class="header-block"><h2>Visão Financeira</h2><p>Panorama completo das suas finanças</p></div>
    <div class="cards">
      ${statCard('Receita Total', money(s.receitaTotal))}
      ${statCard('Despesas Totais', money(s.despesaTotal))}
      ${statCard('Saldo Líquido', money(s.saldoLiquido))}
      ${statCard('Dívidas Ativas', money(s.dividasTotal))}
    </div>
    <div class="card" style="margin-top:14px;"><h4>Despesas por Categoria</h4>${bars}</div>
  `;
}

function renderIncomes() {
  const total = state.incomes.reduce((acc, item) => acc + item.valor, 0);
  const rows = state.incomes.map((income) => `
    <tr>
      <td>${income.descricao}</td>
      <td><span class="badge">${income.categoria}</span></td>
      <td>${dateBR(income.data)}</td>
      <td><span class="badge">${income.recorrencia}</span></td>
      <td class="income">+${money(income.valor)}</td>
      <td>✎ 🗑</td>
    </tr>
  `).join('');

  return `
    <div class="header-block"><h2>Receitas</h2><p>Gerencie suas fontes de renda</p></div>
    <div class="stats">
      ${statCard('Total do período', money(total))}
      ${statCard('Quantidade de receitas', String(state.incomes.length))}
      ${statCard('Média por receita', money(total / (state.incomes.length || 1)))}
    </div>
    <div class="filter-box"><select><option>Todas as categorias</option></select></div>
    <div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Recorrência</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>
  `;
}

function renderExpenses() {
  const total = state.expenses.reduce((acc, item) => acc + item.valor, 0);
  const rows = state.expenses.map((expense) => `
    <tr>
      <td>${expense.descricao}</td>
      <td><span class="badge">${expense.categoria}</span></td>
      <td>${dateBR(expense.data)}</td>
      <td>${expense.pagamento}</td>
      <td class="expense">-${money(expense.valor)}</td>
      <td><button onclick="removeExpense(${expense.id})">🗑</button></td>
    </tr>
  `).join('');

  return `
    <div class="header-block"><h2>Despesas</h2><p>Controle seus gastos e despesas</p></div>
    <div class="action-row"><button class="btn red" id="open-expense">+ Nova Despesa</button></div>
    <div class="stats">
      ${statCard('Total de despesas', money(total))}
      ${statCard('Quantidade', String(state.expenses.length))}
      ${statCard('Média por despesa', money(total / (state.expenses.length || 1)))}
    </div>
    <div class="filter-box"><select><option>Todas as categorias</option></select></div>
    <div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Pagamento</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>
  `;
}

function renderPlaceholder(title) {
  return `<div class="card"><h4>${title}</h4><p>Este módulo está preparado para integração incremental com APIs reais (autenticação OAuth Google, contas a pagar/receber, notificações e IA).</p></div>`;
}

function attachExpenseEvents() {
  document.querySelectorAll('#open-expense').forEach((btn) => {
    btn.addEventListener('click', () => document.getElementById('expense-modal-overlay').classList.remove('hidden'));
  });
}

function renderPage() {
  const page = document.getElementById('page');
  const renders = {
    Dashboard: renderDashboard,
    'Visão Financeira': renderOverview,
    Receitas: renderIncomes,
    Despesas: renderExpenses
  };

  page.innerHTML = renders[state.page] ? renders[state.page]() : renderPlaceholder(state.page);
  attachExpenseEvents();
}

async function removeExpense(id) {
  await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
  await loadData();
}
window.removeExpense = removeExpense;

async function loadData() {
  const [summary, incomes, expenses] = await Promise.all([
    fetch('/api/summary').then((res) => res.json()),
    fetch('/api/incomes').then((res) => res.json()),
    fetch('/api/expenses').then((res) => res.json())
  ]);
  state.summary = summary;
  state.incomes = incomes;
  state.expenses = expenses;
  renderPage();
}

document.getElementById('close-expense-modal').addEventListener('click', () => {
  document.getElementById('expense-modal-overlay').classList.add('hidden');
});
document.getElementById('cancel-expense-modal').addEventListener('click', () => {
  document.getElementById('expense-modal-overlay').classList.add('hidden');
});

document.getElementById('expense-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());
  payload.valor = Number(payload.valor);

  await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  event.target.reset();
  document.getElementById('expense-modal-overlay').classList.add('hidden');
  await loadData();
});

renderMenu();
loadData();
