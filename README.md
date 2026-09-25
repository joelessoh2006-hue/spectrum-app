# Spectrum

Application web personnelle d’organisation du temps et des projets, conçue d’abord pour répondre à mon propre fonctionnement. Le dépôt partage le code source du projet; les données et les workflows sont personnels et ne sont pas présentés comme une solution généralisée au grand public.

## Fonctionnalités

- Organisation par domaines, projets et objectifs mensuels
- Tâches flexibles pouvant être planifiées ensuite dans l’agenda
- Calendrier mensuel et emploi du temps journalier
- Import d’événements depuis des fichiers de calendrier `.ics`
- Connexion Google ou session invitée
- Persistance locale dans le navigateur et synchronisation des données utilisateur avec Cloud Firestore
- Minuteur de concentration et prise en charge de l’installation comme application web progressive (PWA)

## Technologies

- React, TypeScript et Vite
- Firebase Authentication et Cloud Firestore
- Stockage local du navigateur
- API Web Audio et PWA

Les règles Firestore du dépôt limitent l’accès aux données aux comptes concernés. Pour toute nouvelle configuration Firebase, vérifiez les règles avant de déployer l’application et utilisez des données de test plutôt que des informations personnelles.

## Lancer le projet

Prérequis : Bun et Node.js.

```bash
bun install
bun run dev
```

Pour générer la version de production :

```bash
bun run build
```

Les workflows de l’application reflètent un besoin personnel d’organisation; le projet est partagé ici sous forme de code source.
