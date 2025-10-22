import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

// API route for chat functionality with Ollama integration
export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    // Read the system prompt from prompt01.md
    const promptPath = path.join(process.cwd(), '.', 'system_prompt.md')
    let systemPrompt: string

    try {
      systemPrompt = fs.readFileSync(promptPath, 'utf8')
    } catch (error) {
      console.error('Error reading prompt01.md:', error)
      return new Response('System prompt not found', { status: 500 })
    }

    // Prepare the request body for Ollama
    const ollamaRequestBody = {
      model: model || 'mistral-small3.2:latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: true
    }

    // Make request to Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequestBody),
    })

    if (!ollamaResponse.ok) {
      console.error('Ollama API error:', ollamaResponse.statusText)
      return new Response('Failed to get response from Ollama', { status: 500 })
    }

    // Stream the response back to the client
    const stream = new ReadableStream({
      start(controller) {
        const reader = ollamaResponse.body?.getReader()

        if (!reader) {
          controller.close()
          return
        }

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              controller.close()
              return
            }

            controller.enqueue(value)
            return pump()
          })
        }

        return pump()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
