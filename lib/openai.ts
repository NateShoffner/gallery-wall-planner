import OpenAI from 'openai'

export function getOpenAIClient(apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is not set')
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Allow API calls from browser
  })
}

export async function removeBackgroundViaOpenAI(
  imageBase64: string,
  apiKey: string,
): Promise<string> {
  const client = getOpenAIClient(apiKey)

  // Use GPT-4 Vision with detailed prompt for background removal
  const response = await client.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Remove the background from this image and return a PNG with transparency. Return ONLY the base64 encoded PNG data, nothing else.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
  })

  const resultBase64 = response.choices[0]?.message?.content
  if (!resultBase64) {
    throw new Error('No response from OpenAI')
  }

  return resultBase64
}

export async function analyzeImageViaOpenAI(
  imageBase64: string,
  apiKey: string,
): Promise<string> {
  const client = getOpenAIClient(apiKey)

  const response = await client.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this image and provide a brief description suitable for a gallery wall planner.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 512,
  })

  return response.choices[0]?.message?.content || 'Unable to analyze image'
}
