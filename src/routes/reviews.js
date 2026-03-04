const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// 2. POST /api/reviews — Laisser un avis
router.post('/', async (req, res) => {
    const { userId, courseId, rating, title, comment } = req.body;
    const db = req.db;

    // 1. Vérifier l'inscription au cours
    const enrollment = await db.collection('enrollments').findOne({ userId: new ObjectId(userId), courseId: new ObjectId(courseId) });
    if (!enrollment) return res.status(403).send("Inscription requise pour donner un avis");

    // 2. Vérifier pas de doublon d'avis
    const exists = await db.collection('reviews').findOne({ userId: new ObjectId(userId), courseId: new ObjectId(courseId) });
    if (exists) return res.status(400).send("Vous avez déjà donné votre avis");

    // 3. Créer la review
    const review = {
        userId: new ObjectId(userId),
        courseId: new ObjectId(courseId),
        rating: parseInt(rating),
        title,
        comment,
        isVerified: enrollment.status === "completed",
        helpfulCount: 0,
        createdAt: new Date()
    };
    await db.collection('reviews').insertOne(review);

    // 4. Recalculer la moyenne du cours
    const reviews = await db.collection('reviews').find({ courseId: new ObjectId(courseId) }).toArray();
    const average = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await db.collection('courses').updateOne(
        { _id: new ObjectId(courseId) },
        { $set: { "rating.average": parseFloat(average.toFixed(1)) }, $inc: { "rating.count": 1 } }
    );

    res.status(201).json(review);
});

module.exports = router;
