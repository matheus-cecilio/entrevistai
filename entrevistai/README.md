# 🎯 EntrevistAI

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/OpenRouter-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="OpenRouter" />
</div>

<br />

**EntrevistAI** é uma plataforma inteligente que simula entrevistas técnicas usando IA avançada. Pratique suas habilidades de entrevista com feedback personalizado e acompanhe seu progresso ao longo do tempo.

## ✨ Características

- 🤖 **IA Conversacional**: Entrevistas conduzidas por IA com perguntas contextuais
- 📊 **Feedback Detalhado**: Avaliação qualitativa para cada resposta (Excelente/Bom/Insuficiente/Resposta Inválida)
- 📈 **Acompanhamento de Progresso**: Dashboard com histórico completo de entrevistas
- � **Gerenciamento de Perfil**: Edite suas informações pessoais e avatar
- �🔐 **Autenticação Segura**: Login via email/senha
- 📱 **Interface Responsiva**: Design moderno que funciona em todos os dispositivos
- ⏱️ **Limite de Tempo**: Simula pressão real de entrevista com timer de 15 minutos

## Demo

### Fluxo da Aplicação

1. **Setup do Perfil** → Informe sua função profissional e área de atuação
2. **Entrevista Interativa** → 5 perguntas progressivas
3. **Avaliação Detalhada** → Pontuação e feedback construtivo para cada resposta
4. **Feedback Geral** → Análise completa do desempenho pela IA
5. **Histórico** → Acompanhe sua evolução ao longo do tempo

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Radix UI** - Componentes acessíveis (shadcn/ui)
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas

### Backend & Infraestrutura
- **Supabase** - Autenticação e banco de dados PostgreSQL
- **OpenRouter API** - Provedor de IA (modelo openai/gpt-oss-20b:free)
- **Vercel** - Plataforma de deploy (recomendado)

### Desenvolvimento
- **Jest** - Framework de testes
- **ESLint** - Linting de código
- **Prettier** - Formatação de código

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ - O projeto usa recursos que não estão disponíveis em versões anteriores.
- npm ou yarn
- Conta no Supabase
- Chave API do OpenRouter

### 1. Clone o repositório
```bash
git clone https://github.com/matheuscb0/entrevistai.git
cd entrevistai
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# AI Provider
OPENROUTER_API_KEY=sua_chave_do_openrouter

# Site URL (para OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:9002
```

### 3. Configure o banco de dados
Execute este SQL no seu projeto Supabase:

```sql
-- Criar tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT, -- Cidade do usuário para ranking
  state TEXT, -- Estado do usuário
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de entrevistas
CREATE TABLE interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  professional_area TEXT NOT NULL,
  city TEXT, -- Cidade do usuário para ranking regional
  state TEXT, -- Estado para estatísticas regionais
  results JSONB NOT NULL,
  overall_feedback TEXT NOT NULL,
  average_score INTEGER NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para entrevistas
CREATE POLICY "Users can view own interviews" ON interviews
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 4. Instale Dependências e Execute o projeto
```bash
npm install
npm run dev
```

Acesse: `http://localhost:9002`

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linting
npm run typecheck    # Verifica tipos TypeScript
```

## 🏗️ Arquitetura do Projeto

```
src/
├── app/                # App Router (Next.js 13+)
│   ├── page.tsx        # Página principal da entrevista
│   ├── login/          # Autenticação
│   ├── signup/         # Cadastro
│   ├── profile/        # Gerenciamento de perfil
│   ├── history/        # Histórico de entrevistas
│   └── auth/callback/  # Callback OAuth
├── components/
│   ├── interview/      # Componentes específicos da entrevista
│   │   ├── FeedbackDisplay.tsx
│   │   ├── Header.tsx
│   │   ├── InterviewArea.tsx
│   │   ├── ProfileSetup.tsx
│   │   └── ResultsScreen.tsx
│   ├── profile/        # Componentes de perfil
│   │   └── ProfileForm.tsx
│   └── ui/            # Componentes UI reutilizáveis (shadcn)
├── ai/
│   └── flows/         # Lógica de IA
│       ├── interview-flow.ts
│       └── interview-types.ts
├── hooks/
│   ├── use-profile.ts # Hook para gerenciar perfil
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── actions.ts     # Server Actions para entrevistas
│   ├── profile-actions.ts # Server Actions para perfil
│   ├── utils.ts       # Utilidades
│   └── supabase/      # Configuração Supabase
└── types/
    ├── interview.ts   # Tipos para entrevistas
    └── profile.ts     # Tipos para perfil
```

## 🔐 Autenticação

O projeto suporta múltiplos métodos de autenticação:

- **Email/Senha**: Cadastro tradicional
- **OAuth**: Google e GitHub (configurável)
- **Magic Links**: Links de acesso por email

## 🤖 Sistema de IA

### Fluxo de Entrevista
1. **Início**: IA gera primeira pergunta baseada no perfil
2. **Continuação**: Para cada resposta, IA avalia e gera próxima pergunta
3. **Finalização**: Análise geral e feedback construtivo

### Prompts Otimizados
- Perguntas contextuais baseadas na função e área profissional
- Feedback construtivo
- Avaliação objetiva com pontuação de 0-100

## 📊 Banco de Dados

### Tabela `profiles`
- `id`: UUID referenciando auth.users
- `full_name`: Nome do usuário
- `avatar_url`: URL da foto de perfil
- `updated_at`: Data de última atualização

### Tabela `interviews`
- `id`: UUID único
- `user_id`: Referência ao usuário autenticado
- `job_role`: Função profissional
- `professional_area`: Área de atuação
- `results`: JSON com perguntas, respostas e avaliações
- `overall_feedback`: Feedback geral da IA
- `average_score`: Pontuação média

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Vercel

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Executar com coverage
npm run test:coverage
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NewFeature`)
3. Commit suas mudanças (`git commit -m 'Add some NewFeature'`)
4. Push para a branch (`git push origin feature/NewFeature`)
5. Abra um Pull Request

## Autor

**Matheus** - [matheuscb0](https://github.com/matheuscb0)

---

<div align="center">
  <p>Feito com dedicação e ☕ para ajudar pessoas a se prepararem melhor para entrevistas</p>
</div>
</content>
</invoke>
