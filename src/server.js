const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'learnhub';

app.use(express.json());

let db;

async function connectToMongo() {
    try {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        db = client.db(dbName);
        console.log('Connecté à MongoDB');
    } catch (err) {
        console.error('Erreur de connexion à MongoDB', err);
        process.exit(1);
    }
}

// Middleware pour injecter la base de données dans les requêtes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// --- Routes ---
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const enrollmentsRoutes = require('./routes/enrollments');
const reviewsRoutes = require('./routes/reviews');

app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/reviews', reviewsRoutes);

// --- Démarrage du serveur ---
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    connectToMongo();
});
