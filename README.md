# 🌐 Budget Séjour

> **Application web full-stack de gestion budgétaire multi-devises pour étudiants et voyageurs en séjour à l'étranger.**

---

## 📋 Table des matières

- [Présentation du projet](#-présentation-du-projet)
- [Fonctionnalités clés](#-fonctionnalités-clés)
- [Architecture & Arborescence](#-architecture--arborescence)
- [Technologies utilisées](#-technologies-utilisées)
- [Modèle de données (Base de données)](#-modèle-de-données-base-de-données)
- [Calculs & Logique métier](#-calculs--logique-métier)
- [Documentation de l'API REST](#-documentation-de-lapi-rest)
- [Installation & Démarrage](#-installation--démarrage)
- [Scripts npm disponibles](#-scripts-npm-disponibles)
- [Configuration & Personnalisation](#-configuration--personnalisation)

---

## 📖 Présentation du projet

**Budget Séjour** est une application web conçue pour simplifier la vie financière des étudiants internationaux, expatriés ou voyageurs au long cours (par exemple lors d'un séjour d'études au Canada, en Europe, ou en Algérie).

### Problématiques résolues :
1. **La gestion multi-devises** : Les dépenses sont souvent effectuées dans des monnaies différentes (**CAD**, **EUR**, **DZD**) alors que le budget global est fixé dans une devise de référence.
2. **Le suivi des dettes ("Argent à rendre")** : Les prêts ou avances d'argent entre proches impactent la trésorerie réelle. Tant qu'une dette n'est pas remboursée, elle est déduite du budget disponible.
3. **L'anticipation du dépassement budgétaire ("Détecteur de budget")** : Grâce à une projection mathématique au rythme quotidien réel, l'application alerte l'utilisateur avant qu'il ne soit à court d'argent.
4. **La volatilité des taux de change** : Possibilité d'utiliser les taux officiels en direct, mis en cache, ou de basculer vers des **taux manuels** (idéal pour le marché parallèle des devises, comme le marché informel du dinar algérien).

---

## ✨ Fonctionnalités clés

### 1. 🧳 Gestion du Séjour (Onboarding & Paramétrage)
- Création et modification du séjour : Nom, date de début, date de fin, budget total, devise de référence (`CAD`, `EUR`, `DZD`).
- Écran d'accueil dédié (*Onboarding*) si aucun séjour n'est configuré en base.
- Modification des paramètres ou suppression intégrale du séjour dans une zone dédiée.

### 2. 💸 Suivi des Dépenses
- Enregistrement rapide d'une dépense : Montant, devise d'origine, catégorie, description, date.
- Conversion automatique dans la devise de référence du séjour lors de l'insertion en base.
- Filtrage avancé par **catégorie** (`Nourriture`, `Transport`, `Logement`, `Loisirs`, `Factures`, `Autre`) et par **plage de dates** (du / au).
- Modification et suppression en temps réel avec réactualisation des calculs.

### 3. 🤝 Suivi des Dettes ("Argent à rendre")
- Suivi de l'argent dû à des tiers (nom du créancier, montant, devise d'origine, date d'échéance optionnelle, statut `RENDU` ou `NON_RENDU`).
- Interrupteur rapide (*toggle switch*) pour basculer une dette entre "À rendre" et "Remboursé".
- **Impact direct sur le budget disponible** : Le budget restant prend en compte le total des dettes non remboursées.

### 4. 🧭 Détecteur de budget & Projections intelligentes
- **Indicateur de statut visuel** :
  - 🟢 **En bonne voie** : Dépenses sous contrôle.
  - 🟡 **Attention** : Risque de dépassement au rythme actuel (> 90 % du budget projeté).
  - 🔴 **Danger** : Budget déjà dépassé ou projection dépassant 100 % du budget total.
- **Métriques calculées** :
  - Jours totaux, jours écoulés, jours restants.
  - Dépensé total & pourcentage du budget consommé.
  - Dettes restantes déduites.
  - Moyenne dépensée par jour écoulé.
  - Projection du coût total à la fin du séjour au rythme actuel.
  - Budget journalier recommandé pour les jours restants.

### 5. 📊 Visualisations & Statistiques détaillées (Recharts)
- **Évolution temporelle** : Graphique d'aire en dégradé montrant le cumul journalier des dépenses avec ligne témoin du budget total.
- **Répartition par catégorie** : Diagramme en anneau (*Donut chart*) coloré par catégorie avec légendes et totaux.
- **Dépenses par période** : Histogramme en barres avec regroupement au choix par **Semaine** ou par **Mois**.
- **Filtres de période prédéfinis** : "Ce mois", "3 derniers mois", "Tout le séjour", ou période "Personnalisée".

### 6. 💱 Convertisseur & Gestion des Taux de Change
- Prise en charge des devises : `CAD` ($), `EUR` (€), `DZD` (DA).
- Taux en direct récupérés via l'API publique `open.er-api.com` basée sur l'EUR.
- Mise en cache en base SQLite pour fonctionnement hors ligne ou tolérance aux pannes réseau.
- Taux de repli (*fallback*) codés en dur en cas d'absence de réseau dès l'initialisation.
- **Mode Taux Manuels** : Saisie personnalisée des ratios (1 EUR en CAD, 1 CAD en DZD) pour refléter fidèlement le marché réel.
- **Sélecteur de devise d'affichage globale** dans l'en-tête pour réévaluer toute l'interface dans la monnaie de son choix sans altérer les données sous-jacentes.

### 7. 🎨 Interface moderne & Responsive
- Thème **Dark Mode** par défaut avec bascule instantanée en **Light Mode** (sauvegarde en `localStorage`).
- Navigation adaptative : Barre supérieure sur grand écran, barre de navigation mobile fixe en bas d'écran.
- Palette de couleurs soignée et typographie fluide avec Tailwind CSS v4.

---

## 🏗️ Architecture & Arborescence

Le projet est un monorepo combinant un serveur Node.js/Express et une application frontend Vite/React.

```text
money/
├── prisma/
│   ├── dev.db                      # Base de données SQLite locale
│   ├── schema.prisma               # Définition des modèles et énumérations Prisma
│   └── seed.ts                     # Script d'injection de données d'exemple
│
├── server/
│   ├── db.ts                       # Instance partagée de PrismaClient
│   ├── index.ts                    # Point d'entrée de l'API Express & serveur de fichiers statiques
│   ├── lib/
│   │   └── rates.ts                # Logique de récupération, conversion et stockage des taux
│   └── routes/
│       ├── depenses.ts             # Routes CRUD pour les dépenses (/api/depenses)
│       ├── dettes.ts               # Routes CRUD pour les dettes (/api/dettes)
│       ├── rates.ts                # Routes de gestion des taux (/api/rates)
│       └── sejours.ts              # Routes CRUD pour le séjour (/api/sejours)
│
├── src/
│   ├── App.tsx                     # Configuration des routes React Router
│   ├── index.css                   # Styles globaux, variables CSS et classes utilitaires Tailwind v4
│   ├── main.tsx                    # Point de montage de l'application React
│   │
│   ├── components/
│   │   ├── DepenseRow.tsx          # Ligne d'affichage d'une dépense (avec icône, montants et actions)
│   │   ├── EmptyState.tsx          # Vue d'état vide réutilisable
│   │   ├── icons.tsx               # Composants d'icônes SVG intégrés (sans bibliothèque externe)
│   │   ├── Layout.tsx              # Structure principale (Header, Navbar desktop/mobile, Outlet)
│   │   ├── Modal.tsx               # Boîte de dialogue modale animée
│   │   ├── Onboarding.tsx          # Écran d'accueil pour la création initiale d'un séjour
│   │   ├── SejourForm.tsx          # Formulaire réutilisable de création/édition d'un séjour
│   │   └── StatCard.tsx            # Carte d'indicateur numérique (KPI)
│   │
│   ├── context/
│   │   └── AppContext.tsx          # Contexte global (séjour actif, taux, devise d'affichage, thème)
│   │
│   ├── lib/
│   │   ├── api.ts                  # Client HTTP typé pour l'API REST backend
│   │   ├── calc.ts                 # Algorithmes de projection et d'état du budget
│   │   ├── convert.ts              # Fonction utilitaire de conversion entre devises
│   │   ├── format.ts               # Utilitaires de formatage (devises, dates, libellés, badges)
│   │   ├── stats.ts                # Agrégations de données pour les graphiques Recharts
│   │   └── types.ts                # Définitions des types et interfaces TypeScript
│   │
│   └── pages/
│       ├── Dashboard.tsx           # Tableau de bord principal (KPIs, alertes, graph cumul, récents)
│       ├── Depenses.tsx            # Liste complète des dépenses avec filtres et modal d'ajout/édition
│       ├── Dettes.tsx              # Liste des dettes avec bascule rendu/non-rendu et modale
│       ├── Parametres.tsx          # Configuration du séjour, devises, taux manuels et suppression
│       └── Stats.tsx               # Analyse graphique (cumul vs budget, catégories, par semaine/mois)
│
├── index.html                      # Page HTML racine
├── package.json                    # Dépendances et scripts de développement
├── tsconfig.json                   # Configuration TypeScript
├── vite.config.ts                  # Configuration du bundler Vite et du proxy API
└── .gitignore                      # Fichiers exclus du contrôle de version
```

---

## 💻 Technologies utilisées

### Frontend
- **React 19** (`react`, `react-dom`) : Composants fonctionnels et hooks récents.
- **Vite 6** : Environnement de build ultra-rapide avec Hot Module Replacement (HMR).
- **Tailwind CSS v4** (`@tailwindcss/vite`, `tailwindcss`) : Moteur de style moderne avec support natif des variables `@theme`.
- **React Router 7** (`react-router-dom`) : Routage client côté navigateur.
- **Recharts 3.x** : Bibliothèque de graphiques vectoriels interactifs (`AreaChart`, `PieChart`, `BarChart`).
- **TypeScript 5.8** : Typage statique strict de bout en bout.

### Backend
- **Node.js** & **Express 4.x** : Serveur d'API REST robuste et léger.
- **TypeScript** avec **`tsx`** : Exécution directe du code TypeScript sans étape de transpilation manuelle en développement.
- **Prisma ORM 6.x** : Modélisation des données, migrations et requêtes SQL typées.
- **SQLite** (`dev.db`) : Base de données locale intégrée, sans configuration de serveur externe requise.
- **CORS** : Gestion des requêtes multi-origines entre Vite et Express.
- **Concurrently** : Lancement simultané du serveur backend et du client web avec une seule commande.

---

## 🗄️ Modèle de données (Base de données)

Le schéma Prisma est défini dans [`prisma/schema.prisma`](file:///c:/Users/wail%20bentaleb/Desktop/money/prisma/schema.prisma) :

```prisma
enum Categorie {
  NOURRITURE
  TRANSPORT
  LOGEMENT
  LOISIRS
  FACTURES
  AUTRE
}

enum StatutDette {
  RENDU
  NON_RENDU
}

model Sejour {
  id              Int             @id @default(autoincrement())
  nom             String
  dateDebut       String          // Format ISO "YYYY-MM-DD"
  dateFin         String          // Format ISO "YYYY-MM-DD"
  budgetTotal     Float
  deviseReference String          @default("CAD") // CAD, EUR, DZD
  createdAt       DateTime        @default(now())
  depenses        Depense[]
  dettes          ArgentARendre[]
}

model Depense {
  id              Int       @id @default(autoincrement())
  sejourId        Int
  sejour          Sejour    @relation(fields: [sejourId], references: [id], onDelete: Cascade)
  montant         Float
  devise          String    // Devise originale
  montantConverti Float     // Montant dans la devise de référence du séjour
  deviseRef       String    // Devise de référence au moment de la création
  categorie       Categorie
  description     String
  date            String    // Format ISO "YYYY-MM-DD"
  createdAt       DateTime  @default(now())
}

model ArgentARendre {
  id              Int         @id @default(autoincrement())
  sejourId        Int
  sejour          Sejour      @relation(fields: [sejourId], references: [id], onDelete: Cascade)
  montant         Float
  devise          String
  montantConverti Float
  deviseRef       String
  personne        String
  dateEcheance    String?     // Format ISO "YYYY-MM-DD"
  statut          StatutDette @default(NON_RENDU)
  createdAt       DateTime    @default(now())
}

model TauxChange {
  devise   String   @id // Clé primaire : "CAD", "EUR", "DZD"
  tauxEUR  Float    // Valeur de 1 EUR dans cette devise
  misAJour DateTime
  manuel   Boolean  @default(false)
}
```

---

## 🧮 Calculs & Logique métier

### 1. Formule de conversion de devises
Toutes les devises sont indexées sur l'EUR comme devise pivot :
$$\text{Montant}_{\text{vers}} = \left(\frac{\text{Montant}_{\text{de}}}{\text{TauxEUR}[\text{de}]}\right) \times \text{TauxEUR}[\text{vers}]$$

### 2. Formules d'état du budget ([`src/lib/calc.ts`](file:///c:/Users/wail%20bentaleb/Desktop/money/src/lib/calc.ts))
- **Jours totaux** : $\Delta(\text{dateFin}, \text{dateDebut}) + 1$
- **Jours écoulés** : $\min(\text{joursTotal}, \max(0, \Delta(\text{aujourd'hui}, \text{dateDebut}) + 1))$
- **Jours restants** : $\max(0, \text{joursTotal} - \text{joursEcoules})$
- **Budget restant réel** :
  $$\text{Budget Restant} = \text{Budget Total} - \sum \text{Dépenses} - \sum \text{Dettes non rendues}$$
- **Moyenne journalière actuelle** :
  $$\text{Moyenne/Jour} = \frac{\sum \text{Dépenses}}{\text{Jours écoulés}}$$
- **Projection du budget en fin de séjour** :
  $$\text{Projection} = \text{Moyenne/Jour} \times \text{Jours totaux}$$
- **Recommandation par jour restant** :
  $$\text{Recommandé/Jour} = \frac{\max(0, \text{Budget Restant})}{\text{Jours restants}}$$
- **Détection d'état** :
  - **Danger** : si $\text{Budget Restant} < 0$ ou $\frac{\text{Projection}}{\text{Budget Total}} > 1.0$
  - **Attention** : si $\frac{\text{Projection}}{\text{Budget Total}} > 0.9$
  - **En bonne voie (OK)** : sinon

---

## 🔌 Documentation de l'API REST

Le serveur backend tourne sur le port `4000` (redirigé automatiquement en dev par Vite via le proxy `/api`).

### Séjours (`/api/sejours`)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/sejours` | Liste tous les séjours (triés par id décroissant) |
| `POST` | `/api/sejours` | Crée un séjour (`nom`, `dateDebut`, `dateFin`, `budgetTotal`, `deviseReference`) |
| `PUT` | `/api/sejours/:id` | Modifie un séjour existant |
| `DELETE` | `/api/sejours/:id` | Supprime un séjour et toutes ses dépenses/dettes en cascade |

### Dépenses (`/api/depenses`)
| Méthode | Route | Paramètres Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/depenses` | `?sejourId=&categorie=&du=&au=` | Récupère la liste des dépenses avec filtres optionnels |
| `POST` | `/api/depenses` | JSON : `{ sejourId, montant, devise, categorie, description, date }` | Crée une dépense avec conversion automatique |
| `PUT` | `/api/depenses/:id` | JSON partiel | Modifie une dépense et recalcule son montant converti |
| `DELETE` | `/api/depenses/:id` | - | Supprime une dépense |

### Dettes (`/api/dettes`)
| Méthode | Route | Paramètres Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/dettes` | `?sejourId=&statut=` | Récupère la liste des dettes |
| `POST` | `/api/dettes` | JSON : `{ sejourId, montant, devise, personne, dateEcheance, statut }` | Enregistre une nouvelle dette |
| `PUT` | `/api/dettes/:id` | JSON partiel (ex: `{ statut: "RENDU" }`) | Modifie une dette ou son statut |
| `DELETE` | `/api/dettes/:id` | - | Supprime une dette |

### Taux de Change (`/api/rates`)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/rates` | Récupère les taux de change (en direct, cache, fallback ou manuel) |
| `POST` | `/api/rates/refresh` | Force l'actualisation des taux depuis l'API en ligne |
| `POST` | `/api/rates/manuel` | JSON : `{ eurVersCad, cadVersDzd }` - Définit des taux manuels fixes |
| `POST` | `/api/rates/auto` | Annule les taux manuels et repasse en mode automatique |

---

## 🚀 Installation & Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) version 18 ou supérieure
- `npm` (fourni avec Node.js)

### 1. Installation des dépendances
Dans le répertoire racine du projet :
```bash
npm install
```

### 2. Initialisation de la base de données
Appliquez le schéma Prisma à la base SQLite locale :
```bash
npm run db:push
```

*(Optionnel)* Remplissez la base avec des données de démonstration :
```bash
npm run db:seed
```
> Le script de seed crée un exemple réaliste : *"Séjour d'études à Montréal"* avec un budget de 5 000 CAD, 18 dépenses variées en CAD, EUR et DZD, et 2 dettes.

### 3. Démarrage de l'application en développement
Lancez le serveur backend et le client frontend simultanément :
```bash
npm run dev
```

L'application est immédiatement accessible sur :
- **Frontend** : [http://localhost:5173](http://localhost:5173)
- **API Backend** : [http://localhost:4000](http://localhost:4000)

---

## 📜 Scripts npm disponibles

| Commande | Action |
|---|---|
| `npm run dev` | Lance à la fois le serveur Express (`tsx watch`) et Vite en parallèle avec `concurrently` |
| `npm run dev:server` | Lance uniquement le serveur API Node/Express en mode watch |
| `npm run dev:web` | Lance uniquement le serveur de développement Vite |
| `npm run build` | Vérifie les types TypeScript (`tsc --noEmit`) et compile le bundle de production Vite |
| `npm run start` | Lance le serveur Node.js en production (sert à la fois l'API et les fichiers compilés dans `dist/`) |
| `npm run typecheck` | Exécute la vérification statique TypeScript sans émettre de fichiers |
| `npm run db:push` | Synchronise le schéma Prisma avec la base SQLite sans créer de fichier de migration |
| `npm run db:seed` | Exécute le script [`prisma/seed.ts`](file:///c:/Users/wail%20bentaleb/Desktop/money/prisma/seed.ts) pour peupler la base |
| `npm run db:studio` | Ouvre l'interface graphique d'administration Prisma Studio dans votre navigateur |

---

## ⚙️ Configuration & Personnalisation

### Proxy Vite
Le fichier [`vite.config.ts`](file:///c:/Users/wail%20bentaleb/Desktop/money/vite.config.ts) configure un proxy automatique pour que tout appel à `/api/*` sur le port `5173` soit relayé au port `4000` :
```ts
server: {
  port: 5173,
  proxy: { '/api': 'http://localhost:4000' },
}
```

### Port de production
Par défaut, le serveur écoute sur le port `4000`, modifiable via la variable d'environnement `PORT` :
```bash
PORT=5000 npm run start
```
En mode production, si le dossier `dist/` existe, le serveur Express sert directement l'application React compilée et redirige toutes les routes non-API vers `dist/index.html`.
