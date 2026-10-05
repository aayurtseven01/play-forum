export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
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
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  // join ile gelenler
  author?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | null;
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'color'> | null;
  reply_count?: number;
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
  author?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | null;
};

export type Reaction = {
  id: string;
  user_id: string;
  target_type: 'topic' | 'post';
  target_id: string;
  created_at: string;
};

/** Uygulamanın her yerinde kullanılan "giriş yapmış kullanıcı" özeti */
export type SessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};
