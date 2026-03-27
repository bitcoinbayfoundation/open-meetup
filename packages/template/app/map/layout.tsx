export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Solid backdrop behind the site nav so it's not transparent over the map */}
      <div className="fixed top-0 left-0 right-0 h-[72px] bg-t-dark z-40" />
      {children}
    </>
  );
}
