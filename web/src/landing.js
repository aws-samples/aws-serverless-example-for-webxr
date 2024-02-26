/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GlobalComponent } from './global';
import { PlayerComponent } from './player';
import { System } from '@lastolivegames/becsy';
import { VRButton } from 'ratk';
// import { Vector3 } from 'three';

// const CAMERA_START_POSITION = new Vector3(0, 4, 34);
// const CAMERA_ROATION_AXIS = new Vector3(0, 1, 0);
// const CAMERA_ROTATION_FREQUENCY = 0.05;

export class InlineSystem extends System {
	constructor() {
		super();
		this.globalEntity = this.query((q) => q.current.with(GlobalComponent));
		this.playerEntity = this.query((q) => q.current.with(PlayerComponent));
		this.needsSetup = true;
	}

	_setupButtons(global) {
		const vrButton = document.getElementById('vr-button');
		const webLaunchButton = document.getElementById('web-launch-button');
		webLaunchButton.style.display = 'none';
		VRButton.convertToVRButton(vrButton, global.renderer, {
			optionalFeatures: ['local-floor', 'bounded-floor', 'layers'],
			onUnsupported: () => {
				vrButton.style.display = 'none';
				webLaunchButton.style.display = 'block';
			},
		});
		webLaunchButton.onclick = () => {
			window.open(
				'https://www.oculus.com/open_url/?url=' +
					encodeURIComponent(window.location.href),
			);
		};
	}

	execute() {
		const global = this.globalEntity.current[0].read(GlobalComponent);
		// const playerSpace = this.playerEntity.current[0].read(PlayerComponent)
		// 	.space;

		// const isPresenting = global.renderer.xr.isPresenting;
		// if (!isPresenting) {
		// 	playerSpace.position
		// 		.copy(CAMERA_START_POSITION)
		// 		.applyAxisAngle(
		// 			CAMERA_ROATION_AXIS,
		// 			this.time * CAMERA_ROTATION_FREQUENCY,
		// 		);
		// 	playerSpace.lookAt(new Vector3(0, playerSpace.position.y, 0));
		// 	playerSpace.rotateY(Math.PI / 2);
		// }

		if (this.needsSetup) {
			this._setupButtons(global);
			this.needsSetup = false;
			return;
		}

		// this.wasPresenting = isPresenting;
	}
}
