/*
EZBO Stacking Cube Product Configurator Web App v2
*/
// GLOBAL Cube counter
// start from index tracking of 0 . only +1 whenever a cube has been added. this is to primarily give the cubes their id and name when imported to scene
var cubeCtr= 0; 

// trackers for base cube
var basecubeArray = []; // to track the base cubes in the scene
var basecubePos =[]; // to keep track of 1:1 position in euler coords (i.e. 0.1,0.25 etc etc) 

// trackers for stackcube
var stackcubeArray = []; // to track the stack cubes in the scene 

// trackers for accesories 
var accesoryArray = []; // to track the accesories 

// some global constants 
var postfix = "-final.babylon"; // define postfix for end of mesh file names
var constZ = -0.3; // in meters, the constant global z position of all cubes 
var boxgridWidth = 0.3835; // in mtrs, the defined grid system box element width 

// INITALIZATION 
// assign basecubes file prefix for auto import of mesh into the scene.
var bcubesPrefix_init = 'B1'; // can be B1-B6, as passed by django view

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

     console.log(scene.meshes); 

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

     // Load base cubes and enable modifications to the base cubes 
     importBaseCubes(scene, gridMat, bcubesPrefix_init, 0,0, 'init');

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
          var xpos = horOffset + 0.01*cn + boxgridWidth*(cn-1) + (boxgridWidth/2); // horizontal coord w.r.t origin
          // note: just set a fixed number for orthogonal coord (in and out of page)
          var zPos = constZ; // constant w.r.t. origin, set at global vars at the beginning 
          return [xpos, ypos, zPos]; // return as array
     }
     
     // Build the matrix of coordinates
     for (var i=0; i < nrows; i++) { 
          for (var j=0; j < ncols; j++) {
               // compute the required x and y coords 
               // make sure to do i+1 and j+1 since calcposXYFunc requires rn , cn which are real world cube stratification starting from 1
               var tempvar = calcposXYFunc(i+1,j+1); 
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
     NOTE THAT THIS IS THE ONLY FUNCTION THAT CAN IMPORT BASE CUBES 
*/
function importBaseCubes(scene,gridMat,bcubesPrefix,rx,cy,type) { 

     // bcubesPrefix is the base cube product name for revisions i.e. addition/removal

     // rx and cy are the respective row column position in gridMat (starting from index zero for gridMat) 
     // RECALL ..i.e. with regards to gridMat, we take the first position at physical-box 1,1 or in the matrix as 0,0 index

     // IMPORTANT -- TYPE arg
     // type is to flag it as 'init' or 'next' or 'quick' base cube. in order to initialize a default base cube with its btns then use 'init'. 
     // else if for any other base cube import from clicking the horizontal buttons, use 'next' 
     // to use simple importing of mesh, use 'quick' 

     // IMPORTANT -- flagImp arg
     // is to flag it either null (should be default), 

     // concat with the constant global postfix
     var bcubename = bcubesPrefix + postfix; 

    // SceneLoader.ImportMesh
    // Loads the meshes from the file and appends them to the scene
    console.log("[INFO] Imported B3 asset mesh"); 
    BABYLON.SceneLoader.ImportMesh("", "http://123sense.com/static/bryantest/", bcubename, scene, 
     function (newMeshes) {

          // dirty hack to get around not being able to assign name and id to mesh
          var newMesh = newMeshes[0]; 

          if (type == 'init') {
               // initial base cube

               // give the mesh a unique ID (do this for every 'if')
               newMesh.id = String(cubeCtr); 
               newMesh.name = String(cubeCtr); 

               // get base cube integer from prefix
               var intprefix = parseInt(bcubesPrefix[1]); 

               // get modulus to see if it is odd or even
               // if it is 1, then just import as is without offset to grid
               // this is to ensure that the boxes fit the grid logic and 'start' at the btmmost left
               if (intprefix == 1) {
                    newMesh.position.x = gridMat[rx][cy][0]; // recall, row index, col index
                    newMesh.position.y = gridMat[rx][cy][1];
                    newMesh.position.z = gridMat[rx][cy][2];
               } else {
                    if (intprefix % 2 == 0) {
                         // if it is even i.e. 2,4,6, then move to right by (intprefix-1)*boxgridWidth
                         newMesh.position.x = gridMat[rx][cy][0] + ((intprefix-1)*boxgridWidth/2); 
                         newMesh.position.y = gridMat[rx][cy][1];
                         newMesh.position.z = gridMat[rx][cy][2];
     
                    } else {
                         // else if it is odd i.e. 3,5 then move to right by (floor(intprefix/2))*boxgridWidth
                         newMesh.position.x = gridMat[rx][cy][0] + (boxgridWidth*Math.floor(intprefix/2)); 
                         newMesh.position.y = gridMat[rx][cy][1];
                         newMesh.position.z = gridMat[rx][cy][2];
                    }
               }

               // assign horizontal buttons related to this base cube configuration using btn_BaseHorInit callback 
               // hard code the logic here for each base cube B1-B6. no need to do automated loop...it makes it more heavy!
               switch(intprefix) {
                    case 1: // for B1, we will have five pluses to its right, each at the native grid (no mods)
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,1);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,2);
                         horBtn_3 = btn_BaseHorInit (scene, gridMat, 3, 0,3);
                         horBtn_4 = btn_BaseHorInit (scene, gridMat, 4, 0,4);
                         horBtn_5 = btn_BaseHorInit (scene, gridMat, 5, 0,5);
                         break; 
                    case 2: // for B2, we will have four pluses to its right
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,2);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,3);
                         horBtn_3 = btn_BaseHorInit (scene, gridMat, 3, 0,4);
                         horBtn_4 = btn_BaseHorInit (scene, gridMat, 4, 0,5);
                         break; 
                    case 3: 
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,3);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,4);
                         horBtn_3 = btn_BaseHorInit (scene, gridMat, 3, 0,5);
                         break; 
                    case 4:
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,4);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,5);
                         break; 
                    case 5:
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,5);
                         break; 
                    default:
                         break; // case 6 has zero horizontal pluses 
               }

               // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
               basecubeArray.push(bcubesPrefix);
               basecubePos.push([newMesh.position.x,newMesh.position.y,newMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
               cubeCtr = cubeCtr +  1; 

          } else if (type=='quickADD') { // this is a general purpose mesh import subroutine for internal use within importbasecube

               // IMPORTANT NOTICE!--> in this case of 'quick', 
               //             the rx cy args are euler coordinates! NOT gridMat index! (see rx_coord / cy_coord args input in quick callback)

               // give the mesh a unique ID (do this for every 'if')
               newMesh.id = String(cubeCtr); 
               newMesh.name = String(cubeCtr); 

               // give mesh position based on rx_coord and cy_coord


               // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
               basecubeArray.push(bcubesPrefix);
               basecubePos.push([newMesh.position.x,newMesh.position.y,newMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
               cubeCtr = cubeCtr +  1; 

          } else if (type == 'nextLOGIC') {

               // next we need to check the position of this cube whether or not it is next door to any other cube
               /*
               ADVANCED LOGIC, USING THE GLOBAL BASECUBE TRACKING ARRAYS : 
               After adding the base cube B1, lets check if it is in proximity to any other cubes and aggregate them
                i.e. if added B1 is close to another B1 then it becomes B2 ... if added B1 is close to another B2 then it becomes B3.
                RULE: (use only the x-y plane, since this logic is for horizontal cubes only)
                    1. Find neighbouring cube to the newly imported B1. Near is defined by a tolerance constant. 
                         1.1 If there is only one neighbouring cube i.e. to the right or left, whichever...
                              1.1.1 Then check this neighbour's basecubeprefix, and feed them both into the combinatory logic callback
                         1.2 If there are two neighbouring cube (this is maximum possible!)
                              1.2.1 Then check these neighbour's basecubeprefix, and feed them both into the combinatory logic callback
               */

               // NOTE: no need to name the mesh or add it to the master array yet here. 

               // define the imported B1 cube's coordinates as newXXXX
               var newX = gridMat[rx][cy][0]; 
               var newY = gridMat[rx][cy][1];
               var newZ = gridMat[rx][cy][2]; // actually Z is constant...see how gridMat is defined! 
               // also use these coords as the reference 

               // evaluate newly imported B1 against its neighbours via looping basecubePos array. 
               // IMPORTANT! --> we use the gridmat NOT the actual cube dimensions!
               var MEASURE_UPPER = boxgridWidth + 0.05; // upper bound c-c grid hor spacing
               var MEASURE_LOWER = boxgridWidth - 0.05; // lower bound c-c grid hor spacing

               // predefine BLeft and BRight (the flanking cubes, if any) as empty strings
               var BLeft = '';
               var BRight = ''; 
          
               // loop through basecubePos's x-y coordinates to check if the difference between them is within the MEASURE range bound which means they are neighbours
               for (var i=0; i < basecubePos.length; i++) {
                    // extract the x-y coord for every other cube in the array
                    var xExist = basecubePos[i][0];

                    // check if this existing active cube is left to the new B1 import (meaning the existing active cube has lower x value)
                    if (newX > xExist && (newX - xExist) >= MEASURE_LOWER && (newX - xExist) <= MEASURE_UPPER) {
                         
                    } else if (xExist > newX && (newX - xExist) >= MEASURE_LOWER && (newX - xExist) <= MEASURE_UPPER) { // or check if this existing active cube is right to the new B1 import 

                    } // else dont kacau! 
                    
                    // find the median coordinate (horizontal) for the composite cube 
                    // and define them as rx_coord , cy_coord

               }

               // if BLeft or BRight is not '' , then there is a match so we ...
               if (BLeft != '' || BRight != '') {

                    // pass it through the combinatory callback func --> prefixbaseCubeComb -- to get the new cube prefix
                    // simply override the bcubesPrefix
                    bcubesPrefix = prefixBaseCubeComb ('B1', BLeft, BRight); 

                    // destroy the new B1 (since this is new import of basecube it MUST be B1! if not check the callback bug!) newMesh obj
                    newMesh.dispose(); newMesh = null; // nullify to tell GC to collect 

                    // similarly destroy all 'old' jointed existing meshes
                    

                    // and then import the new base cube in its new adjusted position by calling back importBaseCubes with type=='quickADD'
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                    // NOTE : no need to update global counter here since the importBaseCubes quickLOGIC
                    importBaseCubes(scene,gridMat,bcubesPrefix,rx_coord,cy_coord,'quickADD');

               } else if (BLeft == '' && BRight == '') {
                    // else if both are still '', meaning no match so we can do business as usual and place the new B1 at the grid box r-c center 
                    newMesh.position.x = newX; // recall, row index, col index
                    newMesh.position.y = newY;
                    newMesh.position.z = newZ; // actually Z is constant...see how gridMat is defined! 

                    // give the mesh a unique ID (do this for every 'if')
                    newMesh.id = String(cubeCtr); 
                    newMesh.name = String(cubeCtr); 

                    // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
                    basecubeArray.push(bcubesPrefix);
                    basecubePos.push([newMesh.position.x,newMesh.position.y,newMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
                    cubeCtr = cubeCtr +  1; 
               }

          } else {
               console.log('[ERROR] Unrecognized type for function importBaseCubes passed via args type');
          }
          
          // define mesh rotation
          newMesh.rotation.y = Math.PI/2;
          
          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          newMesh.material = boxMaterial;
     }); 
}


/*
     Product combinatory stuffs 
*/
// for the base cubes business logic combinations (i.e. B1 + B1 is B2, B1 + B2 is B3, etc)
// takes maximum three args, the string type base cube prefixes of ... 
//   -- BNew (the new B1 imported), BLeft (identified left flanking cube), BRight (identified right flanking cube)
// IMPORTANT RULE
//   -- IF NO MATCH i.e. BRight has no match, then it should be assigned as 'B0' during callback! 
//   -- During callback, BNew is typically 'B1'! 
function prefixBaseCubeComb (BNew, BLeft, BRight) {

     // add them up together 
     var compositeIntStr = String(parseInt(BNew[1]) + parseInt(BLeft[1]) + parseInt(BRight[1])); 

     // compose the B-prefix
     var compositePrefix = 'B' + compositeIntStr;

     // return the new combination prefix , this is a string !
     return compositePrefix; 
}


/*
     Button stuffs, as callbacks into cube functions 
*/
// for the base cubes' horizontal pluses , use once for initialization of the default base cube only! 
function btn_BaseHorInit (scene, gridMat, btnInt, rx_target,cy_target) {

     // this deserves its own callback since at the start, the pluses are added for the remaining base cube spaces
     // i.e. if initially the 6cube base is imported, then no plus! 

     // horizontal btns for the base cubes manipulation
     // this will add a base cube at the plus position that is being clicked. 
     // will be initialized alongside the first base cube import

     // btnInt can only be an integer and it is to serve as a unique number for each button
     // no need to track the button index for the horizontal cubes since its permutations are very small 
     
     //  button stuff
     var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
     var button = BABYLON.GUI.Button.CreateImageOnlyButton(btnInt, "https://cdn.shopify.com/s/files/1/0185/5092/products/symbols-0173_800x.png?v=1369543613");
     button.width = "40px";
     button.height = "40px";
     button.color = "white";
     button.background = hostUrl + 'static/bryantest/white-wall.jpg';

     // position the button at rx_target and cy_target, using gridMat, unmodified
     
     // on click event for the button
     button.onPointerUpObservable.add(function() {
         
          // importBaseCubes(scene,gridMat,bcubesPrefix,rx,cy) -- > recall this is the callback to import base cubes and use 'next' as type! 
          // remove the button and in its place, put the base cube B1
          button.dispose(); 
          importBaseCubes(scene,gridMat,'B1',rx_target,cy_target,'nextLOGIC'); 
     });

     advancedTexture.addControl(button);
     button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], 0), scene);

     return button;
}


/*
     Mesh cube removal, highlight and manipulation stuffs
*/
// https://doc.babylonjs.com/babylon101/picking_collisions for picking meshes


// this is a function to highlight cube mesh based on pointer event
// inspired by https://playground.babylonjs.com/#TC2K69#1
function evtCubeHighlighter() {
     return 0; 
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


