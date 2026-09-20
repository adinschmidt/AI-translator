# Paramètres

Cliquez sur l'icône de l'extension. Les modifications sont enregistrées automatiquement. La langue de l'interface, parmi 12 langues ou celle du navigateur, est indépendante de la langue cible. Le thème peut être clair, sombre ou suivre le système.

Le mode simple propose OpenAI, Anthropic et Google. Le mode avancé propose 11 fournisseurs et conserve clé, modèle, endpoint et raisonnement par fournisseur. Chaque mode garde sa langue cible, initialement l'anglais, et accepte une langue personnalisée. Enregistrer en mode simple rétablit le modèle et l'endpoint par défaut du fournisseur.

**Actualiser les modèles** interroge le fournisseur, comme certains changements de fournisseur, clé ou endpoint. En cas d'échec, des suggestions intégrées restent disponibles. Filtrez la liste ou saisissez un ID. **Valeur par défaut** rétablit le champ concerné.

## Langue et instructions

Le bouton près de la sélection utilise la langue cible et les instructions supplémentaires du mode avancé, par exemple « Conserver les termes techniques ». Le menu contextuel et la traduction de page utilisent les instructions enregistrées du fournisseur. Ils n'appliquent pas ces instructions supplémentaires et ne suivent pas toujours la langue avancée ; ils peuvent traduire vers l'anglais.

## Raisonnement et comportement

En mode avancé, **Override reasoning** propose `none`, `minimal`, `low`, `medium`, `high` et `xhigh`, avec `low` initialement. Désactivé, il laisse le fournisseur décider. Le mode simple n'applique pas ce réglage. Un modèle peut ignorer ou refuser un niveau. Davantage de raisonnement peut augmenter coût et délai. L'extension ne fixe pas de plafond de tokens de sortie ; les limites du fournisseur restent applicables.

Les contrôles avancés comprennent le bouton de sélection, activé par défaut ; la conservation de plusieurs fenêtres, désactivée ; le masquage des données sensibles, activé ; et le débogage, désactivé. Le masquage reconnaît certains courriels, téléphones, SSN américains et SIN canadiens, sans garantie. Le texte masqué reste masqué dans la traduction.

Les clés et paramètres utilisent `chrome.storage.sync` et peuvent être synchronisés. Les journaux peuvent contenir clés et contenu même sans débogage. Consultez [Confidentialité](/fr/privacy).
