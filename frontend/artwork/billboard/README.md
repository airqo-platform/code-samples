# Realistic billboard artwork

Generated with the built-in ImageGen tool using the supplied reference as style guidance: realistic 3D African adults, blue clothing, transparent backgrounds, complete characters and activity props. The exact six atlas prompts and production output filenames are recorded in [prompts.json](./prompts.json).

The thirty production cutouts live in `frontend/public/images/billboard/realistic/`. They total **584,342 bytes**, use WebP with alpha, and are at most 360 pixels on either edge. Original generated atlases remain in the ImageGen output directory; production files are stored in the repository and do not depend on that directory.

[contact-sheet.webp](./contact-sheet.webp) shows all thirty cutouts. Rows are Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, and Hazardous. Each row has five different scenes. Only the Good category includes vigorous outdoor sports.

To rebuild optimized cutouts from the original six PNG atlases, run `node scripts/prepare-billboard-characters.cjs` from `frontend`, supplying the six atlas paths in the row order above. The script follows transparent seams between characters to avoid cutting off hands, feet, or props, then trims and compresses the extracted images.

The realistic mode now plays actual eight-frame action sequences, with changing limb/hand/prop poses. The old whole-cutout bobbing loops have been removed. All thirty action strips together contain 240 frames and total **1,753,696 bytes**; only the current and next strip are loaded as needed. Static cutouts remain as reduced-motion posters and loading/error fallbacks.

Exact frame-generation prompts are in [action-prompts.json](./action-prompts.json). Each generated atlas contains five scene rows and eight chronological frame columns. `scripts/prepare-billboard-actions.cjs` separates rows along transparent seams, removes small disconnected artifacts, aligns frame windows, and writes `*-action.webp` strips at 1536 x 256 (eight 192 x 256 frames). Pass the six original atlas paths in category order, or use `--category <name> <atlas>`.

[Walking preview](./moderate-1-preview.gif) and [page-turning preview](./moderate-4-preview.gif) show representative action loops. These GIFs are review artifacts only; the website uses pausable CSS sprite playback. The source frames were created with built-in ImageGen. The existing category-face and SVG activity modes are preserved.
