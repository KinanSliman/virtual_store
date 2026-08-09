/**
 * Analog movement input from the on-screen thumbstick, read every frame by
 * PlayerControls. A plain mutable object rather than state: the stick updates
 * many times per second and must not re-render the React tree.
 *
 * Both values are -1..1; forward is +1 when walking away from the camera.
 */
export const moveInput = { forward: 0, strafe: 0 };

export function resetMoveInput() {
  moveInput.forward = 0;
  moveInput.strafe = 0;
}
