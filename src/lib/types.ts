export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_moderator: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  topic_count?: number;
};

export type Topic = {
  id: string;
  category_id: string | null;
  author_id: string;
  title: string;
  content: string;
  views: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_private: boolean;
  participants: string[];
  created_at: string;
  updated_at: string;
  // join ile gelenler
  author?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_admin' | 'is_moderator'> | null;
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'color'> | null;
  last_posters?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_admin' | 'is_moderator'>[];
  last_activity?: string | null;
};

export type Post = {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_admin' | 'is_moderator'> | null;
  post_number?: number;
};

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'reply' | 'like' | 'message';
  topic_id: string | null;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Pick<Profile, 'id' | 'username' | 'display_name'> | null;
  topic?: Pick<Topic, 'id' | 'title'> | null;
};

/** Uygulamanın her yerinde kullanılan "giriş yapmış kullanıcı" özeti */
export type SessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_moderator: boolean;
};
