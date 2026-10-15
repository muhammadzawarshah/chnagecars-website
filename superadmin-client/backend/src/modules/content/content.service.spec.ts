import { validateBlocks } from './content.service';

describe('content blocks (XSS protection)', () => {
  it('accepts the known structured blocks', () => {
    expect(() =>
      validateBlocks([
        { type: 'heading', text: 'Title', level: 2 },
        { type: 'paragraph', text: 'Hello' },
        { type: 'image', src: 'https://cdn.example/a.webp', alt: 'Car' },
        { type: 'link', text: 'More', href: '/cars' },
        { type: 'list', items: ['a', 'b'] },
        { type: 'quote', text: 'Q' },
        { type: 'video', url: 'https://youtube.com/watch?v=1' },
      ]),
    ).not.toThrow();
  });

  it.each([
    [{ type: 'html', html: '<script>alert(1)</script>' }],
    [{ type: 'link', text: 'x', href: 'javascript:alert(1)' }],
    [{ type: 'image', src: 'http://insecure.example/a.png' }],
    [{ type: 'link', text: 'x', href: 'https://ok.example/"onmouseover="x' }],
    [{ type: 'paragraph', text: '' }],
    [{ type: 'heading', text: 'x', level: 1 }],
  ])('rejects %j', (block) => {
    expect(() => validateBlocks([block as never])).toThrow();
  });
});
