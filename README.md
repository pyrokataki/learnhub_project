# Projet MongoDB - LearnHub API

Ce projet est une plateforme d'e-learning complète avec une base de données MongoDB et une API REST Node.js/Express.

## 📂 Structure du projet

```
mongodb_exam/
├── src/                # Code source de l'API
│   ├── routes/         # Endpoints par collection
│   └── server.js       # Point d'entrée du serveur
├── scripts/            # Scripts MongoDB
│   ├── seed.js         # Initialisation de la base
│   └── queries.mongosh.js # Requêtes de test Phase 2
├── tests/              # Fichiers de test API
│   └── api_tests_simple.txt
├── package.json        # Configuration et dépendances
└── README.md
```

## 🌐 Phase 3: API REST

L'API expose les fonctionnalités via HTTP.

### Installation
```bash
npm install
```

### Démarrage
```bash
# Mode production
npm start

# Mode développement (auto-reload)
npm run dev
```
Le serveur tourne sur `http://localhost:3000`.

### Endpoints principaux
- `POST /api/users` : Créer un utilisateur
- `GET /api/users/:id/dashboard` : Dashboard complet
- `POST /api/courses/bulk` : Ajout de cours en masse
- `POST /api/enrollments` : Inscription avec vérifications
- `POST /api/reviews` : Laisser un avis avec recalcul de moyenne
- `PATCH /api/enrollments/:id/progress` : Suivi de progression automatique
- `DELETE /api/courses/:id` : Suppression en cascade
