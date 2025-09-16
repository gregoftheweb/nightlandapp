import { PoolTemplate } from "./types";

export const poolTemplates: PoolTemplate[] = [
  {
    name: "Healing Pool",
    shortName: "heal_pool",
    size: { width: 2, height: 2 },
    maxInstances: 10,
    effects: [{ type: "heal", description: "config/poolTemplates.ts" }],
   
    image: "assets/pools/healing_pool.png",
  
  },
  {
    name: "Poison Pool",
    shortName: "poison_pool",
    size: { width: 2, height: 2 },
   
    maxInstances: 8,
    effects: [{ type: "poison",  description: "A bubbling pool of toxic sludge.",}],
    image: "assets/pools/poison_pool.png",
   
  },
];