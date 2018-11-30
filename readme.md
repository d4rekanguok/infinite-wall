# Infinite Wall

2D infinite scrolling, inspired by ifthisthendominos.com.

The idea is to be able to loop a large amount of content without sacrificing browser performance and accessibility.

Development progress: https://infinite-wall-demo.netlify.com/

### How it works

Once infinite wall is initialized on an element, it'll generate just enough children div to form a grid. These children div ('slots') will loop itself in 2 directions.

Then, content will be map & dynamically update to these slots depending on the scrolling position, creating an illusion of infinite scrolling.