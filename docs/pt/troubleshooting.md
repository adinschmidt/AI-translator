# Solução de problemas

## "URL de terminal de API inválido" nas configurações

Certifique-se de que o endpoint comece com `https://` (ou `http://` para Ollama local)
e é um URL completo. Use **Preencher padrão** para restaurar o valor recomendado.

## Erros 401/403

- Verifique novamente a chave API nas configurações.
- Confirme se a chave está ativa no console do provedor.
- Alguns provedores exigem que o faturamento seja ativado antes que as chaves possam ser usadas.

## Limites de taxa ou erros de cota

Os provedores podem limitar ou bloquear solicitações se você exceder os limites do seu plano.
Tente novamente mais tarde ou atualize seu plano de provedor.

## Modelos Ollama falham ao carregar

- Confirme que Ollama está em execução: `ollama serve`.
- Defina `OLLAMA_ORIGINS="*"` e reinicie para permitir solicitações de extensão.
- Use o terminal padrão `http://localhost:11434`.

## A tradução de página inteira parece quebrada

A tradução de página inteira é experimental. Se um layout de página quebrar, recarregue a guia
para restaurar o conteúdo original e tente traduzir uma seleção menor.

## A extensão não responde

- Recarregue a extensão em `chrome://extensions/` ou `about:debugging`.
- Abra novamente a página **Opções** e verifique se as configurações foram salvas.
