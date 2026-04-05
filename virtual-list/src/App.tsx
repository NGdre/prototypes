import { useRef, useState } from "react";
import VirtualList from "./VirtualList";
import { fetchPage, type ListItem } from "./api/fetchPage";

const PAGE_LIMIT = 30;

function App() {
  const [items, setItems] = useState<ListItem[]>([]);
  const isLoading = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [currPage, setCurrPage] = useState(0);

  async function handleFetchPage() {
    if (isLoading.current || !hasMore) return;

    isLoading.current = true;
    const nextPage = currPage + 1;
    const { hasMore: more, items: newItems } = await fetchPage(
      nextPage,
      PAGE_LIMIT,
    );

    setHasMore(more);
    setCurrPage(nextPage);
    setItems((prev) => [...prev, ...newItems]);

    isLoading.current = false;
  }

  return <VirtualList items={items} onEndReached={handleFetchPage} />;
}

export default App;
