"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Collection, Recipe } from "@/lib/types/database"

interface CollectionsContextType {
  collections: Collection[]
  loading: boolean
  createCollection: (name: string, description: string, color: string, isPublic?: boolean) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  addRecipeToCollection: (
    collectionId: string,
    recipe: Omit<Recipe, "id" | "collection_id" | "created_at" | "updated_at">,
  ) => Promise<void>
  removeRecipeFromCollection: (collectionId: string, recipeId: string) => Promise<void>
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>
  isRecipeInCollection: (collectionId: string, recipeId: string) => boolean
  getCollectionRecipes: (collectionId: string) => Recipe[]
  refreshCollections: () => Promise<void>
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

export function CollectionsProvider({ children, user }: { children: React.ReactNode; user: any }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refreshCollections = async () => {
    if (!user) {
      setCollections([])
      setRecipes([])
      setLoading(false)
      return
    }

    try {
      // Fetch user's collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (collectionsError) throw collectionsError

      // Fetch recipes for all collections
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .in("collection_id", collectionsData?.map((c: { id: any }) => c.id) || [])

      if (recipesError) throw recipesError

      setCollections(collectionsData || [])
      setRecipes(recipesData || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCollections()
  }, [user])

  const createCollection = async (name: string, description: string, color: string, isPublic = false) => {
    if (!user) throw new Error("User must be authenticated")

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name,
        description,
        color,
        is_public: isPublic,
      })
      .select()
      .single()

    if (error) throw error

    setCollections((prev) => [data, ...prev])
  }

  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from("collections").delete().eq("id", id)

    if (error) throw error

    setCollections((prev) => prev.filter((c) => c.id !== id))
    setRecipes((prev) => prev.filter((r) => r.collection_id !== id))
  }

  const addRecipeToCollection = async (
    collectionId: string,
    recipe: Omit<Recipe, "id" | "collection_id" | "created_at" | "updated_at">,
  ) => {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        collection_id: collectionId,
        ...recipe,
      })
      .select()
      .single()

    if (error) throw error

    setRecipes((prev) => [...prev, data])
  }

  const removeRecipeFromCollection = async (collectionId: string, recipeId: string) => {
    const { error } = await supabase.from("recipes").delete().eq("id", recipeId).eq("collection_id", collectionId)

    if (error) throw error

    setRecipes((prev) => prev.filter((r) => r.id !== recipeId))
  }

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    const { data, error } = await supabase.from("collections").update(updates).eq("id", id).select().single()

    if (error) throw error

    setCollections((prev) => prev.map((c) => (c.id === id ? data : c)))
  }

  const isRecipeInCollection = (collectionId: string, recipeId: string) => {
    return recipes.some((r) => r.collection_id === collectionId && r.id === recipeId)
  }

  const getCollectionRecipes = (collectionId: string) => {
    return recipes.filter((r) => r.collection_id === collectionId)
  }

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        loading,
        createCollection,
        deleteCollection,
        addRecipeToCollection,
        removeRecipeFromCollection,
        updateCollection,
        isRecipeInCollection,
        getCollectionRecipes,
        refreshCollections,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  )
}

export function useCollections() {
  const context = useContext(CollectionsContext)
  if (context === undefined) {
    throw new Error("useCollections must be used within a CollectionsProvider")
  }
  return context
}
