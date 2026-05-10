# Flex Automation IoT — React + Node + SQLite + MQTT

Projeto refatorado a partir do HTML funcional original, mantendo o payload MQTT e migrando a comunicação direta do navegador para a arquitetura:

**MQTT → Backend → SQLite/Prisma → Frontend em tempo real via Socket.IO**

## Payload MQTT mantido

O backend espera o mesmo payload usado no HTML original:

```json
{
  "temperature": 25.4,
  "humidity": 60.1,
  "pressure": 1012.5,
  "gas": 320,
  "fogo": false,
  "estado": "NORMAL"
}
```

Tópico inicial cadastrado no seed:

```txt
flex/sala_museu_1/sensor_01
```

## Estrutura

```txt
flex-iot-dashboard-refatorado/
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  └─ src/
│     ├─ lib/prisma.js
│     ├─ middleware/auth.js
│     ├─ routes/
│     ├─ services/mqtt.service.js
│     ├─ services/reading.service.js
│     ├─ services/offline.service.js
│     └─ server.js
└─ frontend/
   ├─ src/App.jsx
   ├─ src/api/client.js
   └─ src/styles.css
```

## Como rodar

### 1. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend: `http://localhost:3333`

Login inicial:

```txt
E-mail: admin@flex.com
Senha: admin123
```

### 2. Frontend

Em outro terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Configurar MQTT

No menu **MQTT**, informe:

- Host HiveMQ, sem `wss://`
- Porta WebSocket, normalmente `8884`
- Usuário
- Senha

Ao salvar, o backend conecta ao broker e assina os tópicos cadastrados nos dispositivos.

## Teste rápido via Postman sem MQTT

Para testar o dashboard real, o ideal é publicar no MQTT. Caso queira testar somente API, use o login para pegar token:

`POST http://localhost:3333/api/auth/login`

```json
{
  "email": "admin@flex.com",
  "password": "admin123"
}
```

Depois use o token Bearer nas demais rotas.

## Requisitos atendidos

- CRUD de ambientes: `/api/environments`
- CRUD de dispositivos: `/api/devices`
- Configuração de tópicos MQTT: campo `mqttTopic` em dispositivo
- Configuração do broker MQTT: `/api/mqtt/config`
- Validação de payload: `reading.service.js`
- Dashboard em tempo real: Socket.IO, evento `reading:new`
- Histórico de leituras: `/api/readings`
- Alertas por limites min/max e fogo: tabela `Alert`
- Logs do sistema: tabela `SystemLog`
- Usuários com roles: `ADMIN`, `TECNICO`, `CLIENTE`
- Autenticação: JWT + bcrypt
- Dispositivo offline: `offline.service.js`
- Relatórios: `/api/reports`
- Exportação CSV: `/api/export.csv`
- Filtros por período: parâmetros `from` e `to`

## Observação de publicação simples

Para publicar sem Docker:

- Frontend: Vercel, Netlify ou Render Static Site
- Backend: Render Web Service, Railway ou outro serviço Node.js
- Banco SQLite: funciona melhor localmente ou em servidor com disco persistente. Para produção real, migrar para PostgreSQL seria recomendado, mas para o escopo acadêmico o SQLite atende ao requisito de simplicidade.
