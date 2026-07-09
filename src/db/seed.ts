/**
 * Seed script: demo categories, 12 products across 2 shelves,
 * plus ~30 days of demo orders and product views so the
 * dashboard analytics have data on first run.
 *
 * Run with: pnpm db:seed
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const CATEGORIES = [
  { name: "Fruits", slug: "fruits" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Dairy", slug: "dairy" },
  { name: "Bakery", slug: "bakery" },
  { name: "Beverages", slug: "beverages" },
  { name: "Snacks", slug: "snacks" },
];

// shelf 1 and shelf 2, six slots each (0..5)
const PRODUCTS = [
  {
    name: "Red Apples",
    imageUrl: "/products/apples.svg",
    category: "fruits",
    description:
      "Crisp, sweet red apples picked at peak ripeness. Perfect for snacking, baking, or juicing. Sold per kilogram.",
    price: "3.49",
    stock: 120,
    color: "#e0393e",
    shelf: 1,
    shelfSlot: 0,
  },
  {
    name: "Bananas",
    imageUrl: "/products/bananas.svg",
    category: "fruits",
    description:
      "Naturally sweet Cavendish bananas, rich in potassium and ideal for breakfast or smoothies. Sold per bunch.",
    price: "1.99",
    stock: 150,
    color: "#f5c542",
    shelf: 1,
    shelfSlot: 1,
  },
  {
    name: "Fresh Tomatoes",
    imageUrl: "/products/tomatoes.svg",
    category: "vegetables",
    description:
      "Vine-ripened tomatoes with a deep red color and rich flavor. Great for salads, sauces, and sandwiches.",
    price: "2.79",
    stock: 90,
    color: "#e8543f",
    shelf: 1,
    shelfSlot: 2,
  },
  {
    name: "Broccoli",
    imageUrl: "/products/broccoli.svg",
    category: "vegetables",
    description:
      "Fresh green broccoli crowns, packed with vitamins C and K. Steam, roast, or stir-fry.",
    price: "2.29",
    stock: 70,
    color: "#3d8c40",
    shelf: 1,
    shelfSlot: 3,
  },
  {
    name: "Whole Milk",
    imageUrl: "/products/milk.svg",
    category: "dairy",
    description:
      "Farm-fresh whole milk, pasteurized and homogenized. 1 liter carton with a creamy, full-bodied taste.",
    price: "1.59",
    stock: 200,
    color: "#f4f6fb",
    shelf: 1,
    shelfSlot: 4,
  },
  {
    name: "Cheddar Cheese",
    imageUrl: "/products/cheddar.svg",
    category: "dairy",
    description:
      "Aged cheddar with a sharp, nutty flavor. 250g block, ideal for sandwiches, burgers, and cheese boards.",
    price: "4.99",
    stock: 60,
    color: "#f0a832",
    shelf: 1,
    shelfSlot: 5,
  },
  {
    name: "Sourdough Bread",
    imageUrl: "/products/sourdough.svg",
    category: "bakery",
    description:
      "Artisan sourdough loaf with a crackly crust and airy crumb, baked fresh every morning.",
    price: "3.99",
    stock: 40,
    color: "#c98a4b",
    shelf: 2,
    shelfSlot: 0,
  },
  {
    name: "Croissants",
    imageUrl: "/products/croissants.svg",
    category: "bakery",
    description:
      "Buttery, flaky croissants baked golden. Pack of 4 — perfect with coffee or filled with jam.",
    price: "5.49",
    stock: 35,
    color: "#e3b25f",
    shelf: 2,
    shelfSlot: 1,
  },
  {
    name: "Orange Juice",
    imageUrl: "/products/orange-juice.svg",
    category: "beverages",
    description:
      "100% squeezed orange juice, no added sugar, no concentrate. 1 liter bottle, chilled.",
    price: "3.29",
    stock: 110,
    color: "#f28c28",
    shelf: 2,
    shelfSlot: 2,
  },
  {
    name: "Sparkling Water",
    imageUrl: "/products/sparkling-water.svg",
    category: "beverages",
    description:
      "Refreshing sparkling mineral water with fine bubbles. 6-pack of 500ml bottles.",
    price: "4.49",
    stock: 130,
    color: "#7ec8e3",
    shelf: 2,
    shelfSlot: 3,
  },
  {
    name: "Potato Chips",
    imageUrl: "/products/chips.svg",
    category: "snacks",
    description:
      "Kettle-cooked potato chips with sea salt. Crunchy, golden, and dangerously snackable. 150g bag.",
    price: "2.49",
    stock: 95,
    color: "#f7d354",
    shelf: 2,
    shelfSlot: 4,
  },
  {
    name: "Dark Chocolate",
    imageUrl: "/products/chocolate.svg",
    category: "snacks",
    description:
      "70% cocoa dark chocolate bar, smooth and intense with notes of red fruit. 100g bar.",
    price: "3.79",
    stock: 80,
    color: "#5b3a29",
    shelf: 2,
    shelfSlot: 5,
  },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, randomInt(0, 59), 0, 0);
  return d;
}

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(schema.productViews);
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.products);
  await db.delete(schema.categories);

  console.log("Inserting categories...");
  const insertedCategories = await db
    .insert(schema.categories)
    .values(CATEGORIES)
    .returning();
  const bySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  console.log("Inserting products...");
  const insertedProducts = await db
    .insert(schema.products)
    .values(
      PRODUCTS.map(({ category, ...p }) => ({
        ...p,
        categoryId: bySlug.get(category)!,
      })),
    )
    .returning();

  console.log("Inserting demo orders (last 30 days)...");
  for (let day = 30; day >= 0; day--) {
    const ordersToday = randomInt(0, 3);
    for (let i = 0; i < ordersToday; i++) {
      const itemCount = randomInt(1, 4);
      const picked = [...insertedProducts]
        .sort(() => Math.random() - 0.5)
        .slice(0, itemCount);
      const items = picked.map((p) => ({
        productId: p.id,
        quantity: randomInt(1, 3),
        unitPrice: p.price,
      }));
      const total = items
        .reduce((sum, it) => sum + Number(it.unitPrice) * it.quantity, 0)
        .toFixed(2);

      const [order] = await db
        .insert(schema.orders)
        .values({ total, createdAt: daysAgo(day, randomInt(8, 20)) })
        .returning();
      await db
        .insert(schema.orderItems)
        .values(items.map((it) => ({ ...it, orderId: order.id })));
    }
  }

  console.log("Inserting demo product views (last 30 days)...");
  const views: (typeof schema.productViews.$inferInsert)[] = [];
  for (const p of insertedProducts) {
    const viewCount = randomInt(5, 40);
    for (let i = 0; i < viewCount; i++) {
      views.push({
        productId: p.id,
        viewedAt: daysAgo(randomInt(0, 30), randomInt(8, 22)),
      });
    }
  }
  await db.insert(schema.productViews).values(views);

  const counts = {
    categories: insertedCategories.length,
    products: insertedProducts.length,
    views: views.length,
  };
  console.log("Seed complete:", counts);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
