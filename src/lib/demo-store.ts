import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import type { AppNotification, Category, Post, Profile, Topic } from './types';

/**
 * DEMO MODU deposu.
 * Supabase anahtarları girilene kadar uygulamanın boş görünmemesi için
 * veriler sunucuda geçici bir JSON dosyasında tutulur.
 * NOT: Bu veriler kalıcı değildir; gerçek veritabanının yerini tutmaz.
 */

const FILE = process.env.DEMO_DATA_FILE ?? '/tmp/forum-demo-data.json';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

export type DemoReaction = {
  id: string;
  user_id: string;
  target_type: 'topic' | 'post';
  target_id: string;
};

export type DemoDB = {
  profiles: Profile[];
  categories: Category[];
  topics: Topic[];
  posts: Post[];
  reactions: DemoReaction[];
  notifications: AppNotification[];
};

const seed = (): DemoDB => {
  const me: Profile = {
    id: DEMO_USER_ID,
    username: (process.env.DEMO_USER_NAME ?? 'deneme').toLowerCase(),
    display_name: process.env.DEMO_USER_NAME ?? 'Deneme Kullanıcı',
    bio: 'Demo modunda oluşturulmuş örnek kullanıcı.',
    avatar_url: null,
    is_admin: true,
    is_moderator: false,
    created_at: new Date().toISOString()
  };

  const categories: Category[] = [
    {
      id: randomUUID(),
      name: 'Duyurular',
      slug: 'duyurular',
      description: 'Site kuralları ve yönetim duyuruları.',
      color: '#6366f1',
      sort_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      name: 'Genel Sohbet',
      slug: 'genel-sohbet',
      description: 'Her konuda serbest konuşma alanı.',
      color: '#0ea5e9',
      sort_order: 2,
      created_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      name: 'Yardım & Destek',
      slug: 'yardim-destek',
      description: 'Sorularını sor, topluluk cevaplasın.',
      color: '#10b981',
      sort_order: 3,
      created_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      name: 'Tanıtım',
      slug: 'tanimtim',
      description: 'Projelerini ve kendini tanıt.',
      color: '#f59e0b',
      sort_order: 4,
      created_at: new Date().toISOString()
    }
  ];

  const t1: Topic = {
    id: randomUUID(),
    category_id: categories[0].id,
    author_id: me.id,
    title: 'Foruma hoş geldiniz! Kurallar burada',
    content:
      'Bu forum demo modunda çalışıyor. Supabase anahtarlarını .env.local dosyasına girdiğinde gerçek veritabanına geçecek.\n\nKısa kurallar:\n1. Saygılı ol.\n2. Reklam/spam yok.\n3. Doğru kategoriye yaz.',
    views: 12,
    reply_count: 0,
    is_pinned: true,
    is_locked: false,
    is_private: false,
    participants: [],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  };

  const t2: Topic = {
    id: randomUUID(),
    category_id: categories[2].id,
    author_id: me.id,
    title: 'Konu açma butonu çalışmıyor, ne yapmalıyım?',
    content:
      'Bu örnek bir yardım konusudur. Giriş yaptıktan sonra sağ üstteki "Yeni Konu" butonunu kullanarak kendi konunu açabilirsin.',
    views: 3,
    reply_count: 1,
    is_pinned: false,
    is_locked: false,
    is_private: false,
    participants: [],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
  };

  const p1: Post = {
    id: randomUUID(),
    topic_id: t2.id,
    author_id: me.id,
    content: 'Örnek cevap: Sayfayı yenileyip tekrar dener misin? Sorun devam ederse ekran görüntüsü paylaş.',
    is_solution: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
  };

  return { profiles: [me], categories, topics: [t1, t2], posts: [p1], reactions: [], notifications: [] };
};

export async function readDB(): Promise<DemoDB> {
  // Önbellek YOK: her istekte diskten okunur. Böylece farklı modül örnekleri
  // (dev modu hot-reload vb.) arasında veri asla ayrışmaz.
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const db = JSON.parse(raw) as DemoDB;
    // eski dosya şemasıyla uyumluluk
    db.notifications ??= [];
    db.topics.forEach((t) => {
      t.is_private ??= false;
      t.participants ??= [];
      t.reply_count ??= 0;
    });
    return db;
  } catch {
    const fresh = seed();
    await fs.writeFile(FILE, JSON.stringify(fresh, null, 2), 'utf8');
    return fresh;
  }
}

export async function writeDB(db: DemoDB) {
  await fs.writeFile(FILE, JSON.stringify(db, null, 2), 'utf8');
}

export { randomUUID };
