import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User"; import { Story } from "./Story";
@Entity("story_views") @Unique(["user","story"])
export class StoryView {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User,  { onDelete:"CASCADE" }) @JoinColumn() user: User;
  @ManyToOne(() => Story, { onDelete:"CASCADE" }) @JoinColumn() story: Story;
  @CreateDateColumn() viewedAt: Date;
}
