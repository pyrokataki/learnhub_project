// 2.1 — Opérations CRUD 

// 1 - Insérer un nouvel utilisateur (étudiant)
db.users.insertOne({
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@learnhub.com",
    role: "student",
    profile: { bio: "Passionné web", avatar: "https://ali.com/avatar.jpg", city: "Lyon", country: "France" },
    skills: ["HTML", "CSS"],
    isActive: true,
    totalCoursesEnrolled: 0,
    createdAt: new Date(),
    lastLoginAt: new Date()
});

// 2 - Insérer 3 nouveaux cours
db.courses.insertMany([
    { title: "Masterclass CSS", instructorId: db.users.findOne({ role: "instructor" })._id, category: "Web", difficulty: "intermediate", price: 29.99, tags: ["css"], metadata: { duration: 120, totalLessons: 5, language: "fr" }, rating: { average: 0, count: 0 }, isPublished: true, enrollmentCount: 0, createdAt: new Date() },
    { title: "Rust Intro", instructorId: db.users.findOne({ role: "instructor" })._id, category: "Web", difficulty: "beginner", price: 59.99, tags: ["rust"], metadata: { duration: 300, totalLessons: 10, language: "fr" }, rating: { average: 0, count: 0 }, isPublished: true, enrollmentCount: 0, createdAt: new Date() },
    { title: "Algo Avancé", instructorId: db.users.findOne({ role: "instructor" })._id, category: "AI", difficulty: "advanced", price: 89.99, tags: ["algo"], metadata: { duration: 450, totalLessons: 15, language: "fr" }, rating: { average: 0, count: 0 }, isPublished: true, enrollmentCount: 0, createdAt: new Date() }
]);

// 3 - Modifier la ville d'un utilisateur
db.users.updateOne({ email: "jean.dupont@learnhub.com" }, { $set: { "profile.city": "Bordeaux" } });

// 4 - Incrémenter le compteur d'inscriptions d'un cours
db.courses.updateOne({ title: "Masterclass CSS" }, { $inc: { enrollmentCount: 1 } });

// 5 - Ajouter un skill à un utilisateur
db.users.updateOne({ email: "jean.dupont@learnhub.com" }, { $push: { skills: "JavaScript" } });

// 6 - Retirer un tag d'un cours
db.courses.updateOne({ title: "Masterclass CSS" }, { $pull: { tags: "css" } });

// 7 - Désactiver les utilisateurs inactifs depuis 6 mois
db.users.updateMany({ lastLoginAt: { $lt: new Date(new Date().setMonth(new Date().getMonth() - 6)) } }, { $set: { isActive: false } });

// 8 - Upsert : Créer ou mettre à jour un profil
db.users.updateOne({ email: "expert.mongo@learnhub.com" }, { $set: { firstName: "Expert", role: "instructor", isActive: true } }, { upsert: true });

// 9 - Supprimer une review par son ID
db.reviews.deleteOne({ _id: db.reviews.findOne()._id });

// 10 - Supprimer les inscriptions "cancelled"
db.enrollments.deleteMany({ status: "cancelled" });

// 2.2 — Requêtes de Sélection

// 11 - Cours entre 20€ et 80€
db.courses.find({ price: { $gte: 20, $lte: 80 } });

// 12 - Catégories "Database" ou "Web"
db.courses.find({ category: { $in: ["Database", "Web"] } });

// 13 - Difficulté non "advanced"
db.courses.find({ difficulty: { $ne: "advanced" } });

// 14 - Utilisateurs actifs ET étudiants
db.users.find({ isActive: true, role: "student" });

// 15 - Cours gratuits OU note ≥ 4.5
db.courses.find({ $or: [{ price: 0 }, { "rating.average": { $gte: 4.5 } }] });

// 16 - Reviews avec updatedAt existant
db.reviews.find({ updatedAt: { $exists: true, $ne: null } });

// 17 - Utilisateurs à Paris
db.users.find({ "profile.city": "Paris" });

// 18 - Cours publiés avec note ≥ 4
db.courses.find({ $and: [{ isPublished: true }, { "rating.average": { $gte: 4 } }] });

// 19 - Inscriptions non "cancelled" ni "paused"
db.enrollments.find({ status: { $nin: ["cancelled", "paused"] } });

// 20 - Titre et prix uniquement
db.courses.find({}, { title: 1, price: 1, _id: 0 });

// 21 - Utilisateurs sans le profil
db.users.find({}, { profile: 0 });

// 22 - Top 5 des cours les mieux notés
db.courses.find().sort({ "rating.average": -1 }).limit(5);

// 23 - Cours par prix croissant
db.courses.find().sort({ price: 1 });

// 24 -Page 2 des cours (10 par page)
db.courses.find().skip(10).limit(10);

// 25 - Nombre de cours publiés
db.courses.countDocuments({ isPublished: true });

// 2.3 — Requêtes Métier 

// 26 - Inscription (Directe)
db.enrollments.insertOne({ userId: db.users.findOne({role:"student"})._id, courseId: db.courses.findOne({isPublished:true})._id, status: "active", progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() }, payment: { amount: 49.99, method: "card", paidAt: new Date() }, enrolledAt: new Date() });
db.users.updateOne({ _id: db.users.findOne({role:"student"})._id }, { $inc: { totalCoursesEnrolled: 1 } });
db.courses.updateOne({ _id: db.courses.findOne({isPublished:true})._id }, { $inc: { enrollmentCount: 1 } });

// 27 - Catalogue Web filtré et trié
db.courses.find({ category: "Web", isPublished: true, price: { $lt: 70 }, "rating.average": { $gte: 4 } }, { title: 1, price: 1, "rating.average": 1, _id: 0 }).sort({ enrollmentCount: -1 }).limit(10);

// 28 - Progression : Marquer leçon complétée
db.enrollments.updateOne({ status: "active" }, { $push: { "progress.completedLessons": db.lessons.findOne()._id }, $set: { "progress.percentage": 50, "progress.lastAccessedAt": new Date() } });

// 29 - Cascade : Supprimer un cours et ses données
db.lessons.deleteMany({ courseId: db.courses.findOne()._id });
db.reviews.deleteMany({ courseId: db.courses.findOne()._id });
db.enrollments.updateMany({ courseId: db.courses.findOne()._id }, { $set: { status: "cancelled" } });
db.courses.deleteOne({ _id: db.courses.findOne()._id });

// 30 - Dashboard Express
db.users.findOne({ role: "student" });
db.enrollments.find({ userId: db.users.findOne({ role: "student" })._id, status: "active" }).toArray();
db.reviews.find({ userId: db.users.findOne({ role: "student" })._id }).sort({ createdAt: -1 }).limit(3).toArray();
