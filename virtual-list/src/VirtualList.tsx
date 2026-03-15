import { useMemo, useState } from "react";

export interface ListItem {
  id: string;
  name: string;
}

export interface VirtualListProps {
  items: ListItem[];
  overscan?: number;
}

export default function VirtualList({ items, overscan = 3 }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const itemHeight = 30;
  const containerHeight = 500;
  const totalHeight = itemHeight * items.length;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = useMemo(() => {
    const result = [];

    for (let i = startIndex; i <= endIndex; i++) {
      result.push(
        <li
          key={items[i].id}
          style={{
            height: itemHeight,
            top: i * itemHeight,
            position: "absolute",
          }}
        >
          {items[i].name}
        </li>,
      );
    }

    return result;
  }, [items, startIndex, endIndex]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "90vh",
      }}
    >
      <div
        style={{
          width: 300,
          height: containerHeight,
          border: "1px solid grey",
          overflowY: "auto",
        }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <ul
          style={{
            height: totalHeight,
            position: "relative",
          }}
        >
          {visibleItems.map((item) => item)}
        </ul>
      </div>
    </div>
  );
}
