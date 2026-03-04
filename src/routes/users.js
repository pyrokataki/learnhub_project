const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// 1. POST /api/users - Création simple
router.post('/', async (req, res) => {
    const db = req.db;
    const user = { ...req.body, createdAt: new Date(), lastLoginAt: new Date(), isActive: true, totalCoursesEnrolled: 0 };
    const result = await db.collection('users').insertOne(user);
    res.status(201).json(result);
});

// GET /api/users/:id - Récupérer un utilisateur
router.get('/:id', async (req, res) => {
    const db = req.db;
    const result = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
});

// 5. GET /api/users/:id/dashboard — Dashboard utilisateur
router.get('/:id/dashboard', async (req, res) => {
    const db = req.db;
    const id = new ObjectId(req.params.id);

    // • findOne → l'utilisateur (avec projection)
    const user = await db.collection('users').findOne({ _id: id }, { projection: { firstName: 1, lastName: 1, role: 1, profile: 1 } });
    if (!user) return res.status(404).send("User non trouvé");

    // • find → ses inscriptions actives
    const enrollments = await db.collection('enrollments').find({ userId: id, status: "active" }).toArray();

    // • find → ses avis (tri par date, limit)
    const reviews = await db.collection('reviews').find({ userId: id }).sort({ createdAt: -1 }).limit(5).toArray();

    // • Assembler
    res.json({
        user,
        activeEnrollments: enrollments,
        recentReviews: reviews
    });
});

// PUT /api/users/:id/profile - Upsert profil
router.put('/:id/profile', async (req, res) => {
    const db = req.db;
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { profile: req.body } },
        { upsert: true }
    );
    res.json(result);
});

module.exports = router;
