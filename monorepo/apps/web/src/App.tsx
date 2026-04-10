import { type ApiResponse } from "@monorepo/shared";
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json() as Promise<ApiResponse<string>>)
      .then((data) => {
        if (data.success && data.data) {
          setMessage(data.data);
        }
      });
  }, []);

  if (!message) return <p>Loading...</p>;

  return <p>{message}</p>;
}

export default App;
