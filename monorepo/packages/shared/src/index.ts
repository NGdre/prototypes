import delay from "lodash/delay.js";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function greet(name: string): Promise<string> {
  return new Promise((resolve) => {
    delay(() => {
      resolve(`Hello, ${name}! This is from shared package.`);
    }, 500);
  });
}
