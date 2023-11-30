import * as THREE from "three";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformableBoundingBox } from "./bbox";

export class PlanimetriaViewer {
    constructor(el) {
        this.el = el;
        this.renderRequested = false;

        this.mountThreeCanvas();
        this.mountWidget();
    }

    mountThreeCanvas() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x282828);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 10;

        this.camera.layers.enable(0);
        this.camera.layers.enable(1);
        this.camera.layers.enable(2);

        this.cameraControls = new OrbitControls(this.camera, this.el);
        this.cameraControls.addEventListener("change", () =>
            this.requestRender()
        );

        const loader = new ColladaLoader();

        loader.load("/dm.dae", (collada) => {
            window.collada = collada;

            const dm = collada.scene.children[0];
            dm.rotation.x = -Math.PI / 2;
            const s = 0.0254; // one inch in meters
            dm.scale.set(s, s, s);
            dm.position.x = -90;
            dm.position.y = 2;
            dm.position.z = -20;
            this.scene.add(dm);

            this.requestRender();
        });

        const light = new THREE.AmbientLight(0x888888); // soft white light
        this.scene.add(light);

        // White directional light at half intensity shining from the top.
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 2, 3).normalize();
        this.scene.add(directionalLight);
    }

    setPolyline(vertices) {
        const positions = [];

        for (let i = 0; i < vertices.length; i++) {
            positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
        }

        this.polyline.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );
    }

    mountWidget() {
        // TODO: move
        // const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.25 })
        // const highlightGeometry = new THREE.BoxGeometry(1, 1, 1)
        // const highlightBox = new THREE.Mesh(highlightGeometry, highlightMaterial)

        // const controls = new TransformableBoundingBox(this.camera, this.renderer, this.cameraControls)

        // controls.addEventListener('change', () => {
        //     this.requestRender()
        // })

        // this.scene.add(controls)

        this.vertices = [];
        this.raycaster = new THREE.Raycaster();
        this.polyline = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 10 })
        );
        this.polyline.layers.set(2);
        this.cursor = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        this.scene.add(this.cursor);
        this.cursor.layers.set(2);

        window.addEventListener("pointermove", (e) => {
            const pointer = new THREE.Vector2();
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(pointer, this.camera);

            this.raycaster.layers.set(0);
            const intersections = this.raycaster.intersectObjects(
                this.scene.children,
                true
            );
            if (intersections.length > 0) {
                const intersection = intersections[0];
                this.cursor.position.copy(intersection.point);
            }

            this.requestRender();
        });

        let isStill;
        window.addEventListener("mousedown", (e) => {
            isStill = true;
            console.log("Mouse down");
        });
        window.addEventListener("mouseup", (e) => {
            if (!isStill) return;
            if (e.button !== 0) return;

            const pointer = new THREE.Vector2();
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(pointer, this.camera);

            this.raycaster.layers.set(1);
            let intersections = this.raycaster.intersectObjects(
                this.scene.children,
                true
            );

            if (intersections.length === 0) {
                this.raycaster.layers.set(0);
                intersections = this.raycaster.intersectObjects(
                    this.scene.children,
                    true
                );
            }
            if (intersections.length > 0) {
                const intersection = intersections[0];
                if (intersection.object === this.vertices[0]) {
                    let positions = this.vertices.map((m) => m.position);
                    this.setPolyline(positions);
                    console.log(positions);
                    this.vertices.forEach((v) => {
                        this.scene.remove(v);
                    });
                    this.scene.remove(this.polyline);
                    this.vertices = [];
                } else {
                    const vertex = new THREE.Mesh(
                        new THREE.SphereGeometry(0.01),
                        new THREE.MeshBasicMaterial({ color: 0xffff00 })
                    );
                    vertex.layers.set(1);
                    vertex.position.copy(intersection.point);

                    this.vertices.push(vertex);
                    this.setPolyline(this.vertices.map((m) => m.position));
                    if (
                        !this.scene.children.includes(this.polyline) &&
                        this.vertices.length > 1
                    ) {
                        this.scene.add(this.polyline);
                    }
                    this.scene.add(vertex);
                    console.log(vertex.position);
                }
            }

            this.requestRender();
        });
        window.addEventListener("mousemove", (e) => {
            isStill = false;
        });
    }

    requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true;

            requestAnimationFrame(() => {
                this.render();
                this.renderRequested = false;
            });
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        this.cameraControls.update();
    }
}
