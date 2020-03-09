/*
EZBO Stacking Cube Product Configurator Web App v2
*/
// Use CDN for static files i.e. https://stagingfiles.sgp1.digitaloceanspaces.com/ezbo/<filename>

// global scene variable
var scene;

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
var baseAccesoryArray = []; // to track the accesories in the scene
var baseAccesoryPos = []; 
// this index is created as global var in order for it to be called from outside this js file
// purpose is to serve as a holding variable of selected basec cube mesh index/id/name *same thing! 
var baseIndex = 0; 

var basecubeName; // used to identify which cube to import accessory to
var basePrices = [["B1", 7.6], ["B2", 10.9], ["B3", 14.5], ["B4", 18.5], ["B5", 22.4], ["B6", 26.3]]; // in USD

var totalBasecubes;

/*
SPECIAL remark for stackcubes.
 - user will only be able to import E1 into the canvas, the rest will be taken care by special logics
*/
// trackers for stackcube - the E series
var stackcubeArray = []; // to track the stack cubes in the scene by name i.e. E1 etc
var stackcubeCtr = 0; // for mesh naming (unique id and name)
var stackcubePos = []; // track 1:1 position in euler coords in tandem with the above two 

// trackers for accesories for the stack cubes. this will follow the stackcube trackers 1:1
var stackAccesoryArray = []; 
var stackAccesoryPos = []; 
// this index is created as global var in order for it to be called from outside this js file. 
// purpose is same as above baseIndex variable
var stackIndex = 0; 

var stackcubeName; // used to identify which cube to import accessory to and that this may be referred to outside this js file

var totalStackcubes; // for purpose of price calc to pass to html

var stackPrices = [["E1", 6.3], ["E2", 8.8], ["E3", 10.6], ["E4", 13.5], ["E5", 16.2], ["E6", 19],
                    ["E43", 6.3], ["E53", 8.8], ["E54", 10.6], ["E63", 13.5], ["E64", 16.2], ["E65b", 19],["E65a", 19], // not yet updated prices for composite stack
                    ]; // in USD

// define x coord of cubes per row from left to right 1,2,3,4,5,6 positions on the grid 
var x_coord_definition = [1.20175, 1.59525, 1.98875, 2.38225, 2.77575, 3.16925];

// define pattern of the composite stackcubes which we call planks here 
var stackplankConfig = [["E43",'1001'], ["E53", '10001'], ["E54", '11001'], ["E63",'100001'], ["E64",'110001'], ["E65b", '110011'], ["E65a",'111001'], ["RE54", '10011'], ["RE64", '100011'], ["RE65a", '100111']];

// list of plank configurations that can have a table
var tableReady = [["E54", '11001'], ["E64",'110001'], ["E65b", '110011'], ["E65a",'111001'], ["RE54", '10011'], ["RE64", '100011'], ["RE65a", '100111']];

var plankIndex = 0;
var plankcubeName;

var stackbuttonArray = [];
var basebuttonArray = [];

var undoSTACK = [];

// NEW logic for stack cube planks
var stackplankVertTrack = []; // stores stack cube vertical position , to limit one composite stack cube per level 

// inititate price 
var price = 0;

// some global constants 
var postfix = "-final.babylon"; // define postfix for end of mesh file names
var constZ = -0.3; // in meters, the constant global z position of all cubes 
var boxgridWidth = 0.3835; // in mtrs, the defined grid system box element width 

// assign accesories that can be imported into the scene
// this is a nested array containing the accesories' programming code names and another array containing their respective actual names
var accesoryList = [
     ['XS','DS','SS','NS','DD','TA','SB','DO'], // all are made two lettered to be convinient 
     ['X-Shelve', 'Double-Shelve' , 'Single-Shelve', '9-box-Shelve', 'Double-drawer', 'Table', '6-box-shelving', 'Door']
];
var accessoryPrices = [["XS", 3.6], ["DS", 6.8], ["SS", 5.2], ["NS", 4.8], ["DD", 8.4], ["TA", 20], ["SB", 4], ["DO", 6]]; //USD

// INITALIZATION 
// assign basecubes file prefix for auto import of mesh into the scene.
// but when integrated with the ezbo django app, this will be loaded from session storage 
var bcubesPrefix_init = 'B1'; // can be B1-B6, as passed by html before it
//var bcubesPrefix_init = localStorage.getItem('Bvar'); // use this when with webapp

var totalBaseAccessories;
var totalStackAccessories;

var button_vert_Position;

// define the mathematical grid to arrange cubes. call once only!
var gridMat = gridEngine();

var stackbtn_grid = Create2DArray(6);

// Check if  browser supports webGL
if (BABYLON.Engine.isSupported()) {

     // if it does, declare all the global variables outside mainApp func 
     var canvas = document.getElementById("main_app");
     // note to create with engine with stencil set to true so we can highlight a mesh
     var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });  // this is the Babylon class engine 
     
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
     scene = createRoomScene(); 

     // Render
     engine.runRenderLoop(function () {
          scene.render(); 
     }); 
 
     // Ensure engine resize to keep things in perspective 
     window.addEventListener("resize", function () {
          engine.resize();
     });

     initButtons();
}

// declare gloabl variable for image data
var image_data = 0; 

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
    //  createRoof(scene); 

     // create the outdoor env --> skybox!
     createOutdEnv(scene);  
     
     // Load base cubes and enable modifications to the base cubes 
     // importBaseCubes(scene, gridMat, bcubesPrefix_init, 0,0, 'init');
     scene_recreation()
	 
     window.addEventListener("saveScene", function() { // this one can be high definition
          BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, camera, {width:400, height:250}); // download the room scene as png
     });
	 
	 window.addEventListener("saveSceneData", function() { // this one small res for thumbnail upload to api
          BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, camera, {width:400, height:250}, function (data) {
               image_data = data; 
          }); // save the room scene as img data
     });

     // finally ... 
     return scene; 
}

// ----------------------------------------------------------------------------------------------------------------
// FUNCTION CALLBACKS

// create an event with keyword arg 'type'. to be picked up by other js , even those outside this script
function makeEvent(type){
     let event = new Event("event");
     event.initEvent(type, true, true);
     window.dispatchEvent(event);
 }
 
// create the camera
function createCamera(scene) {
    
     // limited arc rotate
     // note its coords are always defined in alpha, beta and radius .. https://doc.babylonjs.com/babylon101/cameras
     // Parameters: name, alpha, beta, radius, target position, scene 
     var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI/2, Math.PI/2, 4, new BABYLON.Vector3(2,0.75,-0.2), scene); 
     // camera.attachControl(canvas, true);
     // set limits to camera movement so users dont get disorganized  
     // camera.lowerRadiusLimit = 4;
     // camera.upperRadiusLimit = 4; 
     // camera.lowerAlphaLimit = -1.8; // rmbr this is radians!  
     // camera.upperAlphaLimit = -1.3; 
     // camera.lowerBetaLimit = 1.35; 
     // camera.upperBetaLimit = 1.75; 

     // totally deactivate panning (if developer requires to see beyond cube, comment this out in development)
     // scene.activeCamera.panningSensibility = 0;
     // scene.activeCamera = camera; // set it as active viewport
     
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
     var matCoords = Create2DArray(6);  // so we play with 'push' later
     // matrix size
     var nrows = 6; 
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
     console.log(matCoords); 
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
function createboxMaterial (scene) {
    // create box material
    var boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    var boxMaterialUrl = hostUrl + 'melamine001.jpg'; 
    boxMaterial.diffuseTexture = new BABYLON.Texture(boxMaterialUrl, scene);
    boxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    //boxMaterial.ambientTexture = new BABYLON.Texture(boxMaterialUrl,scene);
    
    return boxMaterial; 
}

// callback func for mesh under selection and control using actionManager
function meshSelectControl (scene, meshObj, color) {

    // color is a numeric string to specify color of highlight , must be supported by Babylon
    // 1 is to blue
    // 2 is to green 

    // attach actionmanager to the scene 
    meshObj.actionManager = new BABYLON.ActionManager(scene);

    // define highlight 
    var hl = new BABYLON.HighlightLayer("hl", scene);

    // register actions
     
    meshObj.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(m){
            var mesh = m.meshUnderPointer;
            if (color=='1') {
                hl.addMesh(mesh, BABYLON.Color3.Blue());

            } else if (color=='2' || color=='3') {
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

                basecubeName = meshID;

                // and make the base cube event
                makeEvent("popupBase");

            } else if (color =='2'){
                // then update global stack cube id tracking (integer)
                stackIndex =  parseInt(meshID.slice(1));

                stackcubeName = meshID;
                
                // fire up an event to be picked up from the jquery for dom manipulation
                // in this case, its popping up a modal upon click of a particular mesh
                makeEvent("popupStack");

            } else if (color=='3'){

               plankIndex = parseInt(meshID.slice(2));

               plankcubeName = meshID;

               makeEvent("popupPlank");
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

          undoSTACK.push(newMesh.id);
          
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
          // console.log("here")
          // dirty hack to get around not being able to assign name and id to mesh
          var newMesh = newMeshes[0]; 

          if (type == 'init') {
               // initial base cube

               // give the mesh a unique ID (do this for every 'if')
               newMesh.id = String('B' + basecubeCtr); 
               newMesh.name = String('B' + basecubeCtr); 
               undoSTACK.push(newMesh.id);
			
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

               // determine which stack buttons should be available to be pressed on scene render
               // i.e if intprefix = 1, means that one cube has been automatically imported initially, thus the stack cube button should be available above it.
               // NOTE: when moving buttons, -10 is to move button out of sight, 0 is to move button into sight
               var stackbuttons = stackbtn_grid[1];
               for (var i=0; i<intprefix; i++){
                    var x = stackbuttons[i][1];
                    var y = stackbuttons[i][2];
                    stackbuttons[i][0].moveToVector3(new BABYLON.Vector3(gridMat[x][y][0], gridMat[x][y][1], 0), scene);
                    stackbuttons[i][3] = 1;
               }
               
               for (var i=0; i<intprefix; i++) {
                    basebuttonArray[i][4] = 1;
               }

               // determine which base buttons should be available to be pressed on scene render
               // i.e if intprefix = 1, means that one cube has been automatically imported, thus 5 buttons on the right of the cube should be available
               // NOTE: when moving buttons, -10 is to move button out of sight, 0 is to move button into sight
               for (var i=intprefix; i<basebuttonArray.length; i++) {
                    var x = basebuttonArray[i][1];
                    var y = basebuttonArray[i][2];
                    basebuttonArray[i][0].moveToVector3(new BABYLON.Vector3(gridMat[x][y][0], gridMat[x][y][1], 0), scene);
                    basebuttonArray[i][3] = 1;
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
               var RightExistCubePrefix = '';
               var RightExistCubePos = 0; 
               var RightExistCubeInd = 0; // this is the index of the basecube which we will use to manipulate the mesh later
               var LeftExistCubePrefix = '';
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
                                accessoryID = "A" + accessoryID + String(RightExistCubeInd);
                                var getaccessoryObj = scene.getMeshByID(accessoryID);
                                getaccessoryObj.dispose(); 
                                getaccessoryObj = null;
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
                                accessoryID = "A" + accessoryID + String(LeftExistCubeInd);
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
                                     accessoryID = "A" + accessoryID + String(RightExistCubeInd);
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
                                    accessoryID = "A" + accessoryID + String(LeftExistCubeInd);
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
                    undoSTACK.push(newMesh.id);
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
function btn_BaseHorInit (scene, gridMat, rx_target, cy_target, btnName) {

     // this deserves its own callback since at the start, the pluses are added for the remaining base cube spaces
     // i.e. if initially the 6cube base is imported, then no plus! 

     // horizontal btns for the base cubes manipulation
     // this will add a base cube at the plus position that is being clicked. 
     // will be initialized alongside the first base cube import

     // btnInt can only be an integer and it is to serve as a unique number for each button
     // no need to track the button index for the horizontal cubes since its permutations are very small 
     
     //  button stuff
     var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
     var button = BABYLON.GUI.Button.CreateImageOnlyButton(btnName, "https://cdn.shopify.com/s/files/1/0185/5092/products/symbols-0173_800x.png?v=1369543613");
     button.width = "20px";
     button.height = "20px";
     button.color = "white";

     // define the base cube vertical coordinates
     var BASE_CUBE_YCOORD = 0.29500000000000004;
     // position the button at rx_target and cy_target, using gridMat, unmodified
     
     
     // on click event for the button
     button.onPointerClickObservable.add(function() {
          // remove the button and in its place, put the base cube B1
          var plankAbove = false;
          
          button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], -10), scene);
          
          basebuttonArray[cy_target][3] = 0; // button is moved out of sight
          basebuttonArray[cy_target][4] = 1; // there is a cube in the position of the button now

          importBaseCubes(scene,gridMat,'B1',rx_target,cy_target,'nextLOGIC'); 

          for (var i=0; i<stackcubeArray.length; i++) {
               if (stackcubeArray[i] != 0) {
                    for (var j=0; j<stackplankConfig.length; j++) {
                         if (stackcubeArray[i] == stackplankConfig[j][0]) {
                              // check if the plank stack cube is directly above the base cubes
                              // if it is not, then the stack buttons are imported after the base buttons are pressed
                              if (stackcubePos[i][1] >= BASE_CUBE_YCOORD+(boxgridWidth*2)) {
                                   continue;
                              } 
                              // if there is a plank stack cube directly above the buttons, don't import the stack cube buttons
                              else {

                                   var name = stackplankConfig[j][0];
                                   if (name[0] == "R") {
                                        var plankSize = parseInt(name[2]);
                                   }
                                   else if(name[0] == "E") {
                                        var plankSize = parseInt(name[1]);
                                   }
                                   var plankCoor = stackcubePos[i][0];
                                   var halfplankLength = (plankSize*boxgridWidth)/2;

                                   // get the left most and right most coordinates of the plank
                                   var low = plankCoor - halfplankLength;
                                   var high = plankCoor + halfplankLength;
                                   
                                   // don't spawn the buttons which are underneath the plank
                                   if (gridMat[rx_target][cy_target][0] >= low && gridMat[rx_target][cy_target][0] <= high){
                                        plankAbove = true;
                                   }
                                   break;
                              }
                         }
                    }
               }
          }
          
          
          // if there is a plank directly above the base cubes, don't spawn a stack button
          // if the base cube is not under a plank, spawn a stack button
          // NOTE: when moving buttons, -10 is to move button out of sight, 0 is to move button into sight
          if (!plankAbove) {
               var buttons = stackbtn_grid[1];

               // increment the row number
               var row = rx_target
               row += 1;

               var cubeflag = false;

               // check if there is a cube directly above the current cube
               // if there is, do not spawn a button above the current cube
               for (var i=0; i<stackcubeArray.length; i++) {
                    if (stackcubeArray[i] != 0) {
                         
                         if (stackcubePos[i][1] == gridMat[row][cy_target][1]) {
                              var cubeint = parseInt(stackcubeArray[i][1]);
                              var totallength = cubeint*boxgridWidth;
                              var start = stackcubePos[i][0] - totallength/2;
                              var end = stackcubePos[i][0] + totallength/2;
                              if (gridMat[row][cy_target][0] > start && gridMat[row][cy_target][0] < end) {
                                   cubeflag = true;
                                   break;
                              }
                         }
                    }
               }
               
               // move button into scene 
               if (!cubeflag) {
                    buttons[cy_target][0].moveToVector3(new BABYLON.Vector3(gridMat[row][cy_target][0], gridMat[row][cy_target][1], 0), scene);
                    
                    stackbtn_grid[row][cy_target][3] = 1;
                    stackbtn_grid[row][cy_target][4] = 0;
               }
          }
          
          
     });

     advancedTexture.addControl(button);
     button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], -10), scene);
     
     return button;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
/*
     Now it is time to define Imports of stacking cubes !! 
*/

// this is to give user a choice to import composite stackcube 
// callback whenever the stackcube scene has been updated i.e. WHENEVER directly after E1 / E2/ E3 / E4 / E5 / E6 etc etc is imported 
// think of this as a 'modifier' to the E1-E6 imports. 
// we only allow one composite stack cube per level 
function importPlankCube(scene, importedStackMesh, gridMat) {
	var plank_marker = [0, 0, 0, 0, 0, 0];
	// where importedStackMesh is the newly imported stackcube mesh object

	// define tolerance units in meters 
	var TOL = 0.08; // 1mm , see if enough or not  
	
	// first, get the vertical coords of the newly imported mesh in terms of per cube 
	var vert_coord_import = importedStackMesh.position.y;

	// breaking conditional statement 
	// since we only allow one composite stack cube per level....
	for (var i=0; i < stackplankVertTrack.length ; i++) {
		if  (vert_coord_import + TOL >= stackplankVertTrack[i] && vert_coord_import - TOL <= stackplankVertTrack[i]) { 
			// meaning if this levelrow contains composite stackcube 
			return 0; // get out of this function 
		} // else we continue onwards ...
	}

	// if we continue onwards....
	var hor_coords_marker = [0,0,0,0,0,0]; // initialize horizontal position markers for the row i.e. the [0,0,0,0,1,1]
     
	var cubeIDs = [];
	// note that hor_coords_marker.length == x_coord_definition.length. this is a must. fatal error if not true

	// next loop through all the stackcube positions and qualify their vertical coordinate
	// at the same time, assign the binary position marker for the active row
	// active row being the level of vert_coord_import, which is the current cube 
	for (var i=0; i<stackcubePos.length; i++) {
		if (stackcubePos[i] != 0 && stackcubePos[i][1] == vert_coord_import) { // if it is not zero (zero means it has been previously deleted)
			// only if the we have same row stackcubes then we consider them for further processing 
			// only works for non first stackcube imports

			// get id of cube that is on the same row
			var id = "E" + i;
			cubeIDs.push(id);
			var CHECK = stackcubeArray[i];
			if (vert_coord_import + TOL >= stackcubePos[i][1] && vert_coord_import - TOL <= stackcubePos[i][1] && CHECK.length == 2) {
                    
				var sameRowCubeName = stackcubeArray[i]; // get the name of the stack cubes
				
				var sameRowCubeInt = parseInt(sameRowCubeName.slice(1)); 
				
				// this is center position of cube (REMINDER)
				var x_center = stackcubePos[i][0];  // get horizontal position of the stack cubes
                    
				// if its E1, just push the coordinate of the mesh into the array
				if (sameRowCubeInt == 1) {
					// then find its position marker 
					for (var j=0; j < x_coord_definition.length; j++) {
						
						if (x_center + TOL >=  x_coord_definition[j] && x_center - TOL <= x_coord_definition[j]) {
							// check if it is not marked yet
							if (hor_coords_marker[j] == 0) {
                                        // then we have found its position and hence should mark it at the array
                                       
                                        hor_coords_marker[j] = 1; // marked! 
                                        
							} else {
								 
								return 0; // this is fatal error...meaning overlapping cubes! so get out of function
							}
						}
					}
				}

				// if its E2-E6
				// remmember we want to label all the individual cubes
				// this is actually quite an expensive loop, but we shall optimize later
				// seems that odd and even use the same logic
				else if (sameRowCubeInt > 1) {

					var localhorZero = x_center-(sameRowCubeInt*(boxgridWidth/1.95)); // zero horizontal coord wrt local cube  
					
					for (var j=0; j < sameRowCubeInt; j++) { 

						// this means scanning the cube (looking towards it fpv) from left to right
						// left most being iter 0 and right most being iter cubeInt-1 
						if (j == 0) {
							var x = localhorZero + (boxgridWidth/1.95);
						} else { // for other rightwards cubes just superimpose boxgridwidth
							x = x + boxgridWidth;
						}

						// match this to x_coord_definition array, do not reuse i since its nested use j
						for (var k=0; k < x_coord_definition.length; k++) {
							if (x + TOL >=  x_coord_definition[k] && x - TOL <= x_coord_definition[k]) {
								// then we have found its position and hence should mark it at the array
								if (hor_coords_marker[k] == 0) {
                                             
                                             hor_coords_marker[k] = 1; // marked! 
                                            
								} else {                                             
                                             console.log("FATAL ERROR DUE TO OVERLAPPING CUBES"); 
                                             return 0; // this is fatal error...meaning overlapping cubes! so get out of function with 0 code
								}
							}
						}
					}
				}
			}
		}
	}
     
     // define a holder to hold the values derived from hor_coords_marker
     var holder = [];

     // set first and last to -1 
     var first = -1; var last = -1;

     // set a flag to determine if the user wants to import a plank cube
     var flag = false;

     // reset the value of the plank markers
     plank_marker = [0, 0, 0, 0, 0, 0];

     // search for the first and last occurence of 1 in hor_coords_marker
     for (var i=0; i<hor_coords_marker.length; i++) {
          if (hor_coords_marker[i] != 1) {
               continue;
          }
          if (first == -1) {
               first = i 
          }
          if (hor_coords_marker[i] == 1)   {
               plank_marker[i] = 1;
          }
          last = i 
     }

     // then copy the contents from the first and last indexes of hor_coords_marker into holder
     // now holder will contain the configurations properly. i.e if hor_coords_marker were [0,1,0,0,1,0], then holder would be [1,0,0,1] so we can import E43
     if (first != last) {
          for (var i=first; i<last; i++) {
               holder.push(hor_coords_marker[i]);
          }

          // dont forget to include the last index
          holder.push(hor_coords_marker[last]);
     }
     
     // but to use power of 'indexOf' this needs to be a string so transform array into String, and then remove the ','
     // hor_coords_marker = String(hor_coords_marker).replace(/,/g , ''); 

     holder = String(holder).replace(/,/g , ''); 

     // next, scan stackplankConfig array for any matching patterns 
     // logic stipulated to be able to match any of the configuration, so store all matches in a local array
     // alongside an accompanying array to specfiy the composite stackc cube Center pos coords. 
     // store all matches in a nested array matches
     var matches = []; // stores all possible composite stack cube in that row 
     var name;
     var plankExist = false;

     // check if there is a plank on the level I wanna import a plank on
     // only one plank may be on one level thus no plank is imported if there is already a plank on the level
     for (var i=0; i<stackcubeArray.length; i++) {
          if (stackcubeArray[i] != 0) {
               for (var j=0; j<stackplankConfig.length; j++) {
                    if (stackcubeArray[i] == stackplankConfig[j][0]) {
                         if (stackcubePos[i][1] <= vert_coord_import+TOL && stackcubePos[i][1] >= vert_coord_import-TOL) {
                              plankExist = true;
                         }
                    }
               }
          }
     }

     // loop through stackplankConfig and find the matches 
     for (var i = 0; i < stackplankConfig.length; i++) {

          // use indexOf method of string to find the start index of matched location in hor_coords_marker 
          // note that if indexOf returns no match, then it gives -1
          
          // THE INDEXOF METHOD RETURNS TOO EARLY THUS IMPORTING THE WRONG PLANK CUBE
          // var indMatch = holder.indexOf(stackplankConfig[i][1]); // get the 1001, 11001 etc etc

          var cond = false;
          if (stackplankConfig[i][1] == "1001") {
               if (holder == "101001" || holder == "100101") {
                    if (holder.includes(stackplankConfig[i][1])) {
                         name = stackplankConfig[i][0];
                         
                         first = holder.indexOf(stackplankConfig[i][1]);
                         last = first + stackplankConfig[i][1].length-1;
                         cond = true; 
                    }
               }
               else {
                    if (holder == stackplankConfig[i][1]) {
                         name = stackplankConfig[i][0];
                    }
               }
          }
          else {
               if (holder == stackplankConfig[i][1]) {
                    name = stackplankConfig[i][0];
               }
          }

          if (name != null && !plankExist) {
               if (confirm("Import a plank?")) {
                    var multiplier = (last - first)/2;

                    // 0.0198 is to make the centre coordinate more flush with the other cubes
                    var x = x_coord_definition[first] + boxgridWidth*multiplier + 0.0198;
                    for (var j=0; j<cubeIDs.length; j++) {
                         
                         var getMeshObj = scene.getMeshByID(cubeIDs[j]);
                         
                         // this condition is to check which mesh to delete from the scene for the 1001 plank configuration. 
                         // For example, say its 101001 on one row; then the cube in index 0 should not be deleted when importing the plank, only the cubes in index 2 and 5
                         if (cond) {
                              var index = parseInt(cubeIDs[j].slice(1))
                              var mesh_pos = stackcubePos[index][0]
                              
                              var cubeint = parseInt(name[1]);
                              var totallength = boxgridWidth*cubeint;
                              var start = x - totallength/2;
                              var end = x + totallength/2;
                              
                              if (mesh_pos >= start && mesh_pos <= end) {
                                   getMeshObj.dispose();
                                   getMeshObj = null; // can just ignore error msg from babylon due to this i.e. import error or some shit
                                   
                                   // remove from stack cube tracker arrays by setting null
                                   cubeIDs[j] = cubeIDs[j].substring(1)
                                   
                                   var cubeInd = parseInt(cubeIDs[j]);
                                   
                                   // removing the accessories from previous import
                                   if (stackAccesoryArray[cubeInd] != 0) {
                                        for (var i=0; i<stackAccesoryArray[cubeInd].length; i++) {
                                             if (stackAccesoryArray[cubeInd][i] != 0 && stackAccesoryArray[cubeInd][i] != null) {
                                                  var accessoryID = stackAccesoryArray[cubeInd][i];
                                                  // if it is a table accessory, then the next index is also taken up by "TA", but since we have removed "TA" in this iteration, 
                                                  // set the next index to 0 to avoid trying to remove it again
                                                  // next index is also "TA" because a table takes the space of two cubes 
                                                  if (accessoryID === "TA") {
                                                       stackAccesoryArray[cubeInd][i+1] = 0;
                                                  }
                                                  accessoryID = "S" + accessoryID + String(cubeInd);
                                                  var getaccessoryObj = scene.getMeshByID(accessoryID);
                                                  getaccessoryObj.dispose(); 
                                                  
                                                  getaccessoryObj = null;
                                             }
                                        }
                                   }
                              
                                   stackcubeArray[cubeInd] = 0; 
                                   
                                   stackcubePos[cubeInd] = 0; 
                                   
                                   // note: if a cube has been removed, remove its associated accesory array by setting to 0
                                   stackAccesoryArray[cubeInd] = 0;  // also reset empty array for any associated accesories 
                                   stackAccesoryPos[cubeInd] = 0;
                              }
                         }
                         else {
                              
                              getMeshObj.dispose(); 
                              getMeshObj = null; // can just ignore error msg from babylon due to this i.e. import error or some shit
                                 
                              // remove from stack cube tracker arrays by setting null
                              cubeIDs[j] = cubeIDs[j].substring(1)
                              
                              var cubeInd = parseInt(cubeIDs[j]);
                              
                              // removing the accessories from previous import
                              if (stackAccesoryArray[cubeInd] != 0) {
                                   for (var i=0; i<stackAccesoryArray[cubeInd].length; i++) {
                                        if (stackAccesoryArray[cubeInd][i] != 0 && stackAccesoryArray[cubeInd][i] != null) {
                                             var accessoryID = stackAccesoryArray[cubeInd][i];
                                             // if it is a table accessory, then the next index is also taken up by "TA", but since we have removed "TA" in this iteration, 
                                             // set the next index to 0 to avoid trying to remove it again
                                             // next index is also "TA" because a table takes the space of two cubes 
                                             if (accessoryID === "TA") {
                                                  stackAccesoryArray[cubeInd][i+1] = 0;
                                             }
                                             accessoryID = "S" + accessoryID + String(cubeInd);
                                             var getaccessoryObj = scene.getMeshByID(accessoryID);
                                             getaccessoryObj.dispose(); 
                                             
                                             getaccessoryObj = null;
                                        }
                                   }
                              }
                              stackcubeArray[cubeInd] = 0; 
                              
                              stackcubePos[cubeInd] = 0; 
                              
                              // note: if a cube has been removed, remove its associated accesory array by setting to 0
                              stackAccesoryArray[cubeInd] = 0;  // also reset empty array for any associated accesories 
                              stackAccesoryPos[cubeInd] = 0;    
                         }
                    }
                    
                    // next, import the plank stackcubes, DO NOT use importStackCubes_SUPP callback func since it calls this function
                    // simply create - copy paste a new SUPP importPlankStackCubes callback 
                    importPlankStackCubes_SUPP(scene, gridMat, x, vert_coord_import, name);

                    // break here cos the confirm box wont go away if there isnt a break
                    flag = true;
                    break;

               } else {
                    // break here cos the confirm box wont go away if there isnt a break
                    break;
               }
          }
     }
     
     if (name != null && flag) {

          // find the row of buttons that should be moved out of the scene
          var row = findRow(vert_coord_import);

          // move the buttons out of the scene

          var buttons = stackbtn_grid[row];
          for (var i=first; i<last+1; i++) {
               var btn = buttons[i][0];
               var rx_target = buttons[i][1];
               var cy_target = buttons[i][2];
               btn.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], -10), scene);
               buttons[i][3] = 0;
               
               if (plank_marker[i] == 1) {
                    buttons[i][4] = 1; // make sure that the space occupied by the plank CUBES is marked to have cubes in it
               }
               
          }
     }

}

function importPlankStackCubes_SUPP(scene, gridMat, x, y, plankstackprefix) {
     var reverse = false;

     // name of cube to be imported
     // check if it is the reverse of a stack plank or not
     if (plankstackprefix[0] == "R") {
          // remove the R so that we can import the plank
          plankstackprefix = plankstackprefix.slice(1);
          reverse = true;
     }

     var cubeName = plankstackprefix + postfix;  
     
     var intprefix = parseInt(cubeName[2]) - 1; // get the integer 2 out of E2 for instance.
     
     BABYLON.SceneLoader.ImportMesh("", hostUrl, cubeName, scene, 
     function (newMeshes) {
    
          // dirty hack to get around not being able to assign name and id to mesh
          var plankstackMesh = newMeshes[0]; 
          
          plankstackMesh.id = String('ES' + stackcubeCtr); 
          
          plankstackMesh.name = String('ES' + stackcubeCtr); 

          undoSTACK.push(plankstackMesh.id);

          plankstackMesh.position.x = x; 
          plankstackMesh.position.y = y;
          plankstackMesh.position.z = gridMat[0][0][2]; // this one is constant for all stack cubes 
          
          // define mesh rotation
          var radians = BABYLON.Tools.ToRadians(180);
          plankstackMesh.rotation.y = Math.PI/2;

          if (reverse) {
               plankstackMesh.rotation.x = radians;
               plankstackMesh.rotation.z = radians;
          }
          // console.log(stackAccesoryArray)
                    
          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          plankstackMesh.material = boxMaterial;

          // place back the R to the prefix if it is reversed
          if (reverse) {
               plankstackprefix = "R" + plankstackprefix;
          }

          // update global counter for stack cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
          stackcubeArray.push(plankstackprefix);
          
          stackcubePos.push([x, y, plankstackMesh.position.z]); // push grid position in stackcubePos array as an array of 3 elements x,y,z 
          
          stackcubeCtr = stackcubeCtr + 1;
          
          // update global stack cube accesory in tandem, populate with empty array and empty matrix 
          // note: cant use zero here, since a stack cube may have more than one accesory

          stackAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so initialize zero array
          stackAccesoryPos.push(new Array(intprefix).fill(0)); 

          meshSelectControl (scene, plankstackMesh,'3');
     }); 
}


function importStackCubes_SUPP(scene, gridMat, rx, cy, stackprefix) {
     // name of cube to be imported
     var cubeName = stackprefix + postfix;  
     
     // INTPREFIX FOR THIS FUNCTION INDICATES HOW MANY SLOTS WHERE AN ACCESSORY CAN BE IMPORTED IN A PLANK CUBE
     var intprefix = parseInt(cubeName.slice(1)); 
     
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
          
          
          undoSTACK.push(stackMesh.id)
          // give mesh position based on rx == rx_coord and cy == cy_coord
          // REMINDER: STUPID! THIS IS THE PROBLEM OF ALL MOTHERFUCKERS! 
          // RX AND CY IN THIS CASE ARE THE COORDINATES! DIRECTLY , NOT THE GRID MAT MATRIX INDEXES
          stackMesh.position.x = rx; 
          stackMesh.position.y = cy;
          stackMesh.position.z = gridMat[0][0][2]; // this one is constant for all stack cubes 
          
          // define mesh rotation
          stackMesh.rotation.y = Math.PI/2;

          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          stackMesh.material = boxMaterial;
         
          // update global counter for stack cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
          stackcubeArray.push(stackprefix);
          
          stackcubePos.push([stackMesh.position.x,stackMesh.position.y,stackMesh.position.z]); // push grid position in stackcubePos array as an array of 3 elements x,y,z 
          stackcubeCtr = stackcubeCtr +  1; 

          // update global stack cube accesory in tandem, populate with empty array and empty matrix 
          // note: cant use zero here, since a stack cube may have more than one accesory
          stackAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so initialize zero array
          stackAccesoryPos.push(new Array(intprefix).fill(0)); 

          importPlankCube(scene, stackMesh, gridMat); 

          // configure actionManager
          meshSelectControl (scene, stackMesh,'2');
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
                    if (stackcubePos[i][1] == newY) {
                         if (stackcubeInt == 1) {
                              // if it is stack cube 1 then just use the position as is (i.e. single value for left right testing)
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
                    // // destroy the NEw B1 (since this is new import of basecube it MUST be B1! if not check the callback bug!) stackMesh obj
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
                    
                        for (var i=0; i<stackAccesoryArray[RightExistCubeInd].length; i++) {
                         
                            if (stackAccesoryArray[RightExistCubeInd][i] != 0 && stackAccesoryArray[RightExistCubeInd][i] != null) {
 
                              var accessoryID = stackAccesoryArray[RightExistCubeInd][i];
                              // if it is a table accessory, then the next index is also taken up by "TA", but since we have removed "TA" in this iteration, 
                              // set the next index to 0 to avoid trying to remove it again
                              // next index is also "TA" because a table takes the space of two cubes 
                              if (accessoryID === "TA") {
                                   stackAccesoryArray[RightExistCubeInd][i+1] = 0;
                              }
                              accessoryID = "S" + accessoryID + String(RightExistCubeInd);
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
                        for (var i=0; i<stackAccesoryArray[LeftExistCubeInd].length; i++) {
                            if (stackAccesoryArray[LeftExistCubeInd][i] != 0 && stackAccesoryArray[LeftExistCubeInd][i] != null) {
                              var accessoryID = stackAccesoryArray[LeftExistCubeInd][i];
                              // if it is a table accessory, then the next index is also taken up by "TA", but since we have removed "TA" in this iteration, 
                              // set the next index to 0 to avoid trying to remove it again
                              // next index is also "TA" because a table takes the space of two cubes 
                              if (accessoryID === "TA") {
                                   stackAccesoryArray[LeftExistCubeInd][i+1] = 0;
                              }
                              accessoryID = "S" + accessoryID + String(LeftExistCubeInd);
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
                    
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                     
                    importStackCubes_SUPP(scene,gridMat,rx_coord,newY,stackprefix, newX); 
               }
               // else if either one is activated...
               else if (RightExistCubePrefix != '' || LeftExistCubePrefix != '') { 
                    // destroy the NEw B1 (since this is new import of stackcube it MUST be B1! if not check the callback bug!) stackMesh obj
                    stackMesh.dispose();
                    stackMesh = null;// nullify to tell GC to collect ! this will result in some error msg by babylon which we can ignore!

                    // Destroy all 'old' EXISTING meshes to the left OR right , if any, 
                    // this implies the right OR left (potential, if any) neighbouring cubes 
                    // apply this to left and right cubes individually
                    if (RightExistCubePrefix != '') {
                         
						var meshid_R = 'E' + String(RightExistCubeInd); 
						var getMeshObj_R = scene.getMeshByID(meshid_R);                            
						if (getMeshObj_R != null) {
							getMeshObj_R.dispose(); 
							getMeshObj_R = null; // can just ignore error msg from babylon due to this i.e. import error or some shit

							if (stackAccesoryArray[RightExistCubeInd] != 0) {
								for (var i=0; i<stackAccesoryArray[RightExistCubeInd].length; i++) {
									if (stackAccesoryArray[RightExistCubeInd][i] != 0 && stackAccesoryArray[RightExistCubeInd][i] != null) {
											var accessoryID = stackAccesoryArray[RightExistCubeInd][i];
											// if it is a table accessory, then the next index is also taken up by "TA", but since we have removed "TA" in this iteration, 
											// set the next index to 0 to avoid trying to remove it again
											// next index is also "TA" because a table takes the space of two cubes 
											if (accessoryID === "TA") {
												stackAccesoryArray[RightExistCubeInd][i+1] = 0;
											}
											accessoryID = "S" + accessoryID + String(RightExistCubeInd);
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
						}
						
						
						//console.log("INFO - Obtained right neighbour cube mesh via id");
                    } 
                    else if (LeftExistCubePrefix != '') {
						var meshid_L = 'E' + String(LeftExistCubeInd);
                              var getMeshObj_L = scene.getMeshByID(meshid_L);
						if (getMeshObj_L != null) {
							getMeshObj_L.dispose(); 
							getMeshObj_L = null;
                                   
							if (stackAccesoryArray[LeftExistCubeInd] != 0) {
								for (var i=0; i<stackAccesoryArray[LeftExistCubeInd].length; i++) {
									if (stackAccesoryArray[LeftExistCubeInd][i] != 0 && stackAccesoryArray[LeftExistCubeInd][i] != null) {
										var accessoryID = stackAccesoryArray[LeftExistCubeInd][i];
										// if it is a table accessory, then the next index is also taken up by "TA", but since we have removed "TA" in this iteration, 
										// set the next index to 0 to avoid trying to remove it again
										// next index is also "TA" because a table takes the space of two cubes 
										if (accessoryID === "TA") {
											stackAccesoryArray[LeftExistCubeInd][i+1] = 0;
										}
										accessoryID = "S" + accessoryID + String(LeftExistCubeInd);
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
                    
                    }
                    // this implements just a simple mesh import directly to rx_coord, cy_coord which are specific coordinates 
                    // use newY as the y coord since its the same for all base cubes 
                    importStackCubes_SUPP(scene,gridMat,rx_coord,newY,stackprefix);
                   
               } else if (RightExistCubePrefix == '' && LeftExistCubePrefix == '') {
                    // just import the E1 new cube as is 
                    console.log(stackAccesoryArray)
                    console.log("no match neighbours");
                    
                    var intprefix = parseInt(stackprefix.slice(1));
                    
                    // else if both are still '', meaning no match so we can do business as usual and place the new B1 at the grid box r-c center 
                    stackMesh.position.x = newX; // recall, row index, col index
                    stackMesh.position.y = newY;
                    stackMesh.position.z = newZ; // actually Z is constant...see how gridMat is defined! 

                    // give the mesh a unique ID (do this for every 'if'). since this is base cube, it is B1 B2 B3 B4 .. BN
                    stackMesh.id = String('E' + stackcubeCtr); 
                    
                    stackMesh.name = String('E' + stackcubeCtr); 
                    
                    undoSTACK.push(stackMesh.id);

                    // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
                    stackcubeArray.push(stackprefix);
                    
                    stackcubePos.push([stackMesh.position.x,stackMesh.position.y,stackMesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
                    stackcubeCtr = stackcubeCtr +  1; 
                    
                    // dont forget to update accesories with associated empty array
                    stackAccesoryArray.push(new Array(intprefix).fill(0));  
                    stackAccesoryPos.push(new Array(intprefix).fill(0)); 

                    importPlankCube(scene, stackMesh, gridMat); 

                    // define mesh rotation
                    stackMesh.rotation.y = Math.PI/2;

                    // define mesh material
                    var boxMaterial = createboxMaterial(scene); 
                    stackMesh.material = boxMaterial;
     
                    // configure mesh actionManager
                    meshSelectControl (scene, stackMesh ,'2');

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


function btn_Stack(scene, gridMat, rx_target, cy_target, btnName) { 
     
     //  button stuff
     var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
     var button = BABYLON.GUI.Button.CreateImageOnlyButton(btnName, "https://cdn.shopify.com/s/files/1/0185/5092/products/symbols-0173_800x.png?v=1369543613");
     button.width = "20px";
     button.height = "20px";
     button.color = "white";
     var TOL = 0.08;
      // get the vertical coordinates of the stack cube 
     
     // position the button at rx_target and cy_target, using gridMat data, unmodified
     
     // on click event for the button
     button.onPointerClickObservable.add(function() {
          var plankAbove = false;
          var plankInt = 0;
          var stack_cube_ycoord = gridMat[rx_target][cy_target][1];
          
          for (var i=0; i<stackcubeArray.length; i++) {
               if (stackcubeArray[i] != 0) {
                    for (var j=0; j<stackplankConfig.length; j++) {
                         if (stackcubeArray[i] == stackplankConfig[j][0]) {
                              // check if the plank stack cube is directly above the base cubes
                              // if it is not, then the stack buttons are imported after the base buttons are pressed
                              // if the plank is two times higher than the width of the box or if the plank is lower than the coordinates of the box, then the plank is not directly above
                              if (stackcubePos[i][1] >= stack_cube_ycoord+(boxgridWidth*2) || stackcubePos[i][1] <= stack_cube_ycoord) {
                                   continue;
                              }
                              // if there is a plank stack cube directly above the buttons, don't import the stack cube buttons
                              else {
                                   var name = stackplankConfig[j][0];
                                   if (name[0] == "R") {
                                        var plankSize = parseInt(name[2]);
                                   }
                                   else if(name[0] == "E") {
                                        var plankSize = parseInt(name[1]);
                                   }
                                   
                                   var plankCoor = stackcubePos[i][0];
                                   var halfplankLength = (plankSize*boxgridWidth)/2;

                                   // get the left most and right most coordinates of the plank
                                   var low = plankCoor - halfplankLength;
                                   var high = plankCoor + halfplankLength;
                                   
                                   // don't spawn the buttons which are underneath the plank
                                   if (gridMat[rx_target][cy_target][0] >= low && gridMat[rx_target][cy_target][0] <= high){
                                        plankAbove = true;
                                   }
                              }
                         }
                    }
               }
          }
          
          // if there is a plank directly above the stack cubes, don't move the stack button
          // if the stack cube is not under a plank, don't spawn a button
          
          importStackCubes(scene, gridMat, rx_target, cy_target, "E1"); 
          
          if (!plankAbove) {
               // move current button out of the scene
               button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], -10), scene);
               stackbtn_grid[rx_target][cy_target][3] = 0;
               stackbtn_grid[rx_target][cy_target][4] = 1;

               var row = rx_target
               // increment the row number if the current row is not the highest row
               if (row < gridMat.length-1) {
                    row += 1;
               }
               else {
                    stackbtn_grid[row][cy_target][0].moveToVector3(new BABYLON.Vector3(gridMat[row][cy_target][0], gridMat[row][cy_target][1], -10), scene);
                    stackbtn_grid[row][cy_target][3] = 0;
                    stackbtn_grid[row][cy_target][4] = 1;
               }

               var buttons = stackbtn_grid[row];
               
               // move the button above current cube into the scene
               // NOTE: when moving buttons, -10 is to move button out of sight, 0 is to move button into sight

               var cubeflag = false;

               for (var i=0; i<stackcubeArray.length; i++) {
                    if (stackcubeArray[i] != 0 ) {
                         if (stackcubePos[i][1] == gridMat[row][cy_target][1]) {
                              var cubeint = parseInt(stackcubeArray[i][1]);
                              var totallength = cubeint*boxgridWidth;
                              var start = stackcubePos[i][0] - totallength/2;
                              var end = stackcubePos[i][0] + totallength/2;
                              if (gridMat[row][cy_target][0] > start && gridMat[row][cy_target][0] < end) {
                                   cubeflag = true;
                                   break;
                              }
                              
                         }
                    }
               }
               
               if (!cubeflag && rx_target < gridMat.length-1) {
                    buttons[cy_target][0].moveToVector3(new BABYLON.Vector3(gridMat[row][cy_target][0], gridMat[row][cy_target][1], 0), scene);
                    stackbtn_grid[row][cy_target][3] = 1;
                    stackbtn_grid[row][cy_target][4] = 0;
               }
               
          }
          else {
               button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], -10), scene);
               stackbtn_grid[rx_target][cy_target][3] = 0;
               stackbtn_grid[rx_target][cy_target][4] = 1;
          }

     });

     advancedTexture.addControl(button);
     button.moveToVector3(new BABYLON.Vector3(gridMat[rx_target][cy_target][0], gridMat[rx_target][cy_target][1], -10), scene);
     
     return button;
 }

 // -------------------------------------- ACCESORIES ----------------------------------------------- //

// Accesories import for base cubes 
function importBaseAccesories(scene, asstype, cubeNameId, importPos) {

    // accesories management for base cubes only

    // here, args type is a string to identify which accesory is being imported. 
    //            cubeNameId is a string identifying id of associated cube , which contains its array tracker index! 
    //            cubeType is a string whether or not it is 'stack' or 'base' 
    //            importPos is an integer specifying which cube of a composite cube is being referred to
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
    if (importPos > cubePrefixInt) {
        console.log('[ERROR] Specific cube position cannot be larger than base cube prefix int');
        return 0; 
    }

    console.log("[INFO] Imported accesory mesh"); 

    BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
    function (assMesh) {
        var assMesh = assMesh[0]; // get the mesh object 

        // define mesh material
        var boxMaterial = createboxMaterial(scene); 
        assMesh.material = boxMaterial;
        
        // naming convention for accesories base cube mesh AX<int> i.e. AXS1, AXS2, AXS3, AXS4 ... for X shelve
        // where <int> refers to the associated cube mesh unique index 
        assMesh.name = 'A' + asstype + String(cubemeshInd); 
        assMesh.id = 'A' + asstype + String(cubemeshInd); 
        
        undoSTACK.push(assMesh.id)

        // here, compute the x position of the imported accesory 
        // NOTE SEE TO-DO below.
        if (cubePrefixInt%2 == 0) {
            // if this cube is either B2,B4,B6 , use this formulae to determine x pos rel to cube CoG
            var xposMesh = cubePos[0] + ((importPos - ((cubePrefixInt/2) + 0.5))*boxgridWidth); 

        } 
        else if (cubePrefixInt%2 > 0) {
            // else if the cube is either B1,B3,B5, use this formulae to determine x pos rel to cube CoG
            // TO-DO: if both are exactly same formulae, just use one no need conditional...check properly first 
            var xposMesh = cubePos[0] + ((importPos - ((cubePrefixInt/2) + 0.5))*boxgridWidth);
        }
        
        // position the accesory mesh at base cube 
        assMesh.position.x = xposMesh;
        assMesh.position.y = cubePos[1];
        assMesh.position.z = cubePos[2];
        assMesh.rotation.y = Math.PI/2;

        // register the mesh for actions
        assMesh.actionManager = new BABYLON.ActionManager(scene); 
        
        // update base accesory arrays at their respective specific cubes position
        // recall that importPos is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5
        
        baseAccesoryArray[cubemeshInd][importPos - 1] = asstype;
        baseAccesoryPos[cubemeshInd][importPos - 1] = [xposMesh, cubePos[1], cubePos[2]]; 
        

    });
}

function importStackAccesories(scene, asstype, cubeNameId, importPos) {

    // accesories management for base cubes only

    // here, args type is a string to identify which accesory is being imported. 
    //            cubeNameId is a string identifying id of associated cube , which contains its array tracker index! 
    //            cubeType is a string whether or not it is 'stack' or 'base' 
    //            importPos is an integer specifying which position we want to import the accessory to.... 

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
     } else if (asstype == 'TA') { // table
		var assmeshImp = 'table-singlemesh.babylon'; // continue on...until all accesory is covered
     } 

	// get the cube integer unique number
	cubemeshInd = parseInt(cubeNameId.slice(1)); 

	// get the target cube mesh coords pos (remmember, cubePos is an array of 3 elements x y z)
	var cubePos = stackcubePos[cubemeshInd]; // this will be the base position for any assceory imports
	
	// get the target cube mesh prefix (only interested in the number 1-6 for B1-B6)

	var cubePrefixInt = parseInt(stackcubeArray[cubemeshInd].slice(1)); 
	
    console.log("[INFO] Imported accesory mesh"); 

    BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
    function (assMesh) {
		// the coordinates of the first stack cube level, and the tolerance level (used for checking)
		var TOL = 0.08;
		var firststackLvl = 0.685;

          var assMesh = assMesh[0]; // get the mesh object 

          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          assMesh.material = boxMaterial;
		
          assMesh.name = 'S' + asstype + String(cubemeshInd); 
          assMesh.id = 'S' + asstype + String(cubemeshInd); 

          undoSTACK.push(assMesh.id)
          
		// this is the case for importing tables
		if (asstype === 'TA') {
			if (cubePrefixInt > 1) { 
				if (cubePos[1] >= firststackLvl-TOL && cubePos[1] <= firststackLvl+TOL){
					var halfLength = (boxgridWidth*cubePrefixInt)/2;
                         
					// startCoord is the coordinates of the leftmost edge of the selected mesh
					var startCoord = cubePos[0] - halfLength;
					
					// by using boxgridWidth multiplied with the Position chosen (Position 1, 2, 3), we know where to import the table because it is a multiple of boxgridWidth
					// IMPORTANT : this is completely dependent on the html dropdown selection on the modal i.e Position 1, Position 2 etc
					// If naming convention is changed then this method has to change appropriately
					assMesh.position.x = startCoord + boxgridWidth*importPos;
					assMesh.position.y = 0.37;
					assMesh.position.z = -0.93;
					assMesh.rotation.y = Math.PI/2;

					// update stack accesory arrays at their respective specific cubes position
					stackAccesoryArray[cubemeshInd][importPos - 1] = asstype;
					stackAccesoryArray[cubemeshInd][importPos] = asstype;
					stackAccesoryPos[cubemeshInd][importPos - 1] = [assMesh.position.x, assMesh.position.y, assMesh.position.z]; 
					stackAccesoryPos[cubemeshInd][importPos] = [assMesh.position.x, assMesh.position.y, assMesh.position.z]; 
                    }
                    else{
                         alert("Tables can only be imported on the second level");
                         assMesh.dispose();
                         return;
                    }
			}
			else {
				alert("Minimum of 2 cubes together are needed for a table");
				assMesh.dispose();
				return;
			}
		}
		
		// case for all other accesories
		else {
			// here, compute the x position of the imported accesory 
			// NOTE SEE TO-DO below.
			var xposMesh = cubePos[0] + ((importPos - ((cubePrefixInt/2) + 0.5))*boxgridWidth); 
	
			// position the accesory mesh at base cube 
			assMesh.position.x = xposMesh;
			assMesh.position.y = cubePos[1];
			assMesh.position.z = cubePos[2];
			assMesh.rotation.y = Math.PI/2;

			// update stack accesory arrays at their respective specific cubes position
			stackAccesoryArray[cubemeshInd][importPos - 1] = asstype;
			stackAccesoryPos[cubemeshInd][importPos - 1] = [xposMesh, cubePos[1], cubePos[2]]; 

		}

        // register the mesh for actions
		assMesh.actionManager = new BABYLON.ActionManager(scene); 
    });
}

function importPlankAccesories(scene, asstype, cubeNameId, importPos) {
	// the coordinates of the first stack cube level, and the tolerance level (used for checking)
	var TOL = 0.08;
	var firststackLvl = 0.685;
	
	// accesories management for base cubes only

	// here, args type is a string to identify which accesory is being imported. 
	//            cubeNameId is a string identifying id of associated cube , which contains its array tracker index! 
	//            cubeType is a string whether or not it is 'stack' or 'base' 
	//            importPos is an integer specifying which cube of a composite cube is being referred to
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
	} else if (asstype == 'TA') { // table
		var assmeshImp = 'table-singlemesh.babylon'; 
	} 
	// else if (asstype == 'DD') { // six box shelve
	// 	var assmeshImp = 'doubledrawer.babylon'; // continue on...until all accesory is covered
	// } else if (asstype == 'TA') { // six box shelve
	// 	var assmeshImp = 'table.babylon'; // continue on...until all accesory is covered
	// } else if (asstype == 'DO') { // six box shelve
	// 	var assmeshImp = 'door.babylon'; // continue on...until all accesory is covered
	// } 

	// get the cube integer unique number
	cubemeshInd = parseInt(cubeNameId.slice(2)); 
	
	// get the target cube mesh coords pos (remmember, cubePos is an array of 3 elements x y z)
	var cubePos = stackcubePos[cubemeshInd]; // this will be the base position for any assceory imports

	// get the target cube mesh prefix (only interested in the number 1-6 for B1-B6)
	var cubePrefixInt = parseInt(stackcubeArray[cubemeshInd].slice(1));
	
	// find the config of the selected plank i.e if its 1001 or 100001 etc
	var config = findConfig(stackcubeArray[cubemeshInd]);

	// simple sanity check 
	if (importPos > cubePrefixInt) {
		console.log('[ERROR] Specific cube position cannot be larger than stack cube prefix int');
		return 0; 
     }

     var importInd = findOccurrences(config, importPos);

     console.log("[INFO] Imported accesory mesh"); 
 
	BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
	function (assMesh) {
		var assMesh = assMesh[0]; // get the mesh object 

		// define mesh material
		var boxMaterial = createboxMaterial(scene); 
		assMesh.material = boxMaterial;
		
		// naming convention for accesories stack cube mesh PXS<int1>-<int2> i.e. PXS1-1, PXS2-2 ... for X shelve
          // where <int1> refers to the associated accessory mesh unique index 
          // and <int2> refers to the associated cube mesh unique index
		assMesh.name = 'P' + asstype + String(importPos) + "-" + String(cubemeshInd); 
          assMesh.id = 'P' + asstype + String(importPos) + "-" + String(cubemeshInd); 

          undoSTACK.push(assMesh.id)
          if (asstype == "TA") {
               if (importInd < 0) {
                    alert("can't import table");
                    assMesh.dispose();
                    return;
               }
               if (cubePos[1] >= firststackLvl-TOL && cubePos[1] <= firststackLvl+TOL) {
                    var halflength = ((config.length)*boxgridWidth)/2;
                    var beginning = cubePos[0] - halflength;
                    // importInd + 1 is the offset from the beginning of the plank. Used to calculate the X coordinates of the plank
                    var xpos = (importInd+1)*boxgridWidth + beginning;

                    assMesh.position.x = xpos;
                    assMesh.position.y = 0.37;
                    assMesh.position.z = -0.93;
                    assMesh.rotation.y = Math.PI/2;

                    // register the mesh for actions
                    assMesh.actionManager = new BABYLON.ActionManager(scene); 
                    
                    // find the number of zeroes in the plank config
                    var zeroes = zeroesCounter(config);

                    // get the indexing in the stack accessory arrays right
                    var index = importInd + 1;
                    // for example if the config is 110011, the accessory array would be [0,0,0,0]
                    // thus when using importInd to index this array, it goes out of bounds as the array is less than the length of the string
                    // by minusing the indexes after the zeroes with the number of zeroes, then the arrays can be indexed properly.
                    if ((importInd-zeroes) > 0) {
                         index = index - zeroes;
                    }
                    stackAccesoryArray[cubemeshInd][index] = asstype;
                    stackAccesoryArray[cubemeshInd][index - 1] = asstype;
                    stackAccesoryPos[cubemeshInd][index] = [assMesh.position.x, assMesh.position.y, assMesh.position.z]; 
                    stackAccesoryPos[cubemeshInd][index - 1] = [assMesh.position.x, assMesh.position.y, assMesh.position.z]; 
                    
               }
          }
          else {
               // find out which cube in the scene the user wants to import the mesh to based on the plank configuration
               var whichCube = findIndex(config, importPos);

               var halflength = ((config.length)*boxgridWidth)/2;
               var beginning = cubePos[0] - halflength;
               var halfboxgridwidth = boxgridWidth/2;

               if (whichCube >= 0) {
                    var xpos = beginning + (whichCube*boxgridWidth) + halfboxgridwidth;

                    assMesh.position.x = xpos;
                    assMesh.position.y = cubePos[1];
                    assMesh.position.z = cubePos[2];
                    assMesh.rotation.y = Math.PI/2;
                    
                    // register the mesh for actions
                    assMesh.actionManager = new BABYLON.ActionManager(scene); 

                    // update base accesory arrays at their respective specific cubes position
                    // recall that importPos is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5
                    stackAccesoryArray[cubemeshInd][importPos - 1] = asstype;
                    stackAccesoryPos[cubemeshInd][importPos - 1] = [xpos, cubePos[1], cubePos[2]]; 
               }
               
          }
          
          // position the accesory mesh at base cube 
  
	});
}


// =============================================== UTILITY FOR PLANK ACCESSORIES ===========================================================================
// this function is to find the position to import the accessory in the plank
function findIndex(array, occurence){
	// the counter is to indicate the location(index) the accessory is to be imported
	var counter = 0;
	for (var i=0; i<array.length; i++){
		if (array[i] == 1) {
			counter += 1;
			
			// once the counter matches the occurence(Stack cube 1/2/3/etc), then it returns the current index
			if (counter == occurence) {
				return i;
			}
		}    
	}

	return -1;
}

// this function is to loop through the stackplankConfig array to find the plank configuration that matches the name
function findConfig(target){
	for (var i=0; i<stackplankConfig.length; i++) {
		if (stackplankConfig[i][0] === target) {
			return stackplankConfig[i][1];
		}
	}
}

// finds occurences where there are two stack cubes next to each other such as 11001 
function findOccurrences(array, targetNum) {
     var occurrence = 0;
     for (var i=0; i<array.length; i++) {
          if (array[i] == 1 && array[i+1] == 1) {
               occurrence += 1;
               if (occurrence == targetNum) {
                    return i;
               }
          }
     }
     return -1;
}


function zeroesCounter(array){
     counter = 0;
     for (var i=0; i<array.length; i++) {
          if (array[i] == 0) {
               counter += 1;
          }
     }
     return counter;
}

// =============================================== UTILITY FOR PLANK ACCESSORIES END ===========================================================================

 // remove all zeroes from the main arrays for checkout
function cleanUp(array) {
	for (var i=array.length-1; i>= 0; i--){
		if (array[i] === 0) {
			array.splice(i, 1);
		}
	}
}

// make buttons for each coordinate
// the format of each index in the button arrays are [button object, row, col, button binary val(0 or 1), cube binary val(0 or 1)]
// the button binary val determines whether or not the button is visible to the user or not
// the cube binary val determines whether or not there is a cube in the position of that button or not
// for example, if the button binary val is 0, then there is no button in that location, but if the cube binary val is 1, then there is a cube in that location
// NOTE: when moving buttons, -10 is to move button out of sight, 0 is to move button into sight
function initButtons(){
     scene.updateTransformMatrix();
     for (var i=0; i<gridMat[0].length; i++) {
          var basebtn = btn_BaseHorInit(scene, gridMat, 0, i, i+1);
          basebuttonArray.push([basebtn, 0, i, 0, 0]);
     }

     for (var i=1; i<gridMat.length; i++){
          for (var j=0; j<gridMat[0].length; j++){
               var stackbtn = btn_Stack(scene, gridMat, i, j, j);
               stackbtn_grid[i].push([stackbtn, i, j, 0, 0]);
          }
     }
}

function findRow(vert_coord){
     for (var i=1; i<stackbtn_grid.length; i++){
          var cy_target = stackbtn_grid[i][0][2];
          var rx_target = stackbtn_grid[i][0][1];
          var btn_vert_coord = gridMat[rx_target][cy_target][1];
          
          if (btn_vert_coord == vert_coord) {
              return i;
          }
     }
}


function callbackFromCanvas(type){
    
     var importPos = id;
     if (type == "base") {
          importBaseAccesories(scene, asstype, basecubeName, importPos); 
     }
     else if (type == "stack"){
          importStackAccesories(scene, asstype, stackcubeName, importPos);
     }
     else if (type == "plank"){
          importPlankAccesories(scene, asstype, plankcubeName, importPos); 
     }
}


function scene_recreation() {
     
     basecubes = ["B4", "B1"];
     baseposition = [[1.79225, 0.29500000000000004, -0.3], [3.16925, 0.29500000000000004, -0.3]];

     baseaccessories = [["NS", 0, 0, 0], ["SS"]];
     baseaccessoriesposition = [[[1.2169999999999999, 0.29500000000000004, -0.3], 0, 0, 0], [[3.16925, 0.29500000000000004, -0.3]]];

     stackcubes = ["E4", "E1", "E53", "E1", "E2"];
     stackposition = [[1.79225, 0.685, -0.3], [3.16925, 0.685, -0.3], [2.38205, 1.0750000000000002, -0.3], [1.20175, 1.0750000000000002, -0.3], [1.3985833333333333, 1.4649999999999999, -0.3]];

     stackaccessories = [["TA", "TA", 0, 0], ["NS"], ["SS", 0], [0], [0, "XS"]];
     stackaccessoriesposition = [[[1.4087499999999997, 0.37, -0.93], [1.4087499999999997, 0.37, -0.93], 0, 0], [[3.16925, 0.685, -0.3]], [[1.61505, 1.0750000000000002, -0.3], 0], [0], [0, [1.5903333333333334, 1.4649999999999999, -0.3]]];

     for (var i=0; i<basecubes.length; i++) {
          basecubes_recreation(baseposition[i], basecubes[i]);
     }

     for (var i=0; i<stackcubes.length; i++) {
          stackcubes_recreation(stackposition[i], stackcubes[i]);
     }


     var delayInMilliseconds = 400;
     setTimeout(function() {
          for (var i=0; i<baseaccessories.length; i++) {
               for (var j=0; j<baseaccessories[i].length; j++) {
                    if (baseaccessories[i][j] != 0) {
                         baseaccessory_recreation(baseaccessoriesposition[i][j], baseaccessories[i][j], i, j);
                    }
               }
          }

          var table_encounter = 0;
          for (var i=0; i<stackaccessories.length; i++) {
               for (var j=0; j<stackaccessories[i].length; j++) {
                    if (stackaccessories[i][j] != 0) {
                         if (stackaccessories[i][j] == "TA") {
                              if (table_encounter == 2) {
                                   table_encounter = 1;
                              }
                              else if (table_encounter < 2){
                                   table_encounter += 1;
                                   
                              }

                              if (table_encounter == 1) {
                                   stackaccessory_recreation(stackaccessoriesposition[i][j], stackaccessories[i][j], i, j);
                              }
                         }
                         else {
                              stackaccessory_recreation(stackaccessoriesposition[i][j], stackaccessories[i][j], i, j);
                         }
                         
                    }
               }
          }
     }, delayInMilliseconds);
     

     
}

function stackaccessory_recreation(coords, type, index, importPos) {
     
     var planks = ["E43", "E53", "E54", "E63", "E64", "E65b", "E65a", "RE54", "RE64", "RE65a"];

     // the coordinates of the first stack cube level, and the tolerance level (used for checking)
     var TOL = 0.08;
     var firststackLvl = 0.685;

     if (type == 'XS') { // X shelve
		var assmeshImp = 'Xshelve.babylon'; // this name has to be same as the mesh file from cdn
	} else if (type == 'SS') { // Single shelve
		var assmeshImp = 'singleshelve.babylon';
	} else if  (type == 'DS') { // Double shelve
		var assmeshImp = 'doubleshelve.babylon'; 
	} else if (type == 'NS') { // nine box shelve
		var assmeshImp = 'nineboxshelve.babylon'; 
	} else if (type == 'SB') { // six box shelve
		var assmeshImp = 'sixboxshelve.babylon';
     } else if (type == 'TA') { // table
		var assmeshImp = 'table-singlemesh.babylon'; // continue on...until all accesory is covered
     } 

     var cube_type = stackcubes[index];

     // get the target cube mesh prefix (only interested in the number 1-6 for B1-B6)
	var cubePrefixInt = parseInt(stackcubeArray[index].slice(1));

     /////////////////////////////////////////// for plank cube accessories ////////////////////////////////////////////
     if (planks.includes(cube_type)){
          BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
          function (newMeshes) {
               var mesh = newMeshes[0];
               // define mesh material
               var boxMaterial = createboxMaterial(scene);
               mesh.material = boxMaterial;
               // naming convention for accesories stack cube mesh PXS<int1>-<int2> i.e. PXS1-1, PXS2-2 ... for X shelve
               // where <int1> refers to the associated accessory mesh unique index 
               // and <int2> refers to the associated cube mesh unique index
               mesh.name = 'P' + type + String(importPos) + "-" + String(index); 
               mesh.id = 'P' + type + String(importPos) + "-" + String(index); 

               // position the accesory mesh at base cube 
               mesh.position.x = coords[0];
               mesh.position.y = coords[1];
               mesh.position.z = coords[2];
               mesh.rotation.y = Math.PI/2;

               // register the mesh for actions
               mesh.actionManager = new BABYLON.ActionManager(scene);

               if (type == 'TA') {
                    stackAccesoryArray[index][importPos] = type;
                    stackAccesoryArray[index][importPos + 1] = type;
                    stackAccesoryPos[index][importPos] = [coords[0], coords[1], coords[2]];
                    stackAccesoryPos[index][importPos + 1] = [coords[0], coords[1], coords[2]];
               }
               else {
                    
                    // update base accesory arrays at their respective specific cubes position
                    // recall that importPos is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5

                    stackAccesoryArray[index][importPos] = type;
                    stackAccesoryPos[index][importPos] = [coords[0], coords[1], coords[2]];
               }
          });
     }
     /////////////////////////////////////////// for stack cube accessories /////////////////////////////////////////////
     else {
          BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
          function (newMeshes) {
               var mesh = newMeshes[0];
               // define mesh material
               var boxMaterial = createboxMaterial(scene); 
               mesh.material = boxMaterial;

               // naming convention for accesories base cube mesh AX<int> i.e. AXS1, AXS2, AXS3, AXS4 ... for X shelve
               // where <int> refers to the associated cube mesh unique index 
               mesh.name = 'S' + type + String(index); 
               mesh.id = 'S' + type + String(index); 

               // position the accesory mesh at base cube 
               mesh.position.x = coords[0];
               mesh.position.y = coords[1];
               mesh.position.z = coords[2];
               mesh.rotation.y = Math.PI/2;

               // register the mesh for actions
               mesh.actionManager = new BABYLON.ActionManager(scene); 

               if (type == 'TA') {
                    // update stack accesory arrays at their respective specific cubes position
                    stackAccesoryArray[index][importPos] = type;
                    stackAccesoryArray[index][importPos + 1] = type;
                    stackAccesoryPos[index][importPos] = [coords[0], coords[1], coords[2]];
                    stackAccesoryPos[index][importPos + 1] = [coords[0], coords[1], coords[2]];
               }
               else {
                    // update base accesory arrays at their respective specific cubes position
                    // recall that importPos is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5
                    stackAccesoryArray[index][importPos] = type;
                    stackAccesoryPos[index][importPos] = [coords[0], coords[1], coords[2]]; 
               }
                
          });
     }
}

function baseaccessory_recreation(coords, type, index, importPos){
     if (type == 'XS') { // X shelve
		var assmeshImp = 'Xshelve.babylon'; // this name has to be same as the mesh file from cdn
	} else if (type == 'SS') { // Single shelve
		var assmeshImp = 'singleshelve.babylon';
	} else if  (type == 'DS') { // Double shelve
		var assmeshImp = 'doubleshelve.babylon'; 
	} else if (type == 'NS') { // nine box shelve
		var assmeshImp = 'nineboxshelve.babylon'; 
	} else if (type == 'SB') { // six box shelve
		var assmeshImp = 'sixboxshelve.babylon'; 
     }
     
     BABYLON.SceneLoader.ImportMesh("", hostUrl, assmeshImp, scene, 
     function (newMeshes) {
          var mesh = newMeshes[0];
          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          mesh.material = boxMaterial;
          
          // naming convention for accesories base cube mesh AX<int> i.e. AXS1, AXS2, AXS3, AXS4 ... for X shelve
          // where <int> refers to the associated cube mesh unique index 
          mesh.name = 'A' + type + String(index); 
          mesh.id = 'A' + type + String(index); 

          // position the accesory mesh at base cube 
          mesh.position.x = coords[0];
          mesh.position.y = coords[1];
          mesh.position.z = coords[2];
          mesh.rotation.y = Math.PI/2;

          // register the mesh for actions
          mesh.actionManager = new BABYLON.ActionManager(scene); 
          
          // update base accesory arrays at their respective specific cubes position
          // recall that importPos is the cube prefix int from 1-6 for B1-B6. so in terms of index, it is 0-5

          baseAccesoryArray[index][importPos] = type;
          baseAccesoryPos[index][importPos] = [coords[0], coords[1], coords[2]]; 
     });
}

function stackcubes_recreation(coords, type){
     var planks = ["E43", "E53", "E54", "E63", "E64", "E65b", "E65a", "RE54", "RE64", "RE65a"];
     var stackname = type + postfix; 

     if (planks.includes(type)){
          var reverse = false;
          if (type[0] == "R") {
               // remove the R so that we can import the plank
               type = type.slice(1);
               reverse = true;
          }
     
          var cubeName = type + postfix;  
          
          var intprefix = parseInt(cubeName[2]) - 1;

          BABYLON.SceneLoader.ImportMesh("", hostUrl , stackname, scene, 
          function (newMeshes) {
               var mesh = newMeshes[0];

               mesh.id = String('ES' + stackcubeCtr); 
               
               mesh.name = String('ES' + stackcubeCtr); 

               mesh.position.x = coords[0]; 
               mesh.position.y = coords[1];
               mesh.position.z = coords[2]; // this one is constant for all cubes
               
               // define mesh rotation
               var radians = BABYLON.Tools.ToRadians(180);
               mesh.rotation.y = Math.PI/2;

               if (reverse) {
                    mesh.rotation.x = radians;
                    mesh.rotation.z = radians;
               }
                         
               // define mesh material
               var boxMaterial = createboxMaterial(scene); 
               mesh.material = boxMaterial;

               // start is the coordinates of the leftmost edge of the selected mesh
               // end is the rightmost edge of the mesh
               var cube_num = parseInt(cubeName[1]);
               var halfLength = (boxgridWidth*cube_num)/2; 
               var start = coords[0] - halfLength;
               var end = coords[0] + halfLength;

               // determine which buttons in the current row should be removed from the scene 
               row = findRow(coords[1]);
               var stackbuttons = stackbtn_grid[row];
               for (var i=0; i<stackbuttons.length; i++){
                    var x = stackbuttons[i][1];
                    var y = stackbuttons[i][2];
     
                    var x_coord = gridMat[x][y][0];
                    var y_coord = gridMat[x][y][1];
     
                    if (x_coord > start && x_coord < end) {
                         stackbuttons[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, -10), scene);
                         stackbuttons[i][3] = 0;  
                         stackbuttons[i][4] = 1;
                    }
               }

               plank_config = findConfig(type);

               // determine which buttons above the current row should be visible and available to click
               if (row < stackbtn_grid.length) {
                    var row_above = row + 1;
                    var stackbuttons_above = stackbtn_grid[row_above];
                    var index = 0;
                    for (var i=0; i<stackbuttons_above.length; i++){
                         var x = stackbuttons_above[i][1];
                         var y = stackbuttons_above[i][2];
          
                         var x_coord = gridMat[x][y][0];
                         var y_coord = gridMat[x][y][1];

                         // This is to check where to have a button to import cubes above the plank.
                         // This uses the plank configuration i.e 1001, 10001.
                         // Once we meet a button which is within the bounds of the plank, we then check whether there-
                         // -is a plank cube at that position or not.
                         // If it is a 1, then there is a cube (import a button), 
                         // Else, there is no cube (continue on)
                         if (x_coord > start && x_coord < end && stackbuttons_above[i][4] == 0) {
                              var plank_cube_check = parseInt(plank_config[index]);
                              if (plank_cube_check == 1) {
                                   stackbuttons_above[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, 0), scene);
                                   stackbuttons_above[i][3] = 1;  
                                   stackbuttons_above[i][4] = 0;
                              }
                              index += 1;
                         }
                    }
               }

               // update global counter for stack cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
               stackcubeArray.push(type);
               
               stackcubePos.push([mesh.position.x, mesh.position.y, mesh.position.z]); // push grid position in stackcubePos array as an array of 3 elements x,y,z 
               
               stackcubeCtr = stackcubeCtr + 1;
               
               // update global stack cube accesory in tandem, populate with empty array and empty matrix 
               // note: cant use zero here, since a stack cube may have more than one accesory

               stackAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so initialize zero array
               stackAccesoryPos.push(new Array(intprefix).fill(0)); 

               meshSelectControl (scene, mesh,'3');
               
          });
     }
     else {
          BABYLON.SceneLoader.ImportMesh("", hostUrl , stackname, scene, 
          function (newMeshes) {
               // dirty hack to get around not being able to assign name and id to mesh
               var mesh = newMeshes[0]; 

               mesh.id = String('E' + stackcubeCtr);
               mesh.name = String('E' + stackcubeCtr);

               mesh.position.x = coords[0]; 
               mesh.position.y = coords[1];
               mesh.position.z = coords[2]; // this one is constant for all cubes 

               // define mesh rotation
               mesh.rotation.y = Math.PI/2;

               // define mesh material
               var boxMaterial = createboxMaterial(scene); 
               mesh.material = boxMaterial;

               var intprefix = parseInt(type.slice(1));

               // start is the coordinates of the leftmost edge of the selected mesh
               // end is the rightmost edge of the mesh
               var halfLength = (boxgridWidth*intprefix)/2; 
               var start = coords[0] - halfLength;
               var end = coords[0] + halfLength;

               // determine which buttons in the current row should be removed from the scene 
               row = findRow(coords[1]);
               var stackbuttons = stackbtn_grid[row];

               for (var i=0; i<stackbuttons.length; i++){
                    var x = stackbuttons[i][1];
                    var y = stackbuttons[i][2];
     
                    var x_coord = gridMat[x][y][0];
                    var y_coord = gridMat[x][y][1];
     
                    if (x_coord > start && x_coord < end) {
                         stackbuttons[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, -10), scene);
                         stackbuttons[i][3] = 0;  
                         stackbuttons[i][4] = 1;
                    }
               }

               // determine which buttons above the current row should be visible and available to click
               if (row < stackbtn_grid.length) {
                    var row_above = row + 1;
                    var stackbuttons_above = stackbtn_grid[row_above];

                    for (var i=0; i<stackbuttons_above.length; i++){
                         var x = stackbuttons_above[i][1];
                         var y = stackbuttons_above[i][2];
          
                         var x_coord = gridMat[x][y][0];
                         var y_coord = gridMat[x][y][1];
          
                         if (x_coord > start && x_coord < end && stackbuttons_above[i][4] == 0) {
                              stackbuttons_above[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, 0), scene);
                              stackbuttons_above[i][3] = 1;  
                              stackbuttons_above[i][4] = 0;
                         }
                    }
               }

               // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
               stackcubeArray.push(type);
                    
               stackcubePos.push([mesh.position.x,mesh.position.y,mesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
               stackcubeCtr = stackcubeCtr +  1; 
               
               // dont forget to update accesories with associated empty array
               stackAccesoryArray.push(new Array(intprefix).fill(0));  
               stackAccesoryPos.push(new Array(intprefix).fill(0)); 
               
               // configure mesh actionManager
               meshSelectControl (scene, mesh ,'2');
               
          });
     }
}

function basecubes_recreation(coords, type) {
     // concat with the constant global postfix to give import name 
     var bcubename = type + postfix;     
     // SceneLoader.ImportMesh
     // Loads the meshes from the file and appends them to the scene
     BABYLON.SceneLoader.ImportMesh("", hostUrl , bcubename, scene, 
     function (newMeshes) {
          // dirty hack to get around not being able to assign name and id to mesh
          var mesh = newMeshes[0]; 

          // give the mesh a unique ID (do this for every 'if')
          mesh.id = String('B' + basecubeCtr); 
          mesh.name = String('B' + basecubeCtr); 
          
          mesh.position.x = coords[0]; 
          mesh.position.y = coords[1];
          mesh.position.z = coords[2]; // this one is constant for all base cubes 

          // define mesh rotation
          mesh.rotation.y = Math.PI/2;

          // get base cube integer from prefix
          var intprefix = parseInt(type.slice(1)); // slice the first letter which is B 

          // start is the coordinates of the leftmost edge of the selected mesh
          // end is the rightmost edge of the mesh
          var halfLength = (boxgridWidth*intprefix)/2; 
          var start = coords[0] - halfLength;
          var end = coords[0] + halfLength;
          
          // define mesh material
          var boxMaterial = createboxMaterial(scene); 
          mesh.material = boxMaterial;

          // determine which stack buttons should be available to be pressed on scene render
          // NOTE: when moving buttons, -10 is to move button out of sight, 0 is to move button into sight
          var stackbuttons = stackbtn_grid[1];

          for (var i=0; i<stackbuttons.length; i++){
               var x = stackbuttons[i][1];
               var y = stackbuttons[i][2];

               var x_coord = gridMat[x][y][0];
               var y_coord = gridMat[x][y][1];

               if (x_coord > start && x_coord < end) {
                    stackbuttons[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, 0), scene);
                    stackbuttons[i][3] = 1;  
                    stackbuttons[i][4] = 0;
               }
          }
          
          for (var i=0; i<basebuttonArray.length; i++) {
               var x = basebuttonArray[i][1];
               var y = basebuttonArray[i][2];

               var x_coord = gridMat[x][y][0];
               var y_coord = gridMat[x][y][1];

               if (x_coord > start && x_coord < end) {
                    basebuttonArray[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, -10), scene);
                    basebuttonArray[i][3] = 0;  
                    basebuttonArray[i][4] = 1;
               }
               else if (basebuttonArray[i][4] == 0) {
                    basebuttonArray[i][0].moveToVector3(new BABYLON.Vector3(x_coord, y_coord, 0), scene);
                    basebuttonArray[i][3] = 1;  
               }
          }
          
          // update global counter for base cubes and its position tracker. THIS MUST BE 1:1 UNIQUE PAIR!!! 
          basecubeArray.push(type);

          basecubePos.push([mesh.position.x,mesh.position.y,mesh.position.z]); // push grid position in basecubePos array as an array of 3 elements x,y,z 
          basecubeCtr = basecubeCtr +  1; 

          // base cube accesories in tandem...
          baseAccesoryArray.push(new Array(intprefix).fill(0)); // on initial import of a cube mesh, there is no accesory, so push empty array
          baseAccesoryPos.push(new Array(intprefix).fill(0)); 

          // define cube actionManager
          meshSelectControl (scene, mesh , '1');
     });
}
