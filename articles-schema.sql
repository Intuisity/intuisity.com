create table if not exists articles (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  body text not null,
  author_name text not null default 'Kathy Kennedy',
  category text not null default 'Intuition Training',
  call_to_action_label text not null default 'Try Intuisity',
  call_to_action_url text not null default '/',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_idx
  on articles (status, published_at desc);
