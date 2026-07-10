// FULL MENU — transcribed verbatim from GujjuFoodHub-Menu.pdf.
//
// RULES honoured here:
//  • Every product, price and description comes from the PDF. Nothing invented.
//  • Original spellings are preserved as printed (e.g. "Safron Rice",
//    "Veg Biriyani", "Egg Bhurjji", "Browny", "Coriender") so the page matches
//    the physical menu.
//  • Categories group the PDF's own sections/pages — no new dishes were added.
//  • Image filenames are NOT hardcoded: `imageFor()` derives the path from the
//    product name, so dropping files into public/assets/Menu-Section/ is enough.

export interface MenuVariant {
  label: string;
  price: string;
}

export interface MenuItem {
  id: number;
  category: MenuCategory;
  name: string;
  /** Empty string when the PDF lists no description (e.g. Ice Cream, Papad). */
  description: string;
  price: string;
  /** Add-on / upgrade text printed on the menu, e.g. "Add Cheese: $2". */
  note?: string;
  /** Priced options printed under the item (e.g. Surati Cold Coco). */
  variants?: MenuVariant[];
  /** Optional explicit override; otherwise derived from `name`. */
  image?: string;
}

export const CATEGORIES = [
  "Starters & Chinese",
  "Chaat & Street Food",
  "Curries",
  "Breads & Parathas",
  "Rice & Biryani",
  "Salads",
  "Desserts",
  "Sides & Chutneys",
  "Drinks",
  "Kids",
] as const;

export type MenuCategory = (typeof CATEGORIES)[number];

/** "PANI PURI (8 PCS)" → "pani-puri" — parentheticals and punctuation dropped. */
export function slugify(name: string): string {
  return name
    .replace(/\(.*?\)/g, " ")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const IMAGE_DIR = "/assets/Menu-Section";

/** Resolve a product image path without hardcoding filenames. */
export function imageFor(item: MenuItem): string {
  return item.image ?? `${IMAGE_DIR}/${slugify(item.name)}.webp`;
}

export const MENU_ITEMS: MenuItem[] = [
  // ---------------------------------------------------------------- Starters
  {
    id: 1,
    category: "Starters & Chinese",
    name: "Veg Manchurian",
    description:
      "Indo Chinese dish made from cubes of fried crispy paneer and capsicum cooked with onion, cabbage, carrot, and sweet, sour and spicy sauces.",
    price: "$16.50",
  },
  {
    id: 2,
    category: "Starters & Chinese",
    name: "Paneer Chilli",
    description:
      "Indo Chinese dish of fried vegetable balls in a spicy, sweet and tangy Manchurian Gravy or Sauce.",
    price: "$16.50",
  },
  {
    id: 3,
    category: "Starters & Chinese",
    name: "Veg Samosa (2 pcs)",
    description:
      "Smashed samosa topped with chickpeas, onion, tomatoes, tamarind and mint chutneys, chilled yoghurt, fresh coriander and chickpea noodles.",
    price: "$7.50",
  },
  {
    id: 4,
    category: "Starters & Chinese",
    name: "Chilli Chicken",
    description:
      "Crispy fried chicken tossed in a sweet, spicy and slightly sour appetizer made with bell pepper, garlic, onion, chilli sauce and soya sauce.",
    price: "$17.50",
  },
  {
    id: 5,
    category: "Starters & Chinese",
    name: "Veg Noodle",
    description: "Boiled noodles are stir-fried with colourful vegetables and Chinese sauces.",
    price: "$15",
  },
  {
    id: 6,
    category: "Starters & Chinese",
    name: "Chicken Noodle",
    description: "Boiled noodles cooked with crispy chicken, fresh vegetables and Chinese sauces.",
    price: "$15.99",
  },

  // ------------------------------------------------------ Chaat & Street Food
  {
    id: 7,
    category: "Chaat & Street Food",
    name: "Samosa Chat",
    description:
      "Triangle-shaped fried pastry stuffed with savory ingredients such as spiced potatoes, peas, and onion served with mint and tamarind sauce.",
    price: "$14",
  },
  {
    id: 8,
    category: "Chaat & Street Food",
    name: "Aloo Tikki Chat",
    description:
      "Spicy, tangy, and super delicious snack of crispy fried potato patties topped with tomato, onion, chutneys, curd and chat masala.",
    price: "$14",
  },
  {
    id: 9,
    category: "Chaat & Street Food",
    name: "Pani Puri (8 pcs)",
    description:
      "Crispy hollow balls stuffed with boiled potato, onion, tomato, tamarind sauce, sweet yoghurt, and chickpea noodles.",
    price: "$10",
  },
  {
    id: 10,
    category: "Chaat & Street Food",
    name: "Dahi Puri",
    description:
      "Hollow balls of wheat and semolina filled with fried smashed potato and chickpeas, onion served with mint flavoured water and sweet chutney.",
    price: "$14",
  },
  {
    id: 11,
    category: "Chaat & Street Food",
    name: "Chhole Bhature",
    description:
      "Spiced tangy chickpea curry cooked with garlic, onion, tomato and ginger served with soft puffed bhature.",
    price: "$17",
  },
  {
    id: 12,
    category: "Chaat & Street Food",
    name: "Bhel Puri",
    description:
      "Mixture of puffed rice and thin chickpea noodle topped with potato, onion, tomato, peanuts, chat masala, green and tamarind chutney and a mixture of fried snacks.",
    price: "$10",
  },
  {
    id: 13,
    category: "Chaat & Street Food",
    name: "Surati Collegian Bhel",
    description:
      "Mixture of salted peanuts with onion, tomato, green chutney and chickpea noodles.",
    price: "$10",
  },
  {
    id: 14,
    category: "Chaat & Street Food",
    name: "Dabeli",
    description:
      "Spiced potato stuffed between bread roll slathered with tamarind chutney, red chili garlic chutney topped with onion, coriander leaves, peanuts, and chickpea noodles.",
    price: "$7",
    note: "Add Cheese: $2",
  },
  {
    id: 15,
    category: "Chaat & Street Food",
    name: "Vada Pav",
    description:
      "Spicy potato balls sandwiched between bread roll topped with green chutney and dry garlic chutney.",
    price: "$7",
    note: "Add Cheese: $2 · Cheese Vada Pav $9",
  },
  {
    id: 16,
    category: "Chaat & Street Food",
    name: "Pav Bhaji",
    description:
      "Zesty thick curry of mixed vegetables cooked and smashed in a special blend of Indian spices served with soft bread shallow fried in butter.",
    price: "$15.99",
    note: "Add Cheese: $2",
  },
  {
    id: 17,
    category: "Chaat & Street Food",
    name: "Gujju's Bread Chataka",
    description:
      "Bread roll pieces cooked with garlic chutney; topped with smashed masala potato, onion, tomato, peanuts, mint and tamarind chutney, sweet yoghurt, chickpea noodles and coriander.",
    price: "$15",
    note: "Add Cheese: $2",
  },
  {
    id: 18,
    category: "Chaat & Street Food",
    name: "Veg Sandwich",
    description:
      "Filled with fresh crisp vegetables, green chutney, chat masala, tomato sauce and cheese.",
    price: "$10",
  },
  {
    id: 19,
    category: "Chaat & Street Food",
    name: "Veg Burger",
    description:
      "Burger roll filled with veg patty and fresh cucumber, tomato, onion, cheese and fresh salad leaves with spiced mayo and burger dressings.",
    price: "$15",
  },
  {
    id: 20,
    category: "Chaat & Street Food",
    name: "Chicken Burger",
    description:
      "Burger roll filled with chicken patty and fresh salad leaves, tomato, onion and blend of dressings.",
    price: "$15",
  },
  {
    id: 21,
    category: "Chaat & Street Food",
    name: "Bhungla Bataka",
    description:
      "Baby potatoes cooked in a pungent, garlicky chutney, onion, tomato and peanuts served with a crispy fried bhungla/pipe fryums.",
    price: "$16.99",
  },

  // ----------------------------------------------------------------- Curries
  {
    id: 22,
    category: "Curries",
    name: "Whole Onion Curry",
    description:
      "Whole pickling onion cooked with peanuts, sesame seeds, chickpeas, tomato and spices topped with cashew and raisins.",
    price: "$23",
  },
  {
    id: 23,
    category: "Curries",
    name: "Eggplant Bhartha",
    description:
      "Smashed roasted smoky eggplant cooked with garlic, onion, tomato, spring onion, and Indian spices.",
    price: "$23",
  },
  {
    id: 24,
    category: "Curries",
    name: "Sev Tomato",
    description:
      "Fresh tomatoes cooked with garlic and Indian spices with sprinkled chickpea noodle.",
    price: "$20",
  },
  {
    id: 25,
    category: "Curries",
    name: "Bhindi Masala",
    description: "Okra cooked with garlic, onion, tomato and yoghurt with Indian spices.",
    price: "$22",
  },
  {
    id: 26,
    category: "Curries",
    name: "Chana Masala",
    description: "Black chickpeas cooked with potatoes with garlic, tomato and spices.",
    price: "$22",
  },
  {
    id: 27,
    category: "Curries",
    name: "Kaju (Cashew) Curry",
    description: "Whole cashew cooked with garlic, onion, tomato, cream and spices.",
    price: "$23.99",
  },
  {
    id: 28,
    category: "Curries",
    name: "Kadai Paneer",
    description:
      "Indian Cottage cheese cooked with onion, bell pepper, tomatoes, ginger and cashew gravy with Indian spices.",
    price: "$23.99",
  },
  {
    id: 29,
    category: "Curries",
    name: "Paneer Bhurji",
    description:
      "Scrambled Indian cottage cheese cooked with onion, tomatoes, garlic and Indian spices.",
    price: "$22.99",
  },
  {
    id: 30,
    category: "Curries",
    name: "Navratna Korma",
    description: "Fresh vegetables cooked in nine different spiced and simmered in a red gravy.",
    price: "$22.99",
  },
  {
    id: 31,
    category: "Curries",
    name: "Dal Fry",
    description: "Five different lentils cooked with onions, tomatoes, herbs and Indian spices.",
    price: "$20",
  },
  {
    id: 32,
    category: "Curries",
    name: "Butter Chicken",
    description:
      "Chicken marinated in yoghurt and spices, roasted and simmered in a rich creamy onion and tomato sauce.",
    price: "$23.99",
  },
  {
    id: 33,
    category: "Curries",
    name: "Chicken Tikka Masala",
    description:
      "Marinated chicken cooked with capsicum, onion, garlic and tomato with blend of Indian spices.",
    price: "$23.99",
  },
  {
    id: 34,
    category: "Curries",
    name: "Egg Curry",
    description:
      "Boiled chopped egg cooked with onion, tomato, garlic and ginger with Indian spices.",
    price: "$21.99",
  },
  {
    id: 35,
    category: "Curries",
    name: "Egg Bhurjji",
    description:
      "Scrambling beaten eggs with onion, tomato, garlic, ginger and spiced herbs topped with fresh.",
    price: "$21.99",
  },

  // ------------------------------------------------------- Breads & Parathas
  {
    id: 36,
    category: "Breads & Parathas",
    name: "Paratha (Plain/Butter)",
    description: "Wholemeal Indian bread cooked with oil/butter.",
    price: "$4.50",
  },
  {
    id: 37,
    category: "Breads & Parathas",
    name: "Garlic Paratha",
    description: "Wholemeal Indian bread cooked with fresh garlic, cumin seeds and butter.",
    price: "$5",
  },
  {
    id: 38,
    category: "Breads & Parathas",
    name: "Tava Roti (1 pc)",
    description: "Wholemeal Indian bread cooked on tava with butter (Ghee).",
    price: "$3",
  },
  {
    id: 39,
    category: "Breads & Parathas",
    name: "Aloo Paratha",
    description:
      "Wholemeal Indian bread stuffed with masala potato and butter/oil served with sweet yoghurt and pickle.",
    price: "$8.50",
  },
  {
    id: 40,
    category: "Breads & Parathas",
    name: "Paneer Spinach Paratha",
    description: "Wholemeal Indian bread cooked with fresh paneer, spinach, garlic and spices.",
    price: "$7",
  },
  {
    id: 41,
    category: "Breads & Parathas",
    name: "Chilli Paneer Spinach Paratha",
    description:
      "Wholemeal Indian bread cooked with fresh green chilli, paneer, spinach, garlic and spices.",
    price: "$7.50",
  },
  {
    id: 42,
    category: "Breads & Parathas",
    name: "Mix Veg Paratha",
    description:
      "Wholemeal Indian bread cooked with fresh seasonal vegetables, garlic, and spices.",
    price: "$7",
  },
  {
    id: 43,
    category: "Breads & Parathas",
    name: "Cheese Paratha",
    description: "Wholemeal Indian bread cooked with fresh garlic and cheese.",
    price: "$7",
  },

  // ---------------------------------------------------------- Rice & Biryani
  {
    id: 44,
    category: "Rice & Biryani",
    name: "Plain Rice",
    description: "Aromatic Basmati rice boiled on low fire.",
    price: "$5",
  },
  {
    id: 45,
    category: "Rice & Biryani",
    name: "Safron Rice",
    description: "Basmati rice boiled with saffron and cumin seeds.",
    price: "$6",
  },
  {
    id: 46,
    category: "Rice & Biryani",
    name: "Fried Rice",
    description:
      "Basmati rice stir-fried with fresh vegetables, green onions, and seasoning spice and sauce.",
    price: "$15",
  },
  {
    id: 47,
    category: "Rice & Biryani",
    name: "Veg Biriyani",
    description:
      "Rice cooked with fresh vegetables, crunchy nuts, aromatic biriyani spices, herbs and sauce served with raita.",
    price: "$15.99",
  },
  {
    id: 48,
    category: "Rice & Biryani",
    name: "Chicken Biriyani",
    description:
      "Rice cooked with stir fried chicken, fresh vegetables, biriyani spices, herbs and sauces served with riata.",
    price: "$16.99",
  },

  // ------------------------------------------------------------------ Salads
  {
    id: 49,
    category: "Salads",
    name: "Onion Salad",
    description: "Freshly chopped onion with salt, pepper and lemon juice.",
    price: "$5",
  },
  {
    id: 50,
    category: "Salads",
    name: "Garden Salad",
    description:
      "Freshly chopped seasonal vegetables with salad leaves, salt, pepper and lemon juice.",
    price: "$8",
  },

  // ---------------------------------------------------------------- Desserts
  {
    id: 51,
    category: "Desserts",
    name: "Gulab Jamun",
    description:
      "Fried dough balls are scented with cardamon and soaked in sweet saffron sugary syrup.",
    price: "$7",
  },
  {
    id: 52,
    category: "Desserts",
    name: "Creamy Fruit Salad",
    description: "Fresh Sweet whipped cream served with seasonal fresh fruits and nuts.",
    price: "$10",
  },
  { id: 53, category: "Desserts", name: "Ice Cream", description: "", price: "$7" },
  {
    id: 54,
    category: "Desserts",
    name: "Browny with Ice Cream",
    description: "",
    price: "$12",
  },

  // -------------------------------------------------------- Sides & Chutneys
  {
    id: 55,
    category: "Sides & Chutneys",
    name: "Home Made Mango Pickle (Sweet/Spicy)",
    description: "",
    price: "$3.00",
  },
  {
    id: 56,
    category: "Sides & Chutneys",
    name: "Home Made Fresh Chilli Pickle",
    description: "",
    price: "$3.00",
  },
  {
    id: 57,
    category: "Sides & Chutneys",
    name: "Chilli Garlic Chutney",
    description: "",
    price: "$2.50",
  },
  {
    id: 58,
    category: "Sides & Chutneys",
    name: "Mint and Coriender Chutney",
    description: "",
    price: "$2.50",
  },
  {
    id: 59,
    category: "Sides & Chutneys",
    name: "Tamarind and Dates Chutney",
    description: "",
    price: "$2.50",
  },
  { id: 60, category: "Sides & Chutneys", name: "Papad", description: "", price: "$2.50" },
  { id: 61, category: "Sides & Chutneys", name: "Masala Papad", description: "", price: "$5.00" },
  { id: 62, category: "Sides & Chutneys", name: "Cucumber Raita", description: "", price: "$4.00" },
  { id: 63, category: "Sides & Chutneys", name: "Extra Bread", description: "", price: "$2.00" },
  { id: 64, category: "Sides & Chutneys", name: "Extra Bhature", description: "", price: "$2.00" },

  // ------------------------------------------------------------------ Drinks
  {
    id: 65,
    category: "Drinks",
    name: "Surati Cold Coco",
    description: "A dense, creamy and silky chocolate milk served with chocolate toppings.",
    price: "$8.99",
    variants: [
      { label: "Plain", price: "$8.99" },
      { label: "Ice cream or Dry Fruits", price: "$10.99" },
      { label: "Ice cream and Dry Fruits", price: "$12.99" },
    ],
  },
  {
    id: 66,
    category: "Drinks",
    name: "Mango Lassi",
    description: "Mango pulp blended with fresh yoghurt topped with dry fruits.",
    price: "$7.99",
  },
  {
    id: 67,
    category: "Drinks",
    name: "Salted Lassi",
    description: "Fresh yoghurt blended with fresh mint, pink salt, and pepper.",
    price: "$6.99",
  },
  {
    id: 68,
    category: "Drinks",
    name: "Butter Milk",
    description: "Fresh yoghurt blended with special homemade masala.",
    price: "$5.99",
  },
  {
    id: 69,
    category: "Drinks",
    name: "Masala Soda",
    description: "Blended fresh mint, lemon juice and Indian chat masala in a soda water.",
    price: "$5.99",
  },
  {
    id: 70,
    category: "Drinks",
    name: "Indian Chai",
    description:
      "Black tea mixed with strong spices, like ginger, cinnamon, cardamon, cloves, pepper and milk.",
    price: "$5.99",
  },
  { id: 71, category: "Drinks", name: "Cans", description: "", price: "$2.99" },
  { id: 72, category: "Drinks", name: "Glass Bottles", description: "", price: "$3.99" },

  // -------------------------------------------------------------------- Kids
  {
    id: 73,
    category: "Kids",
    name: "Potato Chips",
    description: "Fried potato chips served with tomato sauce.",
    price: "$7.99",
    note: "Add Peri Peri Salt: $1",
  },
  {
    id: 74,
    category: "Kids",
    name: "Cheese and Jam Sandwich",
    description: "Grilled sandwich made from jam and cheese.",
    price: "$7",
  },
  {
    id: 75,
    category: "Kids",
    name: "Kids Dabeli",
    description:
      "Mild masala potato served in bread roll with tomato, onion, peanuts, sweet chutney and truti fruity or fresh fruit.",
    price: "$5.99",
  },
];

// ---------------------------------------------------------------------------
// Book pagination — multiple products per page, each category starts a new page.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Height-based pagination. A fixed items-per-page count clips tall items (long
// descriptions, priced variants), so instead we estimate each item's rendered
// height and fill a page up to a budget. An item is NEVER split across pages —
// if it doesn't fit, it starts the next page.
//
// Units are CSS px and mirror MenuItemCard.module.css / MenuBook.module.css.
// Desktop is the binding constraint (narrower body column → more wrapped lines),
// so one pagination serves both modes and page indices stay identical.
// ---------------------------------------------------------------------------

// Calibrated against measured DOM heights in BOTH modes, taking the worst case
// of each dimension so a page can never overflow in either layout:
//   • available height — mobile 363px  vs desktop 371px  → use 363 (minus margin)
//   • chars per line   — mobile ~27.8  vs desktop ~36    → use 28
//   • thumb floor      — mobile 62px   vs desktop 74px   → use 74
// Every constant rounds UP so the estimate is never optimistic.

/** Usable height of `.pageItems` — measured minimum is 363px (mobile). */
const PAGE_BUDGET = 358;

const ITEM_GAP = 9; // .pageItems gap (0.55rem → 8.8px)
const THUMB_H = 74; // .thumb sets the row's floor (desktop is taller)
const ITEM_PAD = 16; // .item padding (0.5rem top + bottom)
const SAFETY = 2; // per-item rounding cushion
const NAME_H = 20; // .name line (1.02rem × 1.2)
const DESC_LINE = 19; // .desc line-height (measured 18.1px)
const DESC_CPL = 28; // chars per line in the narrowest (mobile) body column
const DESC_MT = 5; // .desc margin-top
const VAR_LINE = 20; // .variants li + row gap
const VAR_MT = 10; // .variants margin-top
const NOTE_H = 25; // .note + margin-top

/** Conservative estimate of one rendered MenuItemCard, in px. */
export function estimateItemHeight(item: MenuItem): number {
  let body = NAME_H;
  if (item.description) {
    body += DESC_MT + Math.ceil(item.description.length / DESC_CPL) * DESC_LINE;
  }
  if (item.variants) body += VAR_MT + item.variants.length * VAR_LINE;
  if (item.note) body += NOTE_H;
  // The row is a flex pair: the circular thumb sets a floor.
  return Math.max(THUMB_H, body) + ITEM_PAD + SAFETY;
}

/** Greedily fill pages to PAGE_BUDGET without ever splitting an item. */
function packItemsIntoPages(items: MenuItem[]): MenuItem[][] {
  const pages: MenuItem[][] = [];
  let current: MenuItem[] = [];
  let height = 0;

  for (const item of items) {
    const h = estimateItemHeight(item);
    const added = current.length > 0 ? ITEM_GAP + h : h;

    if (current.length > 0 && height + added > PAGE_BUDGET) {
      pages.push(current);
      current = [item];
      height = h; // a lone oversized item still gets its own page — never split
    } else {
      current.push(item);
      height += added;
    }
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

export type BookPage =
  | { kind: "cover" }
  | { kind: "back" }
  | { kind: "filler"; category: MenuCategory }
  | { kind: "content"; category: MenuCategory; items: MenuItem[]; partOf: number; part: number };

/** The category a page belongs to (cover/back belong to none). */
export function categoryOf(page: BookPage | undefined): MenuCategory | null {
  if (!page) return null;
  return page.kind === "content" || page.kind === "filler" ? page.category : null;
}

/**
 * Builds the ordered page list. Index 0 is the front cover (the right-hand page
 * of a closed book), so content pages begin at index 1 — the LEFT page of the
 * first spread.
 *
 * Each category is padded to an EVEN number of pages with a decorative flourish
 * page. That guarantees every category occupies whole two-page spreads, so a
 * spread never mixes two categories and the "which category am I on?" sync is
 * unambiguous in both directions.
 */
export function buildPages(): BookPage[] {
  const pages: BookPage[] = [{ kind: "cover" }];

  for (const category of CATEGORIES) {
    const items = MENU_ITEMS.filter((i) => i.category === category);
    if (items.length === 0) continue;

    const chunks = packItemsIntoPages(items);

    chunks.forEach((chunk, i) =>
      pages.push({
        kind: "content",
        category,
        items: chunk,
        part: i + 1,
        partOf: chunks.length,
      })
    );

    // Pad odd categories so each one fills complete spreads.
    if (chunks.length % 2 !== 0) pages.push({ kind: "filler", category });
  }

  pages.push({ kind: "back" });
  // Sheets hold two faces — keep the page count even.
  if (pages.length % 2 !== 0) pages.push({ kind: "back" });
  return pages;
}

/** First page index that shows a given category. */
export function firstPageOfCategory(pages: BookPage[], category: MenuCategory): number {
  return pages.findIndex((p) => p.kind === "content" && p.category === category);
}
