export const CHAT_THEMES = [
    { id: "default", label: "Mặc định" },
    { id: "pink-hearts", label: "Trái tim", imageUrl: "/pink-hearts.jpg" },
    { id: "blue-clouds", label: "Mây xanh", imageUrl: "/blue-clouds.jpg" },
    { id: "green-leaves", label: "Lá xanh", imageUrl: "/green-leaves.jpg" },
] as const;

export type ChatTheme = (typeof CHAT_THEMES)[number]["id"];

export const getChatTheme = (theme: ChatTheme) =>
    CHAT_THEMES.find((item) => item.id === theme) ?? CHAT_THEMES[0];
