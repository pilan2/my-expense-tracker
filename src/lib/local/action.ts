import { transaction } from "./database";
import { navigate, Redirect } from "./navigation";
export function localAction<A extends unknown[], T>(run: (...args: A) => Promise<T>) {
  return async (...args: A): Promise<T> => {
    let destination: string | undefined;
    const result = await transaction(async () => {
      try { return await run(...args); }
      catch (error) { if (error instanceof Redirect) { destination = error.href; return undefined as T; } throw error; }
    });
    if (destination) navigate(destination);
    return result;
  };
}
