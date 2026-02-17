# Configurações

Abra o menu de extensão e clique em **Opções** para configurar AI Translator.

## Modos

### Modo básico

- Escolha um provedor (OpenAI, Anthropic ou Google).
- Insira uma chave API.
- Selecione seu idioma de destino.
- A extensão usa endpoints e modelos recomendados automaticamente.

### Modo avançado

- Selecione entre todos os provedores suportados.
- Personalize o endpoint da API, o nome do modelo e as instruções de tradução.
- Ideal para configurações auto-hospedadas, compatíveis com OpenAI ou de usuários avançados.

## Instruções de tradução

Use **Instruções de tradução** para controlar o tom e o estilo. O texto selecionado é
anexado automaticamente. Exemplo:

```
Translate to Spanish. Keep the tone friendly and concise.
```

## Endpoint e modelo da API

Cada provedor tem uma opção **Preencher padrão** que restaura o valor recomendado
endpoint e nome do modelo. Você pode substituir ambos no modo Avançado, se necessário.

## Armazenamento e privacidade

As configurações são armazenadas em `chrome.storage.sync` para que persistam em todos os dispositivos.
As chaves de API nunca são registradas no console.
