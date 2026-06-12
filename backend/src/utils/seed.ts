import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../config/database";
import { Category } from "../entities/Category";
import { User, UserRole } from "../entities/User";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { Product } from "../entities/Product";
import { Order, OrderStatus } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Review } from "../entities/Review";
import { Notification, NotificationType } from "../entities/Notification";
import bcrypt from "bcryptjs";

// ─── Helpers ────────────────────────────────────────────────────
const hash = (p: string) => bcrypt.hash(p, 10);

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function orderNum() {
  return `SK-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

// ─── Seed data ──────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Rice & Stew",       icon: "🍛", description: "Jollof, fried rice, white rice and all the stews",       sortOrder: 1 },
  { name: "Shawarma",          icon: "🌯", description: "Chicken, beef and mixed shawarma rolls",                 sortOrder: 2 },
  { name: "Pizza",             icon: "🍕", description: "Homemade artisan pizzas with fresh toppings",            sortOrder: 3 },
  { name: "Burgers",           icon: "🍔", description: "Juicy grilled burgers and sandwiches",                   sortOrder: 4 },
  { name: "Cakes & Pastries",  icon: "🎂", description: "Custom cakes, cupcakes, and baked goods",               sortOrder: 5 },
  { name: "Smoothies & Drinks",icon: "🥤", description: "Fresh fruit smoothies, juices and milkshakes",          sortOrder: 6 },
  { name: "Snacks",            icon: "🍟", description: "Chin chin, puff puff, spring rolls and more",           sortOrder: 7 },
  { name: "Local Dishes",      icon: "🥘", description: "Egusi, ogbono, efo riro and traditional soups",         sortOrder: 8 },
  { name: "Fruits",            icon: "🍓", description: "Fresh cut fruits and fruit salads",                     sortOrder: 9 },
  { name: "Doughnuts",         icon: "🍩", description: "Soft, glazed and filled doughnuts",                     sortOrder: 10 },
  { name: "Grills & BBQ",      icon: "🍖", description: "Grilled chicken, suya, fish and BBQ platters",          sortOrder: 11 },
  { name: "Pasta & Noodles",   icon: "🍝", description: "Spaghetti, pasta salads and stir-fry noodles",          sortOrder: 12 },
];

const VENDORS_DATA = [
  {
    firstName: "Ngozi",    lastName: "Okonkwo",
    email: "mama.ngozi@sisterskitchen.ng",    password: "Vendor@2024",
    phone: "+2348012345678",
    businessName: "Mama Ngozi's Kitchen",
    description: "Authentic Nigerian home cooking made with love. Specialising in jollof rice, egusi soup, and traditional stews passed down from my grandmother.",
    address: "Yaba, Lagos", whatsapp: "+2348012345678",
    openingTime: "08:00", closingTime: "21:00",
    availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    cover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    logo: "https://images.unsplash.com/photo-1547592180-85f173990554?w=200",
    rating: 4.8, totalReviews: 127, totalOrders: 342,
    categories: ["Rice & Stew", "Local Dishes"],
  },
  {
    firstName: "Fatima",   lastName: "Bello",
    email: "fatima.shawarma@sisterskitchen.ng", password: "Vendor@2024",
    phone: "+2348023456789",
    businessName: "Fatima's Shawarma Palace",
    description: "Lagos's best shawarma! Made fresh daily with premium chicken, beef, and our secret garlic sauce. Serving smiles since 2018.",
    address: "Lekki Phase 1, Lagos", whatsapp: "+2348023456789",
    openingTime: "11:00", closingTime: "23:00",
    availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
    logo: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200",
    rating: 4.9, totalReviews: 203, totalOrders: 589,
    categories: ["Shawarma", "Snacks"],
  },
  {
    firstName: "Chisom",   lastName: "Eze",
    email: "chisom.cakes@sisterskitchen.ng",  password: "Vendor@2024",
    phone: "+2348034567890",
    businessName: "Chisom's Cake Studio",
    description: "Custom celebration cakes, cupcakes, and artisan pastries baked fresh to order. Every cake tells your story!",
    address: "Ikeja GRA, Lagos", whatsapp: "+2348034567890",
    openingTime: "09:00", closingTime: "20:00",
    availableDays: ["Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    logo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200",
    rating: 4.9, totalReviews: 88, totalOrders: 156,
    categories: ["Cakes & Pastries", "Doughnuts"],
  },
  {
    firstName: "Amara",    lastName: "Obi",
    email: "amara.smoothies@sisterskitchen.ng", password: "Vendor@2024",
    phone: "+2348045678901",
    businessName: "Amara's Fresh Blends",
    description: "100% natural smoothies, cold-pressed juices and healthy bowls. No sugar added, just pure fruit goodness!",
    address: "Victoria Island, Lagos", whatsapp: "+2348045678901",
    openingTime: "07:00", closingTime: "19:00",
    availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    cover: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800",
    logo: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=200",
    rating: 4.7, totalReviews: 64, totalOrders: 218,
    categories: ["Smoothies & Drinks", "Fruits"],
  },
  {
    firstName: "Blessing", lastName: "Adeyemi",
    email: "blessing.burger@sisterskitchen.ng", password: "Vendor@2024",
    phone: "+2348056789012",
    businessName: "Blessing's Burger Joint",
    description: "Gourmet smash burgers, loaded fries and craft sandwiches made with fresh, locally sourced ingredients.",
    address: "Surulere, Lagos", whatsapp: "+2348056789012",
    openingTime: "12:00", closingTime: "22:00",
    availableDays: ["Monday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    logo: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=200",
    rating: 4.6, totalReviews: 92, totalOrders: 276,
    categories: ["Burgers", "Snacks"],
  },
  {
    firstName: "Kemi",     lastName: "Adebayo",
    email: "kemi.pizza@sisterskitchen.ng",    password: "Vendor@2024",
    phone: "+2348067890123",
    businessName: "Kemi's Artisan Pizza",
    description: "Wood-fired style pizzas with Nigerian and Italian twist. Thin crust, generous toppings, real cheese.",
    address: "Ajah, Lagos", whatsapp: "+2348067890123",
    openingTime: "13:00", closingTime: "22:00",
    availableDays: ["Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    logo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200",
    rating: 4.5, totalReviews: 71, totalOrders: 189,
    categories: ["Pizza"],
  },
  {
    firstName: "Yetunde",  lastName: "Ogunwale",
    email: "yetunde.grill@sisterskitchen.ng", password: "Vendor@2024",
    phone: "+2348078901234",
    businessName: "Yetunde's Grill House",
    description: "Premium suya, peppered chicken, grilled fish and BBQ platters. The authentic taste of Nigerian street grill, elevated.",
    address: "Abuja, FCT", whatsapp: "+2348078901234",
    openingTime: "15:00", closingTime: "23:00",
    availableDays: ["Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    logo: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200",
    rating: 4.7, totalReviews: 105, totalOrders: 267,
    categories: ["Grills & BBQ", "Snacks"],
  },
  {
    firstName: "Adaeze",   lastName: "Nwankwo",
    email: "adaeze.pasta@sisterskitchen.ng",  password: "Vendor@2024",
    phone: "+2348089012345",
    businessName: "Adaeze's Pasta Corner",
    description: "Homemade pasta dishes, fried noodles, and pasta salads. Fusion of Nigerian flavors with Italian classics.",
    address: "Enugu State", whatsapp: "+2348089012345",
    openingTime: "11:00", closingTime: "21:00",
    availableDays: ["Monday","Tuesday","Thursday","Friday","Saturday"],
    cover: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800",
    logo: "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=200",
    rating: 4.4, totalReviews: 53, totalOrders: 144,
    categories: ["Pasta & Noodles"],
  },
  {
    firstName: "Hauwa",    lastName: "Ibrahim",
    email: "hauwa.local@sisterskitchen.ng",   password: "Vendor@2024",
    phone: "+2348090123456",
    businessName: "Hauwa's Northern Kitchen",
    description: "Authentic Northern Nigerian cuisine — tuwo, miyan kuka, kilishi, and masa. A taste of home for the North.",
    address: "Kano State", whatsapp: "+2348090123456",
    openingTime: "07:00", closingTime: "20:00",
    availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    cover: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800",
    logo: "https://images.unsplash.com/photo-1547592180-85f173990554?w=200",
    rating: 4.6, totalReviews: 79, totalOrders: 198,
    categories: ["Local Dishes", "Rice & Stew"],
  },
  {
    firstName: "Sola",     lastName: "Fashola",
    email: "sola.snacks@sisterskitchen.ng",   password: "Vendor@2024",
    phone: "+2348001234567",
    businessName: "Sola's Snack Box",
    description: "Freshly made Nigerian snacks — chin chin, puff puff, spring rolls, and samosas. Perfect for events and daily cravings.",
    address: "Ibadan, Oyo State", whatsapp: "+2348001234567",
    openingTime: "09:00", closingTime: "20:00",
    availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    cover: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800",
    logo: "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=200",
    rating: 4.5, totalReviews: 61, totalOrders: 312,
    categories: ["Snacks", "Doughnuts"],
  },
  {
    firstName: "Remi",     lastName: "Coker",
    email: "remi.fruits@sisterskitchen.ng",   password: "Vendor@2024",
    phone: "+2348011223344",
    businessName: "Remi's Fresh Fruits",
    description: "Premium fresh-cut fruit bowls, fruit salads, and seasonal fruit trays. Healthy, delicious, delivered fresh daily.",
    address: "Port Harcourt, Rivers State", whatsapp: "+2348011223344",
    openingTime: "07:00", closingTime: "18:00",
    availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800",
    logo: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200",
    rating: 4.8, totalReviews: 45, totalOrders: 267,
    categories: ["Fruits", "Smoothies & Drinks"],
  },
  {
    firstName: "Temi",     lastName: "Bankole",
    email: "temi.donuts@sisterskitchen.ng",   password: "Vendor@2024",
    phone: "+2348022334455",
    businessName: "Temi's Donut Heaven",
    description: "Soft, fluffy, hand-glazed doughnuts in 20+ flavours. From classic glazed to Nigerian chin-chin filled doughnuts!",
    address: "Ikeja, Lagos", whatsapp: "+2348022334455",
    openingTime: "07:00", closingTime: "21:00",
    availableDays: ["Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    cover: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
    logo: "https://images.unsplash.com/photo-1612880353980-9e5a9ce85c0b?w=200",
    rating: 4.9, totalReviews: 138, totalOrders: 421,
    categories: ["Doughnuts", "Cakes & Pastries"],
  },
];

const CUSTOMERS_DATA = [
  { firstName: "Amaka",  lastName: "Obi",      email: "customer@sisterskitchen.ng",         phone: "+2348087654321", password: "Customer@2024", address: "Yaba, Lagos" },
  { firstName: "Chidi",  lastName: "Nwosu",    email: "chidi.nwosu@example.com",            phone: "+2348076543210", password: "Customer@2024", address: "Ikeja, Lagos" },
  { firstName: "Grace",  lastName: "Okafor",   email: "grace.okafor@example.com",           phone: "+2348065432109", password: "Customer@2024", address: "Lekki, Lagos" },
  { firstName: "Taiwo",  lastName: "Adebisi",  email: "taiwo.adebisi@example.com",          phone: "+2348054321098", password: "Customer@2024", address: "Surulere, Lagos" },
  { firstName: "Emeka",  lastName: "Uchenna",  email: "emeka.uchenna@example.com",          phone: "+2348043210987", password: "Customer@2024", address: "Victoria Island, Lagos" },
  { firstName: "Zara",   lastName: "Musa",     email: "zara.musa@example.com",              phone: "+2348032109876", password: "Customer@2024", address: "Wuse, Abuja" },
  { firstName: "Tunde",  lastName: "Lawson",   email: "tunde.lawson@example.com",           phone: "+2348021098765", password: "Customer@2024", address: "GRA, Port Harcourt" },
];

// Products per vendor category
const PRODUCTS_MAP: Record<string, Array<{
  name: string; description: string; price: number; discountPrice?: number;
  preparationTime: string; tags: string[]; isFeatured?: boolean; isFreshToday?: boolean;
  image: string;
}>> = {
  "Rice & Stew": [
    { name: "Jollof Rice + Chicken", description: "Party-style jollof rice cooked with tomato base, served with smoky oven chicken and coleslaw.", price: 2500, discountPrice: 2200, preparationTime: "25–30 mins", tags: ["popular","spicy","party"], isFeatured: true, isFreshToday: true, image: "https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=500" },
    { name: "White Rice + Egusi Soup", description: "Steamed white rice served with rich egusi soup cooked with stockfish and assorted meat.", price: 2200, preparationTime: "30–35 mins", tags: ["traditional","protein"], image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500" },
    { name: "Fried Rice + Beef Stew", description: "Nigerian-style fried rice packed with veggies, mixed meats and our signature beef stew.", price: 2800, preparationTime: "20–25 mins", tags: ["popular","filling"], isFeatured: true, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500" },
  ],
  "Local Dishes": [
    { name: "Ogbono Soup + Pounded Yam", description: "Thick ogbono soup with assorted meat, stockfish, and shaki, served with freshly pounded yam.", price: 3000, preparationTime: "35–40 mins", tags: ["traditional","heavy"], isFreshToday: true, image: "https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=500" },
    { name: "Efo Riro + Semolina", description: "Yoruba-style spinach stew with assorted proteins, served with smooth semolina.", price: 2800, preparationTime: "30–35 mins", tags: ["healthy","traditional"], image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500" },
    { name: "Afang Soup + Eba", description: "Cross River afang soup with waterleaf, periwinkle and smoked fish, served with warm eba.", price: 3500, preparationTime: "40–45 mins", tags: ["authentic","south-south"], isFeatured: true, image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500" },
  ],
  "Shawarma": [
    { name: "Chicken Shawarma (Large)", description: "Grilled chicken strips, fresh veggies, pickled turnip and our secret garlic mayo in a warm tortilla.", price: 2000, discountPrice: 1800, preparationTime: "10–15 mins", tags: ["fast","popular","grilled"], isFeatured: true, isFreshToday: true, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500" },
    { name: "Beef Shawarma", description: "Tender marinated beef with crispy onions, fresh tomatoes and signature sauce wrapped in flatbread.", price: 2200, preparationTime: "10–15 mins", tags: ["beef","filling"], image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
    { name: "Mixed Shawarma Platter", description: "Get the best of both! Chicken and beef shawarma served with fries and dipping sauce.", price: 3500, preparationTime: "15–20 mins", tags: ["combo","value"], isFeatured: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500" },
    { name: "Shawarma Fries", description: "Loaded crispy fries topped with chicken strips, cheese sauce and garlic mayo. Irresistible!", price: 1800, preparationTime: "10–12 mins", tags: ["snack","quick"], image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500" },
  ],
  "Snacks": [
    { name: "Puff Puff (20 pieces)", description: "Soft, pillowy Nigerian puff puff fried to golden perfection. Classic street-food comfort.", price: 800, discountPrice: 700, preparationTime: "15–20 mins", tags: ["sweet","classic"], isFreshToday: true, image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500" },
    { name: "Chin Chin (500g bag)", description: "Crunchy, lightly sweetened chin chin made from scratch. Perfect for snacking anytime.", price: 1200, preparationTime: "Ready in stock", tags: ["crunchy","long-shelf"], isFeatured: true, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500" },
    { name: "Spring Rolls (6 pcs)", description: "Crispy spring rolls filled with seasoned vegetables and chicken. Great for parties too!", price: 1500, preparationTime: "15–20 mins", tags: ["party","crispy"], image: "https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=500" },
  ],
  "Cakes & Pastries": [
    { name: "Red Velvet Slice", description: "Moist red velvet cake with rich cream cheese frosting. Cut fresh per order.", price: 1500, preparationTime: "5 mins (cut to order)", tags: ["dessert","classic"], isFreshToday: true, image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500" },
    { name: "Custom Birthday Cake (1kg)", description: "Personalized 1kg celebration cake — choose your flavor and design. Order 24 hrs in advance.", price: 8000, discountPrice: 7500, preparationTime: "24 hrs advance order", tags: ["custom","celebration"], isFeatured: true, image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500" },
    { name: "Mini Cupcake Box (12 pcs)", description: "Assorted mini cupcakes in 4 flavors: vanilla, chocolate, strawberry, and lemon.", price: 3500, preparationTime: "2 hrs", tags: ["assorted","gift"], image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500" },
  ],
  "Smoothies & Drinks": [
    { name: "Tropical Blend (500ml)", description: "Mango, pineapple, banana and coconut water blended fresh. No added sugar!", price: 1500, preparationTime: "5 mins", tags: ["healthy","tropical"], isFreshToday: true, image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500" },
    { name: "Strawberry Delight", description: "Strawberry, yogurt and honey smoothie — thick, creamy and packed with antioxidants.", price: 1800, discountPrice: 1600, preparationTime: "5 mins", tags: ["fruity","dairy"], isFeatured: true, image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=500" },
    { name: "Green Detox Juice", description: "Cucumber, ginger, lemon and spinach cold-pressed juice. Detox and refresh!", price: 2000, preparationTime: "5 mins", tags: ["detox","healthy"], image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500" },
  ],
  "Burgers": [
    { name: "Classic Smash Burger", description: "Double smashed beef patty, cheddar, pickles, caramelized onions and burger sauce on a brioche bun.", price: 3500, preparationTime: "15–20 mins", tags: ["classic","beef","popular"], isFeatured: true, isFreshToday: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
    { name: "Chicken Crispy Burger", description: "Crispy fried chicken thigh, coleslaw, jalapeños and honey mustard on a toasted bun.", price: 3000, discountPrice: 2700, preparationTime: "15–20 mins", tags: ["crispy","chicken"], image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500" },
    { name: "Veggie Stack Burger", description: "Grilled portobello, roasted peppers, avocado and haloumi on a seeded bun. Vegetarian delight!", price: 2800, preparationTime: "15 mins", tags: ["veggie","healthy"], image: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=500" },
  ],
  "Pizza": [
    { name: "Suya Chicken Pizza (12\")", description: "Nigerian suya-spiced chicken, bell peppers, red onion and mozzarella on thin crust. Unique fusion!", price: 4500, preparationTime: "25–30 mins", tags: ["fusion","unique","spicy"], isFeatured: true, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" },
    { name: "Margherita (12\")", description: "Classic San Marzano tomato, fresh mozzarella and basil on hand-stretched dough.", price: 3800, discountPrice: 3500, preparationTime: "25 mins", tags: ["classic","vegetarian"], image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500" },
    { name: "Pepperoni Overload (12\")", description: "Loaded with double pepperoni, Italian sausage and three-cheese blend. Meat lovers rejoice!", price: 5000, preparationTime: "25–30 mins", tags: ["meat","loaded"], isFreshToday: true, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500" },
  ],
  "Grills & BBQ": [
    { name: "Suya Platter (500g)", description: "Spicy sliced beef suya skewers with onion, tomato and yaji spice. The real Lagos street experience.", price: 3000, preparationTime: "20–25 mins", tags: ["spicy","street-food"], isFeatured: true, isFreshToday: true, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500" },
    { name: "Peppered Chicken (Half)", description: "Oven-roasted half chicken marinated in scotch bonnet and suya spices. Smoky and tender.", price: 3500, preparationTime: "30–35 mins", tags: ["spicy","protein"], image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=500" },
    { name: "Grilled Tilapia + Pepper Sauce", description: "Whole tilapia grilled over charcoal, served with hot pepper sauce and agege bread.", price: 4000, preparationTime: "25–30 mins", tags: ["fish","protein","spicy"], isFeatured: true, image: "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=500" },
  ],
  "Pasta & Noodles": [
    { name: "Nigerian Spaghetti Bolognese", description: "Spaghetti in rich tomato-beef sauce with Nigerian spices, scotch bonnet and assorted veggies.", price: 2200, preparationTime: "20–25 mins", tags: ["fusion","filling"], isFeatured: true, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500" },
    { name: "Stir-Fry Noodles + Chicken", description: "Egg noodles stir-fried with chicken, peppers and soy-ginger sauce. Ready in minutes!", price: 2000, discountPrice: 1800, preparationTime: "15 mins", tags: ["fast","asian-fusion"], image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500" },
  ],
  "Fruits": [
    { name: "Mixed Fruit Bowl (Large)", description: "Seasonal fresh-cut fruits: watermelon, pineapple, mango, pawpaw and grapes. 500g serving.", price: 1800, preparationTime: "5 mins", tags: ["fresh","healthy"], isFreshToday: true, image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500" },
    { name: "Fruit Salad with Yogurt", description: "Chunky fruit salad in light syrup topped with Greek yogurt and granola.", price: 2200, preparationTime: "5 mins", tags: ["healthy","breakfast"], isFeatured: true, image: "https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=500" },
  ],
  "Doughnuts": [
    { name: "Classic Glazed Dozen", description: "12 perfectly glazed soft doughnuts. The timeless favourite — great for office treats!", price: 3500, discountPrice: 3000, preparationTime: "Fresh daily from 8am", tags: ["classic","value","bulk"], isFeatured: true, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500" },
    { name: "Strawberry Filled Doughnuts (6 pcs)", description: "Fluffy doughnuts filled with strawberry jam and dusted in powdered sugar. Heaven!", price: 2500, preparationTime: "Ready in stock", tags: ["filled","sweet"], isFreshToday: true, image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500" },
    { name: "Chin-Chin Stuffed Donut", description: "Our signature creation — soft donut filled with chin chin crumble and caramel. Unique to us!", price: 500, preparationTime: "Ready in stock", tags: ["signature","unique"], isFeatured: true, image: "https://images.unsplash.com/photo-1605279927685-b1ebf7aba7ef?w=500" },
  ],
};

const REVIEW_COMMENTS = [
  "Absolutely delicious! Best I've ever had!",
  "Delivered on time and food was still hot. 10/10!",
  "My family loved it. Will definitely order again.",
  "Great portion size for the price. Very filling!",
  "The packaging was neat and professional. Food tasted amazing.",
  "Exceeded my expectations. The quality is consistently excellent.",
  "Fast delivery, fresh food. This is my new favourite vendor!",
  "Made my birthday special. The custom cake was gorgeous!",
  "Authentic Nigerian taste. Reminds me of my mum's cooking.",
  "Very fresh ingredients. You can taste the quality.",
  "Ordered for office lunch. Everyone was impressed!",
  "Reasonable prices for such quality food. Highly recommend.",
];

// ─── Main seed function ─────────────────────────────────────────
async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    // ── 1. Categories ──────────────────────────────────────────
    const catRepo = AppDataSource.getRepository(Category);
    const catMap: Record<string, Category> = {};

    for (const c of CATEGORIES) {
      let cat = await catRepo.findOne({ where: { name: c.name } });
      if (!cat) {
        cat = await catRepo.save(catRepo.create(c));
        process.stdout.write(`📂 ${c.name}  `);
      }
      catMap[c.name] = cat;
    }
    console.log("\n✅ Categories seeded\n");

    // ── 2. Admin user ──────────────────────────────────────────
    const userRepo = AppDataSource.getRepository(User);
    const adminEmail = "admin@sisterskitchen.ng";
    if (!(await userRepo.findOne({ where: { email: adminEmail } }))) {
      await userRepo.save(userRepo.create({
        firstName: "Super", lastName: "Admin", email: adminEmail,
        password: await hash("Admin@2024"), role: UserRole.ADMIN,
        isActive: true, isEmailVerified: true,
      }));
      console.log("👑 Admin created: admin@sisterskitchen.ng / Admin@2024");
    }

    // ── 3. Vendors + Products ──────────────────────────────────
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const productRepo = AppDataSource.getRepository(Product);
    const vendors: Vendor[] = [];

    for (const v of VENDORS_DATA) {
      let vendorUser = await userRepo.findOne({ where: { email: v.email } });
      if (!vendorUser) {
        vendorUser = await userRepo.save(userRepo.create({
          firstName: v.firstName, lastName: v.lastName,
          email: v.email, phone: v.phone,
          password: await hash(v.password), role: UserRole.VENDOR,
          isActive: true,
        }));
      }

      let vendor = await vendorRepo.findOne({ where: { user: { id: vendorUser.id } } });
      if (!vendor) {
        vendor = await vendorRepo.save(vendorRepo.create({
          businessName: v.businessName, description: v.description,
          address: v.address, phone: v.phone, whatsapp: v.whatsapp,
          openingTime: v.openingTime, closingTime: v.closingTime,
          availableDays: v.availableDays,
          coverImage: v.cover, logo: v.logo,
          status: VendorStatus.APPROVED, isOpen: true,
          rating: v.rating, totalReviews: v.totalReviews, totalOrders: v.totalOrders,
          totalEarnings: v.totalOrders * randInt(2000, 4000),
          user: vendorUser,
        }));
        process.stdout.write(`🏪 ${v.businessName}  `);
      }
      vendors.push(vendor);

      // Seed products for each vendor category
      for (const catName of v.categories) {
        const cat = catMap[catName];
        const products = PRODUCTS_MAP[catName] || [];
        for (const p of products) {
          const exists = await productRepo.findOne({ where: { name: p.name, vendor: { id: vendor.id } } });
          if (!exists) {
            await productRepo.save(productRepo.create({
              name: p.name, description: p.description,
              price: p.price, discountPrice: p.discountPrice,
              images: [p.image],
              isAvailable: true,
              isFeatured: p.isFeatured || false,
              isFreshToday: p.isFreshToday || false,
              stock: randInt(10, 50),
              preparationTime: p.preparationTime,
              tags: p.tags, rating: 0, totalReviews: 0, totalOrders: 0,
              vendor, category: cat,
            }));
          }
        }
      }
    }
    console.log("\n\n✅ Vendors & products seeded\n");

    // ── 4. Customers ──────────────────────────────────────────
    const customers: User[] = [];
    for (const c of CUSTOMERS_DATA) {
      let user = await userRepo.findOne({ where: { email: c.email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          firstName: c.firstName, lastName: c.lastName,
          email: c.email, phone: c.phone, address: c.address,
          password: await hash(c.password), role: UserRole.CUSTOMER,
          isActive: true,
        }));
        process.stdout.write(`👤 ${c.firstName}  `);
      }
      customers.push(user);
    }
    console.log("\n\n✅ Customers seeded\n");

    // ── 5. Sample orders + reviews ────────────────────────────
    const orderRepo = AppDataSource.getRepository(Order);
    const orderItemRepo = AppDataSource.getRepository(OrderItem);
    const reviewRepo = AppDataSource.getRepository(Review);

    const allProducts = await productRepo.find({ relations: ["vendor"] });

    const ORDER_STATUSES = [
      OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
      OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.PENDING,
    ];

    let ordersCreated = 0;
    for (let i = 0; i < 35; i++) {
      const customer = rand(customers);
      const vendor   = rand(vendors);
      const vendorProds = allProducts.filter((p) => p.vendor?.id === vendor.id);
      if (vendorProds.length === 0) continue;

      const selectedProds = [rand(vendorProds), rand(vendorProds)].filter(
        (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
      );

      let subtotal = 0;
      const savedOrder = await orderRepo.save(orderRepo.create({
        orderNumber: orderNum(),
        user: customer, vendor,
        status: rand(ORDER_STATUSES),
        subtotal: 0, deliveryFee: 500, total: 0,
        deliveryAddress: customer.address || "Lagos, Nigeria",
        deliveryPhone: customer.phone || "+2348000000000",
      }));

      for (const prod of selectedProds) {
        const qty   = randInt(1, 3);
        const price = Number(prod.discountPrice || prod.price);
        const sub   = price * qty;
        subtotal   += sub;

        await orderItemRepo.save(orderItemRepo.create({
          order: savedOrder, product: prod,
          quantity: qty, price, subtotal: sub,
        }));

        // Update product stats
        await productRepo.update(prod.id, {
          totalOrders: (prod.totalOrders || 0) + qty,
        });
      }

      savedOrder.subtotal = subtotal;
      savedOrder.total    = subtotal + 500;
      await orderRepo.save(savedOrder);
      ordersCreated++;

      // Add reviews for delivered orders
      if (savedOrder.status === OrderStatus.DELIVERED) {
        for (const prod of selectedProds) {
          const alreadyReviewed = await reviewRepo.findOne({
            where: { user: { id: customer.id }, product: { id: prod.id } },
          });
          if (!alreadyReviewed) {
            const rating = randInt(4, 5);
            await reviewRepo.save(reviewRepo.create({
              user: customer, product: prod,
              rating, comment: rand(REVIEW_COMMENTS),
            }));

            // Recalculate product rating
            const revs = await reviewRepo.find({ where: { product: { id: prod.id } } });
            const avg  = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
            await productRepo.update(prod.id, {
              rating: Math.round(avg * 10) / 10,
              totalReviews: revs.length,
            });
          }
        }

        // Update vendor earnings
        await vendorRepo.update(vendor.id, {
          totalEarnings: () => `totalEarnings + ${savedOrder.total}` as any,
        });
      }
    }
    console.log(`✅ ${ordersCreated} sample orders + reviews created\n`);

    // ── 6. Final stats ─────────────────────────────────────────
    const [totalVendors, totalProducts, totalOrders, totalCustomers] = await Promise.all([
      vendorRepo.count(),
      productRepo.count(),
      orderRepo.count(),
      userRepo.count({ where: { role: UserRole.CUSTOMER } }),
    ]);

    console.log("═══════════════════════════════════════════");
    console.log("🎉 Seed complete! Summary:");
    console.log(`   👑 1 Admin`);
    console.log(`   🏪 ${totalVendors} Vendors`);
    console.log(`   👤 ${totalCustomers} Customers`);
    console.log(`   🍽️  ${totalProducts} Products`);
    console.log(`   📦 ${totalOrders} Sample Orders`);
    console.log("═══════════════════════════════════════════\n");
    console.log("Login credentials (all use same password pattern):");
    console.log("  Admin:     admin@sisterskitchen.ng            / Admin@2024");
    console.log("  Customer:  customer@sisterskitchen.ng         / Customer@2024");
    console.log("  Vendor:    mama.ngozi@sisterskitchen.ng       / Vendor@2024");
    console.log("  (and 11 more vendors — see seed.ts for full list)");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
