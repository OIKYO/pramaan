import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: (note: string) => void;
}

/** Asks for a written note before an action that needs one: send back, confirm a reading, override. */
export function NoteDialog({ open, onOpenChange, title, description, label, confirmLabel, pending, onConfirm }: NoteDialogProps) {
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const missing = tried && !note.trim();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setTried(true);
              if (note.trim()) onConfirm(note.trim());
            }}
          >
            {pending ? "Saving…" : confirmLabel}
          </Button>
        </>
      }
    >
      <Field label={label} error={missing ? "Write a note first; it's kept in the poster's history." : null}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000} />
      </Field>
    </Modal>
  );
}
