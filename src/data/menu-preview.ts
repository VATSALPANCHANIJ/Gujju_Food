// Menu preview data — the single source of truth for the home-page menu cards.
// The SAME structure can later be swapped for the Menu database.
//
// IMAGES: drop each file into `public/assets/Menu-Section/` using the exact
// filename below. Until a file exists, its card renders a clean cream fallback
// (see MenuSection.tsx) — the layout never breaks and no placeholder/dummy image
// is ever fetched. Paths are root-relative.
//
// `category` values MUST match the filter pills in MenuSection.tsx.

export interface MenuPreviewItem {
  id: number;
  category: string;
  name: string;
  description: string;
  price: string;
  /** File in public/assets/Menu-Section/ — filename should match the product. */
  image: string;
}

export const menuPreview: MenuPreviewItem[] = [
  {
    id: 1,
    category: "Street Food",
    name: "Pav Bhaji",
    description: "Rich buttery bhaji served with toasted pav.",
    price: "$15.00",
    image: "/assets/Menu-Section/pav-bhaji.webp",
  },
  {
    id: 2,
    category: "Street Food",
    name: "Vada Pav",
    description: "Mumbai's iconic vada pav with chutney.",
    price: "$8.99",
    image: "/assets/Menu-Section/vada-pav.webp",
  },
  {
    id: 3,
    category: "Falooda",
    name: "Royal Falooda",
    description: "Royal blend of falooda with ice cream and nuts.",
    price: "$12.99",
    image: "/assets/Menu-Section/royal-falooda.webp",
  },
  {
    id: 4,
    category: "Desserts",
    name: "Paan",
    description: "Traditional meetha paan with a royal touch.",
    price: "$6.99",
    image: "/assets/Menu-Section/paan.webp",
  },
  {
    id: 5,
    category: "Snacks",
    name: "Samosa",
    description: "Crispy samosa with flavourful potato filling.",
    price: "$7.99",
    image: "/assets/Menu-Section/samosa.webp",
  },
  {
    id: 6,
    category: "Street Food",
    name: "Pani Puri",
    description: "Crispy puris with spicy pani and chutneys.",
    price: "$8.99",
    image: "/assets/Menu-Section/pani-puri.webp",
  },
  {
    id: 7,
    category: "Street Food",
    name: "Dabeli",
    description: "Sweet, spicy and tangy dabeli delight.",
    price: "$8.99",
    image: "/assets/Menu-Section/dabeli.webp",
  },
  {
    id: 8,
    category: "Snacks",
    name: "Khaman Dhokla",
    description: "Soft and fluffy khaman dhokla with tadka.",
    price: "$7.99",
    image: "/assets/Menu-Section/khaman-dhokla.webp",
  },
  {
    id: 9,
    category: "Snacks",
    name: "Fafda Jalebi",
    description: "Classic Gujarati combo of fafda and jalebi.",
    price: "$9.99",
    image: "/assets/Menu-Section/fafda-jalebi.webp",
  },
  {
    id: 10,
    category: "Beverages",
    name: "Masala Chaas",
    description: "Refreshing buttermilk with Indian spices.",
    price: "$4.99",
    image: "/assets/Menu-Section/masala-chaas.webp",
  },
];
