"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useCollections } from "../contexts/collections-context"
import { AuthButton } from "@/components/auth/auth-button"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Plus, Trash2, Edit, Clock, Users, ChefHat, Globe, Lock } from "lucide-react"
import Link from "next/link"

const colorOptions = [
  { name: "Purple to Pink", value: "from-purple-500 to-pink-500" },
  { name: "Blue to Cyan", value: "from-blue-500 to-cyan-500" },
  { name: "Green to Emerald", value: "from-green-500 to-emerald-500" },
  { name: "Orange to Red", value: "from-orange-500 to-red-500" },
  { name: "Indigo to Purple", value: "from-indigo-500 to-purple-500" },
  { name: "Teal to Blue", value: "from-teal-500 to-blue-500" },
]

export default function CollectionsPage() {
  const [user, setUser] = useState<any>(null)
  const { collections, loading, createCollection, deleteCollection, updateCollection, getCollectionRecipes } =
    useCollections()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: colorOptions[0].value,
    isPublic: false,
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: { user: any }) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingCollection) {
        await updateCollection(editingCollection, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          is_public: formData.isPublic,
        })
        setEditingCollection(null)
      } else {
        await createCollection(formData.name, formData.description, formData.color, formData.isPublic)
        setIsCreateDialogOpen(false)
      }
      setFormData({ name: "", description: "", color: colorOptions[0].value, isPublic: false })
    } catch (error) {
      console.error("Error saving collection:", error)
      alert("Failed to save collection")
    }
  }

  const startEdit = (collection: any) => {
    setFormData({
      name: collection.name,
      description: collection.description || "",
      color: collection.color,
      isPublic: collection.is_public,
    })
    setEditingCollection(collection.id)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this collection? This action cannot be undone.")) {
      try {
        await deleteCollection(id)
      } catch (error) {
        console.error("Error deleting collection:", error)
        alert("Failed to delete collection")
      }
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "Hard":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-full glass w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Sign In Required</h3>
          <p className="text-gray-400 mb-6">Please sign in to view and manage your recipe collections</p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="glass text-white border-white/20 bg-transparent">
                Back to Home
              </Button>
            </Link>
            <AuthButton user={user} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
              ← Back to Recipe Generator
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full glass">
                <BookOpen className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Recipe Collections</h1>
                <p className="text-gray-300">Organize and manage your favorite recipes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AuthButton user={user} />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-gray-800/50 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Create a new collection to organize your recipes
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Collection Name</label>
                    <Input
                      placeholder="e.g., Quick Weeknight Dinners"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-gray-950/50 border-gray-700/50 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                    <Textarea
                      placeholder="Describe your collection..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-gray-950/50 border-gray-700/50 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Color Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`p-3 rounded-lg bg-gradient-to-r ${color.value} relative ${
                            formData.color === color.value ? "ring-2 ring-white" : ""
                          }`}
                        >
                          {formData.color === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 bg-white rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Make collection public</label>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                      <Switch
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                      />
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      Create Collection
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-300">Loading collections...</p>
          </div>
        ) : collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const collectionRecipes = getCollectionRecipes(collection.id)
              return (
                <Card key={collection.id} className="glass glass-hover shadow-2xl">
                  <CardHeader>
                    <div
                      className={`w-full h-24 rounded-lg bg-gradient-to-r ${collection.color} mb-4 flex items-center justify-center relative`}
                    >
                      <BookOpen className="h-8 w-8 text-white" />
                      {collection.is_public && (
                        <div className="absolute top-2 right-2">
                          <Globe className="h-4 w-4 text-white/80" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-white flex items-center justify-between">
                      {collection.name}
                      {collection.is_public && (
                        <Badge variant="outline" className="text-xs text-green-300 border-green-500/30">
                          Public
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-300">{collection.description}</CardDescription>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                        {collectionRecipes.length} recipes
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(collection)}
                          className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(collection.id)}
                          className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {collectionRecipes.length > 0 ? (
                      <div className="space-y-3">
                        {collectionRecipes.slice(0, 3).map((recipe) => (
                          <div key={recipe.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-white text-sm">{recipe.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {recipe.cooking_time}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Users className="h-3 w-3" />
                                    {recipe.servings}
                                  </div>
                                  <Badge className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}>
                                    {recipe.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {collectionRecipes.length > 3 && (
                          <p className="text-xs text-gray-400 text-center">
                            +{collectionRecipes.length - 3} more recipes
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <ChefHat className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No recipes yet</p>
                        <p className="text-xs text-gray-500">Start adding recipes to this collection</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 rounded-full glass w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Collections Yet</h3>
            <p className="text-gray-400 mb-6">Create your first collection to start organizing your favorite recipes</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </div>
        )}

        <Dialog open={editingCollection !== null} onOpenChange={() => setEditingCollection(null)}>
          <DialogContent className="glass border-gray-800/50 text-white">
            <DialogHeader>
              <DialogTitle>Edit Collection</DialogTitle>
              <DialogDescription className="text-gray-300">Update your collection details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Collection Name</label>
                <Input
                  placeholder="e.g., Quick Weeknight Dinners"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-950/50 border-gray-700/50 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe your collection..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-950/50 border-gray-700/50 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`p-3 rounded-lg bg-gradient-to-r ${color.value} relative ${
                        formData.color === color.value ? "ring-2 ring-white" : ""
                      }`}
                    >
                      {formData.color === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Make collection public</label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Update Collection
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
