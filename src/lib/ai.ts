export type GenerationType = 'caption' | 'image' | 'campaign' | 'idea'

export interface GenerationResult {
  id: string
  type: GenerationType
  title: string
  body: string
  status: 'ready' | 'configuration_required' | 'error'
}

export class AIService {
  static async generateCaption(_prompt: string, _tone = 'Professional'): Promise<GenerationResult> {
    return {
      id: 'caption-not-configured',
      type: 'caption',
      title: 'AI service configuration required',
      body: 'KAIVO AI is disabled until a secure server-side model integration is configured.',
      status: 'configuration_required',
    }
  }

  static async generateImage(_prompt: string): Promise<GenerationResult> {
    return {
      id: 'image-not-configured',
      type: 'image',
      title: 'Image service configuration required',
      body: 'KAIVO image generation is disabled until a secure server-side provider is configured.',
      status: 'configuration_required',
    }
  }
}
