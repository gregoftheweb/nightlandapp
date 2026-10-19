# Great Power and Watcher artwork

Source: `/mnt/devplex/Nightland/assets/images/Great Powers/`. All 8 images were converted to WebP at quality 90, method 6. Pixel dimensions and alpha channels were verified unchanged; RGB archives remain opaque. Original files remain in the source folder.

| Source file                                            | WebP file in this directory                            | Logical template / direction                    |
| ------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| `archive/Gemini_Generated_Image_pdyon7pdyon7pdyo.jpeg` | `archive/Gemini_Generated_Image_pdyon7pdyon7pdyo.webp` | Archived alternative; no new entity ID inferred |
| `archive/Gemini_Generated_Image_wn7d9cwn7d9cwn7d.jpeg` | `archive/Gemini_Generated_Image_wn7d9cwn7d9cwn7d.webp` | Archived alternative; no new entity ID inferred |
| `archive/watcher-south-east.png`                       | `archive/watcher-south-east.webp`                      | Archived alternative; no new entity ID inferred |
| `watcher-north-east.png`                               | `watcher-north-east.webp`                              | watcher_ne / North-East                         |
| `watcher-north-west.png`                               | `watcher-north-west.webp`                              | watcher_nw / North-West                         |
| `watcher-south-east-circle.png`                        | `watcher-south-east-circle.webp`                       | watcher_se / South-East (existing ID)           |
| `watcher-south-west.png`                               | `watcher-south-west.webp`                              | watcher_sw / South-West                         |
| `watcher-south.png`                                    | `watcher-south.webp`                                   | watcher_s / South                               |

The root circle variant is the active South-East Watcher image. The archived South-East image and unnamed Gemini images are retained as alternatives, not substituted for a directional Watcher. Prompt text files were not converted.

Mappings live in `config/monsters.ts`. All five Watchers are placed in Level 1 using the reference-map anchors in `config/worldLayout.ts`. The South-East instance retains its original ID and stats overrides; its coordinates now match the southeastern sector around the central Redoubt.

The startup image preloader includes all five active Watcher images. Game-board and info-dialog fallback images now use the new South-East circle asset.
