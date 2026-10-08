import { Vendor } from "./Vendor";
import { User } from "./User";
export declare class Story {
    id: string;
    mediaUrl: string;
    thumbnailUrl: string;
    mediaType: "image" | "video";
    caption: string;
    link: string;
    viewsCount: number;
    isActive: boolean;
    expiresAt: Date;
    vendor: Vendor;
    author: User;
    views: StoryView[];
    createdAt: Date;
}
export declare class StoryView {
    id: string;
    user: User;
    story: Story;
    viewedAt: Date;
}
//# sourceMappingURL=Story.d.ts.map