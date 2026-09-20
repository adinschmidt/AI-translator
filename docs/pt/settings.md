# Definições

Clique no ícone da extensão. As alterações são guardadas automaticamente. Escolha entre 12 idiomas da interface ou siga o navegador, independentemente do idioma de tradução. O tema pode ser claro, escuro ou do sistema.

O modo básico oferece OpenAI, Anthropic e Google. O avançado oferece 11 fornecedores e guarda chave, modelo, endpoint e raciocínio por fornecedor. Cada modo mantém o seu idioma de destino, inicialmente inglês, e aceita idiomas personalizados. Guardar no modo básico repõe modelo e endpoint predefinidos do fornecedor.

**Atualizar modelos** consulta o fornecedor; mudar fornecedor, chave ou endpoint também pode carregar a lista. Se falhar, surgem sugestões integradas. Pode filtrar ou escrever um ID. **Preencher predefinição** repõe o campo correspondente.

O botão junto à seleção usa o idioma de destino e as instruções adicionais avançadas, como «Preservar termos técnicos». O menu de contexto e a tradução de páginas usam instruções guardadas do fornecedor. Não aplicam essas instruções adicionais nem seguem sempre o idioma avançado, podendo traduzir para inglês.

No modo avançado, **Override reasoning** oferece `none`, `minimal`, `low`, `medium`, `high` e `xhigh`, inicialmente `low`. Desativado, deixa o fornecedor decidir. O modo básico não aplica a substituição. Modelos podem ignorar ou rejeitar níveis. Mais raciocínio pode aumentar custo e espera. A extensão não fixa um limite de tokens de saída; os limites do fornecedor continuam a aplicar-se.

Os controlos avançados incluem botão de seleção, ativo por defeito; manter várias janelas abertas, desativo; ocultação de dados sensíveis, ativa; e depuração, desativa. A ocultação reconhece alguns emails, telefones, SSN dos EUA e SIN canadianos, mas pode falhar. O texto ocultado mantém-se assim na tradução.

Chaves e definições usam `chrome.storage.sync` e podem sincronizar entre dispositivos. Os registos podem conter chaves e texto mesmo sem depuração. Consulte [Privacidade](/pt/privacy).
