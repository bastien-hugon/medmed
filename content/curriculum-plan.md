# medmed — Plan de curriculum C1 + C2 (10 motifs)

> Plan séquentiel pour peupler les couches **C1 (Fondations zéro-prérequis)** et **C2 (Mécanismes + clinique de base)** des motifs majeurs de médecine générale française.
> Volume cible : ~180-220 cartes au total.
>
> **Couches** :
> - **C1** = zéro prérequis médical (le lecteur ne sait pas ce qu'est une artère). Difficulty 1.
> - **C2** = suppose C1 du même topic maîtrisée. Mécanismes physiopathologiques + clinique de base. Difficulty 2.
>
> **Convention** : noms de topic en kebab-case → matche `content/cards/<topic>/pending/`.

---

## 1. `hta` — Hypertension artérielle (C1 renforcement + C2 nouveau)

- **Items EDN** : 224
- **État C1 actuel** : 15 cartes (cœur pompe, artères/veines, PA, mmHg, systolique/diastolique, mesure, seuil 140/90)
- **C1 — renforcement (~6-8 cartes nouvelles)** :
  - Lesson : Comment se prend une PA en pratique (tensiomètre, manchette à hauteur de cœur)
  - Lesson : Tensiomètre manuel vs électronique au bras (et pourquoi pas au poignet)
  - Lesson : Préparation à la mesure (5 min de calme, vessie vide, pas de tabac/café 30 min avant)
  - Lesson : Pourquoi 2 mesures espacées d'1 minute à chaque consultation
  - Lesson : L'HTA est silencieuse — pas (ou peu) de symptômes typiques au début
  - Lesson : Variations normales de la PA (jour/nuit, effort, stress, position)
  - QCM : Reconnaître une mesure correcte vs incorrecte
  - Cloze : durée de repos pré-mesure (5 min)

- **C2 à générer (~10-12 cartes)** :
  - Lesson : Débit cardiaque × Résistances vasculaires = PA (mécanique des fluides appliquée)
  - Lesson : Système rénine-angiotensine-aldostérone (SRAA) — vasoconstriction + rétention sodée
  - Lesson : MAPA / automesure — seuils différents (135/85)
  - Lesson : Effet blouse blanche et HTA masquée
  - Lesson : Bilan initial OMS de l'HTA (ionogramme, créatinine, glycémie, EAL, ECG, BU)
  - Lesson : Les 4 grandes classes (IEC/ARA2, diurétiques thiazidiques, inhibiteurs calciques, bêta-bloquants)
  - Lesson : RHD non médicamenteuses (sel < 6 g/j, activité physique, alcool, poids)
  - Lesson : Complications cibles (cerveau, cœur, reins, yeux)
  - QCM : Identifier l'organe cible touché à partir d'une présentation
  - QCM : Reconnaître une indication MAPA
  - QCM : Choisir le bilan de 1ère intention
  - Cloze : seuils MAPA / automesure

- **Sources canoniques à fetch** :
  - HAS — Prise en charge HTA adulte 2016 maj 2024 : `https://www.has-sante.fr/jcms/c_2059286/fr/prise-en-charge-de-l-hypertension-arterielle-de-l-adulte`
  - SFHTA — Recommandations : `https://www.sfhta.eu/recommandations/`
  - ESC/ESH 2024 — Guidelines for managing elevated BP and hypertension : `https://academic.oup.com/eurheartj/article/45/38/3912/7741010`

---

## 2. `diabete-t2` — Diabète type 2 (C1 + C2)

- **Items EDN** : 247
- **C1 (~10 cartes)** :
  - Lesson : Le sucre dans le sang — d'où il vient, à quoi il sert (carburant des cellules)
  - Lesson : L'insuline — la "clé" qui fait entrer le sucre dans les cellules
  - Lesson : Glycémie à jeun vs glycémie post-prandiale
  - Lesson : Qu'est-ce que l'HbA1c ? (mémoire du sucre sur 3 mois)
  - Lesson : Seuils diagnostiques diabète (à jeun ≥ 1,26 g/L × 2, HbA1c ≥ 6,5%, glycémie aléatoire ≥ 2 g/L + symptômes)
  - Lesson : Les 3 symptômes cardinaux (polyurie, polydipsie, amaigrissement)
  - Lesson : Différence type 1 vs type 2
  - Lesson : Pourquoi le diabète "abîme" les vaisseaux
  - QCM : Reconnaître les valeurs seuils
  - Cloze : valeurs diagnostiques (1,26 g/L, 6,5%, 2 g/L)

- **C2 (~10-12 cartes)** :
  - Lesson : Insulinorésistance (mécanisme — récepteur saturé / désensibilisé)
  - Lesson : Complications microvasculaires (rétinopathie, néphropathie, neuropathie)
  - Lesson : Complications macrovasculaires (coronaropathie, AOMI, AVC)
  - Lesson : Dépistage du diabète T2 — qui ? quand ? comment ?
  - Lesson : Metformine — 1ère ligne, mécanisme (foie), effets indésirables
  - Lesson : GLP-1 RA et SGLT2-inh — nouveautés avec bénéfice CV/rénal
  - Lesson : Insuline — quand l'introduire en T2
  - Lesson : Bilan annuel du diabétique (fond d'œil, microalbuminurie, pieds, ECG)
  - QCM : Choisir le 1er traitement après échec RHD
  - QCM : Reconnaître complication débutante
  - Cloze : cibles HbA1c selon profil

- **Sources canoniques** :
  - HAS 2024 — Stratégie médicamenteuse contrôle glycémique DT2 : `https://www.has-sante.fr/jcms/p_3401645/fr/diabete-de-type-2-de-l-adulte-actualisation-de-la-strategie-medicamenteuse-du-controle-glycemique`
  - HAS — Guide parcours de soins DT2 : `https://www.has-sante.fr/jcms/c_1735060/fr/guide-parcours-de-soins-diabete-de-type-2-de-l-adulte`
  - SFD — Référentiels : `https://www.sfdiabete.org/recommandations`

---

## 3. `dyslipidemie` — Dyslipidémie & risque CV global / SCORE2 (C1 + C2)

- **Items EDN** : 222
- **C1 (~10 cartes)** :
  - Lesson : Qu'est-ce que le cholestérol (graisse indispensable, transportée dans le sang)
  - Lesson : LDL "mauvais" vs HDL "bon" — la métaphore camion dépose / camion ramasse
  - Lesson : Les triglycérides
  - Lesson : L'athérosclérose — la plaque qui se forme dans les artères
  - Lesson : Pourquoi la plaque est dangereuse (rupture → caillot → infarctus/AVC)
  - Lesson : L'EAL (Exploration d'une Anomalie Lipidique) — bilan à jeun
  - Lesson : Facteurs de risque CV — liste de base (âge, sexe, tabac, HTA, diabète, antécédents familiaux)
  - QCM : Distinguer LDL et HDL et leur rôle
  - QCM : Reconnaître les composants de l'EAL
  - Cloze : valeurs souhaitables initiales

- **C2 (~10-12 cartes)** :
  - Lesson : SCORE2 — outil ESC de risque CV à 10 ans (40-69 ans)
  - Lesson : SCORE2-OP — version sujets ≥ 70 ans
  - Lesson : Niveaux de risque (faible, modéré, élevé, très élevé)
  - Lesson : Cibles LDL selon le risque (très élevé < 0,55 g/L ; élevé < 0,70 ; modéré < 1,0)
  - Lesson : Statines — mécanisme (inhibition HMG-CoA réductase), classes
  - Lesson : Effets indésirables des statines (myalgies, hépatique) et suivi
  - Lesson : Ezétimibe et inhibiteurs PCSK9 — quand y penser
  - Lesson : Prévention primaire vs secondaire
  - QCM : Calculer un SCORE2 simple
  - QCM : Choisir la cible LDL d'un patient donné
  - Cloze : cibles LDL (mg/dL et g/L)

- **Sources canoniques** :
  - HAS 2017 — Principales dyslipidémies, stratégies PEC : `https://www.has-sante.fr/jcms/c_2851086/fr/principales-dyslipidemies-strategies-de-prise-en-charge`
  - ESC/EAS 2019 — Dyslipidaemias guidelines : `https://academic.oup.com/eurheartj/article/41/1/111/5556353`
  - ESC SCORE2 (2021) : `https://academic.oup.com/eurheartj/article/42/25/2439/6297709`

---

## 4. `lombalgie` — Lombalgie commune (C1 + C2)

- **Items EDN** : 93
- **C1 (~10 cartes)** :
  - Lesson : Anatomie de la colonne — vertèbres, disques, ligaments
  - Lesson : Le disque intervertébral — son rôle d'amortisseur
  - Lesson : Les muscles paravertébraux
  - Lesson : Innervation — racines nerveuses qui sortent à chaque étage
  - Lesson : Lombalgie aiguë / subaiguë / chronique — définition par durée
  - Lesson : Douleur mécanique vs inflammatoire (réveil nocturne, raideur matinale)
  - Lesson : Lombalgie "commune" — pas de cause grave identifiée (≥ 90% des cas)
  - QCM : Reconnaître les structures anatomiques
  - QCM : Classer une douleur (méca vs inflam)
  - Cloze : durées (< 4 sem, 4-12 sem, > 12 sem)

- **C2 (~10-12 cartes)** :
  - Lesson : Les drapeaux rouges (red flags)
  - Lesson : Drapeau rouge 1 — Fracture
  - Lesson : Drapeau rouge 2 — Infection
  - Lesson : Drapeau rouge 3 — Tumeur
  - Lesson : Drapeau rouge 4 — Syndrome de la queue de cheval
  - Lesson : Drapeaux jaunes (psychosociaux) — facteurs de chronicisation
  - Lesson : Examen clinique de base (Lasègue, ROT, force, sensibilité)
  - Lesson : Indications d'imagerie — pas avant 4-6 semaines sauf red flag
  - Lesson : PEC de la lombalgie aiguë non compliquée (mouvement, antalgiques, pas de repos)
  - QCM : Identifier un drapeau rouge dans une vignette
  - QCM : Indication d'imagerie ou non
  - SCT : nouvelle info clinique → renforce/affaiblit "lombalgie commune"

- **Sources canoniques** :
  - HAS 2019 — Prise en charge du patient présentant une lombalgie commune : `https://www.has-sante.fr/jcms/c_2961499/fr/prise-en-charge-du-patient-presentant-une-lombalgie-commune`
  - NICE NG59 — Low back pain and sciatica in over 16s : `https://www.nice.org.uk/guidance/ng59`

---

## 5. `cephalee` — Céphalées primaires + drapeaux rouges (C1 + C2)

- **Items EDN** : 100
- **C1 (~10 cartes)** :
  - Lesson : Pourquoi on a mal à la tête — où sont les capteurs de douleur (méninges, vaisseaux, muscles)
  - Lesson : Le cerveau lui-même n'a pas de récepteurs de douleur
  - Lesson : Céphalée primaire vs secondaire
  - Lesson : Les 3 grandes céphalées primaires (migraine, céphalée de tension, AVF)
  - Lesson : Caractéristiques d'une migraine (unilatérale, pulsatile, modérée à sévère, photophobie, nausée)
  - Lesson : Caractéristiques d'une céphalée de tension (bilatérale, pression, légère à modérée)
  - Lesson : L'aura migraineuse — phénomène neurologique réversible (visuel ++)
  - QCM : Distinguer migraine et céphalée de tension
  - QCM : Reconnaître une aura
  - Cloze : durée migraine sans traitement (4-72 h)

- **C2 (~10-12 cartes)** :
  - Lesson : Critères ICHD-3 d'une migraine sans aura
  - Lesson : Algie vasculaire de la face — clinique typique, sex-ratio, périodicité
  - Lesson : Red flags SNOOP10 — quand suspecter une céphalée secondaire
  - Lesson : Drapeau rouge — céphalée brutale "en coup de tonnerre" (HSA)
  - Lesson : Drapeau rouge — céphalée + fièvre + raideur de nuque (méningite)
  - Lesson : Drapeau rouge — céphalée + déficit neurologique persistant
  - Lesson : Drapeau rouge — céphalée du sujet > 50 ans nouvelle (Horton)
  - Lesson : Traitement de crise migraineuse (AINS, triptans)
  - Lesson : Traitement de fond — indications, classes
  - Lesson : Indication d'imagerie cérébrale en urgence
  - QCM : Identifier un drapeau rouge
  - QCM : Choisir un traitement de crise
  - SCT : nouvelle info clinique → renforce/affaiblit "migraine"

- **Sources canoniques** :
  - HAS 2021 — Migraine de l'adulte et enfant : `https://www.has-sante.fr/jcms/c_272212/fr/prise-en-charge-diagnostique-et-therapeutique-de-la-migraine-chez-l-adulte-et-chez-l-enfant`
  - SFEMC — Recommandations migraine : `https://sfemc.fr/`
  - NICE CG150 — Headaches in over 12s : `https://www.nice.org.uk/guidance/cg150`
  - ICHD-3 (Classification internationale) : `https://ichd-3.org/`

---

## 6. `depression` — Épisode dépressif caractérisé (C1 + C2)

- **Items EDN** : 64bis, 80
- **C1 (~9-10 cartes)** :
  - Lesson : Tristesse normale vs dépression — durée, retentissement, intensité
  - Lesson : Les 2 symptômes "cœur" de la dépression (humeur triste, anhédonie)
  - Lesson : Les autres symptômes (sommeil, appétit, énergie, concentration, culpabilité, idées noires)
  - Lesson : Critère temporel d'un épisode dépressif caractérisé (≥ 2 semaines, presque tous les jours)
  - Lesson : Idées suicidaires — toujours les explorer, jamais "donner l'idée"
  - Lesson : Dépression ≠ "déprime passagère" — c'est une maladie traitable
  - Lesson : Retentissement (familial, pro, fonctionnel) — un critère diagnostique
  - QCM : Identifier les 2 symptômes "cœur"
  - QCM : Distinguer tristesse réactionnelle / EDC
  - Cloze : durée minimale EDC (2 semaines)

- **C2 (~10-12 cartes)** :
  - Lesson : Critères DSM-5 EDM — ≥ 5 symptômes sur 9, dont ≥ 1 majeur, ≥ 2 semaines
  - Lesson : PHQ-9 — questionnaire d'auto-évaluation, structure
  - Lesson : Seuils PHQ-9 (5/10/15/20) → léger/modéré/modérément sévère/sévère
  - Lesson : Sévérité d'un EDC — léger / modéré / sévère (impacte la PEC)
  - Lesson : 1ère ligne : sévérité légère = psychothérapie ; modéré-sévère = ISRS + psychothérapie
  - Lesson : ISRS — mécanisme (inhibition recapture sérotonine), classes
  - Lesson : Délai d'efficacité ISRS (4-6 semaines), effets indésirables initiaux
  - Lesson : Durée du traitement (≥ 6 mois après rémission)
  - Lesson : Quand orienter au psychiatre (sévérité, idées suicidaires, échec)
  - Lesson : Risque suicidaire — facteurs (RUD), questionnement, conduite à tenir
  - QCM : Score PHQ-9 → catégorie de sévérité
  - QCM : Choisir première ligne thérapeutique
  - SCT : nouvelle info → renforce/affaiblit "EDC"

- **Sources canoniques** :
  - HAS 2017 — Épisode dépressif caractérisé adulte, soins de 1er recours : `https://www.has-sante.fr/jcms/c_1739917/fr/episode-depressif-caracterise-de-l-adulte-prise-en-charge-en-soins-de-premier-recours`
  - NICE NG222 — Depression in adults : `https://www.nice.org.uk/guidance/ng222`

---

## 7. `anxiete` — Anxiété généralisée + attaques de panique (C1 + C2)

- **Items EDN** : 64
- **C1 (~9-10 cartes)** :
  - Lesson : L'anxiété normale — émotion utile face à un danger
  - Lesson : L'anxiété pathologique — disproportionnée, envahissante, persistante
  - Lesson : Les symptômes physiques de l'anxiété (tachycardie, sueurs, oppression thoracique)
  - Lesson : Pourquoi le corps réagit ainsi (système sympathique, "fight or flight")
  - Lesson : Le trouble anxieux généralisé (TAG) — soucis excessifs, multiples objets
  - Lesson : L'attaque de panique — crise brève, intense, sensation de mort imminente
  - Lesson : Les autres troubles anxieux (phobies spécifiques, sociale, TOC, ESPT) — vue d'ensemble
  - QCM : Distinguer anxiété normale / pathologique
  - QCM : Reconnaître une attaque de panique
  - Cloze : durée TAG (≥ 6 mois)

- **C2 (~10-12 cartes)** :
  - Lesson : Critères DSM-5 TAG — soucis excessifs ≥ 6 mois, multiples sujets, ≥ 3 symptômes sur 6
  - Lesson : GAD-7 — questionnaire validé, structure
  - Lesson : Seuils GAD-7 (5/10/15) → minime/modéré/sévère
  - Lesson : Sévérité TAG — léger / modéré / sévère (impacte PEC)
  - Lesson : 1ère ligne : TCC (thérapie cognitivo-comportementale)
  - Lesson : ISRS / ISRSN dans le TAG — quand, lesquels
  - Lesson : Place très limitée des benzodiazépines (court terme, < 12 sem)
  - Lesson : Pourquoi ne pas prescrire des BZD au long cours (dépendance, chutes, troubles cognitifs)
  - Lesson : Trouble panique — PEC spécifique
  - Lesson : Quand orienter au psychiatre / psychologue
  - QCM : Score GAD-7 → catégorie de sévérité
  - QCM : Choisir première ligne thérapeutique TAG
  - SCT : nouvelle info → renforce/affaiblit "TAG"

- **Sources canoniques** :
  - HAS 2007 maj — Troubles anxieux graves : `https://www.has-sante.fr/jcms/c_2722490/fr/troubles-anxieux-graves-fiches-bonnes-pratiques`
  - NICE CG113 — Generalised anxiety disorder & panic disorder : `https://www.nice.org.uk/guidance/cg113`

---

## 8. `asthenie` — Asthénie chronique (C1 + C2)

- **Items EDN** : 246
- **C1 (~8-10 cartes)** :
  - Lesson : Qu'est-ce que la fatigue — symptôme subjectif universel
  - Lesson : Fatigue physiologique (effort, dette de sommeil) vs pathologique
  - Lesson : Asthénie aiguë (< 1 mois) vs prolongée (1-6 mois) vs chronique (> 6 mois)
  - Lesson : Les 3 grandes "boîtes" étiologiques (organique, psychique, fonctionnelle)
  - Lesson : Différence asthénie / somnolence / dyspnée d'effort (les patients confondent)
  - Lesson : L'interrogatoire d'abord — c'est presque tout le diagnostic
  - QCM : Classer une présentation
  - QCM : Distinguer asthénie / somnolence
  - Cloze : durée chronicité (> 6 mois)

- **C2 (~10-12 cartes)** :
  - Lesson : Causes organiques fréquentes en MG (anémie, hypothyroïdie, diabète, infection, néoplasie)
  - Lesson : Causes psy fréquentes (dépression, anxiété, troubles du sommeil)
  - Lesson : Causes fonctionnelles (syndrome de fatigue chronique, fibromyalgie)
  - Lesson : Bilan biologique de 1ère intention (NFS, ferritine, CRP, TSH, glycémie, créat, iono, EAL)
  - Lesson : Red flags asthénie (AEG, fièvre, signes B, syndrome inflammatoire)
  - Lesson : Place du PHQ-9 / GAD-7 dans le bilan
  - Lesson : Évaluation du sommeil (durée, qualité, ronflement → SAOS)
  - Lesson : Quand pousser le bilan (selon orientation clinique)
  - QCM : Choisir le bilan de 1ère intention
  - QCM : Identifier un red flag
  - SCT : nouvelle info → oriente vers organique / psy / fonctionnel

- **Sources canoniques** :
  - HAS 2014 — La fatigue de l'adulte : `https://www.has-sante.fr/jcms/c_1623732/fr/fatigue-de-l-adulte`
  - LiSA — Item 246 Asthénie : `https://livret.uness.fr/lisa/2025/Item_246`
  - ebmfrance — Fiche asthénie

---

## 9. `ist` — Infections sexuellement transmissibles (C1 + C2)

- **Items EDN** : 162
- **C1 (~9-10 cartes)** :
  - Lesson : Qu'est-ce qu'une IST — agent infectieux transmis par contact sexuel
  - Lesson : IST asymptomatiques fréquentes — pourquoi le dépistage est essentiel
  - Lesson : Les 4 IST "à connaître" en MG (chlamydia, gonocoque, syphilis, VIH)
  - Lesson : Hépatite B / C — IST aussi, transmissibles par voie sexuelle
  - Lesson : Le préservatif — seul moyen de prévention combinée IST
  - Lesson : Le dépistage = prélèvement (sang / urines / prélèvements muqueux)
  - Lesson : Notion de fenêtre sérologique (délai infection → test positif)
  - QCM : Reconnaître une situation à dépister
  - QCM : Choisir le mode de prévention adéquat
  - Cloze : nombre d'IST principales à dépister (4)

- **C2 (~10-12 cartes)** :
  - Lesson : Dépistage chlamydia (femme < 25 ans, ciblé, PCR sur autoprélèvement vaginal ou urines 1er jet)
  - Lesson : Dépistage VIH — proposition universelle, opt-out, modalités
  - Lesson : Syphilis — dépistage chez populations à risque (HSH, multipartenariat), TPHA/VDRL
  - Lesson : Gonocoque — clinique femme/homme, prélèvements
  - Lesson : Dépistage IST chez HSH (rythme, prélèvements multi-sites)
  - Lesson : PrEP VIH — concept, indications, où l'orienter
  - Lesson : Notion de "post-exposition" — TPE, délai 48 h, urgence
  - Lesson : Notification au partenaire — obligation déontologique vs respect du secret
  - Lesson : Antibiothérapie probabiliste cervicite/uretrite (azithromycine + ceftriaxone) — concept
  - QCM : Choisir le bon dépistage selon le profil
  - QCM : Reconnaître une situation TPE
  - SCT : nouvelle info → renforce/affaiblit indication dépistage chlamydia

- **Sources canoniques** :
  - HAS 2018 — Dépistage des infections à Chlamydia trachomatis : `https://www.has-sante.fr/jcms/c_2879193/fr/reevaluation-de-la-strategie-de-depistage-des-infections-a-chlamydia-trachomatis`
  - HAS 2017 — Dépistage de l'infection par le VIH : `https://www.has-sante.fr/jcms/c_2024411/fr/reevaluation-de-la-strategie-de-depistage-de-l-infection-par-le-vih-en-france`
  - HAS — IST bactériennes diagnostic et PEC : `https://www.has-sante.fr/jcms/c_2879194/fr/reevaluation-de-la-strategie-de-depistage-des-infections-a-neisseria-gonorrhoeae`
  - Pilly étudiant — IST

---

## 10. `gyneco-prevention` — Dépistage gynécologique + contraception (C1 + C2)

- **Items EDN** : 33 (suivi gynéco), 35 (contraception), 297 (cancer col)
- **C1 (~10-12 cartes)** :
  - Lesson : Le col de l'utérus — anatomie de base
  - Lesson : Le cycle menstruel en 1 minute — phase folliculaire, ovulation, phase lutéale
  - Lesson : HPV — virus très répandu, transmission sexuelle, lien avec cancer du col
  - Lesson : Frottis / test HPV — objectif (dépister précancer, pas l'IST)
  - Lesson : Vaccination HPV — recommandée filles et garçons dès 11 ans
  - Lesson : Contraception — distinction prévention grossesse vs prévention IST
  - Lesson : Les 4 grandes familles de contraception (œstroprogestatifs, progestatifs, DIU cuivre, DIU hormonal)
  - Lesson : Pilule du lendemain — types, délais
  - Lesson : Notion de contre-indications absolues (tabac > 35 ans + pilule œstroprogestative)
  - QCM : Distinguer dépistage col / dépistage IST
  - QCM : Reconnaître un moyen contraceptif
  - Cloze : âge vaccination HPV (11-14 ans)

- **C2 (~10-12 cartes)** :
  - Lesson : Frottis — calendrier 2020 (25-29 ans cyto tous 3 ans après 2 normaux à 1 an ; 30-65 ans HPV tous 5 ans)
  - Lesson : Conduite si test HPV positif (génotypage / cytologie réflexe)
  - Lesson : Vaccination HPV — Gardasil 9, schéma à 2 ou 3 doses selon âge
  - Lesson : Œstroprogestatifs — mécanisme, indications, contre-indications
  - Lesson : Progestatifs seuls — indications spécifiques
  - Lesson : DIU cuivre — mécanisme, durée, indications
  - Lesson : DIU hormonal (lévonorgestrel) — bénéfices vs cuivre
  - Lesson : Contraception d'urgence — Norlevo (LNG 72 h) vs EllaOne (UPA 120 h)
  - Lesson : Suivi annuel sous contraception (PA, EAL si OP, examen seins/pelvien)
  - Lesson : Indications d'orientation gynéco (saignements anormaux, ménorragies, douleurs)
  - QCM : Choisir la contraception adaptée à un profil
  - QCM : Identifier une contre-indication à la pilule OP
  - SCT : nouvelle info → renforce/affaiblit choix contraception

- **Sources canoniques** :
  - HAS 2019 — Dépistage et prévention cancer du col de l'utérus : `https://www.has-sante.fr/jcms/p_3296773/fr/depistage-et-prevention-du-cancer-du-col-de-l-uterus`
  - HAS — Méthodes contraceptives : `https://www.has-sante.fr/jcms/c_1369370/fr/contraception`
  - HAS 2022 — Vaccination HPV garçons : `https://www.has-sante.fr/jcms/p_3270075/fr/recommandation-vaccinale-elargissement-de-la-vaccination-contre-les-papillomavirus-aux-garcons`
  - CNGOF — Recommandations contraception : `https://cngof.fr/`

---

## Récapitulatif

| Topic                 | C1                       | C2     | Sources principales              | Items EDN     |
|-----------------------|--------------------------|--------|----------------------------------|---------------|
| `hta`                 | 15 + ~6-8 renforcement   | ~10-12 | HAS, SFHTA, ESC 2024             | 224           |
| `diabete-t2`          | ~10                      | ~10-12 | HAS 2024, SFD                    | 247           |
| `dyslipidemie`        | ~10                      | ~10-12 | HAS, ESC/EAS 2019, SCORE2        | 222           |
| `lombalgie`           | ~10                      | ~10-12 | HAS 2019, NICE NG59              | 93            |
| `cephalee`            | ~10                      | ~10-12 | HAS, SFEMC, NICE CG150, ICHD-3   | 100           |
| `depression`          | ~9-10                    | ~10-12 | HAS, NICE NG222                  | 64bis, 80     |
| `anxiete`             | ~9-10                    | ~10-12 | HAS, NICE CG113                  | 64            |
| `asthenie`            | ~8-10                    | ~10-12 | HAS 2014, LiSA, ebmfrance        | 246           |
| `ist`                 | ~9-10                    | ~10-12 | HAS (×3), Pilly                  | 162           |
| `gyneco-prevention`   | ~10-12                   | ~10-12 | HAS (×3), CNGOF                  | 33, 35, 297   |

**Volume cible** : ~190-230 cartes ajoutées (au-delà des 15 HTA-C1 existantes).

---

# Phase A — Élargissement C1+C2 (8 topics supplémentaires)

> Topics ajoutés pour couvrir la suite ECOGEN avant de basculer en C3/C4. Mêmes contraintes que les 10 premiers : C1 zéro-prérequis, C2 mécanismes + clinique de base, médias inclus dès la génération.

## 11. `irc` — Insuffisance rénale chronique (C1 + C2)
- **Items EDN** : 261, 264
- C1 (~8-10) : reins (rôle filtre), créatinine et DFG, protéinurie (signal d'alarme), stades de la MRC (1 à 5), symptômes (souvent silencieuse), bandelette urinaire
- C2 (~10-12) : eGFR (CKD-EPI), albuminurie A1/A2/A3, classification KDIGO, causes (diabète, HTA), surveillance MG, IEC/ARA2 néphroprotecteurs, adaptation posologique, quand orienter au néphro
- Sources : HAS reco MRC 2012, KDIGO 2024, NICE NG203, Société Française Néphrologie

## 12. `bpco` — BPCO (C1 + C2)
- **Items EDN** : 209
- C1 (~9-10) : poumons (alvéoles, bronches), tabac et inflammation chronique, dyspnée d'effort, toux chronique productive, spirométrie (concept), Tiffeneau, irréversibilité (vs asthme)
- C2 (~10-12) : VEMS/CVF < 0,7 post-bronchodilatateur, classification GOLD A/B/E, exacerbations, traitements (LABA/LAMA, ICS), arrêt tabac priorité, vaccination grippe/pneumocoque, réhab respiratoire
- Sources : HAS 2014, GOLD 2024 report, NICE NG115, SPLF (Société Pneumologie Langue Française)

## 13. `asthme` — Asthme (C1 + C2)
- **Items EDN** : 188
- C1 (~9-10) : hyperréactivité bronchique, allergies/atopie, sibilants, crise vs asthme contrôlé, DEP (peak flow), réversibilité (vs BPCO), facteurs déclenchants
- C2 (~10-12) : critères diagnostic (clinique + EFR avec réversibilité ≥ 12 %), GINA steps 1-5, ICS dose faible/moyenne/forte, SABA à la demande vs MART, asthme sévère, exacerbations, plan d'action écrit
- Sources : HAS 2009, GINA 2024 report, NICE NG80

## 14. `insuffisance-cardiaque` — Insuffisance cardiaque chronique (C1 + C2)
- **Items EDN** : 234
- C1 (~9-10) : cœur pompe (rappel HTA), dyspnée NYHA I-IV, œdèmes MI, orthopnée, fatigue, fraction d'éjection (concept), gauche vs droite, BNP/NT-proBNP
- C2 (~10-12) : ICFEr (≤ 40 %) vs ICFEp (≥ 50 %), 4 piliers (IEC/ARNI, BB, MRA, SGLT2-i), titration progressive, surveillance poids, éducation patient (sel, activité), décompensation, hospitalisation
- Sources : ESC 2021 (mise à jour 2023), HAS 2014, NICE NG106

## 15. `depistage-cancer` — Dépistage cancer (sein + colorectal) (C1 + C2)
- **Items EDN** : 290 (sein), 287 (colorectal)
- C1 (~9-10) : concept de dépistage organisé, cancer sein (palpation, mammographie), cancer colorectal (test immunologique selles), population cible 50-74 ans, intervalle 2 ans, gratuité, faux positifs/négatifs
- C2 (~10-12) : facteurs de risque sein (ATCD familiaux, BRCA), conduite si test positif (coloscopie / mammographie complémentaire), classification BI-RADS, ACR 0-6, dépistage en cas d'ATCD familiaux (avant 50 ans)
- Sources : INCa, HAS dépistage sein 2016, HAS dépistage colorectal 2017

## 16. `vaccination-adulte` — Vaccination adulte (C1 + C2)
- **Items EDN** : 143
- C1 (~9-10) : principe vaccinal (mémoire immunitaire), vaccins vivants vs inactivés, calendrier vaccinal, DTP rappel 25/45/65 ans puis tous 10 ans, ROR, grippe annuelle
- C2 (~10-12) : grippe 65+ et FdR, pneumocoque (Prevnar 13 + Pneumovax 23), zona (Shingrix), Covid-19, HPV adulte (rattrapage), méningocoque ACWY/B (étudiants), tétanos blessure, recommandations particulières grossesse (coqueluche, grippe)
- Sources : Calendrier vaccinal HAS 2025, Santé publique France

## 17. `arret-tabac` — Sevrage tabagique (C1 + C2)
- **Items EDN** : 75 (addictions)
- C1 (~9-10) : nicotine et addiction, score de Fagerström (court), risques tabac (cancers, MCV, BPCO), bénéfices arrêt (chronologie), test CO expiré, syndrome de sevrage
- C2 (~10-12) : entretien motivationnel (stades de Prochaska), substituts nicotiniques (patch + gomme/inhaleur, dosage), varénicline, bupropion, e-cigarette (controverse), grossesse (substituts seulement), suivi à 1/3/6 mois
- Sources : HAS 2014, NICE NG209, Société Francophone de Tabacologie (SFT)

## 18. `saos` — Syndrome d'apnées obstructives du sommeil (C1 + C2)
- **Items EDN** : 108
- C1 (~9-10) : sommeil et respiration, ronflement, apnée vs hypopnée (concept), somnolence diurne, Epworth, conséquences (HTA, AVC, accidents), profil typique (homme, surpoids)
- C2 (~10-12) : polygraphie ventilatoire ambulatoire vs polysomnographie, IAH 5/15/30 (léger/modéré/sévère), PPC (CPAP), orthèse d'avancée mandibulaire, perte de poids, hygiène sommeil, retrait permis si non traité
- Sources : HAS 2014, SFRMS (Société Française de Recherche et Médecine du Sommeil)

---

## Récapitulatif Phase A

| Topic                       | C1   | C2   | Items EDN | Sources principales         |
|-----------------------------|------|------|-----------|------------------------------|
| `irc`                       | ~9   | ~11  | 261, 264  | HAS, KDIGO, NICE NG203       |
| `bpco`                      | ~10  | ~11  | 209       | HAS, GOLD, NICE NG115, SPLF  |
| `asthme`                    | ~10  | ~11  | 188       | HAS, GINA, NICE NG80         |
| `insuffisance-cardiaque`    | ~9   | ~11  | 234       | ESC 2021, HAS, NICE NG106    |
| `depistage-cancer`          | ~9   | ~11  | 287, 290  | INCa, HAS                    |
| `vaccination-adulte`        | ~9   | ~11  | 143       | Calendrier vaccinal HAS 2025 |
| `arret-tabac`               | ~9   | ~11  | 75        | HAS 2014, NICE NG209, SFT    |
| `saos`                      | ~9   | ~11  | 108       | HAS 2014, SFRMS              |

**Volume cible Phase A** : ~160-180 cartes (8 topics × ~20-22).
