# Paramètres

Ouvrez le menu d'extension et cliquez sur **Options** pour configurer AI Translator.

## Modes

### Mode de base

- Choisissez un fournisseur (OpenAI, Anthropic ou Google).
- Entrez une clé API.
- Sélectionnez votre langue cible.
- L'extension utilise automatiquement les points de terminaison et les modèles recommandés.

### Mode avancé

- Sélectionnez parmi tous les fournisseurs pris en charge.
- Personnalisez le point de terminaison de l'API, le nom du modèle et les instructions de traduction.
- Idéal pour les configurations auto-hébergées, compatibles OpenAI ou utilisateur expérimenté.

## Instructions de traduction

Utilisez les **Instructions de traduction** pour contrôler le ton et le style. Le texte sélectionné est
ajouté automatiquement. Exemple :

```
Translate to Spanish. Keep the tone friendly and concise.
```

## Point de terminaison et modèle de l'API

Chaque fournisseur dispose d'une option **Fill Default** qui restaure le
point de terminaison et nom du modèle. Vous pouvez remplacer les deux en mode avancé si nécessaire.

## Stockage et confidentialité

Les paramètres sont stockés dans `chrome.storage.sync` afin qu'ils soient conservés sur tous les appareils.
Les clés API ne sont jamais enregistrées dans la console.
