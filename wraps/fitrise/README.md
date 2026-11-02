# FitRise Tesla wrap

`FitRise.png` is a Tesla Toybox custom wrap (1024×1024 PNG, under 1 MB).

## Install on the car
1. Format a USB drive as exFAT, FAT32 or MS-DOS FAT.
2. Create a folder named `Wraps` at the root and copy `FitRise.png` into it.
3. Plug it into the car → **Toybox → Paint Shop → Wraps**.

## Regenerate
The logo lives at `wraps/fitrise/logo.png` (any logo on a white background works). After changing it, run:

```
python3 wraps/fitrise/generate.py
```

`preview_with_outlines.png` shows the design with the panel outlines on top, for checking placement.
