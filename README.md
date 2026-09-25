# Creature Lab - Dinosaur and Animal Demo

Interactive 3D viewer with six dinosaur/reptile models and six animals, named animation controls, species information, and MP4 gallery previews. Includes the T-Rex pursuit/capture scene.

## Deploy on Vercel

Import this repository with the Other framework preset and repository root as the root directory. The included vercel.json serves the files directly without installation or build steps.

## Updating

Copy the latest Creature-Lab-Demo.html export to index.html, and copy previews/*.mp4 from the source project into previews/. Commit and push both. A connected Vercel project can automatically redeploy the update.

Models, textures, scripts, and PNG posters are embedded in index.html (approximately 81.57 MiB). The twelve MP4 previews are separate files totaling approximately 159 KiB. Deploy the previews directory alongside index.html; copying only the HTML will omit motion previews.

Previews are silent H.264 videos at 360x240, 20 FPS. Hover or keyboard focus plays a preview; leaving or changing categories stops it. Reduced-motion preferences retain static posters.

The source project maintains the editable Three.js code and export scripts. This repository contains the deployable demo.
