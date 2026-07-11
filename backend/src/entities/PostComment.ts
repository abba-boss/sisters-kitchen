import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Post } from "./Post";

@Entity("post_comments")
export class PostComment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  content: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: 0 })
  likesCount: number;

  // For nested replies
  @ManyToOne(() => PostComment, (c) => c.replies, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "parentId" })
  parent: PostComment;

  @OneToMany(() => PostComment, (c) => c.parent)
  replies: PostComment[];

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: "CASCADE" })
  @JoinColumn()
  post: Post;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
