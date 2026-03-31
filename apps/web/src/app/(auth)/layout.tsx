export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-widest text-accent">PeluQ'arte</h1>
          <p className="text-brand-400 text-sm mt-1 tracking-wide">Peluquería</p>
        </div>
        {children}
      </div>
    </div>
  );
}
