/**
 * Seed demo posts for all approved vendors.
 * Run: npx ts-node src/utils/seedPosts.ts
 */
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../config/database";
import { Post, PostType, PostStatus } from "../entities/Post";
import { PostMedia, MediaType } from "../entities/PostMedia";
import { Vendor } from "../entities/Vendor";
import { User } from "../entities/User";

// Unsplash images per category keyword
const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=800",
  "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800",
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
  "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800",
  "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=800",
  "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800",
];

const POSTS_DATA = [
  // image posts
  { type: PostType.IMAGE,       caption: "Fresh jollof rice just off the fire 🍛 Party-style, smoky and full of flavor. Order yours now! ❤️", tags: ["jollof","lagos","homemade"], isFreshToday: false },
  { type: PostType.PROMOTION,   caption: "🔥 FLASH SALE TODAY ONLY! Get 20% off all shawarma orders placed before 6pm. Use this post to claim your discount — just send us a DM! 🌯", tags: ["deals","shawarma","discount"] },
  { type: PostType.IMAGE,       caption: "Sunday vibes = fresh puff puff and cold drinks ☀️ Come get yours, we're open till 8pm!", tags: ["sunday","snacks","fresh"] },
  { type: PostType.BEHIND_SCENES, caption: "Behind the scenes at our kitchen this morning 👩‍🍳✨ Every meal is made with love and the freshest ingredients. #kitchenlife", tags: ["behindthescenes","kitchen","chef"] },
  { type: PostType.RECIPE,      caption: "🍖 Quick suya tip: the secret is in the yaji spice mix. We blend ours fresh every day — that's why ours tastes different! Recipe drop coming soon 👀", tags: ["recipe","suya","tips"] },
  { type: PostType.AVAILABILITY,caption: "✅ TODAY'S MENU:\n• Jollof Rice + Chicken — ₦2,500\n• Fried Rice + Turkey — ₦3,000\n• Egusi Soup + Eba — ₦2,200\n\nOrdering closes at 7pm. DM or order via our store link! 🛒", tags: ["menu","available","order"] },
  { type: PostType.CUSTOMER_HIGHLIGHT, caption: "Look at this gorgeous birthday cake we made for Amaka! 🎂🎉 She trusted us with her special day and we delivered. This is why we do what we do 💕 #customcake #birthday", tags: ["customer","cake","birthday"] },
  { type: PostType.IMAGE,       caption: "Smash burger season is here 🍔🔥 Double patty, cheddar, caramelized onions on a brioche bun. Yes it's as good as it looks.", tags: ["burger","smashburger","food"] },
  { type: PostType.ANNOUNCEMENT,caption: "📢 BIG NEWS! We're now open on Sundays 🎊 From 12pm–8pm. Same great food, now 7 days a week. Tag someone who needs to know!", tags: ["announcement","newdays","open"] },
  { type: PostType.IMAGE,       caption: "Fresh smoothie bowls are BACK for the week 🍓🥭 Tropical blend, strawberry delight, and our new green detox. Healthy never tasted this good!", tags: ["smoothie","healthy","fresh"] },
  { type: PostType.IMAGE,       caption: "Chin chin just dropped — crispy, sweet, 500g bags ready to go 🍪 Perfect for gifting, office snacking, or just for yourself (no judgment 😂)", tags: ["chinchin","snack","crispy"] },
  { type: PostType.IMAGE,       caption: "Pizza Friday! Our suya chicken pizza is back on the menu. Only 20 pies available today — first come, first served 🍕🌶️", tags: ["pizza","friday","limited"] },
];

async function seedPosts() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected\n");

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const postRepo   = AppDataSource.getRepository(Post);
    const mediaRepo  = AppDataSource.getRepository(PostMedia);

    const vendors = await vendorRepo.find({
      where: { status: "approved" as any },
      relations: ["user"],
      take: 12,
    });

    console.log(`Seeding posts for ${vendors.length} vendors…`);

    let created = 0;
    for (let vi = 0; vi < vendors.length; vi++) {
      const vendor = vendors[vi];

      // 3 posts per vendor, cycling through POSTS_DATA
      for (let pi = 0; pi < 3; pi++) {
        const tmpl  = POSTS_DATA[(vi * 3 + pi) % POSTS_DATA.length];
        const imgUrl = FOOD_IMAGES[(vi * 3 + pi) % FOOD_IMAGES.length];

        const post = postRepo.create({
          caption:  tmpl.caption,
          type:     tmpl.type,
          status:   PostStatus.PUBLISHED,
          tags:     tmpl.tags,
          allowComments: true,
          vendor,
          author:   vendor.user,
          likesCount:    Math.floor(Math.random() * 60),
          commentsCount: Math.floor(Math.random() * 20),
          viewsCount:    Math.floor(Math.random() * 300) + 50,
        });
        await postRepo.save(post);

        // Add image media for non-text posts
        if (tmpl.type !== PostType.BEHIND_SCENES || Math.random() > 0.3) {
          await mediaRepo.save(
            mediaRepo.create({ url: imgUrl, type: MediaType.IMAGE, sortOrder: 0, post })
          );
        }

        created++;
        process.stdout.write(`  📸 ${vendor.businessName} — "${tmpl.caption.substring(0, 40)}…"\n`);
      }
    }

    console.log(`\n✅ ${created} posts seeded across ${vendors.length} vendors`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seedPosts();
