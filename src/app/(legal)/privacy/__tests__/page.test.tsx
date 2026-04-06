import { render, screen } from '@testing-library/react';
import PrivacyPage, { metadata } from '@/app/(legal)/privacy/page';
import { SITE_CONTACT_EMAIL, SITE_URL } from '@/config/site';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';

jest.mock('@/utils/seo/StructuredData', () => ({
  __esModule: true,
  default: ({ data }: { data: unknown }) => (
    <div data-testid="structured-data">{JSON.stringify(data)}</div>
  ),
}));

jest.mock('@/utils/seo/metadata/structuredData', () => ({
  __esModule: true,
  getBreadcrumbStructuredData: jest.fn(() => ({
    '@type': 'BreadcrumbList',
    itemListElement: [],
  })),
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({
    children,
    size,
    className,
  }: {
    children: React.ReactNode;
    size?: string;
    className?: string;
  }) => (
    <div data-testid="page-container" data-size={size} data-class={className}>
      {children}
    </div>
  ),
  PageHeader: ({
    eyebrow,
    title,
    description,
    meta,
  }: {
    eyebrow: string;
    title: string;
    description: React.ReactNode;
    meta: string;
  }) => (
    <header>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <div>{description}</div>
      <p>{meta}</p>
    </header>
  ),
}));

describe('PrivacyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected page metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Privacy Policy',
      description: 'Learn how Hobbistas collects and protects your data.',
    });
  });

  it('renders privacy content and structured data', () => {
    render(<PrivacyPage />);

    expect(screen.getByTestId('page-container')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(`Last updated: ${new Date().getFullYear()}`)).toBeInTheDocument();
    expect(screen.getByText('1. Data Controller')).toBeInTheDocument();
    expect(screen.getByText('11. Relationship with Terms of Service')).toBeInTheDocument();
    expect(screen.getAllByText(SITE_CONTACT_EMAIL).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: SITE_URL.replace('https://', '') })).toHaveAttribute(
      'href',
      SITE_URL,
    );
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms',
    );

    expect(getBreadcrumbStructuredData).toHaveBeenCalledWith([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Privacy Policy', url: `${SITE_URL}/privacy` },
    ]);
    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
  });
});
