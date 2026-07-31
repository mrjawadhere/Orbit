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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
          summary: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id: string
          summary: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_history: {
        Row: {
          created_at: string
          id: string
          kind: string
          organization_id: string
          prompt: string
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          organization_id: string
          prompt: string
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          organization_id?: string
          prompt?: string
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_snapshots: {
        Row: {
          active_projects: number
          captured_on: string
          completion_rate: number
          created_at: string
          id: string
          organization_id: string
          tasks_completed: number
          tasks_created: number
        }
        Insert: {
          active_projects?: number
          captured_on?: string
          completion_rate?: number
          created_at?: string
          id?: string
          organization_id: string
          tasks_completed?: number
          tasks_created?: number
        }
        Update: {
          active_projects?: number
          captured_on?: string
          completion_rate?: number
          created_at?: string
          id?: string
          organization_id?: string
          tasks_completed?: number
          tasks_created?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          issued_on: string
          number: string
          organization_id: string
          status: Database["public"]["Enums"]["invoice_status"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          issued_on?: string
          number: string
          organization_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          issued_on?: string
          number?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          id: string
          is_read: boolean
          organization_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          organization_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          organization_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_archived: boolean
          name: string
          organization_id: string
          owner_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          progress: number
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          organization_id: string
          owner_id: string
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          organization_id?: string
          owner_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          renews_at: string | null
          seats: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          renews_at?: string | null
          seats?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          renews_at?: string | null
          seats?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          organization_id: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          completed_hours: number | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          labels: string[]
          organization_id: string
          position: number
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string
          reporter_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          completed_hours?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[]
          organization_id: string
          position?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id: string
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          completed_hours?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[]
          organization_id?: string
          position?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: {
          _name: string
          _plan?: Database["public"]["Enums"]["plan_tier"]
          _seed_demo?: boolean
        }
        Returns: string
      }
      has_org_permission: {
        Args: {
          _org_id: string
          _permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      org_role: {
        Args: { _org_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_permission:
        | "create_project"
        | "edit_project"
        | "delete_project"
        | "create_task"
        | "assign_task"
        | "manage_members"
        | "view_dashboard"
        | "manage_billing"
        | "view_activity"
        | "invite_members"
      app_role: "owner" | "admin" | "manager" | "member" | "viewer"
      invoice_status: "paid" | "open" | "void"
      plan_tier: "free" | "pro" | "business" | "enterprise"
      priority_level: "low" | "medium" | "high" | "urgent"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "archived"
      task_status: "backlog" | "todo" | "in_progress" | "in_review" | "done"
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
      app_permission: [
        "create_project",
        "edit_project",
        "delete_project",
        "create_task",
        "assign_task",
        "manage_members",
        "view_dashboard",
        "manage_billing",
        "view_activity",
        "invite_members",
      ],
      app_role: ["owner", "admin", "manager", "member", "viewer"],
      invoice_status: ["paid", "open", "void"],
      plan_tier: ["free", "pro", "business", "enterprise"],
      priority_level: ["low", "medium", "high", "urgent"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "archived",
      ],
      task_status: ["backlog", "todo", "in_progress", "in_review", "done"],
    },
  },
} as const
