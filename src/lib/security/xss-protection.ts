import { securityConfig } from '@/config/security';

/**
 * XSS 防护工具集
 * 提供输入清理、输出编码等功能
 */

/**
 * HTML 实体编码映射
 */
const htmlEntityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * HTML 编码
 * 将特殊字符转换为 HTML 实体
 */
export function escapeHtml(text: string): string {
  return String(text).replace(/[&<>"'\/]/g, (char) => htmlEntityMap[char] || char);
}

/**
 * JavaScript 字符串编码
 * 用于在 JavaScript 字符串中安全地嵌入用户输入
 */
export function escapeJs(text: string): string {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0');
}

/**
 * URL 参数编码
 */
export function escapeUrl(text: string): string {
  return encodeURIComponent(text);
}

/**
 * CSS 值编码
 * 用于在 CSS 中安全地嵌入用户输入
 */
export function escapeCss(text: string): string {
  return String(text).replace(/[^\w]/g, (char) => {
    return '\\' + char.charCodeAt(0).toString(16).padStart(2, '0');
  });
}

/**
 * 简单的 HTML 清理器
 * 移除所有 HTML 标签，保留纯文本
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 基础 HTML 净化器
 * 只允许安全的 HTML 标签和属性
 */
export function sanitizeHtml(html: string): string {
  if (!securityConfig.xss.enableSanitization) {
    return html;
  }

  // 移除所有 script 标签
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 移除所有 style 标签
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 移除所有事件处理器属性
  clean = clean.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

  // 移除 javascript: 协议
  clean = clean.replace(/javascript:/gi, '');

  // 移除危险的属性
  clean = clean.replace(/\s(style|srcset|data-[\w-]+)\s*=\s*["'][^"']*["']/gi, '');

  // 只保留允许的标签
  const allowedTags = securityConfig.xss.allowedTags.join('|');
  const tagRegex = new RegExp(`<(?!\\/?(${allowedTags})(\\s|>|\\/))[^>]*>`, 'gi');
  clean = clean.replace(tagRegex, '');

  // 清理允许标签的属性
  Object.entries(securityConfig.xss.allowedAttributes).forEach(([tag, attrs]) => {
    const attrString = attrs.join('|');
    const attrRegex = new RegExp(
      `<${tag}\\s+([^>]*?)\\s*(${attrString})\\s*=\\s*["']([^"']*)["']([^>]*)>`,
      'gi'
    );

    clean = clean.replace(attrRegex, (match, before, attr, value, after) => {
      // 验证属性值
      if (attr === 'href' || attr === 'src') {
        // 检查 URL 协议
        const allowedSchemes = securityConfig.xss.allowedSchemes.join('|');
        const schemeRegex = new RegExp(`^(${allowedSchemes}):`);
        if (!schemeRegex.test(value) && !value.startsWith('/') && !value.startsWith('#')) {
          return `<${tag}>`;
        }
      }
      return `<${tag} ${attr}="${value}">`;
    });
  });

  return clean;
}

/**
 * 验证和清理 JSON 数据
 */
export function sanitizeJson(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return escapeHtml(data);
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeJson);
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // 清理键名
      const cleanKey = escapeHtml(key);
      // 递归清理值
      sanitized[cleanKey] = sanitizeJson(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * 创建安全的 HTML 内容
 */
export interface SafeHtmlOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
}

export class SafeHtml {
  private content: string;
  private options: SafeHtmlOptions;

  constructor(content: string, options: SafeHtmlOptions = {}) {
    this.content = content;
    this.options = {
      allowedTags: options.allowedTags || securityConfig.xss.allowedTags,
      allowedAttributes: options.allowedAttributes || securityConfig.xss.allowedAttributes,
      allowedSchemes: options.allowedSchemes || securityConfig.xss.allowedSchemes,
    };
  }

  /**
   * 获取清理后的 HTML
   */
  toString(): string {
    return this.sanitize();
  }

  /**
   * 获取纯文本（移除所有标签）
   */
  toText(): string {
    return stripHtmlTags(this.content);
  }

  /**
   * 清理 HTML
   */
  private sanitize(): string {
    // 使用配置的选项进行清理
    const tempConfig = { ...securityConfig.xss };
    securityConfig.xss.allowedTags = this.options.allowedTags!;
    securityConfig.xss.allowedAttributes = this.options.allowedAttributes!;
    securityConfig.xss.allowedSchemes = this.options.allowedSchemes!;

    const result = sanitizeHtml(this.content);

    // 恢复原始配置
    Object.assign(securityConfig.xss, tempConfig);

    return result;
  }
}

/**
 * 验证文件名安全性
 */
export function sanitizeFilename(filename: string): string {
  // 移除路径遍历字符
  let safe = filename.replace(/\.\./g, '');
  safe = safe.replace(/[\/\\]/g, '');

  // 只允许字母、数字、连字符、下划线和点
  safe = safe.replace(/[^a-zA-Z0-9\-_.]/g, '_');

  // 限制长度
  if (safe.length > 255) {
    const ext = safe.substring(safe.lastIndexOf('.'));
    safe = safe.substring(0, 255 - ext.length) + ext;
  }

  return safe;
}

/**
 * 验证 MIME 类型
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return securityConfig.upload.allowedMimeTypes.includes(mimeType);
}

/**
 * 验证文件扩展名
 */
export function isAllowedFileExtension(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return securityConfig.upload.allowedExtensions.includes(ext);
}

/**
 * 创建 XSS 防护中间件
 */
export function createXssProtectionMiddleware() {
  return async function xssMiddleware(req: any, res: any, next: any) {
    // 清理请求体
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeJson(req.body);
    }

    // 清理查询参数
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeJson(req.query);
    }

    // 清理路径参数
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeJson(req.params);
    }

    next();
  };
}

/**
 * React 组件的 XSS 防护 Hook
 */
export function useSafeHtml(html: string, options?: SafeHtmlOptions): string {
  return new SafeHtml(html, options).toString();
}

/**
 * 客户端 XSS 防护辅助函数
 */
export const xssClientHelpers = `
// 安全地设置元素的文本内容
function setSafeText(element, text) {
  element.textContent = text;
}

// 安全地设置元素的 HTML 内容
function setSafeHtml(element, html) {
  // 创建一个临时元素来清理 HTML
  const temp = document.createElement('div');
  temp.textContent = html;
  element.innerHTML = temp.innerHTML;
}

// 安全地创建 URL
function createSafeUrl(url) {
  try {
    const parsed = new URL(url);
    // 只允许安全的协议
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '#';
    }
    return parsed.href;
  } catch {
    return '#';
  }
}

// 安全地设置属性
function setSafeAttribute(element, attribute, value) {
  // 阻止事件处理器属性
  if (attribute.toLowerCase().startsWith('on')) {
    return;
  }

  // 阻止危险的属性
  if (['src', 'href', 'action', 'formaction'].includes(attribute.toLowerCase())) {
    value = createSafeUrl(value);
  }

  element.setAttribute(attribute, value);
}
`;

/**
 * 导出所有 XSS 防护工具
 */
export const xssProtection = {
  escapeHtml,
  escapeJs,
  escapeUrl,
  escapeCss,
  stripHtmlTags,
  sanitizeHtml,
  sanitizeJson,
  sanitizeFilename,
  isAllowedMimeType,
  isAllowedFileExtension,
  SafeHtml,
  createXssProtectionMiddleware,
  useSafeHtml,
  xssClientHelpers,
};