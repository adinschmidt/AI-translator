# Privacidade

Atualizado em 20 de setembro de 2026.

A extensão não usa servidor de tradução nem serviço analítico do programador. Envia texto selecionado ou regiões da página e instruções diretamente ao endpoint configurado. Fornecedores remotos aplicam as suas políticas; OpenRouter pode encaminhar pedidos. A consulta de modelos também pode enviar a chave sem iniciar traduções.

Chaves e definições usam `chrome.storage.sync`; o navegador pode copiá-las para outros dispositivos. Não é armazenamento exclusivamente local nem um cofre separado. Não há histórico persistente de traduções, mas os resultados permanecem na página, nas janelas e na memória temporária.

Ollama usa `http://localhost:11434` por defeito. Só é local se servidor e modelo não encaminharem pedidos. Endpoints personalizados recebem conteúdo e credenciais. HTTP não cifra o transporte; HTTPS cifra.

A ocultação automática tenta reconhecer emails, telefones, SSN e SIN antes do envio, mas pode falhar. Valores de atributos HTML entre aspas são substituídos por marcadores e restaurados localmente. Registos podem conter chaves, definições, texto original, metadados e traduções mesmo sem depuração. A ocultação nos pedidos não limpa todos os registos.

`contextMenus` adiciona ações; `scripting` injeta scripts; `storage` guarda chaves e preferências. `https://*/*` e `http://*/*` permitem acesso às páginas e aos fornecedores. Os scripts funcionam nos frames compatíveis; a tradução completa começa apenas no principal. ELD deteta idiomas localmente e DOMPurify está incluído.

Pode mudar de fornecedor, apagar chaves ou dados da extensão e parar traduções. A sincronização pode conservar cópias; parar não retira dados já enviados. Consulte a política do fornecedor e remova dados privados antes de abrir uma [incidência](https://github.com/adinschmidt/AI-translator/issues).
