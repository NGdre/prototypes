export interface ListItem {
  id: string;
  name: string;
}

const ITEMS_AMOUNT = 1000;

const items: ListItem[] = [];

for (let i = 0; i < ITEMS_AMOUNT; i++) {
  items.push({ id: i + "", name: `Item ${i + 1}` });
}

export function fetchPage(
  page: number,
  limit: number,
): Promise<{ items: ListItem[]; hasMore: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = (page - 1) * limit;

      const remaining = ITEMS_AMOUNT - start;

      const currPageAmount = Math.min(limit, remaining);

      const hasMore = start + currPageAmount < ITEMS_AMOUNT;

      resolve({ items: items.slice(start, start + limit), hasMore });
    }, 1000);
  });
}
