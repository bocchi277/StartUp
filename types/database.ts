export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      application_notes: {
        Row: {
          application_id: string;
          author_id: string;
          body: string;
          created_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          author_id?: string;
          body: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          application_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          cover_note: string | null;
          created_at: string;
          id: string;
          interview_at: string | null;
          interview_note: string | null;
          job_id: string;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
          worker_id: string;
        };
        ComputedFields: never;
        Insert: {
          cover_note?: string | null;
          created_at?: string;
          id?: string;
          interview_at?: string | null;
          interview_note?: string | null;
          job_id: string;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
          worker_id: string;
        };
        Update: {
          cover_note?: string | null;
          created_at?: string;
          id?: string;
          interview_at?: string | null;
          interview_note?: string | null;
          job_id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: number;
          metadata: NonNullable<Json>;
          target_id: string | null;
          target_type: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          metadata?: NonNullable<Json>;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          metadata?: NonNullable<Json>;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string;
          category: Database["public"]["Enums"]["business_category"];
          city: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          phone: string;
          photo_url: string | null;
          pincode: string | null;
          state: string;
          updated_at: string;
          verification_level: Database["public"]["Enums"]["verification_level"];
          verified_at: string | null;
          verified_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          category: Database["public"]["Enums"]["business_category"];
          city: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          phone: string;
          photo_url?: string | null;
          pincode?: string | null;
          state: string;
          updated_at?: string;
          verification_level?: Database["public"]["Enums"]["verification_level"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          address?: string;
          category?: Database["public"]["Enums"]["business_category"];
          city?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          phone?: string;
          photo_url?: string | null;
          pincode?: string | null;
          state?: string;
          updated_at?: string;
          verification_level?: Database["public"]["Enums"]["verification_level"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cuisines: {
        Row: {
          id: number;
          name_en: string;
          name_hi: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          id?: never;
          name_en: string;
          name_hi: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: never;
          name_en?: string;
          name_hi?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      employment_history: {
        Row: {
          business_id: string | null;
          created_at: string;
          employer_name: string;
          end_date: string | null;
          id: string;
          job_title: string | null;
          placement_id: string | null;
          reason_for_leaving: string | null;
          role_id: number | null;
          source: Database["public"]["Enums"]["history_source"];
          start_date: string;
          updated_at: string;
          worker_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_id?: string | null;
          created_at?: string;
          employer_name: string;
          end_date?: string | null;
          id?: string;
          job_title?: string | null;
          placement_id?: string | null;
          reason_for_leaving?: string | null;
          role_id?: number | null;
          source?: Database["public"]["Enums"]["history_source"];
          start_date: string;
          updated_at?: string;
          worker_id: string;
        };
        Update: {
          business_id?: string | null;
          created_at?: string;
          employer_name?: string;
          end_date?: string | null;
          id?: string;
          job_title?: string | null;
          placement_id?: string | null;
          reason_for_leaving?: string | null;
          role_id?: number | null;
          source?: Database["public"]["Enums"]["history_source"];
          start_date?: string;
          updated_at?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employment_history_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_history_placement_id_fkey";
            columns: ["placement_id"];
            isOneToOne: true;
            referencedRelation: "placements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_history_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "job_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_history_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      job_invites: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          job_id: string;
          message: string | null;
          worker_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          job_id: string;
          message?: string | null;
          worker_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          job_id?: string;
          message?: string | null;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_invites_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_invites_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_invites_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      job_roles: {
        Row: {
          category: string;
          id: number;
          name_en: string;
          name_hi: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          id?: never;
          name_en: string;
          name_hi: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          category?: string;
          id?: never;
          name_en?: string;
          name_hi?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          accommodation: boolean;
          business_id: string;
          city: string;
          created_at: string;
          cuisine_ids: number[];
          deductions: string;
          description: string | null;
          employment_type: Database["public"]["Enums"]["employment_type"];
          expires_at: string;
          id: string;
          joining_date: string | null;
          last_confirmed_at: string;
          meals: Database["public"]["Enums"]["meals_provided"];
          min_experience_months: number;
          openings: number;
          pay_frequency: Database["public"]["Enums"]["pay_frequency"];
          role_id: number;
          salary_max: number;
          salary_min: number;
          shift_end: string;
          shift_start: string;
          skill_ids: number[];
          state: string;
          status: Database["public"]["Enums"]["job_status"];
          tips_info: string | null;
          title: string;
          updated_at: string;
          weekly_offs: number;
        };
        ComputedFields: never;
        Insert: {
          accommodation: boolean;
          business_id: string;
          city: string;
          created_at?: string;
          cuisine_ids?: number[];
          deductions: string;
          description?: string | null;
          employment_type: Database["public"]["Enums"]["employment_type"];
          expires_at?: string;
          id?: string;
          joining_date?: string | null;
          last_confirmed_at?: string;
          meals: Database["public"]["Enums"]["meals_provided"];
          min_experience_months?: number;
          openings?: number;
          pay_frequency: Database["public"]["Enums"]["pay_frequency"];
          role_id: number;
          salary_max: number;
          salary_min: number;
          shift_end: string;
          shift_start: string;
          skill_ids?: number[];
          state: string;
          status?: Database["public"]["Enums"]["job_status"];
          tips_info?: string | null;
          title: string;
          updated_at?: string;
          weekly_offs: number;
        };
        Update: {
          accommodation?: boolean;
          business_id?: string;
          city?: string;
          created_at?: string;
          cuisine_ids?: number[];
          deductions?: string;
          description?: string | null;
          employment_type?: Database["public"]["Enums"]["employment_type"];
          expires_at?: string;
          id?: string;
          joining_date?: string | null;
          last_confirmed_at?: string;
          meals?: Database["public"]["Enums"]["meals_provided"];
          min_experience_months?: number;
          openings?: number;
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"];
          role_id?: number;
          salary_max?: number;
          salary_min?: number;
          shift_end?: string;
          shift_start?: string;
          skill_ids?: number[];
          state?: string;
          status?: Database["public"]["Enums"]["job_status"];
          tips_info?: string | null;
          title?: string;
          updated_at?: string;
          weekly_offs?: number;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "job_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: NonNullable<Json>;
          id: string;
          link: string | null;
          read_at: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      placements: {
        Row: {
          agreed_pay_frequency: Database["public"]["Enums"]["pay_frequency"];
          agreed_salary: number;
          application_id: string;
          business_id: string;
          created_at: string;
          employer_confirmed_at: string | null;
          end_date: string | null;
          exit_reason: string | null;
          id: string;
          job_id: string;
          start_date: string;
          status: Database["public"]["Enums"]["placement_status"];
          updated_at: string;
          worker_confirmed_at: string | null;
          worker_id: string;
        };
        ComputedFields: never;
        Insert: {
          agreed_pay_frequency: Database["public"]["Enums"]["pay_frequency"];
          agreed_salary: number;
          application_id: string;
          business_id: string;
          created_at?: string;
          employer_confirmed_at?: string | null;
          end_date?: string | null;
          exit_reason?: string | null;
          id?: string;
          job_id: string;
          start_date: string;
          status?: Database["public"]["Enums"]["placement_status"];
          updated_at?: string;
          worker_confirmed_at?: string | null;
          worker_id: string;
        };
        Update: {
          agreed_pay_frequency?: Database["public"]["Enums"]["pay_frequency"];
          agreed_salary?: number;
          application_id?: string;
          business_id?: string;
          created_at?: string;
          employer_confirmed_at?: string | null;
          end_date?: string | null;
          exit_reason?: string | null;
          id?: string;
          job_id?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["placement_status"];
          updated_at?: string;
          worker_confirmed_at?: string | null;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "placements_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_admin: boolean;
          onboarding_complete: boolean;
          preferred_language: string;
          role: Database["public"]["Enums"]["app_role"] | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string;
          id: string;
          is_admin?: boolean;
          onboarding_complete?: boolean;
          preferred_language?: string;
          role?: Database["public"]["Enums"]["app_role"] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          is_admin?: boolean;
          onboarding_complete?: boolean;
          preferred_language?: string;
          role?: Database["public"]["Enums"]["app_role"] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          admin_note: string | null;
          created_at: string;
          details: string | null;
          id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_id: string;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target"];
        };
        ComputedFields: never;
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_id?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target"];
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          reporter_id?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_id?: string;
          target_type?: Database["public"]["Enums"]["report_target"];
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          business_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          paid_on_time: boolean | null;
          placement_id: string;
          rating: number;
          response: string | null;
          response_at: string | null;
          reviewer_id: string;
          reviewer_side: Database["public"]["Enums"]["review_side"];
          terms_matched: boolean | null;
          worker_id: string;
          would_return: boolean;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          paid_on_time?: boolean | null;
          placement_id: string;
          rating: number;
          response?: string | null;
          response_at?: string | null;
          reviewer_id: string;
          reviewer_side: Database["public"]["Enums"]["review_side"];
          terms_matched?: boolean | null;
          worker_id: string;
          would_return: boolean;
        };
        Update: {
          business_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          paid_on_time?: boolean | null;
          placement_id?: string;
          rating?: number;
          response?: string | null;
          response_at?: string | null;
          reviewer_id?: string;
          reviewer_side?: Database["public"]["Enums"]["review_side"];
          terms_matched?: boolean | null;
          worker_id?: string;
          would_return?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_placement_id_fkey";
            columns: ["placement_id"];
            isOneToOne: false;
            referencedRelation: "placements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_jobs: {
        Row: {
          created_at: string;
          job_id: string;
          worker_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          job_id: string;
          worker_id: string;
        };
        Update: {
          created_at?: string;
          job_id?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_jobs_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          category: string;
          id: number;
          name_en: string;
          name_hi: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          id?: never;
          name_en: string;
          name_hi: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          category?: string;
          id?: never;
          name_en?: string;
          name_hi?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      worker_contacts: {
        Row: {
          email: string | null;
          phone: string | null;
          updated_at: string;
          user_id: string;
          whatsapp_opt_in: boolean;
        };
        ComputedFields: never;
        Insert: {
          email?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
          whatsapp_opt_in?: boolean;
        };
        Update: {
          email?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
          whatsapp_opt_in?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "worker_contacts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      worker_profiles: {
        Row: {
          about: string | null;
          available_from: string | null;
          city: string;
          created_at: string;
          cuisine_ids: number[];
          employment_types: Database["public"]["Enums"]["employment_type"][];
          expected_salary_max: number | null;
          expected_salary_min: number | null;
          headline: string | null;
          languages_spoken: string[];
          needs_accommodation: boolean;
          open_to_work: boolean;
          pay_frequency: Database["public"]["Enums"]["pay_frequency"];
          photo_url: string | null;
          pincode: string | null;
          preferred_shift: Database["public"]["Enums"]["shift_preference"];
          primary_role_id: number;
          secondary_role_ids: number[];
          skill_ids: number[];
          state: string;
          total_experience_months: number;
          updated_at: string;
          user_id: string;
          willing_to_relocate: boolean;
        };
        ComputedFields: never;
        Insert: {
          about?: string | null;
          available_from?: string | null;
          city: string;
          created_at?: string;
          cuisine_ids?: number[];
          employment_types?: Database["public"]["Enums"]["employment_type"][];
          expected_salary_max?: number | null;
          expected_salary_min?: number | null;
          headline?: string | null;
          languages_spoken?: string[];
          needs_accommodation?: boolean;
          open_to_work?: boolean;
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"];
          photo_url?: string | null;
          pincode?: string | null;
          preferred_shift?: Database["public"]["Enums"]["shift_preference"];
          primary_role_id: number;
          secondary_role_ids?: number[];
          skill_ids?: number[];
          state: string;
          total_experience_months?: number;
          updated_at?: string;
          user_id: string;
          willing_to_relocate?: boolean;
        };
        Update: {
          about?: string | null;
          available_from?: string | null;
          city?: string;
          created_at?: string;
          cuisine_ids?: number[];
          employment_types?: Database["public"]["Enums"]["employment_type"][];
          expected_salary_max?: number | null;
          expected_salary_min?: number | null;
          headline?: string | null;
          languages_spoken?: string[];
          needs_accommodation?: boolean;
          open_to_work?: boolean;
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"];
          photo_url?: string | null;
          pincode?: string | null;
          preferred_shift?: Database["public"]["Enums"]["shift_preference"];
          primary_role_id?: number;
          secondary_role_ids?: number[];
          skill_ids?: number[];
          state?: string;
          total_experience_months?: number;
          updated_at?: string;
          user_id?: string;
          willing_to_relocate?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "worker_profiles_primary_role_id_fkey";
            columns: ["primary_role_id"];
            isOneToOne: false;
            referencedRelation: "job_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worker_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      business_reviews_public: {
        Row: {
          business_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          paid_on_time: boolean | null;
          rating: number;
          response: string | null;
          response_at: string | null;
          role_id: number;
          terms_matched: boolean | null;
          would_return: boolean;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "jobs_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "job_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_set_business_verification: {
        Args: {
          p_business_id: string;
          p_level: Database["public"]["Enums"]["verification_level"];
        };
        Returns: undefined;
      };
      admin_set_job_status: {
        Args: {
          p_job_id: string;
          p_status: Database["public"]["Enums"]["job_status"];
        };
        Returns: undefined;
      };
      admin_update_report: {
        Args: {
          p_note?: string;
          p_report_id: string;
          p_status: Database["public"]["Enums"]["report_status"];
        };
        Returns: undefined;
      };
      can_view_worker: { Args: { p_worker_id: string }; Returns: boolean };
      can_view_worker_contacts: {
        Args: { p_worker_id: string };
        Returns: boolean;
      };
      confirm_joining: { Args: { p_placement_id: string }; Returns: undefined };
      end_placement: {
        Args: { p_end_date: string; p_placement_id: string; p_reason?: string };
        Returns: undefined;
      };
      has_applied_to_job: { Args: { p_job_id: string }; Returns: boolean };
      hire_applicant: {
        Args: {
          p_agreed_salary: number;
          p_application_id: string;
          p_pay_frequency: Database["public"]["Enums"]["pay_frequency"];
          p_start_date: string;
        };
        Returns: string;
      };
      invite_worker: {
        Args: { p_job_id: string; p_message?: string; p_worker_id: string };
        Returns: string;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      job_is_open: { Args: { p_job_id: string }; Returns: boolean };
      my_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      notify: {
        Args: {
          p_data: Json;
          p_link: string;
          p_type: Database["public"]["Enums"]["notification_type"];
          p_user: string;
        };
        Returns: undefined;
      };
      owns_application: {
        Args: { p_application_id: string };
        Returns: boolean;
      };
      owns_business: { Args: { p_business_id: string }; Returns: boolean };
      owns_job: { Args: { p_job_id: string }; Returns: boolean };
      respond_to_review: {
        Args: { p_response: string; p_review_id: string };
        Returns: undefined;
      };
      set_application_status: {
        Args: {
          p_application_id: string;
          p_interview_at?: string;
          p_interview_note?: string;
          p_status: Database["public"]["Enums"]["application_status"];
        };
        Returns: undefined;
      };
      set_my_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] };
        Returns: undefined;
      };
      submit_review: {
        Args: {
          p_comment?: string;
          p_paid_on_time?: boolean;
          p_placement_id: string;
          p_rating: number;
          p_terms_matched?: boolean;
          p_would_return: boolean;
        };
        Returns: string;
      };
      withdraw_application: {
        Args: { p_application_id: string };
        Returns: undefined;
      };
      write_audit: {
        Args: {
          p_action: string;
          p_metadata?: Json;
          p_target_id: string;
          p_target_type: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "worker" | "employer";
      application_status:
        | "applied"
        | "shortlisted"
        | "interview"
        | "offered"
        | "hired"
        | "rejected"
        | "withdrawn";
      business_category:
        | "cafe"
        | "restaurant"
        | "qsr"
        | "bakery"
        | "cloud_kitchen"
        | "hotel"
        | "catering"
        | "bar"
        | "other";
      employment_type:
        "full_time" | "part_time" | "temporary" | "seasonal" | "contract";
      history_source: "self_reported" | "platform_verified";
      job_status: "draft" | "open" | "paused" | "closed" | "filled" | "removed";
      meals_provided: "none" | "one" | "two" | "all";
      notification_type:
        | "new_applicant"
        | "application_status"
        | "application_withdrawn"
        | "hired"
        | "joined"
        | "placement_ended"
        | "invited"
        | "review_received"
        | "business_verified";
      pay_frequency: "monthly" | "weekly" | "daily";
      placement_status: "pending" | "active" | "ended" | "cancelled";
      report_reason:
        | "fake_job"
        | "wrong_terms"
        | "harassment"
        | "unpaid_wages"
        | "false_profile"
        | "spam"
        | "other";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      report_target: "job" | "business" | "worker" | "review";
      review_side: "worker" | "employer";
      shift_preference:
        | "morning"
        | "afternoon"
        | "evening"
        | "night"
        | "split"
        | "rotational"
        | "any";
      verification_level: "unverified" | "email_verified" | "business_verified";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["worker", "employer"],
      application_status: [
        "applied",
        "shortlisted",
        "interview",
        "offered",
        "hired",
        "rejected",
        "withdrawn",
      ],
      business_category: [
        "cafe",
        "restaurant",
        "qsr",
        "bakery",
        "cloud_kitchen",
        "hotel",
        "catering",
        "bar",
        "other",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "temporary",
        "seasonal",
        "contract",
      ],
      history_source: ["self_reported", "platform_verified"],
      job_status: ["draft", "open", "paused", "closed", "filled", "removed"],
      meals_provided: ["none", "one", "two", "all"],
      notification_type: [
        "new_applicant",
        "application_status",
        "application_withdrawn",
        "hired",
        "joined",
        "placement_ended",
        "invited",
        "review_received",
        "business_verified",
      ],
      pay_frequency: ["monthly", "weekly", "daily"],
      placement_status: ["pending", "active", "ended", "cancelled"],
      report_reason: [
        "fake_job",
        "wrong_terms",
        "harassment",
        "unpaid_wages",
        "false_profile",
        "spam",
        "other",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      report_target: ["job", "business", "worker", "review"],
      review_side: ["worker", "employer"],
      shift_preference: [
        "morning",
        "afternoon",
        "evening",
        "night",
        "split",
        "rotational",
        "any",
      ],
      verification_level: ["unverified", "email_verified", "business_verified"],
    },
  },
} as const;
