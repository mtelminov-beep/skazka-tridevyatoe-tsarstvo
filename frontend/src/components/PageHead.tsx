import type { ReactNode } from "react";

/** Единая шапка раздела: надзаголовок, крупный заголовок и вводный текст. */
export function PageHead({
  eyebrow,
  title,
  lead,
  children
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head rise-in">
      <div className="page-head__eyebrow">
        <span aria-hidden="true">✦</span>
        {eyebrow}
      </div>
      <h1>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
      {children}
    </header>
  );
}
