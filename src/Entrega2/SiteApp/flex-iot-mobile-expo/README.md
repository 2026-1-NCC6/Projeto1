# Flex IoT Mobile - React Native + Expo

Aplicativo mobile simples para o projeto Flex Automation, conectado ao backend Node.js/Express existente.

## Requisitos atendidos

- Login com JWT
- Recuperação de senha simulada
- Aceite LGPD no primeiro acesso
- Lista de ambientes
- Status NORMAL/ALERTA/OFFLINE/EMERGENCIA
- Detalhes do ambiente
- Últimas leituras de temperatura, umidade, data/hora e dispositivo
- Histórico 24h / 7 dias
- Gráfico simples com react-native-chart-kit
- Lista de alertas
- Destaque para emergências
- Notificação simples via Alert nativo
- Preferências: °C/°F, intervalo de atualização e favoritos
- AsyncStorage para token, usuário, LGPD e preferências
- Socket.IO client para tempo real
- Axios para API

## Configuração da API

Crie um arquivo `.env` na raiz do app:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_DA_REDE:3333/api
```

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333/api
```

Importante: no celular, `localhost` aponta para o próprio celular. Use o IP do PC onde o backend está rodando.

## Rodar o backend

No projeto web/backend:

```bash
npm run dev
```

O backend precisa estar rodando em algo como:

```txt
http://localhost:3333
```

## Rodar o app

```bash
npm install
npx expo start
```

Depois, escaneie o QR Code com o Expo Go.

## Login inicial

```txt
admin@flex.com
admin123
```

## Gerar APK com EAS

Instale o EAS CLI:

```bash
npm install -g eas-cli
```

Faça login:

```bash
eas login
```

Configure:

```bash
eas build:configure
```

Gere o APK:

```bash
eas build -p android --profile preview
```

Exemplo de `eas.json`:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}
```
