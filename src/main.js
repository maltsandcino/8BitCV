import { k } from "./kaboomCtx"
import { scaleFactor } from "./constants";
import { dialogueData } from "./constants";
import { displayDialogue } from "./utils";
import { setCamScale } from "./utils";

//The following file is assumed to be in the public folder. As such, we don't need to give the full address
k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8},
        "idle-side": 975,
        "walk-side": {from: 975, to: 978, loop: true, speed: 8},
        "idle-up": 1014,
        "walk-up": { from: 1014, to: 1017, loop: true, speed: 8},
    },
});

k.loadSprite("map", "./map.png");
k.setBackground(k.Color.fromHex("#311047"))

// Create a scene: k.scene

k.scene("main", async () => {
    // fetch data
    const mapData = await (await fetch("./map.json")).json()
    // create a variable for layers
    const layers = mapData.layers;
    // create game object (k.make, or add immediately with k.add)
    const map = k.add([
        k.sprite("map"),
        k.pos(0),
        k.scale(scaleFactor),
    ]);

    const player = k.make([
        k.sprite("spritesheet", {anim: "idle-down"}),
        k.area({
            //Shape of hitbox
            shape: new k.Rect(k.vec2(0, 3), 10, 10),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    let visited = []

    for (const layer of layers){
        if (layer.name === "boundaries"){
            for (const boundary of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                k.body({ isStatic: true}),
                k.pos(boundary.x, boundary.y),
                boundary.name,
                ]);
                if (boundary.name) {
                    player.onCollide(boundary.name, () => {
                        if (!visited.includes(boundary.name)){
                            const topStar = document.querySelector('[class="star"]')
                            topStar.classList.add("visited")
                            topStar.title = boundary.name
                            visited.push(boundary.name)
                        }
                        player.isInDialogue = true;
                        if (boundary.name === 'JS-Desktop'){
                            const screenPos = k.toScreen(player.pos)
                            
                            const desktopOS = document.createElement("div")
                            desktopOS.innerHTML = `<div class="iframe-holder">
                                                <div class="explain">You are using the Computer. Click on the X to close the computer. <span class="closeComputer"> X </span></div>
                                                <iframe src="https://portfolios-smoky.vercel.app/" 
                                                title="Computer">
                                                </div>`
                            document.body.appendChild(desktopOS)
                            // Adding transition
                            setTimeout(() => {
                                desktopOS.classList.add("visible")
                            }, 10)
                            desktopOS.querySelector(".closeComputer").addEventListener("click", () => {
                                player.isInDialogue = false;
                                desktopOS.remove()
                            })
                        }
                        else{
                    displayDialogue(dialogueData[boundary.name], () => (player.isInDialogue = false))}
                    })
                }
            }
            continue;
        }
        if (layer.name === "spawnpoints"){
            for (const entity of layer.objects) {
                if (entity.name === "player"){
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );
                    k.add(player);
                    continue;
                }          
            }
        }             
    }
    setCamScale(k);
    k.onResize(() => {
        setCamScale(k);
    })
    k.onUpdate(() => {
                k.camPos(player.pos.x, player.pos.y);
                });
                //Handling mouse/tap movements:
                k.onMouseDown((mouseBtn) => {
                    if (mouseBtn !== "left" || player.isInDialogue) return;
                    
                    const worldMousePos = k.toWorld(k.mousePos());
                    player.moveTo(worldMousePos, player.speed);
                    
                    // Sprite travel direction logic.
                    const mouseAngle = player.pos.angle(worldMousePos)
                    const lowerBound = 50;
                    const upperBound = 125;
                    // up
                    if (mouseAngle > lowerBound &&
                        mouseAngle < upperBound &&
                        player.curAnim() !== "walk-up"
                    ){
                        player.play("walk-up");
                        player.direction = "up";
                        return;
                    }
                    // down
                    if (mouseAngle < -lowerBound &&
                        mouseAngle > -upperBound &&
                        player.curAnim() !== "walk-down"
                    ){
                        player.play("walk-down");
                        player.direction = "down";
                        return;
                    }
                    // right
                    if (Math.abs(mouseAngle) > upperBound){
                        player.flipX = false;
                        if (player.curAnim() !== "walk-side") player.play("walk-side");
                        player.direction = "right"
                        return;
                    }
                    // left
                      if (Math.abs(mouseAngle) < lowerBound){
                        player.flipX = true;
                        if (player.curAnim() !== "walk-side") player.play("walk-side");
                        player.direction = "left"
                        return;
                    }
                }
            )

                k.onMouseRelease((mouseBtn) => {
                        if (player.direction === "down"){
                            player.play("idle-down");
                            return
                        }
                        if (player.direction === "up"){
                            player.play("idle-up");
                            return;
                        }

                        player.play("idle-side");

                    })

                // handle movement with keypresses
                const moveSpeed = 200;

                k.onKeyDown((key) => {
                    switch (key) {
                        case "right":
                            if (player.isInDialogue) return;
                            player.move(moveSpeed, 0);
                            player.flipX = false;
                            if (player.curAnim() !== "walk-side") player.play("walk-side");
                            player.direction = "right";
                            break;
                        case "left":
                            if (player.isInDialogue) return;
                            player.move(-moveSpeed, 0);
                            player.flipX = true;
                            if (player.curAnim() !== "walk-side") player.play("walk-side");
                            player.direction = "left";
                            break;
                        case "up":
                            if (player.isInDialogue) return;
                            player.move(0, -moveSpeed);
                            if (player.curAnim() !== "walk-up") {
                                player.play("walk-up");
                                player.direction = "up";
                            }
                            break;
                        case "down":
                            if (player.isInDialogue) return;
                            player.move(0, moveSpeed);
                            if (player.curAnim() !== "walk-down") {
                                player.play("walk-down");
                                player.direction = "down";
                            }
                            break;
                    }
                });
                    
                k.onKeyRelease(() => {
                            if (player.direction === "down"){
                            player.play("idle-down");
                            return
                            }
                            if (player.direction === "up"){
                            player.play("idle-up");
                            return;
                            }

                            player.play("idle-side");
                            });
                        
                        
                // Initial Dialogue Box:
                player.isInDialogue = true;
                displayDialogue(dialogueData["welcome"], () => (player.isInDialogue = false))
                        })

    
// Load a specific scene with this following command.
k.go("main");