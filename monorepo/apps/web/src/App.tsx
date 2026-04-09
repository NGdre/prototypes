import { greet } from "@monorepo/shared";
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    greet("Workspace user").then((greetMsg: string) => {
      setMessage(greetMsg);
    });
  }, []);

  return <div>{message}</div>;
}

export default App;
