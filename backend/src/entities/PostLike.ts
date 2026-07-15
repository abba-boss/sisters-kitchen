import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User"; import { Post } from "./Post";
@Entity("post_likes") @Unique(["user","post"])
export class PostLike {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User, { onDelete:"CASCADE" }) @JoinColumn() user: User;
  @ManyToOne(() => Post, { onDelete:"CASCADE" }) @JoinColumn() post: Post;
  @CreateDateColumn() createdAt: Date;
}
