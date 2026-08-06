#!/usr/bin/env bash
# Required Android cold-launch smoke for preview APKs.
# Usage: APK=/path/to.apk bash scripts/android-launch-smoke.sh
set -euo pipefail

APK="${APK:-}"
PACKAGE="${PACKAGE:-com.milerecover.app}"
ACTIVITY="${ACTIVITY:-com.milerecover.app/.MainActivity}"
ALIVE_SECS="${ALIVE_SECS:-60}"
OUT_DIR="${OUT_DIR:-/tmp/milerecover-launch-smoke}"
ADB="${ADB:-adb}"

if [[ -z "$APK" || ! -f "$APK" ]]; then
  echo "APK path required: APK=/path/to.apk $0" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
SHA=$(sha256sum "$APK" | awk '{print $1}')
echo "APK=$APK"
echo "SHA256=$SHA"
echo "$SHA" > "$OUT_DIR/apk.sha256"

"$ADB" devices
"$ADB" uninstall "$PACKAGE" >/dev/null 2>&1 || true
"$ADB" install -r -g "$APK"
"$ADB" shell svc wifi disable >/dev/null 2>&1 || true
"$ADB" shell svc data disable >/dev/null 2>&1 || true

"$ADB" logcat -c
"$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
"$ADB" shell am start -n "$ACTIVITY"
START_TS=$(date +%s)

alive=0
for i in $(seq 1 "$ALIVE_SECS"); do
  pid=$("$ADB" shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r' || true)
  if [[ -z "${pid:-}" ]]; then
    echo "FAIL: process dead at t=${i}s" | tee "$OUT_DIR/result.txt"
    "$ADB" logcat -d > "$OUT_DIR/logcat.txt"
    exit 1
  fi
  alive=$i
  sleep 1
done
echo "OK: alive ${alive}s pid=$pid"

"$ADB" logcat -d > "$OUT_DIR/logcat.txt"
if rg -q "FATAL EXCEPTION:.*${PACKAGE}|FATAL EXCEPTION: main" "$OUT_DIR/logcat.txt"; then
  # Narrow: only fail if milerecover thread fatals
  if rg -q "Process: ${PACKAGE}" "$OUT_DIR/logcat.txt"; then
    echo "FAIL: FATAL EXCEPTION for package" | tee "$OUT_DIR/result.txt"
    exit 1
  fi
fi

# UI dump — Welcome expected on clean install
"$ADB" shell uiautomator dump /sdcard/ui-smoke.xml >/dev/null
"$ADB" pull /sdcard/ui-smoke.xml "$OUT_DIR/ui.xml" >/dev/null
"$ADB" exec-out screencap -p > "$OUT_DIR/01-welcome.png"
if ! rg -q "Welcome to MileRecover|Get started" "$OUT_DIR/ui.xml"; then
  echo "FAIL: Welcome not visible" | tee "$OUT_DIR/result.txt"
  exit 1
fi
echo "OK: Welcome visible"

# Light onboarding path to Home
OUT_DIR="$OUT_DIR" python3 - <<'PY'
import os, re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path
ADB=['adb']
OUT=Path(os.environ['OUT_DIR'])

def sh(*a, t=40):
    return subprocess.run(list(a), capture_output=True, text=True, timeout=t)

def dump():
    sh(*ADB,'shell','uiautomator','dump','/sdcard/ui-smoke.xml')
    sh(*ADB,'pull','/sdcard/ui-smoke.xml','/tmp/ui-smoke.xml')
    return ET.parse('/tmp/ui-smoke.xml').getroot()

def nodes(root):
    out=[]
    for n in root.iter('node'):
        b=n.attrib.get('bounds','')
        m=re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', b)
        if not m: continue
        x1,y1,x2,y2=map(int,m.groups())
        out.append({'text':n.attrib.get('text',''),'desc':n.attrib.get('content-desc',''),'cx':(x1+x2)//2,'cy':(y1+y2)//2,'y1':y1})
    return out

def texts():
    return [n['text'] for n in nodes(dump()) if n['text']]

def tap(label):
    ns=nodes(dump())
    cands=[n for n in ns if n['text']==label or label.lower() in (n['text']+n['desc']).lower()]
    if not cands: return False
    n=sorted(cands, key=lambda x: -x['y1'])[0]
    sh(*ADB,'shell','input','tap',str(n['cx']),str(n['cy']))
    time.sleep(4)
    return True

tap('Get started →') or tap('Get started')
time.sleep(3)
tap('Continue without an account')
time.sleep(4)
if any('Employee' in t for t in texts()):
    tap('Employee reimbursement')
    time.sleep(1)
tap('Continue →')
time.sleep(4)
tap('Continue →')
time.sleep(4)
if 'Not now' in texts():
    tap('Not now')
    time.sleep(4)
if 'Go to Home' in texts():
    tap('Go to Home')
    time.sleep(8)
t=texts()
print('AFTER_ONBOARD', t[:25])
p=subprocess.run([*ADB,'exec-out','screencap','-p'], capture_output=True, timeout=90)
(OUT/'02-home.png').write_bytes(p.stdout)
if not any(x in t for x in ['Home','Add a drive','Good morning',"You've protected"]):
    raise SystemExit('Home not visible after onboarding')
print('OK: Home visible')
PY

# Force-stop and reopen
"$ADB" shell am force-stop "$PACKAGE"
sleep 2
"$ADB" shell am start -n "$ACTIVITY"
sleep 20
pid=$("$ADB" shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r' || true)
if [[ -z "${pid:-}" ]]; then
  echo "FAIL: dead after reopen" | tee "$OUT_DIR/result.txt"
  exit 1
fi
"$ADB" exec-out screencap -p > "$OUT_DIR/03-reopen.png"
"$ADB" shell uiautomator dump /sdcard/ui-smoke.xml >/dev/null
"$ADB" pull /sdcard/ui-smoke.xml "$OUT_DIR/ui-reopen.xml" >/dev/null
if ! rg -q "Home|Good morning|You've protected|Add a drive" "$OUT_DIR/ui-reopen.xml"; then
  echo "FAIL: Home not visible after reopen" | tee "$OUT_DIR/result.txt"
  exit 1
fi

ELAPSED=$(( $(date +%s) - START_TS ))
echo "PASS alive=${alive}s reopen_ok elapsed=${ELAPSED}s" | tee "$OUT_DIR/result.txt"
exit 0
