import { type ReactNode } from "react";

export default function PageContainer({
  content,
  sidebar,
  navbar,
}: {
  content?: ReactNode;
  sidebar?: ReactNode;
  navbar?: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-50 text-text-900">
      {sidebar}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {navbar}
        <div className="flex-1 overflow-auto">{content}</div>
      </div>
    </div>
  );
}
