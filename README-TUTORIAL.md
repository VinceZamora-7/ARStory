# Blender AR App Tutorial (From Clone to Running)

This guide walks you through setting up and running this project on web and Android.

## 1. Clone the Project

```bash
git clone <your-repo-url> ar-storybook-blender
cd ar-storybook-blender
```

## 2. Prerequisites

Install these first:

- Node.js LTS (recommended: 18 or 20)
- npm (comes with Node.js)
- Android Studio (with SDK + emulator) for Android testing
- Java 17 (recommended for modern Android/Gradle builds)
- USB debugging enabled if using a physical Android phone

Verify tools:

```bash
node -v
npm -v
adb devices
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run on Web (UI Preview)

```bash
npx expo start --web -c --port 8082
```

Notes:

- Web mode is best for rapid UI work.
- Native AR behavior is limited on web.

## 5. Run on Android (Native AR)

Start emulator or connect your Android phone, then:

```bash
npx expo start -c
npm run android
```

`npm run android` uses `expo run:android` (native dev build).

Important:

- Use a **development build**, not Expo Go.
- AR modules from `@reactvision/react-viro` require native runtime support.

## 6. App Flow

Current app behavior:

- Splash -> Dashboard
- `VIDEOS` tab -> AR viewport + tool modes:
  - `Move`
  - `Rotate`
  - `Scale`
- `STORYBOOK`, `SETTINGS`, `ABOUT`, `UPDATE` have their own panels

## 7. 3D Model Setup (Blender GLB)

Primary model path:

- `assets/models/Cube.glb`

Fallback model path:

- `assets/models/robot.glb`

If your custom GLB does not render:

1. Re-export from Blender as `glTF 2.0 (.glb)`
2. In export options:
   - Apply Modifiers: ON
   - Apply Transform: ON
   - Avoid Draco compression (for initial testing)
3. Place file in `assets/models/`
4. Restart with cache clear:

```bash
npx expo start -c
npm run android
```

## 8. Common Issues

### Error: AR module not available / crashes in Expo Go

Use dev build:

```bash
npx expo start -c
npm run android
```

### Error: Unmatched route

This project includes a not-found redirect route. If this still appears, clear cache:

```bash
npx expo start -c
```

### Model does not appear

- Check filename case exactly (`Cube.glb` vs `cube.glb`)
- Verify file exists in `assets/models/`
- Try fallback model (`robot.glb`) to confirm pipeline

### Android device not detected

```bash
adb devices
```

If empty:

- Start emulator, or
- Enable USB debugging and authorize the device

## 9. Development Commands

```bash
# lint/type checks
npx tsc --noEmit

# web
npx expo start --web -c --port 8082

# android
npx expo start -c
npm run android
```

## 10. Recommended Next Improvements

1. Add per-mode sensitivity sliders (`move`, `rotate`, `scale`)
2. Save/restore tool transform state
3. Add model picker UI (switch between Blender assets)
4. Add onboarding overlay for gesture instructions
