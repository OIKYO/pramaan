import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchJson, postJson } from "../client";
import { supabase } from "../supabase";
import type { SignupRequest } from "../types";

export const useSignup = () =>
  useMutation({
    mutationFn: async (body: SignupRequest) => {
      await postJson<{ org_id: string }>("/signup", body);
      const { error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
      if (error) throw new Error("Your organisation was created, but signing in failed. Sign in with your email and password.");
    },
  });

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      await postJson<null>("/me/password", { password });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateMyName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (full_name: string) => patchJson<null>("/me", { full_name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useDeleteMyAccount() {
  return useMutation({
    mutationFn: async () => {
      await postJson<null>("/me/delete", {});
      await supabase.auth.signOut({ scope: "local" });
    },
  });
}
