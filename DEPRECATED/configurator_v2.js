/*
EZBO Stacking Cube Product Configurator Web App v2
*/
// Use CDN for static files i.e. https://stagingfiles.sgp1.digitaloceanspaces.com/ezbo/<filename>

// trackers for base cube - the B series
var basecubeArray = []; // to track the base cubes in the scene by name i.e. B1 etc
var basecubePos = []; // to keep track of 1:1 position in euler coords (i.e. 0.1,0.25 etc etc) 
// basecubeCtr start from index tracking of 0 . only +1 whenever a base cube has been added. this is to primarily give 
// the cubes their id and name when imported to scene
var basecubeCtr = 0; 
// trackers for accesories for the base cubes 
// this includes the X shelving, .. table ... etc 
// this will follow the basecube trackers 1:1. on initial cube import, there will be NO accesory so in such case default to 0
// these can be nested arrays too! i.e. if a composite base cube i.e. B5 has 5 different accesories .. so single index store a nested array containing all 5 accesories
var baseAccesoryArray = []; // to track the accesories in the scene (use basecubeCtr)
var baseAccesoryPos = []; 
// this index is created as global var in order for it to be called from outside this js file
// purpose is to serve as a holding variable of selected basec cube mesh index/id/name *same thing! 
var baseIndex = 0; 
// other base cube global vars/arrays 
var basecubeName; // used to identify which cube to import accessory to
// price of base cube in USD
var basePrices = [["B1", 7.6], ["B2", 10.9], ["B3", 14.5], ["B4", 18.5], ["B5", 22.4], ["B6", 26.3]];
var totalBasecubes; // total price of base cubes global var

/*
SPECIAL remark for stackcubes.
 - user will only be able to import E1 into the canvas
 - we do not graphically include the advanced logic i.e. detection of ES6.5 etc
 - but nonetheless, must track these configuration by giving user the option to add 'planks' to join compatible stack cubes
 - and also track in the background, the actual stack cube inventory..i.e. E3 E4 E6 ES6.5 etc for costing and checkout
*/
// trackers for stackcube - the E series
var stackcubeArray = []; // to track the stack cubes in the scene by name i.e. E1 etc
var stackcubeCtr = 0; // for mesh naming (unique id and name)
var stackcubePos = []; // track 1:1 position in euler coords in tandem with the above two 
// trackers for accesories for the stack cubes. this will follow the stackcube trackers 1:1 (use stackcubeCtr)
var stackAccesoryArray = []; 
var stackAccesoryPos = []; 
// this index is created as global var in order for it to be called from outside this js file. 
// purpose is same as above baseIndex variable
var stackIndex = 0; 
// other stack cube global vars/arrays
var stackcubeName; // used to identify which cube to import accessory to
// stack cube prices in USD
var stackPrices = [["E1", 6.3], ["E2", 8.8], ["E3", 10.6], ["E4", 13.5], ["E5", 16.2], ["E6", 19]];
var totalStackcubes; // total price of stackcubes 

// Accesories global vars
// assign accesories that can be imported into the scene
// this is a nested array containing the accesories' programming code names and another array containing their respective actual names
var accesoryList = [
     ['XS','DS','SS','NS','DD','TA','SB','DO'], // all are made two lettered to be convinient 
     ['X-Shelve', 'Double-Shelve' , 'Single-Shelve', '9-box-Shelve', 'Double-drawer', 'Table', '6-box-shelving', 'Door'],
];
// accesory prices in USD 
var accessoryPrices = [["XS", 3.6], ["DS", 6.8], ["SS", 5.2], ["NS", 4.8], ["DD", 8.4], ["TA", 20], ["SB", 4], ["DO", 6]];
var totalBaseAccessories;
var totalStackAccessories;

// some global constants 
var postfix = "-final.babylon"; // define postfix for end of mesh file names
var constZ = -0.3; // in meters, the constant global z position of all cubes 
var boxgridWidth = 0.3835; // in mtrs, the defined grid system box element width 

// DJANGO INITALIZATION ... 

// assign basecubes file prefix for auto import of mesh into the scene.
// but when integrated with the ezbo django app, this will be loaded from session storage 
var bcubesPrefix_init = 'B1'; // can be B1-B6, as passed by django view

var price = 0;// init price

/* LETS BEGIN */ 

// ---------------------------------------------- GAME START ------------------------------------------------// 
// Check if  browser supports webGL
if (BABYLON.Engine.isSupported()) {

     // if it does, declare all the global variables outside mainApp func 
     var canvas = document.getElementById("main_app");
     // note to create with engine with stencil set to true so we can highlight a mesh
     var engine = new BABYLON.Engine(canvas, true, { stencil: true });  // this is the Babylon class engine 
     
     // declare globally accesible variable of host url (for later concat)
     var hostUrl = 'https://stagingfiles.sgp1.digitaloceanspaces.com/ezbo/'; 
     
     // make sure DOM is loaded first 
     window.addEventListener('DOMContentLoaded', function() {
          // then run the main app's code
          mainApp(); 
     }); 
 
 } else {
     // display error message
     console.log('ERROR: WebGL support is required!'); 
     // alert user
     window.alert("webGL is not enabled on this browser. \
                    Please edit your browser settings to enable webGL"); 
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

     // also initiate event listener for accesory imports base and stack cubes
     // base cube 
     window.addEventListener("importAccessoryBase", function() {
          var specificcubeNum = id; // this is passed from html jquery when user clicks btn
          // recall specificcubeNum refers to the local cube number 
          importBaseAccesories(scene, asstype, basecubeName, specificcubeNum);
     });
     /*
     // stack cube 
     window.addEventListener("importAccessoryStack", function() {
          var specificcubeNum = id;
          importStackAccesories(scene, asstype, stackcubeName, specificcubeNum);
     }); */

    // finally ... 
    return scene; 
}

// ----------------------------------------------------------------------------------------------------------------
// FUNCTION CALLBACKS

// create an event with keyword arg 'type'. to be picked up by other js , even those outside this script
function makeEvent(type){
     var event = document.createEvent("event");
     event.initEvent(type, true, true);
     window.dispatchEvent(event);
 }

// calculate prices callback
function calcPrice(prices, items){
     var total = 0;
     for (var i=0; i<items.length; i++){
         if (items[i] != 0){
             for (var j=0; j<prices.length; j++){
                 if (prices[j][0] == items[i]){
                     total += prices[j][1];
                 }
             }
         }
     }
     return total;
 }   

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
     var floorTextureUrl = hostUrl + 'woodtexture.jpg'; 
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
     var roofTextureUrl = hostUrl + 'white-wall.jpg'; 
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
     var wallTextureUrl = hostUrl + 'white-wall.jpg'; 
     wallMaterial.diffuseTexture = new BABYLON.Texture(wallTextureUrl,scene);
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

// Define the cube materials
// should be efficient since we reference to a single texture image file for all boxes (cache friendly also)
// note that only this product configurator loads babylon files directly.  
function createboxMaterial (scene) {
     // create box material
      var boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
      var boxMaterialUrl = hostUrl + 'walnut-fine-wood.jpg'; 
      boxMaterial.diffuseTexture = new BABYLON.Texture(boxMaterialUrl,scene);
     //boxMaterial.ambientTexture = new BABYLON.Texture(boxMaterialUrl,scene);
     
     return boxMaterial; 
}

// callback func for mesh under selection and control using actionManager
function meshSelectControl (scene, meshObj, color) {

     // color is a numeric string to specify color of highlight , must be supported by Babylon
     // 1 is to blue IMPORTANT -> (we take this as base cube flag)
     // 2 is to green IMPORTANT ->(we take this as stack cube flag)

     // attach actionmanager to the scene 
     meshObj.actionManager = new BABYLON.ActionManager(scene);

     // define highlight 
     var hl = new BABYLON.HighlightLayer("hl", scene);

     // register actions for highlight color
     meshObj.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(m){
               var mesh = m.meshUnderPointer;
               if (color=='1') {
                    hl.addMesh(mesh, BABYLON.Color3.Blue());
               } else if (color=='2') {
                    hl.addMesh(mesh, BABYLON.Color3.Green());
               } else {
                    console.log("ERROR - Color not supported!"); 
               }
          })
     ); 
     meshObj.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(m){
              var mesh = m.meshUnderPointer;
              hl.removeMesh(mesh); // remove highlight when out of pointer trigger
          })
     );     

     // register actions for modal popup upon click 
     meshObj.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, function(m){

               // get id of the selected mesh (which is the same as its name, so we can use them interchangably)
               var meshID = m.source.id; // note we expect E1-EXX (as unique id for each imported stack cube)
               if (color == '1') {
                    // then update global base cube id tracking (integer)
                    baseIndex =  parseInt(meshID.slice(1));
                    // and make the base cube event
                    makeEvent("popupBase");

               } else if (color =='2'){
                    // then update global stack cube id tracking (integer)
                    stackIndex =  parseInt(meshID.slice(1));
                    // and make the stack cube event
                    makeEvent("popupStack");
               }
         })
     );
}

/*
     Import base cabinet cubes , reposition into the scene, at the far left corner of an imaginary maximum 6 cube space
     User should be able to modify the base cubes 
     NOTE THAT THIS IS THE ONLY FUNCTION THAT CAN IMPORT BASE CUBES 
*/
function importBaseCubes_SUPP(scene,gridMat,bcubesPrefix,rx,cy) {
     // concat with the constant global postfix to give import name 
     var bcubename = bcubesPrefix + postfix; 
     var intprefix = parseInt(bcubesPrefix.slice(1)); // get the integer 6 out of B6 for instance. 

     BABYLON.SceneLoader.ImportMesh("", hostUrl, bcubename, scene, 
     function (newMeshes) {

          // dirty hack to get around not being able to assign name and id to mesh
          var newMesh = newMeshes[0]; 

          // this is a general purpose mesh import subroutine for internal use within importbasecube

          // IMPORTANT NOTICE!--> in this case of 'quick', 
          //      the rx cy args are euler coordinates! NOT gridMat index! (see rx_coord / cy_coord args input in quick callback)
          //      we will just reuse the rx cy args only  
          // give the mesh a unique ID (do this for every 'if')
          newMesh.id = String('B' + basecubeCtr); 
          newMesh.name = String('B' + basecubeCtr); 
          // give mesh position based on rx == rx_coord and cy == cy_coord
          // REMINDER: STUPID! THIS IS THE PROBLEM OF ALL MOTHERFUCKERS! 
          // RX AND CY IN THIS CASE ARE THE COORDINATES! DIRECTLY , NOT THE GRID MAT MATRIX INDEXES
          newMesh.position.x = rx; 
          newMesh.position.y = cy;
          newMesh.position.z = gridMat[0][0][2]; // this one is constant for all base cubes 

          // define mesh rotation
          newMesh.rotation.y = Math.PI/2;
          
          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          newMesh.material = boxMaterial;

          // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
          basecubeArray.push(bcubesPrefix);
          basecubePos.push([newMesh.position.x,newMesh.position.y,newMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
          basecubeCtr = basecubeCtr +  1; 
          // update global base cube accesory in tandem, populate with empty array and empty matrix 
          // note: cant use zero here, since a basecube may have more than one accesory
          baseAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so initialize zero array
          baseAccesoryPos.push(new Array(intprefix).fill(0)); 
          
          // configure actionManager
          meshSelectControl (scene, newMesh,'1');

          // update price after importing an extra cube
          var curprice = calcPrice(basePrices, basecubeArray)
          totalBasecubes = curprice;

          // fire event to update html
          makeEvent("priceUpdate");
     }); 
}


function importBaseCubes(scene,gridMat,bcubesPrefix,rx,cy,type) { 

     // bcubesPrefix is the base cube product name for revisions i.e. addition/removal , such as B1, B2 etc 

     // rx and cy are the respective row column position in gridMat (starting from index zero for gridMat) 
     // RECALL ..i.e. with regards to gridMat, we take the first position at physical-box 1,1 or in the matrix as 0,0 index

     // IMPORTANT -- TYPE arg
     // type is to flag it as 'init' or 'next' or 'quick' base cube. in order to initialize a default base cube with its btns then use 'init'. 
     // else if for any other base cube import from clicking the horizontal buttons, use 'next' 
     // to use simple importing of mesh, use 'quick' 

     // IMPORTANT -- flagImp arg
     // is to flag it either null (should be default), 

     // concat with the constant global postfix to give import name 
     var bcubename = bcubesPrefix + postfix; 

    // SceneLoader.ImportMesh
    // Loads the meshes from the file and appends them to the scene
    BABYLON.SceneLoader.ImportMesh("", hostUrl , bcubename, scene, 
     function (newMeshes) {

          // dirty hack to get around not being able to assign name and id to mesh
          var newMesh = newMeshes[0]; 

          if (type == 'init') {
               // initial base cube

               // give the mesh a unique ID (do this for every 'if')
               newMesh.id = String('B' + basecubeCtr); 
               newMesh.name = String('B' + basecubeCtr); 

               // get base cube integer from prefix
               var intprefix = parseInt(bcubesPrefix.slice(1)); // slice the first letter which is B 

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

               // assign horizontal and vertical buttons related to this base cube configuration using appropriate callbacks 
               switch(intprefix) {
                    case 1: 
                         // for B1, we will have five pluses to its right, each at the native grid (no mods)
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,1);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,2);
                         horBtn_3 = btn_BaseHorInit (scene, gridMat, 3, 0,3);
                         horBtn_4 = btn_BaseHorInit (scene, gridMat, 4, 0,4);
                         horBtn_5 = btn_BaseHorInit (scene, gridMat, 5, 0,5);
                         // associated vertical
                         stackBtn_1 = btn_Stack(scene, gridMat, 1, 1, 0);
                         break; 
                    case 2: 
                         // for B2, we will have four pluses to its right
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,2);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,3);
                         horBtn_3 = btn_BaseHorInit (scene, gridMat, 3, 0,4);
                         horBtn_4 = btn_BaseHorInit (scene, gridMat, 4, 0,5);
                         // associated vertical
                         stackBtn_1 = btn_Stack(scene, gridMat, 1, 1, 0);
                         stackBtn_2 = btn_Stack(scene, gridMat, 2, 1, 1);
                         break; 
                    case 3: 
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,3);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,4);
                         horBtn_3 = btn_BaseHorInit (scene, gridMat, 3, 0,5);
                         // associated vertical
                         stackBtn_1 = btn_Stack(scene, gridMat, 1, 1, 0);
                         stackBtn_2 = btn_Stack(scene, gridMat, 2, 1, 1);
                         stackBtn_3 = btn_Stack(scene, gridMat, 3, 1, 2);
                         break; 
                    case 4:
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,4);
                         horBtn_2 = btn_BaseHorInit (scene, gridMat, 2, 0,5);
                         // associated vertical
                         stackBtn_1 = btn_Stack(scene, gridMat, 1, 1, 0);
                         stackBtn_2 = btn_Stack(scene, gridMat, 2, 1, 1);
                         stackBtn_3 = btn_Stack(scene, gridMat, 3, 1, 2);
                         stackBtn_4 = btn_Stack(scene, gridMat, 4, 1, 3);
                         break; 
                    case 5:
                         horBtn_1 = btn_BaseHorInit (scene, gridMat, 1, 0,5);
                         // associated vertical
                         stackBtn_1 = btn_Stack(scene, gridMat, 1, 1, 0);
                         stackBtn_2 = btn_Stack(scene, gridMat, 2, 1, 1);
                         stackBtn_3 = btn_Stack(scene, gridMat, 3, 1, 2);
                         stackBtn_4 = btn_Stack(scene, gridMat, 4, 1, 3);
                         stackBtn_5 = btn_Stack(scene, gridMat, 5, 1, 4);
                         break; 
                    default:
                         // case 6 has zero horizontal pluses 
                         // associated vertical 
                         stackBtn_1 = btn_Stack(scene, gridMat, 1, 1, 0);
                         stackBtn_2 = btn_Stack(scene, gridMat, 2, 1, 1);
                         stackBtn_3 = btn_Stack(scene, gridMat, 3, 1, 2);
                         stackBtn_4 = btn_Stack(scene, gridMat, 4, 1, 3);
                         stackBtn_5 = btn_Stack(scene, gridMat, 5, 1, 4);
                         stackBtn_6 = btn_Stack(scene, gridMat, 6, 1, 5);
                         break; 
               }

               // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
               basecubeArray.push(bcubesPrefix);
               basecubePos.push([newMesh.position.x,newMesh.position.y,newMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
               basecubeCtr = basecubeCtr +  1; 
               // base cube accesories in tandem...
               baseAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so push empty array
               baseAccesoryPos.push(new Array(intprefix).fill(0)); 

               // define mesh rotation
               newMesh.rotation.y = Math.PI/2;
          
               // define mesh material
               var boxMaterial = createboxMaterial(scene); 
               newMesh.material = boxMaterial; 

               // define cube actionManager
               meshSelectControl (scene, newMesh , '1');

               // update price after importing an extra cube
               var curprice = calcPrice(basePrices, basecubeArray);
               totalBasecubes = curprice;

               // fire an event to update html 
               makeEvent("priceUpdate");
               
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
              
               // define the imported B1 cube's coordinates
               var newX = gridMat[rx][cy][0]; 
               var newY = gridMat[rx][cy][1]; // this is a constant for base cubes , can just reuse this number
               var newZ = gridMat[rx][cy][2]; // actually Z is constant...see how gridMat is defined! 
               // also use these coords as the reference 

               // evaluate newly imported B1 against its neighbours via looping basecubePos array. 
               // IMPORTANT! --> we use the gridmat NOT the actual cube dimensions!
               var MEASURE_UPPER = boxgridWidth + 0.05; // upper bound c-c grid hor spacing
               var MEASURE_LOWER = boxgridWidth - 0.05; // lower bound c-c grid hor spacing
          
               // loop through basecubePos's x-y coordinates to check if the difference between them is within the MEASURE range bound which means they are neighbours
               // RUle is , a single B1 new import mesh can atmost have two neighbours i.e. Right and left 
               // so we first define the vars to hold temporary data/flag with regards to Right and Left 
               var RightExistCubePrefix = ''; // if found neighbour then this will be flagged 
               var RightExistCubePos = 0; 
               var RightExistCubeInd = 0; // this is the index of the basecube which we will use to manipulate the mesh later
               var LeftExistCubePrefix = ''; // 
               var LeftExistCubePos = 0; 
               var LeftExistCubeInd = 0; // this is the index of the basecube which we will use to manipulate the mesh later

               var rx_coordAdjust = 0; // this is the adjustment factor to the existing cube's horizontal coordinate
               for (var i=0; i < basecubePos.length; i++) { // note that we can also use i as the index tracker
                    
                    if (basecubeArray[i] != 0) { // if it is zero then it has been flagged as removed from scene so we IGNORE
                         var basecubeInt = parseInt(basecubeArray[i].slice(1)); // get the looped existing base cube number, by slicing out the 'B' letter
                         var BLeftX , BRightX; 
                         
                         if (basecubeInt == 1) {
                              // if it is base cube 1 then just use the position as is (i.e. single value for left right testing)
                              // extract the x coord
                              BLeftX = basecubePos[i][0];
                              BRightX = basecubePos[i][0];

                         } else if (basecubeInt > 1) { // if it is more than 1, then need to assign left and right x coordinate
                              // then use this formulae to figure out right most and left most cubes
                              var tempLimit = ((basecubeInt/2) - 0.5)*boxgridWidth; 
                              
                              // BRight by add to the centroid (cube mesh center) , recall all X coords
                              // for existing neighbour cubes
                              BRightX = basecubePos[i][0] + tempLimit;
                              // BLeft by subtract from the centroid (cube mesh center)
                              // for existing neighbour cubes 
                              BLeftX = basecubePos[i][0] - tempLimit; 
                         }    

                         
                         // check if this existing looped cube is left to the new B1 import (meaning the existing active cube has lower x value)
                         if (LeftExistCubePrefix == '' && newX > BRightX && (newX - BRightX) >= MEASURE_LOWER && (newX - BRightX) <= MEASURE_UPPER) {
                              // if the existing cube is left neighbour to the new B1 import, then...
                              // find the median coordinate (horizontal) for the composite cube 
                              // and define them as rx_coord , cy_coord
                              // note that if Left var is already populated , then it means that there is already one left match. 
                              //  ...   so this if statement will not pass, since we can only have one left neighbour for each B1 import 

                              // populate Left var with the basecubeprefix of the existing cube 
                              LeftExistCubePrefix = basecubeArray[i]; 
                              var cubemultiplierL = parseInt(LeftExistCubePrefix.slice(1));  
                              // populate associated X position (original)
                              LeftExistCubePos = basecubePos[i][0]; 
                              // populate the index with i. we need this to remove the mesh later
                              LeftExistCubeInd = i; 

                              // RULE is, for every existing cube to the left, we subtract boxgridWidth/2 to the NEW cube's mesh centroid
                              // BUG FIX - here we use 1.95 to prevent leftward drift of the base cube, small but noticeable! so use 1.95!
                              var rx_coordAdjust = rx_coordAdjust - (cubemultiplierL*(boxgridWidth/1.95));
                         
                         } // or check if this existing active looped cube is right to the new B1 import 
                         else if (RightExistCubePrefix == '' && BLeftX > newX && (BLeftX - newX) >= MEASURE_LOWER && (BLeftX - newX) <= MEASURE_UPPER) { 
                              // if the existing cube is right neighbour to the new B1 import,then ... 

                              // populate Left var with the basecubeprefix of the existing cube 
                              RightExistCubePrefix = basecubeArray[i];
                              var cubemultiplierR = parseInt(RightExistCubePrefix.slice(1)); 
                              // populate associated X position
                              RightExistCubePos = basecubePos[i][0]; 
                              // populate the index with i. we need this to remove the mesh later
                              RightExistCubeInd = i; // note this is not only index in the array but also the mesh's unique ID
                              // reminder to append 'B' to the i integer to identify name and mesh 

                              // RULE is, for every cube added to the right , we add boxgridWidth/2 to the NEW cube's mesh centroid
                              // BUG FIX - here we use 1.95 to prevent rightwards drift of the base cube, small but noticeable! so use 1.95!
                              var rx_coordAdjust = rx_coordAdjust + (cubemultiplierR*(boxgridWidth/1.95));
                         } 

                    // else just keep looping untill the end of the base cube array storage 
                    }
               }

               // now sort the rx_coord out by simply summing the adjustment with the NEW cube's horizontal coord
               // recall: this arise since the logic of using the new B1 cube as baseline position
               var rx_coord = newX + rx_coordAdjust;

               // pass it through the combinatory callback func --> prefixbaseCubeComb -- to get the new cube prefix
               // simply override the bcubesPrefix
               bcubesPrefix = prefixBaseCubeComb('B1', LeftExistCubePrefix, RightExistCubePrefix); 

               // if the prefixes are not '' , then there is a match so we ...

               // Bug FIX: catch statement to resolve the case where both right and left exist cube prefix have been populated
               // i.e. what if the B1 is imported next to left and right existing cubes ? 
               if (LeftExistCubePrefix != '' && RightExistCubePrefix != '') {

                    // simply check if both flags have been activated. if they have,, then ...
                    // destroy the NEw B1 (since this is new import of basecube it MUST be B1! if not check the callback bug!) newMesh obj
                    newMesh.dispose(); 
                    newMesh = null; // nullify to tell GC to collect ! this will result in some error msg by babylon which we can ignore!

                    // Destroy all 'old' EXISTING meshes to the left AND right , if any, 
                    // this implies the right and left (potential, if any) neighbouring cubes 
                    // apply this to left and right cubes individually

                    // RightExistCubePrefix ...
                    var meshid_R = 'B' + String(RightExistCubeInd); 
                    var getMeshObj_R = scene.getMeshByID(meshid_R);
                    getMeshObj_R.dispose(); 
                    getMeshObj_R = null; // can just ignore error msg from babylon due to this i.e. import error or some shit
                    
                    // get rid of the accessories in the base cube
                    if (baseAccesoryArray[RightExistCubeInd] != 0) {
                         for (var i=0; i<baseAccesoryArray.length; i++) {
                             if (baseAccesoryArray[RightExistCubeInd][i] != 0 && baseAccesoryArray[RightExistCubeInd][i] != null) {
                                 var accessoryID = baseAccesoryArray[RightExistCubeInd][i];
                                 accessoryID = "B" + accessoryID + String(RightExistCubeInd);
                                 var getaccessoryObj = scene.getMeshByID(accessoryID);
                                 getaccessoryObj.dispose(); 
                                 getaccessoryObj = null; // release memory
                             }
                         }
                    }

                    // remove from basecube tracker arrays by setting null
                    basecubeArray[RightExistCubeInd] = 0; 
                    basecubePos[RightExistCubeInd] = 0; 
                    // note: if a cube has been removed, remove its associated accesory array by setting to 0
                    baseAccesoryArray[RightExistCubeInd] = 0;  // also reset empty array for any associated accesories 
                    baseAccesoryPos[RightExistCubeInd] = 0; 
                    //console.log("INFO - Obtained right neighbour cube mesh via id");

                    //LeftExistCubePrefix ... 
                    var meshid_L = 'B' + String(LeftExistCubeInd);
                    var getMeshObj_L = scene.getMeshByID(meshid_L);
                    getMeshObj_L.dispose(); 
                    getMeshObj_L = null;

                    // get rid of the accessories in the base cube
                    if (baseAccesoryArray[LeftExistCubeInd] != 0) {
                         for (var i=0; i<baseAccesoryArray.length; i++) {
                             if (baseAccesoryArray[LeftExistCubeInd][i] != 0 && baseAccesoryArray[LeftExistCubeInd][i] != null) {
                                 var accessoryID = baseAccesoryArray[LeftExistCubeInd][i];
                                 accessoryID = "B" + accessoryID + String(LeftExistCubeInd);
                                 var getaccessoryObj = scene.getMeshByID(accessoryID);
                                 getaccessoryObj.dispose(); 
                                 getaccessoryObj = null;
                             }
                         }
                     }

                    // remove from basecube tracker arrays by setting null
                    basecubeArray[LeftExistCubeInd] = 0; 
                    basecubePos[LeftExistCubeInd] = 0; 
                    baseAccesoryArray[LeftExistCubeInd] = 0;  
                    baseAccesoryPos[LeftExistCubeInd] = 0; 
                    //console.log("INFO - Obtained left neighbour cube mesh via id");
                    
                    // update price after deleting an accessory
                    var curprice = 0;
                    for (var i=0; i<baseAccesoryArray.length; i++) {
                        curprice += calcPrice(accessoryPrices, baseAccesoryArray[i]);
                    }
                    totalBaseAccessories = curprice;
                    makeEvent("priceUpdate");

                    // and then import the new base cube in its new adjusted position by calling back importBaseCubes with type=='quickADD'
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                    // NOTE : no need to update global counter here since the importBaseCubes quickLOGIC
                    // use newY as the y coord since its the same for all base cubes 
                    importBaseCubes_SUPP(scene,gridMat,bcubesPrefix,rx_coord,newY); 
               }
               // else if either one is activated...
               else if (RightExistCubePrefix != '' || LeftExistCubePrefix != '') {

                    //console.log(bcubesPrefix); 

                    // destroy the NEw B1 (since this is new import of basecube it MUST be B1! if not check the callback bug!) newMesh obj
                    newMesh.dispose(); 
                    newMesh = null; // nullify to tell GC to collect ! this will result in some error msg by babylon which we can ignore!

                    // Destroy all 'old' EXISTING meshes to the left OR right , if any, 
                    // this implies the right OR left (potential, if any) neighbouring cubes 
                    // apply this to left and right cubes individually
                    if (RightExistCubePrefix != '') {
                         var meshid_R = 'B' + String(RightExistCubeInd); 
                         var getMeshObj_R = scene.getMeshByID(meshid_R);
                         getMeshObj_R.dispose(); 
                         getMeshObj_R = null; // can just ignore error msg from babylon due to this i.e. import error or some shit
                         
                         // get rid of the accessories in the base cube
                         if (baseAccesoryArray[RightExistCubeInd] != 0) {
                              for (var i=0; i<baseAccesoryArray.length; i++) {
                                  if (baseAccesoryArray[RightExistCubeInd][i] != 0 && baseAccesoryArray[RightExistCubeInd][i] != null) {
                                      var accessoryID = baseAccesoryArray[RightExistCubeInd][i];
                                      accessoryID = "B" + accessoryID + String(RightExistCubeInd);
                                      var getaccessoryObj = scene.getMeshByID(accessoryID);
                                      getaccessoryObj.dispose(); 
                                      getaccessoryObj = null;
                                  }
                              }
                         }

                         // remove from basecube tracker arrays by setting null
                         basecubeArray[RightExistCubeInd] = 0; 
                         basecubePos[RightExistCubeInd] = 0; 
                         baseAccesoryArray[RightExistCubeInd] = 0;  
                         baseAccesoryPos[RightExistCubeInd] = 0;
                         //console.log("INFO - Obtained right neighbour cube mesh via id");
                    
                    } else if (LeftExistCubePrefix != '') {
                         var meshid_L = 'B' + String(LeftExistCubeInd);
                         var getMeshObj_L = scene.getMeshByID(meshid_L);
                         getMeshObj_L.dispose(); 
                         getMeshObj_L = null;

                         if (baseAccesoryArray[LeftExistCubeInd] != 0) {
                              for (var i=0; i<baseAccesoryArray.length; i++) {
                                  if (baseAccesoryArray[LeftExistCubeInd][i] != 0 && baseAccesoryArray[LeftExistCubeInd][i] != null) {
                                      var accessoryID = baseAccesoryArray[LeftExistCubeInd][i];
                                      accessoryID = "B" + accessoryID + String(LeftExistCubeInd);
                                      var getaccessoryObj = scene.getMeshByID(accessoryID);
                                      getaccessoryObj.dispose(); 
                                      getaccessoryObj = null;
                                  }
                              }
                         }

                         // remove from basecube tracker arrays by setting null
                         basecubeArray[LeftExistCubeInd] = 0; 
                         basecubePos[LeftExistCubeInd] = 0; 
                         baseAccesoryArray[LeftExistCubeInd] = 0;  
                         baseAccesoryPos[LeftExistCubeInd] = 0; 
                         //console.log("INFO - Obtained left neighbour cube mesh via id");
                    }

                    // update price after deleting an accessory
                    var curprice = 0;
                    for (var i=0; i<baseAccesoryArray.length; i++) {
                        curprice += calcPrice(accessoryPrices, baseAccesoryArray[i]);
                    }
                    totalBaseAccessories = curprice;
                    makeEvent("priceUpdate");

                    // and then import the new base cube in its new adjusted position by calling back importBaseCubes with type=='quickADD'
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                    // NOTE : no need to update global counter here since the importBaseCubes quickLOGIC
                    // use newY as the y coord since its the same for all base cubes 
                    importBaseCubes_SUPP(scene,gridMat,bcubesPrefix,rx_coord,newY);

               } else if (RightExistCubePrefix == '' && LeftExistCubePrefix == '') {
                    // just import the B1 new cube as is 

                    console.log("no match neighbours");

                    var intprefix = parseInt(bcubesPrefix.slice(1));

                    // else if both are still '', meaning no match so we can do business as usual and place the new B1 at the grid box r-c center 
                    newMesh.position.x = newX; // recall, row index, col index
                    newMesh.position.y = newY;
                    newMesh.position.z = newZ; // actually Z is constant...see how gridMat is defined! 

                    // give the mesh a unique ID (do this for every 'if'). since this is base cube, it is B1 B2 B3 B4 .. BN
                    newMesh.id = String('B' + basecubeCtr); 
                    newMesh.name = String('B' + basecubeCtr); 

                    // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
                    basecubeArray.push(bcubesPrefix);
                    basecubePos.push([newMesh.position.x,newMesh.position.y,newMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
                    basecubeCtr = basecubeCtr +  1; 
                    // dont forget to update accesories with associated empty array
                    baseAccesoryArray.push(new Array(intprefix).fill(0));  
                    baseAccesoryPos.push(new Array(intprefix).fill(0)); 

                    // define mesh rotation
                    newMesh.rotation.y = Math.PI/2;
                    
                    // define mesh material
                    var boxMaterial = createboxMaterial(scene); 
                    newMesh.material = boxMaterial; 

                    // configure mesh actionManager
                    meshSelectControl (scene, newMesh ,'1');

                    // update price after importing an extra cube
                    var curprice = calcPrice(basePrices, basecubeArray)
                    totalBasecubes = curprice;

                    // fire event to update html
                    makeEvent("priceUpdate");

               } else {
                    console.log("[ERROR] problem with right or left detection."); 
               }

          } else {
               console.log('[ERROR] Unrecognized type for function importBaseCubes passed via args type');
          }
     }); 
}


/*
     Product combinatory stuffs 
*/
// for the base cubes business logic combinations (i.e. B1 + B1 is B2, B1 + B2 is B3, etc)
// takes maximum three args, the string type base cube prefixes of ... 
//   -- BNew (the new B1 imported), BLeft (identified left flanking cube), BRight (identified right flanking cube)
// IMPORTANT RULE
//   -- IF NO MATCH i.e. BRight has no match, then it should be assigned as 'B0'! 
//   -- During callback, BNew is typically 'B1'! 
function prefixBaseCubeComb (BNew, BLeft, BRight) {

     // catch if either BLeft and/or BRight is '' i.e. no match and assign as int 'B0'
     if (BLeft == '') {
          BLeft = 'B0'; 
     } 
     if (BRight == '') {
          BRight = 'B0'; 
     }
     
     // add them up together 
     var compositeIntStr = String(parseInt(BNew.slice(1)) + parseInt(BLeft.slice(1)) + parseInt(BRight.slice(1))); 

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
     button.width = "20px";
     button.height = "20px";
     button.color = "white";

     // position the button at rx_target and cy_target, using gridMat, unmodified
     
     // on click event for the button
     button.onPointerUpObservable.add(function() {
          // remove the button and in its place, put the base cube B1
          button.dispose(); 
          importBaseCubes(scene,gridMat,'B1',rx_target,cy_target,'nextLOGIC'); 
          btn_Stack(scene, gridMat, btnInt, rx_target+1, cy_target);
     });

     advancedTexture.addControl(button);
     button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], 0), scene);

     return button;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
/*
     Now it is time to define Imports of stacking cubes !! 
*/

function importStackCubes_SUPP(scene, gridMat, rx, cy, stackprefix) {
     // name of cube to be imported
     var cubeName = stackprefix + postfix;  
     
     var intprefix = parseInt(cubeName.slice(1)); // get the integer 2 out of E2 for instance.
     
     BABYLON.SceneLoader.ImportMesh("", hostUrl, cubeName, scene, 
     function (newMeshes) {

          // dirty hack to get around not being able to assign name and id to mesh
          var stackMesh = newMeshes[0]; 

          // this is a general purpose mesh import subroutine for internal use within importstackcube
          
          // IMPORTANT NOTICE!--> in this case of 'quick', 
          //      the rx cy args are euler coordinates! NOT gridMat index! (see rx_coord / cy_coord args input in quick callback)
          //      we will just reuse the rx cy args only  
          // give the mesh a unique ID (do this for every 'if')
          stackMesh.id = String('E' + stackcubeCtr); 
          
          stackMesh.name = String('E' + stackcubeCtr); 
          
          // give mesh position based on rx == rx_coord and cy == cy_coord
          // REMINDER: STUPID! THIS IS THE PROBLEM OF ALL MOTHERFUCKERS! 
          // RX AND CY IN THIS CASE ARE THE COORDINATES! DIRECTLY , NOT THE GRID MAT MATRIX INDEXES
          stackMesh.position.x = rx; 
          stackMesh.position.y = cy;
          stackMesh.position.z = gridMat[0][0][2]; // this one is constant for all stack cubes 

          // define mesh rotation
          stackMesh.rotation.y = Math.PI/2;
         
          // update global counter for stack cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
          stackcubeArray.push(stackprefix);
          
          stackcubePos.push([stackMesh.position.x,stackMesh.position.y,stackMesh.position.z]); // push grid position in stackcubePos array as an array of 3 elements x,y,z 
          stackcubeCtr = stackcubeCtr +  1; 
          // update global stack cube accesory in tandem, populate with empty array and empty matrix 
          // note: cant use zero here, since a stack cube may have more than one accesory
          stackAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so initialize zero array
          stackAccesoryPos.push(new Array(intprefix).fill(0)); 

          // configure actionManager
          meshSelectControl (scene, stackMesh,'2');

          // update price after importing an extra cube
          var curprice = calcPrice(stackPrices, stackcubeArray);
          totalStackcubes = curprice;

          // update price after importing an extra cube
          makeEvent("priceUpdate");
     }); 
}

// callback function to import stacking cubes
// import stacking cubes 
function importStackCubes(scene, gridMat, rx, cy, stackprefix) {
     console.log("[INFO] Imported stack asset mesh"); 

     // name of cube to be imported
     var cubeName = stackprefix + postfix;      

     BABYLON.SceneLoader.ImportMesh("", hostUrl, cubeName, scene, 
     function (newMeshes) {
          var stackMesh = newMeshes[0]; 
          // // define the imported B1 cube's coordinates
          var newX = gridMat[rx][cy][0]; 
          var newY = gridMat[rx][cy][1]; // this is a constant for stack cubes , can just reuse this number
          var newZ = gridMat[rx][cy][2]; // actually Z is constant...see how gridMat is defined! 

          // // also use these coords as the reference 

          // // evaluate newly imported B1 against its neighbours via looping stackcubePos array. 
          // // IMPORTANT! --> we use the gridmat NOT the actual cube dimensions!
          var MEASURE_UPPER = boxgridWidth + 0.05; // upper bound c-c grid hor spacing
          var MEASURE_LOWER = boxgridWidth - 0.05; // lower bound c-c grid hor spacing
     
          // // loop through stackcubePos's x-y coordinates to check if the difference between them is within the MEASURE range bound which means they are neighbours
          // // RUle is , a single B1 new import mesh can atmost have two neighbours i.e. Right and left 
          // // so we first define the vars to hold temporary data/flag with regards to Right and Left 
          var RightExistCubePrefix = '';
          var RightExistCubePos = 0; 
          var RightExistCubeInd = 0; // this is the index of the stackcube which we will use to manipulate the mesh later
          var LeftExistCubePrefix = '';
          var LeftExistCubePos = 0; 
          var LeftExistCubeInd = 0; // this is the index of the stackcube which we will use to manipulate the mesh later

          var rx_coordAdjust = 0; // this is the adjustment factor to the existing cube's horizontal coordinate
          for (var i=0; i < stackcubePos.length; i++) { // note that we can also use i as the index tracker
               
                if (stackcubeArray[i] != 0) { // if it is zero then it has been flagged as removed from scene so we IGNORE
                    var stackcubeInt = parseInt(stackcubeArray[i].slice(1)); // get the looped existing stack cube number, by slicing out the 'B' letter
                    var ELeftX , ERightX; 
                    
                    if (stackcubeInt == 1) {
                        // if it is staack cube 1 then just use the position as is (i.e. single value for left right testing)
                        // extract the x coord
                        ELeftX = stackcubePos[i][0];
                        ERightX = stackcubePos[i][0];
                    } else if (stackcubeInt > 1) { // if it is more than 1, then need to assign left and right x coordinate
                        // then use this formulae to figure out right most and left most cubes
                        var tempLimit = ((stackcubeInt/2) - 0.5)*boxgridWidth; 
                        
                        // BRight by add to the centroid (cube mesh center) , recall all X coords
                        // for existing neighbour cubes
                        ERightX = stackcubePos[i][0] + tempLimit;
                        // BLeft by subtract from the centroid (cube mesh center)
                        // for existing neighbour cubes 
                        ELeftX = stackcubePos[i][0] - tempLimit; 
                    }   

                    // check if this existing looped cube is left to the new B1 import (meaning the existing active cube has lower x value)
                    if (LeftExistCubePrefix == '' && newX > ERightX && (newX - ERightX) >= MEASURE_LOWER && (newX - ERightX) <= MEASURE_UPPER) {
                         // if the existing cube is left neighbour to the new B1 import, then...
                         // find the median coordinate (horizontal) for the composite cube 
                         // and define them as rx_coord , cy_coord
                         // note that if Left var is already populated , then it means that there is already one left match. 
                         //  ...   so this if statement will not pass, since we can only have one left neighbour for each B1 import 

                         // populate Left var with the stackprefix of the existing cube 
                         LeftExistCubePrefix = stackcubeArray[i]; 
                         var cubemultiplierL = parseInt(LeftExistCubePrefix.slice(1));  
                         // populate associated X position (original)
                         LeftExistCubePos = stackcubePos[i][0]; 
                         // populate the index with i. we need this to remove the mesh later
                         LeftExistCubeInd = i; 

                         // RULE is, for every existing cube to the left, we subtract boxgridWidth/2 to the NEW cube's mesh centroid
                         // BUG FIX - here we use 1.95 to prevent leftward drift of the stack cube, small but noticeable! so use 1.95!
                         var rx_coordAdjust = rx_coordAdjust - (cubemultiplierL*(boxgridWidth/1.95));
                    
                    }
                    else if (RightExistCubePrefix == '' && ELeftX > newX && (ELeftX - newX) >= MEASURE_LOWER && (ELeftX - newX) <= MEASURE_UPPER) { 
                         // if the existing cube is right neighbour to the new B1 import,then ... 

                         // populate Left var with the basecubeprefix of the existing cube 
                         RightExistCubePrefix = stackcubeArray[i];
                         var cubemultiplierR = parseInt(RightExistCubePrefix.slice(1)); 
                         // populate associated X position
                         RightExistCubePos = stackcubePos[i][0]; 
                         // populate the index with i. we need this to remove the mesh later
                         RightExistCubeInd = i; // note this is not only index in the array but also the mesh's unique ID
                         // reminder to append 'B' to the i integer to identify name and mesh 

                         // RULE is, for every cube added to the right , we add boxgridWidth/2 to the NEW cube's mesh centroid
                         // BUG FIX - here we use 1.95 to prevent rightwards drift of the base cube, small but noticeable! so use 1.95!
                         var rx_coordAdjust = rx_coordAdjust + (cubemultiplierR*(boxgridWidth/1.95));
                    } 
               }
          }

               // now sort the rx_coord out by simply summing the adjustment with the NEW cube's horizontal coord
               // recall: this arise since the logic of using the new B1 cube as baseline position
               var rx_coord = newX + rx_coordAdjust;
               
               stackprefix = prefixStackCubeComb('E1', LeftExistCubePrefix, RightExistCubePrefix); 
          
               // if the prefixes are not '' , then there is a match so we ...

               // Bug FIX: catch statement to resolve the case where both right and left exist cube prefix have been populated
               // i.e. what if the B1 is imported next to left and right existing cubes ? 
               if (LeftExistCubePrefix != '' && RightExistCubePrefix != '') {

                    // simply check if both flags have been activated. if they have,, then ...
                    // destroy the NEw B1 (since this is new import of basecube it MUST be B1! if not check the callback bug!) stackMesh obj
                    stackMesh.dispose(); 
                    stackMesh = null; // nullify to tell GC to collect ! this will result in some error msg by babylon which we can ignore!

                    // Destroy all 'old' EXISTING meshes to the left AND right , if any, 
                    // this implies the right and left (potential, if any) neighbouring cubes 
                    // apply this to left and right cubes individually

                    // RightExistCubePrefix ...
                    var meshid_R = 'E' + String(RightExistCubeInd); 
                    var getMeshObj_R = scene.getMeshByID(meshid_R);
                    getMeshObj_R.dispose(); 
                    getMeshObj_R = null; // can just ignore error msg from babylon due to this i.e. import error or some shit

                    if (stackAccesoryArray[RightExistCubeInd] != 0) {
                        for (var i=0; i<baseAccesoryArray.length; i++) {
                            if (stackAccesoryArray[RightExistCubeInd][i] != 0 && stackAccesoryArray[RightExistCubeInd][i] != null) {
                                var accessoryID = stackAccesoryArray[RightExistCubeInd][i];
                                accessoryID = "B" + accessoryID + String(RightExistCubeInd);
                                var getaccessoryObj = scene.getMeshByID(accessoryID);
                                getaccessoryObj.dispose(); 
                                getaccessoryObj = null;
                            }
                        }
                    }

                    // remove from stack cube tracker arrays by setting null
                    stackcubeArray[RightExistCubeInd] = 0; 
                    stackcubePos[RightExistCubeInd] = 0; 
                    // note: if a cube has been removed, remove its associated accesory array by setting to 0
                    stackAccesoryArray[RightExistCubeInd] = 0;  // also reset empty array for any associated accesories 
                    stackAccesoryPos[RightExistCubeInd] = 0; 

                    //LeftExistCubePrefix ... 
                    var meshid_L = 'E' + String(LeftExistCubeInd);
                    var getMeshObj_L = scene.getMeshByID(meshid_L);
                    getMeshObj_L.dispose(); 
                    getMeshObj_L = null;

                    if (stackAccesoryArray[LeftExistCubeInd] != 0) {
                        for (var i=0; i<baseAccesoryArray.length; i++) {
                            if (stackAccesoryArray[LeftExistCubeInd][i] != 0 && stackAccesoryArray[LeftExistCubeInd][i] != null) {
                                var accessoryID = stackAccesoryArray[LeftExistCubeInd][i];
                                accessoryID = "B" + accessoryID + String(LeftExistCubeInd);
                                var getaccessoryObj = scene.getMeshByID(accessoryID);
                                getaccessoryObj.dispose(); 
                                getaccessoryObj = null;
                            }
                        }
                    }
                    // remove from satckcube tracker arrays by setting null
                    stackcubeArray[LeftExistCubeInd] = 0; 
                    stackcubePos[LeftExistCubeInd] = 0; 
                    stackAccesoryArray[LeftExistCubeInd] = 0;  
                    stackAccesoryPos[LeftExistCubeInd] = 0; 
                    
                    //console.log("INFO - Obtained left neighbour cube mesh via id");

                    // update price after importing an extra cube
                    var curprice = 0;
                    for (var i=0; i<stackAccesoryArray.length; i++) {
                        curprice += calcPrice(accessoryPrices, stackAccesoryArray[i]);
                    }
                    totalStackAccessories = curprice;
            
                    makeEvent("priceUpdate");
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                     
                    importStackCubes_SUPP(scene,gridMat,rx_coord,newY,stackprefix); 
               }
               // else if either one is activated...
               else if (RightExistCubePrefix != '' || LeftExistCubePrefix != '') { 

                    // destroy the NEw B1 (since this is new import of stackcube it MUST be B1! if not check the callback bug!) stackMesh obj
                    stackMesh.dispose(); 
                    stackMesh = null; // nullify to tell GC to collect ! this will result in some error msg by babylon which we can ignore!

                    // Destroy all 'old' EXISTING meshes to the left OR right , if any, 
                    // this implies the right OR left (potential, if any) neighbouring cubes 
                    // apply this to left and right cubes individually
                    if (RightExistCubePrefix != '') {
                         var meshid_R = 'E' + String(RightExistCubeInd); 
                         var getMeshObj_R = scene.getMeshByID(meshid_R);
                         getMeshObj_R.dispose(); 
                         getMeshObj_R = null; // can just ignore error msg from babylon due to this i.e. import error or some shit

                         if (stackAccesoryArray[RightExistCubeInd] != 0) {
                            for (var i=0; i<stackAccesoryArray.length; i++) {
                                if (stackAccesoryArray[RightExistCubeInd][i] != 0 && stackAccesoryArray[RightExistCubeInd][i] != null) {
                                    var accessoryID = stackAccesoryArray[RightExistCubeInd][i];
                                    accessoryID = "B" + accessoryID + String(RightExistCubeInd);
                                    var getaccessoryObj = scene.getMeshByID(accessoryID);
                                    getaccessoryObj.dispose(); 
                                    getaccessoryObj = null;
                                }
                            }
                        }
                        
    
                         // remove from stackcube tracker arrays by setting null
                         stackcubeArray[RightExistCubeInd] = 0; 
                         stackcubePos[RightExistCubeInd] = 0; 
                         stackAccesoryArray[RightExistCubeInd] = 0;  
                         stackAccesoryPos[RightExistCubeInd] = 0;
                         //console.log("INFO - Obtained right neighbour cube mesh via id");
                    } else if (LeftExistCubePrefix != '') {
                         var meshid_L = 'E' + String(LeftExistCubeInd);
                         var getMeshObj_L = scene.getMeshByID(meshid_L);
                         getMeshObj_L.dispose(); 
                         getMeshObj_L = null;

                        if (stackAccesoryArray[LeftExistCubeInd] != 0) {
                            for (var i=0; i<baseAccesoryArray.length; i++) {
                                if (stackAccesoryArray[LeftExistCubeInd][i] != 0 && stackAccesoryArray[LeftExistCubeInd][i] != null) {
                                    var accessoryID = stackAccesoryArray[LeftExistCubeInd][i];
                                    accessoryID = "B" + accessoryID + String(LeftExistCubeInd);
                                    var getaccessoryObj = scene.getMeshByID(accessoryID);
                                    getaccessoryObj.dispose(); 
                                    getaccessoryObj = null;
                                }
                            }
                        }
                        // remove from stackcube tracker arrays by setting null
                        stackcubeArray[LeftExistCubeInd] = 0; 
                        stackcubePos[LeftExistCubeInd] = 0; 
                        stackAccesoryArray[LeftExistCubeInd] = 0;  
                        stackAccesoryPos[LeftExistCubeInd] = 0; 
                        //console.log("INFO - Obtained left neighbour cube mesh via id");
                    }

                    // update price after importing an extra cube
                    var curprice = 0;
                    for (var i=0; i<stackAccesoryArray.length; i++) {
                        curprice += calcPrice(accessoryPrices, stackAccesoryArray[i]);
                    }
                    totalStackAccessories = curprice;
            
                    makeEvent("priceUpdate");
                    
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                    
                    // use newY as the y coord since its the same for all base cubes 
                    importStackCubes_SUPP(scene,gridMat,rx_coord,newY,stackprefix);

               } else if (RightExistCubePrefix == '' && LeftExistCubePrefix == '') {
                    // just import the E1 new cube as is 

                    console.log("no match neighbours");

                    var intprefix = parseInt(stackprefix.slice(1));
                    
                    // else if both are still '', meaning no match so we can do business as usual and place the new B1 at the grid box r-c center 
                    stackMesh.position.x = newX; // recall, row index, col index
                    stackMesh.position.y = newY;
                    stackMesh.position.z = newZ; // actually Z is constant...see how gridMat is defined! 

                    // give the mesh a unique ID (do this for every 'if'). since this is base cube, it is B1 B2 B3 B4 .. BN
                    stackMesh.id = String('E' + stackcubeCtr); 
                    stackMesh.name = String('E' + stackcubeCtr); 

                    // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
                    stackcubeArray.push(stackprefix);
                    stackcubePos.push([stackMesh.position.x,stackMesh.position.y,stackMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
                    stackcubeCtr = stackcubeCtr +  1; 
                    // dont forget to update accesories with associated empty array
                    stackAccesoryArray.push(new Array(intprefix).fill(0));  
                    stackAccesoryPos.push(new Array(intprefix).fill(0)); 

                    // define mesh rotation
                    stackMesh.rotation.y = Math.PI/2;
     
                    // configure mesh actionManager
                    meshSelectControl (scene, stackMesh ,'2');

                    // update price after importing an extra cube
                    var curprice = calcPrice(stackPrices, stackcubeArray);
                    totalStackcubes = curprice;

                    // update price after importing an extra cube
                    makeEvent("priceUpdate");

               } else {
                    console.log("[ERROR] problem with right or left detection."); 
               }
               
     });
     
}

function prefixStackCubeComb (ENew, ELeft, ERight) {

     // catch if either BLeft and/or BRight is '' i.e. no match and assign as int 'B0'
     if (ELeft == '') {
          ELeft = 'E0'; 
     } 
     if (ERight == '') {
          ERight = 'E0'; 
     }
     
     // add them up together 
     var compositeIntStr = String(parseInt(ENew.slice(1)) + parseInt(ELeft.slice(1)) + parseInt(ERight.slice(1))); 

     // compose the B-prefix
     var compositePrefix = 'E' + compositeIntStr;

     // return the new combination prefix , this is a string !
     return compositePrefix; 
}

// this deserves its own callback since at the start, the pluses are added for the remaining base cube spaces
// i.e. if initially the 6cube base is imported, then no plus! 
function btn_Stack(scene, gridMat, btnInt, rx_target,cy_target) {

     // horizontal btns for the base cubes manipulation
     // this will add a base cube at the plus position that is being clicked. 
     // will be initialized alongside the first base cube import
 
     // btnInt can only be an integer and it is to serve as a unique number for each button
     // no need to track the button index for the horizontal cubes since its permutations are very small 
     
     //  button stuff
     var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
     var button = BABYLON.GUI.Button.CreateImageOnlyButton(btnInt, "https://cdn.shopify.com/s/files/1/0185/5092/products/symbols-0173_800x.png?v=1369543613");
     button.width = "20px";
     button.height = "20px";
     button.color = "white";
 
     // position the button at rx_target and cy_target, using gridMat data, unmodified
 
     // on click event for the button
     button.onPointerUpObservable.add(function() {
          // let intprefix = parseInt(bcubesPrefix_init[1]); 
          button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target+1][cy_target][1], 0), scene); 
          importStackCubes(scene, gridMat, rx_target, cy_target, "E1");
          rx_target += 1; // increment the row number   
     });
 
     advancedTexture.addControl(button);
     button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], 0), scene);
 
     return button;
 }

 // -------------------------------------- ACCESORIES ----------------------------------------------- //

// Accesories import for base cubes 
function importBaseAccesories(scene, asstype, cubeNameId, specificcubeNum) {

    // accesories management for base cubes only

    // here, args type is a string to identify which accesory is being imported. 
    //            cubeNameId is a string identifying id of associated cube , which contains its array tracker index! 
    //            cubeType is a string whether or not it is 'stack' or 'base' 
    //            specificcubeNum is an integer specifying which cube of a composite cube is being referred to
    //             ..... (this can be taken any integer between 1-6 i.e. cube 1 - cube 6 for B6, so on so forth)

    if (asstype == 'XS') { // X shelve
		var assmeshImp = 'Xshelve.babylon'; // this name has to be same as the mesh file from cdn
	} else if (asstype == 'SS') { // Single shelve
		var assmeshImp = 'singleshelve.babylon';
	} else if  (asstype == 'DS') { // Double shelve
		var assmeshImp = 'doubleshelve.babylon'; 
	} else if (asstype == 'NS') { // nine box shelve
		var assmeshImp = 'nineboxshelve.babylon'; 
	} else if (asstype == 'SB') { // six box shelve
		var assmeshImp = 'sixboxshelve.babylon'; 
    } 
    // else if (asstype == 'DD') { // six box shelve
	// 	var assmeshImp = 'doubledrawer.babylon'; // continue on...until all accesory is covered
    // } else if (asstype == 'TA') { // six box shelve
	// 	var assmeshImp = 'table.babylon'; // continue on...until all accesory is covered
    // } else if (asstype == 'DO') { // six box shelve
	// 	var assmeshImp = 'door.babylon'; // continue on...until all accesory is covered
    // } 
    // get the cube integer unique number
    cubemeshInd = parseInt(cubeNameId.slice(1)); 

    // get the target cube mesh coords pos (remmember, cubePos is an array of 3 elements x y z)
    var cubePos = basecubePos[cubemeshInd]; // this will be the base position for any assceory imports

    // get the target cube mesh prefix (only interested in the number 1-6 for B1-B6)

    var cubePrefixInt = parseInt(basecubeArray[cubemeshInd].slice(1)); 
    
    // simple sanity check 
    if (specificcubeNum > cubePrefixInt) {
        console.log('[ERROR] Specific cube position cannot be larger than base cube prefix int');
        return 0; 
    }

    console.log("[INFO] Imported accesory mesh"); 

    BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
    function (assMesh) {
        var assMesh = assMesh[0]; // get the mesh object 
        
        // naming convention for accesories base cube mesh BX<int> i.e. BXS1, BXS2, BXS3, BXS4 ... for X shelve
        // where <int> refers to the associated cube mesh unique index 
        assMesh.name = 'B' + asstype + String(cubemeshInd); 
        assMesh.id = 'B' + asstype + String(cubemeshInd); 
        
        // here, compute the x position of the imported accesory 
        // NOTE SEE TO-DO below.
        if (cubePrefixInt%2 == 0) {
            // if this cube is either B2,B4,B6 , use this formulae to determine x pos rel to cube CoG
            var xposMesh = cubePos[0] + ((specificcubeNum - ((cubePrefixInt/2) + 0.5))*boxgridWidth); 

        } 
        else if (cubePrefixInt%2 > 0) {
            // else if the cube is either B1,B3,B5, use this formulae to determine x pos rel to cube CoG
            // TO-DO: if both are exactly same formulae, just use one no need conditional...check properly first 
            var xposMesh = cubePos[0] + ((specificcubeNum - ((cubePrefixInt/2) + 0.5))*boxgridWidth);
        }
        
        // position the accesory mesh at base cube 
        assMesh.position.x = xposMesh;
        assMesh.position.y = cubePos[1];
        assMesh.position.z = cubePos[2];
        assMesh.rotation.y = Math.PI/2;

        // register the mesh for actions
        assMesh.actionManager = new BABYLON.ActionManager(scene); 
        
        // update base accesory arrays at their respective specific cubes position
        // recall that specificcubeNum is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5
        
        baseAccesoryArray[cubemeshInd][specificcubeNum - 1] = asstype;
        baseAccesoryPos[cubemeshInd][specificcubeNum - 1] = [[xposMesh],[cubePos[1]],[cubePos[2]]]; 
        console.log(baseAccesoryArray)

        var curprice = 0; 

        for (var i=0; i<baseAccesoryArray.length; i++) {
            curprice += calcPrice(accessoryPrices, baseAccesoryArray[i]);
        }
        totalBaseAccessories = curprice;

        makeEvent("priceUpdate");
    });
}

function importStackAccesories(scene, asstype, cubeNameId, specificcubeNum) {

    // accesories management for base cubes only

    // here, args type is a string to identify which accesory is being imported. 
    //            cubeNameId is a string identifying id of associated cube , which contains its array tracker index! 
    //            cubeType is a string whether or not it is 'stack' or 'base' 
    //            specificcubeNum is an integer specifying which cube of a composite cube is being referred to
    //             ..... (this can be taken any integer between 1-6 i.e. cube 1 - cube 6 for B6, so on so forth)

    if (asstype == 'XS') { // X shelve
		var assmeshImp = 'Xshelve.babylon'; // this name has to be same as the mesh file from cdn
	} else if (asstype == 'SS') { // Single shelve
		var assmeshImp = 'singleshelve.babylon';
	} else if  (asstype == 'DS') { // Double shelve
		var assmeshImp = 'doubleshelve.babylon'; 
	} else if (asstype == 'NS') { // nine box shelve
		var assmeshImp = 'nineboxshelve.babylon'; 
	} else if (asstype == 'SB') { // six box shelve
		var assmeshImp = 'sixboxshelve.babylon'; 
    } 
    // else if (asstype == 'DD') { // six box shelve
	// 	var assmeshImp = 'doubledrawer.babylon'; // continue on...until all accesory is covered
    // } else if (asstype == 'TA') { // six box shelve
	// 	var assmeshImp = 'table.babylon'; // continue on...until all accesory is covered
    // } else if (asstype == 'DO') { // six box shelve
	// 	var assmeshImp = 'door.babylon'; // continue on...until all accesory is covered
    // } 
    // get the cube integer unique number
    cubemeshInd = parseInt(cubeNameId.slice(1)); 

    // get the target cube mesh coords pos (remmember, cubePos is an array of 3 elements x y z)
    var cubePos = stackcubePos[cubemeshInd]; // this will be the base position for any assceory imports

    // get the target cube mesh prefix (only interested in the number 1-6 for B1-B6)

    var cubePrefixInt = parseInt(stackcubeArray[cubemeshInd].slice(1)); 
    
    // simple sanity check 
    if (specificcubeNum > cubePrefixInt) {
        console.log('[ERROR] Specific cube position cannot be larger than stack cube prefix int');
        return 0; 
    }

    console.log("[INFO] Imported accesory mesh"); 

    BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
    function (assMesh) {
        var assMesh = assMesh[0]; // get the mesh object 
        
        // naming convention for accesories stack cube mesh BX<int> i.e. BXS1, BXS2, BXS3, BXS4 ... for X shelve
        // where <int> refers to the associated cube mesh unique index 
        assMesh.name = 'B' + asstype + String(cubemeshInd); 
        assMesh.id = 'B' + asstype + String(cubemeshInd); 
        
        // here, compute the x position of the imported accesory 
        // NOTE SEE TO-DO below.
        if (cubePrefixInt%2 == 0) {
            // if this cube is either B2,B4,B6 , use this formulae to determine x pos rel to cube CoG
            var xposMesh = cubePos[0] + ((specificcubeNum - ((cubePrefixInt/2) + 0.5))*boxgridWidth); 

        } 
        else if (cubePrefixInt%2 > 0) {
            // else if the cube is either B1,B3,B5, use this formulae to determine x pos rel to cube CoG
            // TO-DO: if both are exactly same formulae, just use one no need conditional...check properly first 
            var xposMesh = cubePos[0] + ((specificcubeNum - ((cubePrefixInt/2) + 0.5))*boxgridWidth);
        }
        
        // position the accesory mesh at base cube 
        assMesh.position.x = xposMesh;
        assMesh.position.y = cubePos[1];
        assMesh.position.z = cubePos[2];
        assMesh.rotation.y = Math.PI/2;

        // register the mesh for actions
        assMesh.actionManager = new BABYLON.ActionManager(scene); 
        
        // update base accesory arrays at their respective specific cubes position
        // recall that specificcubeNum is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5
        
        stackAccesoryArray[cubemeshInd][specificcubeNum - 1] = asstype;
        stackAccesoryPos[cubemeshInd][specificcubeNum - 1] = [[xposMesh],[cubePos[1]],[cubePos[2]]]; 

         // update price after importing an extra cube
         var curprice = 0;
         for (var i=0; i<stackAccesoryArray.length; i++) {
            curprice += calcPrice(accessoryPrices, stackAccesoryArray[i]);
        }
        totalStackAccessories = curprice;

        makeEvent("priceUpdate");
    });
}