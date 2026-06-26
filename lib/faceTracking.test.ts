import { expect, test, describe } from "bun:test";
import {
  evaluateResult,
  createTracker,
  matrixToYawPitch,
  GRACE_MS,
  RECOVER_MS,
  type FaceDetectionInput,
} from "./faceTracking";

// Build a rectangular cloud of landmarks spanning [minX,maxX]x[minY,maxY].
function box(minX: number, minY: number, maxX: number, maxY: number) {
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: maxY },
    { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
  ];
}

// A well-framed, forward-facing face centered in the frame.
const GOOD: FaceDetectionInput = {
  faceLandmarks: [box(0.32, 0.22, 0.68, 0.78)],
  facialTransformationMatrixes: [{ data: identity4x4() }],
};

function identity4x4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

describe("evaluateResult", () => {
  test("a centered, forward-facing face is ok", () => {
    const s = evaluateResult(GOOD);
    expect(s.ok).toBe(true);
    expect(s.reason).toBe("ok");
    expect(s.facePresent).toBe(true);
    expect(s.inFrame).toBe(true);
  });

  test("no landmarks => no-face", () => {
    expect(evaluateResult({ faceLandmarks: [] }).reason).toBe("no-face");
    expect(evaluateResult({ faceLandmarks: [] }).facePresent).toBe(false);
  });

  test("tiny face => too-small", () => {
    const s = evaluateResult({ faceLandmarks: [box(0.47, 0.47, 0.53, 0.53)] });
    expect(s.reason).toBe("too-small");
    expect(s.ok).toBe(false);
  });

  test("face filling the frame => cut-off (touches edges first)", () => {
    const s = evaluateResult({ faceLandmarks: [box(0.0, 0.0, 1.0, 1.0)] });
    expect(s.reason).toBe("cut-off");
  });

  test("face pushed to the edge => cut-off", () => {
    const s = evaluateResult({ faceLandmarks: [box(0.0, 0.3, 0.3, 0.7)] });
    expect(s.reason).toBe("cut-off");
  });

  test("off-center (but in frame & big enough) => off-center", () => {
    // centered at x ~0.8, well inside edges, decent size
    const s = evaluateResult({ faceLandmarks: [box(0.62, 0.3, 0.95 - 0.03, 0.7)] });
    expect(s.reason).toBe("off-center");
  });

  test("head turned => looking-away", () => {
    // ~40deg yaw rotation about Y
    const a = (40 * Math.PI) / 180;
    const c = Math.cos(a),
      s = Math.sin(a);
    // column-major: R about Y => data[0]=c, data[2]=-s, data[8]=s, data[10]=c
    const data = identity4x4();
    data[0] = c;
    data[2] = -s;
    data[8] = s;
    data[10] = c;
    const status = evaluateResult({
      faceLandmarks: [box(0.32, 0.22, 0.68, 0.78)],
      facialTransformationMatrixes: [{ data }],
    });
    expect(status.reason).toBe("looking-away");
    expect(status.lookingAway).toBe(true);
  });
});

describe("matrixToYawPitch", () => {
  test("identity => no rotation", () => {
    const { yaw, pitch } = matrixToYawPitch(identity4x4());
    expect(Math.abs(yaw)).toBeLessThan(0.001);
    expect(Math.abs(pitch)).toBeLessThan(0.001);
  });

  test("malformed matrix => zero", () => {
    expect(matrixToYawPitch([1, 0, 0])).toEqual({ yaw: 0, pitch: 0 });
  });
});

describe("createTracker (hysteresis)", () => {
  const good = evaluateResult(GOOD);
  const bad = evaluateResult({ faceLandmarks: [] });

  test("a single bad frame is suppressed by the grace period", () => {
    const t = createTracker();
    // establish ok
    t.push(good, 0);
    t.push(good, RECOVER_MS); // commits ok after RECOVER_MS
    expect(t.current().ok).toBe(true);
    // one bad frame, well within GRACE_MS
    expect(t.push(bad, RECOVER_MS + 50).ok).toBe(true);
    // recover immediately
    expect(t.push(good, RECOVER_MS + 100).ok).toBe(true);
  });

  test("a sustained bad state commits after GRACE_MS", () => {
    const t = createTracker();
    t.push(good, 0);
    t.push(good, RECOVER_MS);
    expect(t.current().ok).toBe(true);
    t.push(bad, 1000); // badSince = 1000
    expect(t.current().ok).toBe(true); // not yet
    const committed = t.push(bad, 1000 + GRACE_MS);
    expect(committed.ok).toBe(false);
    expect(committed.reason).toBe("no-face");
  });

  test("recovery requires RECOVER_MS of sustained ok", () => {
    const t = createTracker();
    // start bad (initial state is already not ok)
    t.push(bad, 0);
    expect(t.current().ok).toBe(false);
    t.push(good, 100); // goodSince = 100
    expect(t.current().ok).toBe(false); // not yet
    expect(t.push(good, 100 + RECOVER_MS).ok).toBe(true);
  });

  test("reset returns to the initial not-ok state", () => {
    const t = createTracker();
    t.push(good, 0);
    t.push(good, RECOVER_MS);
    expect(t.current().ok).toBe(true);
    t.reset();
    expect(t.current().ok).toBe(false);
    expect(t.current().reason).toBe("no-face");
  });
});
