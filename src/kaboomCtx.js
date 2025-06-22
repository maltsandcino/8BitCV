import kaboom from "kaboom";

const k = kaboom({
    global: false,
    touchToMouse: true,
    canvas: document.getElementById("game"),

});

export { k };
