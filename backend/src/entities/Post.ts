import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Vendor } from "./Vendor";
import { User } from "./User";
import { PostMedia } from "./PostMedia";
import { PostLike } from "./PostLike";
import { PostComment } from "./PostComment";
import { Product } from "./Product";

export enum PostType {
  IMAGE       = "image",
  VIDEO       = "video",
  TEXT        = "text",
  PROMOTION   = "promotion",
  AVAILABILITY= "availability",
  ANNOUNCEMENT= "announcement",
  BEHIND_SCENES = "behind_scenes",
  RECIPE      = "recipe",
  CUSTOMER_HIGHLIGHT = "customer_highlight",
}

export enum PostStatus {
  DRAFT     = "draft",
  PUBLISHED = "published",
  ARCHIVED  = "archived",
  DELETED   = "deleted",
}

@Entity("posts")
@Index(["vendor", "status"])
@Index(["createdAt"])
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  caption: string;

  @Column({
    type: "enum",
    enum: PostType,
    default: PostType.IMAGE,
  })
  type: PostType;

  @Column({
    type: "enum",
    enum: PostStatus,
    default: PostStatus.PUBLISHED,
  })
  status: PostStatus;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  sharesCount: number;

  @Column({ default: true })
  allowComments: boolean;

  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  @Column({ nullable: true })
  location: string;

  // Optional link to a product (for promotions)
  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Vendor, { onDelete: "CASCADE" })
  @JoinColumn()
  vendor: Vendor;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  author: User;

  @OneToMany(() => PostMedia, (media) => media.post, { cascade: true })
  media: PostMedia[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @Column({ nullable: true, type: "timestamp" })
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
