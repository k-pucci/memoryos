// lib/layout-utils.ts - Pure utility functions
export function formatChatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
  
  export function getNavItemActiveState(
    currentPage: string, 
    pathname: string, 
    itemPath: string, 
    itemLabel: string
  ): boolean {
    if (currentPage === "Chat" && itemPath === "/chat") return true;
    if (currentPage === itemLabel) return true;
    if (currentPage === "Home" && itemPath === "/" && pathname === "/") return true;
    return false;
  }