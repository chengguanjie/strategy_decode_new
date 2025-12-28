import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Skeleton } from 'antd';
import classNames from 'classnames';

interface LazyImageProps extends Omit<ImageProps, 'onLoadingComplete' | 'onError'> {
                  /**
                   * 容器类名
                   */
                  containerClassName?: string;
                  /**
                   * 是否在加载时显示占位符
                   */
                  showSkeleton?: boolean;
}

/**
 * LazyImage 组件
 * 封装 next/image，提供加载状态和错误处理
 * 
 * 强制懒加载 (loading="lazy" 默认)
 * 支持占位符显示
 */
export const LazyImage: React.FC<LazyImageProps> = ({
                  src,
                  alt,
                  className,
                  containerClassName,
                  showSkeleton = true,
                  ...rest
}) => {
                  const [loading, setLoading] = useState(true);
                  const [error, setError] = useState(false);

                  // 处理图片源: 如果是字符串且以http开头，直接使用；否则认为是本地资源或特殊处理
                  // next/image 要求 src 必须是静态导入对象或绝对路径字符串

                  return (
                                    <div className={classNames('relative overflow-hidden', containerClassName)} style={{ position: 'relative', display: 'inline-block' }}>
                                                      {loading && showSkeleton && (
                                                                        <div
                                                                                          className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
                                                                                          style={{
                                                                                                            position: 'absolute',
                                                                                                            top: 0,
                                                                                                            left: 0,
                                                                                                            right: 0,
                                                                                                            bottom: 0,
                                                                                                            display: 'flex',
                                                                                                            alignItems: 'center',
                                                                                                            justifyContent: 'center',
                                                                                                            background: '#f5f5f5'
                                                                                          }}
                                                                        >
                                                                                          <Skeleton.Image active />
                                                                        </div>
                                                      )}

                                                      <Image
                                                                        src={src}
                                                                        alt={alt}
                                                                        className={classNames(
                                                                                          'transition-opacity duration-300',
                                                                                          loading ? 'opacity-0' : 'opacity-100',
                                                                                          className
                                                                        )}
                                                                        onLoad={(e) => {
                                                                                          setLoading(false);
                                                                                          // 移除 next/image 的 onLoadingComplete 因为在新版中通常使用 onLoad
                                                                        }}
                                                                        onError={() => {
                                                                                          setLoading(false);
                                                                                          setError(true);
                                                                        }}
                                                                        loading="lazy"
                                                                        {...rest}
                                                      />
                                    </div>
                  );
};

export default LazyImage;
