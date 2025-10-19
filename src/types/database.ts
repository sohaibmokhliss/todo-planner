export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          emoji: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color: string
          emoji?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          emoji?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'todo' | 'in_progress' | 'done'
          due_date: string | null
          start_date: string | null
          completed_at: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          parent_id: string | null
          title: string
          completed: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          parent_id?: string | null
          title: string
          completed?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          parent_id?: string | null
          title?: string
          completed?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          task_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          task_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      recurrence: {
        Row: {
          id: string
          task_id: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval: number
          days_of_week: number[] | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval?: number
          days_of_week?: number[] | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval?: number
          days_of_week?: number[] | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          task_id: string
          type: 'email' | 'push'
          time: string
          sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          type: 'email' | 'push'
          time: string
          sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          type?: 'email' | 'push'
          time?: string
          sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
