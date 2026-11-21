import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Kind = "water" | "electricity" | "heating" | "road" | "weather" | "emergency" | "other";
type Alert = { id: number; kind: Kind; level: string; title: string; body: string | null; area: string | null; lat: number | null; lng: number | null; startsAt: string | null; endsAt: string | null; closedAt: string | null; source: string | null; updatedAt: string };
type Notice = { id: string; title: string; summary: string; category: string; sourceName: string; sourceUrl: string; checkedAt: string; verification: string };
type Tab = "home" | "map" | "notices" | "settings";
const DEFAULT_API = "";
const COLORS = { bg: "#071523", panel: "#102638", line: "#1c3a4d", text: "#f4fbff", muted: "#9fb5c3", cyan: "#36e1d0" };
const KINDS: Record<Kind, { label: string; icon: string; color: string }> = {
  water: { label: "Ус", icon: "💧", color: "#63bcf8" }, electricity: { label: "Цахилгаан", icon: "⚡", color: "#ffd163" },
  heating: { label: "Дулаан", icon: "♨", color: "#ff9c71" }, road: { label: "Зам", icon: "🚧", color: "#ffad73" },
  weather: { label: "Цаг агаар", icon: "☁", color: "#a5b4fc" }, emergency: { label: "Онцгой", icon: "!", color: "#ff7185" },
  other: { label: "Бусад", icon: "•", color: "#b5c5d0" },
};
const DEMO: Alert[] = [
  { id: 1, kind: "water", level: "warning", title: "Цэвэр усны шугамын засвар", body: "Энэ бол аппын боломжийг харуулах жишээ мэдээлэл.", area: "3-р микро", lat: 49.0305, lng: 104.0512, startsAt: null, endsAt: null, closedAt: null, source: null, updatedAt: "" },
  { id: 2, kind: "electricity", level: "info", title: "Цахилгааны төлөвлөгөөт ажил", body: "Энэ бол бодит тасалдал биш. Системийн загвар мэдээлэл.", area: "Төв", lat: 49.027, lng: 104.045, startsAt: null, endsAt: null, closedAt: null, source: null, updatedAt: "" },
  { id: 3, kind: "road", level: "info", title: "Зам засварын жишээ", body: "Энэ мэдээлэл зөвхөн туршилтад зориулагдсан.", area: "Барилгачин", lat: 49.03268, lng: 104.06018, startsAt: null, endsAt: null, closedAt: null, source: null, updatedAt: "" },
];
const fmt = (value: string | null) => value ? new Date(value).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Мэдээлэлгүй";
const openAlert = (item: Alert) => !item.closedAt && (!item.endsAt || Date.parse(item.endsAt) > Date.now());

function Tag({ children, color = COLORS.cyan }: { children: string; color?: string }) {
  return <View style={[styles.tag, { borderColor: color + "55", backgroundColor: color + "18" }]}><Text style={[styles.tagText, { color }]}>{children}</Text></View>;
}

function AlertCard({ item, demo, onPress }: { item: Alert; demo: boolean; onPress: () => void }) {
  const kind = KINDS[item.kind] || KINDS.other;
  return <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.cardTop}><View style={[styles.iconBox, { backgroundColor: kind.color + "20" }]}><Text style={{ color: kind.color, fontSize: 21 }}>{kind.icon}</Text></View>
      <View style={{ flex: 1 }}><View style={styles.row}><Tag color={kind.color}>{kind.label}</Tag>{demo && <Tag color="#ffd163">Жишээ</Tag>}</View><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.muted}>📍 {item.area || "Байршил тодорхойгүй"}</Text></View>
      <Text style={styles.arrow}>›</Text>
    </View>
    <View style={styles.cardFooter}><Text style={styles.small}>{openAlert(item) ? "●  Идэвхтэй" : "●  Дууссан / хаагдсан"}</Text><Text style={styles.small}>Дэлгэрэнгүй  →</Text></View>
  </Pressable>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [api, setApi] = useState(DEFAULT_API);
  const [draft, setDraft] = useState(DEFAULT_API);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!api) throw new Error("No server configured");
      const [a, n] = await Promise.all([
        fetch(api + "/api/alerts", { signal: AbortSignal.timeout(8000) }),
        fetch(api + "/api/announcements", { signal: AbortSignal.timeout(8000) }),
      ]);
      if (!a.ok || !n.ok) throw new Error("Server error");
      const ad = await a.json(); const nd = await n.json();
      if (!Array.isArray(ad.items) || !Array.isArray(nd.items)) throw new Error("Invalid response");
      setAlerts(ad.items); setNotices(nd.items); setConnected(true);
    } catch { setConnected(false); setAlerts([]); setNotices([]); }
    finally { setLoading(false); }
  }, [api]);
  useEffect(() => { void refresh(); }, [refresh]);
  const data = connected ? alerts : DEMO;
  const visible = data.filter((item) => filter === "all" || item.kind === filter);
  const live = data.filter(openAlert);
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home", icon: "⌂", label: "Нүүр" }, { id: "map", icon: "⌖", label: "Газрын зураг" },
    { id: "notices", icon: "▤", label: "Мэдээ" }, { id: "settings", icon: "⚙", label: "Тохиргоо" },
  ];

  return <SafeAreaView style={[styles.root, { paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0 }]}><StatusBar style="light" />
    <View style={styles.header}><View><Text style={styles.brand}>SMART <Text style={{ color: COLORS.cyan }}>ORKHON</Text></Text><Text style={styles.headerSub}>ЭРДЭНЭТ · ИРГЭДЭД ЗОРИУЛАВ</Text></View><View style={styles.headerIcon}><Text style={{ color: COLORS.cyan, fontSize: 20 }}>⌁</Text></View></View>
    {tab === "map" ? <View style={{ flex: 1 }}>
      <View style={styles.mapHeading}><Text style={styles.title}>Газрын зураг</Text><Text style={styles.muted}>Байршилтай мэдэгдлүүд</Text></View>
      {!connected && <Text style={styles.demoBanner}>ЖИШЭЭ БАЙРШЛУУД · БОДИТ ТАСАЛДАЛ БИШ</Text>}
      <MapView style={{ flex: 1 }} initialRegion={{ latitude: 49.0305, longitude: 104.052, latitudeDelta: 0.08, longitudeDelta: 0.08 }}>
        {visible.filter(a => a.lat != null && a.lng != null).map(a => <Marker key={a.id} coordinate={{ latitude: a.lat!, longitude: a.lng! }} title={a.title} description={a.area || undefined} onPress={() => setSelected(a)} />)}
      </MapView>
      <Text style={styles.mapFoot}>Зөвхөн байршилтай мэдээллийг харуулна.</Text>
    </View> : <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.cyan} />}>
      {tab === "home" && <>
        <Text style={styles.eyebrow}>МЭДЭЭЛЭЛТЭЙ БАЙ, ТАЙВАН БАЙ</Text><Text style={styles.hero}>Таны хот,{"\n"}<Text style={{ color: COLORS.cyan }}>нэг дор.</Text></Text>
        <Text style={styles.intro}>Ус, дулаан, цахилгаан болон хотын мэдээллээ хялбархан шалгаарай.</Text>
        <View style={styles.connection}><Text style={{ color: connected ? COLORS.cyan : "#ffd163", fontWeight: "700" }}>{loading ? "● Холбогдож байна" : connected ? "● Серверт холбогдсон" : "● Серверт холбогдоогүй"}</Text><Text style={styles.muted}>{connected ? "Мэдээллийг сайтаас авч байна" : "Доорх нь жишээ мэдээлэл"}</Text></View>
        <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>ӨНӨӨДРИЙН МЭДЭЭЛЭЛ</Text><Text style={styles.sectionTitle}>Шуурхай мэдээлэл</Text></View><Tag>{String(live.length) + " идэвхтэй"}</Tag></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[{ id: "all", label: "Бүгд" }, { id: "water", label: "💧 Ус" }, { id: "electricity", label: "⚡ Цахилгаан" }, { id: "heating", label: "♨ Дулаан" }, { id: "road", label: "🚧 Зам" }].map(x => <Pressable key={x.id} onPress={() => setFilter(x.id as Kind | "all")} style={[styles.filter, filter === x.id && styles.filterActive]}><Text style={[styles.filterText, filter === x.id && { color: COLORS.bg }]}>{x.label}</Text></Pressable>)}
        </ScrollView>
        {loading ? <ActivityIndicator color={COLORS.cyan} /> : visible.length ? visible.map(a => <AlertCard key={a.id} item={a} demo={!connected} onPress={() => setSelected(a)} />) : <View style={styles.empty}><Text style={styles.cardTitle}>Мэдээлэл алга</Text><Text style={styles.muted}>Энэ төрөлд одоогоор мэдээлэл ороогүй байна.</Text></View>}
        <Pressable style={styles.mapLink} onPress={() => setTab("map")}><Text style={{ color: COLORS.cyan, fontWeight: "700" }}>⌖  Газрын зураг үзэх</Text><Text style={{ color: COLORS.cyan }}>→</Text></Pressable>
      </>}
      {tab === "notices" && <><Text style={styles.eyebrow}>ХОТЫН МЭДЭЭ</Text><Text style={styles.title}>Мэдэгдлүүд</Text><Text style={styles.intro}>Эх сурвалж, шалгасан цагийг хамт харна.</Text>
        {!connected ? <View style={styles.empty}><Text style={styles.cardTitle}>Серверт холбогдоогүй</Text><Text style={styles.muted}>Бодит мэдээлэл үзэхийн тулд тохиргооноос серверийн хаягийг шалгана уу.</Text><Pressable onPress={() => setTab("settings")}><Text style={styles.link}>Тохиргоо нээх →</Text></Pressable></View> : notices.length ? notices.map(n => <Pressable key={n.id} style={styles.card} onPress={() => n.sourceUrl && Linking.openURL(n.sourceUrl).catch(() => {})}><View style={styles.row}><Tag color={n.verification === "demo" ? "#ffd163" : COLORS.cyan}>{n.verification === "demo" ? "Жишээ" : n.verification === "verified-note" ? "Гараар шалгасан тэмдэглэл" : n.verification === "live" ? "Шууд мэдээлэл" : "Баталгаажаагүй"}</Tag></View><Text style={styles.cardTitle}>{n.title}</Text><Text style={styles.muted}>{n.summary}</Text><Text style={[styles.small, { marginTop: 12 }]}>{n.sourceName} · Шалгасан {fmt(n.checkedAt)}</Text></Pressable>) : <Text style={styles.muted}>Одоогоор мэдэгдэл алга.</Text>}
      </>}
      {tab === "settings" && <><Text style={styles.eyebrow}>SMART ORKHON</Text><Text style={styles.title}>Тохиргоо</Text><Text style={styles.intro}>Апп болон вэбсайт ижил мэдээллийн сантай холбогдоно.</Text>
        <View style={styles.card}><Text style={styles.cardTitle}>Серверийн хаяг</Text><Text style={styles.muted}>Туршилтын үед компьютер, утас ижил Wi-Fi-д холбогдсон байна. Хаяг энэ удаагийн туршилтад ашиглагдана.</Text><TextInput style={styles.input} value={draft} onChangeText={setDraft} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://..." placeholderTextColor="#718793" /><Pressable style={styles.primary} onPress={() => { const url = draft.trim().replace(/\/+$/, ""); if (/^https?:\/\//i.test(url)) { setApi(url); } }}><Text style={styles.primaryText}>Холбогдох</Text></Pressable><Pressable onPress={refresh}><Text style={styles.link}>Дахин холбогдох ↻</Text></Pressable></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Мэдээллийн тухай</Text><Text style={styles.muted}>Сервер ажиллахгүй бол апп зөвхөн жишээ мэдээлэл харуулна. Энэ хувилбар мэдэгдэл илгээхгүй.</Text></View>
      </>}
    </ScrollView>}
    <View style={styles.nav}>{tabs.map(t => <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.navItem}><Text style={[styles.navIcon, tab === t.id && { color: COLORS.cyan }]}>{t.icon}</Text><Text style={[styles.navText, tab === t.id && { color: COLORS.cyan }]}>{t.label}</Text></Pressable>)}</View>
    <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}><View style={styles.modalBack}><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.row}><Tag color={selected ? KINDS[selected.kind]?.color : COLORS.cyan}>{selected ? (KINDS[selected.kind]?.label || "Бусад") : ""}</Tag>{!connected && <Tag color="#ffd163">Жишээ</Tag>}</View><Text style={styles.title}>{selected?.title}</Text><Text style={styles.intro}>📍 {selected?.area || "Байршил тодорхойгүй"}</Text><Text style={styles.body}>{selected?.body || "Нэмэлт тайлбар байхгүй."}</Text><Text style={styles.muted}>Эхлэх: {fmt(selected?.startsAt || null)}{"\n"}Дуусах: {fmt(selected?.endsAt || null)}{"\n"}Шинэчилсэн: {fmt(selected?.updatedAt || null)}{"\n"}Эх сурвалж: {selected?.source || "Мэдээлэлгүй"}</Text>{selected?.source && /^https?:\/\//.test(selected.source) && <Pressable onPress={() => Linking.openURL(selected.source!).catch(() => {})}><Text style={styles.link}>Эх сурвалж нээх ↗</Text></Pressable>}<Pressable style={styles.primary} onPress={() => setSelected(null)}><Text style={styles.primaryText}>Хаах</Text></Pressable></View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg }, header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.line },
  brand: { color: COLORS.text, fontWeight: "900", fontSize: 17, letterSpacing: 1 }, headerSub: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.1, marginTop: 3 }, headerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#14374a" },
  content: { padding: 22, paddingBottom: 32 }, eyebrow: { color: COLORS.cyan, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 12 }, hero: { color: COLORS.text, fontSize: 40, fontWeight: "800", lineHeight: 48, marginTop: 12 }, title: { color: COLORS.text, fontSize: 28, fontWeight: "800", marginTop: 9 }, intro: { color: COLORS.muted, fontSize: 15, lineHeight: 23, marginTop: 9 }, body: { color: COLORS.text, lineHeight: 24, fontSize: 16, marginBottom: 18 },
  connection: { padding: 15, marginTop: 22, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, backgroundColor: "#0d2231", gap: 5 }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 30, marginBottom: 14 }, sectionEyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1 }, sectionTitle: { color: COLORS.text, fontSize: 21, fontWeight: "800", marginTop: 5 },
  filters: { gap: 8, paddingBottom: 16 }, filter: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 50, paddingHorizontal: 15, paddingVertical: 9, backgroundColor: COLORS.panel }, filterActive: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan }, filterText: { color: COLORS.text, fontSize: 13, fontWeight: "700" }, card: { backgroundColor: COLORS.panel, borderColor: COLORS.line, borderWidth: 1, borderRadius: 19, padding: 16, marginBottom: 12 }, cardTop: { flexDirection: "row", gap: 12 }, iconBox: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 5 }, muted: { color: COLORS.muted, fontSize: 13, lineHeight: 20 }, small: { color: COLORS.muted, fontSize: 11 }, arrow: { fontSize: 25, color: COLORS.muted }, row: { flexDirection: "row", gap: 6, flexWrap: "wrap" }, tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 30, borderWidth: 1, alignSelf: "flex-start" }, tagText: { fontSize: 10, fontWeight: "800" }, cardFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: COLORS.line, marginTop: 14, paddingTop: 11 }, empty: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 20, gap: 6 }, mapLink: { flexDirection: "row", justifyContent: "space-between", padding: 18, borderWidth: 1, borderColor: "#2f746d", borderRadius: 16, marginTop: 8 },
  nav: { flexDirection: "row", backgroundColor: "#0c1f2e", borderTopColor: COLORS.line, borderTopWidth: 1, paddingTop: 9, paddingBottom: 10 }, navItem: { flex: 1, alignItems: "center", gap: 2 }, navIcon: { color: COLORS.muted, fontSize: 23, lineHeight: 26 }, navText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" }, mapHeading: { paddingHorizontal: 22, paddingVertical: 15 }, mapFoot: { color: COLORS.muted, backgroundColor: COLORS.panel, fontSize: 12, padding: 12, textAlign: "center" }, demoBanner: { textAlign: "center", backgroundColor: "#604f28", color: "#ffe9a0", fontWeight: "800", fontSize: 10, padding: 9 }, input: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, color: COLORS.text, backgroundColor: COLORS.bg, padding: 12, marginTop: 15 }, primary: { backgroundColor: COLORS.cyan, borderRadius: 14, padding: 15, alignItems: "center", marginTop: 16 }, primaryText: { color: COLORS.bg, fontWeight: "800" }, link: { color: COLORS.cyan, fontWeight: "700", marginTop: 14 }, modalBack: { flex: 1, backgroundColor: "#000a", justifyContent: "flex-end" }, sheet: { backgroundColor: "#102638", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 32 }, sheetHandle: { width: 40, height: 4, borderRadius: 5, backgroundColor: "#527080", alignSelf: "center", marginBottom: 20 },
});
