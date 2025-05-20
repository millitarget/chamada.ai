# chamada.ai Website (Frontend Only)

Website para a startup chamada.ai — um assistente telefónico por inteligência artificial.

## Descrição

chamada.ai é um serviço de atendimento telefónico automatizado através de inteligência artificial que atende, responde e marca compromissos como um humano real. Esta é uma versão apenas frontend para demonstração da interface.

## Tecnologias

- **Framework**: Next.js
- **Estilo**: Tailwind CSS
- **Animações**: Framer Motion
- **Componentes**: React

## Funcionalidades

- Design responsivo (mobile-first)
- Animações de scroll e hover
- Tema escuro com acentos em azul neon
- Formulário de contato (demo - sem funcionalidade de backend)

## Estrutura do Projeto

- `/src/app`: Páginas e layout da aplicação Next.js
- `/src/components`: Componentes React
- `/public`: Imagens e arquivos estáticos

## Como Iniciar

Primeiro, instale as dependências:

```bash
npm install
```

Em seguida, execute o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## Desenvolvimento

O site foi desenvolvido seguindo as seguintes diretrizes:

- Estilo visual inspirado no Linear.app
- Uso de tipografia moderna e clean
- Foco em conversão de visitantes em usuários
- Apresentação do produto como inovador e acessível

## Nota

Esta é uma versão apenas frontend do website chamada.ai. Todas as funcionalidades de chamadas e interações com API foram removidas. O formulário de contacto simula o envio, mas não faz nenhuma chamada de API real.

## Multi-Persona Outbound Agent

This project now includes a flexible outbound calling agent that can adapt to different personas based on user selection:

### Key Features

- Adapts to different personas (dentist/clinic, sales, etc.)
- Uses persona-specific prompts and greetings
- Initiates outbound calls via SIP
- Uses LiveKit for real-time audio communication

### Available Personas

- **Clinic/Dentist**: For dental appointments and clinic-related interactions
- **Sales**: For sales and product demonstration calls
- **Default**: A generic assistant that works with any unspecified persona

### How to Run

1. Start the outbound agent worker:
   ```
   python outbound_agent.py dev
   ```

2. Start the website backend:
   ```
   python website_backend.py
   ```

3. Make a call request with your desired persona:
   ```
   curl -X POST http://localhost:5001/api/start_call -H "Content-Type: application/json" -d "{\"phone_number\": \"+351XXXXXXXXX\", \"persona\": \"clinica\", \"customer_name\": \"Customer Name\"}"
   ```

The agent will adapt its behavior and conversation style based on the selected persona. 