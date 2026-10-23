const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Suas chaves do Supabase
const supabaseUrl = 'https://kfpayptxmsewcofkhvlv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcGF5cHR4bXNld2NvZmtodmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDk2NzAsImV4cCI6MjEwODE4NTY3MH0.k8b6icTdQ70bnp2_IiKL7ruajZzQS-LNrWeEgh5dbMo';

const supabase = createClient(supabaseUrl, supabaseKey);

const SENHA_PAINEL = 'tomacai2025';

// Salvar pedido
app.post('/api/pedido', async (req, res) => {
  const { cliente, telefone, endereco, pagamento, itens, total } = req.body;
  if (!itens || itens.length === 0) return res.status(400).json({ erro: 'Carrinho vazio' });

  const data = new Date().toLocaleString('pt-BR');

  const { data: result, error } = await supabase
    .from('pedidos')
    .insert([{ cliente, telefone, endereco, pagamento, itens, total, data }])
    .select();

  if (error) {
    console.error("ERRO DO SUPABASE:", error);
    return res.status(500).json({ erro: 'Erro ao salvar', detalhe: error.message });
  }
  res.json({ sucesso: true, id: result[0].id });
});

// Listar pedidos (CORRIGIDO)
app.get('/api/pedidos', async (req, res) => {
  if (req.query.senha !== SENHA_PAINEL) return res.status(401).json({ erro: 'Senha incorreta' });
  
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('id', { ascending: false });
    
  if (error) return res.status(500).json({ erro: 'Erro' });

  // Transforma o campo 'itens' de objeto para texto, para o painel conseguir ler
  const pedidosFormatados = data.map(p => {
    return {
      ...p,
      itens: typeof p.itens === 'string' ? p.itens : JSON.stringify(p.itens)
    };
  });

  res.json(pedidosFormatados);
});

// Marcar como pago
app.post('/api/pedido/:id/pagar', async (req, res) => {
  if (req.query.senha !== SENHA_PAINEL) return res.status(401).json({ erro: 'Senha' });
  
  const { error } = await supabase
    .from('pedidos')
    .update({ pago: 1, status: 'pago' })
    .eq('id', req.params.id);
    
  if (error) return res.status(500).json({ erro: 'Erro' });
  res.json({ sucesso: true });
});

// Concluir pedido
app.post('/api/pedido/:id/concluir', async (req, res) => {
  if (req.query.senha !== SENHA_PAINEL) return res.status(401).json({ erro: 'Senha' });
  
  const { error } = await supabase
    .from('pedidos')
    .update({ status: 'concluido' })
    .eq('id', req.params.id);
    
  if (error) return res.status(500).json({ erro: 'Erro' });
  res.json({ sucesso: true });
});

app.listen(PORT, () => {
  console.log('Servidor rodando em http://localhost:' + PORT);
});