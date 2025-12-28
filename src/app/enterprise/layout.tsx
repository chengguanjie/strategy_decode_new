'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function EnterpriseLayout({
                  children,
}: {
                  children: React.ReactNode;
}) {
                  const router = useRouter();
                  const pathname = usePathname();
                  const [authorized, setAuthorized] = useState(false);

                  useEffect(() => {
                                    // Allow access to login page without auth
                                    if (pathname === '/enterprise/login') {
                                                      setAuthorized(true);
                                                      return;
                                    }

                                    // Check for auth token
                                    const token = localStorage.getItem('token');
                                    const userStr = localStorage.getItem('user');

                                    if (!token || !userStr) {
                                                      // Redirect to login if no token
                                                      router.push('/enterprise/login');
                                    } else {
                                                      // Basic check for enterprise role (optional, can be expanded)
                                                      try {
                                                                        const user = JSON.parse(userStr);
                                                                        // Ensure user has enterprise access (or just existence)
                                                                        if (user) {
                                                                                          setAuthorized(true);
                                                                        } else {
                                                                                          router.push('/enterprise/login');
                                                                        }
                                                      } catch (e) {
                                                                        localStorage.removeItem('token');
                                                                        localStorage.removeItem('user');
                                                                        router.push('/enterprise/login');
                                                      }
                                    }
                  }, [pathname, router]);

                  // Prevent flash of content before redirect
                  if (!authorized) {
                                    return (
                                                      <div style={{
                                                                        height: '100vh',
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        background: '#f0f2f5'
                                                      }}>
                                                                        加载中...
                                                      </div>
                                    );
                  }

                  return <>{children}</>;
}
