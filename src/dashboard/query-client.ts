import { MutationCache, QueryClient } from "@tanstack/react-query";

export const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    // One place: every successful mutation refreshes what the screens show.
    onSuccess: () => queryClient.invalidateQueries(),
  }),
});
