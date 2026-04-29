# ⚡ FUSE — BLE Scooter Utility v1.0

**Nur für Privatgelände.**

## Setup

```bash
npm install
expo start
```

## APK bauen (GitHub Actions)

1. Repo auf GitHub pushen
2. `EXPO_TOKEN` als GitHub Secret hinterlegen
3. `eas login` einmalig lokal ausführen
4. Push auf `main` → APK wird automatisch gebaut

## App Passwort

`W.e.roller.W`

## Unterstützte Scooter

### Voll unterstützt (BLE)
- Ninebot ZT3 Pro / GT3 / G3
- Ninebot Max G30 / G30D / G30L / G2
- Ninebot F-Serie (F2, F2+, F2 Pro, F3, F20–F40)
- Ninebot ES-Serie (ES1–ES4)
- Ninebot E-Serie (E22, E25, E45)
- Ninebot Air T15
- Xiaomi M365 / M365 Pro / Pro 2 / 1S / Lite / Mi 3

### Teilweise (Region-Unlock)
- Ninebot D18 / D28 / D38
- Xiaomi Electric Scooter 4 / 4 Lite / 4 Pro / 4 Ultra

## Features V1
- Passwort-Gate
- Disclaimer (30s Countdown, nur beim ersten Start)
- BLE Scan & Connect (Auto-Modell-Erkennung)
- Live Dashboard (Speed, Watt, Volt, Amp, Temp, Odo)
- Speed Unlock (Slider 5–100 km/h)
- Region Wechsel (DE / US / INT)
- Ghost Mode (Police Mode) mit eigener Aktivierungskombo
- Licht / Lock / Cruise Control / Fahrmodus
- Scooter Bild pro Modell
- Garage (gespeicherte Scooter)
