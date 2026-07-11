import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from "typeorm";
import { Vendor } from "./Vendor";
import { User }   from "./User";
import { StoryView } from "./StoryView";

export enum StoryMediaType { IMAGE = "image", VIDEO = "video" }

@Entity("stories")
@Index(["vendor", "expiresAt"])
export class Story {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() mediaUrl: string;
  @Column({ nullable: true }) thumbnailUrl: string;

  @Column({ type: "enum", enum: StoryMediaType, default: StoryMediaType.IMAGE })
  mediaType: StoryMediaType;

  @Column({ type: "text", nullable: true }) caption: string;
  @Column({ nullable: true }) link: string;       // optional CTA link
  @Column({ default: 0 }) viewsCount: number;
  @Column({ default: false }) isActive: boolean;

  /** 24-hour expiry */
  @Column({ type: "timestamp" }) expiresAt: Date;

  @ManyToOne(() => Vendor, { onDelete: "CASCADE" })
  @JoinColumn() vendor: Vendor;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn() author: User;

  @OneToMany(() => StoryView, (v) => v.story)
  views: StoryView[];

  @CreateDateColumn() createdAt: Date;
}
