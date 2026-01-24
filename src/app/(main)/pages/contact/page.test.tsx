import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactPage from './page';

jest.mock('@/app/components/ui/Skeleton', () => {
  const MockSkeleton = () => <div data-testid="skeleton">Loading...</div>;
  MockSkeleton.displayName = 'MockSkeleton';
  return MockSkeleton;
});

jest.mock('@/app/components/ui/Dropdown', () => {
  return {
    __esModule: true,
    default: ({
      options,
      selectedValue,
      onSelect,
    }: {
      options: { value: string; label: string }[];
      selectedValue: string;
      onSelect: (val: string) => void;
    }) => (
      <select data-testid="dropdown" value={selectedValue} onChange={e => onSelect(e.target.value)}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

jest.mock('@/app/components/contact/NewGuideForm', () => {
  const MockNewGuideForm = () => <div data-testid="new-guide-form">New Guide Form</div>;
  MockNewGuideForm.displayName = 'MockNewGuideForm';
  return MockNewGuideForm;
});

jest.mock('@/app/components/contact/BugReportForm', () => {
  const MockBugReportForm = () => <div data-testid="bug-report-form">Bug Report Form</div>;
  MockBugReportForm.displayName = 'MockBugReportForm';
  return MockBugReportForm;
});

jest.mock('@/app/components/contact/FeatureRequestForm', () => {
  const MockFeatureRequestForm = () => (
    <div data-testid="feature-request-form">Feature Request Form</div>
  );
  MockFeatureRequestForm.displayName = 'MockFeatureRequestForm';
  return MockFeatureRequestForm;
});

jest.mock('@/app/components/contact/GeneralQuestionForm', () => {
  const MockGeneralQuestionForm: React.FC<{ onTitleChange: (title: string) => void }> = ({
    onTitleChange,
  }) => (
    <div data-testid="general-question-form">
      <p>General Question Form</p>
      <button onClick={() => onTitleChange('New Title')}>Change Title</button>
    </div>
  );

  MockGeneralQuestionForm.displayName = 'MockGeneralQuestionForm';
  return MockGeneralQuestionForm;
});

jest.mock('@/app/components/contact/SupportForm', () => {
  const MockSupportForm = () => <div data-testid="support-form">Support Form</div>;
  MockSupportForm.displayName = 'MockSupportForm';
  return MockSupportForm;
});

describe('ContactPage', () => {
  it('displays skeleton while loading', async () => {
    render(<ContactPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument(), {
      timeout: 1500,
    });
  });

  it('renders NewGuideForm by default', async () => {
    render(<ContactPage />);

    await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument(), {
      timeout: 1500,
    });

    expect(screen.getByTestId('new-guide-form')).toBeInTheDocument();
  });

  it('renders correct form when dropdown changes', async () => {
    render(<ContactPage />);

    await waitFor(
      () => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const dropdown = await screen.findByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();

    fireEvent.change(dropdown, { target: { value: 'bug_report' } });
    expect(screen.getByTestId('bug-report-form')).toBeInTheDocument();

    fireEvent.change(dropdown, { target: { value: 'feature_request' } });
    expect(screen.getByTestId('feature-request-form')).toBeInTheDocument();
  });

  it('updates title when general question is selected', async () => {
    render(<ContactPage />);

    await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument(), {
      timeout: 1500,
    });

    const dropdown = await screen.findByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();

    fireEvent.change(dropdown, { target: { value: 'general_question' } });

    const generalQuestionForm = await screen.findByTestId('general-question-form');
    expect(generalQuestionForm).toBeInTheDocument();

    fireEvent.click(screen.getByText('Change Title'));
    expect(screen.getByText('New Title')).toBeInTheDocument();
  });
});
