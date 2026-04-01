// Bare-bones layout for print/PDF pages — no nav, no providers
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', color: '#1a1a2e', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
