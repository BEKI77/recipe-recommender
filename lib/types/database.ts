export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          collection_id: string
          name: string
          description: string | null
          ingredients: string[]
          instructions: string[]
          cooking_time: string
          servings: number
          difficulty: "Easy" | "Medium" | "Hard"
          source_ingredients: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          name: string
          description?: string | null
          ingredients: string[]
          instructions: string[]
          cooking_time: string
          servings: number
          difficulty: "Easy" | "Medium" | "Hard"
          source_ingredients?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          name?: string
          description?: string | null
          ingredients?: string[]
          instructions?: string[]
          cooking_time?: string
          servings?: number
          difficulty?: "Easy" | "Medium" | "Hard"
          source_ingredients?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      shared_recipes: {
        Row: {
          id: string
          recipe_id: string
          shared_by: string
          title: string
          description: string | null
          is_active: boolean
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          shared_by: string
          title: string
          description?: string | null
          is_active?: boolean
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          shared_by?: string
          title?: string
          description?: string | null
          is_active?: boolean
          view_count?: number
          created_at?: string
        }
      }
    }
  }
}

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"]
export type Collection = Database["public"]["Tables"]["collections"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type SharedRecipe = Database["public"]["Tables"]["shared_recipes"]["Row"]
