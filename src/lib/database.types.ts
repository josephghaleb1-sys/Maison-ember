// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If you evolve the schema, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
//
// NOTE: every row/table shape below is a `type` alias, not an `interface`.
// @supabase/postgrest-js's `insert()`/`update()` use a `RejectExcessProperties`
// mapped type to reject unknown keys, and when a table's `Row` is an
// `interface` (a deferred/lazily-resolved type) instead of a `type` (an
// eagerly-resolved object literal), that mapped type fails to reduce and
// every insert/update silently degrades to accepting `never`. Keep these as
// `type`, same as the real `supabase gen types` CLI output.

export type BusinessRole = "owner" | "admin" | "editor";
export type MediaKind = "product" | "gallery" | "logo" | "hero" | "og" | "other";

/** Drives the site's vocabulary + default sections — see src/lib/industry.ts. */
export type Industry =
  | "restaurant"
  | "cafe"
  | "beauty"
  | "barbershop"
  | "salon"
  | "gym"
  | "retail"
  | "other";

export type Business = {
  id: string;
  slug: string;
  name: string;
  industry: Industry;
  is_active: boolean;
  created_at: string;
};

export type BusinessDomain = {
  id: string;
  business_id: string;
  hostname: string;
  is_primary: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type BusinessMember = {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessRole;
  created_at: string;
};

export type Category = {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_path: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Media = {
  id: string;
  business_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  kind: MediaKind;
  alt_text: string;
  is_visible: boolean;
  uploaded_by: string | null;
  created_at: string;
};

export type WebsiteHours = {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
};

export type WebsiteSocialLinks = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  yelp?: string;
};

export type WebsiteSettings = {
  id: string;
  business_id: string;
  business_name: string;
  tagline: string;
  about_text: string;
  logo_path: string | null;
  hero_image_path: string | null;
  phone: string;
  email: string;
  address: string;
  hours: WebsiteHours;
  social_links: WebsiteSocialLinks;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  primary_color: string;
  secondary_color: string;
  seo_title: string;
  seo_description: string;
  og_image_path: string | null;
  currency: string;
  whatsapp: string;
  show_prices: boolean;
  checkout_enabled: boolean;
  free_delivery_over: number | null;
  min_order_total: number;
  order_notice: string;
  updated_at: string;
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DeliveryZone = {
  id: string;
  business_id: string;
  name: string;
  fee: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  business_id: string;
  order_number: number;
  public_token: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_alt: string;
  customer_email: string;
  delivery_zone_id: string | null;
  delivery_zone_name: string;
  city: string;
  address_line: string;
  address_details: string;
  notes: string;
  payment_method: "cod";
  status: OrderStatus;
  admin_note: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  business_id: string;
  product_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
};

/** Shape returned by the public.get_order_by_token() RPC. */
export type OrderConfirmation = {
  order_number: number;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  delivery_zone_name: string;
  city: string;
  address_line: string;
  address_details: string;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  created_at: string;
  items: { name: string; unit_price: number; quantity: number; line_total: number }[];
};

export type Testimonial = {
  id: string;
  business_id: string;
  author_name: string;
  author_role: string;
  quote: string;
  rating: number;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// Minimal Supabase-generated-style Database type so `createClient<Database>`
// has row/insert/update shapes for the tables we use. Shaped to satisfy
// @supabase/postgrest-js's GenericSchema (Tables/Views/Functions, each
// table carrying Row/Insert/Update/Relationships).
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          industry?: Industry;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          industry?: Industry;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      business_domains: {
        Row: BusinessDomain;
        Insert: {
          id?: string;
          business_id: string;
          hostname: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          hostname?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_domains_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_zones: {
        Row: DeliveryZone;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          fee?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          fee?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: Order;
        // Orders are only ever created through the place_order() RPC, which
        // prices them server-side — there is no INSERT policy for visitors.
        Insert: never;
        Update: {
          status?: OrderStatus;
          admin_note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonials: {
        Row: Testimonial;
        Insert: {
          id?: string;
          business_id: string;
          author_name: string;
          author_role?: string;
          quote: string;
          rating?: number;
          is_visible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          author_name?: string;
          author_role?: string;
          quote?: string;
          rating?: number;
          is_visible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      business_members: {
        Row: BusinessMember;
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: BusinessRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: BusinessRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: Category;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: {
          id?: string;
          business_id: string;
          category_id?: string | null;
          name: string;
          description?: string;
          price?: number;
          image_path?: string | null;
          is_visible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string;
          price?: number;
          image_path?: string | null;
          is_visible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_settings: {
        Row: WebsiteSettings;
        Insert: {
          id?: string;
          business_id: string;
          business_name?: string;
          tagline?: string;
          about_text?: string;
          logo_path?: string | null;
          hero_image_path?: string | null;
          phone?: string;
          email?: string;
          address?: string;
          hours?: WebsiteHours;
          social_links?: WebsiteSocialLinks;
          hero_title?: string;
          hero_subtitle?: string;
          hero_cta_label?: string;
          primary_color?: string;
          secondary_color?: string;
          seo_title?: string;
          seo_description?: string;
          og_image_path?: string | null;
          currency?: string;
          whatsapp?: string;
          show_prices?: boolean;
          checkout_enabled?: boolean;
          free_delivery_over?: number | null;
          min_order_total?: number;
          order_notice?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          business_name?: string;
          tagline?: string;
          about_text?: string;
          logo_path?: string | null;
          hero_image_path?: string | null;
          phone?: string;
          email?: string;
          address?: string;
          hours?: WebsiteHours;
          social_links?: WebsiteSocialLinks;
          hero_title?: string;
          hero_subtitle?: string;
          hero_cta_label?: string;
          primary_color?: string;
          secondary_color?: string;
          seo_title?: string;
          seo_description?: string;
          og_image_path?: string | null;
          currency?: string;
          whatsapp?: string;
          show_prices?: boolean;
          checkout_enabled?: boolean;
          free_delivery_over?: number | null;
          min_order_total?: number;
          order_notice?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: Media;
        Insert: {
          id?: string;
          business_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          kind?: MediaKind;
          alt_text?: string;
          is_visible?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          kind?: MediaKind;
          alt_text?: string;
          is_visible?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      place_order: {
        Args: {
          p_business_slug: string;
          p_customer_name: string;
          p_customer_phone: string;
          p_address_line: string;
          p_items: { product_id: string; quantity: number }[];
          p_delivery_zone_id?: string | null;
          p_city?: string;
          p_address_details?: string;
          p_notes?: string;
          p_customer_phone_alt?: string;
          p_customer_email?: string;
        };
        Returns: {
          order_number: number;
          public_token: string;
          subtotal: number;
          delivery_fee: number;
          total: number;
          currency: string;
        };
      };
      get_order_by_token: {
        Args: { p_token: string };
        Returns: OrderConfirmation | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
