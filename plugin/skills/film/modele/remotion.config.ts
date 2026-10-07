// Réglages du rendu : images JPEG pendant le rendu, sortie écrasable,
// WebGL par le GPU (ANGLE) pour les scènes en 3D.
import {Config} from '@remotion/cli/config';

Config.setRspack(true);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
