const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Formats a Drizzle numeric (string) or number as USD. */
export function formatPrice(value: string | number): string {
  return usd.format(typeof value === "string" ? Number(value) : value);
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatDay(date: Date | string): string {
  return dateFmt.format(typeof date === "string" ? new Date(date) : date);
}
