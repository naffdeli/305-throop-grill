import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString("hex");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: Seed script should not run in production!");
    console.error("Set NODE_ENV to 'development' or 'test' to run this script.");
    process.exit(1);
  }

  console.log("Seeding database...");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || generateSecurePassword();
  const staffPassword = process.env.SEED_STAFF_PASSWORD || generateSecurePassword();

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedStaffPassword = await bcrypt.hash(staffPassword, 10);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@305throop.com",
        name: "Admin User",
        passwordHash: hashedAdminPassword,
        role: "ADMIN",
      },
      {
        email: "cashier@305throop.com",
        name: "Cashier Staff",
        passwordHash: hashedStaffPassword,
        role: "CASHIER",
      },
      {
        email: "kitchen@305throop.com",
        name: "Kitchen Staff",
        passwordHash: hashedStaffPassword,
        role: "KITCHEN",
      },
    ],
    skipDuplicates: true,
  });

  if (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_STAFF_PASSWORD) {
    console.log("\n========================================");
    console.log("GENERATED CREDENTIALS (save these!):");
    console.log("========================================");
    console.log(`Admin (admin@305throop.com): ${adminPassword}`);
    console.log(`Staff (cashier@305throop.com, kitchen@305throop.com): ${staffPassword}`);
    console.log("========================================\n");
    console.log("To set custom passwords, use environment variables:");
    console.log("  SEED_ADMIN_PASSWORD=your_admin_password");
    console.log("  SEED_STAFF_PASSWORD=your_staff_password");
    console.log("");
  } else {
    console.log("Created staff users with provided passwords");
  }

  const appetizers = await prisma.category.create({
    data: {
      name: "Appetizers",
      description: "Start your meal right",
      sortOrder: 1,
    },
  });

  const burgers = await prisma.category.create({
    data: {
      name: "Burgers",
      description: "Handcrafted grill favorites",
      sortOrder: 2,
    },
  });

  const sandwiches = await prisma.category.create({
    data: {
      name: "Sandwiches",
      description: "Classic deli favorites",
      sortOrder: 3,
    },
  });

  const sides = await prisma.category.create({
    data: {
      name: "Sides",
      description: "Perfect additions",
      sortOrder: 4,
    },
  });

  const drinks = await prisma.category.create({
    data: {
      name: "Drinks",
      description: "Refreshing beverages",
      sortOrder: 5,
    },
  });

  const classicBurger = await prisma.menuItem.create({
    data: {
      name: "Classic Burger",
      description: "Juicy beef patty with lettuce, tomato, onion on a brioche bun",
      price: 9.99,
      categoryId: burgers.id,
      preparationTime: 12,
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Patty Size",
      menuItemId: classicBurger.id,
      selectionType: "SINGLE",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 0,
      modifiers: {
        create: [
          { name: "Single", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Double", priceAdjustment: 3.00, sortOrder: 1 },
          { name: "Triple", priceAdjustment: 5.00, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Cheese",
      menuItemId: classicBurger.id,
      selectionType: "SINGLE",
      isRequired: false,
      sortOrder: 1,
      modifiers: {
        create: [
          { name: "No Cheese", priceAdjustment: 0, sortOrder: 0 },
          { name: "American", priceAdjustment: 0.75, isDefault: true, sortOrder: 1 },
          { name: "Cheddar", priceAdjustment: 0.75, sortOrder: 2 },
          { name: "Swiss", priceAdjustment: 0.75, sortOrder: 3 },
          { name: "Pepper Jack", priceAdjustment: 0.75, sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Toppings",
      menuItemId: classicBurger.id,
      selectionType: "MULTIPLE",
      isRequired: false,
      minSelections: 0,
      maxSelections: 6,
      sortOrder: 2,
      modifiers: {
        create: [
          { name: "Lettuce", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Tomato", priceAdjustment: 0, isDefault: true, sortOrder: 1 },
          { name: "Onion", priceAdjustment: 0, isDefault: true, sortOrder: 2 },
          { name: "Pickles", priceAdjustment: 0, sortOrder: 3 },
          { name: "Jalapenos", priceAdjustment: 0.50, sortOrder: 4 },
          { name: "Bacon", priceAdjustment: 1.50, sortOrder: 5 },
          { name: "Fried Egg", priceAdjustment: 1.00, sortOrder: 6 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Cooking Level",
      menuItemId: classicBurger.id,
      selectionType: "SINGLE",
      isRequired: true,
      sortOrder: 3,
      modifiers: {
        create: [
          { name: "Medium Rare", priceAdjustment: 0, sortOrder: 0 },
          { name: "Medium", priceAdjustment: 0, isDefault: true, sortOrder: 1 },
          { name: "Medium Well", priceAdjustment: 0, sortOrder: 2 },
          { name: "Well Done", priceAdjustment: 0, sortOrder: 3 },
        ],
      },
    },
  });

  const bbqBurger = await prisma.menuItem.create({
    data: {
      name: "BBQ Bacon Burger",
      description: "Topped with crispy bacon, cheddar, onion rings and BBQ sauce",
      price: 12.99,
      categoryId: burgers.id,
      preparationTime: 15,
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Size",
      menuItemId: bbqBurger.id,
      selectionType: "SINGLE",
      isRequired: true,
      modifiers: {
        create: [
          { name: "Regular", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Large", priceAdjustment: 2.50, sortOrder: 1 },
        ],
      },
    },
  });

  const grilledChicken = await prisma.menuItem.create({
    data: {
      name: "Grilled Chicken Sandwich",
      description: "Marinated chicken breast with avocado and chipotle mayo",
      price: 10.99,
      categoryId: sandwiches.id,
      preparationTime: 12,
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Bread",
      menuItemId: grilledChicken.id,
      selectionType: "SINGLE",
      isRequired: true,
      modifiers: {
        create: [
          { name: "Brioche Bun", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Ciabatta", priceAdjustment: 0.50, sortOrder: 1 },
          { name: "Whole Wheat", priceAdjustment: 0, sortOrder: 2 },
          { name: "Lettuce Wrap (GF)", priceAdjustment: 0, sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Philly Cheesesteak",
      description: "Shaved ribeye with peppers, onions and melted provolone",
      price: 11.99,
      categoryId: sandwiches.id,
      preparationTime: 10,
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Wings",
      description: "Crispy fried wings with your choice of sauce",
      price: 8.99,
      categoryId: appetizers.id,
      preparationTime: 12,
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Loaded Nachos",
      description: "Tortilla chips with cheese, beans, jalapenos and sour cream",
      price: 7.99,
      categoryId: appetizers.id,
      preparationTime: 8,
    },
  });

  const fries = await prisma.menuItem.create({
    data: {
      name: "Fries",
      description: "Golden crispy french fries",
      price: 3.99,
      categoryId: sides.id,
      preparationTime: 5,
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Size",
      menuItemId: fries.id,
      selectionType: "SINGLE",
      isRequired: true,
      modifiers: {
        create: [
          { name: "Regular", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Large", priceAdjustment: 1.50, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Seasoning",
      menuItemId: fries.id,
      selectionType: "SINGLE",
      isRequired: false,
      modifiers: {
        create: [
          { name: "Regular Salt", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Cajun", priceAdjustment: 0, sortOrder: 1 },
          { name: "Garlic Parmesan", priceAdjustment: 0.50, sortOrder: 2 },
          { name: "Truffle", priceAdjustment: 1.50, sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Onion Rings",
      description: "Beer-battered crispy onion rings",
      price: 4.99,
      categoryId: sides.id,
      preparationTime: 6,
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Coleslaw",
      description: "Creamy house-made coleslaw",
      price: 2.99,
      categoryId: sides.id,
      preparationTime: 2,
    },
  });

  const fountainDrink = await prisma.menuItem.create({
    data: {
      name: "Fountain Drink",
      description: "Coca-Cola, Sprite, or Fanta",
      price: 2.49,
      categoryId: drinks.id,
      preparationTime: 1,
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Size",
      menuItemId: fountainDrink.id,
      selectionType: "SINGLE",
      isRequired: true,
      modifiers: {
        create: [
          { name: "Small", priceAdjustment: 0, sortOrder: 0 },
          { name: "Medium", priceAdjustment: 0.50, isDefault: true, sortOrder: 1 },
          { name: "Large", priceAdjustment: 1.00, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: "Ice",
      menuItemId: fountainDrink.id,
      selectionType: "SINGLE",
      isRequired: false,
      modifiers: {
        create: [
          { name: "Regular Ice", priceAdjustment: 0, isDefault: true, sortOrder: 0 },
          { name: "Light Ice", priceAdjustment: 0, sortOrder: 1 },
          { name: "No Ice", priceAdjustment: 0, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Iced Tea",
      description: "Fresh brewed sweetened or unsweetened",
      price: 2.49,
      categoryId: drinks.id,
      preparationTime: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Lemonade",
      description: "House-made fresh lemonade",
      price: 2.99,
      categoryId: drinks.id,
      preparationTime: 2,
    },
  });

  await prisma.inventory.createMany({
    data: [
      { name: "Beef Patties", quantity: 100, unit: "patties", minThreshold: 20 },
      { name: "Brioche Buns", quantity: 80, unit: "buns", minThreshold: 15 },
      { name: "American Cheese", quantity: 50, unit: "slices", minThreshold: 20 },
      { name: "Bacon", quantity: 30, unit: "strips", minThreshold: 15 },
      { name: "Chicken Breast", quantity: 40, unit: "pieces", minThreshold: 10 },
      { name: "Fries (frozen)", quantity: 25, unit: "bags", minThreshold: 5 },
      { name: "Onion Rings (frozen)", quantity: 15, unit: "bags", minThreshold: 3 },
      { name: "Wings", quantity: 60, unit: "pieces", minThreshold: 20 },
      { name: "Fountain Syrup - Coke", quantity: 3, unit: "boxes", minThreshold: 1 },
      { name: "Fountain Syrup - Sprite", quantity: 3, unit: "boxes", minThreshold: 1 },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
