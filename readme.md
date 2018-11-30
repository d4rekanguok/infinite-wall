# Infinite Wall

2D infinite scrolling, inspired by [Domino + ITTT site](ifthisthendominos.com).
![example video](./assets/ifthisthendominos.mp4)

The idea is to be able to loop a large amount of content without sacrificing browser performance and accessibility.

Package in development. [See demo progress here](https://infinite-wall-demo.netlify.com)

---

## How it works

Once infinite wall is initialized on an element, it'll generate just enough amount of children elements that will fill up the container element completely & form a grid with `transform: translate(...)`.

These children elements ('slots') will loop itself in 2 directions. When an edge element is out of view, its position will be translated to the opposite side of the grid.

At the same time, the root cordination of the grid is looped (`root = scrollDistance % maxContent`). The loop count is tracked & used to place content into slot.

Then, content will be map & dynamically update to these slots depending on the scrolling position, creating an illusion of infinite scrolling.