'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '1.5rem',
        padding: '0.5rem 1rem',
        background: '#111',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontFamily: 'inherit',
      }}
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
