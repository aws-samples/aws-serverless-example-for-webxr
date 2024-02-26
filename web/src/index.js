/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import './styles/index.css';
import {Amplify} from 'aws-amplify';
import amplifyConfig from './amplifyconfigure';

import { PlayerComponent, PlayerSystem } from './player';

import { FlapSystem } from './flap';
import { GameSystem } from './game';
import { GlobalComponent } from './global';
import { InlineSystem } from './landing';
import { World } from '@lastolivegames/becsy';
import { setupScene } from './scene';

Amplify.configure(amplifyConfig); 

const worldDef = {
	defs: [
		GlobalComponent,
		PlayerComponent,
		PlayerSystem,
		InlineSystem,
		FlapSystem,
		GameSystem,
	],
};

World.create(worldDef).then((world) => {
	let ecsexecuting = false;
	const { scene, camera, renderer } = setupScene();

	world.createEntity(GlobalComponent, { renderer, camera, scene });
	renderer.setAnimationLoop(function () {
		renderer.render(scene, camera);
		if (ecsexecuting == false) {
			ecsexecuting = true;
			world.execute().then(() => {
				ecsexecuting = false;
			});
		}
	});
});
