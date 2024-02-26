/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Type } from '@lastolivegames/becsy';

export class GlobalComponent {}

GlobalComponent.schema = {
	renderer: { type: Type.object },
	camera: { type: Type.object },
	scene: { type: Type.object },
	score: { type: Type.int16, default: 0 },
	gameState: { type: Type.staticString(['lobby', 'ingame']), default: 'lobby' },
};
