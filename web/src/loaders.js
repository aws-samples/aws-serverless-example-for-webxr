//loader.js 
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const LOADERS = {
    'gltf': new GLTFLoader(),
    'exr': new THREE.TextureLoader(),
};