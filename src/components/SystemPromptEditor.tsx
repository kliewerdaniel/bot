'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Settings, Save, X } from 'lucide-react'

interface SystemPromptEditorProps {
  isOpen: boolean
  onClose: () => void
}

export default function SystemPromptEditor({ isOpen, onClose }: SystemPromptEditorProps) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSystemPrompt()
    }
  }, [isOpen])

  useEffect(() => {
    setHasChanges(content !== originalContent)
  }, [content, originalContent])

  const fetchSystemPrompt = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/system-prompt')
      if (response.ok) {
        const data = await response.json()
        setContent(data.content || '')
        setOriginalContent(data.content || '')
      } else {
        console.error('Failed to fetch system prompt')
      }
    } catch (error) {
      console.error('Error fetching system prompt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSystemPrompt = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/system-prompt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      if (response.ok) {
        setOriginalContent(content)
        setHasChanges(false)
      } else {
        console.error('Failed to save system prompt')
      }
    } catch (error) {
      console.error('Error saving system prompt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetChanges = () => {
    setContent(originalContent)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Prompt Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="text-sm text-orange-600 dark:text-orange-400">
                Unsaved changes
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              This system prompt will be used for all conversations. Make sure to save your changes.
            </p>
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetChanges}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              )}
              <Button
                variant={hasChanges ? "default" : "outline"}
                size="sm"
                onClick={saveSystemPrompt}
                disabled={!hasChanges || isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your system prompt here..."
              className="flex-1 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              disabled={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
