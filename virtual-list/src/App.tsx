import { useMemo } from "react";
import VirtualList, { type ListItem } from "./VirtualList";

const ITEMS_AMOUNT = 1000;

function App() {
  const items: ListItem[] = useMemo(() => {
    const arr = [];

    for (let i = 0; i < ITEMS_AMOUNT; i++) {
      arr.push({ id: i + "", name: `Item ${i}` });
    }

    return arr;
  }, []);

  return <VirtualList items={items} />;
}

export default App;
