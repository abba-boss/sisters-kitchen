import { Vendor } from "./Vendor";
import { User } from "./User";
import { Product } from "./Product";
export declare enum PostType {
    IMAGE = "image",
    VIDEO = "video",
    TEXT = "text",
    PROMOTION = "promotion",
    AVAILABILITY = "availability",
    ANNOUNCEMENT = "announcement",
    BEHIND_SCENES = "behind_scenes",
    RECIPE = "recipe",
    CUSTOMER_HIGHLIGHT = "customer_highlight"
}
export declare enum PostStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived",
    DELETED = "deleted"
}
export declare class Post {
    id: string;
    caption: string;
    type: PostType;
    status: PostStatus;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    allowComments: boolean;
    tags: string;
    location: string;
    scheduledAt: Date | null;
    vendor: Vendor;
    author: User;
    product: Product;
    media: PostMedia[];
    likes: PostLike[];
    comments: PostComment[];
    saves: SavedPost[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class PostMedia {
    id: string;
    url: string;
    thumbnailUrl: string;
    type: "image" | "video";
    sortOrder: number;
    altText: string;
    width: number;
    height: number;
    duration: number;
    post: Post;
    createdAt: Date;
}
export declare class PostLike {
    id: string;
    user: User;
    post: Post;
    createdAt: Date;
}
export declare class PostComment {
    id: string;
    content: string;
    isDeleted: boolean;
    likesCount: number;
    user: User;
    post: Post;
    parent: PostComment;
    replies: PostComment[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class SavedPost {
    id: string;
    user: User;
    post: Post;
    createdAt: Date;
}
//# sourceMappingURL=Post.d.ts.map