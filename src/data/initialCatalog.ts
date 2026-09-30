import { Product, StoreStatus } from '../types';

export const RESTAURANT_INFO = {
  name: 'CHEZ BINETA',
  tagline: 'Vos envies, nos délices 😋',
  address: 'Saint-Louis, Ngallel, côté DSCOS',
  phone: '+221 75 508 97 31',
  phoneClean: '+221755089731',
  whatsapp: '+221 75 508 97 31',
  whatsappLink: 'https://wa.me/221755089731',
  scheduleWeek: 'Lundi → Samedi : Service normal',
  scheduleSunday: 'Dimanche : Sur réservation uniquement',
  logoUrl: '/images/bineta_logo_1790708601896.webp',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'mini-tacos',
    name: 'Mini Tacos',
    category: 'tacos',
    price: 350,
    description: 'Savoureux tacos toastés pliés en triangles croustillants, grillés à point et garnis d’une viande savoureuse.',
    imageUrl: '/images/mini_tacos_1790708644401.webp',
    isAvailable: true,
    order: 1,
  },
  {
    id: 'mini-pizza',
    name: 'Mini Pizza',
    category: 'pizza',
    price: 350,
    description: 'Petites pizzas dorées au four, mozzarella fondante, viande hachée mijotée et olive noire.',
    imageUrl: '/images/mini_pizzas_1790708634831.webp',
    isAvailable: true,
    order: 2,
  },
  {
    id: 'fataya',
    name: 'Fataya',
    category: 'fataya',
    price: 100, // STRICT: 100 FCFA
    description: 'Chausson croustillant doré et généreusement farci, servi avec notre sauce douce au piment.',
    imageUrl: '/images/fataya_senegal_1790708612908.webp',
    isAvailable: true,
    order: 3,
  },
  {
    id: 'nems',
    name: 'Nems',
    category: 'nems',
    price: 200,
    description: 'Nems impériaux ultra croustillants dorés à souhait sur lit de salade, avec sauce pimentée douce.',
    imageUrl: '/images/nems_crispy_1790708624249.webp',
    isAvailable: true,
    order: 4,
  },
  {
    id: 'poutine',
    name: 'Poutine',
    category: 'poutine',
    price: 3000,
    description: 'Poutine gratinée maison dans son plat en terre cuite avec fromage filant et sauce mijotée.',
    imageUrl: '/images/poutine_dish_1790708654988.webp',
    isAvailable: true,
    order: 5,
    hasVariants: true,
    variants: [
      { id: 'crevettes', name: 'Crevettes', price: 3000 },
      { id: 'viande', name: 'Viande', price: 3000 },
    ],
  },
];

export const INITIAL_STORE_STATUS: StoreStatus = {
  isOpen: true,
  isSundayMode: false,
  bannerNotice: 'Bienvenue chez Chez Bineta ! Découvrez nos délices croustillants et commandez en un instant.',
};
