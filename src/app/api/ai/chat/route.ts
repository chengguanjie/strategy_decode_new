import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// POST: AI chat endpoint
export const POST = withAuth(async ({ request }: AuthContext) => {
  try {
    const body = await request.json();
    const { messages, context, config } = body;

    const apiBaseUrl = config?.apiBaseUrl || process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = config?.apiKey || process.env.AI_API_KEY;
    const model = config?.model || process.env.AI_MODEL || 'gpt-4';

    if (!apiKey) {
      return successResponse({
        content: '请先在系统设置中配置 AI API 密钥。',
        tableUpdates: [],
      });
    }

    const systemPrompt = `你是一个战略规划助手，正在帮助用户完善「${context.pageTitle}」页面的内容。

当前页面内容:
${context.pageContent}

你的任务:
1. 回答用户关于战略规划的问题
2. 帮助用户完善表格内容
3. 如果用户需要更新表格，请在回复中明确列出需要更新的内容

请用中文回复。`;

    const apiMessages = messages.filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant');

    console.log('AI API Request:', {
      url: `${apiBaseUrl}/chat/completions`,
      model,
      messagesCount: apiMessages.length,
    });

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const responseText = await response.text();
    console.log('AI API Response status:', response.status);

    if (!response.ok) {
      console.error('AI API error response:', responseText);
      let errorMessage = '抱歉，AI 服务暂时不可用，请稍后重试。';
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error?.message) {
          errorMessage = `AI 服务错误: ${errorData.error.message}`;
        }
      } catch {
        // Use default error message
      }
      return successResponse({
        content: errorMessage,
        tableUpdates: [],
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return successResponse({
        content: '抱歉，AI 响应格式错误。',
        tableUpdates: [],
      });
    }

    const content = data.choices?.[0]?.message?.content || '抱歉，无法生成回复。';

    return successResponse({
      content,
      tableUpdates: [],
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return errorResponse(
      'AI_001',
      `AI服务错误: ${error instanceof Error ? error.message : '未知错误'}`,
      500,
      error
    );
  }
});
