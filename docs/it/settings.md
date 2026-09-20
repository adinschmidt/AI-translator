# Impostazioni

Apri le impostazioni dall'icona dell'estensione. Le modifiche si salvano automaticamente. Scegli tra 12 lingue dell'interfaccia o quella del browser, indipendentemente dalla lingua di traduzione, e un tema chiaro, scuro o di sistema.

La modalità base offre OpenAI, Anthropic e Google. Quella avanzata offre 11 fornitori e conserva chiave, modello, endpoint e ragionamento per fornitore. Ogni modalità conserva la propria lingua di destinazione, inizialmente inglese, e accetta lingue personalizzate. Salvare in modalità base ripristina modello ed endpoint predefiniti del fornitore.

**Aggiorna modelli** consulta il fornitore; anche cambiare fornitore, chiave o endpoint può caricare l'elenco. Se fallisce, compaiono suggerimenti integrati. Puoi filtrare o inserire un ID. **Valore predefinito** ripristina il singolo campo.

Il pulsante accanto alla selezione applica lingua di destinazione e istruzioni aggiuntive avanzate, per esempio «Mantieni i termini tecnici». Menu contestuale e traduzione della pagina usano istruzioni salvate del fornitore: non applicano quelle aggiuntive e possono ignorare la lingua avanzata, tornando all'inglese.

In modalità avanzata, **Override reasoning** offre `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, inizialmente `low`. Disattivato lascia decidere il fornitore; la modalità base non applica l'override. I modelli possono ignorare o rifiutare livelli. Più ragionamento può aumentare costo e attesa. L'estensione non impone un limite ai token di uscita; restano i limiti del fornitore.

I controlli avanzati includono il pulsante sulla selezione, attivo; mantenere più finestre aperte, disattivo; oscuramento dati sensibili, attivo; debug, disattivo. L'oscuramento riconosce alcune email, numeri telefonici, SSN statunitensi e SIN canadesi, senza garanzie. Il testo oscurato resta tale nella traduzione.

Chiavi e impostazioni in `chrome.storage.sync` possono sincronizzarsi tra dispositivi. I log possono contenere chiavi e testo anche senza debug. Vedi [Privacy](/it/privacy).
