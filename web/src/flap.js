import { Group, Vector3 } from 'three';
import { PlayerComponent, PlayerSystem } from './player';
import { GlobalComponent } from './global';
import { System } from '@lastolivegames/becsy';
import { loadAsset } from './fetchurl';
const START_ANGULAR_SPEED = Math.PI / 25;
const GRAVITY = -9.8;
const FLAP_SPEED_MULTIPLIER = 0.1;
const RING_INTERVAL = 3;

export class FlapSystem extends System {
	constructor() {
		super();
		this.globalEntity = this.query((q) => q.current.with(GlobalComponent));
		this.playerEntity = this.query((q) => q.current.with(PlayerComponent));
		this.schedule((s) => s.after(PlayerSystem));
		this._rotator = null;
		this._vertSpeed = 0;
		this._lastFrameY = {
			left: null,
			right: null,
		};
		this._wings = {
			left: null,
			right: null,
		};
		this._vec3 = new Vector3();
		this._ringTimer = RING_INTERVAL;
	}

	_init(playerSpace, scene) {
		this._rotator = new Group();
		this._rotator.add(playerSpace);
		playerSpace.scale.setScalar(0.1);
		playerSpace.position.set(0, 4, 34);
		playerSpace.rotateY(-Math.PI / 2);
		scene.add(this._rotator);
		
		loadAsset('gltf', 'assets/wing.glb', (gltf) => {
			const rightWing = gltf.scene;
			const leftWing = rightWing.clone(true);
			leftWing.scale.set(-1, 1, 1);
			playerSpace.add(rightWing, leftWing);
			this._wings.left = leftWing;
			this._wings.right = rightWing;
		});
	}

	execute() {
		const global = this.globalEntity.current[0].read(GlobalComponent);
		const player = this.playerEntity.current[0].read(PlayerComponent);
		if (!this._rotator) {
			this._init(player.space, global.scene);
		}

		this._rotator.rotateY(START_ANGULAR_SPEED * this.delta);

		const isPresenting = global.renderer.xr.isPresenting;

		if (isPresenting) {
			let flapSpeed = 0;
			let wingAngle = 0;
			Object.entries(player.controllers).forEach(([handedness, controller]) => {
				const thisFrameY = controller.targetRaySpace.position.y;
				if (this._lastFrameY[handedness]) {
					if (thisFrameY < this._lastFrameY[handedness]) {
						flapSpeed +=
							(this._lastFrameY[handedness] - thisFrameY) / this.delta;
					}
				}
				this._lastFrameY[handedness] = thisFrameY;
				if (this._wings[handedness]) {
					this._wings[handedness].position.copy(player.head.position);
					this._wings[handedness].position.y -= 0.25;
					this._wings[handedness].lookAt(
						controller.targetRaySpace.getWorldPosition(this._vec3),
					);

					this._vec3.subVectors(
						controller.targetRaySpace.position,
						this._wings[handedness].position,
					);

					wingAngle += Math.atan(
						Math.abs(this._vec3.y) / Math.abs(this._vec3.x),
					);
				}
			});

			let gravityAdjusted = GRAVITY;
			if (wingAngle < 0.2) {
				gravityAdjusted *= 0.5;
			} else if (wingAngle < 0.5) {
				gravityAdjusted *= ((wingAngle - 0.2) / 0.3) * 0.5 + 0.5;
			}

			if (global.gameState === 'ingame') {
				this._vertSpeed +=
					gravityAdjusted * this.delta + flapSpeed * FLAP_SPEED_MULTIPLIER;

				player.space.position.y += this._vertSpeed * this.delta;

				if (player.space.position.y <= 0) {
					player.space.position.y = 0;
					this._vertSpeed = 0;
				}
			}
		} else {
			player.space.position.y = 4;
			this._vertSpeed = 0;
		}

		if (this._ring) {
			this._ringTimer -= this.delta;
			if (this._ringTimer < 0) {
				this._ringRotator.quaternion.copy(this._rotator.quaternion);
				this._ringRotator.rotateY(START_ANGULAR_SPEED * RING_INTERVAL);
				this._ring.position.y = Math.random() * 5 + 4;
				this._ring.scale.multiplyScalar(0.98);
				this._ringTimer = RING_INTERVAL;
			}
		}
	}
}
