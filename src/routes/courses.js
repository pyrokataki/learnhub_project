const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// 2. POST /api/courses/bulk - Insérer plusieurs cours
router.post('/bulk', async (req, res) => {
    const db = req.db;
    const courses = req.body.map(c => ({ 
        ...c, 
        instructorId: new ObjectId(c.instructorId),
        rating: { average: 0, count: 0 },
        isPublished: true,
        enrollmentCount: 0,
        createdAt: new Date() 
    }));
    const result = await db.collection('courses').insertMany(courses);
    res.status(201).json(result);
});

// GET /api/courses - Filtrer, trier et paginer
router.get('/', async (req, res) => {
    const db = req.db;
    const { category, sort, page = 1, limit = 10 } = req.query;
    const filter = category ? { category } : {};
    const sortOpt = sort ? { [sort]: 1 } : {};

    const courses = await db.collection('courses')
        .find(filter)
        .sort(sortOpt)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .toArray();
    res.json(courses);
});

// 4. DELETE /api/courses/:id — Suppression cascade
router.delete('/:id', async (req, res) => {
    const db = req.db;
    const id = new ObjectId(req.params.id);

    // 1. Supprimer le cours
    const result = await db.collection('courses').deleteOne({ _id: id });
    if (result.deletedCount === 0) return res.status(404).send("Cours non trouvé");

    // 2. Supprimer les leçons
    await db.collection('lessons').deleteMany({ courseId: id });

    // 3. Supprimer les reviews
    await db.collection('reviews').deleteMany({ courseId: id });

    // 4. Annuler les inscriptions
    await db.collection('enrollments').updateMany({ courseId: id }, { $set: { status: "cancelled", cancelledAt: new Date() } });

    res.json({ message: "Suppression en cascade terminée" });
});

module.exports = router;
