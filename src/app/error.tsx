'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

export default function Error({
                  error,
                  reset,
}: {
                  error: Error & { digest?: string };
                  reset: () => void;
}) {
                  useEffect(() => {
                                    // Log the error to an error reporting service
                                    console.error(error);
                  }, [error]);

                  return (
                                    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                      <Result
                                                                        status="500"
                                                                        title="出错了"
                                                                        subTitle="抱歉，系统遇到了一些问题。"
                                                                        extra={
                                                                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                                                                            <p style={{ color: 'red', maxWidth: '600px', wordBreak: 'break-all' }}>{error.message}</p>
                                                                                                            <Button type="primary" onClick={() => reset()}>
                                                                                                                              重试
                                                                                                            </Button>
                                                                                          </div>
                                                                        }
                                                      />
                                    </div>
                  );
}
