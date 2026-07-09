/* eslint-disable react-hooks/immutability -- imperative camera control is the
   standard react-three-fiber pattern; the compiler is opted out below */
"use client";
"use no memo"; // r3f mutates refs in useFrame; keep the React Compiler out

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Text } from "@react-three/drei";
import * as THREE from "three";
import { playFootstep } from "@/lib/sfx";
import type { StoreProduct } from "./types";

/*
 * Store layout (top view, y up):
 *
 *          z = -12  back wall
 *   ┌──────────────────────┐
 *   │  shelf 1        shelf 2
 *   │  x=-3.5         x=3.5 │      interior: x ∈ [-8, 8]
 *   │                       │
 *   └───────┐ door ┌────────┘  z = 0   front wall
 *              🚶              z > 0   outside (camera starts here)
 */

const ROOM = { minX: -8, maxX: 8, minZ: -12, maxZ: 0, height: 4 };
const DOOR_HALF_WIDTH = 1.2;
const EYE_HEIGHT = 1.6;
const WALK_SPEED = 4;

const WALL_COLOR = "#d8cfc0";
const FLOOR_COLOR = "#b8b2a7";
const SHELF_COLOR = "#8a5a2b";

// ---------------------------------------------------------------------------
// Player: WASD/arrow movement + hold-left-mouse-drag look
// ---------------------------------------------------------------------------

const MOVE_KEYS = new Set([
  "keyw", "keya", "keys", "keyd",
  "arrowup", "arrowdown", "arrowleft", "arrowright",
]);

export function PlayerControls({
  enabled,
  doorOpen,
}: {
  enabled: boolean;
  doorOpen: boolean;
}) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const look = useRef({ yaw: 0, pitch: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const strideDistance = useRef(0);

  useEffect(() => {
    camera.rotation.order = "YXZ";
    camera.position.set(0, EYE_HEIGHT, 5);

    const down = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      if (MOVE_KEYS.has(code)) {
        keys.current.add(code);
        e.preventDefault(); // keep arrows from scrolling the page
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) dragging.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.x;
      const dy = e.clientY - dragging.current.y;
      dragging.current = { x: e.clientX, y: e.clientY };
      look.current.yaw -= dx * 0.005;
      look.current.pitch = THREE.MathUtils.clamp(
        look.current.pitch - dy * 0.005,
        -1.2,
        1.2,
      );
    };
    const onUp = () => (dragging.current = null);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    camera.rotation.y = look.current.yaw;
    camera.rotation.x = look.current.pitch;
    if (!enabled) return;

    const k = keys.current;
    let forward = 0;
    let strafe = 0;
    if (k.has("keyw") || k.has("arrowup")) forward += 1;
    if (k.has("keys") || k.has("arrowdown")) forward -= 1;
    if (k.has("keya") || k.has("arrowleft")) strafe -= 1;
    if (k.has("keyd") || k.has("arrowright")) strafe += 1;
    if (!forward && !strafe) return;

    const yaw = look.current.yaw;
    const step = WALK_SPEED * Math.min(delta, 0.05);
    const dir = new THREE.Vector3(
      (-Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * step,
      0,
      (-Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * step,
    );

    const prev = camera.position.clone();
    const next = prev.clone().add(dir);

    // overall bounds (inside room + a strip of sidewalk outside)
    next.x = THREE.MathUtils.clamp(next.x, ROOM.minX + 0.5, ROOM.maxX - 0.5);
    next.z = THREE.MathUtils.clamp(next.z, ROOM.minZ + 0.5, 8);

    // front wall: can only cross z=0 through the open doorway
    const crossesFrontWall =
      (prev.z - 0) * (next.z - 0) < 0 ||
      Math.abs(next.z) < 0.3 !== Math.abs(prev.z) < 0.3;
    if (crossesFrontWall && Math.abs(next.z) < 0.6) {
      const inDoorway = Math.abs(next.x) < DOOR_HALF_WIDTH - 0.2;
      if (!inDoorway || !doorOpen) next.z = prev.z; // bump into wall/closed door
    }

    // keep out of the two shelf units
    for (const sx of [-3.5, 3.5]) {
      if (Math.abs(next.x - sx) < 1.1 && next.z > -10.6 && next.z < -1.4) {
        next.x = prev.x;
        if (Math.abs(prev.x - sx) < 1.1 && prev.z > -10.6 && prev.z < -1.4) {
          next.z = prev.z;
        }
      }
    }

    camera.position.set(next.x, EYE_HEIGHT, next.z);

    // footsteps: one soft thud per stride actually walked
    strideDistance.current += next.distanceTo(prev);
    if (strideDistance.current > 0.85) {
      strideDistance.current = 0;
      playFootstep();
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Door: swings open on its left hinge
// ---------------------------------------------------------------------------

function Door({ open }: { open: boolean }) {
  const hinge = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!hinge.current) return;
    const target = open ? -Math.PI * 0.55 : 0;
    hinge.current.rotation.y = THREE.MathUtils.damp(
      hinge.current.rotation.y,
      target,
      3,
      delta,
    );
  });

  return (
    <group position={[-DOOR_HALF_WIDTH, 0, 0]}>
      <group ref={hinge}>
        {/* door panel, hinge at group origin */}
        <mesh position={[DOOR_HALF_WIDTH, 1.5, 0]} castShadow>
          <boxGeometry args={[DOOR_HALF_WIDTH * 2, 3, 0.08]} />
          <meshStandardMaterial color="#7a4a21" />
        </mesh>
        {/* window */}
        <mesh position={[DOOR_HALF_WIDTH, 1.9, 0]}>
          <boxGeometry args={[DOOR_HALF_WIDTH * 1.4, 1.2, 0.09]} />
          <meshStandardMaterial
            color="#bcd8e8"
            transparent
            opacity={0.55}
            roughness={0.1}
          />
        </mesh>
        {/* handle */}
        <mesh position={[DOOR_HALF_WIDTH * 1.75, 1.4, 0.1]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Room: floor, walls, ceiling, sign
// ---------------------------------------------------------------------------

function Room() {
  const wallMat = <meshStandardMaterial color={WALL_COLOR} />;
  const width = ROOM.maxX - ROOM.minX;
  const depth = ROOM.maxZ - ROOM.minZ;
  const sideOfDoor = (width / 2 - DOOR_HALF_WIDTH) / 2 + DOOR_HALF_WIDTH;

  return (
    <group>
      {/* outside ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#6f7f6a" />
      </mesh>
      {/* store floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, (ROOM.minZ + ROOM.maxZ) / 2]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, ROOM.height, (ROOM.minZ + ROOM.maxZ) / 2]}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#efe9dd" />
      </mesh>
      {/* back wall */}
      <mesh position={[0, ROOM.height / 2, ROOM.minZ]} receiveShadow>
        <boxGeometry args={[width, ROOM.height, 0.2]} />
        {wallMat}
      </mesh>
      {/* side walls */}
      <mesh position={[ROOM.minX, ROOM.height / 2, (ROOM.minZ + ROOM.maxZ) / 2]}>
        <boxGeometry args={[0.2, ROOM.height, depth]} />
        {wallMat}
      </mesh>
      <mesh position={[ROOM.maxX, ROOM.height / 2, (ROOM.minZ + ROOM.maxZ) / 2]}>
        <boxGeometry args={[0.2, ROOM.height, depth]} />
        {wallMat}
      </mesh>
      {/* front wall pieces around the doorway */}
      <mesh position={[-sideOfDoor, ROOM.height / 2, 0]}>
        <boxGeometry args={[width / 2 - DOOR_HALF_WIDTH, ROOM.height, 0.2]} />
        {wallMat}
      </mesh>
      <mesh position={[sideOfDoor, ROOM.height / 2, 0]}>
        <boxGeometry args={[width / 2 - DOOR_HALF_WIDTH, ROOM.height, 0.2]} />
        {wallMat}
      </mesh>
      {/* header above the door */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[DOOR_HALF_WIDTH * 2, 1, 0.2]} />
        {wallMat}
      </mesh>
      {/* storefront sign */}
      <Text
        position={[0, 3.45, 0.15]}
        fontSize={0.42}
        color="#1c4d2e"
        anchorX="center"
        anchorY="middle"
      >
        FRESH MART
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Shelves and products
// ---------------------------------------------------------------------------

const SHELF_LEN = 8; // along z
const SHELF_CENTER_Z = -6;
const BOARD_YS = [1.7, 1.0]; // two product boards: slots 0-2 top, 3-5 bottom

function shelfX(shelf: number) {
  return shelf === 1 ? -3.5 : 3.5;
}

/** World position + label facing for a product slot. */
function slotTransform(product: StoreProduct) {
  const x = shelfX(product.shelf);
  const boardY = BOARD_YS[product.shelfSlot < 3 ? 0 : 1];
  const z = SHELF_CENTER_Z + ((product.shelfSlot % 3) - 1) * 2.4;
  // products sit on the aisle-facing half of the board
  const faceAisle = product.shelf === 1 ? 1 : -1; // +x for left shelf
  return {
    position: [x + faceAisle * 0.25, boardY + 0.3, z] as const,
    rotationY: faceAisle === 1 ? Math.PI / 2 : -Math.PI / 2,
    faceAisle,
  };
}

function ShelfUnit({ x }: { x: number }) {
  return (
    <group position={[x, 0, SHELF_CENTER_Z]}>
      {/* uprights */}
      {[-SHELF_LEN / 2, SHELF_LEN / 2].map((z) => (
        <mesh key={z} position={[0, 1.1, z]} castShadow>
          <boxGeometry args={[0.9, 2.2, 0.08]} />
          <meshStandardMaterial color={SHELF_COLOR} />
        </mesh>
      ))}
      {/* back panel */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.06, 2.2, SHELF_LEN]} />
        <meshStandardMaterial color="#9c6b38" />
      </mesh>
      {/* boards */}
      {[...BOARD_YS, 0.3].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.06, SHELF_LEN]} />
          <meshStandardMaterial color={SHELF_COLOR} />
        </mesh>
      ))}
    </group>
  );
}

function ProductBox({
  product,
  onSelect,
}: {
  product: StoreProduct;
  onSelect: (p: StoreProduct) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { position, rotationY } = slotTransform(product);
  const soldOut = product.stock <= 0;

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  return (
    <group position={position as unknown as THREE.Vector3Tuple}>
      <mesh
        castShadow
        scale={hovered ? 1.12 : 1}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(product);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshStandardMaterial
          color={soldOut ? "#666666" : product.color}
          emissive={hovered ? product.color : "#000000"}
          emissiveIntensity={hovered ? 0.35 : 0}
        />
      </mesh>
      <Text
        position={[
          rotationY === Math.PI / 2 ? 0.4 : -0.4,
          0.02,
          0,
        ]}
        rotation={[0, rotationY, 0]}
        fontSize={0.11}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
        outlineWidth={0.008}
        outlineColor="#f5f0e6"
      >
        {`${product.name}\n$${Number(product.price).toFixed(2)}`}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene root
// ---------------------------------------------------------------------------

export function Scene({
  products,
  entered,
  onSelectProduct,
}: {
  products: StoreProduct[];
  entered: boolean;
  onSelectProduct: (p: StoreProduct) => void;
}) {
  return (
    <>
      <Sky sunPosition={[10, 12, 10]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 12, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* interior lights */}
      <pointLight position={[0, 3.5, -3]} intensity={18} color="#fff6e0" />
      <pointLight position={[0, 3.5, -9]} intensity={18} color="#fff6e0" />

      <Room />
      <Door open={entered} />
      <ShelfUnit x={shelfX(1)} />
      <ShelfUnit x={shelfX(2)} />
      {products.map((p) => (
        <ProductBox key={p.id} product={p} onSelect={onSelectProduct} />
      ))}

      <PlayerControls enabled={entered} doorOpen={entered} />
    </>
  );
}
