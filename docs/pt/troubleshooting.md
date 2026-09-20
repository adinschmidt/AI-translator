# Resolução de problemas

- Carregue `dist/chrome/` ou `dist/firefox/manifest.json`, não o código-fonte. Firefox exige 142 ou posterior. Recarregue extensão e página após compilar; confirme a gravação das definições.
- Use um URL completo ou reponha o endpoint predefinido. Use HTTPS para serviços remotos. Para 401/403, verifique chave, acesso e faturação.
- Atualize modelos ou introduza um ID disponível. Desative a substituição se o raciocínio causar erros. Para «API returned no translation text», experimente outro modelo ou menos texto. Algumas respostas vazias são repetidas sem streaming.
- Aguarde a reposição da quota ou mude de modelo. Páginas exigem várias chamadas e as repetições têm pausas. **Parar** cancela a execução ativa.
- Inicie Ollama, transfira um modelo com `ollama pull qwen3.5:4b` e use `http://localhost:11434`. Se a origem for recusada, configure `OLLAMA_ORIGINS` e reinicie. `OLLAMA_ORIGINS="*" ollama serve` permite todas as origens.
- Se faltar o botão, confirme a opção e os idiomas. Use-o para o idioma avançado e instruções adicionais. Recarregue páginas parcialmente traduzidas.

A depuração acrescenta detalhes de erros. As consolas podem conter chaves e texto mesmo sem depuração. Remova dados sensíveis antes de partilhar registos.
