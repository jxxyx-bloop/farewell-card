# Mascot assets

The card shows two sets of mascot art, swapped by the 🍊/🏖️ theme toggle.
Each `<img>` in [`../index.html`](../index.html) carries two attributes:

- `data-original-src` → shown in the **original (🍊) theme**
- `data-beach-src` → shown in the **beach (🏖️) theme**

Any mascot whose image file is missing is hidden automatically
(`onerror="this.style.display='none'"`), so the card still looks clean if you
don't supply art.

## Original-theme mascots

A friendly orange red-panda character (transparent PNGs). These ship with the
project and are placed like so:

| File | Pose | Placed on |
|---|---|---|
| `mascot-happy.png` | cheering, arms up | loading screen, compose box, celebrate pop |
| `mascot-adventure.png` | explorer with backpack | header (left), floating left |
| `mascot-shy.png` | bashful / blushing | header (right, peeking), floating right |
| `mascot-icecream.png` | sitting with a treat | footer |
| `mascot-sad.png` | teary under a rain cloud | bundled spare — not placed by default |

There is intentionally **no angry mascot**.

To use your own art, either replace these PNGs with same-named files, or edit the
`data-original-src` (and matching `src`) attributes in `index.html`. A missing
file simply hides (see above), so partial sets are fine.

## Beach-theme mascots

The `*.svg` files in this folder are the beach-theme art and are committed with
the project. Swap them the same way via the `data-beach-src` attributes.
