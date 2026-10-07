export default function NoteBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="note-bar">
      <span aria-hidden>💡</span>
      <div>{children}</div>
    </div>
  );
}
