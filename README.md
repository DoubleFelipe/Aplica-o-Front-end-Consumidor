# HelpDesk — Front-end Consumidor

Interface web em React para abertura e acompanhamento de chamados, pronta para ser hospedada na Vercel e integrada a uma API REST no Render.

## Executar localmente

```bash
npm install
copy .env.example .env
npm run dev
```

Preencha `VITE_API_URL` no arquivo `.env` com a URL pública da API, por exemplo `https://helpdesk-api.onrender.com`.

## Endpoints consumidos

| Finalidade | Método | Rota |
| --- | --- | --- |
| Login | POST | `/api/v1/auth/login` |
| Cadastro | POST | `/api/v1/auth/register` |
| Listar/Abrir chamados | GET/POST | `/api/v1/chamados` |
| Atualizar status | PATCH | `/api/v1/chamados/:id/status` |
| Listar/Adicionar comentários | GET/POST | `/api/v1/chamados/:id/comentarios` |

As rotas privadas recebem automaticamente `Authorization: Bearer <token>`. O token é guardado somente no `localStorage` do navegador e removido no logout ou em resposta 401.

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Cadastre a variável de ambiente `VITE_API_URL` com a URL da API Render.
3. Faça o deploy. A API deve liberar a origem do domínio Vercel na configuração de CORS.

> A configuração dos endpoints pressupõe a estrutura descrita acima. Caso sua API use nomes diferentes, centralize o ajuste em `src/api.js`.
