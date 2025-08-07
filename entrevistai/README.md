## EntrevistAI

Simulador de entrevistas técnicas com IA.

### Como rodar localmente

1. Instale as dependências:
   ```
   npm install
   ```
2. Crie um arquivo `.env` com as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENROUTER_API_KEY`
3. Rode o projeto:
   ```
   npm run dev
   ```

### Fluxo principal

1. Usuário faz login/cadastro (Supabase Auth)
2. Preenche perfil e stack
3. IA conduz entrevista (5 perguntas)
4. Feedback e pontuação ao final
5. Histórico disponível no dashboard

### Scripts úteis

- `npm run dev` — inicia ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — lint do projeto
- `npm run typecheck` — checagem de tipos

### Testes

Estrutura inicial de testes será adicionada em breve.
