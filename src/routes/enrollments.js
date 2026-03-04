const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// 1. POST /api/enrollments — Inscrire un utilisateur
router.post('/', async (req, res) => {
    const { userId, courseId } = req.body;
    const db = req.db;

    // 1. Vérifier utilisateur
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).send("User non trouvé");

    // 2. Vérifier cours publié
    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId), isPublished: true });
    if (!course) return res.status(404).send("Cours non trouvé ou non publié");

    // 3. Vérifier doublon
    const exists = await db.collection('enrollments').findOne({ userId: new ObjectId(userId), courseId: new ObjectId(courseId) });
    if (exists) return res.status(400).send("Déjà inscrit");

    // 4. Créer inscription
    const enrollment = {
        userId: new ObjectId(userId),
        courseId: new ObjectId(courseId),
        status: "active",
        progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() },
        payment: { amount: course.price, method: "card", paidAt: new Date() },
        enrolledAt: new Date()
    };
    await db.collection('enrollments').insertOne(enrollment);

    // 5 & 6. Incrémenter les compteurs
    await db.collection('courses').updateOne({ _id: new ObjectId(courseId) }, { $inc: { enrollmentCount: 1 } });
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $inc: { totalCoursesEnrolled: 1 } });

    res.status(201).json(enrollment);
});

// 3. PATCH /api/enrollments/:id/progress — Marquer une leçon complétée
router.patch('/:id/progress', async (req, res) => {
    const { lessonId } = req.body;
    const db = req.db;

    // 1. Vérifier inscription
    const enrollment = await db.collection('enrollments').findOne({ _id: new ObjectId(req.params.id) });
    if (!enrollment) return res.status(404).send("Inscription non trouvée");

    // 2. Ajouter leçon complétée
    if (enrollment.progress.completedLessons.some(id => id.toString() === lessonId)) {
        return res.status(400).send("Leçon déjà complétée");
    }

    const course = await db.collection('courses').findOne({ _id: enrollment.courseId });
    const total = course.metadata.totalLessons;
    const completedCount = enrollment.progress.completedLessons.length + 1;
    const percentage = Math.round((completedCount / total) * 100);

    // 3 & 4. Mise à jour progression et statut
    const updateData = {
        $push: { "progress.completedLessons": new ObjectId(lessonId) },
        $set: { 
            "progress.percentage": percentage,
            "progress.lastAccessedAt": new Date()
        }
    };

    if (percentage === 100) {
        updateData.$set.status = "completed";
        updateData.$set.completedAt = new Date();
    }

    await db.collection('enrollments').updateOne({ _id: new ObjectId(req.params.id) }, updateData);
    res.json({ message: "Progression mise à jour", percentage });
});

module.exports = router;
