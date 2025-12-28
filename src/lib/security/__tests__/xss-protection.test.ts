import {
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
  useSafeHtml,
} from '../xss-protection';

describe('XSS Protection', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(escapeHtml('Hello & "World"')).toBe('Hello &amp; &quot;World&quot;');
      expect(escapeHtml("It's a <test>"

)).toBe("It&#39;s a &lt;test&gt;");
    });

    it('should handle empty and null values', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null as any)).toBe('null');
      expect(escapeHtml(undefined as any)).toBe('undefined');
    });

    it('should preserve safe text', () => {
      const safeText = 'Hello World 123';
      expect(escapeHtml(safeText)).toBe(safeText);
    });
  });

  describe('escapeJs', () => {
    it('should escape JavaScript special characters', () => {
      expect(escapeJs('alert("Hello\nWorld")')).toBe('alert(\\"Hello\\nWorld\\")');
      expect(escapeJs("It's a test")).toBe("It\\'s a test");
      expect(escapeJs('Line1\r\nLine2')).toBe('Line1\\r\\nLine2');
      expect(escapeJs('Tab\there')).toBe('Tab\\there');
    });

    it('should escape backslashes', () => {
      expect(escapeJs('C:\\Users\\test')).toBe('C:\\\\Users\\\\test');
    });

    it('should handle null bytes', () => {
      expect(escapeJs('Test\0String')).toBe('Test\\0String');
    });
  });

  describe('escapeUrl', () => {
    it('should encode URL components', () => {
      expect(escapeUrl('hello world')).toBe('hello%20world');
      expect(escapeUrl('test@example.com')).toBe('test%40example.com');
      expect(escapeUrl('a+b=c')).toBe('a%2Bb%3Dc');
    });

    it('should handle special characters', () => {
      expect(escapeUrl('?&=')).toBe('%3F%26%3D');
      expect(escapeUrl('#fragment')).toBe('%23fragment');
    });
  });

  describe('escapeCss', () => {
    it('should escape CSS special characters', () => {
      expect(escapeCss('font-family')).toBe('font\\2d family');
      expect(escapeCss('color: red;')).toBe('color\\3a \\20 red\\3b ');
      expect(escapeCss('"quoted"')).toBe('\\22 quoted\\22 ');
    });

    it('should escape all non-word characters', () => {
      const result = escapeCss('test@123.com');
      expect(result).toContain('\\40'); // @
      expect(result).toContain('\\2e'); // .
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
      expect(stripHtmlTags('<script>alert("XSS")</script>Content')).toBe('Content');
      expect(stripHtmlTags('No tags here')).toBe('No tags here');
    });

    it('should handle nested tags', () => {
      expect(stripHtmlTags('<div><p><span>Text</span></p></div>')).toBe('Text');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtmlTags('Hello<br/>World<img src="test.jpg"/>')).toBe('HelloWorld');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script');
      expect(result).toContain('<p>Hello</p>');
      expect(result).toContain('<p>World</p>');
    });

    it('should remove style tags', () => {
      const input = '<style>.evil { display: none; }</style><p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<div>Click me</div>');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve allowed tags', () => {
      const input = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should remove disallowed tags', () => {
      const input = '<iframe src="evil.com"></iframe><embed src="evil.swf">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<embed');
    });

    it('should validate href attributes', () => {
      const validLink = '<a href="https://example.com">Valid</a>';
      const invalidLink = '<a href="javascript:alert()">Invalid</a>';

      expect(sanitizeHtml(validLink)).toContain('href="https://example.com"');
      expect(sanitizeHtml(invalidLink)).not.toContain('javascript:');
    });
  });

  describe('sanitizeJson', () => {
    it('should escape HTML in string values', () => {
      const input = {
        name: '<script>alert("XSS")</script>',
        description: 'Hello & "World"',
      };

      const result = sanitizeJson(input);
      expect(result.name).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(result.description).toBe('Hello &amp; &quot;World&quot;');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<strong>John</strong>',
          profile: {
            bio: '<script>evil()</script>',
          },
        },
      };

      const result = sanitizeJson(input);
      expect(result.user.name).toContain('&lt;strong&gt;');
      expect(result.user.profile.bio).toContain('&lt;script&gt;');
    });

    it('should handle arrays', () => {
      const input = {
        items: ['<div>Item 1</div>', '<span>Item 2</span>'],
      };

      const result = sanitizeJson(input);
      expect(result.items[0]).toContain('&lt;div&gt;');
      expect(result.items[1]).toContain('&lt;span&gt;');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: '<test>',
        age: 25,
        active: true,
        data: null,
      };

      const result = sanitizeJson(input);
      expect(result.name).toContain('&lt;test&gt;');
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should sanitize object keys', () => {
      const input = {
        '<script>key</script>': 'value',
      };

      const result = sanitizeJson(input);
      const keys = Object.keys(result);
      expect(keys[0]).toContain('&lt;script&gt;');
    });
  });

  describe('SafeHtml class', () => {
    it('should sanitize HTML content', () => {
      const unsafe = '<script>alert("XSS")</script><p>Safe content</p>';
      const safe = new SafeHtml(unsafe);

      expect(safe.toString()).not.toContain('<script');
      expect(safe.toString()).toContain('<p>Safe content</p>');
    });

    it('should extract plain text', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const safe = new SafeHtml(html);

      expect(safe.toText()).toBe('Hello World');
    });

    it('should use custom allowed tags', () => {
      const html = '<div>Div content</div><span>Span content</span>';
      const safe = new SafeHtml(html, {
        allowedTags: ['div'],
      });

      const result = safe.toString();
      expect(result).toContain('<div>');
      expect(result).not.toContain('<span>');
    });

    it('should use custom allowed attributes', () => {
      const html = '<a href="https://example.com" target="_blank" onclick="evil()">Link</a>';
      const safe = new SafeHtml(html, {
        allowedAttributes: {
          a: ['href'],
        },
      });

      const result = safe.toString();
      expect(result).toContain('href=');
      expect(result).not.toContain('target=');
      expect(result).not.toContain('onclick=');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('___etc_passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('__windows_system32');
    });

    it('should remove slashes', () => {
      expect(sanitizeFilename('folder/file.txt')).toBe('folder_file.txt');
      expect(sanitizeFilename('folder\\file.txt')).toBe('folder_file.txt');
    });

    it('should replace invalid characters', () => {
      expect(sanitizeFilename('file:name*.txt')).toBe('file_name_.txt');
      expect(sanitizeFilename('file?name<>.txt')).toBe('file_name__.txt');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeFilename('valid-file_name.123.txt')).toBe('valid-file_name.123.txt');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result).toEndWith('.txt');
    });
  });

  describe('isAllowedMimeType', () => {
    it('should allow configured MIME types', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
      expect(isAllowedMimeType('image/png')).toBe(true);
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('should reject unconfigured MIME types', () => {
      expect(isAllowedMimeType('application/x-shockwave-flash')).toBe(false);
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
      expect(isAllowedMimeType('text/html')).toBe(false);
    });
  });

  describe('isAllowedFileExtension', () => {
    it('should allow configured extensions', () => {
      expect(isAllowedFileExtension('image.jpg')).toBe(true);
      expect(isAllowedFileExtension('document.pdf')).toBe(true);
      expect(isAllowedFileExtension('photo.PNG')).toBe(true); // Case insensitive
    });

    it('should reject unconfigured extensions', () => {
      expect(isAllowedFileExtension('script.exe')).toBe(false);
      expect(isAllowedFileExtension('macro.docm')).toBe(false);
      expect(isAllowedFileExtension('page.html')).toBe(false);
    });

    it('should handle files without extensions', () => {
      expect(isAllowedFileExtension('noextension')).toBe(false);
    });
  });

  describe('useSafeHtml hook', () => {
    it('should sanitize HTML content', () => {
      const unsafe = '<img src=x onerror="alert(\'XSS\')">';
      const safe = useSafeHtml(unsafe);

      expect(safe).not.toContain('onerror');
      expect(safe).not.toContain('alert');
    });

    it('should use custom options', () => {
      const html = '<div>Content</div>';
      const safe = useSafeHtml(html, {
        allowedTags: [],
      });

      expect(safe).not.toContain('<div>');
    });
  });
});