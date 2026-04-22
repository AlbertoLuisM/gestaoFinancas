const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const data = {
  profile: { name: 'Alberto' },
  incomes: [
    {
      id: 1,
      descricao: 'Salário',
      categoria: 'Salário',
      data: '2026-04-07',
      recorrencia: 'Mensal',
      valor: 3199.56,
      fonte: 'Empresa'
    }
  ],
  expenses: [
    { id: 1, descricao: 'Netflix', categoria: 'Assinaturas', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Mensal', valor: 44.9, observacoes: '' },
    { id: 2, descricao: 'Padaria do Alex', categoria: 'Alimentação', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Uma vez', valor: 50, observacoes: '' },
    { id: 3, descricao: 'Chat GPT', categoria: 'Assinaturas', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Mensal', valor: 100, observacoes: '' },
    { id: 4, descricao: 'Amazon', categoria: 'Assinaturas', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Mensal', valor: 29.9, observacoes: '' },
    { id: 5, descricao: 'Mercado', categoria: 'Alimentação', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Uma vez', valor: 347.85, observacoes: '' },
    { id: 6, descricao: 'Crunchyroll', categoria: 'Assinaturas', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Mensal', valor: 24.9, observacoes: '' },
    { id: 7, descricao: 'Restaurante Larita', categoria: 'Alimentação', data: '2026-04-08', pagamento: 'Cartão de Crédito', recorrencia: 'Uma vez', valor: 47, observacoes: '' },
    { id: 8, descricao: 'Farmácia', categoria: 'Saúde', data: '2026-04-10', pagamento: 'Pix', recorrencia: 'Uma vez', valor: 59.15, observacoes: '' },
    { id: 9, descricao: 'Condomínio', categoria: 'Moradia', data: '2026-04-05', pagamento: 'Boleto', recorrencia: 'Mensal', valor: 376, observacoes: '' },
    { id: 10, descricao: 'Ônibus', categoria: 'Transporte', data: '2026-04-09', pagamento: 'Pix', recorrencia: 'Semanal', valor: 100, observacoes: '' },
    { id: 11, descricao: 'Outras compras', categoria: 'Outros', data: '2026-04-11', pagamento: 'Pix', recorrencia: 'Uma vez', valor: 23.28, observacoes: '' },
    { id: 12, descricao: 'Academia', categoria: 'Saúde', data: '2026-04-02', pagamento: 'Cartão de Crédito', recorrencia: 'Mensal', valor: 29, observacoes: '' },
    { id: 13, descricao: 'Spotify', categoria: 'Assinaturas', data: '2026-04-03', pagamento: 'Cartão de Crédito', recorrencia: 'Mensal', valor: 19.9, observacoes: '' },
    { id: 14, descricao: 'iFood', categoria: 'Alimentação', data: '2026-04-12', pagamento: 'Pix', recorrencia: 'Uma vez', valor: 85, observacoes: '' },
    { id: 15, descricao: 'Luz', categoria: 'Moradia', data: '2026-04-10', pagamento: 'Boleto', recorrencia: 'Mensal', valor: 120, observacoes: '' },
    { id: 16, descricao: 'Internet', categoria: 'Moradia', data: '2026-04-08', pagamento: 'Boleto', recorrencia: 'Mensal', valor: 76, observacoes: '' }
  ],
  debts: [
    {
      id: 1,
      descricao: 'Financiamento de veículo',
      valorOriginal: 12000,
      saldoRestante: 9000,
      taxaJuros: 1.25,
      parcelasTotais: 48,
      parcelasRestantes: 36,
      credor: 'Banco XPTO'
    }
  ],
  goals: [
    { id: 1, nome: 'Reserva de emergência', alvo: 10000, atual: 1000, prazo: '2027-12-31' },
    { id: 2, nome: 'Quitar financiamento', alvo: 9000, atual: 800, prazo: '2028-03-31' }
  ]
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function formatDateBR(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function calculateSummary() {
  const receitaTotal = data.incomes.reduce((acc, item) => acc + item.valor, 0);
  const despesaTotal = data.expenses.reduce((acc, item) => acc + item.valor, 0);
  const dividasTotal = data.debts.reduce((acc, item) => acc + item.saldoRestante, 0);
  const saldoLiquido = receitaTotal - despesaTotal - data.debts.reduce((acc, item) => acc + (item.saldoRestante / item.parcelasRestantes || 0), 0);
  const metasProgresso = data.goals.length
    ? Math.round((data.goals.reduce((acc, goal) => acc + Math.min(goal.atual / goal.alvo, 1), 0) / data.goals.length) * 100)
    : 0;
  const score = Math.max(0, Math.min(100, Math.round((saldoLiquido / (receitaTotal || 1)) * 100 + 45)));

  const byCategory = data.expenses.reduce((acc, expense) => {
    acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
    return acc;
  }, {});

  const categorias = Object.entries(byCategory)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: despesaTotal ? Math.round((valor / despesaTotal) * 100) : 0
    }))
    .sort((a, b) => b.valor - a.valor);

  return {
    perfil: data.profile,
    receitaTotal,
    despesaTotal,
    saldoLiquido,
    dividasTotal,
    parcelasRestantes: data.debts.reduce((acc, item) => acc + item.parcelasRestantes, 0),
    metasProgresso,
    scoreSaude: score,
    categorias,
    proximasContas: [
      { descricao: 'Cartão Nubank', vencimento: '2026-04-25', valor: 645.2 },
      { descricao: 'Energia elétrica', vencimento: '2026-04-27', valor: 120 }
    ].map((item) => ({ ...item, vencimentoFormatado: formatDateBR(item.vencimento) }))
  };
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(publicDir, path.normalize(safePath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Acesso negado');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Página não encontrada');
      return;
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain; charset=utf-8' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    try {
      if (req.method === 'GET' && pathname === '/api/summary') {
        return sendJson(res, 200, calculateSummary());
      }

      if (req.method === 'GET' && pathname === '/api/incomes') {
        return sendJson(res, 200, data.incomes);
      }

      if (req.method === 'POST' && pathname === '/api/incomes') {
        const body = await readBody(req);
        if (!body.descricao || !body.data || !body.valor) {
          return sendJson(res, 400, { error: 'Campos obrigatórios: descrição, data e valor.' });
        }
        const newIncome = {
          id: Date.now(),
          descricao: body.descricao,
          categoria: body.categoria || 'Outros',
          data: body.data,
          recorrencia: body.recorrencia || 'Uma vez',
          valor: Number(body.valor),
          fonte: body.fonte || 'Manual'
        };
        data.incomes.push(newIncome);
        return sendJson(res, 201, newIncome);
      }

      if (req.method === 'GET' && pathname === '/api/expenses') {
        return sendJson(res, 200, data.expenses);
      }

      if (req.method === 'POST' && pathname === '/api/expenses') {
        const body = await readBody(req);
        if (!body.descricao || !body.data || !body.valor) {
          return sendJson(res, 400, { error: 'Campos obrigatórios: descrição, data e valor.' });
        }

        const newExpense = {
          id: Date.now(),
          descricao: body.descricao,
          categoria: body.categoria || 'Outros',
          data: body.data,
          pagamento: body.pagamento || 'Pix',
          recorrencia: body.recorrencia || 'Uma vez',
          valor: Number(body.valor),
          observacoes: body.observacoes || ''
        };
        data.expenses.push(newExpense);
        return sendJson(res, 201, newExpense);
      }

      if (req.method === 'DELETE' && pathname.startsWith('/api/expenses/')) {
        const id = Number(pathname.split('/').pop());
        const index = data.expenses.findIndex((expense) => expense.id === id);
        if (index === -1) {
          return sendJson(res, 404, { error: 'Despesa não encontrada.' });
        }
        data.expenses.splice(index, 1);
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'GET' && pathname === '/api/debts') {
        return sendJson(res, 200, data.debts);
      }

      if (req.method === 'GET' && pathname === '/api/goals') {
        return sendJson(res, 200, data.goals);
      }

      return sendJson(res, 404, { error: 'Rota não encontrada.' });
    } catch (error) {
      return sendJson(res, 500, { error: 'Erro interno do servidor.', detalhe: error.message });
    }
  }

  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Saldo Inteligente disponível em http://localhost:${PORT}`);
});
