import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Vendor } from "./Vendor"; import { User } from "./User";
export enum StoryMediaType { IMAGE="image", VIDEO="video" }
@Entity("stories") @Index(["vendor","expiresAt"])
export class Story {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() mediaUrl: string;
  @Column({ nullable:true }) thumbnailUrl: string;
  @Column({ type:"enum", enum:StoryMediaType, default:StoryMediaType.IMAGE }) mediaType: StoryMediaType;
  @Column({ type:"text", nullable:true }) caption: string;
  @Column({ nullable:true }) link: string;
  @Column({ default:0 }) viewsCount: number;
  @Column({ default:false }) isActive: boolean;
  @Column({ type:"timestamp" }) expiresAt: Date;
  @ManyToOne(() => Vendor, { onDelete:"CASCADE" }) @JoinColumn() vendor: Vendor;
  @ManyToOne(() => User,   { onDelete:"CASCADE" }) @JoinColumn() author: User;
  @CreateDateColumn() createdAt: Date;
}
