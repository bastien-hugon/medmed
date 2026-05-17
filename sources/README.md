# Sources

Stockage local des documents source qui ancrent le contenu pédagogique. Aucune carte ne doit citer une source qui n'est pas vérifiable ici.

## Structure

Une sous-dir par éditeur / collège, puis par topic :

```
sources/
├── has/
│   ├── hta/
│   │   ├── recommandation-hta-2024.pdf          ← PDF officiel HAS
│   │   ├── fiche-bilan-initial.pdf
│   │   └── arbre-decisionnel-hta.pdf
│   ├── lombalgie/
│   └── ...
├── esc/
│   └── hta/
│       └── esc-guidelines-2024.pdf
├── nice/
│   └── hta/
│       └── ng136.pdf
├── ebmfrance/
│   └── hta/
│       └── hta-guide.md                          ← extraction texte
├── cnge/
│   ├── marguerite-competences.pdf
│   └── familles-situations.pdf
└── pilly/                                         ← infectieux
```

## Téléchargement

- **HAS** : <https://www.has-sante.fr/> — bouton "Télécharger" sur chaque reco
- **ESC** : <https://academic.oup.com/eurheartj/> (open access pour beaucoup)
- **NICE** : <https://www.nice.org.uk/guidance> — version PDF disponible sur chaque page
- **ebmfrance** : <https://www.ebmfrance.net/> (compte gratuit MG)
- **Antibioclic** : <https://antibioclic.com/> (capture des arbres en PDF)

## Pour les pages HTML

Si une source n'est pas PDF, télécharge en texte ou markdown :

```bash
# Exemple : conversion d'une page HAS en markdown via pandoc
curl -sL "https://www.has-sante.fr/jcms/c_XXX/fr/topic" \
  | pandoc -f html -t markdown -o sources/has/topic/page.md
```

## Convention de nommage

- Nom de fichier descriptif et stable (pas de timestamp)
- Inclure la version/année dans le nom : `recommandation-hta-2024.pdf`
- Si mise à jour : remplacer le fichier, MAJ le champ `source.version` dans les cartes

## Git

Les sources peuvent être gitignored ou commitées selon ta préférence et la licence. Par défaut le `.gitignore` du repo les commit (pour traçabilité). Si une source pèse > 10 Mo, retire-la du git et garde juste l'URL dans la carte.

## Workflow d'utilisation

Une fois une source ajoutée :
1. Tu invoques `/medmed-generate` dans Claude Code
2. La skill lit les sources de la sous-dir du topic
3. Génère des cartes en `content/cards/<topic>/pending/`
4. Tu reviews chaque carte
5. `npm run cards:approve <topic>` pour valider toutes les cartes pending
6. `npm run db:seed` pour pousser sur Neon
