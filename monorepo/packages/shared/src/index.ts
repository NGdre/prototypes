import delay from "lodash/delay";

export function greet(name: string): Promise<string> {
  return new Promise((resolve) => {
    delay(() => {
      resolve(`Hello, ${name}! This is from shared package.`);
    }, 500);
  });
}
