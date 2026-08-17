const { PrismaClient } = require("@prisma/client");

// A single shared Prisma instance (best practice — avoids exhausting
// the Postgres connection pool by creating a new client per request).
const prisma = new PrismaClient();

module.exports = prisma;
