// Optional: run with `npm run prisma:seed` to create a demo user + a few
// transactions so the dashboard isn't empty on first login.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@finsense.app" },
    update: {},
    create: { name: "Demo User", email: "demo@finsense.app", passwordHash },
  });

  const food = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: "Food" } },
    update: {},
    create: { name: "Food", icon: "🍔", userId: user.id },
  });

  const transport = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: "Transport" } },
    update: {},
    create: { name: "Transport", icon: "🚗", userId: user.id },
  });

  await prisma.transaction.createMany({
    data: [
      { description: "Swiggy order", amount: 450, merchant: "Swiggy", userId: user.id, categoryId: food.id },
      { description: "Uber to college", amount: 180, merchant: "Uber", userId: user.id, categoryId: transport.id },
      { description: "Zomato dinner", amount: 620, merchant: "Zomato", userId: user.id, categoryId: food.id },
    ],
  });

  console.log("✅ Seeded demo user: demo@finsense.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
