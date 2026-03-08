-- users
create table if not exists users (
  id integer primary key autoincrement,
  email text unique not null,
  password text not null,
  name text not null,
  role text not null check (role in ('practitioner', 'manager'))
);

-- visits
create table if not exists visits (
  id integer primary key autoincrement,
  user_id integer not null,
  date text not null,          -- 'YYYY-MM-DD'
  type text not null,
  initials text,
  start_time text not null,    -- 'HH:MM'
  end_time text not null,      -- 'HH:MM'
  high_risk integer not null default 0,
  safe integer not null default 0,
  checked_in_at text,
  overrun_email_sent integer not null default 0,
  foreign key (user_id) references users(id)
);


-- seed users
insert or ignore into users (email, password, name, role) values
('stephanie.smith3@merseycare.nhs.uk', 'password', 'Steph Smith', 'manager'),
('scott.bridge@merseycare.nhs.uk', 'password', 'Scott Bridge', 'practitioner'),
('admin@merseycare.nhs.uk', 'adminpassword', 'Admin User', 'manager');