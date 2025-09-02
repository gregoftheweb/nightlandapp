import { PoolTemplate } from "./types";

export const poolTemplates: PoolTemplate[] = [
  {
    name: "Healing Pool",
    shortName: "heal_pool",
    size: { width: 2, height: 2 },
    description: "A shimmering pool of restorative energy.",
    active: true,
    type: "object",
    maxInstances: 10,
    effects: [{ name: "heal", type: "heal", magnitude: 25 }],
    decayTime: 60000,
    image: "assets/pools/healing_pool.png",
    maxUses: 5, // Added to define usage limit in template
  },
  {
    name: "Poison Pool",
    shortName: "poison_pool",
    size: { width: 2, height: 2 },
    description: "A bubbling pool of toxic sludge.",
    active: true,
    type: "trap",
    maxInstances: 8,
    effects: [{ name: "poison", type: "damage", magnitude: 10, duration: 5000 }],
    image: "assets/pools/poison_pool.png",
    maxUses: 999, // Effectively unlimited, consistent with pools.ts
  },
];