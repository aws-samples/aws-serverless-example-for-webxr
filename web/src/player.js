/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Group, Matrix4, Vector3 } from 'three';
import { System, Type } from '@lastolivegames/becsy';

import { GamepadWrapper } from 'gamepad-wrapper';
import { GlobalComponent } from './global';

// import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';

export class PlayerComponent {}

PlayerComponent.schema = {
	space: { type: Type.object },
	head: { type: Type.object },
	controllers: { type: Type.object },
};

export class PlayerSystem extends System {
	constructor() {
		super();
		this.globalEntity = this.query((q) => q.current.with(GlobalComponent));
		this.playerEntity = this.query(
			(q) => q.current.with(PlayerComponent).write,
		);
		this._vec3 = new Vector3();
	}

	_setup(global) {
		const { renderer, camera, scene } = global;
		const controllers = {};
		const playerSpace = new Group();
		playerSpace.add(camera);

		for (let i = 0; i < 2; i++) {
			const controllerGrip = renderer.xr.getControllerGrip(i);
			scene.add(controllerGrip);
			const targetRaySpace = renderer.xr.getController(i);
			targetRaySpace.addEventListener('connected', async function (event) {
				this.handedness = event.data.handedness;
				const gamepadWrapper = new GamepadWrapper(event.data.gamepad);
				controllers[event.data.handedness] = {
					targetRaySpace: targetRaySpace,
					gripSpace: controllerGrip,
					gamepadWrapper: gamepadWrapper,
				};
				playerSpace.add(targetRaySpace, controllerGrip);
			});
			targetRaySpace.addEventListener('disconnected', function () {
				delete controllers[this.handedness];
			});
			scene.add(targetRaySpace);
		}

		const playerHead = new Group();
		playerSpace.add(playerHead);

		this.createEntity(PlayerComponent, {
			space: playerSpace,
			head: playerHead,
			controllers: controllers,
		});
		scene.add(playerSpace);
	}

	execute() {
		const global = this.globalEntity.current[0].read(GlobalComponent);
		if (this.playerEntity.current.length == 0) {
			this._setup(global);
		} else {
			const player = this.playerEntity.current[0].read(PlayerComponent);
			Object.values(player.controllers).forEach((controllerObject) => {
				if (controllerObject) controllerObject.gamepadWrapper.update();
			});
			const xrManager = global.renderer.xr;
			const frame = xrManager.getFrame();
			const pose = frame?.getViewerPose(xrManager.getReferenceSpace());
			if (pose) {
				const headsetMatrix = new Matrix4().fromArray(
					pose.views[0].transform.matrix,
				);
				headsetMatrix.decompose(
					player.head.position,
					player.head.quaternion,
					this._vec3,
				);
			}
		}
	}
}
