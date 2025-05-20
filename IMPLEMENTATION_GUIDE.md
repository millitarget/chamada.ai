# Implementação do Sistema de Chamadas Automatizadas Chamada.ai

Este documento detalha a implementação completa do sistema de chamadas automatizadas do Chamada.ai, abrangendo todos os componentes, suas integrações e guias de implantação.

## 1. Visão Geral da Arquitetura

O sistema é composto por três componentes principais:

1. **Frontend Web (Next.js)** - Interface de usuário para coleta de dados do cliente
2. **Backend API (Flask)** - Serviço para processar solicitações e interagir com o LiveKit 
3. **Agente de Chamadas (LiveKit + OpenAI)** - Sistema que executa as chamadas telefônicas automatizadas

### Fluxo de Comunicação

```
[Usuário] → [Frontend (Next.js)] → [Backend API (Flask)] → [LiveKit Cloud] → [Agente de Chamadas] → [Telefone do Cliente]
```

1. O usuário insere seu número de telefone e seleciona um tipo de agente no site
2. O frontend envia esses dados para o backend API
3. O backend API cria uma sala no LiveKit e despacha um job para o agente
4. O agente recebe o job, inicia uma chamada telefônica para o número fornecido 
5. O agente conduz a conversa usando OpenAI Realtime com a persona apropriada

## 2. Componentes Detalhados

### 2.1. Frontend (Next.js)

O frontend é uma aplicação Next.js com TypeScript que fornece:

- Uma interface para o usuário inserir seu número de telefone
- Seleção do tipo de agente (restaurante, clínica, vendedor)
- Validação de entrada e feedback visual
- Envio de requisições para o backend API

#### Componentes Principais

- `HeroSection.tsx`: Contém o formulário principal com a lógica de captura de dados e envio 
- `VantaBackground.tsx`: Fornece o fundo animado para a página
- Estilização via Tailwind CSS

#### Fluxo de Interação

1. O usuário clica no botão "Receber chamada grátis"
2. Um painel modal é exibido com opções de agente
3. O usuário seleciona um tipo de agente e fornece seu número de telefone
4. Após validação, os dados são enviados para o endpoint `/api/start_call`
5. Feedback é fornecido sobre o sucesso ou falha da solicitação

### 2.2. Backend API (Flask)

O backend é um servidor Flask que funciona como intermediário entre o frontend e o LiveKit:

- Recebe solicitações do frontend
- Valida os dados de entrada
- Cria salas no LiveKit
- Despacha jobs para o agente
- Retorna respostas ao frontend

#### Endpoints

- `/api/start_call` (POST): Inicia o processo de chamada

#### Dependências Principais

- Flask: Framework web
- Flask-CORS: Suporte a requisições cross-origin
- python-dotenv: Gerenciamento de variáveis de ambiente
- aiohttp: Cliente HTTP assíncrono
- livekit-api: SDK para interagir com a API do LiveKit

### 2.3. Agente de Chamadas (LiveKit + OpenAI)

O agente é um aplicativo Python que:

- Conecta-se ao LiveKit como worker
- Recebe jobs para efetuar chamadas
- Utiliza OpenAI Realtime para transcrição e geração de voz
- Implementa diferentes personas para contextos específicos
- Gerencia o ciclo de vida das chamadas

#### Componentes do Agente

- `quitanda_outbound_agent.py`: Entrypoint principal do agente
- `config.py`: Configuração das diferentes personas
- `prompts/`: Diretório contendo prompts para cada tipo de agente
  - `common_prompts.py`: Prompts genéricos reutilizáveis
  - `clinic_prompts.py`: Prompts específicos para clínicas
  - `sales_prompts.py`: Prompts específicos para vendas
- `tools/`: Ferramentas disponíveis para os agentes

#### Ferramentas do Agente

O agente possui ferramentas para:

- Transferir a chamada para um humano
- Buscar informações (em implementações mais avançadas)
- Encerrar a chamada

## 3. Configuração e Instalação

### 3.1. Requisitos de Sistema

- Python 3.9+ 
- Node.js 16+ 
- Contas ativas:
  - LiveKit (API Key e Secret)
  - OpenAI (chave API)
  - SIP Trunk para chamadas de saída

### 3.2. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# Configuração LiveKit
LIVEKIT_URL=https://yourproject.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Configuração OpenAI
OPENAI_API_KEY=your_openai_key

# Configuração SIP
SIP_TRUNK_ID=your_sip_trunk_id
TRANSFER_PHONE_NUMBER=+351xxxxxxxxx  # Número para transferências

# Configuração da aplicação
NODE_ENV=development
```

### 3.3. Instalação de Dependências

**Backend (Python)**:
```bash
pip install flask flask-cors python-dotenv aiohttp
pip install livekit livekit-api livekit-agents livekit-plugins-openai livekit-plugins-deepgram livekit-protocol
```

**Frontend (Next.js)**:
```bash
npm install
```

## 4. Execução do Sistema

### 4.1. Ambiente de Desenvolvimento

**Iniciar o Backend Flask**:
```bash
python website_backend.py
```
Isto iniciará o servidor Flask na porta 5001.

**Iniciar o Frontend Next.js**:
```bash
npm run dev
```
Isto iniciará o servidor Next.js na porta 3000 (ou 3001 se 3000 estiver em uso).

**Iniciar o Agente**:
```bash
python quitanda_outbound_agent.py dev
```
Isto registrará o agente no LiveKit para receber solicitações de chamada.

### 4.2. Implantação em Produção

**Backend Flask**:
- Use Gunicorn ou uWSGI como servidor WSGI
- Hospede atrás de um proxy como Nginx
- Configure HTTPS
- Exemplo de comando: `gunicorn -w 4 -b 0.0.0.0:5001 website_backend:app`

**Frontend Next.js**:
- Compile para produção: `npm run build`
- Inicie o servidor: `npm start`
- Ou utilize serviços como Vercel ou Netlify para hospedagem automática

**Agente**:
- Execute em um servidor dedicado com bom acesso à internet
- Use systemd ou supervisor para gerenciar o processo
- Configure reinício automático
- Exemplo de arquivo systemd:

```ini
[Unit]
Description=Chamada.ai Outbound Agent
After=network.target

[Service]
User=chamadaai
WorkingDirectory=/path/to/chamada.ai
ExecStart=/path/to/python /path/to/quitanda_outbound_agent.py prod
Restart=always
RestartSec=5
Environment=PATH=/path/to/venv/bin:/usr/bin:/bin
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

## 5. Detalhes de Implementação

### 5.1. Integração Frontend-Backend

O frontend comunica-se com o backend através do endpoint `/api/start_call` enviando um payload JSON:

```json
{
  "phone_number": "+351912345678",
  "persona": "restaurante",
  "customer_name": "Nome do Cliente"
}
```

A implementação está no método `handleSubmitCallRequest()` em `HeroSection.tsx`.

### 5.2. Integração Backend-LiveKit

O backend utiliza o SDK da LiveKit para criar salas e despachar jobs:

1. **Criação de Sala**:
   - Utiliza `room_service.RoomService` para criar uma sala única
   - Nomeia a sala com um padrão: `call_{persona}_{uuid}`

2. **Despacho de Job**:
   - Utiliza `agent_dispatch_service.AgentDispatchService` para criar um dispatch
   - Envia metadados como JSON contendo número de telefone, persona e nome do cliente

### 5.3. Implementação do Agente

O agente é implementado como um worker LiveKit que:

1. Registra-se no LiveKit para receber jobs
2. Quando recebe um job, analisa os metadados
3. Carrega a configuração apropriada para a persona solicitada
4. Configura o modelo OpenAI Realtime com as instruções apropriadas
5. Inicia uma chamada SIP para o número de telefone do cliente
6. Envia uma saudação inicial
7. Gerencia a conversa utilizando a IA

### 5.4. Configuração de Personas

As personas são configuradas em `config.py` e incluem:

- Construtores de prompt do sistema
- Construtores de saudação
- Configuração de voz
- Ferramentas disponíveis
- Temperatura do modelo

Cada persona tem seus próprios prompts específicos ou utiliza os prompts comuns conforme necessário.

## 6. Resolução de Problemas

### 6.1. Problemas Comuns do Frontend

- **Erro ao conectar ao backend**: Verifique se o backend está em execução e se a URL está correta
- **CORS errors**: Verifique se o CORS está configurado corretamente no backend
- **Problemas de validação**: Ajuste as expressões regulares para validação de telefone conforme necessário

### 6.2. Problemas Comuns do Backend

- **Erro de inicialização**: Verifique se todas as variáveis de ambiente estão configuradas
- **Erro ao criar sala LiveKit**: Verifique as credenciais LiveKit e a URL
- **Erro ao despachar job**: Verifique a integração com o SDK do LiveKit e os formatos de request

### 6.3. Problemas Comuns do Agente

- **Erro de importação de módulos**: Verifique se todos os arquivos de prompt estão presentes e referenciados corretamente
- **Erro ao iniciar chamada SIP**: Verifique se o SIP_TRUNK_ID está configurado e se o número de telefone está formatado corretamente
- **Erro na integração OpenAI**: Verifique a chave API da OpenAI e as configurações do modelo

### 6.4. Solução para o Erro "TwirpError object has no attribute 'meta'"

No bloco try/except para criação de chamadas SIP, é necessário verificar se o atributo `meta` existe antes de acessá-lo:

```python
try:
    # Código para iniciar a chamada SIP
except api.TwirpError as e:
    log.error(f"Failed to initiate outbound SIP call (TwirpError): code={e.code}, message='{e.message}'")
    if hasattr(e, 'meta') and e.meta:
        sip_status_code = e.meta.get('sip_status_code')
        sip_error_details = e.meta.get('error_details')
        if sip_status_code: log.error(f"SIP Status Code: {sip_status_code}")
        if sip_error_details: log.error(f"SIP Error Details: {sip_error_details}")
```

## 7. Extensões e Melhorias Futuras

### 7.1. Adição de Novas Personas

Para adicionar uma nova persona:

1. Crie um arquivo de prompts em `prompts/`
2. Adicione funções para construir prompts e saudações
3. Adicione a persona a `PERSONAE` em `config.py`

### 7.2. Integração com CRM

O sistema pode ser estendido para:

- Registrar chamadas em um CRM
- Buscar informações de clientes existentes
- Atualizar registros após chamadas

### 7.3. Melhorias na Análise de Chamadas

Possíveis melhorias incluem:

- Gravação e transcrição de chamadas
- Análise de sentimento
- Extração de informações-chave
- Dashboard para visualização de métricas

### 7.4. Expansão do Sistema de Filas

Implementar um sistema de filas para:

- Gerenciar picos de demanda
- Implementar callbacks
- Priorizar chamadas importantes

## 8. Considerações de Segurança

### 8.1. Proteção de Dados

- Todos os números de telefone e informações do cliente devem ser tratados como dados sensíveis
- Implemente criptografia em repouso e em trânsito
- Não armazene dados do cliente além do necessário
- Implemente políticas de retenção de dados

### 8.2. Controle de Acesso

- Utilize autenticação e autorização no backend
- Proteja as chaves de API com variáveis de ambiente
- Implemente limites de taxa para evitar abusos
- Registre todas as solicitações de chamada para auditoria

## 9. Conclusão

Esta implementação fornece um sistema completo de chamadas automatizadas de saída que utiliza IA avançada para conduzir conversas naturais. O sistema é escalável, extensível e pode ser facilmente adaptado para diferentes casos de uso comerciais.

A arquitetura modular permite adicionar novas personas ou funcionalidades com facilidade. A integração com o LiveKit oferece uma plataforma robusta para comunicação em tempo real, enquanto o OpenAI Realtime proporciona conversas naturais e fluidas. 