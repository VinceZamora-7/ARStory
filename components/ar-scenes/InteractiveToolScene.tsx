import React from "react";
import { StyleSheet } from "react-native";
import {
  ViroARScene,
  ViroAmbientLight,
  Viro3DObject,
  ViroText,
} from "@reactvision/react-viro";

type ToolMode = "move" | "rotate" | "scale";

type SceneAppProps = {
  toolMode?: ToolMode;
  moveOffset?: { x: number; y: number };
  rotateYaw?: number;
  rotatePitch?: number;
  modelScale?: number;
};

interface InteractiveToolSceneProps {
  sceneNavigator?: any;
}

const cross = (a: [number, number, number], b: [number, number, number]) =>
  [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ] as [number, number, number];

const normalize = (v: [number, number, number]) => {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len] as [number, number, number];
};

const InteractiveToolScene = (props: InteractiveToolSceneProps = {}) => {
  const appProps: SceneAppProps = props.sceneNavigator?.viroAppProps ?? {};
  const mode = appProps.toolMode ?? "move";
  const moveOffset = appProps.moveOffset ?? { x: 0, y: 0 };
  const rotateYaw = appProps.rotateYaw ?? 0;
  const rotatePitch = appProps.rotatePitch ?? 0;
  const scaleValue = appProps.modelScale ?? 0.12;

  const [modelFailed, setModelFailed] = React.useState(false);
  const [modelPosition, setModelPosition] = React.useState<[number, number, number]>([
    0,
    -0.1,
    -1,
  ]);
  const smoothedPositionRef = React.useRef<[number, number, number]>([0, -0.1, -1]);
  const lastCommitMsRef = React.useRef(0);

  const onCameraTransformUpdate = React.useCallback(
    (cameraTransform: any) => {
      const pos = (cameraTransform?.position ?? [0, 0, 0]) as [number, number, number];
      const fwd = normalize(
        (cameraTransform?.forward ?? [0, 0, -1]) as [number, number, number]
      );
      const up = normalize(
        (cameraTransform?.up ?? [0, 1, 0]) as [number, number, number]
      );
      const right = normalize(cross(fwd, up));
      const distance = 1.0;

      const anchored: [number, number, number] = [
        pos[0] + fwd[0] * distance + right[0] * moveOffset.x + up[0] * moveOffset.y,
        pos[1] + fwd[1] * distance - 0.1 + right[1] * moveOffset.x + up[1] * moveOffset.y,
        pos[2] + fwd[2] * distance + right[2] * moveOffset.x + up[2] * moveOffset.y,
      ];

      // Smooth camera jitter to avoid visible flicker.
      const prev = smoothedPositionRef.current;
      const alpha = 0.2;
      const next: [number, number, number] = [
        prev[0] + (anchored[0] - prev[0]) * alpha,
        prev[1] + (anchored[1] - prev[1]) * alpha,
        prev[2] + (anchored[2] - prev[2]) * alpha,
      ];
      smoothedPositionRef.current = next;

      // Commit at ~30 FPS max and ignore micro movement noise.
      const now = Date.now();
      if (now - lastCommitMsRef.current < 33) {
        return;
      }
      const dx = next[0] - modelPosition[0];
      const dy = next[1] - modelPosition[1];
      const dz = next[2] - modelPosition[2];
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001 && Math.abs(dz) < 0.001) {
        return;
      }
      lastCommitMsRef.current = now;
      setModelPosition(next);
    },
    [moveOffset.x, moveOffset.y, modelPosition]
  );

  return (
    <ViroARScene onCameraTransformUpdate={onCameraTransformUpdate}>
      <ViroAmbientLight color="#ffffff" intensity={240} />

      <ViroText
        text={`Mode: ${mode.toUpperCase()}`}
        scale={[0.32, 0.32, 0.32]}
        position={[0, 0.45, -1]}
        style={styles.hudText}
      />

      {modelFailed ? (
        <ViroText
          text="Cube.glb failed. Using fallback model."
          scale={[0.18, 0.18, 0.18]}
          position={[0, 0.32, -1]}
          style={styles.errorText}
        />
      ) : null}

      <Viro3DObject
        source={
          modelFailed
            ? require("@/assets/models/robot.glb")
            : require("@/assets/models/cube.glb")
        }
        type="GLB"
        position={modelPosition}
        rotation={[rotatePitch, rotateYaw, 0]}
        scale={[scaleValue, scaleValue, scaleValue]}
        onError={() => setModelFailed(true)}
      />
    </ViroARScene>
  );
};

const styles = StyleSheet.create({
  hudText: {
    fontFamily: "Arial",
    fontSize: 24,
    color: "#d8f8ff",
    textAlignVertical: "center",
    textAlign: "center",
  },
  errorText: {
    fontFamily: "Arial",
    fontSize: 16,
    color: "#ffbbbb",
    textAlignVertical: "center",
    textAlign: "center",
  },
});

export default InteractiveToolScene;
