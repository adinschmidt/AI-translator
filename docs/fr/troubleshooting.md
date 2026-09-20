# Dépannage

- Chargez `dist/chrome/` ou `dist/firefox/manifest.json`, pas les sources. Firefox exige la version 142 ou ultérieure. Rechargez l'extension et la page après compilation ; vérifiez la confirmation d'enregistrement.
- Pour une erreur d'endpoint, utilisez une URL complète ou rétablissez la valeur par défaut. Préférez HTTPS pour les services distants. Pour 401/403, vérifiez clé, accès et facturation.
- Actualisez les modèles ou saisissez un ID accessible à votre compte. Si le raisonnement échoue, désactivez son remplacement. Pour « API returned no translation text », essayez un autre modèle ou moins de texte. Certaines réponses vides sont réessayées sans streaming.
- En cas de quota, attendez ou changez de modèle. Une page nécessite plusieurs requêtes ; les nouvelles tentatives sont espacées. **Arrêter** annule le traitement actif.
- Pour Ollama, démarrez le serveur, téléchargez un modèle avec `ollama pull qwen3.5:4b` et utilisez `http://localhost:11434`. Si l'origine est refusée, configurez `OLLAMA_ORIGINS` et redémarrez. `OLLAMA_ORIGINS="*" ollama serve` autorise toutes les origines.
- Si le bouton manque, vérifiez son activation et les langues. Utilisez le bouton près de la sélection pour la langue avancée et les instructions supplémentaires. Rechargez une page partiellement traduite.

Le débogage ajoute des détails aux erreurs. Les consoles de la page et de l'extension peuvent contenir clés et contenu même sans débogage. Supprimez les données sensibles avant de partager les journaux.
