	/*
	EZBO Stacking Cube Product Configurator Web App

	Elements that make up a 3D object in Babylon js: 
	- Cameras, Lights, Meshes, Materials 

	NOTES on diffuse texture: 
		Diffuse is best described as the raw color channel of a 3D object, 
		a texture is a 2D image file that can be wrapped onto an object, 
		usually by UV mapping. Often the texture node is plugged into the 
		diffuse channel to create the color of the object (like wrapping a present), 
		however you can also plug a texture into other channels like displacement, reflection etc.

	NOTES on optimization (TO-DO):
		https://blog.raananweber.com/2015/09/03/scene-optimization-in-babylon-js/

	Benchmark app:
		https://byggmodul.talgo.no/app#
	*/


	// global declarations
	var cubeCount; // to keep track of number of cubes
	var baseCubeNum = 2; // number of base cubes
	var buttonIndex;
	var bcubesName; // initial import of base cubes

	// assign basecubes file name for auto import of mesh. keep this all global
	switch (baseCubeNum) {
		case 1:
			bcubesName = 'B1-final.babylon'; break;
		case 2:
			bcubesName = 'B2-final.babylon'; break;
		case 3:
			bcubesName = 'B3-final.babylon'; break; 
		case 4:
			bcubesName = 'B4-final.babylon'; break; 
		case 5:
			bcubesName = 'B5-final.babylon'; break; 
		case 6:
			bcubesName = 'B6-final.babylon'; 
	}

	// Check if  browser supports webGL
	if (BABYLON.Engine.isSupported()) {

	// if it does, declare all the global variables outside mainApp func 
	var canvas = document.getElementById("main_app");
	// note to create with engine with stencil set to true so we can highlight a mesh
	var engine = new BABYLON.Engine(canvas, true, { stencil: true });  // this is the Babylon class engine 

	// declare globally accesible variable of host url (for later concat)
	var hostUrl = 'http://123sense.com/'

	// make sure DOM is loaded first 
	window.addEventListener('DOMContentLoaded', function() {
			// then run the main app's code
			mainApp_opt1(); 
	}); 

	} else {
	// display error message
	console.log('ERROR: WebGL support is required!')
	// alert user
	window.alert("webGL is not enabled on this browser. \
					Please edit your browser settings to enable webGL")
	// redirect after 5 seconds to home page....
	// redirect here! 
	} 

	// assets are either computed or imported  
	function mainApp_opt1() {

	// Programming guide sample--> https://msdn.microsoft.com/en-us/magazine/mt595753.aspx

	// Load room scene with native Babylon funcs
	// important: must run this first, as this will set the scene for the cubes
	var scene = createRoomScene(); 

	// Render
	engine.runRenderLoop(function () {
			scene.render(); 
	}); 

	// Ensure engine resize to keep things in perspective 
	window.addEventListener("resize", function () {
			engine.resize();
	});
	}

	// -----------------------------------------------------------------------------------------------------------------------------------------
	// With regards to creating the scene 

	// create room scene mesh by manual vectors 
	// inspired by https://www.babylonjs-playground.com/#RNCYVM 
	//             https://playground.babylonjs.com/#4G18GY#7 --> extruded polygon
	function createRoomScene() {

	console.log('[INFO] Room scene created by computation')

	// create the scene 
	var scene = new BABYLON.Scene(engine);

	// create 3D UI manager


	// camera
	var camera = createCamera(scene); 

	// light (sun directional)
	createLights(scene); 

	// create the floor
	createFloor(scene); 

	// create the walls with windows 
	createWalls_Winds(scene); 

	// create the roof 
	createRoof(scene); 

	// create the outdoor env --> skybox!
	createOutdEnv(scene); 

		// Load cubes and event listener 
		importBaseCubes(scene,camera); 
		
	//  importPlusMesh(scene);
		
		displayCube(scene);
	// finally 
	return scene; 
	}

	// create the camera
	function createCamera(scene) {

	// limited arc rotate
	// note its coords are always defined in alpha, beta and radius .. https://doc.babylonjs.com/babylon101/cameras
	// Parameters: name, alpha, beta, radius, target position, scene 
	var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, Math.PI/2, 4, new BABYLON.Vector3(2,1.25,0), scene); 
	camera.attachControl(canvas, true);
	// set limits to camera movement so users dont get disorganized 
	// camera.lowerRadiusLimit = 4;
	// camera.upperRadiusLimit = 4; 
	// camera.lowerAlphaLimit = -1.8; // rmbr this is radians!  
	// camera.upperAlphaLimit = -1.3; 
	// camera.lowerBetaLimit = 1.35; 
	// camera.upperBetaLimit = 1.75; 

	/* for testing only
	var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, Math.PI/2, 4.5, new BABYLON.Vector3(2,1.25,0), scene); 
	camera.attachControl(canvas, true);
	*/

	scene.activeCamera = camera; // set it as active viewport

	return camera;  
	}

	// create outdoor environment
	function createOutdEnv(scene) {

	// set bckgrnd colors
	scene.clearColor = new BABYLON.Color3(0, 0, 0);
	scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3); // this is particularly important for realism 

	// sky material 
	var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
	skyMaterial.backFaceCulling = false;     
	// Manually set the sun position
	skyMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
	skyMaterial.sunPosition = new BABYLON.Vector3(10, 5, 0);
	// skyMaterial setup 
	skyMaterial.turbidity = 2; // Represents the amount (scattering) of haze as opposed to molecules in atmosphere
	skyMaterial.luminance = 0.2; // Controls the overall luminance of sky in interval ]0, 1,190[
	skyMaterial.rayleigh = 0.2; // Represents the sky appearance (globally)

	// Set the horizon elevation relative to the camera position
	//skyMaterial.cameraOffset.y = scene.activeCamera.globalPosition.y;

	// sky mesh (box) 
	var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
	skybox.material = skyMaterial;
	}

	// create the light
	function createLights(scene) {

	// for now use hemispheric light for mvp level 
	var lights = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(10, 10, 0), scene);
	lights.intensity = 3;
	//lights.diffuse = new BABYLON.Color3(1, 0, 0);
	//lights.specular = new BABYLON.Color3(0, 1, 0);
	//lights.groundColor = new BABYLON.Color3(0, 1, 0);

	return lights; 
	}

	// create the floor 
	function createFloor(scene) { 

	var floorCorners = [ 
			// make sure tally with walls!
			new BABYLON.Vector3(4, 0,-6),
			new BABYLON.Vector3(4,0,0), 
			new BABYLON.Vector3(0,0,0), 
			new BABYLON.Vector3(0,0,-6),
	]; 

	// Extrude polygon
	var floorMesh = new BABYLON.MeshBuilder.ExtrudePolygon("floor", {shape:floorCorners, depth: 0.05}, scene);

	// create floor material
	var floorMaterial = new BABYLON.StandardMaterial("floorMaterial", scene);
	var floorTextureUrl = hostUrl + 'static/bryantest/woodtexture.jpg'; 
	floorMaterial.ambientTexture = new BABYLON.Texture(floorTextureUrl,scene);
	// apply the material to mesh
	floorMesh.material = floorMaterial;

	return floorMesh; // remark: not mandatory but good practice for future positoning 
	}

	// create the roof (flat roof) , if neccesary then invoke
	// actually can merge this func with the floor func , but later on lah!
	function createRoof(scene) { 

	var roofCorners = [ 
			// make sure tally with walls and floor!
			new BABYLON.Vector3(4, 0,-6),
			new BABYLON.Vector3(4,0,0), 
			new BABYLON.Vector3(0,0,0), 
			new BABYLON.Vector3(0,0,-6),
	]; 

	// Extrude polygon
	var roofMesh = new BABYLON.MeshBuilder.ExtrudePolygon("roof", {shape:roofCorners, depth: 0.05}, scene);
	// offset it to become roof
	roofMesh.position.y = 2.5; 

	// create roof material
	var roofMaterial = new BABYLON.StandardMaterial("roofMaterial", scene);
	var roofTextureUrl = hostUrl + 'static/bryantest/white-wall.jpg'; 
	//roofMaterial.diffuseTexture = new BABYLON.Texture(roofTextureUrl,scene);
	roofMaterial.ambientTexture = new BABYLON.Texture(roofTextureUrl,scene);
	// apply the material to mesh
	roofMesh.material = roofMaterial; 

	return roofMesh; // remark: not mandatory but good practice for future positoning 
	}


	// create (based on math) walls
	function createWalls_Winds(scene) {

	// Note: we use extrude polygon so be sure to include Earcut js in html 
	/*
	All vectors for shape and holes are Vector3 and should be in the XoZ plane,
	i.e. of the form BABYLON.Vector3(x, 0, z) and in counter clockwise order;
	Inspired by https://www.babylonjs-playground.com/#RNCYVM 
				https://playground.babylonjs.com/#4G18GY#7 --> extruded polygon
	*/

	// Reminder: XoZ plane! (4m width, 2.5m height)
	var backwallGeo = [
			new BABYLON.Vector3(0, 0, 0), 
			new BABYLON.Vector3(4, 0, 0), 
			new BABYLON.Vector3(4, 0, 2.5), 
			new BABYLON.Vector3(0, 0, 2.5), 
	];
	// 6m length, 2.5m height 
	var sidewallGeo_r = [
			new BABYLON.Vector3(4, 0, 0), 
			new BABYLON.Vector3(1.5, 0, 0), 
			new BABYLON.Vector3(1.5, 0, -6), 
			new BABYLON.Vector3(4, 0, -6), 
	];

	var sidewallGeo_l = [
			new BABYLON.Vector3(2.5, 0, 0), 
			new BABYLON.Vector3(0, 0, 0), 
			new BABYLON.Vector3(0, 0, -6), 
			new BABYLON.Vector3(2.5, 0, -6),
	]; 

	var holeData = [];
	// first window
	holeData[0] = [
				new BABYLON.Vector3(3.1, 0, -0.4), 
				new BABYLON.Vector3(2.4, 0, -0.4), 
				new BABYLON.Vector3(2.4, 0, -1.6), 
				new BABYLON.Vector3(3.1, 0, -1.6), 
	];

	// second window
	holeData[1] = [
			new BABYLON.Vector3(3.1, 0, -1.8), 
			new BABYLON.Vector3(2.4, 0, -1.8), 
			new BABYLON.Vector3(2.4, 0, -2.5), 
			new BABYLON.Vector3(3.1, 0, -2.5), 
	];

	// extrude the walls 
	var backwall = BABYLON.MeshBuilder.ExtrudePolygon("wall", {shape:backwallGeo, depth: 0.05}, scene);
	// then rotate 90deg to make the horizontal extrusion to be vertical 
	backwall.rotation.x =  -Math.PI/2;
	// do the same for side walls (each with diff rotation)
	var sidewall_r = BABYLON.MeshBuilder.ExtrudePolygon("wall_r", {shape:sidewallGeo_r, holes:holeData, depth: 0.05}, scene);
	sidewall_r.rotation.z = Math.PI/2;  
	sidewall_r.position.y = -1.5; // this is like a weird bug since it is rotating some distance away from the global origin 0,0,0
	sidewall_r.position.x = 4;
	var sidewall_l = BABYLON.MeshBuilder.ExtrudePolygon("wall_l", {shape:sidewallGeo_l, depth: 0.05}, scene);
	sidewall_l.rotation.z = Math.PI/2;  // naturally rotates in position since it has a node at origin 

	// create roof material
	var wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
	var wallTextureUrl = hostUrl + 'static/bryantest/woodtexture.jpg'; 
	//wallMaterial.diffuseTexture = new BABYLON.Texture(wallTextureUrl,scene);
	wallMaterial.ambientTexture = new BABYLON.Texture(wallTextureUrl,scene);
	// apply the material to meshes
	backwall.material = wallMaterial;
	sidewall_r.material = wallMaterial;
	sidewall_l.material = wallMaterial;
	}
	/*
	// highlight mesh on mouse hover
	function highlightMesh (scene, newMeshes) {

		// activate highlight
		var hl = new BABYLON.HighlightLayer("hl1", scene);
		hl.addMesh(newMeshes[0], BABYLON.Color3.Green());

		// deactivate highlight
		//hl.removeMesh(newMeshes[0]);
	}*/


	// --------------------------------------------------------------------------------------------------------------------------------------------
	// With regards to base cubes and GUI

	/*
	import base cabinet cubes , reposition into the scene, at the far left corner of an imaginary maximum 6 cube space
	User will be able to modify the base cubes 
	*/
	function importBaseCubes(scene,camera) {	
		//initialise array (Note this is for rows!)
		cubeCount = Array.from({length:baseCubeNum}).fill(1);
		
	// SceneLoader.ImportMesh
	// Loads the meshes from the file and appends them to the scene
	console.log("[INFO] Imported B3 asset mesh"); 
	BABYLON.SceneLoader.ImportMesh("", "http://123sense.com/static/bryantest/", bcubesName, scene, 
	function (newMeshes) {

			// do something with the meshes (no particles or skeletons in this case)

			// define position of base cube (meters)
			var posx = 2;
			var posy = 0.3;
			var posz = -0.2; 
			var roty = Math.PI/2;
			
		newMeshes[0].position.x = posx;
		newMeshes[0].position.y = posy;
		newMeshes[0].position.z = posz;
		newMeshes[0].rotation.y = roty;

		var boxMaterial = createboxMaterial(scene); 
		newMeshes[0].material = boxMaterial;

		// add highlight upon mouse hover , 
		// meshUnderPointer (https://doc.babylonjs.com/api/classes/babylon.actionevent)
		//highlightMesh(scene, newMeshes); 

			// load the buttons on top of the mesh here
			
			//vertical position
			var btnposY = posy + 0.3; 

			// =====================================================================================

		//  for B1
		if (baseCubeNum == 1){
				var button1 = guiBtn(scene, "1"); 
				// Note: this is to correct non stacking cubes plus btn position in an effor to reuse guiBtn
			button1.moveToVector3(new BABYLON.Vector3(1.92, btnposY, 0), scene); 
		}

		// =====================================================================================

		// for B2
		else if (baseCubeNum == 2){

			var button1 = guiBtn(scene, "1");
			var button2 = guiBtn(scene, "2");
			button1.moveToVector3(new BABYLON.Vector3(1.719, btnposY, 0), scene);
			button2.moveToVector3(new BABYLON.Vector3(2.119, btnposY, 0), scene);
		}
		
		// =====================================================================================

		// for B3
		else if (baseCubeNum == 3){
			var button1 = guiBtn(scene, "1"); 
			var button2 = guiBtn(scene, "2");
			var button3 = guiBtn(scene, "3");
			button1.moveToVector3(new BABYLON.Vector3(1.523, btnposY, 0), scene);
			button2.moveToVector3(new BABYLON.Vector3(1.919, btnposY, 0), scene);
			button3.moveToVector3(new BABYLON.Vector3(2.335, btnposY, 0), scene);
		}

		// =====================================================================================

		// for B4
		else if (baseCubeNum == 4){
			var button1 = guiBtn(scene, "1"); 
			var button2 = guiBtn(scene, "2");
			var button3 = guiBtn(scene, "3");
			var button4 = guiBtn(scene, "4");
			button1.moveToVector3(new BABYLON.Vector3(1.308, btnposY, 0), scene);
			button2.moveToVector3(new BABYLON.Vector3(1.734, btnposY, 0), scene);
			button3.moveToVector3(new BABYLON.Vector3(2.13, btnposY, 0), scene);
			button4.moveToVector3(new BABYLON.Vector3(2.55, btnposY, 0), scene);
		}
		
		// =====================================================================================

		//for B5
		else if (baseCubeNum == 5){
			var button1 = guiBtn(scene, "1"); 
			var button2 = guiBtn(scene, "2");
			var button3 = guiBtn(scene, "3");
			var button4 = guiBtn(scene, "4");
			var button5 = guiBtn(scene, "5");
			button1.moveToVector3(new BABYLON.Vector3(1.112, btnposY, 0), scene);
			button2.moveToVector3(new BABYLON.Vector3(1.506, btnposY, 0), scene);
			button3.moveToVector3(new BABYLON.Vector3(1.93, btnposY, 0), scene);
			button4.moveToVector3(new BABYLON.Vector3(2.34, btnposY, 0), scene);
			button5.moveToVector3(new BABYLON.Vector3(2.75, btnposY, 0), scene);
		}
		
		// =====================================================================================

		//for B6
		else if (baseCubeNum == 6){
			var button1 = guiBtn(scene, "1"); 
			var button2 = guiBtn(scene, "2");
			var button3 = guiBtn(scene, "3");
			var button4 = guiBtn(scene, "4");
			var button5 = guiBtn(scene, "5");
			var button6 = guiBtn(scene, "6");
			button1.moveToVector3(new BABYLON.Vector3(0.91, btnposY, 0), scene);
			button2.moveToVector3(new BABYLON.Vector3(1.32, btnposY, 0), scene);
			button3.moveToVector3(new BABYLON.Vector3(1.72, btnposY, 0), scene);
			button4.moveToVector3(new BABYLON.Vector3(2.13, btnposY, 0), scene);
			button5.moveToVector3(new BABYLON.Vector3(2.54, btnposY, 0), scene);
			button6.moveToVector3(new BABYLON.Vector3(2.96, btnposY, 0), scene);
		}
		else {
			alert("invalid number of cubes");
		}

	});  
	}

	// By index, we mean rows of cubes. first index == first row (which is the base)
	function gridData() {

		//initialise array to hold the rows of cube. 10 is arbitrary (to limit this later)
		var grid = Array.from({length:10}).fill(1);

		//initialise grid (this means 9 rows possible)
		for (var i=0; i<grid.length; i++) {
			grid[i] = [];
		}

		// B1 
		if (baseCubeNum == 1){
			// initialise the first index of the grid for a base to populate other indexes/rows above it
			grid[0].push([2, 0.69, -0.2]);
			grid = gridMaker(grid, 0.4);
		}
		// B2
		else if (baseCubeNum == 2) {
			grid[0].push([1.8, 0.69, -0.2], [2.2, 0.69, -0.2]);
			grid = gridMaker(grid, 0.4);
		}
		// B3
		else if (baseCubeNum == 3){
			grid[0].push([1.605, 0.69, -0.2], [1.995, 0.69, -0.2], [2.385, 0.69, -0.2]);
			grid = gridMaker(grid, 0.39);
		}
		// B4
		else if (baseCubeNum == 4) {
			grid[0].push([1.41, 0.69, -0.2], [1.8, 0.69, -0.2], [2.19, 0.69, -0.2], [2.58, 0.69, -0.2]);
			grid = gridMaker(grid, 0.39);
		}
		// B5
		else if (baseCubeNum == 5){
			grid[0].push([1.215, 0.69, -0.2], [1.605, 0.69, -0.2], [1.995, 0.69, -0.2], [2.385, 0.69, -0.2], [2.775, 0.69, -0.2]);
			grid = gridMaker(grid, 0.39);
		}
		// B6
		else if (baseCubeNum == 6){
			grid[0].push([1.02, 0.69, -0.2], [1.41, 0.69, -0.2], [1.8, 0.69, -0.2], [2.19, 0.69, -0.2], [2.58, 0.69, -0.2], [2.97, 0.69, -0.2]);
			grid = gridMaker(grid, 0.39);
		}
		return grid;
	}

	// populate grid with coordinates
	function gridMaker(coord_grid, increment_xcoord){
		for (var i=1; i<coord_grid.length; i++) {
			var prev_y = coord_grid[i-1][0][1];
			var prev_x = coord_grid[i-1][0][0];
			prev_y += 0.39;
			for (var j=0; j<baseCubeNum; j++){
				coord_grid[i].push([prev_x, prev_y, -0.2]);
				prev_x += increment_xcoord;
			}
		}
		return coord_grid;
	}

	function guiBtn (scene, name) {
		// retrieve coordinates for grid
		var allCoords = gridData();
		
		// counter for grid index 
		var layerCounter = 0;

		//  button stuff
	var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
	var button = BABYLON.GUI.Button.CreateImageOnlyButton(name, "https://cdn.shopify.com/s/files/1/0185/5092/products/symbols-0173_800x.png?v=1369543613");
	button.width = "40px"
	button.height = "40px";
	button.color = "white";
		button.background = hostUrl + 'static/bryantest/white-wall.jpg';
		
		// on click event for the button
	button.onPointerUpObservable.add(function() {
			// xyz coordinates
			var xyz = allCoords[layerCounter];  // or 'row' counter!

			buttonIndex = parseInt(button.name);
			
			// placing the stack cubes on the scene

			// update positions of the buttons and place stacking cubes
			if (baseCubeNum >= 1 && baseCubeNum <= 6){
				importStackCubes(scene, xyz[buttonIndex-1][0], xyz[buttonIndex-1][1], xyz[buttonIndex-1][2]);
				button.moveToVector3(new BABYLON.Vector3(xyz[buttonIndex-1][0], xyz[buttonIndex-1][1]+0.295, 0), scene);
				layerCounter += 1;
			} 
		});
		
	advancedTexture.addControl(button);
	return button;
	} 

	// import stacking cubes 
	function importStackCubes(scene, x, y, z) {
		console.log("[INFO] Imported stack asset mesh"); 
		BABYLON.SceneLoader.ImportMesh("", "http://123sense.com/static/bryantest/", "E1-final.babylon", scene, 
		function (stackcube) {
			stackcube[0].position.x = x;
			stackcube[0].position.y = y;
			stackcube[0].position.z = z;
			stackcube[0].rotation.y = Math.PI/2;
		});
	}

	// create box material and assign wide to all boxes which are imported in .babylon format 
	// should be more efficient since we reference to a single texture image file for all boxes (cache friendly also)
	// note that only this product configurator loads babylon files directly.  
	function createboxMaterial (scene) {
		// create box material
		var boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
		var boxMaterialUrl = hostUrl + 'static/bryantest/walnut-fine-wood.jpg'; 
		boxMaterial.diffuseTexture = new BABYLON.Texture(boxMaterialUrl,scene);
		//boxMaterial.ambientTexture = new BABYLON.Texture(boxMaterialUrl,scene);

		return boxMaterial; 
	}



	function importPlusMesh(scene){
	console.log("[INFO] Imported plus mesh"); 
	BABYLON.SceneLoader.ImportMesh("", "http://123sense.com/static/bryantest/", "plus_001-final.babylon", scene, 
	function (plus_001) {
		plus_001[0].position.x = 2;
		plus_001[0].position.y = 0.6;
		plus_001[0].position.z = -0.1;
		plus_001[0].rotation.y = Math.PI/2;
		make3DButton(plus_001[0]);
	});
	}

	function make3DButton(mesh){
	var pushButton = new BABYLON.GUI.MeshButton3D(mesh, "pushButton");
	pushButton.pointerEnterAnimation = () => {
		mesh.material.albedoColor = new BABYLON.Color3(0.25, 0.19, 0.26);
	};
	pushButton.pointerOutAnimation = () => {
		mesh.material.albedoColor = new BABYLON.Color3(0.5, 0.19, 0);
	};
	pushButton.onPointerDownObservable.add(() => {
		console.log(pushButton.name + " pushed.");
	});
	}

	function displayCube(scene){
	var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 512, scene, true);
    dynamicTexture.hasAlpha = true;
    var text = "E1"; 
    var ctx =  dynamicTexture.getContext();
    var font = "10px arial";
    ctx.font= font; 
    var width = ctx.measureText(text).width;
    dynamicTexture.drawText(text, 256 - width/2, 52, font, "lightblue", "");
    dynamicTexture.uScale = 1;
    dynamicTexture.vScale = 0.125;
    dynamicTexture.update(false);

    var result = BABYLON.Mesh.CreatePlane("nameplate", 10, scene, false);
    result.rotation.x = Math.PI;
    result.scaling.y = 0.125;
	result.position = new BABYLON.Vector3(3, 2, -1)
    var mat = new BABYLON.StandardMaterial("nameplateMat", scene);
    mat.diffuseTexture = dynamicTexture;
    mat.backFaceCulling = false;

    result.material = mat;	
	}