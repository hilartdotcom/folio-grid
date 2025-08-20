export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          company_last_updated: string | null
          created_at: string
          dba: string | null
          deleted_at: string | null
          id: string
          license_number: string | null
          linkedin_url: string | null
          name: string
          open_for_business: boolean | null
          tags: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          company_last_updated?: string | null
          created_at?: string
          dba?: string | null
          deleted_at?: string | null
          id?: string
          license_number?: string | null
          linkedin_url?: string | null
          name: string
          open_for_business?: boolean | null
          tags?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          company_last_updated?: string | null
          created_at?: string
          dba?: string | null
          deleted_at?: string | null
          id?: string
          license_number?: string | null
          linkedin_url?: string | null
          name?: string
          open_for_business?: boolean | null
          tags?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_license_number_fkey"
            columns: ["license_number"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["license_number"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_last_updated: string | null
          contact_unique_id: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string
          full_name: string | null
          id: string
          job_category: string | null
          last_name: string
          license_number: string | null
          linkedin_url: string | null
          phone_number: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          contact_last_updated?: string | null
          contact_unique_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          full_name?: string | null
          id?: string
          job_category?: string | null
          last_name: string
          license_number?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          contact_last_updated?: string | null
          contact_unique_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          job_category?: string | null
          last_name?: string
          license_number?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_license_number_fkey"
            columns: ["license_number"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["license_number"]
          },
        ]
      }
      export_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          file_url: string | null
          filters_json: string
          id: string
          status: Database["public"]["Enums"]["job_status"]
          table_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          filters_json: string
          id?: string
          status?: Database["public"]["Enums"]["job_status"]
          table_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          filters_json?: string
          id?: string
          status?: Database["public"]["Enums"]["job_status"]
          table_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_name: string | null
          id: string
          import_type: string
          rows_failed: number
          rows_imported: number
          rows_processed: number
          rows_updated: number
          source_url: string | null
          status: string
          table_name: string
          user_id: string
          warnings: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string | null
          id?: string
          import_type: string
          rows_failed?: number
          rows_imported?: number
          rows_processed?: number
          rows_updated?: number
          source_url?: string | null
          status?: string
          table_name: string
          user_id: string
          warnings?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string | null
          id?: string
          import_type?: string
          rows_failed?: number
          rows_imported?: number
          rows_processed?: number
          rows_updated?: number
          source_url?: string | null
          status?: string
          table_name?: string
          user_id?: string
          warnings?: Json | null
        }
        Relationships: []
      }
      licenses: {
        Row: {
          country: string | null
          created_at: string
          deleted_at: string | null
          expiration_date: string | null
          full_address: string | null
          id: string
          issue_date: string | null
          issued_by: string | null
          issued_by_website: string | null
          last_updated: string | null
          license_category: string | null
          license_market: string | null
          license_number: string | null
          license_type: string | null
          state: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          expiration_date?: string | null
          full_address?: string | null
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          issued_by_website?: string | null
          last_updated?: string | null
          license_category?: string | null
          license_market?: string | null
          license_number?: string | null
          license_type?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          expiration_date?: string | null
          full_address?: string | null
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          issued_by_website?: string | null
          last_updated?: string | null
          license_category?: string | null
          license_market?: string | null
          license_number?: string | null
          license_type?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          config_json: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          table_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_json: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          table_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_json?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          table_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer"
      job_status: "queued" | "processing" | "done" | "error"
      license_status: "active" | "trial" | "expired" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "analyst", "viewer"],
      job_status: ["queued", "processing", "done", "error"],
      license_status: ["active", "trial", "expired", "suspended"],
    },
  },
} as const
