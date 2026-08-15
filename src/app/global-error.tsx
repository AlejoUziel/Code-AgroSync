"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="es"><body><main className="flex min-h-screen items-center justify-center p-6"><div className="max-w-md rounded-2xl border p-6 text-center"><h1 className="text-2xl font-semibold">Ocurrió un error inesperado</h1><p className="mt-2 text-sm text-gray-600">El incidente fue registrado con un identificador técnico. Puedes intentar nuevamente.</p><button onClick={reset} className="mt-5 rounded-lg bg-green-600 px-5 py-3 text-white">Intentar de nuevo</button></div></main></body></html>
  );
}

