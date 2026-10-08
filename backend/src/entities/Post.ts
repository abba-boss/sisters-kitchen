import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from "typeorm";
import { Vendor } from "./Vendor";
import { User } from "./User";
import { Product } from "./Product";

export enum PostType {
  IMAGE             = "image",
  VIDEO             = "video",
  TEXT              = "text",
  PROMOTION         = "promotion",
  AVAILABILITY      = "availability",
  ANNOUNCEMENT      = "announcement",
  BEHIND_SCENES     = "behind_scenes",
  RECIPE            = "recipe",
  CUSTOMER_HIGHLIGHT = "customer_highlight",
}

export enum PostStatus {
  DRAFT     = "draft",
  PUBLISHED = "published",
  ARCHIVED  = "archived",
  DELETED   = "deleted",
}

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn("uuid")   id: string;
  @Column({ type: "text", nullable: true }) caption: string;
  @Column({ type: "enum", enum: PostType, default: PostType.IMAGE }) type: PostType;
  @Column({ type: "enum", enum: PostStatus, default: PostStatus.PUBLISHED }) status: PostStatus;
  @Column({ default: 0 }) likesCount: number;
  @Column({ default: 0 }) commentsCount: number;
  @Column({ default: 0 }) viewsCount: number;
  @Column({ default: 0 }) sharesCount: number;
  @Column({ default: true }) allowComments: boolean;
  @Column({ type: "text", nullable: true }) tags: string;
  @Column({ nullable: true }) location: string;
  @Column({ type: "timestamp", nullable: true }) scheduledAt: Date;

  @ManyToOne(() => Vendor, { nullable: true, onDelete: "CASCADE" }) @JoinColumn() vendor: Vendor;
  @ManyToOne(() => User,   { nullable: true, onDelete: "CASCADE" }) @JoinColumn() author: User;
  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" }) @JoinColumn() product: Product;

  @OneToMany(() => PostMedia,   (m) => m.post, { cascade: true, eager: true }) media: PostMedia[];
  @OneToMany(() => PostLike,    (l) => l.post) likes: PostLike[];
  @OneToMany(() => PostComment, (c) => c.post) comments: PostComment[];
  @OneToMany(() => SavedPost,   (s) => s.post) saves: SavedPost[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity("post_media")
export class PostMedia {
  @PrimaryGeneratedColumn("uuid")  id: string;
  @Column()                         url: string;
  @Column({ nullable: true })       thumbnailUrl: string;
  @Column({ type: "enum", enum: ["image", "video"], default: "image" }) type: "image" | "video";
  @Column({ default: 0 })           sortOrder: number;
  @Column({ nullable: true })       altText: string;
  @Column({ nullable: true })       width: number;
  @Column({ nullable: true })       height: number;
  @Column({ nullable: true })       duration: number;
  @ManyToOne(() => Post, (p) => p.media, { onDelete: "CASCADE" }) @JoinColumn() post: Post;
  @CreateDateColumn()               createdAt: Date;
}

@Entity("post_likes")
export class PostLike {
  @PrimaryGeneratedColumn("uuid")  id: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" }) @JoinColumn() user: User;
  @ManyToOne(() => Post, (p) => p.likes, { onDelete: "CASCADE" }) @JoinColumn() post: Post;
  @CreateDateColumn()              createdAt: Date;
}

@Entity("post_comments")
export class PostComment {
  @PrimaryGeneratedColumn("uuid")  id: string;
  @Column({ type: "text" })         content: string;
  @Column({ default: false })       isDeleted: boolean;
  @Column({ default: 0 })          likesCount: number;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) @JoinColumn() user: User;
  @ManyToOne(() => Post, (p) => p.comments, { onDelete: "CASCADE" }) @JoinColumn() post: Post;
  @ManyToOne(() => PostComment, { nullable: true, onDelete: "CASCADE" }) @JoinColumn() parent: PostComment;
  @OneToMany(() => PostComment, (c) => c.parent) replies: PostComment[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity("saved_posts")
export class SavedPost {
  @PrimaryGeneratedColumn("uuid")  id: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" }) @JoinColumn() user: User;
  @ManyToOne(() => Post, (p) => p.saves, { onDelete: "CASCADE" }) @JoinColumn() post: Post;
  @CreateDateColumn()              createdAt: Date;
}
