# Agendou! Mobile (Expo)

Aplicativo Android nativo em React Native/Expo, integrado à mesma API e ao mesmo PostgreSQL da aplicação web. A versão de demonstração implementa login, catálogo, consulta de disponibilidade, criação/cancelamento de agendamento e visualização da agenda do prestador.

## Executar com Expo Go

1. Instale o **Expo Go** no celular Android. Para esta demonstração não é necessário Android Studio.
2. Inicie o PostgreSQL e a API no computador. Confirme `http://localhost:3000/health`.
3. Configure o endereço da API antes de iniciar o Expo:

   - **Emulador Android:** copie `.env.example` para `.env` e use `http://10.0.2.2:3000/api`.
   - **Celular físico:** use `http://ENDERECO_IPV4_DO_COMPUTADOR:3000/api`. Para achar o IPv4 no Windows, execute `ipconfig` e use o endereço IPv4 da rede Wi-Fi. O celular e o computador precisam estar na mesma rede.

   Exemplo:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   O `.env` local não deve ser enviado ao GitHub. Se alterar o endereço, reinicie o Expo.
4. No terminal:

   ```powershell
   npm ci
   npx expo start
   ```

5. Escaneie o QR code com o Expo Go. No celular físico, libere o Expo Go e a porta 3000 no Firewall do Windows se o sistema solicitar. Para uma rede que bloqueia conexão local, conecte o computador e o telefone à mesma rede privada ou use o modo Tunnel do Expo para o bundle; a API ainda precisa estar acessível pelo telefone.
6. Entre com `cliente@exemplo.com` / `Agendou2026!`, escolha um serviço e reserve um horário. Esses dados vêm da API local; são apenas contas de demonstração.

### Observações

- O endereço `localhost` no telefone aponta para o próprio telefone, não para o computador.
- A API atual usa HTTP local; não coloque endereço interno nem credenciais em builds públicos. Para produção, publique a API com HTTPS e configure o URL público.
- Para abrir o app Android em emulador com Android Studio instalado, use `npm run android`; para apresentação rápida em aparelho Android, Expo Go é mais simples.
