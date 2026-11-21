import {
  Bell, Building2, CheckCircle2, FileText, Home, Info, Landmark, Map as MapIcon, Megaphone, Smartphone,
  type LucideIcon,
} from "lucide-react";

// Phone navigation, shared by the real bottom bar and the phone screens drawn in the «Апп татах» section,
// so the app design and the site always match.
export type NavItem = { href: string; label: string; icon: LucideIcon };

export const TABS: (NavItem & { primary?: boolean })[] = [
  { href: "#home", label: "Нүүр", icon: Home },
  { href: "#notices", label: "Мэдэгдэл", icon: Bell },
  { href: "#report", label: "Мэдээлэх", icon: Megaphone, primary: true },
  { href: "#map", label: "Газрын зураг", icon: MapIcon },
];

export const MENU: NavItem[] = [
  { href: "#notices", label: "Мэдэгдэл", icon: Bell },
  { href: "#report", label: "Асуудал мэдээлэх", icon: Megaphone },
  { href: "#map", label: "Газрын зураг", icon: MapIcon },
  { href: "#services", label: "Үйлчилгээ", icon: Building2 },
  { href: "#visit", label: "Үзэх газар", icon: Landmark },
  { href: "#solved", label: "Үр дүн, санаа", icon: CheckCircle2 },
  { href: "#app", label: "Апп татах", icon: Smartphone },
  { href: "#sources", label: "Эх сурвалж", icon: FileText },
  { href: "#about", label: "Бидний тухай", icon: Info },
];
