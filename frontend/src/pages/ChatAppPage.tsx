import ChatWinDowLayout from "@/components/chat/ChatWinDowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";

const ChatAppPage = () => {
  return (
    <SidebarProvider>
      <AppSidebar/>

      <div className="flex h-screen w-full p-2">
        <ChatWinDowLayout />
      </div>
    </SidebarProvider>
  )
};

export default ChatAppPage;