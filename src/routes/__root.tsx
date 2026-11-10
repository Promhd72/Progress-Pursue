import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { initNativeShell } from "@/lib/native";

function NotFoundComponent() {
  return (
    <div className="pt-safe flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Nothing here</h1>
        <p className="mt-2 text-sm text-muted-foreground">That screen doesn't exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to training
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="pt-safe flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Coming back to the app (e.g. from a reminder) refreshes streak + stats.
    initNativeShell(() => {
      void queryClient.invalidateQueries();
    });
  }, [queryClient]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") queryClient.clear();
      else queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" offset="calc(env(safe-area-inset-top) + 52px)" />
    </QueryClientProvider>
  );
}
