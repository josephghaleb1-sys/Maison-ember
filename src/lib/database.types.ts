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
export type MediaKind = "product" | "gallery" | "logo" | "hero" | "other";

export type Business = {
  id: string;
  slug: string;
  name: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          created_at?: string;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
