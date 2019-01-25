/*
EZBO Stacking Cube Product Configurator Web App v2
*/

var basecubeArray = []; // to track the base cubes in the scene
var basecubeCounter = 0; // this is updated +1 whenever a base cube is added into the scene , think of it as primary key in sql to track basecubeArray 
                         // it will also be the single source of truth to name the buttons

var stackcubeArray = []; // to track the stack cubes in the scene
var accesoryArray = []; // to track the accesories 

var postfix = "-final.babylon"; // define postfix for end of mesh file names
var constZ = -0.3; // in meters, the constant global z position of all cubes 

// assign basecubes file prefix for auto import of mesh into the scene. (user will work upon this initialization)
var initBaseCube= 1; // base cube initialization case, 1-6 , this will be adviced by the django view
switch (initBaseCube) {
     case 1:
          var bcubesPrefix_init = 'B1'; break;
     case 2:
          var bcubesPrefix_init = 'B2'; break;
     case 3:
          var bcubesPrefix_init = 'B3'; break; 
     case 4:
          var bcubesPrefix_init = 'B4'; break; 
     case 5:
          var bcubesPrefix_init = 'B5'; break; 
     case 6:
          var bcubesPrefix_init = 'B6'; 
}

// Check if  browser supports webGL
if (BABYLON.Engine.isSupported()) {

     // if it does, declare all the global variables outside mainApp func 
     var canvas = document.getElementById("main_app");
     // note to create with engine with stencil set to true so we can highlight a mesh
     var engine = new BABYLON.Engine(canvas, true, { stencil: true });  // this is the Babylon class engine 
 
     // declare globally accesible variable of host url (for later concat)
     var hostUrl = 'http://123sense.com/'; 
 
     // make sure DOM is loaded first 
     window.addEventListener('DOMContentLoaded', function() {
          // then run the main app's code
          mainApp(); 
     }); 
 
 } else {
     // display error message
     console.log('ERROR: WebGL support is required!')
     // alert user
     window.alert("webGL is not enabled on this browser. \
                    Please edit your browser settings to enable webGL")
     // redirect after 5 seconds to home page....
     // redirect here! ?
 } 

 // assets are either computed or imported  
function mainApp() {

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

// create the room scene which will be served to the user
// Useful --> https://playground.babylonjs.com/#4G18GY#7 --> extruded polygon
function createRoomScene() {

     console.log('[INFO] Room mesh created by computation');
     console.log('[INFO] Cube mesh imported as babylon files');
	
	// create the scene 
	var scene = new BABYLON.Scene(engine);
     
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
     
     // define the mathematical grid to arrange cubes. call once only!
     var gridMat = gridEngine(); 

     // Load base cubes and enable modifications
	importBaseCubes(scene, gridMat, bcubesPrefix_init, 0,0);
     
     // Load buttons and text


    // finally ... 
    return scene; 
}

// ----------------------------------------------------------------------------------------------------------------
// FUNCTION CALLBACKS

// create the camera
function createCamera(scene) {
    
     // limited arc rotate
     // note its coords are always defined in alpha, beta and radius .. https://doc.babylonjs.com/babylon101/cameras
     // Parameters: name, alpha, beta, radius, target position, scene 
     var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI/2, Math.PI/2, 4, new BABYLON.Vector3(2,1.25,0), scene); 
     camera.attachControl(canvas, true);
     // set limits to camera movement so users dont get disorganized 
     camera.lowerRadiusLimit = 4;
     camera.upperRadiusLimit = 4; 
     camera.lowerAlphaLimit = -1.8; // rmbr this is radians!  
     camera.upperAlphaLimit = -1.3; 
     camera.lowerBetaLimit = 1.35; 
     camera.upperBetaLimit = 1.75; 

     // totally deactivate panning (if developer requires to see beyond cube, comment this out in development)
     scene.activeCamera.panningSensibility = 0;
     scene.activeCamera = camera; // set it as active viewport
     
     /* for testing only
     var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, Math.PI/2, 4.5, new BABYLON.Vector3(2,1.25,0), scene); 
     camera.attachControl(canvas, true);
     */

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
     var wallTextureUrl = hostUrl + 'static/bryantest/white-wall.jpg'; 
     //wallMaterial.diffuseTexture = new BABYLON.Texture(wallTextureUrl,scene);
     wallMaterial.ambientTexture = new BABYLON.Texture(wallTextureUrl,scene);
     // apply the material to meshes
     backwall.material = wallMaterial;
     sidewall_r.material = wallMaterial;
     sidewall_l.material = wallMaterial;
 }


// --------------------------------------------------------------------------------------------------------------------------------
// Define Grid Data for 6 cubes, with a maximum height of circa 2.5m ~ max 7 stacked rows
// This implies a matrix of size 7,6, with each matrix element being an array of length 3 (X,Y,Z)
// REMINDER: ALL UNITS IN METERS! 

// Lets define the grid! call this only once at the begining to init the data! 
function gridEngine () {
     var rn; // row number 
     var cn; // column number --> as per convention described in the formulation of universalee method

     // set horizontal local coord system w.r.t. global origin
     // this will define where the cubes start stacking up (i.e. left most (viewer p.o.v.) cube position)
     var horOffset = 1; 

     // initialize empty 2d array with 7 rows and store in memory
     var matCoords = Create2DArray(7);  // so we play with 'push' later
     // matrix size
     var nrows = 7; 
     var ncols = 6; 

     // EQN definition 
     // this is valid for the ezbo stacking cubes dimensions 
     // tightly coupled with the domain data i.e. dimensions, etc. if domain change, eqn will change as well 
     function calcposXYFunc(rn,cn) {
          var ypos = 0.1 + 0.195 + 0.39*(rn-1); // vertical coord w.r.t. origin
          var xpos = horOffset + 0.01*cn + 0.3835*(cn-1) + 0.19175; // horizontal coord w.r.t origin
          // note: just set a fixed number for orthogonal coord (in and out of page)
          var zPos = constZ; // constant w.r.t. origin, set at global vars at the beginning 
          return [xpos, ypos, zPos]; // return as array
     }
     
     // Build the matrix of coordinates
     for (var i=0; i < nrows; i++) { 
          for (var j=0; j < ncols; j++) {
               // compute the required x and y coords 
               // make sure to do i+1 and j+1 since calcposXYFunc requires rn , cn which are real world cube stratification starting from 1
               let tempvar = calcposXYFunc(i+1,j+1); 
               // console.log(tempvar);
               matCoords[i].push(tempvar); 
          }
     }

     // return the matrix
     //console.log(matCoords); 
     return matCoords; 
}

// support func to create 2d arrays, since javascript only supports 1d
// specify number of rows. columns will be specified as push lateron for specific purposes 
function Create2DArray(rows) {
     var arr = [];
   
     for (var i=0;i<rows;i++) {
        arr[i] = []; // initialize with empty array where we can push elements into (this will be the column store)
     }
   
     return arr;
}


// --------------------------------------------------------------------------------------------------------------------------------
// Import and handling of the cubes 

// first, define the cube materials
// should be efficient since we reference to a single texture image file for all boxes (cache friendly also)
// note that only this product configurator loads babylon files directly.  
function createboxMaterial (scene) {
     // create box material
      var boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
      var boxMaterialUrl = hostUrl + 'static/bryantest/walnut-fine-wood.jpg'; 
      boxMaterial.diffuseTexture = new BABYLON.Texture(boxMaterialUrl,scene);
     //boxMaterial.ambientTexture = new BABYLON.Texture(boxMaterialUrl,scene);
 
     return boxMaterial; 
 }

/*
     Import base cabinet cubes , reposition into the scene, at the far left corner of an imaginary maximum 6 cube space
     User should be able to modify the base cubes 
*/
function importBaseCubes(scene,gridMat,bcubesPrefix,rx,cy) { 

     // bcubesPrefix is the base cube product name for revisions i.e. addition/removal
     // rx and cy are the respective row column position in gridMat (starting from index zero for gridMat) 
     // RECALL ..i.e. with regards to gridMat, we take the first position at physical-box 1,1 or in the matrix as 0,0 index

     // concat with the constant global postfix
     var bcubename = bcubesPrefix + postfix; 

    // SceneLoader.ImportMesh
    // Loads the meshes from the file and appends them to the scene
    console.log("[INFO] Imported B3 asset mesh"); 
    BABYLON.SceneLoader.ImportMesh("", "http://123sense.com/static/bryantest/", bcubename, scene, 
     function (newMesh) {

               // do something with the meshes (no particles or skeletons in this case)

               // define euler position of base cube (meters)          
               newMesh[0].position.x = gridMat[rx][cy][0]; // recall, row index, col index
               newMesh[0].position.y = gridMat[rx][cy][1];
               newMesh[0].position.z = gridMat[rx][cy][2];
               
               // define mesh rotation
               newMesh[0].rotation.y = Math.PI/2;
               
               // define mesh rotation
               var boxMaterial = createboxMaterial(scene); 
               newMesh[0].material = boxMaterial;

               // update global counter for base cubes and its counter
               basecubeArray.push(bcubesPrefix);
               basecubeCounter += 1; // important to update this global tracker
     }); 
}


/*
     Button stuffs
*/
function guiBtn_BaseInit (scene, gridMat, bcubesPrefix,rx,cy) {

     // this deserves its own callback since at the start, the pluses are added for the remaining base cube spaces
     // i.e. if initially the 6cube base is imported, then no plus! 

     // horizontal and vertical buttons for the base cubes manipulation
     // this will add a base cube at the plus position that is being clicked. 
     // will be initialized alongside the first base cube import  (*bcubesPrefix* refers to the base cube on first import)
     
     //  button stuff
     var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
     var button = BABYLON.GUI.Button.CreateImageOnlyButton(name, "https://cdn.shopify.com/s/files/1/0185/5092/products/symbols-0173_800x.png?v=1369543613");
     button.width = "40px";
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
               importBaseCubes(scene, xyz[buttonIndex-1][0], xyz[buttonIndex-1][1], xyz[buttonIndex-1][2], "E2");
               // position button
               button.moveToVector3(new BABYLON.Vector3(xyz[buttonIndex-1][0], xyz[buttonIndex-1][1]+0.295, 0), scene);
               layerCounter += 1;
          } 
     });

     advancedTexture.addControl(button);
     return button;
}


/*
     Now it is time to define Imports of stacking cubes !! 
*/

// callback function to import stacking cubes
// import stacking cubes 
function importStackCubes(scene, x, y, z, stackprefix) {
     console.log("[INFO] Imported stack asset mesh"); 

     // count number of stack cubes
     var cubeName = stackprefix + postfix; // name of cube to be imported

     // 
     var cubeID = parseInt(prefix[1]);		
     stackCubeCounter[cubeID-1] = stackCubeCounter[cubeID-1] + 1;
     
     BABYLON.SceneLoader.ImportMesh("", "http://123sense.com/static/bryantest/", cubeName, scene, 
     function (stackcube) {
          stackcube[0].position.x = x;
          stackcube[0].position.y = y;
          stackcube[0].position.z = z;
          stackcube[0].rotation.y = Math.PI/2;
     });
}


