import { render, screen } from '@testing-library/react';
import SupportForm from '../SupportForm';

describe('SupportForm Component', () => {
  it('renders the support message', () => {
    render(<SupportForm />);
    expect(
      screen.getByText('Αν θέλεις να υποστηρίξεις το project, μπορείς να κάνεις δωρεά μέσω:'),
    ).toBeInTheDocument();
  });

  it('renders all donation buttons', () => {
    render(<SupportForm />);
    expect(screen.getByText('💙 Κάνε μια δωρεά μέσω PayPal')).toBeInTheDocument();
    expect(screen.getByText('🔥 Γίνε υποστηρικτής στο Patreon')).toBeInTheDocument();
    expect(screen.getByText('☕ Buy Me a Coffee')).toBeInTheDocument();
  });

  it('renders the support reasons section', () => {
    render(<SupportForm />);
    expect(screen.getByText('Γιατί ζητάμε υποστήριξη;')).toBeInTheDocument();
  });

  it('renders all support reasons', () => {
    render(<SupportForm />);
    const supportReasons = [
      'Κόστος Hosting & Domain',
      'Βάση δεδομένων & Αποθήκευση',
      'APIs & Third-party υπηρεσίες',
      'Συντήρηση & Βελτιώσεις',
      'Υποστήριξη νέων λειτουργιών',
      'Εργαλεία ανάπτυξης',
      'Διαχείριση κοινότητας',
      'Διαφημίσεις & Προώθηση',
    ];

    supportReasons.forEach(reason => {
      expect(screen.getByText(reason)).toBeInTheDocument();
    });
  });

  it('renders the final support message', () => {
    render(<SupportForm />);
    expect(
      screen.getByText('Κάθε συνεισφορά βοηθάει στη βελτίωση του project! 🙏'),
    ).toBeInTheDocument();
  });
});
