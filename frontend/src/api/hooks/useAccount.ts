/** Your own account: signing up a new organisation, and choosing your password. */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson } from "../client";
import { supabase } from "../supabase";
import type { SignupRequest } from "../types";

/** Create an organisation (you become its head office), then sign straight in. */
export const useSignup = () =>
  useMutation({
    mutationFn: async (body: SignupRequest) => {
      await postJson<{ org_id: string }>("/signup", body);
      const { error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
      if (error) throw new Error("Your organisation was created, but signing in failed. Sign in with your email and password.");
    },
  });

/** Choose a new password. Clears the "temporary password" flag on your profile. */
export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      await postJson<null>("/me/password", { password });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
