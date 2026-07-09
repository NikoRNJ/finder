export default function OfflinePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-dvh">
      <p className="text-4xl mb-4">📡</p>
      <h1 className="text-xl font-bold mb-2">Sin conexión</h1>
      <p className="text-neutral-400 text-sm">
        Revisa tu conexión a internet e inténtalo de nuevo.
      </p>
    </main>
  );
}
