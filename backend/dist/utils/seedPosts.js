"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed V2 posts and stories with realistic food content.
 * Run: ts-node src/utils/seedPosts.ts
 */
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = require("../config/database");
const Post_1 = require("../entities/Post");
const Story_1 = require("../entities/Story");
const Vendor_1 = require("../entities/Vendor");
const Product_1 = require("../entities/Product");
const Vendor_2 = require("../entities/Vendor");
const FOOD_IMAGES = [
    "https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=800",
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800",
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
    "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=800",
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
    "https://images.unsplash.com/photo-1602253057119-44d745d9b860?w=800",
];
const POST_SEEDS = [
    {
        type: Post_1.PostType.PROMOTION,
        caption: "🔥 Friday Special! Our Suya Chicken Pizza is BACK and only available this weekend. Thin crust, smoky suya spices, fresh mozzarella. Limited portions — order now before it sells out!",
        tags: ["pizza", "suya", "friday special", "limited"],
        imageIdx: 4,
    },
    {
        type: Post_1.PostType.AVAILABILITY,
        caption: "✅ Fresh Jollof Rice is ready NOW! Cooked with tomatoes, peppers, and all the right seasonings. Ready for pickup and delivery. Order via the button below 🍛",
        tags: ["jollof rice", "fresh", "ready now", "order now"],
        imageIdx: 0,
    },
    {
        type: Post_1.PostType.BEHIND_SCENES,
        caption: "🎬 Behind the scenes in my kitchen today! Making our famous chicken shawarma — marinating the chicken with our secret blend of spices. The smell is incredible 😍",
        tags: ["behind the scenes", "kitchen", "shawarma", "cooking"],
        imageIdx: 1,
    },
    {
        type: Post_1.PostType.RECIPE,
        caption: "📖 My grandmother's jollof rice secret: Add a tiny bit of tomato paste at the end and let it steam for 5 minutes. That's what gives it that smoky party rice taste! Full recipe coming soon 🍚",
        tags: ["recipe", "jollof rice", "cooking tips", "homemade"],
        imageIdx: 0,
    },
    {
        type: Post_1.PostType.ANNOUNCEMENT,
        caption: "📢 BIG NEWS! We're now open on Sundays! 🎉 Starting this Sunday, you can order from us 11am - 8pm. Tag a friend who always complains we're closed on Sunday!",
        tags: ["announcement", "new hours", "sunday", "open"],
        imageIdx: 7,
    },
    {
        type: Post_1.PostType.PROMOTION,
        caption: "⚡ FLASH DEAL! Buy 2 shawarma, get 1 FREE today only! Valid until 9pm tonight. Use code FLASH3 at checkout or mention this post when ordering on WhatsApp. Don't miss it!",
        tags: ["flash deal", "shawarma", "discount", "buy 2 get 1"],
        imageIdx: 1,
    },
    {
        type: Post_1.PostType.AVAILABILITY,
        caption: "✅ Today's Menu is LIVE! \n🍕 Suya Pizza — ₦4,500\n🥘 Egusi Soup + Pounded Yam — ₦3,000\n🍔 Smash Burger — ₦3,500\n🎂 Red Velvet Cake — ₦1,500\n\nOrder now for pickup or delivery!",
        tags: ["menu", "today", "available", "order now"],
        imageIdx: 8,
    },
    {
        type: Post_1.PostType.CUSTOMER_HIGHLIGHT,
        caption: "⭐ Customer love alert! Thank you @TayoFoods for this beautiful review. \"The best burger I've ever had in Lagos — the smash technique makes all the difference!\" 🙏 We see you and we appreciate you!",
        tags: ["customer review", "burger", "testimonial", "love"],
        imageIdx: 3,
    },
    {
        type: Post_1.PostType.BEHIND_SCENES,
        caption: "🎬 Saturday morning prep! Baking 200 glazed doughnuts before the shop opens. Each one hand-dipped and freshly glazed. The kitchen smells amazing right now 🍩☕",
        tags: ["donuts", "baking", "saturday", "morning prep"],
        imageIdx: 8,
    },
    {
        type: Post_1.PostType.RECIPE,
        caption: "📖 How to get that PERFECT smoky suya flavour:\n1. Use fresh beef, sliced thin\n2. Marinate overnight with yaji, ginger, groundnut\n3. Skewer tightly\n4. Cook over hot charcoal, not gas\n\nThat's the real secret! 🔥",
        tags: ["recipe", "suya", "cooking tips", "street food"],
        imageIdx: 5,
    },
    {
        type: Post_1.PostType.ANNOUNCEMENT,
        caption: "📢 We just hit 500 orders! 🎉🎉🎉 Thank you to every single customer who has trusted us with their meals. To celebrate, ALL orders today get a FREE puff puff! Just add to your order note ❤️",
        tags: ["milestone", "500 orders", "celebration", "free gift"],
        imageIdx: 7,
    },
    {
        type: Post_1.PostType.PROMOTION,
        caption: "🎁 Order any cake this week and get FREE custom message decoration! Whether it's a birthday, anniversary or just a 'thinking of you' — we'll write it beautifully on your cake. Valid till Sunday!",
        tags: ["cake", "promotion", "custom", "birthday"],
        imageIdx: 2,
    },
];
const STORY_SEEDS = [
    { caption: "🍕 Fresh pizza just out of the oven!", imageIdx: 4 },
    { caption: "🛎️ Open for orders now — come get it while it's hot!", imageIdx: 7 },
    { caption: "Behind the scenes: Saturday morning prep 🔥", imageIdx: 5 },
    { caption: "Today's special menu is LIVE ✅", imageIdx: 0 },
    { caption: "Fresh shawarma dropping in 30 mins! 🌯", imageIdx: 1 },
    { caption: "New dessert just arrived! 🎂", imageIdx: 2 },
    { caption: "Kitchen is busy today — orders flowing in! 🍳", imageIdx: 7 },
    { caption: "Friday vibes 🎉 Order up!", imageIdx: 3 },
    { caption: "Fresh doughnuts ready NOW 🍩", imageIdx: 8 },
    { caption: "Closing in 1 hour — last chance to order!", imageIdx: 7 },
];
async function seedPosts() {
    await database_1.AppDataSource.initialize();
    console.log("✅ DB connected\n");
    const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
    const postRepo = database_1.AppDataSource.getRepository(Post_1.Post);
    const mediaRepo = database_1.AppDataSource.getRepository(Post_1.PostMedia);
    const storyRepo = database_1.AppDataSource.getRepository(Story_1.Story);
    const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
    const vendors = await vendorRepo.find({
        where: { status: Vendor_2.VendorStatus.APPROVED },
        relations: ["user", "products"],
        take: 12,
    });
    if (vendors.length === 0) {
        console.log("❌ No approved vendors found. Run npm run seed first.");
        process.exit(1);
    }
    console.log(`Found ${vendors.length} vendors\n`);
    // Clear existing posts/stories to avoid duplicates
    await database_1.AppDataSource.query("DELETE FROM story_views");
    await database_1.AppDataSource.query("DELETE FROM stories");
    await database_1.AppDataSource.query("DELETE FROM post_likes");
    await database_1.AppDataSource.query("DELETE FROM post_comments");
    await database_1.AppDataSource.query("DELETE FROM saved_posts");
    await database_1.AppDataSource.query("DELETE FROM post_media");
    await database_1.AppDataSource.query("DELETE FROM posts");
    console.log("🗑️  Cleared old posts/stories\n");
    let postCount = 0;
    let storyCount = 0;
    for (let vi = 0; vi < vendors.length; vi++) {
        const vendor = vendors[vi];
        // Assign 2-4 posts per vendor in round-robin from POST_SEEDS
        const postsForVendor = Math.floor(Math.random() * 3) + 2; // 2-4 posts
        for (let pi = 0; pi < postsForVendor; pi++) {
            const seed = POST_SEEDS[(vi * 4 + pi) % POST_SEEDS.length];
            // Get a product from this vendor if available
            const vendorProducts = vendor.products || [];
            const linkedProduct = vendorProducts.length > 0
                ? vendorProducts[Math.floor(Math.random() * vendorProducts.length)]
                : undefined;
            const post = postRepo.create({
                caption: seed.caption,
                type: seed.type,
                status: Post_1.PostStatus.PUBLISHED,
                tags: JSON.stringify(seed.tags),
                likesCount: Math.floor(Math.random() * 80) + 5,
                commentsCount: Math.floor(Math.random() * 20),
                viewsCount: Math.floor(Math.random() * 300) + 50,
                allowComments: true,
                vendor: { id: vendor.id },
                author: { id: vendor.user.id },
                product: linkedProduct ? { id: linkedProduct.id } : undefined,
            });
            const savedPost = await postRepo.save(post);
            // Add media
            const mediaItem = mediaRepo.create({
                url: FOOD_IMAGES[seed.imageIdx],
                type: "image",
                sortOrder: 0,
                post: { id: savedPost.id },
            });
            await mediaRepo.save(mediaItem);
            postCount++;
        }
        // Add 1-2 stories per vendor
        const storiesForVendor = Math.floor(Math.random() * 2) + 1;
        for (let si = 0; si < storiesForVendor; si++) {
            const storySeed = STORY_SEEDS[(vi * 2 + si) % STORY_SEEDS.length];
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            const story = storyRepo.create({
                mediaUrl: FOOD_IMAGES[storySeed.imageIdx],
                mediaType: "image",
                caption: storySeed.caption,
                viewsCount: Math.floor(Math.random() * 120) + 10,
                isActive: true,
                expiresAt,
                vendor: { id: vendor.id },
                author: { id: vendor.user.id },
            });
            await storyRepo.save(story);
            storyCount++;
        }
        process.stdout.write(`✅ ${vendor.businessName}  `);
    }
    console.log(`\n\n✅ Seeded ${postCount} posts and ${storyCount} stories`);
    process.exit(0);
}
seedPosts().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});
//# sourceMappingURL=seedPosts.js.map