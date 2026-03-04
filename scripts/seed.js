// seed.js - Script pour initialiser la base de données MongoDB "learnhub"
// Utilisation : mongosh "mongodb://localhost:27017" seed.js

// --- Configuration ---
const dbName = 'learnhub';
const db = db.getSiblingDB(dbName);

// --- Nettoyage des collections ---
print(`Nettoyage de la base de données "${dbName}"...`);
db.users.drop();
db.courses.drop();
db.lessons.drop();
db.enrollments.drop();
db.reviews.drop();
print("Collections nettoyées.");

// --- Données de base pour la génération ---
const firstNames = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"];
const lastNames = ["Martin", "Dubois", "Bernard", "Thomas", "Robert", "Richard", "Petit", "Durand"];
const cities = ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"];
const skills = ["JavaScript", "Python", "MongoDB", "React", "Node.js", "Docker", "AWS", "HTML/CSS"];
const categories = ["Database", "Web", "Mobile", "DevOps", "AI"];
const difficulties = ["beginner", "intermediate", "advanced"];
const lessonTypes = ["video", "text", "quiz"];
const paymentMethods = ["card", "paypal"];

// --- Fonctions utilitaires ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, size) => arr.sort(() => 0.5 - Math.random()).slice(0, size);
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

print(`--- Initialisation de la base de données "${dbName}" ---`);

// 1. Création des utilisateurs (20)
const users = [];
for (let i = 0; i < 20; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    users.push({
        firstName: firstName,
        lastName: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@learnhub.com`,
        role: i < 5 ? 'instructor' : 'student',
        profile: {
            bio: `Biographie de ${firstName}`,
            avatar: "https://example.com/avatar.jpg",
            city: getRandomElement(cities),
            country: "France"
        },
        skills: getRandomSubset(skills, Math.floor(Math.random() * 4) + 1),
        isActive: true,
        totalCoursesEnrolled: 0,
        createdAt: getRandomDate(new Date(2023, 0, 1), new Date()),
        lastLoginAt: getRandomDate(new Date(2024, 0, 1), new Date())
    });
}
const userResults = db.users.insertMany(users);
const userIds = Object.values(userResults.insertedIds);
print(`Collection "users" créée avec ${userIds.length} documents.`);

// 2. Création des cours (15)
const instructors = db.users.find({ role: 'instructor' }).toArray();
const instructorIds = instructors.map(u => u._id);
const courses = [];
for (let i = 0; i < 15; i++) {
    courses.push({
        title: `Cours ${i + 1}: ${getRandomElement(skills)}`,
        description: `Description détaillée du cours ${i + 1}.`,
        instructorId: getRandomElement(instructorIds),
        category: getRandomElement(categories),
        difficulty: getRandomElement(difficulties),
        price: parseFloat((Math.random() * 100).toFixed(2)),
        tags: getRandomSubset(skills, 3),
        metadata: {
            duration: Math.floor(Math.random() * 200) + 60,
            totalLessons: 0, // Sera mis à jour
            language: "fr"
        },
        rating: { average: 0, count: 0 },
        isPublished: true,
        enrollmentCount: 0, // Sera mis à jour
        createdAt: getRandomDate(new Date(2023, 6, 1), new Date()),
        updatedAt: new Date()
    });
}
const courseResults = db.courses.insertMany(courses);
const courseIds = Object.values(courseResults.insertedIds);
print(`Collection "courses" créée avec ${courseIds.length} documents.`);

// 3. Création des leçons (30)
const lessons = [];
courseIds.forEach(courseId => {
    const numLessons = Math.floor(Math.random() * 3) + 2; // 2 à 4 leçons par cours
    for (let i = 1; i <= numLessons; i++) {
        lessons.push({
            courseId: courseId,
            title: `Leçon ${i} du cours`,
            content: `Contenu de la leçon ${i}.`,
            type: getRandomElement(lessonTypes),
            order: i,
            duration: Math.floor(Math.random() * 30) + 10,
            resources: [
                { name: "Slides PDF", url: "https://example.com/slides.pdf" },
                { name: "Code Source", url: "https://example.com/code.zip" }
            ],
            isFree: Math.random() > 0.8,
            createdAt: new Date()
        });
    }
    db.courses.updateOne({ _id: courseId }, { $set: { "metadata.totalLessons": numLessons } });
});
const lessonResults = db.lessons.insertMany(lessons);
print(`Collection "lessons" créée avec ${lessons.length} documents.`);

// 4. Création des inscriptions (25)
const students = db.users.find({ role: 'student' }).toArray();
const studentIds = students.map(s => s._id);
const enrollments = [];
const enrolledPairs = new Set();

while (enrollments.length < 25) {
    const studentId = getRandomElement(studentIds);
    const courseId = getRandomElement(courseIds);
    const pair = `${studentId}-${courseId}`;

    if (!enrolledPairs.has(pair)) {
        const course = db.courses.findOne({ _id: courseId });
        const courseLessons = db.lessons.find({ courseId: courseId }).toArray().map(l => l._id);
        const completedLessons = getRandomSubset(courseLessons, Math.floor(Math.random() * courseLessons.length));
        
        enrollments.push({
            userId: studentId,
            courseId: courseId,
            status: completedLessons.length === courseLessons.length ? "completed" : "active",
            progress: {
                completedLessons: completedLessons,
                percentage: Math.round((completedLessons.length / courseLessons.length) * 100),
                lastAccessedAt: new Date()
            },
            payment: {
                amount: course.price,
                method: getRandomElement(paymentMethods),
                paidAt: new Date()
            },
            enrolledAt: new Date(),
            completedAt: completedLessons.length === courseLessons.length ? new Date() : null
        });
        enrolledPairs.add(pair);
        db.users.updateOne({ _id: studentId }, { $inc: { totalCoursesEnrolled: 1 } });
        db.courses.updateOne({ _id: courseId }, { $inc: { enrollmentCount: 1 } });
    }
}
const enrollmentResults = db.enrollments.insertMany(enrollments);
print(`Collection "enrollments" créée avec ${enrollments.length} documents.`);

// 5. Création des avis (20)
const reviews = [];
const validEnrollments = db.enrollments.find().limit(20).toArray();

validEnrollments.forEach(enrollment => {
    const rating = Math.floor(Math.random() * 5) + 1;
    reviews.push({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        rating: rating,
        title: "Excellent cours !",
        comment: "Très bien expliqué, les exercices sont utiles.",
        isVerified: enrollment.status === "completed",
        helpfulCount: Math.floor(Math.random() * 15),
        createdAt: new Date(),
        updatedAt: null
    });
    db.courses.updateOne(
        { _id: enrollment.courseId },
        [
            { $set: { 
                "rating.count": { $add: ["$rating.count", 1] },
                "rating.average": { 
                    $divide: [
                        { $add: [ { $multiply: ["$rating.average", "$rating.count"] }, rating ] },
                        { $add: ["$rating.count", 1] }
                    ]
                }
            }}
        ]
    );
});
const reviewResults = db.reviews.insertMany(reviews);
print(`Collection "reviews" créée avec ${reviews.length} documents.`);

print(`--- Seeding de la base de données "${dbName}" terminé avec succès ---`);
