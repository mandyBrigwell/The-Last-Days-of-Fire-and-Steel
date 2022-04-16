// The Last Days of Fire and Steel
// 2022 Mandy Brigwell
// Fonts from Google Fonts, released under open source licenses and usable in any non-commercial or commercial project.
// Code and soundtrack are original works by Mandy Brigwell

let randomSeedValue = ~~(fxrand()*12345);
let noiseSeedValue = ~~(fxrand()*56789);
let screenSize;

// Graphics buffers, resolution, frames and rendering
var theCanvas, graphics, postRender, overlayRender, saveBuffer, eightBidou;
var fullRes = 2048;
var infoTargetAlpha = 0;
var infoAlpha = 0;
var titleAlpha = 360;
var messageAlpha = 360;
var messageString = "Press [I] for information";
var startFrame, endFrame, requiredFrames, postRenderFrames;
var instructionText = "Show/hide information: [I]\n\nFullscreen: [double click]\n\nSave PNG: [S]\n\nSound: [O]\n\nReplay current render sequence: [R]\nRe-render with new parameters: [P]\nInfinite render mode: [space]\n\nToggle elements\nDimming and shadows: [V]\nSky and water: [B]\nAll colour variants: [N]\nIndividual colour variants: [1-5]\nStructures: [M]\nSky events: [C]\nScaffolds: [X]\nReactivate all: [Z]\n\nSaved files are exported\nas a PNG at a resolution\nof 2048x2048 pixels";
var infoText;
var firstRenderComplete = false;

// Prepare fonts for preloading
var titleFont, labelFont;

// Prepare soundtrack for preloading
var soundtrack;

// Rendering mode flags
var renderMain = true;
var renderStructures = true;
var renderScaffold = true;
var renderVariants = true;
var overlayDimming = true;
var skyEvents = true;
var renderVariant = [true, true, true, true, true];
var infinityMode = false;
var eightBidouMode = false;

// Variables for test renders
// This mode is inaccessible in the final build
// During development it rendered and saved 64 images
var testRenderCount = 0;
var testRendersRequired = 64;
var saveTest = false;

// Variables
var variantIntensity = [];
var variantThreshold = [];
var noiseArray = [];
var xVariance, xVariance;
var dotSpatter;
var mainStrokeWeight;
var totalPoints;
var buildingCount;
var buildingSeed;
var buildingRotate;

// Feature renders
var starsArray = [];
var aircraftArray = [];
var meteorArray = [];
var scaffoldArray = [];
var scaffoldLights;
var overlayArray = [];

// Colours
var colorStructure = [];
pushColorStructures();

var renderQuotes = [];
pushRenderQuotes();
var renderQuote = renderQuotes[~~(fxrand()*renderQuotes.length)];

var colorMapName, mainColor, backgroundColor;
var variantColors = [];
var coordinateDirection;
var coordinateDirectionDescription = ["Evenly lit", "Lit from the West", "Lit from the East", "Central light", "Faded centre"];
// 	"Resolution": fullRes,
// }

function preload() {
	titleFont = loadFont("JuliusSansOne-Regular.ttf");
	quoteFont = loadFont("Bitter-Regular.ttf");
	soundtrack = loadSound("soundtrack.mp3");
}

function setup() {
	pixelDensity(1);
	randomSeed(randomSeedValue);
	noiseSeed(noiseSeedValue);
	
	screenSize = min(windowWidth, windowHeight);
	theCanvas = createCanvas(screenSize, screenSize);
	colorMode(HSB, 360);
	rectMode(CENTER);
	imageMode(CENTER);
	background(0);

	// Set up
	soundtrack.playMode = 'restart';
	createGraphicsBuffers();
	initiate();
	createInfo();
	startRender();
}

function createGraphicsBuffers() {
	// Graphics buffer
	graphics = createGraphics(fullRes, fullRes);
	graphics.colorMode(HSB, 360);

	// Post-render graphics buffer
	postRender = createGraphics(fullRes, fullRes);
	postRender.colorMode(HSB, 360);

	// Post-render graphics buffer
	overlayRender = createGraphics(fullRes, fullRes);
	overlayRender.colorMode(HSB, 360);
	
	// Post-render graphics buffer
	eightBidou = createGraphics(8, 8);
	
	// Save graphics buffer
	saveBuffer = createGraphics(fullRes, fullRes);
}

function startRender() {
	// Clear all canvases
	theCanvas.clear();
	graphics.clear();
	postRender.clear();
	overlayRender.clear();
	
	requiredFrames = 360;
	postRenderFrames = 2048;
	startFrame = frameCount;
	endFrame = startFrame + requiredFrames;
	totalPoints = pow(2, 19);
}

function initiate() {

	var selectedColorStructure = colorStructure[~~random(colorStructure.length)];
	colorMapName = selectedColorStructure[0];
	mainColor = "#" + selectedColorStructure[1];
	
	// Create background color by dimming mainColor
	backgroundColor = color(mainColor);
	backgroundColor.setRed(red(backgroundColor)*0.05);
	backgroundColor.setGreen(green(backgroundColor)*0.05);
	backgroundColor.setBlue(blue(backgroundColor)*0.05);

	variantColors = selectedColorStructure.slice(2, 8);
	variantColors.forEach(function(element, index) {
    variantColors[index] = '#' + element;
	});
	
				
	for (var i=0; i<5; i++) {
		variantIntensity[i] = 0.25 + random()*random()*random();
		variantThreshold[i] = 0.25 + random()*random()*random();
	}
	
	buildingCount = 4+random(8);
	buildingSeed = random(999999);
	renderStructures = random()*random()*random()*random() < 0.85;
	buildingRotate = random()*random() > 0.5;
	
	xVariance = 8 + random()*random()*64;
	yVariance = (xVariance*random()*random()) + (random()*random()*64);
	
	xVariance = random(-1, 1);
	xVariance = 1+random(8)*random();
	
	dotSpatter = ~~random(8, 12);
	mainStrokeWeight = 0.25+random()*random();
	
	coordinateDirection = ~~random(4);
	
	starsArray = [];
	for (var k=0; k<8; k++) {
		if (random() < pow(0.4, (k+1)*0.75)) {
			starsArray.push(new Star(random(0.1, 0.9)*fullRes, fullRes/2-(pow(random(), k+1)*fullRes/2), random()*random()*fullRes*2, 0.35, random(-4, 16)*random(), random(4, 16)*random(), 0.1));
		}
	}
	
	aircraftArray = [];
	var aircraftLikelihood = random(0.25);
	if (random() < 0.02) { // Slight chance of an aircraft burst
		aircraftLikelihood = 0.9
	}
	var aircraftEndPointX = random()*fullRes;
	var aircraftEndPointY = random(0.5)*fullRes;
	for (var k=0; k<16; k++) {
		if (random() < pow(aircraftLikelihood, (k+1)*0.75)) {
			var aircraftStart = (random() < 0.5 ? random(-0.1) : random(1, 1.1)) * fullRes;
			var aircraftHeight = random(fullRes*0.1) + aircraftEndPointY*random()*random();
			aircraftArray.push( new Aircraft(aircraftStart, aircraftHeight, aircraftEndPointX, aircraftEndPointY) );
		}
	}
	
	meteorArray = [];
	var meteorLikelihood = random(0.25);
	if (random() < 0.02) { // Slight chance of a meteor burst
		meteorLikelihood = 0.9
	}
	for (var k=0; k<16; k++) {
		if (random() < pow(meteorLikelihood, (k+1)*0.75)) {
			meteorArray.push(new Meteor(
			random([random(0.35)*fullRes, random(0.65, 1)*fullRes]),
			random(-0.1)*fullRes,
			random(0.4, 0.6)*fullRes,
			fullRes*0.5
			));
		}
	}

	scaffoldArray = [];
	scaffoldLights = random() < 0.5;
	if (random() < 0.4) {
		for (var k=0; k<16; k++) {
			if (random() < pow(0.5, (k+1)*0.75)) {
				var sectionSize = random(fullRes/32, fullRes/28);
				var sections = 4+~~(fullRes/sectionSize*0.75*random()*random()*random());
				scaffoldArray.push(new Scaffold(random(fullRes), fullRes*0.5, sectionSize, sections));
			}
		}
	}
	
	overlayArray = [];
	if (random() < 0.2) {
		switch (~~(random(4))) {
			case 1:
				overlayArray.push(new Overlay(random(["stack", "scaffold", "zigzag"]), random(0.05*fullRes)*random()*random(), fullRes*1.025, random(fullRes/4, fullRes/3), random([random(-0.1, -0.15), random(0.1, 0.15)])) );
				break;
			case 2:
				overlayArray.push(new Overlay(random(["stack", "scaffold", "zigzag"]), fullRes-(random(0.05*fullRes)*random()*random()), fullRes*1.025, random(fullRes/4, fullRes/3), random([random(-0.1, -0.15), random(0.1, 0.15)])) );
				break;
			case 3:
				overlayArray.push(new Overlay(random(["stack", "scaffold", "zigzag"]), random(0.2)*random()*fullRes, fullRes+(random(0.25)*random()*fullRes), random(fullRes/4, fullRes/5), random(1.5, 1.7)));
				break;
			}
	}
}

function createInfo() {
	infoText = "The Last Days of Fire and Steel"
	infoText += "\n";
	
	if (infinityMode) {
		infoText += "\nInfinite render mode is on";
	} else {
		infoText += "\nInfinite render mode is off";
	}
	
	if (soundtrack.isPlaying()) {
		infoText += "\nSound is on";
	} else {
		infoText += "\nSound is off";
	}
	
	infoText += "\n";
	infoText += "\nColour palette: " + colorMapName;
	infoText += "\nLighting: " + coordinateDirectionDescription[coordinateDirection];
	infoText += "\nSky: " + (starsArray.length > 0 ? (starsArray.length == 1 ? "1 star, " : starsArray.length + " stars, ") : "No stars, ");
	infoText += (aircraftArray.length > 0 ? (aircraftArray.length + " aircraft, ") : "no aircraft, ");
	infoText += (meteorArray.length > 0 ? (meteorArray.length == 1 ? "1 meteor" : meteorArray.length + " meteors") : "no meteors");
	
	if (renderStructures) {
		infoText += "\nThere " + (scaffoldArray.length > 0 ? (scaffoldArray.length == 1 ? "is 1 scaffold" : "are " + scaffoldArray.length + " scaffolds") : "are no scaffolds");
		if (scaffoldArray.length > 0) {
			infoText += scaffoldLights ? "\nScaffolding may feature lights" : "\nScaffolding is unlit";
		}
		infoText += buildingRotate ? "\nStructures are slightly tilted" : "\nStructures are not tilted";
	}
	infoText += "\n\n";
}

function displayMessage(message) {
	messageString = message;
	messageAlpha = 360;
}

function draw() {
	// Nuke it from orbit, just to be sure
	graphics.resetMatrix();
	graphics.noFill();
	graphics.noStroke();
	graphics.strokeWeight(1);
	
	// Manage framecount and rendering process
	var elapsedFrame = frameCount-startFrame;
	var progress = elapsedFrame/requiredFrames;
	var progressToGo = 1 - progress;
	
	// On the first few frames, apply a very slight tint to the sky
	if (elapsedFrame < requiredFrames/8) {
		var chosenColor = color(mainColor);
		chosenColor.setRed(red(chosenColor)*1.25);
		chosenColor.setGreen(green(chosenColor)*1.25);
		chosenColor.setBlue(blue(chosenColor)*1.25);
		chosenColor.setAlpha(map(elapsedFrame, 0, requiredFrames/8, 4, 0));
		graphics.fill(chosenColor);
		graphics.rect(0, 0, fullRes, fullRes/2);
	}
	
	// If we're within the required frames, this loop renders multiple points
	if (elapsedFrame <= requiredFrames) {
		for (var i=0; i<(totalPoints/requiredFrames); i++) {
		
			// Choose co-ordinates, weighted in various ways
			var iPos, jPos;
			switch (coordinateDirection) {
				case 0: // All values equally-likely
					iPos = random();
					jPos = random();
					break;
				case 1: // Fades to the east
					iPos = random()*random();
					jPos = random();
					break;
				case 2: // Fades to the west
					iPos = 1-random()*random();
					jPos = random();
					break;
				case 3: // Fade to east and west
					iPos = random(random(0.5), 1-random(0.5));
					jPos = random();
					break;
				case 4: // Fade to centre
					iPos = random() < 0.5 ? random(0.6)*random() : 1-(random(0.6)*random());
					jPos = random();
					break;
				default:
					iPos = random(random(0.9, 1)*random(), random(0.9, 1)*random());
					jPos = random();
					break;
			}
			
			// Map co-ordinate to screen
			var xPos = map(iPos, 0, 1, 0, fullRes);
			var yPos = map(jPos, 0, 1, 0, fullRes);
			
			// Generate noise values
			let noiseX = noise(iPos*2, jPos*16, startFrame);
			let noiseY = noise(iPos*xVariance, jPos*xVariance, startFrame);
			var noiseValue = map(sin(iPos + jPos * TAU / noiseX) + (sin(jPos + iPos*TAU + noiseY)), -2, 2, 0, 1);
			
			// Main noise
			if (renderMain) {
				var distMultiplier = map(dist(iPos, jPos, 0.5, 0.5), 0, 0.5, 0, 1);
				var yPosMultiplier = map(yPos, 0, fullRes*0.5, 0.8, 0.1);
				if (noiseValue < 0.25 || noiseValue > 0.75) {
					var chosenColor = color(mainColor);
					chosenColor.setAlpha(map(noiseValue, 0, 1, 8, 90)+(map(elapsedFrame, 0, requiredFrames, 8, 0))*distMultiplier);
					graphics.stroke(chosenColor);
				} else {
					// Sky
					if (yPos < fullRes*0.45) {
						var chosenColor = color(mainColor);
						chosenColor.setRed(red(chosenColor)*yPosMultiplier);
						chosenColor.setGreen(green(chosenColor)*yPosMultiplier);
						chosenColor.setBlue(blue(chosenColor)*yPosMultiplier);
						chosenColor.setAlpha(map(elapsedFrame, 0, requiredFrames, 90, 0));
						graphics.stroke(chosenColor);
					} else {
						// Ground
						graphics.stroke(map(yPos, fullRes*0.5, fullRes, 360, 360), map(elapsedFrame, 0, requiredFrames, 180, 30));
						graphics.stroke(0, 90);
					}
				}
				for (var j=1; j<~~random(1, dotSpatter); j++) {
					var xRandom = random(-dotSpatter, dotSpatter)*random()*random()*random()*random();
					var yRandom = random(-dotSpatter, dotSpatter)*random()*random()*random()*random();
					graphics.strokeWeight((yPos > fullRes*0.5 ? map(yPos, fullRes*0.5, fullRes, 0, 4) : 1) * map(elapsedFrame, 0, requiredFrames, 1, 0.25)*(map(yPos, 0, fullRes, 0, fullRes/256)+map(dist(0, 0, xRandom, yRandom), 0, dotSpatter, 2, random()*fullRes/32)));
					graphics.point(xPos+xRandom, yPos+yRandom);
				}
			}
			
			for (var j=1; j<7; j++) {
				noiseArray[j-1] = noise(xPos/j/360, yPos/j/80, j*startFrame);
			}

			// Variants
			for (var j=0; j<5; j++) {
				if (noiseArray[j] < variantThreshold[j]) {
					var chosenColor = color(variantColors[j]);
					var jitterX = 0;
					var jitterY = 0;
					switch (j) {
						case 0:
						case 1:
							chosenColor.setAlpha(map(noiseArray[j], 0, variantThreshold[j], 30, 180)*variantIntensity[j]);
							graphics.stroke(chosenColor);
							graphics.strokeWeight(map(noiseArray[j], 0, variantThreshold[j], 0, fullRes/480));
						break;
						case 2:
						case 3:
							var chosenColor = color(variantColors[j]);
							chosenColor.setAlpha(map(elapsedFrame, 0, requiredFrames, 0, 10));
							graphics.stroke(chosenColor);
							graphics.strokeWeight(map(noiseArray[j], 0, variantThreshold[j], 0, fullRes/(elapsedFrame, 0, requiredFrames, 1024, 256)));
							jitterX = random(-64, 64);
							jitterY = random(-64, 64);
						break;
						case 4:
							var chosenColor = color(variantColors[j]);
							chosenColor.setAlpha(map(elapsedFrame, 0, requiredFrames, 0, 60));
							graphics.stroke(chosenColor);
							graphics.strokeWeight(map(noiseArray[j], 0, 0.25, 0, fullRes/480));
						break;
					}
					if (renderVariants && renderVariant[j]) {
							graphics.point(xPos+jitterX, yPos+jitterY);
					}
				}
			}
			
			// Stars
			if (skyEvents) {
				for (var star in starsArray) {
					var starRadius;
					if (starsArray[star].type) {
						starRadius = pow(random(), map(elapsedFrame, 0, requiredFrames, starsArray[star].from, starsArray[star].to))*starsArray[star].radius + (random(-1, 1)*random()*random()*fullRes*0.125);
					} else {
						starRadius = starsArray[star].radius-((pow(random(), map(elapsedFrame, 0, requiredFrames, -starsArray[star].from, starsArray[star].to))*starsArray[star].radius)+(random(-1, 1)*random()*random()*fullRes*0.125));
					}
					var theta = random(0, TAU);
					if (starsArray[star].rainbow) {
						graphics.stroke((random(-8, 8) + map(theta, 0, TAU, 0, 360) + map(noise(star, startFrame), 0, 1, 0, 360))%360,
						map(starRadius, 0, starsArray[star].radius, 0, 360), 360, map(elapsedFrame, 0, requiredFrames, 2, 0));
					} else {
						graphics.stroke(360, map(elapsedFrame, 0, requiredFrames, 2, 0));
					}
					graphics.strokeWeight(map(elapsedFrame, 0, requiredFrames, fullRes*0.0025, fullRes*0.0125));
					var starXPos = starsArray[star].xPos + sin(theta)*starRadius;
					var starYPos = starsArray[star].yPos + cos(theta)*starRadius;
					if (starYPos < fullRes * 0.5) {
						graphics.point(starXPos, starYPos);
					}
				}
			}

		} // End multipleframes loop
		
		// Aircraft
		if (skyEvents) {
			for (var aircraft in aircraftArray) {
				if (elapsedFrame/requiredFrames <= 0.5) {
					graphics.stroke(0, map(elapsedFrame, 0, requiredFrames/2, 0, 300));
					graphics.strokeWeight(map(elapsedFrame, 0, requiredFrames/2, 0, fullRes*0.0075));
				} else {
					graphics.stroke(0, map(elapsedFrame, requiredFrames/2, requiredFrames, 300, 0));
					graphics.strokeWeight(map(elapsedFrame, requiredFrames/2, requiredFrames, fullRes*0.0075, 0));
				}
				var aircraftXPos = lerp(aircraftArray[aircraft].startX, aircraftArray[aircraft].endX, elapsedFrame/requiredFrames);
				var aircraftYPos = lerp(aircraftArray[aircraft].startY, aircraftArray[aircraft].endY, elapsedFrame/requiredFrames);
				if (aircraftYPos < fullRes * 0.5) {
					graphics.point(aircraftXPos, aircraftYPos);
				}
			}
		}

		// Meteor
		if (skyEvents) {
			for (var meteor in meteorArray) {
				var meteorXPos = lerp(meteorArray[meteor].startX, meteorArray[meteor].endX, elapsedFrame/requiredFrames);
				var meteorYPos = map(elapsedFrame, 0, requiredFrames, 0.5, 1) * lerp(meteorArray[meteor].startY, meteorArray[meteor].endY, elapsedFrame/requiredFrames);
				graphics.stroke(180, map(meteorYPos, 0, fullRes*0.3, 120, 0));
				graphics.strokeWeight(map(elapsedFrame, 0, requiredFrames, 0, fullRes*0.0175));
				if (meteorYPos < fullRes * 0.5) {
					graphics.point(meteorXPos, meteorYPos);
				}
			}
		}
		

		// Structures
		if (renderStructures) {
			graphics.translate(fullRes/2, fullRes/2);
			graphics.fill(0, map(elapsedFrame, 0, requiredFrames, 360, 60));
			graphics.noStroke();
			for (var k=0; k<buildingCount; k++) {
				var xPos = map(elapsedFrame, 0, requiredFrames, 1.1, 1.0)*map(k, 0, buildingCount, -fullRes*0.5, fullRes*0.5);
				var yPos = 0;
				var width = fullRes/noise(k*3, buildingSeed)/9;
				var height = -noise(k, buildingSeed)*(fullRes/map(elapsedFrame, 0, requiredFrames, 3, 4));
				// Cuboid
				if (noise(k*2, buildingSeed) < 0.75) {
					graphics.rect(xPos, yPos, width, height);
					if (buildingRotate) {
						var rotationAmount = map(noise(k+8, buildingSeed), 0, 1, -0.1, 0.1);
						graphics.rotate(rotationAmount);
						graphics.rect(xPos, yPos, width, height);
						graphics.rotate(-rotationAmount);
					}
				}
				// Domes
				if (noise(k*3, buildingSeed) < 0.25) {
					var radius = -noise(k*4, buildingSeed) * (fullRes/map(elapsedFrame, 0, requiredFrames, 1.1, 1.3));
					graphics.arc(xPos, 0, radius, radius, PI, 0);
				}
				// Spike
				if (noise(k*4, buildingSeed) < 0.25) {
					var width = noise(k*5, buildingSeed) * (fullRes/map(elapsedFrame, 0, requiredFrames, 64, 63));
					var height = noise(k*5, buildingSeed) * noise(k*5, buildingSeed) * fullRes;
					graphics.beginShape();
					graphics.vertex(xPos+width*2, 0);
					graphics.vertex(xPos+width, -height);
					graphics.vertex(xPos, 0);
					graphics.endShape(CLOSE);
				}
			}
			graphics.resetMatrix();
		}
		
		// Scaffold
		if (renderScaffold) {
			for (var scaffold in scaffoldArray) {
				graphics.push();
				graphics.translate(map(elapsedFrame, 0, requiredFrames, 0.97, 1.03) * scaffoldArray[scaffold].xPos - scaffoldArray[scaffold].sectionSize*0.5, scaffoldArray[scaffold].yPos - scaffoldArray[scaffold].sectionSize);
				graphics.rotate(scaffoldArray[scaffold].tilt*map(elapsedFrame, 0, requiredFrames, -1, 1));
				for (var k=0; k<scaffoldArray[scaffold].stackHeight; k++) {
					graphics.stroke(0, map(elapsedFrame, 0, requiredFrames, 360, 60));
					graphics.strokeWeight(fullRes/128*scaffoldArray[scaffold].sectionSize*0.01);
					graphics.fill(90, map(elapsedFrame, 0, requiredFrames, 1, 0));
					if (noise(k+5, buildingSeed) < 0.5) {
						graphics.line(0, 0, scaffoldArray[scaffold].sectionSize, scaffoldArray[scaffold].sectionSize);
					}
					if (noise(k+6, buildingSeed) < 0.5) {
						graphics.line(0, scaffoldArray[scaffold].sectionSize, scaffoldArray[scaffold].sectionSize, 0);
					}
					graphics.rect(0, 0, scaffoldArray[scaffold].sectionSize, scaffoldArray[scaffold].sectionSize);
					graphics.translate(0, -scaffoldArray[scaffold].sectionSize);
					if (elapsedFrame > requiredFrames*map(noise(k, buildingSeed), 0, 1, 0.6, 0.75) && scaffoldLights && noise(k, buildingSeed) < 0.5) {
						graphics.push();
						graphics.translate(scaffoldArray[scaffold].sectionSize*noise(k+1, buildingSeed)*noise(k+1, buildingSeed), scaffoldArray[scaffold].sectionSize*(1+noise(k+2, buildingSeed)));
						graphics.stroke(360, map(elapsedFrame, 0, requiredFrames, 0, 5));
						graphics.strokeWeight(scaffoldArray[scaffold].sectionSize/map(elapsedFrame, 0, requiredFrames, 3, 4))
						graphics.point(0,0);
						graphics.strokeWeight(scaffoldArray[scaffold].sectionSize/map(elapsedFrame, 0, requiredFrames, 8, 16))
						graphics.point(0,0);
						graphics.pop();
						}
				}
				graphics.pop();
			}
		}

		// Overlay
		overlayRender.resetMatrix();
		overlayRender.translate(fullRes*0.5, fullRes*0.5);
		overlayRender.scale(random(0.95, 1.05));
		overlayRender.translate(-fullRes*0.5, -fullRes*0.5);
		for (var overlay in overlayArray) {
			var currentOverlay = overlayArray[overlay];
			overlayRender.push();
			overlayRender.translate(map(elapsedFrame, 0, requiredFrames, 0.975, 1.025) * currentOverlay.xPos - currentOverlay.sectionSize*0.5, currentOverlay.yPos - currentOverlay.sectionSize);
			overlayRender.rotate(currentOverlay.tilt + (currentOverlay.tilt*map(elapsedFrame, 0, requiredFrames, -0.01, 0.01)));
			overlayRender.noFill();
			overlayRender.stroke(0, 8);
			overlayRender.strokeWeight(fullRes/128*currentOverlay.sectionSize*0.01);
			switch (currentOverlay.type) {
				case "scaffold":
						for (var k=0; k<currentOverlay.stackHeight; k++) {
							overlayRender.line(0, 0, currentOverlay.sectionSize, currentOverlay.sectionSize);
							overlayRender.line(0, currentOverlay.sectionSize, currentOverlay.sectionSize, 0);
							overlayRender.rect(0, 0, currentOverlay.sectionSize, currentOverlay.sectionSize);
							overlayRender.translate(0, -currentOverlay.sectionSize);
						}
					break;
				case "stack":
						for (var k=0; k<currentOverlay.stackHeight; k++) {
							overlayRender.line(0, 0, currentOverlay.sectionSize, 0);
							overlayRender.line(0, currentOverlay.sectionSize, currentOverlay.sectionSize, currentOverlay.sectionSize);
							overlayRender.translate(0, -currentOverlay.sectionSize);
						}
					break;
				case "zigzag":
						for (var k=0; k<currentOverlay.stackHeight; k++) {
							overlayRender.line(0, 0, currentOverlay.sectionSize, 0);
							overlayRender.line(currentOverlay.sectionSize, 0, 0, currentOverlay.sectionSize);
							overlayRender.translate(0, -currentOverlay.sectionSize);
						}
					break;
			}
			overlayRender.pop();
		}

		// Overlay a slight dimming
		if (overlayDimming) {
			graphics.noStroke();
			graphics.fill(0, map(elapsedFrame, 0, requiredFrames, 8, 0));
			graphics.rect(0, 0, fullRes, map(elapsedFrame, 0, requiredFrames, fullRes*0.5, fullRes/512));
			// This draws a rectangle of diminishing width and alpha that ends as a thin strip across the centre of the render
			graphics.fill(0, map(elapsedFrame, 0, requiredFrames, 0, 360));
			graphics.rect(0, fullRes*0.495, fullRes, map(elapsedFrame, 0, requiredFrames, fullRes*0.375, fullRes*0.05));
		}

	} // End elapsedFrame less than required frames loop

	// Post-render animation
	if (frameCount < requiredFrames + postRenderFrames) {
		postRender.erase(8);
		var sizeMultiplier = 1;
		// Account for higher resolutions
		if (fullRes >= 4096) {
			sizeMultiplier = 0.5;
		}
		if (fullRes >= 8192) {
			sizeMultiplier = 0.25;
		}
		postRender.rect(0, 0, fullRes, fullRes);
		postRender.noErase();
		// Erase a little more strongly every now and then, or slight tint tend to build up
		if (frameCount%8 == 0) {
			postRender.erase(32);
			postRender.rect(0, 0, fullRes, fullRes);
			postRender.noErase();
		}	
		var postRenderAlpha = map(frameCount, requiredFrames, requiredFrames + postRenderFrames, 1, 0);
		for (var k=0; k<16; k++) {
			var xPos = map(random(), 0, 1, 0, fullRes);
			var yPos = map(random(), 0, 1, 0, fullRes);
			var chosenColor = color(mainColor);
			chosenColor.setAlpha(map(yPos, 0, fullRes, 8, 120) * postRenderAlpha);
			postRender.stroke(chosenColor);
			for (var j=1; j<~~random(1, dotSpatter); j++) {
				var xRandom = random(-dotSpatter, dotSpatter)*random()*random()*random();
				var yRandom = random(-dotSpatter, dotSpatter)*random()*random()*random();
				postRender.strokeWeight(sizeMultiplier*map(yPos, 0, fullRes, 0, fullRes/128) * dist(xPos, yPos, xRandom, yRandom) * 0.0005 * pow(random(), j));
				postRender.point(xPos+xRandom, yPos+yRandom);
			}
		}
	}
	
	if (fullRes/screenSize <= 0.25) {
		noSmooth();
	} else {
		smooth();
	}
	
	// Render image to canvas
	if (eightBidouMode) {
		eightBidou.background(0);
		eightBidou.image(graphics, 0, 0, 8, 8);
		eightBidou.image(overlayRender, 0, 0, 8, 8);
		noSmooth();
		translate(screenSize/2, screenSize/2);
		image(eightBidou, 0, 0, screenSize, screenSize);
	} else {
		translate(screenSize/2, screenSize/2);
		background(0);
		image(graphics, 0, 0, screenSize, screenSize);
		image(postRender, 0, 0, screenSize, screenSize);
		image(overlayRender, 0, 0, screenSize, screenSize);
	}

	// Handle information text visibility
	if (infoAlpha < infoTargetAlpha) {
		infoAlpha += 30;
	} else if (infoAlpha > infoTargetAlpha) {
		infoAlpha -= 30;
	}
		
	// Render title text
	if (elapsedFrame <= requiredFrames && titleAlpha > 0) {
		titleAlpha -= map(elapsedFrame, 0, requiredFrames, 1, 8);
		textAlign(CENTER, BOTTOM);
		textSize(screenSize*0.05);
		var chosenColor = color(mainColor);
		chosenColor.setAlpha(titleAlpha);
		fill(chosenColor);
		textFont(titleFont);
		stroke(0, titleAlpha);
		strokeWeight(6);
		strokeJoin(ROUND);
		textStyle(BOLD);
		text("The Last Days of Fire and Steel", 0, 0);
		textSize(screenSize*0.025);
		textStyle(NORMAL);
		textFont(quoteFont);
		textAlign(CENTER, TOP);
		text("\"" + renderQuote + "\"", 0, 0, screenSize*0.75);
	}

	// Render information text
	if (infoAlpha > 0) {
		textSize(screenSize*0.02);
		textFont(quoteFont);
		fill(360, infoAlpha);
		stroke(0, infoAlpha);
		strokeWeight(6);
		strokeJoin(ROUND);
		if (elapsedFrame <= requiredFrames) {
			textAlign(RIGHT, TOP);
			text(instructionText, screenSize*0.45, screenSize*-0.45);
			textAlign(LEFT, TOP);
			text(infoText + "Rendering " + elapsedFrame + "/" + requiredFrames + " frames.", screenSize*-0.45, screenSize*-0.45);
		} else {
			textAlign(RIGHT, TOP);
			text(instructionText, screenSize*0.45, screenSize*-0.45);
			textAlign(LEFT, TOP);
			text(infoText + "Render Complete", screenSize*-0.45, screenSize*-0.45);
		}
		textAlign(CENTER, CENTER);
		text("\"" + renderQuote + "\"", 0, screenSize*0.35, screenSize*0.5);
	}
	
	// Render message text
	if (messageAlpha > 0) {
		messageAlpha -= map(messageAlpha, 0, 360, 2, 16);
		textAlign(CENTER, CENTER);
		textSize(screenSize*0.02);
		textFont("monospace");
		var chosenColor = color(mainColor);
		chosenColor.setAlpha(messageAlpha);
		fill(chosenColor);
		stroke(0, messageAlpha);
		text(messageString, 0, screenSize*0.45);
	}

	// Testing
	if (infinityMode) {
		if (elapsedFrame == requiredFrames && testRenderCount < testRendersRequired) {
		testRenderCount += 1;
		background(0);
		image(graphics, 0, 0, screenSize*0.95, screenSize*0.95);
		image(overlayRender, 0, 0, screenSize, screenSize);
		text(infoText + "Rendering " + elapsedFrame + "/" + requiredFrames, screenSize*-0.45, screenSize*-0.45);
		if (saveTest) {
					saveBuffer.background(0);
		saveBuffer.image(graphics, 0, 0, fullRes, fullRes);
		saveBuffer.image(overlayRender, 0, 0, fullRes, fullRes);
		save(saveBuffer, "TheLastDaysOfFireAndSteel" + nf(hour(), 2, 0) + nf(minute(), 2, 0) + nf(testRenderCount, 2, 0), "png");
		}
		if (testRenderCount >= testRendersRequired) {
			infinityMode = false;
		} else {
			initiate();
			createInfo();
			startRender();
		}
		}
	}
		
	// Check if render is complete for fxpreview();
	if (elapsedFrame == requiredFrames && !firstRenderComplete) {
		fxpreview();
		firstRenderComplete = true;
	}

}

function keyPressed() {

	if (key == 's') {
		if (eightBidouMode) {
			eightBidou.background(0);
			eightBidou.image(graphics, 0, 0, 8, 8);
			eightBidou.image(overlayRender, 0, 0, 8, 8);
			save(eightBidou, "TheLastDaysOfFireAndSteel8Bidou" + nf(hour(), 2, 0) + nf(minute(), 2, 0) + nf(second(), 2), "png");
		} else {
			saveBuffer.background(0);
			saveBuffer.image(graphics, 0, 0, fullRes, fullRes);
			saveBuffer.image(overlayRender, 0, 0, fullRes, fullRes);
			save(saveBuffer, "TheLastDaysOfFireAndSteel" + nf(hour(), 2, 0) + nf(minute(), 2, 0) + nf(second(), 2), "png");
		}
		displayMessage("Render saved ");
	}

	
	if (key == 'r') {
		infinityMode = false;
		startRender();
	}

	// Changing resolution can affect placement of scaffolds and overlay.
// Also, larger resolutions greatly increase render time and affect the experience
// This is, therefore, deactivated in the final build
// 	if (key == 'q') {
// 		currentRes = fullRes;
// 		fullRes = max(128, fullRes/2);
// 		if (currentRes != fullRes) {
// 			createInfo();
// 			createGraphicsBuffers();
// 			startRender();
// 			displayMessage("Rendering resolution decreased to " + fullRes);
// 		} else {
// 			displayMessage("Rendering resolution is at the minimum of 128")
// 		}
// 	}
// 
// 	if (key == 'w') {
// 		currentRes = fullRes;
// 		fullRes = 2048;
// 		if (currentRes != fullRes || eightBidouMode) {
// 			eightBidouMode = false;
// 			createInfo();
// 			createGraphicsBuffers();
// 			startRender();
// 			displayMessage("Rendering resolution returned to the default of " + fullRes);
// 		} else {
// 			displayMessage("Rendering resolution is at the default of 2048");
// 		}
// 	}
// 
// 	if (key == 'e') {
// 		var currentRes = fullRes;
// 		fullRes = min(8192, fullRes*2);
// 		if (currentRes != fullRes) {
// 			createInfo();
// 			createGraphicsBuffers();
// 			startRender();
// 			displayMessage("Rendering resolution increased to " + fullRes);
// 		} else {
// 			displayMessage("Rendering resolution is at the maximum of 8192");
// 		}
// 	}

	if (key == '8') {
		eightBidouMode = !eightBidouMode;
		displayMessage(eightBidouMode ? "8Bidou mode activated" : "8Bidou mode deactivated");
	}

	if (key == 'p') {
		infinityMode = false;
		renderMain = true;
		renderStructures = true;
		renderScaffold = true;
		renderVariants = true;
		overlayDimming = true;
		skyEvents = true;
		renderVariant = [true, true, true, true, true];
		initiate();
		createInfo();
		startRender();
		displayMessage("A new day begins...");
	}
	
	// Test mode - deactivated in final build
// 	if (key == 't') {
// 		testRenderCount = 0;
// 		testRendersRequired = 64;
// 		infinityMode = true;
// 		saveTest = true;
// 		initiate();
// 		createInfo();
// 		startRender();
// 		displayMessage("Sixty-four test renders in progress");
// 	}

	if (key == ' ') {
		if (!infinityMode) {
			testRenderCount = 0;
			testRendersRequired = 999999;
			infinityMode = true;
			saveTest = false;
			if (frameCount-startFrame >= requiredFrames) {
				initiate();
				startRender();
			}
			createInfo();
		} else {
			infinityMode = false;
			createInfo();
		}
		displayMessage(infinityMode ? "Infinite render mode activated" : "Infinite render mode deactivated");
	}
	
	if (key == 'm') {
		renderStructures = !renderStructures;
		startRender();
		displayMessage(renderStructures ? "Structures will be rendered" : "Structures will not be rendered");
	}

	if (key == 'n') {
		renderVariants = !renderVariants;
		startRender();
		displayMessage(renderVariants ? "Sky and water texture variants will be rendered" : "Sky and water texture variants will not be rendered");
	}

	if (key == 'b') {
		renderMain = !renderMain;
		startRender();
		displayMessage(renderMain ? "Main sky and water textures will be rendered" : "Main sky and water textures will not be rendered");
	}

	if (key == 'v') {
		overlayDimming = !overlayDimming;
		startRender();
		displayMessage(overlayDimming ? "Dimming and shadow effects will be rendered" : "Dimming and shadow effects will not be rendered");
	}

	if (key == 'c') {
		skyEvents = !skyEvents;
		startRender();
		displayMessage(skyEvents ? "Sky events will be rendered" : "Sky events will not be rendered");
	}

	if (key == 'x') {
		renderScaffold = !renderScaffold;
		startRender();
		displayMessage(renderScaffold ? "Scaffolds will be rendered" : "Scaffolds will not be rendered");
	}

	if (key == '1') {
		renderVariant[0] = !renderVariant[0];
		startRender();
		displayMessage(renderVariant[0] ? "Sky and water variant one will be rendered" : "Sky and water variant one will not be rendered");
	}

	if (key == '2') {
		renderVariant[1] = !renderVariant[1];
		startRender();
		displayMessage(renderVariant[1] ? "Sky and water variant two will be rendered" : "Sky and water variant two will not be rendered");
	}

	if (key == '3') {
		renderVariant[2] = !renderVariant[2];
		startRender();
		displayMessage(renderVariant[2] ? "Sky and water variant three will be rendered" : "Sky and water variant three will not be rendered");
	}

	if (key == '4') {
		renderVariant[3] = !renderVariant[3];
		startRender();
		displayMessage(renderVariant[3] ? "Sky and water variant four will be rendered" : "Sky and water variant four will not be rendered");
	}

	if (key == '5') {
		renderVariant[4] = !renderVariant[4];
		startRender();
		displayMessage(renderVariant[4] ? "Sky and water variant five will be rendered" : "Sky and water variant five will not be rendered");
	}

	if (key == 'z') {
		renderMain = true;
		renderStructures = true;
		renderScaffold = true;
		renderVariants = true;
		overlayDimming = true;
		skyEvents = true;
		renderVariant = [true, true, true, true, true];
		displayMessage("All elements will be rendered");
	}
	
	if (key == 'i') {
		if (infoTargetAlpha == 0) {
			infoTargetAlpha = 360;
		} else {
			infoTargetAlpha = 0;
		}
	}
	
	if (key == 'o') {
		if (soundtrack.isPlaying()) {
			displayMessage("Soundtrack off");
			soundtrack.setVolume(0, 1);
			soundtrack.stop(1);
			createInfo()
		} else {
			displayMessage("Soundtrack on");
			soundtrack.setVolume(1, 1);
			soundtrack.loop();
			createInfo() 		}
		}
}

function doubleClicked() {
    fullscreen(!fullscreen());
}


function windowResized() {
	if (navigator.userAgent.indexOf("HeadlessChrome") == -1) {
		screenSize = min(windowWidth, windowHeight);
		resizeCanvas(screenSize, screenSize);
	}
}

class Star {
	constructor(xPos, yPos, radius, typeChance, from, to, rainbowChance) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.radius = radius;
		this.type = (random() < typeChance);
		this.from = from;
		this.to = to;
		this.rainbow = (random() < rainbowChance);
	}
}

class Aircraft {
	constructor(startX, startY, endX, endY) {
		this.startX = startX;
		this.startY = startY;
		this.endX = endX;
		this.endY = endY;
	}
}

class Meteor {
	constructor(startX, startY, endX, endY) {
		this.startX = startX;
		this.startY = startY;
		this.endX = endX;
		this.endY = endY;
	}
}

class Scaffold {
	constructor(xPos, yPos, sectionSize, stackHeight) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.sectionSize = sectionSize;
		this.stackHeight = stackHeight;
		this.tilt = random(-0.1, 0.1);
	}
}

class Overlay {
	constructor(type, xPos, yPos, sectionSize, tilt) {
		this.type = type;
		this.xPos = xPos;
		this.yPos = yPos;
		this.sectionSize = sectionSize;
		this.stackHeight = fullRes/sectionSize;
		this.tilt = tilt;
	}
}



function pushColorStructures() {	
	colorStructure.push(["Barium", "f17105", "e6c229","f17105","d11149", "6610f2","1a8fe3"]);
	colorStructure.push(["Benzin", "656839", "8df1ff", "6bffb8", "2ceaa3", "28965a", "2a6041"]);
	colorStructure.push(["Benzol", "96df90", "aba9bf","beb7df","d4f2d2","34113f","868784"]);
	colorStructure.push(["Bronze", "40a4df", "53b3cb", "f9c22e", "f15946", "e01a4f", "e29578"]);
	colorStructure.push(["Butane", "4e4c67", "e6e5e6", "ffe7ff", "02a9ea", "4e4c67", "54428e"]);
	colorStructure.push(["Carbon", "ccdbdc","ccdbdc","9ad1d4","80ced7","007ea7","003249"]);
	colorStructure.push(["Cesium", "995fa3","802392","995fa3","9a98b5","a0b9c6","a5f8d3"]);
	colorStructure.push(["Cobalt", "0059b8", 	"bbeaee","7f675b","0075f2","00f2f2","8eafe6"]);
	colorStructure.push(["Conway", "ffffce", "a0eec0", "ffffce", "ffc53a", "e06d06", "b26700"]);
	colorStructure.push(["Copper", "c3c49e","524632","8f7e4f","c3c49e","d8ffdd","dedbd8"]);
	colorStructure.push(["Curium", "ff0000", "444444","ff0000","ff8200","ffc100","d6b457"]);
	colorStructure.push(["Diesel", "ffe2ff", "86e6fe", "ffffc7", "f15946", "e01a4f", "e29578"]);
	colorStructure.push(["Edison", "e788c9", "f5cce8","ec9ded","c880b7","9f6ba0","4a2040"]);
	colorStructure.push(["Erbium", "b2ddf7", "cabac8","ff101f","b2ddf7","81d6e3","4cb5ae"]);
	colorStructure.push(["Fusion", "f9c784", "c7d5ff", "e7e7e7", "f9c784", "fc7a1e", "f24c00"]);
	colorStructure.push(["Galena", "00ff00", "e8d7f1", "d3bccc", "a167a5", "4a306d", "0e273c"]);
	colorStructure.push(["Helium", "75dddd", "75dddd","84c7d0","9297c4","9368b7","aa3e98"]);
	colorStructure.push(["Indium", "88bb92","a0ecd0","94ddbc","88bb92","7b886b","714955"]);
	colorStructure.push(["Iodine", "faff7f", "91a6ff","ff88dc","faff7f","ffffff","ff5154"]);
	colorStructure.push(["Isomer", "b3af8f", "bef1f1", "ffffff", "ffd5c2", "f28f3b", "c8553d"]);
	colorStructure.push(["Kepler", "bbbbbb", "e7e7e7", "e5e5e5", "999999", "bbbbbb", "eeeeee"]);
	colorStructure.push(["Nikola", "ffffff ", "ffffff","00a7e1","00171f","003459","007ea7"]);
	colorStructure.push(["Osmium", "d1b3c4 ", "f85a3e","ff7733","e15634","e63b2e","e1e6e1"]);
	colorStructure.push(["Oxygen", "ae8e1c", "650d1b","823200","9b3d12","ae8e1c","c1df1f"]);
	colorStructure.push(["Petrol", "72a276", "ffe2ff", "ffcaff", "a480cf", "779be7", "49b6ff"]);
	colorStructure.push(["Pewter", "1b998b", "1b998b", "2d3047", "fffd82", "ff9b71", "e84855"]);
	colorStructure.push(["Phenyl", "cbc9ad", "40a4df", "514b23", "656839", "cbc9ad", "bddbd0"]);
	colorStructure.push(["Planck", "e06d06", "a0eec0", "8ae9c1", "86cd82", "72a276", "666b6a"]);
	colorStructure.push(["Radium", "02a9ea", "efffb7", "90ffd1", "348aa7", "525174", "513b56"]);
	colorStructure.push(["Silver", "e5e5e5", "c4d3ff", "e2ffff", "66999b", "b3af8f", "ffc482"]);
	colorStructure.push(["Sodium", "40a4df", "dab6c4", "7b886f", "b4dc7f", "feffa5", "ffa0ac"]);
	colorStructure.push(["Turing", "40a4df", "eeeeff", "d2e7fa", "28587b", "48233c", "32021f"]);
}

function pushRenderQuotes() {
	renderQuotes.push("...a circle of thick, carbonised girder, sheathed by tenacious fragments of concrete...");
	renderQuotes.push("...and somehow on the rim there are buildings still standing; a circle of thick, smoke-stricken girder.");
	renderQuotes.push("...and to think it was unthinkable that they should ever fall, should ever attain this state of crushed unreality.");
	renderQuotes.push("...at the centre of this place was our building, where we worked, you and I, and the soldiers too, they worked there.");
	renderQuotes.push("...because somewhere deep inside me I'm beginning to realise that there's more here. There was no earthquake.");
	renderQuotes.push("...each one the mark of something vital disgorging its essence in great arterial spurts of soot.");
	renderQuotes.push("...the air ripples with the heat curling up from the chasm and an occasional column of smoke or steam jets up from somewhere in the depths.");
	renderQuotes.push("...the interlocking teeth of the cogs that drive the world...");
	renderQuotes.push("...the skyline a mouth full of splintered grey teeth, crumbling and shifting into new configurations like a stirred ants' nest.");
	renderQuotes.push("...there should be nothing but the trickling sound of shifting brick fragments, all stone chip tinkles and clicks...");
	renderQuotes.push("'It'll never hold,' you shouted, and even as you spoke the bricks began to fall, thudding to earth in a flock of hammers.");
	renderQuotes.push("'It's a beautiful dream,' you said once, still not really understanding what it meant.");
	renderQuotes.push("'They must have started the machine,' I call back to you.");
	renderQuotes.push("All night the hammers pounded, forcing unwilling metal into new and ever more convoluted shapes.");
	renderQuotes.push("And soon the rain will come, I imagine, and wash all this away...");
	renderQuotes.push("But back here, in gravity's thrall, I can see - far away to the right - a crater...");
	renderQuotes.push("But with a sound like rushing feet it would all come to an end; it would always come to an end...");
	renderQuotes.push("Dark grey stone everywhere. And me, on my back, shadowed by these blocks...");
	renderQuotes.push("How far this damage extends, I don't know, but it's far enough to dull a shot to a faint crack in the silence...");
	renderQuotes.push("I concentrate on the levelled swathe of rubble and asphalt, following the misshapen surface round in a great wide arc...");
	renderQuotes.push("I glanced over to you, certain that you'd seen it to. A thin trail of smoke, rising heavenwards, but carrying no salvation.");
	renderQuotes.push("I imagine spiralling upwards into the scarred blue sky, rising above the veins of black smoke...");
	renderQuotes.push("I inch forward to the crater and pull myself towards the edge.");
	renderQuotes.push("I know now that if you hadn't been there all that time there'd have been no heaven and no hell...");
	renderQuotes.push("I might forever be lodged in that single bright space between one tick and another...");
	renderQuotes.push("I used to tell you about my dreams, about the one where the whole world was still except for me.");
	renderQuotes.push("I wanted there to be something I could do. In all situations where I've ever forced to remain powerless that's all I've ever wished for...");
	renderQuotes.push("I'm very much aware of the tall, half-deconstructed buildings behind me, cracked to the foundations but still holding...");
	renderQuotes.push("It shouldn't be quiet; the air should be anything but undisturbed.");
	renderQuotes.push("It's like being too far away from home, somehow; it's that moment when you realise you might never get back.");
	renderQuotes.push("Machinery clatters in the night, the sound carrying for several miles. We approach from the south, afraid.");
	renderQuotes.push("Or is this vision merely a reflection of the way the universe works; the interlocking teeth of the cogs that drive the world?");
	renderQuotes.push("Smoke poured endlessly from the stacks, and the great dome hummed with barely-restrained power.");
	renderQuotes.push("Smoke poured out as we watched, and the grinding sound of the mechanism reached a new zenith.");
	renderQuotes.push("The blackened bricks remind me of home; a poem to some future where the industrial finally won.");
	renderQuotes.push("The buildings are like splintered shells around me, the skyline a mouth full of cracked grey teeth...");
	renderQuotes.push("The edge is just in front of me. Asphalt ends suddenly, the road dragged downwards and inwards with such force that the crack is clean and sudden...");
	renderQuotes.push("The edge of the crater is further than it seems...");
	renderQuotes.push("The moonlight pushed through pallid clouds, each drifting tendril threatening to extinguish even this faint illumination.");
	renderQuotes.push("The pale light coruscated on the snakeskin water, each glittering wavelet a small gem amidst the darkness.");
	renderQuotes.push("The sky, full of dust and whirling galaxies, a fine stone mist swirling like smoke.");
	renderQuotes.push("The spire pushed its way through the low cloud, tiny stipples of light glittering along its length.");
	renderQuotes.push("The wind insinuated chill fingers between the gaps in the stonework. Still, even with no roof, it was better than nothing.");
	renderQuotes.push("There is no way down and there's nothing I can do, not now, so I lie back and watch the sky.");
	renderQuotes.push("There were definite cracks in the structure, ranging from barely-visible hairlines through to deeper, more serious scars.");
	renderQuotes.push("They crackle in my head like footfalls in a crisp frost, leaving tracks in their wake that I mentally pace...");
	renderQuotes.push("We crept closer to the structures, hardly daring to breathe. I saw you unfasten the satchel; make ready with the goods.");
	renderQuotes.push("We stayed there until dawn, huddled amongst the hollow reeds, unsure whether to advance or retreat.");
	renderQuotes.push("When the rain came it was heavy with soot, a blackened liquid suspension of particulate filth.");
}