# Política de privacidade para AI Translator

**Última atualização:** 10 de janeiro de 2026

## 1. Visão geral

AI Translator ("nós", "nosso" ou "a extensão") é uma extensão de navegador do lado do cliente
que permite aos usuários traduzir texto usando suas próprias chaves de API de IA. A extensão
opera inteiramente dentro do seu navegador e não transmite dados para nenhum servidor
pertencente ou operado pelo desenvolvedor.

**Este não é um aconselhamento jurídico.** Esta política descreve como a extensão lida com
dados para ajudá-lo a tomar uma decisão informada sobre seu uso.

## 2. Coleta e armazenamento de dados

- **Dados pessoais:** Nós (o desenvolvedor) não coletamos, armazenamos ou temos acesso a
  quaisquer dados pessoais, texto traduzido ou histórico de navegação.
- **Chaves de API:** Suas chaves de API são armazenadas exclusivamente em seu dispositivo usando o
  armazenamento sincronizado do navegador (`browser.storage.sync`). Isso significa que seu
  as configurações são sincronizadas em seus navegadores quando você está conectado, mas nunca são
  transmitido ao desenvolvedor ou a qualquer terceiro que não seja a IA específica
  provedor que você escolher para solicitações de tradução.
- **Sem servidor backend:** Esta extensão não opera um servidor backend. Todos
  o processamento acontece localmente no seu navegador.

## 3. Compartilhamento de dados com terceiros

Para funcionar, esta extensão envia o texto que você seleciona explicitamente para tradução
diretamente do seu navegador para o provedor de IA que você configurou. Usando
esta extensão, você reconhece que seus dados estão sujeitos à privacidade
políticas desses provedores:

| Provedor            | Política de Privacidade                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**          | [https://openai.com/privacy](https://openai.com/privacy)                           |
| **Anthropic**       | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google (Gemini)** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)   |
| **xAI (Grok)**      | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy)             |
| **OpenRouter**      | [https://openrouter.ai/privacy](https://openrouter.ai/privacy)                     |
| **Ollama (Local)**  | Os dados permanecem na sua máquina local; nenhuma transmissão externa.             |

**Considerações importantes:**

- Alguns provedores podem usar seus dados para treinar seus modelos, a menos que você opte por não participar
  (verifique a política de cada fornecedor).
- OpenRouter encaminha solicitações para vários provedores de IA subjacentes, cada um com seu
  próprias políticas de dados.
- Não vendemos, comercializamos ou transferimos de outra forma seus dados para terceiros.

## 4. Políticas da Loja do Navegador

Quando distribuída através de lojas de extensões de navegador, esta extensão segue os
políticas de dados de usuário aplicáveis, incluindo [Chrome Web Store Política de Dados de Usuário](https://developer.chrome.com/docs/webstore/program-policies/) e [Políticas de Complementos do Firefox](https://extensionworkshop.com/documentation/publish/add-on-policies/).

## 5. Explicação das permissões

Esta extensão solicita as seguintes permissões:

| Permissão                         | Finalidade                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `contextMenus`                    | Adiciona a opção "Traduzir" ao menu do botão direito                                                                                           |
| `scripting`                       | Injeta a sobreposição da IU de tradução nas páginas da web                                                                                     |
| `storage`                         | Salva suas chaves e preferências de API localmente                                                                                             |
| `host_permissions` (`<all_urls>`) | Obrigatório para exibir traduções em qualquer página da web que você visitar e para fazer chamadas de API para o provedor de IA de sua escolha |

## 6. Controle do usuário

- **Exclusão:** Você pode remover todos os dados armazenados por esta extensão desinstalando
  a extensão ou limpar os dados de extensão do seu navegador.

- **Desativação:** Nenhum dado é enviado aos provedores de IA, a menos que você acione explicitamente uma
  ação de tradução.
- **Escolha do provedor:** Você controla qual provedor de IA recebe seus dados
  selecionando-o nas configurações da extensão.

## 7. Segurança

- As chaves API são armazenadas no armazenamento seguro do navegador e só são transmitidas
  por HTTPS para os endpoints do provedor de IA.
- A extensão não registra, armazena em cache ou retém qualquer texto traduzido após
  exibindo-o.

## 8. Mudanças nesta política

Poderemos atualizar esta política de privacidade de tempos em tempos. As mudanças serão refletidas
na data da "Última atualização" na parte superior deste documento.

## 9. Contato

Se você tiver dúvidas sobre esta política, abra um problema no
[GitHub repositório](https://github.com/adinschmidt/AI-translator/issues).

---

_Esta extensão é de código aberto. Você pode revisar o código para verificar essas informações de privacidade
reivindicações._
