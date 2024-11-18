let cursorImage;
let moveableObject;
let magneticParticles = [];
let mouseForce;

const k = 5000; // Magnetic constant
const restitution = 0.5; // Coefficient of restitution
const chargeStrength = 2; // Force strength for each charge in the maze
const mazeSpacing = 100; // Distance between charges in the maze

class MoveableObject {
  constructor(x, y, charge, mass) {
    this.position = createVector(x, y); // Position of the object
    this.velocity = createVector(0, 0); // Velocity of the object
    this.acceleration = createVector(0, 0); // Acceleration of the object
    this.charge = charge; // Charge of the moving object
    this.mass = mass; // Mass of the moving object
    this.dragCoefficient = 0.05; // Coefficient of friction
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass); // Force = mass * acceleration
    this.acceleration.add(f);
  }

  applyDrag() {
    if (this.velocity.mag() > 0) {
      let drag = this.velocity.copy();
      drag.normalize(); // Unit vector
      drag.mult(-1); // Reverse direction
      drag.mult(this.dragCoefficient * this.velocity.magSq()); // Drag = -c * |v|^2
      this.applyForce(drag);
    }
  }

  update() {
    this.applyDrag(); // Apply drag
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0); // Reset acceleration
  }

  checkCollision(magneticParticle, restitution) {
    let distance = p5.Vector.dist(this.position, magneticParticle.position);
    let collisionDistance = magneticParticle.diameter / 2;

    if (distance <= collisionDistance) {
      let collisionNormal = p5.Vector.sub(
        this.position,
        magneticParticle.position
      ).normalize();
      let velocityAlongNormal = this.velocity.dot(collisionNormal);

      if (velocityAlongNormal < 0) {
        let reboundForce = p5.Vector.mult(
          collisionNormal,
          -velocityAlongNormal * (1 + restitution)
        );
        this.velocity.add(reboundForce);
      }

      if (this.velocity.mag() < 0.1) {
        this.velocity.mult(0);
      }
    }
  }

  display() {
    if (cursorImage) {
      image(cursorImage, this.position.x, this.position.y, 30, 30); // Display the cursor image
    }
  }
}

class MagneticParticle {
  constructor(x, y, charge, diameter) {
    this.position = createVector(x, y);
    this.charge = charge;
    this.diameter = diameter;
  }

  display() {
    noStroke();

    // Map charge strength to alpha value (0.5 to 1)
    const alpha = map(abs(this.charge), 0, 5, 0.5, 1);

    if (this.charge > 0) {
      // Positive charges: Red with alpha
      fill(255, 0, 0, alpha * 255); // Scale alpha to 0-255
    } else {
      // Negative charges: Blue with alpha
      fill(0, 0, 255, alpha * 255); // Scale alpha to 0-255
    }

    // Draw the particle
    ellipse(this.position.x, this.position.y, this.diameter, this.diameter);

    // Add charge symbol (+ or −)
    fill(255); // White text with alpha
    textAlign(CENTER, CENTER);
    textSize(this.diameter / 2);
    if (this.charge > 0) {
      text("+", this.position.x, this.position.y);
    } else {
      text("−", this.position.x, this.position.y);
    }
  }
}

class MouseForce {
  constructor(threshold = 3, maxForce = 4) {
    this.threshold = threshold; // Minimum mouse movement threshold
    this.maxForce = maxForce; // Maximum force magnitude
    this.prevMousePosition = createVector(mouseX, mouseY); // Track the previous mouse position
  }

  calculateForce() {
    // Get the current mouse position and calculate its velocity
    let currentMousePosition = createVector(mouseX, mouseY);
    let mouseVelocity = p5.Vector.sub(currentMousePosition, this.prevMousePosition);

    // Update previous mouse position
    this.prevMousePosition = currentMousePosition;

    // If mouse movement is insignificant, return no force
    if (mouseVelocity.mag() <= this.threshold) {
      return createVector(0, 0);
    }

    // Scale the force based on mouse velocity
    mouseVelocity.mult(0.6); // Adjust the scaling factor as needed

    // Safeguard: Limit the maximum magnitude of the force
    mouseVelocity.limit(this.maxForce);

    return mouseVelocity;
  }
}


function preload() {
  cursorImage = loadImage("mac-cursor.png"); // Load the cursor image
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize the moveable object
  moveableObject = new MoveableObject(width / 2 + 100, height / 2, 1, 1); // Start near the bottom center

  // Initialize mouse force
  mouseForce = new MouseForce();

  // Create a zig-zag maze
  addCharges();

  noCursor(); // Hide the default cursor
}

function draw() {
  background(255);

  // Display all magnetic particles
  for (let particle of magneticParticles) {
    particle.display();
  }

  // Calculate forces from each magnetic particle
  for (let particle of magneticParticles) {
    let direction = p5.Vector.sub(particle.position, moveableObject.position);
    let distance = direction.mag();
    distance = constrain(distance, 20, 500);

    if (distance > particle.diameter / 2) {
      let forceMagnitude = (k * moveableObject.charge * particle.charge) / (distance * distance);
      direction.setMag(forceMagnitude);
      moveableObject.applyForce(direction);
    } else {
      moveableObject.checkCollision(particle, restitution);
    }
  }

  // Apply mouse movement-based force to the moveable object
  let mouseForceVector = mouseForce.calculateForce();
  moveableObject.applyForce(mouseForceVector);

  // Update the moving object
  moveableObject.update();

  // Display the moving object
  moveableObject.display();
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


/**
 * Adds three charges: one negative and two positive, equidistantly placed
 * around a circle of radius 200px from the center of the canvas.
 */
function addCharges() {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 200;
  const diameter = 100;

  // Angles for equidistant placement
  const angles = [PI / 2, (5 * PI) / 6, (7 * PI) / 6]; // 120° apart

  // Charge values: 1 negative, 2 positive
  const charges = [-0.7, 1, 1];

  for (let i = 0; i < charges.length; i++) {
    const x = centerX + radius * cos(angles[i]);
    const y = centerY + radius * sin(angles[i]);
    magneticParticles.push(new MagneticParticle(x, y, charges[i], diameter));
  }
}