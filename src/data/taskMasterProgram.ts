import { Project, TimeBlock } from './types';

export interface ProgramImportPayload {
  version: string;
  project: {
    title: string;
    domain: string;
    bentoSize: 'small' | 'medium' | 'large';
    description: string;
    notes: string;
    targetCompletionDate?: string;
    tags: string[];
    milestones: {
      id: string;
      title: string;
      completed: boolean;
    }[];
  };
  dailyPlan: {
    dayNumber: number;
    weekNumber: number;
    title: string;
    milestoneId: string;
    objective: string;
    subtasks: string[];
    durationMinutes: number;
    notes?: string;
  }[];
}

export const TASK_MASTER_PRO_PROGRAM: ProgramImportPayload = {
  version: "1.0",
  project: {
    title: "Task Master Pro — Dev Web Full-Stack & Audit IA",
    domain: "tech",
    bentoSize: "large",
    description: "Développer de zéro une application web sécurisée de gestion de tâches collaboratives (Task Master Pro) en maîtrisant HTML/CSS, JavaScript ES6+, Node.js/Express, PostgreSQL et l'authentification JWT. Apprendre à piloter, auditer, déboguer et sécuriser le code généré par IA sans subir ses hallucinations.",
    targetCompletionDate: "8 semaines (56 jours / 112h)",
    tags: ["Dev Web", "Full-Stack", "JavaScript", "Node.js", "PostgreSQL", "IA", "Sécurité"],
    milestones: [
      { id: "m-01", title: "Jalon 01 : Squelette HTML5 sémantique et formulaires de Task Master Pro", completed: false },
      { id: "m-02", title: "Jalon 02 : Design CSS3 moderne, système de cartes et mise en page Flexbox/Grid", completed: false },
      { id: "m-03", title: "Jalon 03 : Interface responsive adaptable sur mobile et bureau", completed: false },
      { id: "m-04", title: "Jalon 04 : Dynamisation du DOM et gestion d'état local des tâches en JavaScript", completed: false },
      { id: "m-05", title: "Jalon 05 : Persistance locale via LocalStorage et filtres d'affichage", completed: false },
      { id: "m-06", title: "Jalon 06 : Architecture serveur Node.js/Express et API REST de base", completed: false },
      { id: "m-07", title: "Jalon 07 : Contrôleurs CRUD et validation robuste des requêtes HTTP", completed: false },
      { id: "m-08", title: "Jalon 08 : Modélisation et schéma relationnel PostgreSQL / SQLite", completed: false },
      { id: "m-09", title: "Jalon 09 : Intégration de la base de données au serveur et requêtes préparées", completed: false },
      { id: "m-10", title: "Jalon 10 : Système d'authentification sécurisé (BCrypt & JWT)", completed: false },
      { id: "m-11", title: "Jalon 11 : Isolation des données par utilisateur et middlewares de sécurité", completed: false },
      { id: "m-12", title: "Jalon 12 : Fonctionnalités collaboratives et gestion centralisée des erreurs", completed: false },
      { id: "m-13", title: "Jalon 13 : Suite de tests unitaires et protocole d'audit anti-hallucination IA", completed: false },
      { id: "m-14", title: "Jalon 14 : Déploiement en production, variables d'environnement et livraison finale", completed: false },
    ],
    notes: `### 📚 Documentations Officielles
- MDN Web Docs (HTML/CSS/JS) : https://developer.mozilla.org/fr/
- Node.js API Docs : https://nodejs.org/docs/latest/api/
- Express.js Guide : https://expressjs.com/fr/starter/installing.html
- PostgreSQL Documentation : https://www.postgresql.org/docs/
- JWT (JSON Web Tokens) Spec : https://jwt.io/introduction

### 🛠️ Aides-Mémoire & Cheatsheets
- CSS Flexbox Cheatsheet : https://css-tricks.com/snippets/css/a-guide-to-flexbox/
- CSS Grid Cheatsheet : https://css-tricks.com/snippets/css/complete-guide-grid/
- JavaScript ES6+ Cheatsheet : https://devhints.io/es6
- HTTP Status Codes Guide : https://httpstatuses.com/
- OWASP Top 10 Security Risks : https://owasp.org/www-project-top-ten/

### ⌨️ Raccourcis VS Code Indispensables
- Ctrl + Shift + P (ou Cmd + Shift + P) : Ouvrir la palette de commandes
- Ctrl + D : Sélectionner le mot suivant identique (édition multi-curseur)
- Alt + Up/Down : Déplacer la ligne courante vers le haut/bas
- Ctrl + / : Commuter le commentaire de ligne

### 🛡️ Check-list d'Audit du Code généré par IA
1. L'import existe-t-il réellement ? (Vérifier sur npmjs.com si la bibliothèque ou la méthode n'est pas une hallucination).
2. Le code contient-il des failles SQL ? (S'assurer que toutes les requêtes utilisent des variables paramétrées $1, $2).
3. Le code est-il vulnérable aux attaques XSS ? (Ne jamais utiliser innerHTML directement avec du contenu fourni par l'utilisateur).
4. Les erreurs sont-elles gérées ? (Chaque opération asynchrone / BDD doit être dans un bloc try/catch).
5. Les secrets sont-ils protégés ? (Aucune clé API, mot de passe ou JWT secret ne doit figurer en clair dans le code ; tout doit être dans .env).`
  },
  dailyPlan: [
    // Semaine 1
    {
      dayNumber: 1,
      weekNumber: 1,
      title: "HTML5 - Squelette et formulaires",
      milestoneId: "m-01",
      objective: "Structurer la page principale de Task Master Pro avec un HTML5 sémantique et accessible.",
      durationMinutes: 120,
      subtasks: [
        "Écrire le boilerplate HTML5 (<!DOCTYPE>, <html>, <head>, <body>) et balises meta viewport",
        "Structurer le header (<h1>, sous-titre) et la zone de formulaire (<form>, <input>, <button>)",
        "Ajouter les attributs d'accessibilité (<label>, aria-label, placeholder)",
        "Inspecter le résultat dans le navigateur et vérifier l'arborescence DOM"
      ]
    },
    {
      dayNumber: 2,
      weekNumber: 1,
      title: "HTML5 - Structure des cartes de tâches",
      milestoneId: "m-01",
      objective: "Baliser la zone d'affichage des tâches et des colonnes de statut.",
      durationMinutes: 120,
      subtasks: [
        "Créer le conteneur principal du tableau Kanban (<section>, <main>)",
        "Baliser une carte de tâche type (<article>, titre <h3>, tags, statut, bouton suppression)",
        "Intégrer les éléments d'interaction (checkbox pour statut \"Terminé\", sélecteur de priorité)",
        "Effectuer un auto-audit W3C Validator pour éliminer les erreurs de syntaxe HTML"
      ]
    },
    {
      dayNumber: 3,
      weekNumber: 1,
      title: "CSS3 - Stylisation de base et typographie",
      milestoneId: "m-02",
      objective: "Appliquer la charte graphique et réinitialiser les styles par défaut du navigateur.",
      durationMinutes: 120,
      subtasks: [
        "Mettre en place un reset CSS (box-sizing: border-box, margins/paddings à zéro)",
        "Déclarer les variables CSS custom (:root avec palette de couleurs, typographie, ombres)",
        "Styliser les titres, le fond de page, le formulaire et les boutons d'action",
        "Styliser le composant \"Carte de tâche\" (bordures, badges de priorité, effets hover)"
      ]
    },
    {
      dayNumber: 4,
      weekNumber: 1,
      title: "CSS3 - Layout moderne avec Flexbox",
      milestoneId: "m-02",
      objective: "Aligner parfaitement le formulaire et les éléments internes des cartes de tâches.",
      durationMinutes: 120,
      subtasks: [
        "Appliquer display: flex sur le formulaire pour aligner champ et bouton de création",
        "Structurer l'intérieur des cartes de tâches avec Flexbox (espace entre titre, badge et actions)",
        "Gérer l'alignement des icônes et des textes dans les boutons",
        "Tester le comportement au redimensionnement de la fenêtre"
      ]
    },
    {
      dayNumber: 5,
      weekNumber: 1,
      title: "CSS3 - Tableau Kanban avec CSS Grid",
      milestoneId: "m-02",
      objective: "Organiser l'application en colonnes de statut (À faire, En cours, Terminé).",
      durationMinutes: 120,
      subtasks: [
        "Mettre en place display: grid sur le conteneur principal du tableau",
        "Configurer grid-template-columns pour créer 3 colonnes de largeur égale",
        "Ajouter les en-têtes de colonnes et styliser les zones de dépôt de cartes",
        "Ajuster l'espacement inter-colonnes (gap) et les marges internes"
      ]
    },
    {
      dayNumber: 6,
      weekNumber: 1,
      title: "CSS3 - Media Queries & Responsive Design",
      milestoneId: "m-03",
      objective: "Rendre l'interface fluide sur mobile, tablette et écran d'ordinateur.",
      durationMinutes: 120,
      subtasks: [
        "Configurer les Media Queries (@media (max-width: 768px))",
        "Basculer la grille 3 colonnes en empilement vertical à 1 colonne sur écran mobile",
        "Adapter la taille des boutons et des zones tactiles pour l'utilisation sur smartphone",
        "Audit visuel sur Chrome DevTools (émulation iPhone / iPad / Desktop)"
      ]
    },
    {
      dayNumber: 7,
      weekNumber: 1,
      title: "Semaine 1 - Revue de code & Audit IA",
      milestoneId: "m-03",
      objective: "Valider la maquette statique finale et confronter son code à une analyse IA.",
      durationMinutes: 120,
      subtasks: [
        "Faire générer par l'IA une variante de composant HTML/CSS pour comparer la structure",
        "Identifier 2 erreurs d'accessibilité ou d'optimisation dans le code généré",
        "Refactoriser et nettoyer le code CSS (éliminer les règles dupliquées)",
        "Valider le rendu final du Jalon 03 dans l'interface"
      ]
    },

    // Semaine 2
    {
      dayNumber: 8,
      weekNumber: 2,
      title: "JS - Syntaxe, variables et sélection DOM",
      milestoneId: "m-04",
      objective: "Lier le fichier JavaScript et capturer les éléments HTML du formulaire.",
      durationMinutes: 120,
      subtasks: [
        "Créer app.js, le lier au HTML avec defer et tester un console.log()",
        "Sélectionner les éléments du DOM (querySelector, getElementById)",
        "Intercepter la soumission du formulaire avec addEventListener('submit')",
        "Empêcher le rechargement de page par défaut avec event.preventDefault()"
      ]
    },
    {
      dayNumber: 9,
      weekNumber: 2,
      title: "JS - Modèle de données & création dynamique",
      milestoneId: "m-04",
      objective: "Transformer les valeurs saisies par l'utilisateur en un objet JavaScript et l'injecter à l'écran.",
      durationMinutes: 120,
      subtasks: [
        "Récupérer la valeur du champ texte et vérifier qu'elle n'est pas vide",
        "Construire un objet tâche (id, title, status, createdAt)",
        "Écrire une fonction renderTask(task) utilisant document.createElement() ou Template Literals",
        "Injecter la nouvelle carte dans la colonne correspondante du DOM"
      ]
    },
    {
      dayNumber: 10,
      weekNumber: 2,
      title: "JS - Manipulation d'état (Suppression et statut)",
      milestoneId: "m-04",
      objective: "Rendre les cartes interactives (cocher comme terminé / supprimer).",
      durationMinutes: 120,
      subtasks: [
        "Attacher un écouteur d'événement sur le bouton de suppression de chaque carte",
        "Écrire la fonction deleteTask() pour retirer l'élément HTML du DOM",
        "Gérer le changement d'état \"Terminé\" (bascule de classe CSS completed)",
        "Mettre à jour le tableau global d'objets en mémoire (tasksState)"
      ]
    },
    {
      dayNumber: 11,
      weekNumber: 2,
      title: "JS - Délégation d'événements & refactoring",
      milestoneId: "m-04",
      objective: "Optimiser les performances de l'application grâce à la délégation d'événements.",
      durationMinutes: 120,
      subtasks: [
        "Placer un écouteur global click sur le conteneur parent (tasksContainer)",
        "Utiliser event.target.closest() pour identifier la carte ciblée",
        "Traiter les actions (suppression / changement de statut) via le parent",
        "Vérifier l'absence de fuites de mémoire ou d'écouteurs dupliqués"
      ]
    },
    {
      dayNumber: 12,
      weekNumber: 2,
      title: "JS - Persistance avec LocalStorage",
      milestoneId: "m-05",
      objective: "Sauvegarder les tâches dans le navigateur pour qu'elles ne disparaissent pas au rafraîchissement.",
      durationMinutes: 120,
      subtasks: [
        "Convertir le tableau d'objets en chaîne JSON avec JSON.stringify()",
        "Écrire dans le navigateur via localStorage.setItem('tasks', ...)",
        "Écrire la fonction d'initialisation pour lire localStorage.getItem() au chargement",
        "Réhydrater l'interface au démarrage (JSON.parse()) et gérer le cas d'une mémoire vide"
      ]
    },
    {
      dayNumber: 13,
      weekNumber: 2,
      title: "JS - Filtrage dynamique et compteurs",
      milestoneId: "m-05",
      objective: "Ajouter des filtres (Toutes / Actives / Terminées) et mettre à jour un compteur de tâches.",
      durationMinutes: 120,
      subtasks: [
        "Créer les boutons de filtre dans l'interface et leur attacher un événement",
        "Développer la logique de filtrage sur le tableau tasksState (Array.prototype.filter())",
        "Mettre à jour le compteur dynamique de tâches en attente",
        "Appliquer un style actif sur le bouton de filtre sélectionné"
      ]
    },
    {
      dayNumber: 14,
      weekNumber: 2,
      title: "Semaine 2 - Debug JS & Pièges IA",
      milestoneId: "m-05",
      objective: "Utiliser les Chrome DevTools et auditer une fonction JS générée par IA.",
      durationMinutes: 120,
      subtasks: [
        "Placer des points d'arrêt (breakpoints) dans les DevTools et exécuter le code pas à pas",
        "Demander à l'IA d'écrire une fonction de recherche de tâches",
        "Repérer si l'IA a introduit une mutation directe d'état ou un bogue de portée (scope)",
        "Valider la version finale du script Front-End"
      ]
    },

    // Semaine 3
    {
      dayNumber: 15,
      weekNumber: 3,
      title: "Node.js - Initialisation de l'environnement serveur",
      milestoneId: "m-06",
      objective: "Configurer un projet Node.js et exécuter un premier serveur HTTP.",
      durationMinutes: 120,
      subtasks: [
        "Initialiser le projet avec npm init -y et analyser le fichier package.json",
        "Installer Express via npm install express",
        "Créer server.js et configurer une instance d'application Express de base",
        "Lancer le serveur sur le port 3000 et afficher un message de confirmation"
      ]
    },
    {
      dayNumber: 16,
      weekNumber: 3,
      title: "Express - Premieres routes API REST (GET)",
      milestoneId: "m-06",
      objective: "Exposer une route HTTP pour envoyer du JSON au client.",
      durationMinutes: 120,
      subtasks: [
        "Déclarer une route GET /api/tasks",
        "Créer un tableau de tâches fictives (mock data) côté serveur",
        "Renvoyer les données au format JSON avec res.json()",
        "Tester la route via un navigateur ou Postman/Bruno"
      ]
    },
    {
      dayNumber: 17,
      weekNumber: 3,
      title: "Express - Création de données (POST) & Middlewares",
      milestoneId: "m-06",
      objective: "Recevoir des données du Front-End et les traiter sur le serveur.",
      durationMinutes: 120,
      subtasks: [
        "Ajouter le middleware Express app.use(express.json()) pour lire le corps des requêtes",
        "Déclarer la route POST /api/tasks",
        "Extraire req.body et ajouter la nouvelle tâche au tableau serveur",
        "Configurer les codes de statut HTTP appropriés (201 Created, 400 Bad Request)"
      ]
    },
    {
      dayNumber: 18,
      weekNumber: 3,
      title: "Express - Modification et Suppression (PUT & DELETE)",
      milestoneId: "m-07",
      objective: "Finaliser les routes CRUD avec paramètres d'URL.",
      durationMinutes: 120,
      subtasks: [
        "Créer la route PUT /api/tasks/:id pour mettre à jour le statut d'une tâche",
        "Créer la route DELETE /api/tasks/:id pour supprimer une tâche par son ID",
        "Utiliser req.params.id et manipuler les données serveur",
        "Valider l'ensemble du cycle CRUD avec un client HTTP (Postman/Bruno)"
      ]
    },
    {
      dayNumber: 19,
      weekNumber: 3,
      title: "Express - Validation des données entrantes",
      milestoneId: "m-07",
      objective: "Empêcher le serveur d'accepter des données corrompues ou incomplètes.",
      durationMinutes: 120,
      subtasks: [
        "Écrire un middleware personnalisé de validation des entrées (taskValidator)",
        "Vérifier que le titre existe, est une chaîne de caractères et ne dépasse pas 100 caractères",
        "Nettoyer les espaces inutiles (trim())",
        "Renvoyer une erreur 400 Bad Request structurée en cas de donnée invalide"
      ]
    },
    {
      dayNumber: 20,
      weekNumber: 3,
      title: "Backend - Interconnexion Front-End et Back-End",
      milestoneId: "m-07",
      objective: "Remplacer LocalStorage par des appels réseau fetch() vers l'API Express.",
      durationMinutes: 120,
      subtasks: [
        "Mettre en place cors (npm install cors) côté serveur pour autoriser les requêtes",
        "Modifier le script Front-End pour lire les tâches via fetch('http://localhost:3000/api/tasks')",
        "Convertir la création, modification et suppression en requêtes fetch() asynchrones (async/await)",
        "Gérer les états d'attente (loading) et les erreurs de réseau dans l'interface"
      ]
    },
    {
      dayNumber: 21,
      weekNumber: 3,
      title: "Semaine 3 - Audit IA sur l'architecture API",
      milestoneId: "m-07",
      objective: "Soumettre l'API REST à un contrôle de sécurité et de conformité RESTful par l'IA.",
      durationMinutes: 120,
      subtasks: [
        "Fournir le code de server.js à l'IA en demandant d'évaluer le respect des conventions REST",
        "Vérifier si l'IA décèle un manque de gestion d'erreurs asynchrones",
        "Corriger le code selon les recommandations pertinentes",
        "Tester le bon fonctionnement global de la chaîne Front-End <-> Back-End"
      ]
    },

    // Semaine 4
    {
      dayNumber: 22,
      weekNumber: 4,
      title: "BDD - Modélisation relationnelle & SQL de base",
      milestoneId: "m-08",
      objective: "Concevoir le schéma de la base de données PostgreSQL / SQLite pour l'application.",
      durationMinutes: 120,
      subtasks: [
        "Dessiner le schéma de la table tasks (id, title, description, is_completed, created_at)",
        "Écrire la requête SQL CREATE TABLE avec les contraintes appropriées (NOT NULL, DEFAULT)",
        "S'entraîner aux commandes SQL de base (INSERT INTO, SELECT * FROM, UPDATE, DELETE)",
        "Exécuter ces requêtes dans un client SQL (DBeaver ou interface CLI)"
      ]
    },
    {
      dayNumber: 23,
      weekNumber: 4,
      title: "BDD - Connexion Node.js à la base de données",
      milestoneId: "m-08",
      objective: "Connecter l'application Express à la base de données SQL via un pilote d'accès (pg ou better-sqlite3).",
      durationMinutes: 120,
      subtasks: [
        "Installer le module de connexion à la base de données",
        "Créer un fichier de configuration/pool de connexion (db.js)",
        "Tester la connexion au démarrage du serveur et gérer les erreurs d'initialisation",
        "Exécuter une requête simple SELECT NOW() pour valider la communication"
      ]
    },
    {
      dayNumber: 24,
      weekNumber: 4,
      title: "BDD - Migration du CRUD vers SQL (SELECT & INSERT)",
      milestoneId: "m-09",
      objective: "Remplacer le tableau en mémoire par de vraies requêtes SQL d'écriture et de lecture.",
      durationMinutes: 120,
      subtasks: [
        "Réécrire la route GET /api/tasks pour exécuter un SELECT * FROM tasks ORDER BY created_at DESC",
        "Réécrire la route POST /api/tasks avec une requête INSERT INTO tasks ...",
        "Utiliser impérativement des requêtes paramétrées ($1, $2) pour bloquer les injections SQL",
        "Vérifier que les nouvelles tâches apparaissent immédiatement en base de données"
      ]
    },
    {
      dayNumber: 25,
      weekNumber: 4,
      title: "BDD - Migration du CRUD vers SQL (UPDATE & DELETE)",
      milestoneId: "m-09",
      objective: "Finaliser la persistance SQL pour la mise à jour et la suppression.",
      durationMinutes: 120,
      subtasks: [
        "Réécrire la route PUT /api/tasks/:id avec une requête SQL UPDATE tasks SET ...",
        "Réécrire la route DELETE /api/tasks/:id avec une requête SQL DELETE FROM tasks WHERE ...",
        "Gérer le cas où l'ID demandé n'existe pas en BDD (renvoi d'un code HTTP 404 Not Found)",
        "Tester l'ensemble des fonctionnalités depuis l'interface web"
      ]
    },
    {
      dayNumber: 26,
      weekNumber: 4,
      title: "BDD - Fichiers de Seed et requêtes complexes",
      milestoneId: "m-09",
      objective: "Automatiser le remplissage de la base de données avec un jeu de données de test.",
      durationMinutes: 120,
      subtasks: [
        "Créer un script seed.sql insérant 10 tâches de démonstration",
        "Écrire des requêtes filtrées en SQL (WHERE is_completed = true, recherche par mot-clé avec LIKE)",
        "Automatiser l'exécution du script de Seed via une commande npm run seed",
        "Vérifier la cohérence des données chargées"
      ]
    },
    {
      dayNumber: 27,
      weekNumber: 4,
      title: "BDD - Transactions SQL & Gestion des erreurs",
      milestoneId: "m-09",
      objective: "Garantir l'intégrité des données en cas de panne réseau ou serveur.",
      durationMinutes: 120,
      subtasks: [
        "Envelopper les opérations sensibles dans un bloc try/catch",
        "Comprendre le principe des transactions SQL (BEGIN, COMMIT, ROLLBACK)",
        "Simuler une erreur de base de données pour vérifier la stabilité de l'API",
        "Vérifier qu'aucun crash du processus Node.js ne se produit lors d'une requête SQL erronée"
      ]
    },
    {
      dayNumber: 28,
      weekNumber: 4,
      title: "Semaine 4 - Audit IA Injections SQL & Optimisation",
      milestoneId: "m-09",
      objective: "Déceler intentionnellement des failles d'injection SQL dans du code généré par IA.",
      durationMinutes: 120,
      subtasks: [
        "Demander à l'IA d'écrire une requête de recherche SQL basée sur la concaténation de chaînes",
        "Analyser pourquoi ce code est vulnérable à une injection SQL",
        "Corriger le code en utilisant des requêtes paramétrées (prepared statements)",
        "Valider l'étanchéité complète de la couche d'accès aux données du Jalon 09"
      ]
    },

    // Semaine 5
    {
      dayNumber: 29,
      weekNumber: 5,
      title: "Sécurité - Modélisation de la table users",
      milestoneId: "m-10",
      objective: "Préparer la base de données pour accueillir des comptes utilisateurs.",
      durationMinutes: 120,
      subtasks: [
        "Créer la table SQL users (id, email UNIQUE, password_hash, created_at)",
        "Ajouter une clé étrangère user_id dans la table tasks pour lier chaque tâche à son propriétaire",
        "Mettre à jour le schéma et réexécuter les migrations/seeds",
        "Tester l'insertion manuelle d'un utilisateur en SQL"
      ]
    },
    {
      dayNumber: 30,
      weekNumber: 5,
      title: "Sécurité - Hachage des mots de passe avec BCrypt",
      milestoneId: "m-10",
      objective: "Sécuriser les mots de passe avant de les inscrire en base de données.",
      durationMinutes: 120,
      subtasks: [
        "Installer la bibliothèque bcrypt (npm install bcrypt)",
        "Écrire la route POST /api/auth/register",
        "Valider l'email et la complexité du mot de passe",
        "Hacher le mot de passe avec un grain de sel (salt factor = 10) et l'enregistrer en BDD"
      ]
    },
    {
      dayNumber: 31,
      weekNumber: 5,
      title: "Sécurité - Authentification & Génération de JWT",
      milestoneId: "m-10",
      objective: "Authentifier un utilisateur et lui délivrer un jeton sécurisé (JSON Web Token).",
      durationMinutes: 120,
      subtasks: [
        "Installer jsonwebtoken (npm install jsonwebtoken)",
        "Écrire la route POST /api/auth/login",
        "Comparer le mot de passe fourni avec le hash stocké via bcrypt.compare()",
        "Générer et renvoyer un token JWT contenant l'ID de l'utilisateur avec une durée d'expiration (ex: 24h)"
      ]
    },
    {
      dayNumber: 32,
      weekNumber: 5,
      title: "Sécurité - Middleware de vérification JWT",
      milestoneId: "m-11",
      objective: "Bloquer l'accès aux routes privées de l'API pour les utilisateurs non authentifiés.",
      durationMinutes: 120,
      subtasks: [
        "Écrire le middleware authenticateToken",
        "Extraire le jeton du header HTTP Authorization: Bearer <token>",
        "Vérifier la validité du token avec jwt.verify()",
        "Injecter l'utilisateur décodé dans req.user ou renvoyer un code HTTP 401 Unauthorized / 403 Forbidden"
      ]
    },
    {
      dayNumber: 33,
      weekNumber: 5,
      title: "Sécurité - Isolation des données par utilisateur",
      milestoneId: "m-11",
      objective: "Garantir qu'un utilisateur ne peut voir et modifier que ses propres tâches.",
      durationMinutes: 120,
      subtasks: [
        "Appliquer le middleware authenticateToken sur toutes les routes /api/tasks",
        "Modifier la requête GET /api/tasks -> WHERE user_id = req.user.id",
        "S'assurer que le user_id est automatiquement injecté lors du POST",
        "Vérifier que les requêtes PUT et DELETE contrôlent bien la propriété de la tâche (WHERE id = $1 AND user_id = $2)"
      ]
    },
    {
      dayNumber: 34,
      weekNumber: 5,
      title: "Sécurité - Protection XSS et Nettoyage des formulaires",
      milestoneId: "m-11",
      objective: "Neutraliser l'injection de scripts malveillants (Cross-Site Scripting).",
      durationMinutes: 120,
      subtasks: [
        "Comprendre le fonctionnement d'une attaque XSS stockée dans une carte de tâche",
        "Installer et configurer un module de désinfection des entrées HTML (ex: sanitize-html ou express-validator)",
        "Échapper systématiquement les caractères spéciaux à l'affichage côté Front-End (textContent vs innerHTML)",
        "Configurer les en-têtes HTTP de sécurité de base avec helmet (npm install helmet)"
      ]
    },
    {
      dayNumber: 35,
      weekNumber: 5,
      title: "Semaine 5 - Audit IA d'un module d'authentification",
      milestoneId: "m-11",
      objective: "Traquer les failles d'authentification et les fuites de jetons dans du code généré par IA.",
      durationMinutes: 120,
      subtasks: [
        "Soumettre à l'IA un script de connexion et identifier les éventuelles erreurs de sécurité",
        "Vérifier que les mots de passe ne sont jamais renvoyés dans les réponses JSON du serveur",
        "Migrer la clé secrète JWT vers une variable d'environnement .env",
        "Valider l'isolation complète des données entre deux comptes utilisateurs différents"
      ]
    },

    // Semaine 6
    {
      dayNumber: 36,
      weekNumber: 6,
      title: "Collaboration - Schéma de partage de tableaux",
      milestoneId: "m-12",
      objective: "Permettre l'invitation d'autres utilisateurs sur un tableau de tâches.",
      durationMinutes: 120,
      subtasks: [
        "Créer la table de jonction board_members (board_id, user_id, role)",
        "Écrire la route POST /api/boards/:id/members pour ajouter un collaborateur via son email",
        "Mettre à jour les politiques d'accès SQL pour autoriser la lecture aux membres enregistrés",
        "Tester l'ajout d'un second utilisateur sur un projet commun"
      ]
    },
    {
      dayNumber: 37,
      weekNumber: 6,
      title: "Architecture - Organisation MVC / Layered Architecture",
      milestoneId: "m-12",
      objective: "Structurer le code serveur selon les standards professionnels (Routes / Controllers / Services / Repositories).",
      durationMinutes: 120,
      subtasks: [
        "Découper server.js en plusieurs dossiers : /routes, /controllers, /services, /models",
        "Isoler la logique de gestion des requêtes dans les fichiers de contrôleurs (taskController.js)",
        "Isoler les requêtes SQL directes dans la couche d'accès aux données (taskModel.js)",
        "Vérifier que le serveur démarre et que toutes les routes restent fonctionnelles après la restructuration"
      ]
    },
    {
      dayNumber: 38,
      weekNumber: 6,
      title: "Architecture - Middleware centralisé de gestion d'erreurs",
      milestoneId: "m-12",
      objective: "Uniformiser les réponses d'erreur et éviter de divulguer l'empilement d'exécution (stack trace) au client.",
      durationMinutes: 120,
      subtasks: [
        "Écrire un middleware d'erreur global Express à 4 arguments (err, req, res, next)",
        "Définir une classe d'erreur personnalisée AppError avec codes d'état HTTP",
        "Remplacer les réponses d'erreur éparpillées par des appels à next(error)",
        "Vérifier qu'aucune information système sensible ne fuite dans les réponses client en production"
      ]
    },
    {
      dayNumber: 39,
      weekNumber: 6,
      title: "Front-End - Intégration de l'écran de connexion / inscription",
      milestoneId: "m-12",
      objective: "Construire l'interface d'authentification et gérer le stockage local du token JWT.",
      durationMinutes: 120,
      subtasks: [
        "Créer les vues HTML/CSS de connexion et d'inscription",
        "Traiter la soumission des formulaires et récupérer le token JWT renvoyé par l'API",
        "Stocker de manière sécurisée le jeton dans localStorage ou dans un cookie HTTP-Only",
        "Rediriger automatiquement l'utilisateur connecté vers le tableau de bord principal"
      ]
    },
    {
      dayNumber: 40,
      weekNumber: 6,
      title: "Front-End - Gestion des sessions et déconnexion",
      milestoneId: "m-12",
      objective: "Injecter le jeton JWT dans les en-têtes de chaque requête HTTP et gérer la déconnexion.",
      durationMinutes: 120,
      subtasks: [
        "Créer un utilitaire fetchWithAuth() injectant automatiquement le header Authorization",
        "Gérer l'expiration du token (redirection automatique vers l'écran de connexion si code 401)",
        "Ajouter un bouton de déconnexion effaçant le jeton stocké",
        "Valider l'expérience utilisateur complète de bout en bout"
      ]
    },
    {
      dayNumber: 41,
      weekNumber: 6,
      title: "Collaboration - Feed d'activité & Notifications",
      milestoneId: "m-12",
      objective: "Enregistrer et afficher l'historique des modifications apportées aux tâches.",
      durationMinutes: 120,
      subtasks: [
        "Créer la table activity_logs (id, task_id, user_id, action, created_at)",
        "Insérer une entrée de journal à chaque création/modification/suppression de tâche",
        "Créer un panneau latéral dans l'interface pour afficher l'historique d'activité",
        "Valider le bon enregistrement des actions en mode multi-utilisateurs"
      ]
    },
    {
      dayNumber: 42,
      weekNumber: 6,
      title: "Semaine 6 - Revue d'Architecture",
      milestoneId: "m-12",
      objective: "Vérifier le respect de la séparation des responsabilités et le découplage des composants.",
      durationMinutes: 120,
      subtasks: [
        "Inspecter l'arborescence des dossiers et vérifier qu'aucun contrôleur ne contient de SQL direct",
        "Vérifier que le code du Front-End est découpé en modules ES6 réutilisables",
        "Corriger les dépendances circulaires éventuelles",
        "Consolider la documentation interne de l'application"
      ]
    },

    // Semaine 7
    {
      dayNumber: 43,
      weekNumber: 7,
      title: "Test - Introduction aux tests unitaires avec Jest",
      milestoneId: "m-13",
      objective: "Automatiser la vérification de la logique métier du serveur.",
      durationMinutes: 120,
      subtasks: [
        "Installer Jest (npm install --save-dev jest) et configurer le script de test",
        "Écrire un premier test unitaire vérifiant la fonction de validation de titre de tâche",
        "Écrire des tests pour les fonctions de hachage et de vérification des mots de passe",
        "Exécuter les tests via la commande npm test et s'assurer qu'ils passent au vert"
      ]
    },
    {
      dayNumber: 44,
      weekNumber: 7,
      title: "Test - Tests d'intégration API avec Supertest",
      milestoneId: "m-13",
      objective: "Tester les routes HTTP de l'API REST de manière automatisée.",
      durationMinutes: 120,
      subtasks: [
        "Installer Supertest (npm install --save-dev supertest)",
        "Écrire un test d'intégration pour le parcours complet d'inscription et de connexion",
        "Tester la création d'une tâche via l'API et vérifier le code de retour 201 Created",
        "Valider le rejet d'une requête non authentifiée avec un code 401 Unauthorized"
      ]
    },
    {
      dayNumber: 45,
      weekNumber: 7,
      title: "Audit IA - Détection d'hallucinations de bibliothèques",
      milestoneId: "m-13",
      objective: "Apprendre à identifier et éliminer les dépendances fictives ou dépréciées suggérées par l'IA.",
      durationMinutes: 120,
      subtasks: [
        "Demander à l'IA de résoudre un problème d'optimisation en lui imposant des contraintes",
        "Vérifier chaque import / require dans le registre officiel npm (npmjs.com)",
        "Identifier les méthodes dépréciées ou inexistantes",
        "Remplacer le code défectueux par une implémentation standard et documentée"
      ]
    },
    {
      dayNumber: 46,
      weekNumber: 7,
      title: "Debug - Maîtrise du Débogueur Node.js (VS Code)",
      milestoneId: "m-13",
      objective: "Traquer un bogue complexe côté serveur sans utiliser de console.log().",
      durationMinutes: 120,
      subtasks: [
        "Configurer le fichier .vscode/launch.json pour le débogage de l'application Express",
        "Insérer des points d'arrêt sur les middlewares et les contrôleurs",
        "Inspecter la pile d'appels (call stack) et l'état des variables à la volée",
        "Identifier et résoudre un bogue introduit volontairement dans le traitement asynchrone"
      ]
    },
    {
      dayNumber: 47,
      weekNumber: 7,
      title: "Audit IA - Revue globale de sécurité du code (Static Analysis)",
      milestoneId: "m-13",
      objective: "Soumettre l'intégralité du dépôt à un audit de sécurité automatisé et assisté par l'IA.",
      durationMinutes: 120,
      subtasks: [
        "Exécuter npm audit pour identifier les vulnérabilités dans les packages tiers",
        "Soumettre la couche d'authentification et de BDD à une grille d'analyse OWASP Top 10",
        "Vérifier qu'aucune clé d'API ou secret n'est présent dans le code source",
        "Corriger l'ensemble des avertissements levés lors de l'audit"
      ]
    },
    {
      dayNumber: 48,
      weekNumber: 7,
      title: "Refactoring - Optimisation des performances",
      milestoneId: "m-13",
      objective: "Optimiser les temps de réponse de l'API et la vitesse d'affichage du Front-End.",
      durationMinutes: 120,
      subtasks: [
        "Indexer les colonnes fréquemment interrogées en base de données (CREATE INDEX)",
        "Minifier et optimiser le chargement des ressources CSS et JS",
        "Analyser les performances réseau via l'onglet Network des DevTools",
        "Vérifier la réduction des temps de latence sur les requêtes d'affichage du tableau"
      ]
    },
    {
      dayNumber: 49,
      weekNumber: 7,
      title: "Semaine 7 - Validation du protocole d'audit IA",
      milestoneId: "m-13",
      objective: "Formaliser sa grille personnelle de contrôle qualité du code généré par IA.",
      durationMinutes: 120,
      subtasks: [
        "Rédiger une checklist en 5 points de validation obligatoire de tout code produit par IA",
        "S'assurer que la couverture de tests automatisés protège les fonctions critiques",
        "Re-passer l'intégralité de la suite de tests (npm test)",
        "Valider la stabilité globale du système pour le Jalon 13"
      ]
    },

    // Semaine 8
    {
      dayNumber: 50,
      weekNumber: 8,
      title: "Déploiement - Gestion des variables d'environnement",
      milestoneId: "m-14",
      objective: "Préparer l'application à s'exécuter dans un environnement de production.",
      durationMinutes: 120,
      subtasks: [
        "Installer dotenv (npm install dotenv) et créer le fichier .env",
        "Isoler les variables sensibles (PORT, DATABASE_URL, JWT_SECRET, NODE_ENV)",
        "S'assurer que .env est bien listé dans le fichier .gitignore",
        "Créer un fichier .env.example de documentation sans valeurs confidentielles"
      ]
    },
    {
      dayNumber: 51,
      weekNumber: 8,
      title: "Déploiement - Configuration de la BDD en ligne",
      milestoneId: "m-14",
      objective: "Instancier une base de données PostgreSQL gérée dans le cloud (Render / Supabase / ElephantSQL).",
      durationMinutes: 120,
      subtasks: [
        "Créer un compte sur un service d'hébergement Cloud et instancier une base PostgreSQL",
        "Récupérer la chaîne de connexion sécurisée (DATABASE_URL)",
        "Exécuter les requêtes de structure (tables users, tasks, board_members) sur la BDD distante",
        "Tester la connexion à la BDD distante depuis l'environnement local via la variable d'environnement"
      ]
    },
    {
      dayNumber: 52,
      weekNumber: 8,
      title: "Déploiement - Hébergement de l'API Back-End (Render / Railway)",
      milestoneId: "m-14",
      objective: "Déployer le serveur Express en ligne avec HTTPS automatique.",
      durationMinutes: 120,
      subtasks: [
        "Relier le dépôt GitHub au service d'hébergement web (Render / Railway)",
        "Configurer la commande de build (npm install) et la commande de démarrage (npm start)",
        "Renseigner l'ensemble des variables d'environnement sur le tableau de bord de l'hébergeur",
        "Tester les requêtes HTTP sur l'URL publique fournie"
      ]
    },
    {
      dayNumber: 53,
      weekNumber: 8,
      title: "Déploiement - Hébergement du Front-End (Vercel / Netlify)",
      milestoneId: "m-14",
      objective: "Publier l'interface utilisateur web et la connecter à l'API en ligne.",
      durationMinutes: 120,
      subtasks: [
        "Mettre à jour les URLs d'appel fetch() pour pointer vers l'adresse de l'API en production",
        "Déployer l'interface web sur Vercel ou Netlify",
        "Configurer les règles CORS sur le Back-End pour n'autoriser que le domaine du Front-End",
        "Vérifier le bon chargement du site depuis une connexion externe ou un mobile"
      ]
    },
    {
      dayNumber: 54,
      weekNumber: 8,
      title: "Production - Recette globale et tests de charge",
      milestoneId: "m-14",
      objective: "Réaliser la recette fonctionnelle complète de l'application en ligne.",
      durationMinutes: 120,
      subtasks: [
        "Tester le parcours complet : Inscription -> Connexion -> Création -> Édition -> Suppression",
        "Tester l'isolation des données avec deux comptes différents créés en production",
        "Vérifier la persistance des données après un redémarrage du serveur distant",
        "Valider l'absence d'erreurs dans la console navigateur en environnement de production"
      ]
    },
    {
      dayNumber: 55,
      weekNumber: 8,
      title: "Documentation - Rédaction du README.md & Swagger/OpenAPI",
      milestoneId: "m-14",
      objective: "Documenter le projet au niveau d'exigence d'un portfolio professionnel.",
      durationMinutes: 120,
      subtasks: [
        "Rédiger un fichier README.md complet (présentation, captures, stack, installation)",
        "Documenter les points d'entrée de l'API REST (méthodes, routes, formats)",
        "Ajouter les badges de statut de build et de couverture de tests",
        "Rendre le dépôt GitHub public et mettre en valeur le lien de démo en ligne"
      ]
    },
    {
      dayNumber: 56,
      weekNumber: 8,
      title: "Bilan - Soutenance finale et évaluation des compétences",
      milestoneId: "m-14",
      objective: "Valider l'atteinte des objectifs d'apprentissage et archiver le projet dans Spectrum.",
      durationMinutes: 120,
      subtasks: [
        "Effectuer une démonstration complète des fonctionnalités de Task Master Pro",
        "Passer en revue la grille d'évaluation des compétences (HTML, CSS, JS, Node, SQL, Sécurité, IA)",
        "Enregistrer la vidéo de démonstration ou les captures d'écran finales dans le Carnet de Bord",
        "Passer le statut du projet Bento Task Master Pro à 100% (Terminé) dans Spectrum"
      ]
    }
  ]
};
