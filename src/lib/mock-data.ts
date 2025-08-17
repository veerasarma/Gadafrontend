import { User, Post } from '@/types';
import { generateId } from './utils';

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    firstname: 'John',
    lastname: 'Doe',
    username: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    profileImage: 'https://i.pravatar.cc/150?img=1',
    coverImage: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e',
    bio: 'Software developer and technology enthusiast',
    friends: ['2', '3'],
    createdAt: new Date(2023, 0, 15).toISOString(),
  },
  {
    id: '2',
    firstname: 'Jane',
    lastname: 'Smith',
    username: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    profileImage: 'https://i.pravatar.cc/150?img=2',
    coverImage: 'https://images.unsplash.com/photo-1498736297812-3a08021f206f',
    bio: 'Digital marketing specialist | Coffee lover',
    friends: ['1'],
    createdAt: new Date(2023, 1, 20).toISOString(),
  },
  {
    id: '3',
    firstname: 'Robert',
    lastname: 'Johnson',
    username: 'Robert Johnson',
    email: 'robert@example.com',
    password: 'password123',
    profileImage: 'https://i.pravatar.cc/150?img=3',
    coverImage: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df',
    bio: 'Photographer and travel enthusiast',
    friends: ['1'],
    createdAt: new Date(2023, 2, 10).toISOString(),
  }
];

// Mock posts
export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    content: 'Just finished working on a new project! Can\'t wait to share it with everyone.',
    images: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c'],
    videos: [],
    likes: ['2', '3'],
    comments: [
      {
        id: '1',
        userId: '2',
        content: 'Looks amazing! Can\'t wait to see it.',
        createdAt: new Date(2023, 3, 5, 9, 30).toISOString(),
      }
    ],
    createdAt: new Date(2023, 3, 5, 9, 0).toISOString(),
  },
  {
    id: '2',
    userId: '2',
    content: 'Beautiful day at the beach! 🌊☀️',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e'],
    videos: [],
    likes: ['1'],
    comments: [
      {
        id: '2',
        userId: '1',
        content: 'Wow! Looks incredible.',
        createdAt: new Date(2023, 3, 6, 14, 15).toISOString(),
      },
      {
        id: '3',
        userId: '3',
        content: 'I need a vacation like this!',
        createdAt: new Date(2023, 3, 6, 15, 0).toISOString(),
      }
    ],
    createdAt: new Date(2023, 3, 6, 13, 45).toISOString(),
  },
  {
    id: '3',
    userId: '3',
    content: 'Check out this amazing timelapse I shot yesterday!',
    images: [],
    videos: ['https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'],
    likes: ['1', '2'],
    comments: [],
    createdAt: new Date(2023, 3, 7, 10, 30).toISOString(),
  }
];

// Storage functions
export const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem('currentUser');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const setUserInStorage = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getUsers = (): User[] => {
  const storedUsers = localStorage.getItem('users');
  return storedUsers ? JSON.parse(storedUsers) : mockUsers;
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const getPosts = (): Post[] => {
  const storedPosts = localStorage.getItem('posts');
  return storedPosts ? JSON.parse(storedPosts) : mockPosts;
};

export const savePosts = (posts: Post[]): void => {
  localStorage.setItem('posts', JSON.stringify(posts));
};

export const initializeStorage = (): void => {
  // Only initialize if not already initialized
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(mockUsers));
  }
  
  if (!localStorage.getItem('posts')) {
    localStorage.setItem('posts', JSON.stringify(mockPosts));
  }
};