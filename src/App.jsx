import { useEffect, useMemo, useState } from 'react';
import { clearSession, endpoints, getToken } from './api';

const statuses = ['Aberto', 'Em Atendimento', 'Concluído'];
const emptyTicket = { titulo: '', descricao: '', prioridade: 'Média' };

function normalizeList(data) {
  return Array.isArray(data) ? data : data.chamados || data.tickets || data.data || [];
}

function statusClass(status) {
  return `status ${String(status || 'Aberto').toLowerCase().replaceAll(' ', '-')}`;
}

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const result = mode === 'login'
        ? await endpoints.login({ email: form.email, senha: form.senha })
        : await endpoints.register(form);
      const token = result.token || result.accessToken || result.data?.token;
      if (!token) throw new Error('A API não retornou um token de autenticação.');
      const user = result.usuario || result.user || result.data?.usuario || { nome: form.nome, email: form.email };
      localStorage.setItem('helpdesk_token', token);
      localStorage.setItem('helpdesk_user', JSON.stringify(user));
      onAuthenticated(user);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return <main className="auth-shell"><section className="auth-card">
    <div className="brand-mark">H</div><p className="eyebrow">CENTRAL DE SUPORTE</p>
    <h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
    <p className="muted">{mode === 'login' ? 'Acompanhe seus chamados em um só lugar.' : 'Abra e acompanhe seus chamados de suporte.'}</p>
    <form onSubmit={submit}>
      {mode === 'register' && <label>Nome<input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>}
      <label>E-mail<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Senha<input type="password" minLength="6" required value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} /></label>
      {error && <p className="alert error">{error}</p>}
      <button className="primary full" disabled={loading}>{loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
    </form>
    <button className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
      {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
    </button>
  </section></main>;
}

function TicketModal({ ticket, onClose, onStatus, onComment }) {
  const [comments, setComments] = useState([]); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { endpoints.comments(ticket.id_chamado || ticket.id).then(normalizeList).then(setComments).catch(() => setComments([])); }, [ticket]);
  const id = ticket.id_chamado || ticket.id;
  const send = async (e) => { e.preventDefault(); if (!message.trim()) return; try { const item = await onComment(id, message); setComments((old) => [...old, item.comentario || item]); setMessage(''); } catch (err) { setError(err.message); } };
  return <div className="overlay" role="dialog" aria-modal="true"><section className="modal">
    <button className="close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">CHAMADO #{id}</p><h2>{ticket.titulo || ticket.assunto}</h2>
    <p className="description">{ticket.descricao}</p><div className="modal-row"><span className={statusClass(ticket.status)}>{ticket.status || 'Aberto'}</span>
    <select aria-label="Alterar status" value={ticket.status || 'Aberto'} onChange={(e) => onStatus(id, e.target.value)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></div>
    <h3>Comentários</h3><div className="comments">{comments.length ? comments.map((c, i) => <article key={c.id_comentario || c.id || i}><strong>{c.usuario?.nome || c.nome_usuario || 'Atendimento'}</strong><p>{c.mensagem || c.comentario}</p></article>) : <p className="muted">Nenhum comentário ainda.</p>}</div>
    <form className="comment-form" onSubmit={send}><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escreva uma atualização…" /> <button className="primary">Enviar</button></form>{error && <p className="alert error">{error}</p>}
  </section></div>;
}

function Dashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([]); const [selected, setSelected] = useState(null); const [form, setForm] = useState(emptyTicket); const [filter, setFilter] = useState('Todos'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); try { setTickets(normalizeList(await endpoints.tickets())); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => filter === 'Todos' ? tickets : tickets.filter((t) => t.status === filter), [tickets, filter]);
  const create = async (e) => { e.preventDefault(); try { const result = await endpoints.createTicket(form); setTickets((old) => [result.chamado || result, ...old]); setForm(emptyTicket); } catch (err) { setError(err.message); } };
  const changeStatus = async (id, status) => { try { await endpoints.updateStatus(id, status); const updated = (t) => (t.id === id || t.id_chamado === id) ? { ...t, status } : t; setTickets((old) => old.map(updated)); setSelected((old) => old ? updated(old) : old); } catch (err) { setError(err.message); } };
  const addComment = (id, mensagem) => endpoints.addComment(id, mensagem);
  return <main className="app-shell"><header><div className="logo"><span>H</span> HelpDesk</div><div className="user"><span>{user?.nome || user?.email || 'Usuário'}</span><button className="link" onClick={onLogout}>Sair</button></div></header>
    <section className="hero"><div><p className="eyebrow">PAINEL DE ATENDIMENTO</p><h1>Como podemos ajudar?</h1><p>Abra um chamado e acompanhe cada atualização.</p></div><div className="summary"><b>{tickets.filter((t) => t.status !== 'Concluído').length}</b><span>chamados ativos</span></div></section>
    <section className="content-grid"><section className="new-ticket"><h2>Abrir novo chamado</h2><form onSubmit={create}><label>Assunto<input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Acesso ao sistema" /></label><label>Descrição<textarea required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o que está acontecendo" /></label><label>Prioridade<select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}><option>Baixa</option><option>Média</option><option>Alta</option></select></label><button className="primary full">Enviar chamado</button></form></section>
      <section className="ticket-list"><div className="section-title"><h2>Meus chamados</h2><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar chamados"><option>Todos</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select></div>{error && <p className="alert error">{error}</p>}{loading ? <p className="muted">Carregando chamados…</p> : visible.length ? <div className="cards">{visible.map((t) => <button className="ticket-card" key={t.id_chamado || t.id} onClick={() => setSelected(t)}><div><span className={statusClass(t.status)}>{t.status || 'Aberto'}</span><h3>{t.titulo || t.assunto}</h3><p>{t.descricao || 'Sem descrição'}</p></div><span className="arrow">→</span></button>)}</div> : <div className="empty">Nenhum chamado encontrado.</div>}</section></section>
    {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} onStatus={changeStatus} onComment={addComment} />}
  </main>;
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('helpdesk_user')); } catch { return null; } });
  if (!getToken() || !user) return <Auth onAuthenticated={setUser} />;
  return <Dashboard user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}
