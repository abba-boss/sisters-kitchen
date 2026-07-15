import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User"; import { Post } from "./Post";
@Entity("saved_posts") @Unique(["user","post"])
export class SavedPost {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User, { onDelete:"CASCADE" }) @JoinColumn() user: User;
  @ManyToOne(() => Post, { onDelete:"CASCADE" }) @JoinColumn() post: Post;
  @CreateDateColumn() createdAt: Date;
}
