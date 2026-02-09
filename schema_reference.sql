-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.account_levels (
  id integer NOT NULL DEFAULT nextval('account_levels_id_seq'::regclass),
  level_name character varying NOT NULL,
  min_projects_required integer DEFAULT 0,
  daily_post_limit integer,
  price_cap numeric,
  analytics_visible boolean DEFAULT false,
  CONSTRAINT account_levels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL,
  manual_override_price numeric,
  calculated_median_price numeric,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid,
  freelancer_id uuid,
  service_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT chat_rooms_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT chat_rooms_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.users(id),
  CONSTRAINT chat_rooms_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.daily_post_tracker (
  user_id uuid NOT NULL,
  post_date date NOT NULL DEFAULT CURRENT_DATE,
  post_count integer DEFAULT 0,
  CONSTRAINT daily_post_tracker_pkey PRIMARY KEY (user_id, post_date),
  CONSTRAINT daily_post_tracker_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.debt_ledger (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid,
  order_id uuid,
  amount_owed_to_admin numeric NOT NULL,
  status character varying,
  due_date timestamp without time zone,
  alert_triggered_at timestamp without time zone,
  paid_at timestamp without time zone,
  CONSTRAINT debt_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT debt_ledger_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid,
  sender_id uuid,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.otp_codes (
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (email)
);
CREATE TABLE public.service_images (
  id integer NOT NULL DEFAULT nextval('service_images_id_seq'::regclass),
  service_id uuid,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_images_pkey PRIMARY KEY (id),
  CONSTRAINT service_images_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.service_views (
  service_id uuid,
  viewer_id uuid,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_views_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT service_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid,
  category_id integer,
  title character varying NOT NULL,
  description text,
  price numeric,
  status character varying,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.users(id),
  CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role character varying,
  subscription_tier character varying,
  level_id integer,
  commission_model character varying,
  is_suspended boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  username character varying,
  profile_pic text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.account_levels(id)
);
