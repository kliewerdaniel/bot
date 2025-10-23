'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, Settings, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { SystemPrompt } from '@/lib/prompts-data'

interface SystemPromptManagerProps {
  isOpen: boolean
  onClose: () => void
  selectedPromptId: string
  onPromptSelect: (promptId: string) => void
}

export default function SystemPromptManager({
  isOpen,
  onClose,
  selectedPromptId,
  onPromptSelect
}: SystemPromptManagerProps) {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null)
  const [newPromptName, setNewPromptName] = useState('')
  const [newPromptContent, setNewPromptContent] = useState('')
  const [selectedId, setSelectedId] = useState(selectedPromptId)

  useEffect(() => {
    if (isOpen) {
      fetchPrompts()
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedId(selectedPromptId)
  }, [selectedPromptId])

  const fetchPrompts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/system-prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts || [])
      } else {
        console.error('Failed to fetch prompts')
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createPrompt = async () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return

    try {
      const response = await fetch('/api/system-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPromptName,
          content: newPromptContent
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setPrompts(prev => [...prev, data.prompt])
        setNewPromptName('')
        setNewPromptContent('')
        setIsCreateOpen(false)
      } else {
        console.error('Failed to create prompt')
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
    }
  }

  const updatePrompt = async () => {
    if (!editingPrompt || !newPromptName.trim() || !newPromptContent.trim()) return

    try {
      const response = await fetch(`/api/system-prompts/${editingPrompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPromptName,
          content: newPromptContent
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? data.prompt : p))
        setEditingPrompt(null)
        setNewPromptName('')
        setNewPromptContent('')
        setIsEditOpen(false)
      } else {
        console.error('Failed to update prompt')
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
    }
  }

  const deletePrompt = async (id: string) => {
    if (id === 'default') return // Prevent deleting default

    try {
      const response = await fetch(`/api/system-prompts/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPrompts(prev => prev.filter(p => p.id !== id))
        if (selectedId === id) {
          setSelectedId('default')
          onPromptSelect('default')
        }
      } else {
        console.error('Failed to delete prompt')
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const openEditDialog = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt)
    setNewPromptName(prompt.name)
    setNewPromptContent(prompt.content)
    setIsEditOpen(true)
  }

  const handlePromptSelect = (promptId: string) => {
    setSelectedId(promptId)
    onPromptSelect(promptId)
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Prompt Manager
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New System Prompt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={newPromptName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromptName(e.target.value)}
                        placeholder="Enter prompt name..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Content</label>
                      <Textarea
                        value={newPromptContent}
                        onChange={(e) => setNewPromptContent(e.target.value)}
                        placeholder="Enter prompt content..."
                        className="min-h-[200px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createPrompt}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Current Prompt:</span>
            <Select value={selectedId} onValueChange={handlePromptSelect}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select a system prompt" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-8">Loading prompts...</div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No system prompts found. Create your first prompt.
              </div>
            ) : (
              prompts.map((prompt) => (
                <Card key={prompt.id} className={`p-4 ${selectedId === prompt.id ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{prompt.name}</h3>
                        {selectedId === prompt.id && <Check className="h-4 w-4 text-primary" />}
                        {prompt.id === 'default' && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {truncateContent(prompt.content)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated: {new Date(prompt.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(prompt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePrompt(prompt.id)}
                        disabled={prompt.id === 'default'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit System Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newPromptName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromptName(e.target.value)}
                  placeholder="Enter prompt name..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newPromptContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPromptContent(e.target.value)}
                  placeholder="Enter prompt content..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updatePrompt}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}
