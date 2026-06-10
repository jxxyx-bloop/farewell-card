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
| `mascot-happy.png` | cheering, arms up | loading screen |
| `mascot-happy2.png` | cheerful | compose box |
| `mascot-dance.png` | dancing | celebrate pop |
| `mascot-adventure.png` | explorer with backpack | floating left |
| `mascot-shy.png` | bashful / blushing | header (right, peeking) |
| `mascot-icecream.png` | sitting with a treat | footer |
| `mascot-sad.png` | teary under a rain cloud | floating right |

There is intentionally **no angry mascot**.

To use your own art, either replace these PNGs with same-named files, or edit the
`data-original-src` (and matching `src`) attributes in `index.html`. A missing
file simply hides (see above), so partial sets are fine.

## Beach-theme mascots

A cute prawn character (transparent PNGs, `prawn-*.png`), placed like so:

| File | Pose | Placed on |
|---|---|---|
| `prawn-joy.png` | happy, claws together | loading screen, compose box |
| `prawn-cry.png` | happy tears | header (right, peeking) |
| `prawn-dance.png` | spinning on a water swirl | celebrate pop |
| `prawn-bye.png` | waving | floating right |
| `prawn-shell-sad.png` | wistful, holding a shell | footer |
| `prawn-hah.png` | laughing out loud | bundled spare — not placed by default |

The floating-left mascot is hidden in beach mode (only the 🍊 theme shows one
there) so no prawn pose appears twice on screen at the same time.

Swap them the same way via the `data-beach-src` attributes.
