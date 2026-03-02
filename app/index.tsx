import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import InteractiveToolScene from "@/components/ar-scenes/InteractiveToolScene";

type TabKey = "settings" | "videos" | "storybook" | "about" | "update";
type ToolMode = "move" | "rotate" | "scale";

const NAV_ITEMS: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { key: "settings", label: "SETTINGS", icon: "cog-outline" },
  { key: "videos", label: "VIDEOS", icon: "play-circle-outline" },
  { key: "storybook", label: "STORYBOOK", icon: "book-open-page-variant-outline" },
  { key: "about", label: "ABOUT", icon: "information-outline" },
  { key: "update", label: "UPDATE", icon: "update" },
];

export default function NativeHome() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("storybook");
  const [toolMode, setToolMode] = useState<ToolMode>("move");
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [rotateYaw, setRotateYaw] = useState(0);
  const [rotatePitch, setRotatePitch] = useState(0);
  const [modelScale, setModelScale] = useState(0.12);
  const [gestureStart, setGestureStart] = useState<{
    mode: ToolMode;
    pageX: number;
    pageY: number;
    startOffsetX: number;
    startOffsetY: number;
    startYaw: number;
    startPitch: number;
    startScale: number;
    pinchDistance: number | null;
  } | null>(null);

  if (showSplash) {
    return (
      <View style={styles.splashPage}>
        <View style={styles.splashLogoTile}>
          <MaterialCommunityIcons name="cube-outline" size={74} color="#6de2ff" />
        </View>
        <Text style={styles.splashTitle}>Blender AR</Text>
        <Text style={styles.splashSubtitle}>
          Build and preview your AR interface before launching native scenes.
        </Text>
        <Pressable style={styles.splashButton} onPress={() => setShowSplash(false)}>
          <MaterialCommunityIcons name="arrow-right-circle-outline" size={20} color="#111736" />
          <Text style={styles.splashButtonText}>Enter Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={styles.logoTile}>
            <MaterialCommunityIcons name="cube-outline" size={30} color="#7edfff" />
          </View>
          <View>
            <Text style={styles.brand}>Blender AR</Text>
            <Text style={styles.brandSub}>Interactive Storybook Studio</Text>
          </View>
        </View>
      </View>

      <View style={styles.main}>
        {activeTab === "videos" ? (
          <View style={styles.windowCard}>
            <Text style={styles.windowTitle}>Video Scanner</Text>
            <Text style={styles.bodyText}>
              Main-screen AR is embedded below. Rotate mode rotates only the box.
              Scale mode uses two-finger pinch to resize.
            </Text>

            <View style={styles.modeRow}>
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

            <View style={styles.arViewport}>
              <VideosARViewport
                toolMode={toolMode}
                moveOffset={moveOffset}
                rotateYaw={rotateYaw}
                rotatePitch={rotatePitch}
                modelScale={modelScale}
              />
              <View
                style={styles.interactionTouchLayer}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(event) => {
                  const touches = event.nativeEvent.touches;
                  setGestureStart({
                    mode: toolMode,
                    pageX: event.nativeEvent.pageX,
                    pageY: event.nativeEvent.pageY,
                    startOffsetX: moveOffset.x,
                    startOffsetY: moveOffset.y,
                    startYaw: rotateYaw,
                    startPitch: rotatePitch,
                    startScale: modelScale,
                    pinchDistance:
                      toolMode === "scale" && touches.length >= 2
                        ? distanceBetweenTouches(
                            touches[0].pageX,
                            touches[0].pageY,
                            touches[1].pageX,
                            touches[1].pageY
                          )
                        : null,
                  });
                }}
                onResponderMove={(event) => {
                  if (!gestureStart) {
                    return;
                  }
                  const touches = event.nativeEvent.touches;

                  if (gestureStart.mode === "move") {
                    const dx = event.nativeEvent.pageX - gestureStart.pageX;
                    const dy = event.nativeEvent.pageY - gestureStart.pageY;
                    setMoveOffset({
                      x: gestureStart.startOffsetX + dx * 0.0018,
                      y: gestureStart.startOffsetY - dy * 0.0018,
                    });
                    return;
                  }

                  if (gestureStart.mode === "rotate") {
                    const dx = event.nativeEvent.pageX - gestureStart.pageX;
                    const dy = event.nativeEvent.pageY - gestureStart.pageY;
                    setRotateYaw(gestureStart.startYaw + dx * 0.5);
                    setRotatePitch(clamp(gestureStart.startPitch + dy * 0.4, -75, 75));
                    return;
                  }

                  if (gestureStart.mode === "scale" && touches.length >= 2) {
                    const currentDistance = distanceBetweenTouches(
                      touches[0].pageX,
                      touches[0].pageY,
                      touches[1].pageX,
                      touches[1].pageY
                    );
                    const base = gestureStart.pinchDistance ?? currentDistance;
                    setModelScale(clamp(gestureStart.startScale * (currentDistance / base), 0.04, 0.35));
                  }
                }}
                onResponderRelease={() => setGestureStart(null)}
                onResponderTerminate={() => setGestureStart(null)}
              />
            </View>
          </View>
        ) : null}

        {activeTab === "settings" ? (
          <View style={styles.windowCard}>
            <Text style={styles.windowTitle}>Settings</Text>
            <Text style={styles.bodyText}>Enable scan hints: ON</Text>
            <Text style={styles.bodyText}>Tooltips: ON</Text>
            <Text style={styles.bodyText}>Language: English</Text>
          </View>
        ) : null}

        {activeTab === "storybook" ? (
          <View style={styles.windowCard}>
            <Text style={styles.windowTitle}>Storybook (Softcopy)</Text>
            <ScrollView style={styles.storyScroll} contentContainerStyle={styles.storyContent}>
              <Text style={styles.bodyText}>
                Lira loved drawing but had never touched Blender. One afternoon, she
                opened her first 3D project and stared at a tiny cube in the middle
                of the screen.
              </Text>
              <Text style={styles.bodyText}>
                She tapped Move and watched the cube glide across the grid. She tried
                Rotate, then Scale, and laughed when the cube became tall like a tower.
              </Text>
              <Text style={styles.bodyText}>
                As she scanned each printed page, AR tools appeared beside the story.
                Every tool explained itself with a short animation and a challenge to try.
              </Text>
            </ScrollView>
          </View>
        ) : null}

        {activeTab === "about" ? (
          <View style={styles.windowCard}>
            <Text style={styles.windowTitle}>About Blender AR</Text>
            <Text style={styles.bodyText}>
              Blender AR connects a printed storybook with live digital overlays so
              learners can explore Move, Rotate, Scale and other core 3D concepts.
            </Text>
          </View>
        ) : null}

        {activeTab === "update" ? (
          <View style={styles.windowCard}>
            <Text style={styles.windowTitle}>Update</Text>
            <Text style={styles.bodyText}>No new package available right now.</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeTab;
          return (
            <Pressable
              key={item.key}
              onPress={() => setActiveTab(item.key)}
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
    </View>
  );
}

function VideosARViewport(props: {
  toolMode: ToolMode;
  moveOffset: { x: number; y: number };
  rotateYaw: number;
  rotatePitch: number;
  modelScale: number;
}) {
  try {
    const { ViroARSceneNavigator } = require("@reactvision/react-viro");
    return (
      <ViroARSceneNavigator
        initialScene={{ scene: InteractiveToolScene }}
        viroAppProps={{
          toolMode: props.toolMode,
          moveOffset: props.moveOffset,
          rotateYaw: props.rotateYaw,
          rotatePitch: props.rotatePitch,
          modelScale: props.modelScale,
        }}
        style={styles.container}
      />
    );
  } catch {
    return (
      <View style={styles.arFallback}>
        <MaterialCommunityIcons name="alert-circle-outline" size={26} color="#ffc286" />
        <Text style={styles.arFallbackTitle}>AR Module Not Available</Text>
        <Text style={styles.arFallbackText}>
          Run this app using a development build on Android, not Expo Go.
        </Text>
      </View>
    );
  }
}

function ModeButton(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.modeButton, props.active && styles.modeButtonActive]}
      onPress={props.onPress}
    >
      <Text style={[styles.modeButtonText, props.active && styles.modeButtonTextActive]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceBetweenTouches(
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: "#1b043c",
  },
  splashPage: {
    flex: 1,
    backgroundColor: "#190038",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
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
  header: {
    height: 84,
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
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#38cbff",
    backgroundColor: "#7d1dd9",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#7461ff",
    fontSize: 30,
    fontWeight: "700",
  },
  brandSub: {
    color: "#87cae5",
    fontSize: 11,
    marginTop: -2,
    letterSpacing: 0.5,
  },
  main: {
    flex: 1,
    padding: 14,
  },
  windowCard: {
    flex: 1,
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
  bodyText: {
    color: "#b4e6f8",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  storyScroll: {
    flex: 1,
  },
  storyContent: {
    paddingBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b6eb6",
    backgroundColor: "#1b2858",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: {
    borderColor: "#64dcff",
    backgroundColor: "#1a4f72",
  },
  modeButtonText: {
    color: "#8eddf5",
    fontSize: 12,
    fontWeight: "600",
  },
  modeButtonTextActive: {
    color: "#e9fdff",
  },
  arViewport: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4bc8ff",
    overflow: "hidden",
    backgroundColor: "#0f1b2e",
    position: "relative",
  },
  interactionTouchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  arFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 8,
  },
  arFallbackTitle: {
    color: "#ffe8d3",
    fontSize: 16,
    fontWeight: "700",
  },
  arFallbackText: {
    color: "#c8e7f5",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
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
});
