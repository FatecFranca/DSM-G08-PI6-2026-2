# Mensageria: Azure Service Bus na nuvem

**Projeto Interdisciplinar (PI) – 6º Semestre**
**Disciplina-Chave:** Laboratório de Desenvolvimento Multiplataforma (Técnicas de Sistemas Distribuídos; Protocolos de Mensageria para intercomunicação de sistemas)
**Data:** 13/11/2026

---

## 1. Arquitetura de mensageria em produção

O sistema usa **Azure Service Bus** (camada Basic, fila gerenciada) como broker de mensagens, atendendo ao requisito de protocolos de mensageria para intercomunicação de sistemas:

```
Cliente agenda (web/mobile)  →  API publica evento  →  FILA agendou-eventos (Azure Service Bus)  →  Consumidor (API)  →  notificações in-app + push FCM
                                                 nuvem Azure, durável,                                   (peek-lock:
                                                 com retries automáticos                                  complete/abandon)
```

- **Namespace:** `agendou-sb-2026.servicebus.windows.net`
- **Fila:** `agendou-eventos`
- **Política de acesso:** `agendou-api` (permissões Escutar + Enviar, princípio do menor privilégio)
- **Cadeia de conexão:** armazenada somente no `.env` do servidor (`AZURE_SERVICE_BUS_CONNECTION_STRING`) — nunca versionada
- **Modo de recebimento:** peek-lock com complete/abandon — se o processamento de uma mensagem falha, ela volta para a fila e é reentregue (resiliência a falhas)
- **Fallback:** sem a variável de ambiente, o barramento opera em processo (publish/subscribe local), mantendo o sistema funcional — ver [`backend/src/messaging/event-bus.ts`](../backend/src/messaging/event-bus.ts)

## 2. Implementação (código-fonte)

| Papel | Arquivo |
| :--- | :--- |
| Publicação/roteamento | [`backend/src/messaging/event-bus.ts`](../backend/src/messaging/event-bus.ts) |
| Adaptador da Service Bus (SDK `@azure/service-bus` 7.10) | [`backend/src/messaging/service-bus.ts`](../backend/src/messaging/service-bus.ts) |
| Consumidor de notificações | [`backend/src/messaging/notifications.service.ts`](../backend/src/messaging/notifications.service.ts) |
| Endpoints de notificações | [`backend/src/routes/notifications.routes.ts`](../backend/src/routes/notifications.routes.ts) |

Eventos publicados: `agendamento.criado` e `agendamento.atualizado` (produtor em [`backend/src/routes/appointments.routes.ts`](../backend/src/routes/appointments.routes.ts)). O tipo do evento viaja nas `applicationProperties` da mensagem e no corpo (`{tipo, ocorreuEm, dados}`), permitindo roteamento por novos consumidores sem alterar o produtor.

Cobertura de testes: 7 casos do adaptador (produtor, roteamento e consumidor) na suíte Vitest — [`backend/src/__tests__/service-bus.test.ts`](../backend/src/__tests__/service-bus.test.ts), totalizando 37 testes passando.

## 3. Evidência da execução (13/11/2026)

Fluxo executado na VM de produção (`158.23.59.77`, Ubuntu 24.04, Docker Compose):

1. **Consumidor conectado** ao subir a API:
   ```
   [SERVICE BUS] Produtor conectado à fila agendou-eventos.
   [SERVICE BUS] Consumidor conectado à fila agendou-eventos (peek-lock, complete/abandon).
   [NOTIFICACOES] Consumidor Azure Service Bus (fila gerenciada) ativo
   ```
2. **Agendamento criado** via `POST /api/appointments` (cliente Mariana Silva, serviço "Barba Terapia Completa").
3. **Mensagem publicada e consumida** — notificações persistidas no PostgreSQL:
   ```
   id_usuario |        tipo        |          titulo           |                                      corpo
       2      | agendamento.criado | Agendamento confirmado    | Seu horário de "Barba Terapia Completa" com Carlos Barbearia VIP foi registrado.
       1      | agendamento.criado | Novo agendamento recebido | Mariana Silva agendou "Barba Terapia Completa".
   ```
4. **Status do broker** — `GET /api/notifications/status`:
   ```json
   {"mensageria":{"barramento":"azure-service-bus (fila agendou-eventos)","eventos":["agendamento.criado","agendamento.atualizado"],"push":{"provedor":"simulado","chaveConfigurada":false}}}
   ```
5. No portal Azure (namespace `agendou-sb-2026` → fila `agendou-eventos` → Métricas), capturar os gráficos **Mensagens de entrada** e **Mensagens de saída** como evidência visual da troca de mensagens.

## 4. Como reproduzir

```powershell
# no servidor (VM Azure) — a cadeia de conexão fica no .env do projeto
git pull
sudo docker compose up -d --build backend
curl http://localhost:3000/api/notifications/status
```

Em seguida, criar um agendamento pela interface (`http://158.23.59.77:8080`) e conferir a notificação em `GET /api/notifications` (com JWT) e as métricas da fila no portal.

## 5. Push FCM (próximo passo)

O consumidor já despacha push via Firebase Cloud Messaging para dispositivos registrados em `POST /api/notifications/device`. Para ativar, definir `FCM_SERVER_KEY` no `.env` do servidor — ver [`docs/02_modelagem_arquitetura.md`](02_modelagem_arquitetura.md) e o README.
