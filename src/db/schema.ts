import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Store-wide branding, edited from the dashboard. A single row, always
 * id = 1 — see getStoreSettings() in src/lib/store-settings.ts.
 */
export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().default("Fresh Mart"),
  nameAr: varchar("name_ar", { length: 120 }),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 100 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 200 }).notNull(),
  // Arabic copy; the storefront falls back to the English text when empty
  nameAr: varchar("name_ar", { length: 200 }),
  description: text("description").notNull().default(""),
  descriptionAr: text("description_ar"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  // hex color used as the material color of the product's 3D box
  color: varchar("color", { length: 7 }).notNull().default("#22c55e"),
  // which of the two shelves the product sits on (1 or 2)
  shelf: integer("shelf").notNull().default(1),
  // slot index along the shelf, left to right
  shelfSlot: integer("shelf_slot").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  // price snapshot at purchase time; product price may change later
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const productViews = pgTable("product_views", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  views: many(productViews),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productViewsRelations = relations(productViews, ({ one }) => ({
  product: one(products, {
    fields: [productViews.productId],
    references: [products.id],
  }),
}));

export type StoreSettings = typeof storeSettings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
