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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accreditation_cycles: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_cycles_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_levels: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          ordinal: number
          required_choices: number | null
          validity_years: number | null
          validity_years_note: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          ordinal: number
          required_choices?: number | null
          validity_years?: number | null
          validity_years_note?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          ordinal?: number
          required_choices?: number | null
          validity_years?: number | null
          validity_years_note?: string | null
        }
        Relationships: []
      }
      accreditor_expertise: {
        Row: {
          expertise_area_id: string
          profile_id: string
        }
        Insert: {
          expertise_area_id: string
          profile_id: string
        }
        Update: {
          expertise_area_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditor_expertise_expertise_area_id_fkey"
            columns: ["expertise_area_id"]
            isOneToOne: false
            referencedRelation: "expertise_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditor_expertise_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditor_reports: {
        Row: {
          accreditor_id: string
          assignment_id: string
          doc_code: string | null
          grand_mean: number | null
          overall_findings: string | null
          qac_note: string | null
          recommendation: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          signed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accreditor_id: string
          assignment_id: string
          doc_code?: string | null
          grand_mean?: number | null
          overall_findings?: string | null
          qac_note?: string | null
          recommendation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accreditor_id?: string
          assignment_id?: string
          doc_code?: string | null
          grand_mean?: number | null
          overall_findings?: string | null
          qac_note?: string | null
          recommendation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditor_reports_accreditor_id_fkey"
            columns: ["accreditor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditor_reports_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditor_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean
          is_published: boolean
          publish_on: string
          title: string
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          publish_on?: string
          title: string
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          publish_on?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      area_ratings: {
        Row: {
          accreditor_id: string
          assignment_id: string
          indicator: number
          rating: number | null
          remark: string | null
          requirement_area_id: string
          updated_at: string
        }
        Insert: {
          accreditor_id: string
          assignment_id: string
          indicator: number
          rating?: number | null
          remark?: string | null
          requirement_area_id: string
          updated_at?: string
        }
        Update: {
          accreditor_id?: string
          assignment_id?: string
          indicator?: number
          rating?: number | null
          remark?: string | null
          requirement_area_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_ratings_accreditor_id_fkey"
            columns: ["accreditor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_ratings_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_ratings_requirement_area_id_fkey"
            columns: ["requirement_area_id"]
            isOneToOne: false
            referencedRelation: "requirement_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_accreditors: {
        Row: {
          acting_reason: string | null
          assignment_id: string
          profile_id: string
          rejection_note: string | null
          responded_at: string | null
          response: Database["public"]["Enums"]["accreditor_response"]
        }
        Insert: {
          acting_reason?: string | null
          assignment_id: string
          profile_id: string
          rejection_note?: string | null
          responded_at?: string | null
          response?: Database["public"]["Enums"]["accreditor_response"]
        }
        Update: {
          acting_reason?: string | null
          assignment_id?: string
          profile_id?: string
          rejection_note?: string | null
          responded_at?: string | null
          response?: Database["public"]["Enums"]["accreditor_response"]
        }
        Relationships: [
          {
            foreignKeyName: "assignment_accreditors_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_accreditors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          cycle_id: string
          due_date: string | null
          id: string
          site_visit_date: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          submission_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          cycle_id: string
          due_date?: string | null
          id?: string
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          submission_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          cycle_id?: string
          due_date?: string | null
          id?: string
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "accreditation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submission_readiness"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          created_at: string
          id: string
          is_main: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_main?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_main?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      common_documents: {
        Row: {
          deleted_at: string | null
          category: string
          college_codes: string[]
          created_at: string
          file_size: number | null
          id: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
          view_count: number
          visible_to: string
        }
        Insert: {
          deleted_at?: string | null
          category?: string
          college_codes?: string[]
          created_at?: string
          file_size?: number | null
          id?: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          view_count?: number
          visible_to?: string
        }
        Update: {
          deleted_at?: string | null
          category?: string
          college_codes?: string[]
          created_at?: string
          file_size?: number | null
          id?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          view_count?: number
          visible_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "common_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviews: {
        Row: {
          created_at: string
          decision: string
          id: string
          note: string | null
          reviewer_id: string | null
          submission_document_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          note?: string | null
          reviewer_id?: string | null
          submission_document_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          note?: string | null
          reviewer_id?: string | null
          submission_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_submission_document_id_fkey"
            columns: ["submission_document_id"]
            isOneToOne: false
            referencedRelation: "submission_document_status"
            referencedColumns: ["submission_document_id"]
          },
          {
            foreignKeyName: "document_reviews_submission_document_id_fkey"
            columns: ["submission_document_id"]
            isOneToOne: false
            referencedRelation: "submission_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          body: string
          created_at: string
          id: string
          last_error: string | null
          next_attempt_at: string
          notification_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          to_email: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          notification_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          to_email: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          notification_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_items: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: Database["public"]["Enums"]["item_decision"]
          evaluation_id: string
          id: string
          kind: Database["public"]["Enums"]["evaluation_item_kind"]
          label: string
          note: string | null
          requirement_area_id: string | null
          score: number | null
          submission_document_id: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["item_decision"]
          evaluation_id: string
          id?: string
          kind: Database["public"]["Enums"]["evaluation_item_kind"]
          label: string
          note?: string | null
          requirement_area_id?: string | null
          score?: number | null
          submission_document_id?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["item_decision"]
          evaluation_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["evaluation_item_kind"]
          label?: string
          note?: string | null
          requirement_area_id?: string | null
          score?: number | null
          submission_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_items_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_items_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_items_requirement_area_id_fkey"
            columns: ["requirement_area_id"]
            isOneToOne: false
            referencedRelation: "requirement_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_items_submission_document_id_fkey"
            columns: ["submission_document_id"]
            isOneToOne: false
            referencedRelation: "submission_document_status"
            referencedColumns: ["submission_document_id"]
          },
          {
            foreignKeyName: "evaluation_items_submission_document_id_fkey"
            columns: ["submission_document_id"]
            isOneToOne: false
            referencedRelation: "submission_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          assignment_id: string
          compliance_status: string | null
          created_at: string
          evaluated_at: string | null
          id: string
          outcome: Database["public"]["Enums"]["evaluation_outcome"] | null
          ready_for_sv_at: string | null
          released_at: string | null
          released_by: string | null
          remarks: string | null
          score: number | null
          sheet: Json
          sheet_updated_at: string | null
          sheet_updated_by: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          compliance_status?: string | null
          created_at?: string
          evaluated_at?: string | null
          id?: string
          outcome?: Database["public"]["Enums"]["evaluation_outcome"] | null
          ready_for_sv_at?: string | null
          released_at?: string | null
          released_by?: string | null
          remarks?: string | null
          score?: number | null
          sheet?: Json
          sheet_updated_at?: string | null
          sheet_updated_by?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          compliance_status?: string | null
          created_at?: string
          evaluated_at?: string | null
          id?: string
          outcome?: Database["public"]["Enums"]["evaluation_outcome"] | null
          ready_for_sv_at?: string | null
          released_at?: string | null
          released_by?: string | null
          remarks?: string | null
          score?: number | null
          sheet?: Json
          sheet_updated_at?: string | null
          sheet_updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_sheet_updated_by_fkey"
            columns: ["sheet_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_audiences: {
        Row: {
          event_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          event_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          event_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "event_audiences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_programs: {
        Row: {
          event_id: string
          program_id: string
        }
        Insert: {
          event_id: string
          program_id: string
        }
        Update: {
          event_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_programs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          cycle_id: string | null
          description: string | null
          end_time: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          start_time: string
          title: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          cycle_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          start_time: string
          title: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          cycle_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "accreditation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_areas: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      extension_requests: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          original_due_date: string | null
          processed_at: string | null
          processed_by: string | null
          proposed_due_date: string
          reason: string
          requested_by: string | null
          status: Database["public"]["Enums"]["extension_status"]
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          original_due_date?: string | null
          processed_at?: string | null
          processed_by?: string | null
          proposed_due_date: string
          reason: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["extension_status"]
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          original_due_date?: string | null
          processed_at?: string | null
          processed_by?: string | null
          proposed_due_date?: string
          reason?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["extension_status"]
        }
        Relationships: [
          {
            foreignKeyName: "extension_requests_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extension_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extension_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nda_issuances: {
        Row: {
          file_id: string
          issued_at: string
          profile_id: string
        }
        Insert: {
          file_id: string
          issued_at?: string
          profile_id: string
        }
        Update: {
          file_id?: string
          issued_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nda_issuances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ndas: {
        Row: {
          file_id: string | null
          notary_attorney: string | null
          notary_book_no: string | null
          notary_doc_no: string | null
          notary_page_no: string | null
          notary_series: number | null
          profile_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          file_id?: string | null
          notary_attorney?: string | null
          notary_book_no?: string | null
          notary_doc_no?: string | null
          notary_page_no?: string | null
          notary_series?: number | null
          profile_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          file_id?: string | null
          notary_attorney?: string | null
          notary_book_no?: string | null
          notary_doc_no?: string | null
          notary_page_no?: string | null
          notary_series?: number | null
          profile_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ndas_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "nda_issuances"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "ndas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndas_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_documents: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean
          name: string
          ordinal: number
          phase_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean
          name: string
          ordinal: number
          phase_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean
          name?: string
          ordinal?: number
          phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          created_at: string
          id: string
          name: string
          ordinal: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          ordinal: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          ordinal?: number
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          id: string
          name: string
          scope: Database["public"]["Enums"]["position_scope"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scope: Database["public"]["Enums"]["position_scope"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["position_scope"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          campus_id: string | null
          college_id: string | null
          deleted_at: string | null
          created_at: string
          given_name: string
          id: string
          is_active: boolean
          is_internal_accreditor: boolean
          local_no: string | null
          middle_initial: string | null
          mobile: string | null
          notif_prefs: Json
          position_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          signature_path: string | null
          surname: string
          updated_at: string
          webmail: string
        }
        Insert: {
          avatar_path?: string | null
          campus_id?: string | null
          college_id?: string | null
          deleted_at?: string | null
          created_at?: string
          given_name: string
          id: string
          is_active?: boolean
          is_internal_accreditor?: boolean
          local_no?: string | null
          middle_initial?: string | null
          mobile?: string | null
          notif_prefs?: Json
          position_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          signature_path?: string | null
          surname: string
          updated_at?: string
          webmail: string
        }
        Update: {
          avatar_path?: string | null
          campus_id?: string | null
          college_id?: string | null
          deleted_at?: string | null
          created_at?: string
          given_name?: string
          id?: string
          is_active?: boolean
          is_internal_accreditor?: boolean
          local_no?: string | null
          middle_initial?: string | null
          mobile?: string | null
          notif_prefs?: Json
          position_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signature_path?: string | null
          surname?: string
          updated_at?: string
          webmail?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_accreditations: {
        Row: {
          cycle_id: string | null
          decided_at: string
          decided_by: string | null
          demoted_from_level_id: string | null
          granted_on: string
          id: string
          level_id: string
          program_id: string
          source_evaluation_id: string | null
          status: Database["public"]["Enums"]["award_status"]
          superseded_by: string | null
          valid_until: string | null
        }
        Insert: {
          cycle_id?: string | null
          decided_at?: string
          decided_by?: string | null
          demoted_from_level_id?: string | null
          granted_on: string
          id?: string
          level_id: string
          program_id: string
          source_evaluation_id?: string | null
          status?: Database["public"]["Enums"]["award_status"]
          superseded_by?: string | null
          valid_until?: string | null
        }
        Update: {
          cycle_id?: string | null
          decided_at?: string
          decided_by?: string | null
          demoted_from_level_id?: string | null
          granted_on?: string
          id?: string
          level_id?: string
          program_id?: string
          source_evaluation_id?: string | null
          status?: Database["public"]["Enums"]["award_status"]
          superseded_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_accreditations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "accreditation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_demoted_from_level_id_fkey"
            columns: ["demoted_from_level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_source_evaluation_id_fkey"
            columns: ["source_evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "program_accreditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "program_awards"
            referencedColumns: ["id"]
          },
        ]
      }
      program_reps: {
        Row: {
          created_at: string
          profile_id: string
          program_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          program_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_reps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_reps_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          campus_id: string
          college_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
        }
        Insert: {
          campus_id: string
          college_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
        }
        Update: {
          campus_id?: string
          college_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          route: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          route: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          route?: string
        }
        Relationships: []
      }
      repository_files: {
        Row: {
          archived_at: string | null
          cert_status: string | null
          created_at: string
          doc_uuid: string
          file_size: number | null
          folder_id: string
          id: string
          is_archived: boolean
          level_id: string | null
          program_id: string
          storage_path: string
          title: string
          unit_id: string | null
          uploaded_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          archived_at?: string | null
          cert_status?: string | null
          created_at?: string
          doc_uuid?: string
          file_size?: number | null
          folder_id: string
          id?: string
          is_archived?: boolean
          level_id?: string | null
          program_id: string
          storage_path: string
          title: string
          unit_id?: string | null
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          archived_at?: string | null
          cert_status?: string | null
          created_at?: string
          doc_uuid?: string
          file_size?: number | null
          folder_id?: string
          id?: string
          is_archived?: boolean
          level_id?: string | null
          program_id?: string
          storage_path?: string
          title?: string
          unit_id?: string | null
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repository_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "repository_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_files_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_files_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_files_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "repository_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_folder_prefs: {
        Row: {
          display_name: string | null
          folder_id: string
          hidden: boolean
          program_id: string
        }
        Insert: {
          display_name?: string | null
          folder_id: string
          hidden?: boolean
          program_id: string
        }
        Update: {
          display_name?: string | null
          folder_id?: string
          hidden?: boolean
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_folder_prefs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "repository_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_folder_prefs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          ordinal: number
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          ordinal: number
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          ordinal?: number
          slug?: string
        }
        Relationships: []
      }
      repository_units: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_units_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_areas: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean
          level_id: string
          name: string
          ordinal: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean
          level_id: string
          name: string
          ordinal: number
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean
          level_id?: string
          name?: string
          ordinal?: number
        }
        Relationships: [
          {
            foreignKeyName: "requirement_areas_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json
          id: string
          scope: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          scope: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          scope?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_choices: {
        Row: {
          requirement_area_id: string
          submission_id: string
        }
        Insert: {
          requirement_area_id: string
          submission_id: string
        }
        Update: {
          requirement_area_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_choices_requirement_area_id_fkey"
            columns: ["requirement_area_id"]
            isOneToOne: false
            referencedRelation: "requirement_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_choices_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission_readiness"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "submission_choices_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_documents: {
        Row: {
          doc_uuid: string
          file_size: number
          id: string
          is_current: boolean
          is_draft: boolean
          page_count: number | null
          phase_document_id: string | null
          requirement_area_id: string | null
          storage_path: string
          submission_id: string
          supersedes_id: string | null
          title: string
          upload_note: string | null
          uploaded_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          doc_uuid?: string
          file_size: number
          id?: string
          is_current?: boolean
          is_draft?: boolean
          page_count?: number | null
          phase_document_id?: string | null
          requirement_area_id?: string | null
          storage_path: string
          submission_id: string
          supersedes_id?: string | null
          title: string
          upload_note?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          doc_uuid?: string
          file_size?: number
          id?: string
          is_current?: boolean
          is_draft?: boolean
          page_count?: number | null
          phase_document_id?: string | null
          requirement_area_id?: string | null
          storage_path?: string
          submission_id?: string
          supersedes_id?: string | null
          title?: string
          upload_note?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "submission_documents_phase_document_id_fkey"
            columns: ["phase_document_id"]
            isOneToOne: false
            referencedRelation: "phase_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_documents_requirement_area_id_fkey"
            columns: ["requirement_area_id"]
            isOneToOne: false
            referencedRelation: "requirement_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission_readiness"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "submission_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_documents_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "submission_document_status"
            referencedColumns: ["submission_document_id"]
          },
          {
            foreignKeyName: "submission_documents_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "submission_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_returns: {
        Row: {
          assignment_id: string | null
          created_at: string
          id: string
          note: string
          returned_by: string | null
          submission_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          note: string
          returned_by?: string | null
          submission_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          note?: string
          returned_by?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_returns_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_returns_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_returns_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission_readiness"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "submission_returns_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          attempt: number
          created_at: string
          cycle_id: string
          due_date: string | null
          id: string
          is_revalidation: boolean
          level_id: string
          program_id: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          attempt?: number
          created_at?: string
          cycle_id: string
          due_date?: string | null
          id?: string
          is_revalidation?: boolean
          level_id: string
          program_id: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          attempt?: number
          created_at?: string
          cycle_id?: string
          due_date?: string | null
          id?: string
          is_revalidation?: boolean
          level_id?: string
          program_id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "accreditation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_backups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          log: string | null
          note: string | null
          size_bytes: number | null
          status: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          log?: string | null
          note?: string | null
          size_bytes?: number | null
          status: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          log?: string | null
          note?: string | null
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          created_at: string
          file_name: string
          id: string
          storage_path: string
          template_id: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          storage_path: string
          template_id: string
          uploaded_by?: string | null
          version: number
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          storage_path?: string
          template_id?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          change_note: string | null
          created_at: string
          group_key: string | null
          id: string
          is_published: boolean
          level_id: string | null
          phase_document_id: string | null
          requirement_area_id: string | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          change_note?: string | null
          created_at?: string
          group_key?: string | null
          id?: string
          is_published?: boolean
          level_id?: string | null
          phase_document_id?: string | null
          requirement_area_id?: string | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          change_note?: string | null
          created_at?: string
          group_key?: string | null
          id?: string
          is_published?: boolean
          level_id?: string | null
          phase_document_id?: string | null
          requirement_area_id?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_phase_document_id_fkey"
            columns: ["phase_document_id"]
            isOneToOne: false
            referencedRelation: "phase_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_requirement_area_id_fkey"
            columns: ["requirement_area_id"]
            isOneToOne: false
            referencedRelation: "requirement_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          given_name: string
          id: string
          invited_at: string
          invited_by: string | null
          is_internal_accreditor: boolean
          role: Database["public"]["Enums"]["user_role"]
          sent_count: number
          surname: string
          webmail: string
        }
        Insert: {
          given_name: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          is_internal_accreditor?: boolean
          role: Database["public"]["Enums"]["user_role"]
          sent_count?: number
          surname: string
          webmail: string
        }
        Update: {
          given_name?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          is_internal_accreditor?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          sent_count?: number
          surname?: string
          webmail?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_evaluations: {
        Row: {
          accreditor_id: string | null
          answers: Json
          assignment_id: string
          created_at: string
          evaluator_id: string
          id: string
          kind: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          accreditor_id?: string | null
          answers?: Json
          assignment_id: string
          created_at?: string
          evaluator_id?: string
          id?: string
          kind: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          accreditor_id?: string | null
          answers?: Json
          assignment_id?: string
          created_at?: string
          evaluator_id?: string
          id?: string
          kind?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_evaluations_accreditor_id_fkey"
            columns: ["accreditor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_evaluations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_program_level: {
        Row: {
          granted_on: string | null
          level_code: string | null
          level_id: string | null
          level_name: string | null
          ordinal: number | null
          program_id: string | null
          valid_until: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_accreditations_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_awards: {
        Row: {
          cycle_id: string | null
          decided_at: string | null
          decided_by: string | null
          demoted_from_level_id: string | null
          effective_status: string | null
          granted_on: string | null
          id: string | null
          level_id: string | null
          program_id: string | null
          source_evaluation_id: string | null
          status: Database["public"]["Enums"]["award_status"] | null
          superseded_by: string | null
          valid_until: string | null
        }
        Insert: {
          cycle_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          demoted_from_level_id?: string | null
          effective_status?: never
          granted_on?: string | null
          id?: string | null
          level_id?: string | null
          program_id?: string | null
          source_evaluation_id?: string | null
          status?: Database["public"]["Enums"]["award_status"] | null
          superseded_by?: string | null
          valid_until?: string | null
        }
        Update: {
          cycle_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          demoted_from_level_id?: string | null
          effective_status?: never
          granted_on?: string | null
          id?: string | null
          level_id?: string | null
          program_id?: string | null
          source_evaluation_id?: string | null
          status?: Database["public"]["Enums"]["award_status"] | null
          superseded_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_accreditations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "accreditation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_demoted_from_level_id_fkey"
            columns: ["demoted_from_level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_source_evaluation_id_fkey"
            columns: ["source_evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "program_accreditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_accreditations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "program_awards"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_document_status: {
        Row: {
          decision: Database["public"]["Enums"]["item_decision"] | null
          submission_document_id: string | null
          submission_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission_readiness"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "submission_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_readiness: {
        Row: {
          level_id: string | null
          program_id: string | null
          readiness_percent: number | null
          required_count: number | null
          submission_id: string | null
          uploaded_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "accreditation_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_detail: { Args: { p_assignment: string }; Returns: Json }
      accepted_on_submission: {
        Args: { p_submission: string }
        Returns: boolean
      }
      acts_as_accreditor: { Args: { target?: string }; Returns: boolean }
      admin_end_sessions: {
        Args: { p_session?: string; p_user?: string }
        Returns: number
      }
      admin_last_activity: {
        Args: never
        Returns: {
          last_at: string
          profile_id: string
        }[]
      }
      admin_queue_email: {
        Args: { p_body: string; p_subject: string; p_to: string }
        Returns: undefined
      }
      admin_sessions: {
        Args: never
        Returns: {
          id: string
          ip: string
          last_seen: string
          user_agent: string
          user_id: string
        }[]
      }
      admin_storage_usage: { Args: never; Returns: number }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      check_rate_limit: {
        Args: { p_max_count: number; p_route: string; p_window_seconds: number }
        Returns: boolean
      }
      count_common_document_view: { Args: { p_id: string }; Returns: undefined }
      create_event: {
        Args: {
          p_description?: string
          p_end_time?: string
          p_kind?: Database["public"]["Enums"]["event_kind"]
          p_roles?: Database["public"]["Enums"]["user_role"][]
          p_start_time: string
          p_title: string
        }
        Returns: string
      }
      event_visible_to_caller: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      has_nda: { Args: never; Returns: boolean }
      is_active_user: { Args: never; Returns: boolean }
      is_qac: { Args: never; Returns: boolean }
      log_self_event: {
        Args: { p_detail?: string; p_kind: string }
        Returns: undefined
      }
      my_assigned_submission_ids: { Args: never; Returns: string[] }
      my_assignment_ids: { Args: never; Returns: string[] }
      my_program_ids: { Args: never; Returns: string[] }
      notify_expiring_awards: { Args: { p_days?: number }; Returns: number }
      notify_user: {
        Args: {
          p_actor?: string
          p_body?: string
          p_email?: boolean
          p_kind: Database["public"]["Enums"]["notification_kind"]
          p_link?: string
          p_recipient: string
          p_title: string
        }
        Returns: string
      }
      patch_evaluation_sheet: {
        Args: { p_assignment: string; p_patch: Json }
        Returns: Json
      }
      readiness_band: { Args: { percent: number }; Returns: string }
      return_submission: {
        Args: { p_assignment: string; p_note: string }
        Returns: undefined
      }
      send_reminder: {
        Args: { p_link?: string; p_profile: string; p_title: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sign_accreditor_report: {
        Args: {
          p_assignment: string
          p_findings: string
          p_grand_mean: number
          p_recommendation: string
        }
        Returns: string
      }
    }
    Enums: {
      accreditor_response: "pending" | "accepted" | "rejected"
      assignment_status:
        | "assigned"
        | "in_progress"
        | "for_psv"
        | "evaluated"
        | "score_returned"
        | "declined"
      award_status: "active" | "expired" | "superseded" | "revoked"
      cycle_status: "draft" | "open" | "closed"
      email_status: "pending" | "sent" | "failed"
      evaluation_item_kind:
        | "narrative"
        | "compliance_area"
        | "best_practice"
        | "website"
      evaluation_outcome: "passed" | "failed"
      event_kind: "meeting" | "survey_visit" | "deadline" | "holiday" | "other"
      extension_status: "pending" | "approved" | "declined"
      item_decision: "pending" | "approved" | "disapproved"
      notification_kind:
        | "assignment_issued"
        | "assignment_response"
        | "submission_received"
        | "document_disapproved"
        | "score_released"
        | "event_scheduled"
        | "award_expiring"
        | "account"
        | "document_uploaded"
      position_scope: "program" | "qac"
      submission_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "under_evaluation"
        | "evaluated"
        | "returned"
      user_role:
        | "program_representative"
        | "internal_accreditor"
        | "qac_personnel"
        | "qac_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      accreditor_response: ["pending", "accepted", "rejected"],
      assignment_status: [
        "assigned",
        "in_progress",
        "for_psv",
        "evaluated",
        "score_returned",
        "declined",
      ],
      award_status: ["active", "expired", "superseded", "revoked"],
      cycle_status: ["draft", "open", "closed"],
      email_status: ["pending", "sent", "failed"],
      evaluation_item_kind: [
        "narrative",
        "compliance_area",
        "best_practice",
        "website",
      ],
      evaluation_outcome: ["passed", "failed"],
      event_kind: ["meeting", "survey_visit", "deadline", "holiday", "other"],
      extension_status: ["pending", "approved", "declined"],
      item_decision: ["pending", "approved", "disapproved"],
      notification_kind: [
        "assignment_issued",
        "assignment_response",
        "submission_received",
        "document_disapproved",
        "score_released",
        "event_scheduled",
        "award_expiring",
        "account",
        "document_uploaded",
      ],
      position_scope: ["program", "qac"],
      submission_status: [
        "not_started",
        "in_progress",
        "submitted",
        "under_evaluation",
        "evaluated",
        "returned",
      ],
      user_role: [
        "program_representative",
        "internal_accreditor",
        "qac_personnel",
        "qac_admin",
      ],
    },
  },
} as const

export type UserRole = Database["public"]["Enums"]["user_role"]
export type CycleStatus = Database["public"]["Enums"]["cycle_status"]
