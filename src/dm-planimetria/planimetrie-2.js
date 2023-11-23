// Import Babylon.js
import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'

export function createViewer($canvas) {
    const engine = new BABYLON.Engine($canvas, true)
    const scene = new BABYLON.Scene(engine)
    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 0, -10), scene)
    camera.setTarget(BABYLON.Vector3.Zero())
    camera.attachControl($canvas, true)
    new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene)
    var ground = BABYLON.MeshBuilder.CreateGround(
        'ground1',
        {
            width: 6,
            height: 6,
            subdivisions: 2,
        },
        scene
    )
    ground.position.x = -90
    ground.position.y = 2
    ground.position.z = -20
    ground.rotation.x = -Math.PI / 2

    // Load the glTF model
    const modelPath = 'dm.gltf' // Replace with the actual path to your model
    BABYLON.SceneLoader.ImportMesh('', modelPath, '', scene, function (meshes) {
        // Scene loaded callback

        // Optionally, you can manipulate the loaded meshes here

        // Start the engine render loop
        engine.runRenderLoop(function () {
            scene.render()
        })
    })

    // Handle window resize
    window.addEventListener('resize', function () {
        engine.resize()
    })
}
