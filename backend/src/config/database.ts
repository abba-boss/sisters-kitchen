import { DataSource } from "typeorm";
import dotenv from "dotenv";

// V1 entities
import { User }       from "../entities/User";
import { Vendor }     from "../entities/Vendor";
import { Product }    from "../entities/Product";
import { Category }   from "../entities/Category";
import { Order }      from "../entities/Order";
import { OrderItem }  from "../entities/OrderItem";
import { Review }     from "../entities/Review";
import { Favorite }   from "../entities/Favorite";
import { Payment }    from "../entities/Payment";
import { Notification } from "../entities/Notification";

// V2 social entities
import { Post, PostMedia, PostLike, PostComment, SavedPost } from "../entities/Post";
import { Follower }   from "../entities/Follower";
import { Story, StoryView } from "../entities/Story";
import { RewardWallet, RewardTransaction } from "../entities/RewardWallet";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sisters_kitchen",
  synchronize: false, // ✅ Back to false for safety
  logging: false,
  entities: [
    // V1
    User, Vendor, Product, Category, Order, OrderItem,
    Review, Favorite, Payment, Notification,
    // V2
    Post, PostMedia, PostLike, PostComment, SavedPost,
    Follower, Story, StoryView,
    RewardWallet, RewardTransaction,
  ],
  migrations: [],
  subscribers: [],
});
