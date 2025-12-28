import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
                  try {
                                    const { baseUrl, apiKey } = await request.json();

                                    if (!baseUrl || !apiKey) {
                                                      return NextResponse.json(
                                                                        { success: false, error: { message: '缺少必要参数' } },
                                                                        { status: 400 }
                                                      );
                                    }

                                    // 移除末尾的斜杠
                                    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

                                    const response = await fetch(`${cleanBaseUrl}/models`, {
                                                      method: 'GET',
                                                      headers: {
                                                                        'Authorization': `Bearer ${apiKey}`,
                                                                        'Content-Type': 'application/json',
                                                      },
                                    });

                                    if (response.ok) {
                                                      const data = await response.json();
                                                      return NextResponse.json({
                                                                        success: true,
                                                                        data: {
                                                                                          modelCount: data.data?.length || 0,
                                                                                          models: data.data || [],
                                                                        },
                                                      });
                                    } else {
                                                      const errorText = await response.text();
                                                      let errorMessage = response.statusText;
                                                      try {
                                                                        const errorJson = JSON.parse(errorText);
                                                                        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
                                                      } catch {
                                                                        errorMessage = errorText || errorMessage;
                                                      }

                                                      return NextResponse.json(
                                                                        { success: false, error: { message: errorMessage } },
                                                                        { status: response.status }
                                                      );
                                    }
                  } catch (error) {
                                    console.error('AI connection test error:', error);
                                    const errorMessage = error instanceof Error ? error.message : '未知错误';
                                    return NextResponse.json(
                                                      { success: false, error: { message: errorMessage } },
                                                      { status: 500 }
                                    );
                  }
}
