# Confidentialité

Mise à jour le 20 septembre 2026.

L'extension n'utilise aucun serveur de traduction ni service d'analyse du développeur. Elle envoie la sélection ou des régions de page et les instructions directement à l'endpoint configuré. Les fournisseurs distants traitent les données selon leurs politiques ; OpenRouter peut les transmettre à d'autres fournisseurs. La recherche de modèles peut envoyer votre clé sans qu'une traduction soit lancée.

Clés et paramètres utilisent `chrome.storage.sync` et peuvent être copiés sur d'autres appareils par le navigateur. Ce stockage n'est pas exclusivement local ni un coffre-fort distinct. Aucun historique persistant de traduction n'est enregistré, mais les résultats restent dans la page, les fenêtres et la mémoire temporaire.

Ollama utilise par défaut `http://localhost:11434`. Le traitement reste local seulement si serveur et modèle ne transmettent rien ailleurs. Les endpoints personnalisés reçoivent contenu et identifiants. HTTP ne chiffre pas le transport ; HTTPS le chiffre.

Le masquage automatique tente de reconnaître courriels, téléphones, SSN et SIN avant l'envoi, mais peut manquer des informations. Les valeurs d'attributs HTML entre guillemets sont remplacées par des marqueurs puis restaurées localement. Les journaux peuvent contenir clés, paramètres, contenu original, métadonnées et traductions même sans débogage. Le masquage des requêtes ne nettoie pas tous les journaux.

`contextMenus` ajoute les actions ; `scripting` injecte les scripts ; `storage` conserve clés et préférences. Les accès `https://*/*` et `http://*/*` permettent l'action dans les pages et les appels aux fournisseurs. Les scripts fonctionnent dans les cadres compatibles ; la traduction de page démarre uniquement dans le cadre principal. ELD détecte les langues localement ; DOMPurify est inclus.

Vous pouvez changer de fournisseur, supprimer les clés ou données de l'extension et arrêter une traduction. La synchronisation peut conserver des copies ; arrêter ne retire pas les données déjà envoyées. Consultez la politique du fournisseur et retirez toute donnée privée avant de créer un [ticket](https://github.com/adinschmidt/AI-translator/issues).
