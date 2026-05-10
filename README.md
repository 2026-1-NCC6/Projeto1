# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href="https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP" border="0"></a>
</p>

# **Arkanis**

<p align="center">
<img src="/imagens/Arkanis.png" width="620">
</p>

## Grupo 4

### Integrantes:
- **Aleff  Souza** — 23025514
- **Matheus Zimmer** — 23025264 
- **Luciano Reis** — 23025304
- **João Colombo** — 23025479

### Professores Orientadores:
Victor Bruno Alexander Rosetti de Quiroz,  
Edson Ricardo Barbeiro,  
Lucy Mari Tabuti,  
Rodnil da Silva Moreira Lisboa,  
João Francisco Trencher Martins.

---

## 🎯 Descrição

 A Arkanis é um sistema inteligente, acessível e conectado à internet, criado para cuidar do clima de acervos culturais. A solução une pequenos aparelhos que medem o ambiente a um aplicativo de celular e computador.

---

## 🛠 Estrutura de pastas

-Raiz<br>
|<br>
|-->documentos<br>
  &emsp;|-->Entrega 1<br>
    &emsp;|-->Inovação e Empreendedorismo<br>
    &emsp;|-->Sistemas Embarcados e Robótica<br>
    &emsp;|-->Projeto Interdisciplinar | Internet das coisas e Robótica<br>
    &emsp;|-->Teoria da Computação e Linguagens Formais<br>
    &emsp;|-->Redes de Computadores e Cibersegurança<br>
  &emsp;|-->Entrega 2<br>
    &emsp;|-->Inovação e Empreendedorismo<br>
    &emsp;|--Sistemas Embarcados e Robótica<br>
    &emsp;|-->Projeto Interdisciplinar | Internet das coisas e Robótica<br>
    &emsp;|-->Teoria da Computação e Linguagens Formais<br>
    &emsp;|-->Redes de Computadores e Cibersegurança<br>
  &emsp;|readme.md<br>
|-->src/smart_feeders<br>
  &emsp;|-->windows<br>
  &emsp;|-->android<br>
  &emsp;|-->HTML<br>
|-->imagens<br>
|-->src<br>
|.gitignore<br>
|readme.md<br>

---

## 🚀 Entrega 2 — Sistema Web, Backend e Aplicativo Mobile

Na Entrega 2, o projeto Arkanis evoluiu para uma solução IoT completa, com backend, site web administrativo e aplicativo mobile integrados.

A solução implementada permite receber dados ambientais, armazenar leituras, visualizar informações em tempo real, gerar relatórios e acompanhar o status dos ambientes monitorados.

---

## 🧩 Arquitetura da solução

A arquitetura final do sistema segue o fluxo:

```txt
Sensor / ESP / Simulador
        ↓
Broker MQTT
        ↓
Backend Node.js / Express
        ↓
Banco SQLite com Prisma ORM
        ↓
API REST + Socket.IO
        ↓
Site Web React/Vite
        ↓
Aplicativo Mobile React Native/Expo
```

O backend centraliza a comunicação com o MQTT, processa as leituras recebidas, salva os dados no banco e envia atualizações em tempo real para o site e para o aplicativo.

---

## 🌐 Backend publicado

O backend foi publicado no Render e está disponível por HTTPS:

```txt
https://projeto1-4rsx.onrender.com
```

Health check:

```txt
https://projeto1-4rsx.onrender.com/healthz
```

Resposta esperada:

```json
{
  "ok": true
}
```

---

## 💻 Site Web

O site web foi desenvolvido com React e Vite.

Funcionalidades principais:

- Login com JWT;
- Dashboard em tempo real;
- Visualização de temperatura, umidade, pressão, gás e fogo;
- Visualização do JSON recebido;
- Gráfico das leituras;
- CRUD de ambientes;
- CRUD de dispositivos;
- Configuração de tópicos MQTT;
- Histórico de leituras;
- Relatório CSV;
- Logs do sistema;
- Gestão de usuários e perfis.

Caminho do projeto web:

```txt
src/Entrega2/SiteApp/flex-iot-dashboard-refatorado
```

---

## 🖥 Backend

O backend foi desenvolvido com Node.js e Express.

Principais responsabilidades:

- Receber dados MQTT;
- Validar payloads;
- Identificar o dispositivo pelo tópico MQTT;
- Associar leituras ao ambiente correto;
- Salvar dados no SQLite via Prisma;
- Gerar alertas;
- Registrar logs;
- Expor API REST;
- Enviar atualizações em tempo real com Socket.IO;
- Autenticar usuários com JWT e senha hash.

Caminho do backend:

```txt
src/Entrega2/SiteApp/flex-iot-dashboard-refatorado/backend
```

---

## 📱 Aplicativo Mobile

O aplicativo mobile foi desenvolvido com React Native e Expo.

Funcionalidades principais:

- Login;
- Recuperação de senha simulada;
- Aceite LGPD no primeiro acesso;
- Lista de ambientes monitorados;
- Status dos ambientes;
- Últimas leituras por ambiente;
- Gráfico de leituras por período;
- Central de alertas;
- Preferências de usuário;
- Comunicação em tempo real com Socket.IO.

Caminho do app mobile:

```txt
src/Entrega2/SiteApp/flex-iot-mobile-expo
```

---

## 🔑 Credenciais de teste

```txt
E-mail: admin@flex.com
Senha: admin123
```

---

## 🧪 Teste sem ESP físico

Caso o ESP físico não esteja disponível, é possível simular o envio de dados pelo Postman.

Endpoint:

```txt
POST https://projeto1-4rsx.onrender.com/api/test-reading
```

Body:

```json
{
  "topic": "flex/sala_museu_1/sensor_01",
  "temperature": 28.5,
  "humidity": 62.1,
  "pressure": 1012.8,
  "gas": 410,
  "fogo": false,
  "estado": "NORMAL"
}
```

Exemplo de emergência:

```json
{
  "topic": "flex/sala_museu_1/sensor_01",
  "temperature": 45.8,
  "humidity": 30.0,
  "pressure": 1010.2,
  "gas": 900,
  "fogo": true,
  "estado": "EMERGENCIA"
}
```

---

## 📊 Relatórios

O sistema permite gerar relatório CSV com os últimos dados lidos pelo sistema.

Endpoint do relatório:

```txt
https://projeto1-4rsx.onrender.com/api/relatorio-historico.csv
```

O relatório contém informações como:

- Data;
- Ambiente;
- Dispositivo;
- Tópico MQTT;
- Temperatura;
- Umidade;
- Pressão;
- Gás;
- Fogo;
- Estado.

---

## ⚙️ Como executar o frontend web

Entre na pasta do frontend:

```bash
cd src/Entrega2/SiteApp/flex-iot-dashboard-refatorado/frontend
```

Instale as dependências:

```bash
npm install
```

Crie ou edite o arquivo `.env`:

```env
VITE_API_URL=https://projeto1-4rsx.onrender.com
VITE_SOCKET_URL=https://projeto1-4rsx.onrender.com
```

Execute:

```bash
npm run dev
```

Acesse:

```txt
http://localhost:5173
```

---

## ⚙️ Como executar o app mobile

Entre na pasta do app:

```bash
cd src/Entrega2/SiteApp/flex-iot-mobile-expo
```

Instale as dependências:

```bash
npm install
```

Crie ou edite o arquivo `.env`:

```env
EXPO_PUBLIC_API_URL=https://projeto1-4rsx.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://projeto1-4rsx.onrender.com
```

Execute:

```bash
npx expo start -c
```

Depois, abra o app pelo Expo Go ou instale o APK gerado.

---

## 📦 APK do aplicativo

O aplicativo mobile pode ser gerado em formato APK usando Expo EAS Build.

Comando utilizado:

```bash
eas build -p android --profile preview
```

O APK gerado permite instalar o aplicativo diretamente em um celular Android.

---

## ✅ Requisitos contemplados

O sistema contempla os principais requisitos da entrega:

- Backend publicado em HTTPS;
- Aplicação web funcional;
- Aplicativo mobile funcional;
- Autenticação;
- Gestão de ambientes;
- Gestão de dispositivos;
- Integração com MQTT;
- Histórico de leituras;
- Dashboard em tempo real;
- Gráficos;
- Alertas;
- Logs;
- Relatórios CSV;
- Comunicação via Socket.IO;
- Banco de dados SQLite com Prisma.

---

## ⚠️ Limitações e melhorias futuras

Alguns requisitos avançados foram identificados como melhorias futuras:

- Recuperação de senha real por e-mail;
- Notificações push reais;
- Exportação em PDF;
- Cálculo completo de uptime por período;
- Reconhecimento manual de alertas;
- Deduplicação de mensagens MQTT;
- Regras de alerta com janela móvel;
- Controle visual completo por perfil;
- Migração de SQLite para PostgreSQL em produção.

Para fins acadêmicos, a solução atual atende ao fluxo principal do projeto e permite demonstrar a integração entre sensores, backend, banco de dados, site web e aplicativo mobile.

---

## 📋 Licença/License
Este projeto está licenciado sob a licença CC BY 4.0.
Você pode criar a sua própria licença Creative Commons em: https://chooser-beta.creativecommons.org/

## 🎓 Referências

Aqui estão as referências usadas no projeto:
