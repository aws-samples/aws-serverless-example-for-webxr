import {
	Group,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	SRGBColorSpace,
} from 'three';

import { FlapSystem } from './flap';
import { GlobalComponent } from './global';
import { PlayerComponent } from './player';
import { System } from '@lastolivegames/becsy';
import { Text } from 'troika-three-text';
import { generateUUID } from 'three/src/math/MathUtils';
import localforage from 'localforage';
import { loadAsset } from './fetchurl'; 
import { Auth } from 'aws-amplify';
import amplifyconfig from './amplifyconfigure';

const NUM_FLAPS_TO_START_GAME = 3;
const START_ANGULAR_SPEED = Math.PI / 25;
const RING_INTERVAL = 3;
const START_RING_SCALE = 5;
const RECORD_SCORE_KEY = 'record-score';
const PLAYER_ID_KEY = 'player-id';
const API_GATEWAY_URL = amplifyconfig.Api.url;


export class GameSystem extends System {

	constructor() {
		super();
		this.SCORE_BOARD_TEXTURE;
		this.ID_TOKEN;
		this.globalEntity = this.query(
			(q) => q.current.with(GlobalComponent).write,
		);
		this.playerEntity = this.query((q) => q.current.with(PlayerComponent));
		this.schedule((s) => s.after(FlapSystem));

		this._flapData = {
			left: {
				y: null,
				distance: 0,
				flaps: 0,
			},
			right: {
				y: null,
				distance: 0,
				flaps: 0,
			},
		};
		this._ring = null;
		this._ringNumber = null;
		this._ringTimer = RING_INTERVAL;
		this._scoreBoard = null;
		this._playerId = null;
		this._record = 0;

		this._currentScore = createText(0);
		this._recordScore = createText(0);
		this._worldRecord = createText(0);
		this._ranking = createText(0);
		localforage.getItem(RECORD_SCORE_KEY).then((score) => {
			if (score) {
				this._recordScore.text = score.toString();
				this._record = score;
				this._recordScore.sync();
			}
		});
		localforage.getItem(PLAYER_ID_KEY).then((playerId) => {
			if (playerId) {
				this._playerId = playerId;
				console.log('retrieved player id', playerId);
			} else {
				this._playerId = generateUUID();
				localforage.setItem(PLAYER_ID_KEY, this._playerId);
			}
			this.getPlayerInfo();
		});
	}

	async prepare() {
			const session = await Auth.currentSession();
			this.ID_TOKEN = session.getIdToken().getJwtToken();

			
		    this.SCORE_BOARD_TEXTURE = await loadAsset('exr', 'assets/scoreboard.png');
			if (!this.SCORE_BOARD_TEXTURE){
				console.error("Assets was not loaded correctly");
				return;
			}
			console.log("score board" + this.SCORE_BOARD_TEXTURE);
            this.SCORE_BOARD_TEXTURE.colorSpace = SRGBColorSpace;
    }

	execute() {
		const global = this.globalEntity.current[0].write(GlobalComponent);
		const player = this.playerEntity.current[0].read(PlayerComponent);
		const isPresenting = global.renderer.xr.isPresenting;
		console.log("is presenting" + isPresenting);
		const rotator = player.space.parent;

		if (!this._scoreBoard) {
			this._scoreBoard = new Mesh(
				new PlaneGeometry(2, 1),
				new MeshBasicMaterial({ map: this.SCORE_BOARD_TEXTURE, transparent: true }),
			);
			player.space.add(this._scoreBoard);
			this._scoreBoard.position.set(0, 1.5, -2);

			this._scoreBoard.add(this._currentScore);
			this._currentScore.position.x = -0.15;
			this._currentScore.position.y = -0.22;

			this._scoreBoard.add(this._recordScore);
			this._recordScore.position.x = -0.15;
			this._recordScore.position.y = -0.36;

			this._scoreBoard.add(this._ranking);
			this._ranking.position.x = 0.8;
			this._ranking.position.y = -0.22;

			this._scoreBoard.add(this._worldRecord);
			this._worldRecord.position.x = 0.8;
			this._worldRecord.position.y = -0.36;
		}

		this._scoreBoard.visible = false;

		if (!this._ring && global.scene.getObjectByName('ring')) {
			this._ring = global.scene.getObjectByName('ring');
			this._ringRotator = new Group();
			this._ringRotator.add(this._ring);
			this._ring.position.set(0, 4, 34);
			this._ringRotator.quaternion.copy(rotator.quaternion);
			this._ringRotator.rotateY(START_ANGULAR_SPEED * RING_INTERVAL);
			this._ring.position.y = player.space.position.y;
			this._ring.scale.setScalar(START_RING_SCALE);
			const ringNumber = new Text();
			this._ring.add(ringNumber);
			ringNumber.text = '0';
			ringNumber.fontSize = 0.6;
			ringNumber.anchorX = 'center';
			ringNumber.anchorY = 'middle';
			ringNumber.rotateY(Math.PI);
			ringNumber.sync();
			this._ringNumber = ringNumber;
			global.scene.add(this._ringRotator);
		}

		if (global.gameState === 'lobby') {
			if (isPresenting) {
				this._scoreBoard.visible = true;
				for (let entry of Object.entries(player.controllers)) {
					const [handedness, controller] = entry;
					const thisFrameY = controller.targetRaySpace.position.y;
					const lastFrameY = this._flapData[handedness].y;
					if (lastFrameY) {
						if (thisFrameY <= lastFrameY) {
							// flapping
							this._flapData[handedness].distance += lastFrameY - thisFrameY;
						} else {
							// flap has ended
							if (this._flapData[handedness].distance >= 0.5) {
								this._flapData[handedness].flaps += 1;
							} else if (this._flapData[handedness].distance > 0.1) {
								this._flapData[handedness].flaps = 0;
							}
							this._flapData[handedness].y = null;
							this._flapData[handedness].distance = 0;
						}
					}
					this._flapData[handedness].y = thisFrameY;

					if (this._flapData[handedness].flaps >= NUM_FLAPS_TO_START_GAME) {
						global.gameState = 'ingame';
						this._ringTimer;
						this._flapData = {
							left: {
								y: null,
								distance: 0,
								flaps: 0,
							},
							right: {
								y: null,
								distance: 0,
								flaps: 0,
							},
						};
						this._ringRotator.quaternion.copy(rotator.quaternion);
						this._ringRotator.rotateY(START_ANGULAR_SPEED * RING_INTERVAL);
						this._ring.position.y = 4;
						this._ring.scale.setScalar(START_RING_SCALE);
						this._ringTimer = RING_INTERVAL;
						this._ringNumber.text = '1';
						this._ringNumber.sync();
						break;
					}
				}
			}
		} else {
			if (this._ring) {
				this._ringTimer -= this.delta;
				if (this._ringTimer < 0) {
					const ringRadius = this._ring.scale.x / 2;
					if (
						Math.abs(player.space.position.y - this._ring.position.y) <
						ringRadius
					) {
						global.score += 1;
						this._ringNumber.text = (global.score + 1).toString();
						this._ringNumber.sync();
						this._ringRotator.quaternion.copy(rotator.quaternion);
						this._ringRotator.rotateY(START_ANGULAR_SPEED * RING_INTERVAL);
						this._ring.position.y = Math.random() * 5 + 4;
						this._ring.scale.multiplyScalar(0.98);
						this._ringTimer = RING_INTERVAL;
					} else {
						this._currentScore.text = global.score.toString();
						this._currentScore.sync();
						if (global.score > this._record) {
							console.log('best score updated:', global.score);
							this._record = global.score;
							this._recordScore.text = global.score.toString();
							this._recordScore.sync();
							localforage.setItem(RECORD_SCORE_KEY, this._record);
							// Send best score to server
							this.postPlayerRecord().then(()=>{
								// Delay for .5 second due to eventually consistent read
								setTimeout(()=>{
									this.getPlayerInfo();
								}, 100);
							});
						} else {
							this.getPlayerInfo();
						}
						global.gameState = 'lobby';
						global.score = 0;
						player.space.position.y = 4;
					}
				}
			}
		}
	}

	getPlayerInfo() {
		return fetch(`${API_GATEWAY_URL}leaderboard/${this._playerId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.ID_TOKEN}`
			}
		})
		.then(response => response.text())
		.then(data => {
			const parsedData = JSON.parse(data);
			this._worldRecord.text = parsedData.worldRecord;
			this._worldRecord.sync();
			this._ranking.text = parsedData.ranking;
			this._ranking.sync();
		})
		.catch(err => {
			console.log(err);
		});
	}

	postPlayerRecord() {
		const body = JSON.stringify({
			playerId: this._playerId,
			score: this._record
		});
		console.log(body);
		return fetch(`${API_GATEWAY_URL}/leaderboard`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.ID_TOKEN}`
			},
			body: body
		})
		.then(response => response.text())
		.then(data => {
			console.log(data);
		})
		.catch(err => {
			console.log(err);
		});
	}
}


const createText = (defaultValue) => {
	const text = new Text();
	text.text = defaultValue.toString();
	text.fontSize = 0.12;
	text.anchorX = 'center';
	text.anchorY = 'middle';
	text.sync();
	text.position.z = 0.001;
	return text;
};

