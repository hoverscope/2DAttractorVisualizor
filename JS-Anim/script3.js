// Define global variables
let animInstance;
let ctx;
let canvas;
let animEffect;

let currentPlane = 'xy';  // Default to XY plane


window.onload = function () {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const numPointsInput = document.getElementById('numPoints');
    const pointCountDisplay = document.getElementById('pointCountDisplay');

    // Display the initial number of points
    pointCountDisplay.textContent = `Number of Points: ${numPointsInput.value}`;

    // Initialize the animation effect
    animEffect = new Effect(ctx, canvas.width, canvas.height, numPointsInput.value);
    animEffect.animate();

    // Update the point count display when the slider value changes
    numPointsInput.addEventListener('input', function () {
        pointCountDisplay.textContent = `Number of Points: ${numPointsInput.value}`;
    });

    // Start animation button
    document.getElementById('startButton').addEventListener('click', function() {
        // Stop any existing animation
        if (animInstance) {
            cancelAnimationFrame(animInstance);
        }

        // Get the state of the enable checkbox
        const isEnabled = enableCheckbox.checked;

        // Retrieve color values selected by the user
        const color1 = document.getElementById('color1').value;
        const color2 = document.getElementById('color2').value;
        const color3 = document.getElementById('color3').value;

        // Log the color values to the console
        console.log('color1:', color1); // Check the value
        console.log('color2:', color2); // Check the value
        console.log('color3:', color3); // Check the value

        // Create a new Effect instance with the user's color choices
        animEffect = new Effect(ctx, canvas.width, canvas.height, numPointsInput.value, 
            isEnabled ? dxdtInput.value : undefined, 
            isEnabled ? dydtInput.value : undefined, 
            isEnabled ? dzdtInput.value : undefined,
            color1, color2, color3); // Pass the colors here

        animEffect.animate();  // Start the new animation
    });
}


// Window resize response
window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear the existing animation
    if (animInstance) {
        cancelAnimationFrame(animInstance);
    }

    // Initialize the animation effect with the current number of points
    const numPoints = document.getElementById("numPoints").value;
    animEffect = new Effect(ctx, canvas.width, canvas.height, numPoints);
    animEffect.animate();
});



document.querySelectorAll('input[name="plane"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentPlane = e.target.value;
        
        // Stop the current animation
        if (animInstance) {
            cancelAnimationFrame(animInstance);
        }

        // Start a new animation with the updated plane
        const numPoints = document.getElementById("numPoints").value;

        animEffect = new Effect(ctx, canvas.width, canvas.height, numPoints);
        animEffect.animate();
    });
});



// Expression input elements
const expressionInputs = document.getElementById('expressionInputs');
const dxdtInput = document.getElementById('dxdt');
const dydtInput = document.getElementById('dydt');
const dzdtInput = document.getElementById('dzdt');
const enableCheckbox = document.getElementById('enableExpressions');



// Event listener for the checkbox
enableCheckbox.addEventListener('change', () => {
    const isChecked = enableCheckbox.checked;
    dxdtInput.disabled = !isChecked;
    dydtInput.disabled = !isChecked;
    dzdtInput.disabled = !isChecked;

    if (isChecked) {
        // Update formulas only when checkbox is checked
        animEffect.dxdtFormula = dxdtInput.value;
        animEffect.dydtFormula = dydtInput.value;
        animEffect.dzdtFormula = dzdtInput.value;
        console.log("Formulas updated:");
        console.log("dx/dt:", animEffect.dxdtFormula);
        console.log("dy/dt:", animEffect.dydtFormula);
        console.log("dz/dt:", animEffect.dzdtFormula);
    } else {
        // Restore default formulas when disabled
        animEffect.dxdtFormula = "y * z"; 
        animEffect.dydtFormula = "x - y"; 
        animEffect.dzdtFormula = "1 - x ** 2"; 
        console.log("Formulas reset to default:");
        console.log("dx/dt:", animEffect.dxdtFormula);
        console.log("dy/dt:", animEffect.dydtFormula);
        console.log("dz/dt:", animEffect.dzdtFormula);
    }
});


// Function to interpolate between two colors
function interpolateColor(color1, color2, factor) {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

// Convert hex color to RGB array
function hexToRgb(hex) {
    const bigint = parseInt(hex.substring(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Function to interpolate between 3 colors
function interpolateBetweenThreeColors(color1, color2, color3, factor) {
    if (factor < 0.5) {
        return interpolateColor(color1, color2, factor * 2);
    } else {
        return interpolateColor(color2, color3, (factor - 0.5) * 2);
    }
}



class Point {
    constructor(x, y, z, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = color; // Store random color
        this.trail = [];    // To store trail points
    }
}

class Effect {
    #ctx;
    #width;
    #height;
    points = [];
    dt = 0.005; // Smaller time step for smoother curves
    a = 0.44; // Default constant 'a'
    b = 1.1;
    c =1.0;

    
    constructor(ctx, width, height, numPoints, a, b, c, color1, color2, color3) {
        this.#ctx = ctx;
        this.#height = height;
        this.#width = width;
    
        this.a = a || 0.44;  
        this.b = b || 1.1;   
        this.c = c || 1.0;   
    
        this.color1 = color1 || "#99ccff"; 
        this.color2 = color2 || "#3399ff"; 
        this.color3 = color3 || "#0033cc"; 
    
        this.points = [];
        for (let i = 0; i < numPoints; i++) {
            const x = (Math.random() * 2 - 1) * 0.2; // Random between -0.2 and 0.2
            const y = (Math.random() * 2 - 1) * 0.2; // Random between -0.2 and 0.2
            const z = (Math.random() * 2 - 1) * 0.2; // Random between -0.2 and 0.2
            const colorFactor = Math.random();
            const randomColor = interpolateBetweenThreeColors(
                hexToRgb(this.color1),
                hexToRgb(this.color2),
                hexToRgb(this.color3),
                colorFactor
            );
            this.points.push(new Point(x, y, z, `rgb(${randomColor.join(',')})`)); // Assign random color
        }
    }
    
    
    
    // Calculate new coordinates based on Genesio-Tesi attractor equations
    #calculateCoordinates(point) {
        // Genesio-Tesi differential equations
        const dxdt = point.y;
        const dydt = point.z;
        const dzdt = -this.c * point.x - this.b * point.y - this.a * point.z + point.x ** 2;
    
        // Update state variables using Euler's method
        point.x += dxdt * this.dt;
        point.y += dydt * this.dt;
        point.z += dzdt * this.dt;
    
        return { x: point.x, y: point.y, z: point.z };
    }
    
    #draw() {
        // Set the trail effect to make it darker
        this.#ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        this.#ctx.fillRect(0, 0, this.#width, this.#height);

        // Loop over all points and update their positions
        for (let point of this.points) {
            const coordinates = this.#calculateCoordinates(point);


            let plotX, plotY;
            const scaleFactor = 1000; // Distance from the center to screen coordinates

            if (currentPlane === 'xy') {
                plotX = this.#width / 2 + coordinates.x * scaleFactor;
                plotY = this.#height / 2 - coordinates.y * scaleFactor;
            } else if (currentPlane === 'xz') {
                plotX = this.#width / 2 + coordinates.x * scaleFactor;
                plotY = this.#height / 2 - coordinates.z * scaleFactor;
            } else if (currentPlane === 'yz') {
                plotX = this.#width / 2 + coordinates.y * scaleFactor;
                plotY = this.#height / 2 - coordinates.z * scaleFactor;
            }
            // Store the current point in the trail
            point.trail.push({ x: plotX, y: plotY });

            // Limit the trail length
            if (point.trail.length > 200) {
                point.trail.shift();
            }

            // Draw the trail for each point
            for (let i = 1; i < point.trail.length; i++) {
                const pointA = point.trail[i - 1];
                const pointB = point.trail[i];

                if (isFinite(pointA.x) && isFinite(pointA.y) && isFinite(pointB.x) && isFinite(pointB.y)) {
                    const gradient = this.#ctx.createLinearGradient(pointA.x, pointA.y, pointB.x, pointB.y);
                    gradient.addColorStop(0, point.color);
                    gradient.addColorStop(1, this.color3);

                    this.#ctx.beginPath();
                    this.#ctx.moveTo(pointA.x, pointA.y);
                    this.#ctx.lineTo(pointB.x, pointB.y);
                    this.#ctx.lineWidth = 2;

                    const opacity = i / point.trail.length;
                    const color1 = hexToRgb(this.color1);
                    const color3 = hexToRgb(this.color3);

                    this.#ctx.strokeStyle = `rgba(${Math.floor(color1[0] * (1 - opacity) + color3[0] * opacity)}, ${Math.floor(color1[1] * (1 - opacity) + color3[1] * opacity)}, ${Math.floor(color1[2] * (1 - opacity) + color3[2] * opacity)}, ${opacity})`;
                    
                    this.#ctx.stroke();
                } else {
                    console.error('Non-finite coordinates detected, stopping animation.');
                    cancelAnimationFrame(animInstance);
                    return;
                }
            }

            // Draw a circle at the current point location
            this.#ctx.beginPath();
            this.#ctx.arc(plotX, plotY, 2, 0, Math.PI * 2);
            this.#ctx.fillStyle = point.color;
            this.#ctx.fill();
        }
    }
    
    animate() {
        this.#draw();
        animInstance = requestAnimationFrame(this.animate.bind(this));
    }
}

