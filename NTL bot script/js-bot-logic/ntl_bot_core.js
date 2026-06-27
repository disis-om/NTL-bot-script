/**
 * NTL bot-only extraction.
 *
 * Source basis:
 * - C:\Users\Om Rajput\Desktop\slitherport-io\ntl\main-mt.js
 * - original helper block: dA
 * - original bot controller block: tf
 *
 * This file intentionally strips:
 * - UI / overlay logic
 * - keybinds
 * - chrome extension glue
 * - jQuery / DOM access
 *
 * What remains is the bot "brain":
 * - danger detection
 * - angular occupancy map
 * - food scoring
 * - escape heading selection
 * - own-body follow / circling
 * - boost decisions
 */

const NtlBotMode = Object.freeze({
  FOOD: "food",
  EVADE: "evade",
  BODY_FOLLOW: "body_follow",
  RECENTER: "recenter",
});

const DEFAULT_CONFIG = Object.freeze({
  angleStep: Math.PI / 8,
  dangerRadiusMultiplier: 12,
  foodMinMass: 200,
  avoidBias: Math.PI / 3,
  closeThreatRadiusMultiplier: 30,
  highOccupancyRatio: 0.5,
  closeOccupancyRatio: 0.5,
  baseSpeed: 5.78,
  frontCone: Math.PI / 2,
  foodTurnTolerance: Math.PI / 2,
  circleLengthThreshold: 180,
  bodyFollowLookAhead: 5,
  bodyFollowSpacing: 3,
  bodyFollowOffset: 1.25,
  scanBoxSize: 2400,
  worldEdgeSampleStep: 8,
  worldEdgeSampleSpan: 1000,
  useBoundaryThreats: true,
  smartBodyFollow: true,
  worldCenterLeadAngle: 64,
  immediateBoostEnemyLength: 10,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sqrDistance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function normalize(vec) {
  const len = Math.hypot(vec.x, vec.y);
  return len > 0 ? { x: vec.x / len, y: vec.y / len } : { x: 0, y: 0 };
}

function wrapAngle(angle) {
  let value = angle % (Math.PI * 2);
  if (value < 0) value += Math.PI * 2;
  return value;
}

function shortestAngle(from, to) {
  let a = (to - from) % (Math.PI * 2);
  if (a < -Math.PI) a += Math.PI * 2;
  if (a > Math.PI) a -= Math.PI * 2;
  return a;
}

function makeCircle(x, y, radius) {
  return { x: Math.round(x), y: Math.round(y), radius: Math.round(radius) };
}

function computeSnakeRadius(snake) {
  return 14.6 * (snake.mass ?? 1);
}

function computeSnakeLength(snake) {
  if (typeof snake.lengthScore === "number") return snake.lengthScore;
  if (typeof snake.visualLength === "number") return snake.visualLength;
  if (Array.isArray(snake.segments)) return snake.segments.length * computeSnakeRadius(snake) * 0.5;
  return 0;
}

function quantizeAngle(angle, step) {
  const binCount = Math.max(1, Math.round((Math.PI * 2) / step));
  let idx = Math.round(wrapAngle(angle) / step);
  if (idx === binCount) idx = 0;
  return { index: idx, binCount };
}

function buildBodyPath(self) {
  const headX = self.x + (self.fx ?? 0);
  const headY = self.y + (self.fy ?? 0);
  const path = [{ x: headX, y: headY, len: 0 }];
  let total = 0;
  let prevX = headX;
  let prevY = headY;

  const segments = Array.isArray(self.segments) ? self.segments : [];
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const seg = segments[i];
    if (!seg || seg.dying) continue;
    const x = seg.x + (seg.fx ?? 0);
    const y = seg.y + (seg.fy ?? 0);
    total += Math.hypot(prevX - x, prevY - y);
    path.push({ x, y, len: total });
    prevX = x;
    prevY = y;
  }

  return { points: path, totalLength: total };
}

function samplePathAtDistance(path, distance) {
  const points = path.points;
  if (!points.length) return null;
  if (distance <= 0) return { x: points[0].x, y: points[0].y };
  if (distance >= path.totalLength) {
    const last = points[points.length - 1];
    return { x: last.x, y: last.y };
  }

  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = Math.round((lo + hi) / 2);
    if (distance > points[mid].len) lo = mid;
    else hi = mid;
  }

  const left = points[lo];
  const right = points[hi];
  const span = right.len - left.len;
  if (span <= 0) return { x: right.x, y: right.y };
  const t = (distance - left.len) / span;
  return {
    x: left.x + (right.x - left.x) * t,
    y: left.y + (right.y - left.y) * t,
  };
}

function nearestPathDistance(path, point) {
  if (path.points.length < 2) return 0;
  let bestDist2 = Number.POSITIVE_INFINITY;
  let bestLen = 0;

  for (let i = 1; i < path.points.length; i += 1) {
    const a = path.points[i - 1];
    const b = path.points[i];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = point.x - a.x;
    const apy = point.y - a.y;
    const denom = abx * abx + aby * aby || 1;
    const t = clamp((apx * abx + apy * aby) / denom, 0, 1);
    const x = a.x + abx * t;
    const y = a.y + aby * t;
    const dist2 = sqrDistance(point.x, point.y, x, y);
    if (dist2 < bestDist2) {
      bestDist2 = dist2;
      bestLen = a.len + Math.hypot(x - a.x, y - a.y);
    }
  }

  return bestLen;
}

function createRuntimeState(world, self, config) {
  const radius = computeSnakeRadius(self);
  const diameter = radius * 2;
  const speedMult = (self.speed ?? config.baseSpeed) / config.baseSpeed;
  const headCircle = makeCircle(
    self.x + Math.cos(self.heading) * Math.min(1, speedMult - 1) * config.dangerRadiusMultiplier * radius / 2,
    self.y + Math.sin(self.heading) * Math.min(1, speedMult - 1) * config.dangerRadiusMultiplier * radius / 2,
    config.dangerRadiusMultiplier * radius / 2
  );
  const scanHalf = config.scanBoxSize / 2;
  const bodyPath = buildBodyPath(self);
  const angleMeta = quantizeAngle(0, config.angleStep);

  return {
    radius,
    diameter,
    speedMult,
    headCircle,
    bodyPath,
    lengthScore: computeSnakeLength(self),
    scanRect: {
      x: self.x - scanHalf,
      y: self.y - scanHalf,
      width: config.scanBoxSize,
      height: config.scanBoxSize,
    },
    bins: new Array(angleMeta.binCount),
    threats: [],
    turnSide: 1,
    followCircleTarget: world.center && typeof world.radius === "number"
      ? {
          x: world.center.x + Math.cos(world.centerHeading ?? 0) * world.radius * 0.98,
          y: world.center.y + Math.sin(world.centerHeading ?? 0) * world.radius * 0.98,
        }
      : (world.center ?? { x: self.x, y: self.y }),
  };
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height
  );
}

function registerThreat(state, self, config, threat) {
  const dist2 = sqrDistance(self.x, self.y, threat.x, threat.y);
  const angle = angleTo(self.x, self.y, threat.x, threat.y);
  const { index } = quantizeAngle(angle, config.angleStep);
  const edgeDistance = Math.max(0, (Math.sqrt(dist2) - threat.radius) ** 2);

  const existing = state.bins[index];
  if (!existing || existing.distance > edgeDistance) {
    state.bins[index] = {
      x: Math.round(threat.x),
      y: Math.round(threat.y),
      angle,
      snakeIndex: threat.snakeIndex,
      snakeLength: threat.snakeLength ?? 0,
      distance: edgeDistance,
      radius: threat.radius,
      binIndex: index,
      isHead: !!threat.isHead,
    };
  }

  state.threats.push({
    x: threat.x,
    y: threat.y,
    radius: threat.radius,
    snakeIndex: threat.snakeIndex,
    snakeLength: threat.snakeLength ?? 0,
    distance: dist2,
    edgeDistance,
    angle,
    isHead: !!threat.isHead,
  });
}

function scanThreats(world, self, config, state) {
  state.bins.fill(undefined);
  state.threats.length = 0;

  for (let i = 0; i < world.enemySnakes.length; i += 1) {
    const enemy = world.enemySnakes[i];
    if (!enemy || enemy.id === self.id || enemy.alive === false) continue;

    const enemyRadius = computeSnakeRadius(enemy);
    const enemyLength = computeSnakeLength(enemy);
    const speedFactor = Math.min(1, (enemy.speed ?? config.baseSpeed) / config.baseSpeed - 1);
    registerThreat(state, self, config, {
      x: enemy.x + Math.cos(enemy.heading) * enemyRadius * speedFactor * config.dangerRadiusMultiplier / 2,
      y: enemy.y + Math.sin(enemy.heading) * enemyRadius * speedFactor * config.dangerRadiusMultiplier / 2,
      radius: state.headCircle.radius,
      snakeIndex: i,
      snakeLength: enemyLength,
      isHead: true,
    });

    const segments = Array.isArray(enemy.segments) ? enemy.segments : [];
    for (const seg of segments) {
      if (!seg || seg.dying) continue;
      const point = { x: seg.x, y: seg.y };
      if (!pointInRect(point, state.scanRect)) continue;
      registerThreat(state, self, config, {
        x: seg.x,
        y: seg.y,
        radius: enemyRadius,
        snakeIndex: i,
        snakeLength: enemyLength,
        isHead: false,
      });
    }
  }

  if (config.useBoundaryThreats && world.center && typeof world.radius === "number") {
    const distFromCenter = Math.hypot(self.x - world.center.x, self.y - world.center.y);
    if (distFromCenter > world.radius - 3500) {
      for (let offset = -config.worldEdgeSampleSpan; offset <= config.worldEdgeSampleSpan; offset += config.worldEdgeSampleStep) {
        const angle = (world.centerHeading ?? 0) + offset / Math.max(1, world.radius);
        registerThreat(state, self, config, {
          x: world.center.x + Math.cos(angle) * world.radius * 0.98,
          y: world.center.y + Math.sin(angle) * world.radius * 0.98,
          radius: 8,
          snakeIndex: -1,
          isHead: false,
        });
      }
    }
  }

  state.threats.sort((a, b) => a.distance - b.distance);
}

function isThreatInFront(self, config, threatAngle) {
  return Math.abs(shortestAngle(self.heading, threatAngle)) < config.frontCone;
}

function findImmediateCollision(world, self, config, state) {
  for (const threat of state.threats) {
    const combined = state.headCircle.radius + threat.radius;
    const collision = sqrDistance(state.headCircle.x, state.headCircle.y, threat.x, threat.y) < combined * combined;
    if (collision && isThreatInFront(self, config, threat.angle)) {
      return threat;
    }
  }
  return null;
}

function chooseEscapeHeading(self, config, state) {
  const openRanges = [];
  let openStart;
  let farthestOccupied = null;

  for (let i = 0; i < state.bins.length; i += 1) {
    const bin = state.bins[i];
    if (!bin) {
      if (openStart === undefined) openStart = i;
    } else {
      if (!farthestOccupied || (bin.distance < farthestOccupied.distance && bin.distance !== 0)) {
        farthestOccupied = bin;
      }
      if (openStart !== undefined) {
        openRanges.push({ start: openStart, end: i - 1 });
        openStart = undefined;
      }
    }
  }

  if (openStart !== undefined) {
    openRanges.push({ start: openStart, end: state.bins.length - 1 });
  }

  if (openRanges.length) {
    openRanges.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const best = openRanges[0];
    return wrapAngle(((best.start + best.end) * 0.5) * config.angleStep);
  }

  return farthestOccupied ? wrapAngle(farthestOccupied.binIndex * config.angleStep) : self.heading;
}

function steerAwayFromThreat(self, config, threat, state) {
  const ahead = {
    x: self.x + Math.cos(self.heading) * 2000,
    y: self.y + Math.sin(self.heading) * 2000,
  };
  const cross = (ahead.x - self.x) * (threat.y - self.y) - (ahead.y - self.y) * (threat.x - self.x);
  const targetAngle = cross > 0
    ? wrapAngle(threat.angle - config.avoidBias)
    : wrapAngle(threat.angle + config.avoidBias);

  const target = {
    x: Math.round(self.x + state.headCircle.radius * Math.cos(targetAngle)),
    y: Math.round(self.y + state.headCircle.radius * Math.sin(targetAngle)),
  };

  return {
    mode: NtlBotMode.EVADE,
    target,
    aimAngle: targetAngle,
    boost: threat.isHead && threat.snakeLength > config.immediateBoostEnemyLength,
  };
}

function selectFoodTarget(world, self, config, state) {
  let best = null;

  for (const food of world.foods) {
    if (!food || food.eaten) continue;
    const angle = angleTo(self.x, self.y, food.x, food.y);
    const delta = Math.abs(shortestAngle(self.heading, angle));
    if (delta > config.foodTurnTolerance) continue;

    const { index } = quantizeAngle(angle, config.angleStep);
    const blocked = state.bins[index];
    const dist2 = sqrDistance(self.x, self.y, food.x, food.y);
    if (blocked && blocked.distance < dist2 + state.radius * config.dangerRadiusMultiplier) continue;

    const score = (food.mass * food.mass) / Math.max(1, dist2);
    if (!best || score > best.score) {
      best = { x: food.x, y: food.y, angle, score, mass: food.mass };
    }
  }

  return best;
}

function computeThreatOccupancy(config, state) {
  const perSnake = new Map();
  let occupied = 0;
  let closeBins = 0;

  for (const bin of state.bins) {
    if (!bin) continue;
    occupied += 1;
    if (bin.snakeIndex >= 0) {
      perSnake.set(bin.snakeIndex, (perSnake.get(bin.snakeIndex) ?? 0) + 1);
    }
    if (bin.distance < (state.radius * config.closeThreatRadiusMultiplier) ** 2) {
      closeBins += 1;
    }
  }

  let dominantSnake = null;
  for (const [snakeIndex, count] of perSnake.entries()) {
    if (!dominantSnake || count > dominantSnake.count) {
      dominantSnake = { snakeIndex, count };
    }
  }

  return {
    occupiedRatio: occupied / state.bins.length,
    closeRatio: closeBins / state.bins.length,
    dominantSnake,
  };
}

function bodyFollowTarget(world, self, config, state) {
  if (state.bodyPath.points.length < 3 || state.bodyPath.totalLength < 9 * state.diameter) {
    return null;
  }

  const nearest = nearestPathDistance(state.bodyPath, { x: self.x + (self.fx ?? 0), y: self.y + (self.fy ?? 0) });
  const lookAhead = nearest + config.bodyFollowLookAhead * state.diameter;
  const behind = Math.max(0, nearest - state.diameter);
  const a = samplePathAtDistance(state.bodyPath, lookAhead);
  const b = samplePathAtDistance(state.bodyPath, behind);
  if (!a || !b) return null;

  const tangent = normalize({ x: a.x - b.x, y: a.y - b.y });
  const normal = { x: -tangent.y * state.turnSide, y: tangent.x * state.turnSide };
  const offset = state.diameter * config.bodyFollowOffset;
  const target = {
    x: Math.round(a.x + normal.x * offset),
    y: Math.round(a.y + normal.y * offset),
  };

  const safeVec = normalize({
    x: state.followCircleTarget.x - self.x,
    y: state.followCircleTarget.y - self.y,
  });
  const recentered = {
    x: Math.round(target.x * 0.75 + (self.x + safeVec.x * offset * 2) * 0.25),
    y: Math.round(target.y * 0.75 + (self.y + safeVec.y * offset * 2) * 0.25),
  };

  return {
    mode: NtlBotMode.BODY_FOLLOW,
    target: recentered,
    aimAngle: angleTo(self.x, self.y, recentered.x, recentered.y),
    boost: false,
  };
}

function defaultFallback(world, self, state) {
  const target = world.center ?? state.followCircleTarget ?? { x: self.x, y: self.y };
  return {
    mode: NtlBotMode.RECENTER,
    target,
    aimAngle: angleTo(self.x, self.y, target.x, target.y),
    boost: false,
  };
}

function mergeConfig(config) {
  return { ...DEFAULT_CONFIG, ...(config ?? {}) };
}

/**
 * Public API.
 *
 * Expected self object:
 * {
 *   id, x, y, fx, fy, heading, speed, mass,
 *   lengthScore?, alive?,
 *   segments: [{x,y,fx,fy,dying}] // original NTL/Slither order: tail -> head
 * }
 *
 * Expected world object:
 * {
 *   center?: {x,y},
 *   centerHeading?: number,
 *   radius?: number,
 *   foods: [{x,y,mass,eaten}],
 *   enemySnakes: [{id,x,y,heading,speed,mass,alive,segments:[...]}]
 * }
 */
export function updateNtlBot(world, self, config = {}) {
  const cfg = mergeConfig(config);
  const state = createRuntimeState(world, self, cfg);
  scanThreats(world, self, cfg, state);

  const immediate = findImmediateCollision(world, self, cfg, state);
  if (immediate) {
    const escape = chooseEscapeHeading(self, cfg, state);
    return {
      mode: NtlBotMode.EVADE,
      target: {
        x: Math.round(self.x + state.headCircle.radius * Math.cos(escape)),
        y: Math.round(self.y + state.headCircle.radius * Math.sin(escape)),
      },
      aimAngle: escape,
      boost: immediate.isHead,
    };
  }

  const occupancy = computeThreatOccupancy(cfg, state);
  if (occupancy.occupiedRatio > cfg.highOccupancyRatio || occupancy.closeRatio > cfg.closeOccupancyRatio) {
    const escape = chooseEscapeHeading(self, cfg, state);
    const dominantEnemy = occupancy.dominantSnake
      ? world.enemySnakes[occupancy.dominantSnake.snakeIndex]
      : null;
    return {
      mode: NtlBotMode.EVADE,
      target: {
        x: Math.round(self.x + state.headCircle.radius * Math.cos(escape)),
        y: Math.round(self.y + state.headCircle.radius * Math.sin(escape)),
      },
      aimAngle: escape,
      boost: !!(dominantEnemy && computeSnakeLength(dominantEnemy) > cfg.immediateBoostEnemyLength),
    };
  }

  if (cfg.smartBodyFollow && state.lengthScore >= cfg.circleLengthThreshold) {
    const follow = bodyFollowTarget(world, self, cfg, state);
    if (follow) return follow;
  }

  const food = selectFoodTarget(world, self, cfg, state);
  if (food && food.mass >= cfg.foodMinMass) {
    return {
      mode: NtlBotMode.FOOD,
      target: { x: Math.round(food.x), y: Math.round(food.y) },
      aimAngle: food.angle,
      boost: false,
    };
  }

  return defaultFallback(world, self, state);
}

export const NtlBotConfig = DEFAULT_CONFIG;
