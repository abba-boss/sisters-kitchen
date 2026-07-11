import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Post } from "./Post";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
}

@Entity("post_media")
export class PostMedia {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({
    type: "enum",
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  type: MediaType;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  duration: number; // seconds for video

  @Column({ nullable: true })
  altText: string;

  @ManyToOne(() => Post, (post) => post.media, { onDelete: "CASCADE" })
  @JoinColumn()
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
