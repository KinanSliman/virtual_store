import { desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  db,
  categories,
  orderItems,
  orders,
  products,
  productViews,
} from "@/db";
import { formatDay, formatPrice } from "@/lib/format";
import {
  HorizontalBarChart,
  RevenueChart,
  StockByCategoryChart,
} from "@/components/dashboard/charts";
import { CHART_COLORS } from "@/lib/chart-colors";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 50;

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-neutral-800 bg-neutral-900 p-5 ${className}`}
    >
      <h3 className="mb-4 text-sm font-medium text-neutral-400">{title}</h3>
      {children}
    </section>
  );
}

export default async function AnalyticsPage() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [kpis] = await db
    .select({
      orders: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, since));

  const [counts] = await db
    .select({
      products: sql<number>`count(*) filter (where ${products.isActive})::int`,
    })
    .from(products);

  const [viewsRow] = await db
    .select({ views: sql<number>`count(*)::int` })
    .from(productViews)
    .where(gte(productViews.viewedAt, since));

  const revenueByDay = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`sum(${orders.total})::float`,
    })
    .from(orders)
    .where(gte(orders.createdAt, since))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const topSold = await db
    .select({
      name: products.name,
      value: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .groupBy(products.name)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const topViewed = await db
    .select({
      name: products.name,
      value: sql<number>`count(*)::int`,
    })
    .from(productViews)
    .innerJoin(products, eq(productViews.productId, products.id))
    .groupBy(products.name)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const stockByCategory = await db
    .select({
      name: categories.name,
      value: sql<number>`coalesce(sum(${products.stock}), 0)::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.name)
    .orderBy(categories.name);

  const lowStock = await db
    .select({ id: products.id, name: products.name, stock: products.stock })
    .from(products)
    .where(lt(products.stock, LOW_STOCK_THRESHOLD))
    .orderBy(products.stock);

  const revenueData = revenueByDay.map((r) => ({
    day: formatDay(r.day),
    revenue: r.revenue,
  }));

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">Analytics</h2>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Revenue (30 days)", value: formatPrice(kpis.revenue) },
          { label: "Orders (30 days)", value: kpis.orders },
          { label: "Active products", value: counts.products },
          { label: "Product views (30 days)", value: viewsRow.views },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-5"
          >
            <p className="text-sm text-neutral-400">{kpi.label}</p>
            <p className="mt-1 text-3xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue per day — last 30 days" className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </Card>

        <Card title="Top sellers — units sold">
          <HorizontalBarChart
            data={topSold}
            color={CHART_COLORS.BLUE}
            label="Units sold"
          />
        </Card>

        <Card title="Most viewed in the 3D store">
          <HorizontalBarChart
            data={topViewed}
            color={CHART_COLORS.AQUA}
            label="Views"
          />
        </Card>

        <Card title="Stock by category">
          <StockByCategoryChart data={stockByCategory} />
        </Card>

        <Card title={`Low stock (< ${LOW_STOCK_THRESHOLD} units)`}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500">
              All products are well stocked.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-800 text-sm">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2"
                >
                  <span>{p.name}</span>
                  <span className="font-medium text-amber-400">
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
