# Politique de confidentialité pour AI Translator

**Dernière mise à jour :** 10 janvier 2026

## 1. Aperçu

AI Translator ("nous", "notre" ou "l'extension") est une extension de navigateur côté client
qui permet aux utilisateurs de traduire du texte à l'aide de leurs propres clés API AI. L'extension
fonctionne entièrement dans votre navigateur et ne transmet aucune donnée à aucun serveur
détenu ou exploité par le développeur.

**Ceci ne constitue pas un avis juridique.** Cette politique décrit comment l'extension gère
données pour vous aider à prendre une décision éclairée quant à son utilisation.

## 2. Collecte et stockage de données

- **Données personnelles :** Nous (le développeur) ne collectons, ne stockons pas et n'avons pas accès à
  toute donnée personnelle, texte traduit ou historique de navigation.
- **Clés API :** Vos clés API sont stockées exclusivement sur votre appareil à l'aide du
  stockage synchronisé du navigateur (`browser.storage.sync`). Cela signifie que votre
  les paramètres sont synchronisés sur vos navigateurs lorsque vous êtes connecté, mais ils ne le sont jamais
  transmis au développeur ou à tout tiers autre que l’IA spécifique
  fournisseur que vous choisissez pour les demandes de traduction.
- **Pas de serveur backend :** Cette extension n'exploite pas de serveur backend. Tout
  le traitement s'effectue localement dans votre navigateur.

## 3. Partage de données avec des tiers

Pour fonctionner, cette extension envoie le texte que vous sélectionnez explicitement pour la traduction
directement depuis votre navigateur vers le fournisseur d'IA que vous avez configuré. En utilisant
cette extension, vous reconnaissez que vos données sont soumises à la politique de confidentialité
politiques de ces fournisseurs :

| Fournisseur          | Politique de confidentialité                                                       |
| -------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**           | [https://openai.com/privacy](https://openai.com/privacy)                           |
| **Anthropic**        | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google (Gemini)** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)   |
| **xAI (Grok)**       | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy)             |
| **OpenRouter**       | [https://openrouter.ai/privacy](https://openrouter.ai/privacy)                     |
| **Ollama (Local)**   | Les données restent sur votre ordinateur local ; pas de transmission externe.      |

**Considérations importantes :**

- Certains fournisseurs peuvent utiliser vos données pour entraîner leurs modèles, sauf si vous vous désinscrivez
  (vérifiez la politique de chaque fournisseur).
- OpenRouter achemine les requêtes vers divers fournisseurs d'IA sous-jacents, chacun avec son
  propres politiques de données.
- Nous ne vendons, n'échangeons ni ne transférons vos données à des tiers.

## 4. Politiques de la boutique du navigateur

Lorsqu'elle est distribuée via les magasins d'extensions de navigateur, cette extension adhère aux
les politiques relatives aux données utilisateur applicables, y compris la [Chrome Web Store Politique relative aux données utilisateur](https://developer.chrome.com/docs/webstore/program-policies/) et les [Politiques des modules complémentaires Firefox](https://extensionworkshop.com/documentation/publish/add-on-policies/).

## 5. Explication des autorisations

Cette extension demande les autorisations suivantes :

| Autorisation                      | Objectif                                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contextMenus`                    | Ajoute l'option « Traduire » à votre menu contextuel                                                                                                     |
| `scripting`                       | Injecte la superposition de l'interface utilisateur de traduction sur les pages Web                                                                      |
| `storage`                         | Enregistre vos clés API et préférences localement                                                                                                        |
| `host_permissions` (`<all_urls>`) | Nécessaire pour afficher les traductions sur n'importe quelle page Web que vous visitez et pour passer des appels API au fournisseur d'IA de votre choix |

## 6. Contrôle utilisateur

- **Suppression :** Vous pouvez supprimer toutes les données stockées par cette extension en désinstallant

l'extension ou en effaçant les données d'extension de votre navigateur.

- **Désinscription :** Aucune donnée n'est envoyée aux fournisseurs d'IA, sauf si vous déclenchez explicitement un
  action de traduction.
- **Choix du fournisseur :** Vous contrôlez quel fournisseur d'IA reçoit vos données par
  en le sélectionnant dans les paramètres de l'extension.

## 7. Sécurité

- Les clés API sont stockées dans le stockage sécurisé du navigateur et sont uniquement transmises
  via HTTPS vers les points de terminaison du fournisseur d'IA.
- L'extension n'enregistre, ne cache ni ne conserve aucun texte traduit après
  l'afficher.

## 8. Modifications de cette politique

Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Les changements seront reflétés
dans la date « Dernière mise à jour » en haut de ce document.

## 9. Contacter

Si vous avez des questions sur cette politique, veuillez ouvrir un problème sur le
[Référentiel GitHub](https://github.com/adinschmidt/AI-translator/issues).

---

_Cette extension est open source. Vous pouvez consulter le code pour vérifier ces informations de confidentialité
réclamations._
