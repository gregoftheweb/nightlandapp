export const levelState = {
    levels: [
      {
        id: 1,
        name: "Starting Zone",
        grid: Array(10).fill(null).map(() => Array(10).fill('empty')), // 10x10 empty grid
        monsters: [],
        items: [],
        objects: [],
      },
    ],
  };