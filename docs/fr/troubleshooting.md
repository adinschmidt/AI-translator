# Dépannage

## "URL de point de terminaison d'API invalide" dans les paramètres

Assurez-vous que le point de terminaison commence par `https://` (ou `http://` pour le Ollama local)
et est une URL complète. Utilisez **Fill Default** pour restaurer la valeur recommandée.

## Erreurs 401/403

- Vérifiez à nouveau la clé API dans les paramètres.
- Confirmez que la clé est active dans la console du fournisseur.
- Certains fournisseurs exigent que la facturation soit activée avant que les clés puissent être utilisées.

## Limites de débit ou erreurs de quota

Les fournisseurs peuvent limiter ou bloquer les demandes si vous dépassez les limites de votre forfait.
Réessayez plus tard ou mettez à niveau votre forfait fournisseur.

## Les modèles Ollama ne parviennent pas à se charger

- Confirmez que Ollama est en cours d'exécution : `ollama serve`.
- Définissez `OLLAMA_ORIGINS="*"` et redémarrez pour autoriser les demandes d'extension.
- Utilisez le point de terminaison par défaut `http://localhost:11434`.

## La traduction d'une page complète semble cassée

La traduction pleine page est expérimentale. Si une mise en page se casse, rechargez l'onglet
pour restaurer le contenu original et essayer de traduire une sélection plus petite.

## L'extension ne répond pas

- Recharger l'extension en `chrome://extensions/` ou `about:debugging`.
- Rouvrez la page **Options** et assurez-vous que les paramètres sont enregistrés.
