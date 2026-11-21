import Link from "next/link";
import { Suspense } from "react";

import { ModuleHost } from "@/core/components/ModuleHost";
import { getModule, getModules } from "@/modules/registry";

export function generateStaticParams() {
  return getModules().map((module) => ({ moduleId: module.id }));
}

export default function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  return (
    <Suspense fallback={<ModuleFallback />}>
      <ModuleRoute params={params} />
    </Suspense>
  );
}

async function ModuleRoute({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const definition = getModule(moduleId);

  if (!definition) {
    return <ModuleNotFound moduleId={moduleId} />;
  }

  // Pass only serializable UI fields: `buildPhases` is a function and must not
  // cross the server/client boundary.
  return (
    <ModuleHost
      module={{
        id: definition.id,
        title: definition.title,
        SetupComponent: definition.SetupComponent,
        RunnerComponent: definition.RunnerComponent,
      }}
    />
  );
}

function ModuleFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <p className="text-sm text-zinc-500">Loading module…</p>
    </main>
  );
}

function ModuleNotFound({ moduleId }: { moduleId: string }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-50">Module not found</h1>
      <p className="mt-2 text-sm text-zinc-400">
        There is no registered module with the id “{moduleId}”.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400"
      >
        Back to modules
      </Link>
    </main>
  );
}
