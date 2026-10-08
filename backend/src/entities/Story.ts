import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from "typeorm";
import { Vendor } from "./Vendor";
import { User }   from "./User";

@Entity("stories")
export class Story {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() mediaUrl: string;
  @Column({ nullable: true }) thumbnailUrl: string;
  @Column({ type: "enum", enum: ["image", "video"], default: "image" }) mediaType: "image" | "video";
  @Column({ type: "text", nullable: true }) caption: string;
  @Column({ nullable: true }) link: string;
  @Column({ default: 0 }) viewsCount: number;
  @Column({ default: true }) isActive: boolean;
  @Column({ type: "timestamp" }) expiresAt: Date;
  @ManyToOne(() => Vendor, { nullable: true, onDelete: "CASCADE" }) @JoinColumn() vendor: Vendor;
  @ManyToOne(() => User,   { nullable: true, onDelete: "CASCADE" }) @JoinColumn() author: User;
  @OneToMany(() => StoryView, (sv) => sv.story, { cascade: true }) views: StoryView[];
  @CreateDateColumn() createdAt: Date;
}

@Entity("story_views")
export class StoryView {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User,  { nullable: true, onDelete: "SET NULL" }) @JoinColumn() user: User;
  @ManyToOne(() => Story, { onDelete: "CASCADE" }) @JoinColumn() story: Story;
  @CreateDateColumn() viewedAt: Date;
}
