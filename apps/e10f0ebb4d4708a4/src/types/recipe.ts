export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  vegetarian: boolean;
  ingredients: string[];
  instructions: string[];
}
export interface Filters { vegetarianOnly: boolean; maxTotalMinutes: number }
export interface StoragePort {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
}
export interface AppBridge { storage: StoragePort }
declare global { interface Window { os?: AppBridge } }
