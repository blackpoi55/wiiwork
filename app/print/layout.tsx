export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #ffffff; }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { width: 210mm; }
        }
      `}</style>
      {children}
    </>
  );
}
