export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  profileImage: string;
  coverImage: string;
  bio: string;
  friends: string[];
  createdAt: string;
  walletBalance:string;
  roles?: string[];
  packageactive:boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  images: string[];
  videos: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}