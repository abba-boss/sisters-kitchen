import "reflect-metadata";
import path from "path";
import dotenv from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

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
import { Message }     from "../entities/Message";

// V2 social entities
import { Post, PostMedia, PostLike, PostComment, SavedPost } from "../entities/Post";
import { Follower }   from "../entities/Follower";
import { Story, StoryView } from "../entities/Story";
import { RewardWallet, RewardTransaction } from "../entities/RewardWallet";

dotenv.config();

export type DatabaseDriver = "sqlite" | "mysql";

const ENTITIES = [
  // V1
  User, Vendor, Product, Category, Order, OrderItem,
  Review, Favorite, Payment, Notification, Message,
  // V2
  Post, PostMedia, PostLike, PostComment, SavedPost,
  Follower, Story, StoryView,
  RewardWallet, RewardTransaction,
];

/**
 * SQLite and MySQL need different DDL (uuid columns, datetime defaults, enum and
 * json handling), so each driver keeps its own migration folder. `npm run
 * migration:generate -- <Name>` writes into the folder for the active driver.
 */
const resolveDriver = (): DatabaseDriver => {
  const raw = (process.env.DB_TYPE || "sqlite").toLowerCase();
  if (raw !== "sqlite" && raw !== "mysql") {
    throw new Error(`Unsupported DB_TYPE "${raw}". Use "sqlite" (development) or "mysql" (production).`);
  }
  return raw;
};

const logging = process.env.DB_LOGGING === "true" ? (["query", "error"] as const) : (["error"] as const);

const common = {
  entities: ENTITIES,
  migrations: [path.join(__dirname, "..", "migrations", resolveDriver(), "*.{ts,js}")],
  // Schema changes go through migrations only — never auto-sync, in any environment.
  synchronize: false,
  // Opt-in convenience for single-node deployments; off by default so a bad
  // migration can't run itself on boot without an operator asking for it.
  migrationsRun: process.env.DB_MIGRATIONS_RUN === "true",
  logging: [...logging],
} as const;

const buildOptions = (): DataSourceOptions => {
  const driver = resolveDriver();

  if (driver === "mysql") {
    return {
      type: "mysql",
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "sisters_kitchen",
      charset: "utf8mb4_unicode_ci",
      timezone: "Z",
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
          : undefined,
      ...(common as any),
    };
  }

  return {
    type: "sqlite",
    database: process.env.DB_DATABASE || "./data/sisters_kitchen.sqlite",
    ...(common as any),
  };
};

export const AppDataSource = new DataSource(buildOptions());

export const databaseDriver = resolveDriver();

/** Human-readable description of where the app is storing data (never includes the password). */
export const describeDatabase = (): string => {
  if (databaseDriver === "mysql") {
    return `mysql://${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || "sisters_kitchen"}`;
  }
  return `sqlite:${process.env.DB_DATABASE || "./data/sisters_kitchen.sqlite"}`;
};
