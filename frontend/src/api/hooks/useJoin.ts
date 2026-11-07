/** Joining an organisation without being signed in: with an invite link, or with its join code.
 * Both create the account and then sign straight in. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, postJson } from "../client";
import { supabase } from "../supabase";
import type { CodePreview, InvitePreview, JoinWithCode, JoinWithInvite } from "../types";

async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Your account was created, but signing in failed. Sign in with your email and password.");
}

export const useInvitePreview = (token: string) =>
  useQuery({ queryKey: ["join", "invite", token], queryFn: () => api<InvitePreview>(`/join/invite/${encodeURIComponent(token)}`), retry: false });

export const useAcceptInvite = (token: string) =>
  useMutation({
    mutationFn: async (body: JoinWithInvite) => {
      await postJson(`/join/invite/${encodeURIComponent(token)}`, body);
      await signIn(body.email.trim().toLowerCase(), body.password);
    },
  });

/** The organisation a code belongs to, once the code is complete (8 letters and numbers). */
export const useCodePreview = (code: string) =>
  useQuery({
    queryKey: ["join", "code", code],
    queryFn: () => api<CodePreview>(`/join/code/${encodeURIComponent(code)}`),
    enabled: code.replace(/[^A-Za-z0-9]/g, "").length === 8,
    retry: false,
    staleTime: 60_000,
  });

export const useJoinWithCode = () =>
  useMutation({
    mutationFn: async (body: JoinWithCode) => {
      await postJson("/join/code", body);
      await signIn(body.email.trim().toLowerCase(), body.password);
    },
  });
