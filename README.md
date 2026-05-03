# contentlink

Gerador de conteúdo viral para LinkedIn. Transforma ideia bruta em post que pega fogo.

Stack: Next.js 16 + Tailwind + OpenAI API (GPT-4o).

## Deploy 1-clique

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBrunogamota%2Fcontentlinkdln&env=OPENAI_API_KEY&envDescription=Sua%20API%20key%20da%20OpenAI&envLink=https%3A%2F%2Fplatform.openai.com%2Fapi-keys&project-name=contentlink&repository-name=contentlink)

Quando clicar, o Vercel vai pedir tua `OPENAI_API_KEY` (pega em [platform.openai.com/api-keys](https://platform.openai.com/api-keys)) e fazer o deploy automático.

## Rodar local

```bash
echo "OPENAI_API_KEY=sk-..." > .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Como funciona

- Você joga uma ideia bruta (ex: "cliente que mais negocia preço é o que mais dá problema")
- Escolhe os modos: **Polêmico**, **Viral** e/ou **Autoridade**
- O sistema roda hook engine + 3 versões internas (visceral, reflexiva, natural)
- Aplica filtro anti-genérico
- Devolve hook + post pronto pra colar no LinkedIn

## Variáveis de ambiente

| Nome | Descrição |
|------|-----------|
| `OPENAI_API_KEY` | API key da OpenAI |

## Deploy via CLI (alternativa)

```bash
npm i -g vercel
vercel login
vercel env add OPENAI_API_KEY production
vercel --prod
```
