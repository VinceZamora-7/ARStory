import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type TabKey = "settings" | "videos" | "storybook" | "about" | "update";
type ToolMode = "move" | "rotate" | "scale";

type NavItem = {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { key: "settings", label: "SETTINGS", icon: "cog-outline" },
  { key: "videos", label: "VIDEOS", icon: "play-circle-outline" },
  { key: "storybook", label: "STORYBOOK", icon: "book-open-page-variant-outline" },
  { key: "about", label: "ABOUT", icon: "information-outline" },
  { key: "update", label: "UPDATE", icon: "update" },
];

export default function WebHome() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("storybook");

  if (showSplash) {
    return <IntroSplash onContinue={() => setShowSplash(false)} />;
  }

  return (
    <View style={styles.page}>
      <View style={styles.dashboard}>
        <View pointerEvents="none" style={styles.bgOrbA} />
        <View pointerEvents="none" style={styles.bgOrbB} />
        <Header />
        <MainScreen activeTab={activeTab} />
        <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} />
      </View>
    </View>
  );
}

function IntroSplash(props: { onContinue: () => void }) {
  return (
    <View style={styles.splashPage}>
      <View style={styles.splashGlowA} />
      <View style={styles.splashGlowB} />

      <View style={styles.splashLogoTile}>
        <MaterialCommunityIcons name="cube-outline" size={74} color="#6de2ff" />
      </View>

      <Text style={styles.splashTitle}>Blender AR</Text>
      <Text style={styles.splashSubtitle}>
        Build and preview your AR interface before launching native scenes.
      </Text>

      <Pressable style={styles.splashButton} onPress={props.onContinue}>
        <MaterialCommunityIcons name="arrow-right-circle-outline" size={20} color="#111736" />
        <Text style={styles.splashButtonText}>Enter Dashboard</Text>
      </Pressable>
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brandWrap}>
        <View style={styles.logoTile}>
          <MaterialCommunityIcons name="cube-outline" size={34} color="#7edfff" />
        </View>
        <View>
          <Text style={styles.brand}>Blender AR</Text>
          <Text style={styles.brandSub}>Interactive Storybook Studio</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <Pressable style={styles.iconButton}>
          <MaterialCommunityIcons name="crop-free" size={22} color="#42d2ff" />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <MaterialCommunityIcons name="menu" size={24} color="#42d2ff" />
        </Pressable>
      </View>
    </View>
  );
}

function MainScreen(props: { activeTab: TabKey }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("move");
  const [toolValue, setToolValue] = useState(0);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pingLive, setPingLive] = useState(false);
  const [objectPos, setObjectPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{
    pageX: number;
    pageY: number;
    x: number;
    y: number;
    value: number;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (props.activeTab !== "videos") {
      setCameraOpen(false);
      setInteractionEnabled(false);
    }
  }, [props.activeTab]);

  useEffect(() => {
    let disposed = false;

    async function startCamera() {
      if (!cameraOpen) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError("Camera access was blocked or unavailable on this browser.");
      }
    }

    startCamera();

    return () => {
      disposed = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen]);

  useEffect(() => {
    let mounted = true;

    const measurePing = async () => {
      const started = performance.now();
      try {
        await fetch(`/?ping=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!mounted) {
          return;
        }
        setPingMs(Math.round(performance.now() - started));
        setPingLive(true);
      } catch {
        if (!mounted) {
          return;
        }
        setPingLive(false);
      }
    };

    measurePing();
    const timer = setInterval(measurePing, 2500);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const tabLabel = getTabLabel(props.activeTab);
  const isVideos = props.activeTab === "videos";
  const objectTransform = getMainObjectTransform(toolMode, toolValue, objectPos);

  return (
    <View style={styles.main}>
      <View style={styles.statusRow}>
        <View style={styles.pill}>
          <MaterialCommunityIcons name="circle" size={9} color="#75ff4b" />
          <Text style={styles.pillText}>AR Active</Text>
        </View>
        <View style={styles.pill}>
          <MaterialCommunityIcons
            name="wifi"
            size={13}
            color={pingLive ? "#75ff4b" : "#ffb870"}
          />
          <Text style={styles.pillText}>
            {pingMs !== null ? `${pingMs}ms` : "Checking..."}
          </Text>
        </View>
      </View>

      <View style={styles.rule} />

      {isVideos ? (
        <View style={styles.arViewport}>
          {cameraOpen ? (
            <View style={styles.cameraLayer}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={styles.cameraVideo as unknown as React.CSSProperties}
              />
              <View style={styles.scanFrame} />
              {!!cameraError && <Text style={styles.cameraError}>{cameraError}</Text>}
            </View>
          ) : null}

          {cameraOpen ? (
            <Pressable
              style={styles.closeCameraBtn}
              onPress={() => setCameraOpen(false)}
            >
              <MaterialCommunityIcons name="close" size={20} color="#daf8ff" />
            </Pressable>
          ) : null}

          <View style={styles.arHudTop}>
            <Text style={styles.hudTitle}>Video Scanner</Text>
            <Text style={styles.hudSubtitle}>{tabLabel}</Text>
            <Text style={styles.hudHint}>
              QR scan and live preview are available only in Videos.
            </Text>
            <Pressable
              style={styles.tryToolButton}
              onPress={() => setInteractionEnabled((prev) => !prev)}
            >
              <MaterialCommunityIcons name="gesture-tap-button" size={16} color="#0b1730" />
              <Text style={styles.tryToolButtonText}>
                {interactionEnabled ? "Hide Tool Interaction" : "Try Tool Interaction"}
              </Text>
            </Pressable>
          </View>

          {!cameraOpen ? (
            <View style={styles.reticle}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={38}
                color="#8be6ff"
              />
            </View>
          ) : null}

          <View style={styles.arFloor} />

          {interactionEnabled ? (
            <View style={styles.mainControls}>
              <View style={styles.toolModeRow}>
                <ModeButton
                  label="Move"
                  active={toolMode === "move"}
                  onPress={() => setToolMode("move")}
                />
                <ModeButton
                  label="Rotate"
                  active={toolMode === "rotate"}
                  onPress={() => setToolMode("rotate")}
                />
                <ModeButton
                  label="Scale"
                  active={toolMode === "scale"}
                  onPress={() => setToolMode("scale")}
                />
              </View>
              <View style={styles.adjustRow}>
                <Pressable
                  style={styles.adjustBtn}
                  onPress={() => setToolValue((value) => value - 10)}
                >
                  <Text style={styles.adjustBtnText}>-</Text>
                </Pressable>
                <Text style={styles.adjustValue}>{toolValue}</Text>
                <Pressable
                  style={styles.adjustBtn}
                  onPress={() => setToolValue((value) => value + 10)}
                >
                  <Text style={styles.adjustBtnText}>+</Text>
                </Pressable>
              </View>
              <Text style={styles.dragHint}>
                Main screen interaction: drag to Move, horizontal drag to Rotate, vertical drag to Scale.
              </Text>
            </View>
          ) : null}

          {interactionEnabled ? (
            <View
              style={[styles.mainObject, { transform: objectTransform }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(event) => {
                const { pageX, pageY } = event.nativeEvent;
                setDragStart({
                  pageX,
                  pageY,
                  x: objectPos.x,
                  y: objectPos.y,
                  value: toolValue,
                });
              }}
              onResponderMove={(event) => {
                if (!dragStart) {
                  return;
                }
                const { pageX, pageY } = event.nativeEvent;
                const deltaX = pageX - dragStart.pageX;
                const deltaY = pageY - dragStart.pageY;

                if (toolMode === "move") {
                  const nextX = dragStart.x + deltaX;
                  const nextY = dragStart.y + deltaY;
                  setObjectPos({ x: nextX, y: nextY });
                  return;
                }

                if (toolMode === "rotate") {
                  setToolValue(Math.round(clamp(dragStart.value + deltaX * 0.9, -180, 180)));
                  return;
                }

                setToolValue(Math.round(clamp(dragStart.value - deltaY * 0.7, -50, 180)));
              }}
              onResponderRelease={() => setDragStart(null)}
              onResponderTerminate={() => setDragStart(null)}
            >
              <MaterialCommunityIcons name="cube-outline" size={48} color="#d6f9ff" />
            </View>
          ) : null}
        </View>
      ) : null}

      {props.activeTab === "settings" ? <SettingsWindow /> : null}
      {props.activeTab === "storybook" ? <StorybookWindow /> : null}
      {props.activeTab === "about" ? <AboutWindow /> : null}
      {props.activeTab === "update" ? <UpdateWindow /> : null}

      <View style={styles.rule} />

      {isVideos ? (
        <Pressable
          style={styles.fab}
          onPress={() => {
            setCameraOpen(true);
            setCameraError(null);
          }}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={40} color="#eaf2ff" />
        </Pressable>
      ) : null}
    </View>
  );
}

function ModeButton(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.modeBtn, props.active && styles.modeBtnActive]}
      onPress={props.onPress}
    >
      <Text style={[styles.modeBtnText, props.active && styles.modeBtnTextActive]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function getMainObjectTransform(
  toolMode: ToolMode,
  toolValue: number,
  objectPos: { x: number; y: number }
) {
  const transform: Array<
    | { translateX: number }
    | { translateY: number }
    | { rotate: string }
    | { scale: number }
  > = [{ translateX: objectPos.x }, { translateY: objectPos.y }];

  if (toolMode === "rotate") {
    transform.push({ rotate: `${toolValue}deg` });
  }
  if (toolMode === "scale") {
    transform.push({ scale: Math.max(0.5, 1 + toolValue / 100) });
  }
  return transform;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function SettingsWindow() {
  return (
    <View style={styles.windowCard}>
      <Text style={styles.windowTitle}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable scan hints</Text>
        <Text style={styles.settingValue}>ON</Text>
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Sound effects</Text>
        <Text style={styles.settingValue}>ON</Text>
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Tooltips</Text>
        <Text style={styles.settingValue}>ON</Text>
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Language</Text>
        <Text style={styles.settingValue}>English</Text>
      </View>
    </View>
  );
}

function StorybookWindow() {
  return (
    <View style={styles.windowCard}>
      <Text style={styles.windowTitle}>Storybook (Softcopy)</Text>
      <ScrollView style={styles.storyScroll} contentContainerStyle={styles.storyContent}>
        <Text style={styles.storyParagraph}>
          Lira loved drawing but had never touched Blender. One afternoon, she opened
          her first 3D project and stared at a tiny cube in the middle of the screen.
        </Text>
        <Text style={styles.storyParagraph}>
          She tapped Move and watched the cube glide across the grid. She tried Rotate,
          then Scale, and laughed when the cube became tall like a tower.
        </Text>
        <Text style={styles.storyParagraph}>
          As she scanned each printed page, AR tools appeared beside the story. Every
          tool explained itself with a short animation and a challenge to try.
        </Text>
        <Text style={styles.storyParagraph}>
          By the last chapter, Lira could model a tiny room and understood how each
          Blender tool changed her world.
        </Text>
      </ScrollView>
    </View>
  );
}

function AboutWindow() {
  return (
    <View style={styles.windowCard}>
      <Text style={styles.windowTitle}>About Blender AR</Text>
      <Text style={styles.aboutText}>
        Blender AR is an interactive learning app that connects a printed storybook
        with live digital overlays. Students scan pages to preview tools and understand
        what each Blender action does through guided interaction.
      </Text>
      <Text style={styles.aboutText}>
        Goal: make 3D learning more engaging for beginners by combining storytelling,
        hands-on exploration, and augmented visualization.
      </Text>
    </View>
  );
}

function UpdateWindow() {
  return (
    <View style={styles.windowCard}>
      <Text style={styles.windowTitle}>Update</Text>
      <Text style={styles.aboutText}>No new package available right now.</Text>
      <Text style={styles.aboutText}>Current content: Storybook v1.0, Tools Pack v1.0</Text>
    </View>
  );
}

function BottomNavigation(props: {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const active = item.key === props.activeTab;
        return (
          <Pressable
            key={item.key}
            onPress={() => props.onTabPress(item.key)}
            style={[styles.navItem, active && styles.navItemActive]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={18}
              color={active ? "#e8fbff" : "#8ddff9"}
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getTabLabel(tab: TabKey) {
  switch (tab) {
    case "settings":
      return "Settings";
    case "videos":
      return "Video Examples";
    case "storybook":
      return "Storybook";
    case "about":
      return "About Us";
    case "update":
      return "Update";
    default:
      return "Dashboard";
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#190038",
  },
  splashPage: {
    flex: 1,
    backgroundColor: "#190038",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    position: "relative",
    overflow: "hidden",
  },
  splashGlowA: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "#2f95ff",
    opacity: 0.22,
    top: -140,
    left: -90,
  },
  splashGlowB: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "#b54cff",
    opacity: 0.18,
    bottom: -120,
    right: -70,
  },
  splashLogoTile: {
    width: 158,
    height: 158,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#45d4ff",
    backgroundColor: "#29125a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  splashTitle: {
    color: "#7f7dff",
    fontSize: 56,
    fontWeight: "700",
    marginBottom: 10,
  },
  splashSubtitle: {
    color: "#b3ebff",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 520,
    marginBottom: 28,
  },
  splashButton: {
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 20,
    backgroundColor: "#56d4ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  splashButtonText: {
    color: "#111736",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  dashboard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1b043c",
    overflow: "hidden",
    position: "relative",
  },
  bgOrbA: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 999,
    backgroundColor: "#4f2dd6",
    opacity: 0.23,
    top: -180,
    right: -90,
  },
  bgOrbB: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "#1094c6",
    opacity: 0.2,
    bottom: -140,
    left: -100,
  },
  header: {
    height: 88,
    backgroundColor: "#04070f",
    borderBottomWidth: 1,
    borderBottomColor: "#2fc7ff",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoTile: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: "#38cbff",
    backgroundColor: "#7d1dd9",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#7461ff",
    fontSize: 34,
    fontWeight: "700",
  },
  brandSub: {
    color: "#87cae5",
    fontSize: 11,
    marginTop: -2,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38cbff",
    backgroundColor: "#08182b",
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    paddingTop: 14,
    paddingHorizontal: 14,
    position: "relative",
  },
  statusRow: {
    gap: 8,
  },
  pill: {
    width: 98,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2e9bff",
    backgroundColor: "rgba(12, 5, 32, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  pillText: {
    color: "#a8ebff",
    fontSize: 12,
    fontWeight: "600",
  },
  rule: {
    height: 2,
    borderRadius: 10,
    backgroundColor: "#43c3fb",
    marginTop: 14,
    opacity: 0.86,
  },
  arViewport: {
    flex: 1,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2b60ba",
    backgroundColor: "#11052d",
    overflow: "hidden",
    position: "relative",
  },
  arHudTop: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 3,
  },
  hudTitle: {
    color: "#dbf6ff",
    fontSize: 20,
    fontWeight: "700",
  },
  hudSubtitle: {
    color: "#86dff8",
    fontSize: 13,
    marginTop: 2,
  },
  hudHint: {
    color: "#9ccce1",
    fontSize: 12,
    marginTop: 6,
  },
  tryToolButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "#60dcff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tryToolButtonText: {
    color: "#0b1730",
    fontSize: 12,
    fontWeight: "700",
  },
  cameraLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: "hidden",
    backgroundColor: "#060910",
  },
  cameraVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  closeCameraBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#5ed8ff",
    backgroundColor: "rgba(8, 20, 34, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  scanFrame: {
    position: "absolute",
    top: "21%",
    left: "15%",
    right: "15%",
    bottom: "21%",
    borderWidth: 2,
    borderColor: "#72e4ff",
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  cameraError: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    color: "#ffb4b4",
    fontSize: 12,
    backgroundColor: "rgba(40, 0, 8, 0.7)",
    borderWidth: 1,
    borderColor: "#ff6289",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reticle: {
    position: "absolute",
    top: "45%",
    left: "50%",
    marginLeft: -19,
    marginTop: -19,
    zIndex: 2,
  },
  arFloor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "35%",
    borderTopWidth: 1,
    borderTopColor: "#3d65b9",
    backgroundColor: "#1c1058",
    opacity: 0.92,
  },
  mainControls: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,
    zIndex: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#52ceff",
    backgroundColor: "rgba(7, 21, 58, 0.9)",
    padding: 12,
  },
  toolModeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeBtn: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b6eb6",
    backgroundColor: "#1b2858",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnActive: {
    borderColor: "#64dcff",
    backgroundColor: "#1a4f72",
  },
  modeBtnText: {
    color: "#8eddf5",
    fontSize: 12,
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#e9fdff",
  },
  adjustRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  adjustBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#58d7ff",
    backgroundColor: "#1f355f",
    alignItems: "center",
    justifyContent: "center",
  },
  adjustBtnText: {
    color: "#dcf8ff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  adjustValue: {
    color: "#b9eeff",
    minWidth: 56,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  dragHint: {
    color: "#9eddf5",
    fontSize: 11,
    marginTop: 8,
  },
  mainObject: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -36,
    marginTop: -36,
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#73e5ff",
    backgroundColor: "rgba(25, 53, 108, 0.88)",
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#63d5ff",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 104,
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: "#6f9fff",
    backgroundColor: "#6e2cf2",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    height: 88,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#39a5ff",
    backgroundColor: "rgba(13, 24, 58, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
  },
  navItem: {
    width: 70,
    height: 54,
    borderRadius: 11,
    backgroundColor: "#202744",
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    backgroundColor: "#1b4b73",
    borderWidth: 1,
    borderColor: "#52d2ff",
  },
  navLabel: {
    marginTop: 4,
    color: "#6fdffb",
    fontSize: 9,
    fontWeight: "700",
  },
  navLabelActive: {
    color: "#e9fbff",
  },
  windowCard: {
    flex: 1,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#305ab0",
    backgroundColor: "rgba(17, 6, 43, 0.93)",
    padding: 18,
  },
  windowTitle: {
    color: "#dcf6ff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  settingRow: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#304f98",
    backgroundColor: "#20114d",
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    color: "#a6dff5",
    fontSize: 14,
  },
  settingValue: {
    color: "#e3f6ff",
    fontSize: 12,
    fontWeight: "700",
  },
  storyScroll: {
    flex: 1,
  },
  storyContent: {
    paddingBottom: 8,
  },
  storyParagraph: {
    color: "#b4e6f8",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
  },
  aboutText: {
    color: "#b4e6f8",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
});
