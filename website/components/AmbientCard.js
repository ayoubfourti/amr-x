"use client";

import { useEffect, useRef, useState } from "react";

const stationPairs = [
  ["A", "B"],
  ["C", "D"],
  ["E", "F"],
  ["G", "H"],
];

const grid = {
  columns: 9,
  rows: 5,
  x: 55,
  y: 62,
  xStep: 50,
  yStep: 37,
};

const initialMission = {
  id: 0,
  pairIndex: 0,
  stations: stationPairs[0],
  from: [55, 210],
  to: [455, 62],
  path: "M55 210 H105 V173 H205 V136 H305 V99 H405 V62 H455",
  backgroundPaths: [
    "M55 210 V173 H155 V136 H255 V99 H355 V62 H455",
    "M55 210 H105 V173 H205 V136 H305 V99 H455 V62",
  ],
  obstacles: [[2, 4], [4, 3], [6, 2], [1, 0], [3, 1], [5, 4], [7, 3]],
  people: [
    { from: [155, 136], crossing: [205, 136], duration: 6.2 },
    { from: [355, 62], crossing: [355, 99], duration: 7.4 },
  ],
};

function randomBetween(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function cellKey([column, row]) {
  return `${column},${row}`;
}

function cellPoint([column, row]) {
  return [grid.x + column * grid.xStep, grid.y + row * grid.yStep];
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomBetween(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function planRoute(start, goal, obstacles) {
  const blocked = new Set(obstacles.map(cellKey));
  const startKey = cellKey(start);
  const goalKey = cellKey(goal);
  const queue = [start];
  const visited = new Set([startKey]);
  const parent = new Map();
  const directions = shuffled([[1, 0], [0, -1], [0, 1], [-1, 0]]);

  while (queue.length) {
    const current = queue.shift();
    const currentKey = cellKey(current);
    if (currentKey === goalKey) break;

    for (const [columnStep, rowStep] of directions) {
      const next = [current[0] + columnStep, current[1] + rowStep];
      const nextKey = cellKey(next);
      const isInside = next[0] >= 0 && next[0] < grid.columns && next[1] >= 0 && next[1] < grid.rows;
      if (!isInside || blocked.has(nextKey) || visited.has(nextKey)) continue;
      visited.add(nextKey);
      parent.set(nextKey, currentKey);
      queue.push(next);
    }
  }

  if (!visited.has(goalKey)) return null;

  const route = [];
  let key = goalKey;
  while (key) {
    route.unshift(key.split(",").map(Number));
    if (key === startKey) break;
    key = parent.get(key);
  }
  return route;
}

function routeToPath(route) {
  const [startX, startY] = cellPoint(route[0]);
  return route.slice(1).reduce((path, cell, index) => {
    const [x, y] = cellPoint(cell);
    const previous = route[index];
    return `${path}${cell[1] === previous[1] ? ` H${x}` : ` V${y}`}`;
  }, `M${startX} ${startY}`);
}

function createObstacles(start, goal) {
  const excluded = new Set([cellKey(start), cellKey(goal)]);
  const obstacles = [];
  const count = randomBetween(6, 9);

  while (obstacles.length < count) {
    const cell = [randomBetween(1, grid.columns - 2), randomBetween(0, grid.rows - 1)];
    const key = cellKey(cell);
    if (excluded.has(key)) continue;
    excluded.add(key);
    obstacles.push(cell);
  }
  return obstacles;
}

function createMovingPeople(route, obstacles) {
  const blocked = new Set(obstacles.map(cellKey));
  const routeCells = new Set(route.map(cellKey));
  const occupied = new Set();
  const movements = [];
  const candidates = shuffled(Array.from({ length: grid.columns - 2 }, (_, column) => (
    Array.from({ length: grid.rows }, (_, row) => [column + 1, row])
  )).flat());

  for (const from of candidates) {
    if (movements.length === 2) break;
    if (blocked.has(cellKey(from)) || routeCells.has(cellKey(from)) || occupied.has(cellKey(from))) continue;
    const destinations = shuffled([[1, 0], [-1, 0], [0, 1], [0, -1]])
      .map(([columnStep, rowStep]) => [from[0] + columnStep, from[1] + rowStep]);
    const to = destinations.find((cell) => (
      cell[0] > 0
      && cell[0] < grid.columns - 1
      && cell[1] >= 0
      && cell[1] < grid.rows
      && routeCells.has(cellKey(cell))
      && !blocked.has(cellKey(cell))
      && !occupied.has(cellKey(cell))
    ));
    if (!to) continue;

    occupied.add(cellKey(from));
    occupied.add(cellKey(to));
    const [fromX, fromY] = cellPoint(from);
    const [toX, toY] = cellPoint(to);
    movements.push({
      from: [fromX, fromY],
      crossing: [toX, toY],
      duration: randomBetween(52, 78) / 10,
    });
  }
  return movements;
}

function createMission(id, previousPairIndex) {
  const pairOffset = randomBetween(1, stationPairs.length - 1);
  const pairIndex = (previousPairIndex + pairOffset) % stationPairs.length;
  const start = [0, randomBetween(0, grid.rows - 1)];
  const goal = [grid.columns - 1, randomBetween(0, grid.rows - 1)];
  let obstacles;
  let route;

  for (let attempt = 0; attempt < 12 && !route; attempt += 1) {
    obstacles = createObstacles(start, goal);
    route = planRoute(start, goal, obstacles);
  }

  // A sparse fallback still keeps obstacles visible in the unlikely event that
  // every random arrangement blocks the map from edge to edge.
  if (!route) obstacles = [[2, (start[1] + 2) % grid.rows], [5, (goal[1] + 3) % grid.rows]];
  route ||= planRoute(start, goal, obstacles);

  const backgroundRoutes = Array.from({ length: 2 }, () => planRoute(start, goal, obstacles));
  const people = createMovingPeople(route, obstacles);

  return {
    id,
    pairIndex,
    stations: stationPairs[pairIndex],
    from: cellPoint(start),
    to: cellPoint(goal),
    path: routeToPath(route),
    backgroundPaths: backgroundRoutes.map(routeToPath),
    obstacles,
    people,
  };
}

export default function AmbientCard({ children }) {
  const [mission, setMission] = useState(initialMission);
  const [receiving, setReceiving] = useState(false);
  const [robotWaiting, setRobotWaiting] = useState(false);
  const [pointerPulses, setPointerPulses] = useState([]);
  const transferTimer = useRef(null);
  const pulseId = useRef(0);
  const lastTrailPulse = useRef(0);
  const routePathRef = useRef(null);
  const robotRef = useRef(null);
  const peopleRefs = useRef([]);
  const [fromLabel, toLabel] = mission.stations;

  useEffect(() => () => window.clearTimeout(transferTimer.current), []);

  useEffect(() => {
    if (receiving) return undefined;
    const path = routePathRef.current;
    const robot = robotRef.current;
    if (!path || !robot) return undefined;

    const pathLength = path.getTotalLength();
    const speed = pathLength / 7000;
    const crossingDistances = mission.people.map(({ crossing }) => {
      let closestDistance = 0;
      let closestGap = Number.POSITIVE_INFINITY;
      for (let sample = 0; sample <= pathLength; sample += 2) {
        const point = path.getPointAtLength(sample);
        const gap = Math.hypot(point.x - crossing[0], point.y - crossing[1]);
        if (gap < closestGap) {
          closestGap = gap;
          closestDistance = sample;
        }
      }
      return closestDistance;
    });
    let distance = 0;
    let lastFrame = performance.now();
    let frameId;
    let wasWaiting = false;
    let blockingPedestrian = null;
    const pedestrianTimes = mission.people.map(() => 0);

    function animateRobot(now) {
      const delta = Math.min(now - lastFrame, 50);
      lastFrame = now;
      const stoppingDistance = 72;
      const passedClearance = 48;
      const pedestrianStates = mission.people.map((person, index) => {
        const cycle = person.duration * 1000;
        const phase = pedestrianTimes[index] / cycle;
        const progress = phase <= .5 ? phase * 2 : (1 - phase) * 2;
        const distanceToCrossing = crossingDistances[index] - distance;
        const robotOwnsCrossing = distanceToCrossing >= -passedClearance && distanceToCrossing <= stoppingDistance;
        const waitingAtSafeSide = progress < .001 && robotOwnsCrossing;

        if (!waitingAtSafeSide) {
          const nextTime = pedestrianTimes[index] + delta;
          pedestrianTimes[index] = nextTime >= cycle ? 0 : nextTime;
        }

        const nextPhase = pedestrianTimes[index] / cycle;
        const nextProgress = nextPhase <= .5 ? nextPhase * 2 : (1 - nextPhase) * 2;
        const x = person.from[0] + (person.crossing[0] - person.from[0]) * nextProgress;
        const y = person.from[1] + (person.crossing[1] - person.from[1]) * nextProgress;
        peopleRefs.current[index]?.setAttribute("transform", `translate(${x} ${y})`);
        return { progress: nextProgress };
      });

      if (blockingPedestrian === null) {
        blockingPedestrian = pedestrianStates.findIndex(({ progress }, index) => {
          const routeDistanceToCrossing = crossingDistances[index] - distance;
          return routeDistanceToCrossing >= 0
            && routeDistanceToCrossing <= stoppingDistance
            && progress > .001;
        });
        if (blockingPedestrian < 0) blockingPedestrian = null;
      }

      let pedestrianAhead = blockingPedestrian !== null;
      if (blockingPedestrian !== null) {
        const state = pedestrianStates[blockingPedestrian];
        if (!state) {
          blockingPedestrian = null;
          pedestrianAhead = false;
        } else if (state.progress < .001) {
          blockingPedestrian = null;
          pedestrianAhead = false;
        }
      }

      if (!pedestrianAhead) distance = (distance + speed * delta) % pathLength;
      if (pedestrianAhead !== wasWaiting) {
        wasWaiting = pedestrianAhead;
        setRobotWaiting(pedestrianAhead);
      }

      const renderPoint = path.getPointAtLength(distance);
      const nextPoint = path.getPointAtLength(Math.min(distance + 1, pathLength));
      const angle = Math.atan2(nextPoint.y - renderPoint.y, nextPoint.x - renderPoint.x) * 180 / Math.PI;
      robot.setAttribute("transform", `translate(${renderPoint.x} ${renderPoint.y}) rotate(${angle})`);
      frameId = requestAnimationFrame(animateRobot);
    }

    frameId = requestAnimationFrame(animateRobot);
    return () => cancelAnimationFrame(frameId);
  }, [mission.id, receiving]);

  function addPointerPulse(event, type = "trail") {
    if (!event.clientX && !event.clientY) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pulse = {
      id: pulseId.current += 1,
      type,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    setPointerPulses((current) => [...current.slice(-5), pulse]);
  }

  function handlePointerMove(event) {
    if (event.pointerType === "touch") return;
    const now = performance.now();
    if (now - lastTrailPulse.current < 130) return;
    lastTrailPulse.current = now;
    addPointerPulse(event);
  }

  function startNewMission(event) {
    addPointerPulse(event, "click");
    window.clearTimeout(transferTimer.current);
    setReceiving(true);
    setRobotWaiting(false);
    transferTimer.current = window.setTimeout(() => {
      setMission((current) => createMission(current.id + 1, current.pairIndex));
      setReceiving(false);
    }, 1250);
  }

  return (
    <section className={`ctaSection${receiving ? " receiving" : ""}`} onClick={startNewMission} onPointerMove={handlePointerMove}>
      <span className="ctaAtmosphere" aria-hidden="true" />
      <span className="ctaPointerEffects" aria-hidden="true">
        {pointerPulses.map((pulse) => (
          <span
            className={`ctaPointerPulse ${pulse.type}`}
            key={pulse.id}
            onAnimationEnd={() => setPointerPulses((current) => current.filter(({ id }) => id !== pulse.id))}
            style={{ left: pulse.x, top: pulse.y }}
          />
        ))}
      </span>
      <span className="ctaRoute">
        <span className="ctaMissionMeta">
          <span className="ctaMissionTitle">Mission</span>
          {receiving && (
            <span className="ctaMissionTransfer" aria-hidden="true">
              <svg viewBox="0 0 80 68">
                <path d="M8 25 Q40 -4 72 25" />
                <path d="M19 37 Q40 17 61 37" />
                <path d="M30 49 Q40 39 50 49" />
                <circle cx="40" cy="58" r="4" />
              </svg>
              <strong>Sending &amp; receiving data</strong>
            </span>
          )}
          {robotWaiting && <span className="ctaRobotStatus"><i />Yielding to pedestrian</span>}
        </span>
        <span className="srOnly" aria-live="polite">{receiving ? "Sending and receiving mission data" : robotWaiting ? "Yielding to pedestrian" : `Mission ${fromLabel} to ${toLabel}`}</span>
        <svg aria-hidden="true" viewBox="0 0 500 260">
          {mission.backgroundPaths.map((path, index) => <path className="ctaMapPath" d={path} key={`${mission.id}-background-${index}`} />)}
          <path className="ctaMapPath active" d={mission.path} ref={routePathRef} />
          <g className="ctaObstacles" key={`obstacles-${mission.id}`}>
            {mission.obstacles.map((cell, index) => {
              const [x, y] = cellPoint(cell);
              return (
                <g transform={`translate(${x} ${y})`} key={cellKey(cell)}>
                  <g className="ctaObstacle" style={{ "--obstacle-delay": `${index * 55}ms` }}>
                    <rect className="ctaObstacleBody" x="-15" y="-13" width="30" height="26" rx="4" />
                    <path className="ctaObstacleMark" d="M-9 -7 H9 M-9 0 H9 M-9 7 H9" />
                  </g>
                </g>
              );
            })}
          </g>
          <g className="ctaStation">
            <circle cx={mission.from[0]} cy={mission.from[1]} r="17" />
            <circle className="pulse" cx={mission.from[0]} cy={mission.from[1]} r="23" />
            <text x={mission.from[0]} y={mission.from[1]}>{fromLabel}</text>
          </g>
          <g className="ctaStation">
            <circle cx={mission.to[0]} cy={mission.to[1]} r="17" />
            <circle className="pulse" cx={mission.to[0]} cy={mission.to[1]} r="23" />
            <text x={mission.to[0]} y={mission.to[1]}>{toLabel}</text>
          </g>
          {!receiving && (
            <g className={`ctaRobotMotion${robotWaiting ? " waiting" : ""}`} key={mission.id} ref={robotRef}>
              <g transform="rotate(90)">
                <rect className="ctaRobotWheel" x="-14" y="-15" width="5" height="10" rx="2" />
                <rect className="ctaRobotWheel" x="9" y="-15" width="5" height="10" rx="2" />
                <rect className="ctaRobotWheel" x="-14" y="6" width="5" height="10" rx="2" />
                <rect className="ctaRobotWheel" x="9" y="6" width="5" height="10" rx="2" />
                <rect className="ctaRobotBody" x="-10" y="-20" width="20" height="40" rx="6" />
                <rect className="ctaRobotDeck" x="-6" y="-13" width="12" height="25" rx="2" />
                <circle className="ctaRobotSensor" cx="0" cy="-14" r="2.6" />
              </g>
            </g>
          )}
          <g className="ctaPeople" key={`people-${mission.id}`}>
            {mission.people.map((person, index) => (
              <g className="ctaPersonMotion" key={`${person.from.join("-")}-${index}`} ref={(node) => { peopleRefs.current[index] = node; }} transform={`translate(${person.from[0]} ${person.from[1]})`}>
                <g className="ctaPersonFigure">
                  <circle className="ctaPersonHead" cx="0" cy="-7" r="3.5" />
                  <path className="ctaPersonBody" d="M0 -3 V6 M-6 1 L0 -1 L6 2 M0 6 L-5 13 M0 6 L5 13" />
                </g>
              </g>
            ))}
          </g>
        </svg>
      </span>
      {children}
    </section>
  );
}
