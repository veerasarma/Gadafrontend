import { useChatDock } from "@/contexts/ChatDockContext";
import ChatWindow from "@/components/messenger/ChatWindow";

export default function ChatDock() {
  const { windows } = useChatDock();

  if (!windows.length) return null;

  return (
    <div className="fixed bottom-2 right-2 z-[90] flex gap-2 overflow-x-auto max-w-full pr-2">
      {windows.map((w) => (
        <ChatWindow key={w.conversationId} item={w} />
      ))}
    </div>
  );
}
