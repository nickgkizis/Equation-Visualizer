document.addEventListener('DOMContentLoaded', function () {
    const equationInput = document.getElementById('equationInput');
    const equationDisplay = document.getElementById('equationDisplay');
    const equationDropdown = document.getElementById('equationDropdown');
    const canvas = document.getElementById('equationCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const scale = 30; 
    const lineWidth = 2; 
    const pointRadius = 10;

    let isDragging = false;
    let draggingPointX = 0; 

    const tooltip = document.getElementById('tooltip');
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
        isDragging = false;
    });

    // Handle equation input
    equationInput.addEventListener('input', function () {
        const equation = equationInput.value;
        updateEquation(equation);
        plotGraph(equation);
    });

    // Handle dropdown selection
    equationDropdown.addEventListener('change', function () {
        const selectedEquation = equationDropdown.value;
        equationInput.value = selectedEquation; // Set dropdown value to input
        updateEquation(selectedEquation);
        plotGraph(selectedEquation);
    });

    function updateEquation(equation) {
        equationDisplay.innerText = `\\(${equation}\\)`;
        MathJax.typesetPromise(); 
    }

    function plotGraph(equation) {
        ctx.clearRect(0, 0, width, height); 
        drawAxes();

        if (!equation.includes('=')) return;
        const parsedEquation = parseEquation(equation);

        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = lineWidth;

        for (let x = -width / (2 * scale); x <= width / (2 * scale); x += 0.1) {
            const y = eval(parsedEquation.replace(/x/g, `(${x})`));
            const screenX = width / 2 + x * scale;
            const screenY = height / 2 - y * scale;

            if (x === -width / (2 * scale)) {
                ctx.moveTo(screenX, screenY);
            } else {
                ctx.lineTo(screenX, screenY);
            }
        }

        ctx.stroke();
    }

    function drawAxes() {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.3;

        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);

        ctx.stroke();

        ctx.font = '0px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = -width / (2 * scale); x <= width / (2 * scale); x += 1) {
            const screenX = width / 2 + x * scale;
            ctx.beginPath();
            ctx.moveTo(screenX, height / 2 - 5);
            ctx.lineTo(screenX, height / 2 + 5);
            ctx.stroke();

            if (x !== 0) {
                ctx.fillText(x, screenX, height / 2 + 20);
            }
        }

        for (let y = -height / (2 * scale); y <= height / (2 * scale); y += 1) {
            const screenY = height / 2 - y * scale;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 5, screenY);
            ctx.lineTo(width / 2 + 5, screenY);
            ctx.stroke();

            if (y !== 0) {
                ctx.fillText(y, width / 2 + 20, screenY);
            }
        }
    }

    function parseEquation(equation) {
        const [lhs, rhs] = equation.split('=');
        if (lhs.trim() !== 'y') throw new Error('Only y= equations are supported');

        let parsed = rhs
            .replace(/π/g, Math.PI)
            .replace(/e/g, Math.E)
            .replace(/\^/g, '**')
            .replace(/√/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/\|x\|/g, 'Math.abs(x)');

        return parsed;
    }

    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;

        if (isDragging) {
            const canvasX = (mouseX - width / 2) / scale;
            draggingPointX = canvasX;
            const parsedEquation = parseEquation(equationInput.value);
            const valueAtX = eval(parsedEquation.replace(/x/g, `(${canvasX})`));
            const pointY = height / 2 - valueAtX * scale;

            updateTooltip(event.clientX, event.clientY, canvasX, valueAtX);

            ctx.clearRect(0, 0, width, height);
            drawAxes();
            plotGraph(equationInput.value);

            drawRedDot(canvasX * scale + width / 2, pointY);
        } else {
            const canvasX = (mouseX - width / 2) / scale;
            const parsedEquation = parseEquation(equationInput.value);
            const valueAtX = eval(parsedEquation.replace(/x/g, `(${canvasX})`));
            const pointY = height / 2 - valueAtX * scale;

            const threshold = pointRadius;
            if (Math.abs(mouseX - (canvasX * scale + width / 2)) < threshold) {
                updateTooltip(event.clientX, event.clientY, canvasX, valueAtX);
                ctx.clearRect(0, 0, width, height);
                drawAxes();
                plotGraph(equationInput.value);
                drawRedDot(mouseX, pointY);
            } else {
                tooltip.style.display = 'none';
                ctx.clearRect(0, 0, width, height);
                drawAxes();
                plotGraph(equationInput.value);
            }
        }
    }

    function handleMouseDown(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const canvasX = (mouseX - width / 2) / scale;
        const parsedEquation = parseEquation(equationInput.value);
        const valueAtX = eval(parsedEquation.replace(/x/g, `(${canvasX})`));

        const pointY = height / 2 - valueAtX * scale;

        const distance = Math.abs(mouseY - pointY);

        if (distance <= pointRadius) {
            isDragging = true;
            draggingPointX = canvasX;
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function drawRedDot(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    function updateTooltip(clientX, clientY, x, y) {
        tooltip.innerHTML = `x: ${x.toFixed(2)}<br>y: ${y.toFixed(2)}`;
        tooltip.style.left = `${clientX + 10}px`;
        tooltip.style.top = `${clientY + 10}px`;
        tooltip.style.display = 'block';
    }

    function insertToInput(text) {
        if (text === '^' || text === '√' || text === 'log' || text === 'sin' || text === 'cos' || text === 'tan') {
            equationInput.value += text + '(';
        } else if (text === '|x|') {
            equationInput.value += '|x|';
        } else {
            equationInput.value += text;
        }
        equationInput.dispatchEvent(new Event('input'));
    }

    // Event listeners for the equation buttons
    document.getElementById('piButton').addEventListener('click', function () {
        insertToInput('π');
    });

    document.getElementById('expButton').addEventListener('click', function () {
        insertToInput('^');
    });

    document.getElementById('sqrtButton').addEventListener('click', function () {
        insertToInput('√');
    });

    document.getElementById('eButton').addEventListener('click', function () {
        insertToInput('e');
    });

    document.getElementById('logButton').addEventListener('click', function () {
        insertToInput('log');
    });

    document.getElementById('sinButton').addEventListener('click', function () {
        insertToInput('sin');
    });

    document.getElementById('cosButton').addEventListener('click', function () {
        insertToInput('cos');
    });

    document.getElementById('tanButton').addEventListener('click', function () {
        insertToInput('tan');
    });

    document.getElementById('absButton').addEventListener('click', function () {
        insertToInput('|x|');
    });

    drawAxes();
    plotGraph(equationInput.value); // Plot graph initially
});
