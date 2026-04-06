import { render } from '@testing-library/react';
import { ArticleContent } from '@/components/article/ArticleContent';

describe('ArticleContent', () => {
  it('renders a section element', () => {
    render(<ArticleContent html="<p>Hello</p>" />);
    expect(document.querySelector('section')).toBeInTheDocument();
  });

  it('injects html via dangerouslySetInnerHTML', () => {
    render(<ArticleContent html="<p>Hello world</p>" />);
    expect(document.querySelector('section')?.innerHTML).toBe('<p>Hello world</p>');
  });

  it('applies ARTICLE_PROSE class by default', () => {
    render(<ArticleContent html="" />);
    const section = document.querySelector('section');
    // ARTICLE_PROSE classes are applied — verify the first token is present
    expect(section?.className).toContain('article-content');
  });

  it('merges optional className with ARTICLE_PROSE', () => {
    render(<ArticleContent html="" className="my-extra-class" />);
    const section = document.querySelector('section');
    expect(section?.className).toContain('article-content');
    expect(section?.className).toContain('my-extra-class');
  });

  it('renders correctly without a className prop', () => {
    render(<ArticleContent html="<em>test</em>" />);
    const section = document.querySelector('section');
    expect(section?.innerHTML).toBe('<em>test</em>');
    expect(section?.className).toContain('article-content');
  });
});
