/*

miscUtilities.js contains utility functions reused in multiple places throughout the application

*/

import Vuex from "vuex";
import Vue from "vue";
import store from "../store/index";

//	returns if the object definition is an object or not
// "duplicate function, use canInherit or isDefnObj, not both"
export function isDefnObj(JSONFile, defnName) {
  if (JSONFile[defnName]["type"] == "object" || JSONFile[defnName]["allOf"]) {
    return true;
  } else {
    return false;
  }
}

// returns if it currently has inheritance
export function hasInheritance(defnObj) {
  if (defnObj["allOf"]) {
    return true;
  } else {
    return false;
  }
}

// returns if it can have inheritance. only objects can have inheritance
export function canInherit(JSONFile, definitionName) {
  if (
    JSONFile[definitionName]["allOf"] ||
    JSONFile[definitionName]["type"] == "object"
  ) {
    return true;
  } else {
    return false;
  }
}

export function getPropertiesObj(objWithInheritance, objType) {
  if (objType == "TaxonomyElement") {
    for (let i in objWithInheritance["allOf"]) {
      if (objWithInheritance["allOf"][i]["type"]) {
        return objWithInheritance["allOf"][i];
      }
    }
  } else if (objType == "ObjWithInherit") {
    for (let i in objWithInheritance["allOf"]) {
      if (objWithInheritance["allOf"][i]["properties"]) {
        return objWithInheritance["allOf"][i];
      }
    }
  }
}

// returns an array of all superclasses of the definition
export function getSuperClasses(JSONFile, definitionName) {}

//builds the array of inherited and inherited inheritence recursively
//implements transitive inheritance and returns as an object
export function getSuperClassChildren(
  JSONFile,
  superClassRefArr,
  subClassObj,
  referenceFile,
  key,
  loadedFiles
) {
  let superClassChildren = {};
  let superClassName = "";
  let temp_super_children = {};
  let temp_super_class_ref = [];
  let file = "";
  let tempRefFileName = "";

  if (referenceFile) {
    file = referenceFile;
  } else {
    file = JSONFile;
  }

  for (let i in superClassRefArr) {
    superClassName = superClassRefArr[i].slice(
      superClassRefArr[i].lastIndexOf("/") + 1
    );

    tempRefFileName = getRefFileContext(superClassRefArr[i]);
    if (tempRefFileName != "LOCAL") {
      file = loadedFiles[tempRefFileName]["file"];
    }

    if (file[superClassName]["allOf"]) {
      for (let i in file[superClassName]["allOf"]) {
        temp_super_children = {};
        if (file[superClassName]["allOf"][i]["properties"]) {
          temp_super_children = JSON.parse(
            JSON.stringify(file[superClassName]["allOf"][i]["properties"])
          );
          Object.keys(temp_super_children).forEach(key => {
            temp_super_children[key].fromSuperClass = true;
            temp_super_children[key].referenceFile = file;
          });
        } else {
          temp_super_class_ref.push(file[superClassName]["allOf"][i]["$ref"]);
        }

        if (temp_super_class_ref.length != 0) {
          temp_super_children = {
            ...temp_super_children,
            ...getSuperClassChildren(
              file,
              temp_super_class_ref,
              file[superClassName]
            )
          };
        }

        superClassChildren = { ...superClassChildren, ...temp_super_children };
      }
    } else {
      let deepSuperClassObj = JSON.parse(
        JSON.stringify(file[superClassName]["properties"])
      );
      Object.keys(deepSuperClassObj).forEach(key => {
        deepSuperClassObj[key].fromSuperClass = true;
        deepSuperClassObj[key].referenceFile = file;
      });

      superClassChildren = { ...superClassChildren, ...deepSuperClassObj };
    }
  }

  return { ...subClassObj["properties"], ...superClassChildren };
}

export function getArrayItemAsChildren(
  workingFile,
  arrayItemRef,
  key,
  loadedFiles
) {
  let file = workingFile;
  let tempRefFileName = "";
  let arrayItemDefName = arrayItemRef.slice(arrayItemRef.lastIndexOf("/") + 1);
  let arrayItemChildren = {};
  let temp_arrayChildren = {};
  let deepArrayItemProperties = {};

  tempRefFileName = getRefFileContext(arrayItemRef);
  if (tempRefFileName != "LOCAL") {
    file = loadedFiles[tempRefFileName]["file"];
  }

  if (file[arrayItemDefName]["allOf"]) {
    deepArrayItemProperties[arrayItemDefName] = { $ref: arrayItemRef };
    deepArrayItemProperties[arrayItemDefName].arrayItem = true;
    deepArrayItemProperties[arrayItemDefName].referenceFile = file;
  } else {
    deepArrayItemProperties = JSON.parse(
      JSON.stringify(file[arrayItemDefName]["properties"])
    );
    Object.keys(deepArrayItemProperties).forEach(key => {
      deepArrayItemProperties[key].arrayItem = true;
      deepArrayItemProperties[key].referenceFile = file;
    });
  }

  return deepArrayItemProperties;
}

// checks to see if inheritance/add member will cause infinite loop of inheritance/adding member
// returns bool. true for can inherit, false for cant inherit
// a subclass cannot inherit from a superclass that has the subclass as an object member or as a superclass, or has the subclass in one of the object members or their superclasses
export function checkInfiniteLoopErr(JSONFile, subClassName, superClassName) {
  let allSuperClasses = getAllSuperClassesInDefn(JSONFile, superClassName);
  let allObjs = getAllObjInDefn(JSONFile, superClassName);
  let combinedObjsSuperClasses = allSuperClasses.concat(allObjs);
  let checkBoth = [];
  let retArr = [];
  for (let i in combinedObjsSuperClasses) {
    checkBoth = checkBoth.concat(
      getAllSuperClassesInDefn(JSONFile, combinedObjsSuperClasses[i])
    );

    // get all objects from superclasses
    checkBoth = checkBoth.concat(
      getAllObjInDefn(JSONFile, combinedObjsSuperClasses[i])
    );
  }

  checkBoth = checkBoth.concat(combinedObjsSuperClasses);

  retArr = [...new Set(checkBoth)];

  return retArr.includes(subClassName);
}

//returns a list of all superclass refs and superclass refs of superclasses refs recursively
// input: json file, name of defn as string
// output: arr of defn (objects) strings
export function getAllSuperClassesInDefn(JSONFile, superClassName) {
  let allSuperClassRefs = [];
  let hasSuperClass = false;

  if (JSONFile[superClassName]["allOf"]) {
    for (let i in JSONFile[superClassName]["allOf"]) {
      if (JSONFile[superClassName]["allOf"][i]["$ref"]) {
        hasSuperClass = true;
        let superClassSubStringIndex =
          JSONFile[superClassName]["allOf"][i]["$ref"].lastIndexOf("/") + 1;
        let superClassSubString = JSONFile[superClassName]["allOf"][i][
          "$ref"
        ].slice(superClassSubStringIndex);
        allSuperClassRefs.push(superClassSubString);
      }
    }
  }

  if (hasSuperClass) {
    for (let i in allSuperClassRefs) {
      allSuperClassRefs = allSuperClassRefs.concat(
        getAllSuperClassesInDefn(JSONFile, allSuperClassRefs[i])
      );
    }
    for (let i in allSuperClassRefs) {
      if (allSuperClassRefs[i] == undefined) {
        allSuperClassRefs.splice(i, 1);
      }
    }
    return allSuperClassRefs;
  }
  if (allSuperClassRefs.length == 0) {
    return [];
  }
}

// returns array of all objects and nested objects in the definition
// input: json file, name of defn as string
// output: arr of defn (objects) strings
export function getAllObjInDefn(JSONFile, defnName) {
  let allDefnObj = [];
  if (JSONFile[defnName]["allOf"]) {
    for (let i in JSONFile[defnName]["allOf"]) {
      if (JSONFile[defnName]["allOf"][i]["properties"]) {
        for (let j in JSONFile[defnName]["allOf"][i]["properties"]) {
          if (isDefnObj(JSONFile, j)) {
            allDefnObj.push(j);
          }
        }
      }
    }
  } else if (JSONFile[defnName]["properties"]) {
    for (let i in JSONFile[defnName]["properties"]) {
      if (isDefnObj(JSONFile, i)) {
        allDefnObj.push(i);
      }
    }
  }

  if (allDefnObj.length != 0) {
    for (let i in allDefnObj) {
      allDefnObj = allDefnObj.concat(getAllObjInDefn(JSONFile, allDefnObj[i]));
    }
  }

  return allDefnObj;
}

//when adding an object member, check if it has already superclassed that object
//when adding a superclass, check if it has already
// only need to check the top level for conflicts, don't need to check below that
// How to check for conflicts when adding a superclass or object to the defnObj:
// - does the defnObj have a superclass
export function checkSuperClassObjConflict(
  JSONFile,
  defnName,
  superClassOrObjectNameToAdd
) {
  let defnTopLevelConflicts = getAllSuperClassesInDefn(JSONFile, defnName);

  for (let i in defnTopLevelConflicts) {
    defnTopLevelConflicts = defnTopLevelConflicts.concat(
      getTopLevelObjects(JSONFile, defnTopLevelConflicts[i])
    );
  }
  defnTopLevelConflicts = defnTopLevelConflicts.concat(
    getTopLevelObjects(JSONFile, defnName)
  );
  defnTopLevelConflicts = [...new Set(defnTopLevelConflicts)];

  let addingSuperClassOrObjectName = [superClassOrObjectNameToAdd];
  addingSuperClassOrObjectName = addingSuperClassOrObjectName.concat(
    getAllSuperClassesInDefn(JSONFile, superClassOrObjectNameToAdd)
  );

  for (let i in addingSuperClassOrObjectName) {
    addingSuperClassOrObjectName = addingSuperClassOrObjectName.concat(
      getTopLevelObjects(JSONFile, addingSuperClassOrObjectName[i])
    );
  }
  addingSuperClassOrObjectName = addingSuperClassOrObjectName.concat(
    getTopLevelObjects(JSONFile, superClassOrObjectNameToAdd)
  );
  addingSuperClassOrObjectName = [...new Set(addingSuperClassOrObjectName)];

  let hasConflict = false;

  for (let i in defnTopLevelConflicts) {
    for (let j in addingSuperClassOrObjectName) {
      if (defnTopLevelConflicts[i] == addingSuperClassOrObjectName[j]) {
        hasConflict = true;
      }
    }
  }
  return hasConflict;
}

export function getTopLevelObjects(JSONFile, defnName) {
  let topLevelObjs = [];

  if (JSONFile[defnName]["allOf"]) {
    for (let i in JSONFile[defnName]["allOf"]) {
      if (JSONFile[defnName]["allOf"][i]["properties"]) {
        for (let j in JSONFile[defnName]["allOf"][i]["properties"]) {
          if (isDefnObj(JSONFile, j)) {
            topLevelObjs.push(j);
          }
        }
      }
    }
  } else if (JSONFile[defnName]["properties"]) {
    for (let i in JSONFile[defnName]["properties"]) {
      if (isDefnObj(JSONFile, i)) {
        topLevelObjs.push(i);
      }
    }
  }

  return topLevelObjs;
}

// takes a file and returns all the top level elements and objects; used for the addMember functionality
export function getAllElementsFlat(file) {
  let allElementsFlat = [];
  Object.keys(file).forEach(key => {
    allElementsFlat.push(key);
  });
  return allElementsFlat;
}

// take a file and returns all the top level objects; used for the superclass list in AddInheritance
export function getAllObjectsFlat(file) {
  let allObjectsFlat = [];
  Object.keys(file).forEach(key => {
    if (!isTaxonomyElement(file, key)) {
      if (isDefnObj(file, key)) {
        allObjectsFlat.push(key);
      }
    }
  });
  return allObjectsFlat;
}

export function isTaxonomyElement(file, defnName) {
  let defn = file[defnName];
  return defn.allOf && defn.allOf.some(defn => defn.$ref && defn.$ref.includes('TaxonomyElement'));
}

export function isExternalRef(refStr) {
  if (refStr[0] == "#") {
    return false;
  } else {
    return true;
  }
}

export function returnRefsRequired(fileObj) {
  let refs = [];
  // let document = fileObj.file

  for (let i in fileObj.file) {
    if (fileObj.file[i]["$ref"]) {
      if (isExternalRef(fileObj.file[i]["$ref"])) {
        refs.push(
          fileObj.file[i]["$ref"].slice(
            0,
            fileObj.file[i]["$ref"].lastIndexOf("#")
          )
        );
      }
    } else if (fileObj.file[i]["type"] == "object") {
      for (let j in fileObj.file[i]["properties"]) {
        if (isExternalRef(fileObj.file[i]["properties"][j]["$ref"])) {
          refs.push(
            fileObj.file[i]["properties"][j]["$ref"].slice(
              0,
              fileObj.file[i]["properties"][j]["$ref"].lastIndexOf("#")
            )
          );
        }
      }
    } else if (fileObj.file[i]["allOf"]) {
      for (let j in fileObj.file[i]["allOf"]) {
        if (fileObj.file[i]["allOf"][j]["$ref"]) {
          if (isExternalRef(fileObj.file[i]["allOf"][j]["$ref"])) {
            refs.push(
              fileObj.file[i]["allOf"][j]["$ref"].slice(
                0,
                fileObj.file[i]["allOf"][j]["$ref"].lastIndexOf("#")
              )
            );
          }
        }
      }
    }
  }

  refs = [...new Set(refs)];

  return refs;
}

// checks if files are opened to support the file you want to load
// input: array w/ refs, tabs array with opened files
// output: returns missing refs

export function getMissingRefs(refsArr, fileArr) {
  let loadedFiles = [];
  let missingRefs = [];
  for (let i in fileArr) {
    loadedFiles.push(fileArr[i].fileName);
  }

  for (let i in refsArr) {
    if (!loadedFiles.includes(refsArr[i])) {
      missingRefs.push(refsArr[i]);
    }
  }

  return missingRefs;
}

export function getDefnRef(file, defnName, parent, loadedFiles, childrenObj) {
  let refFileName = "";

  if (parent) {
    if (file[parent]) {
      if (file[parent]["properties"]) {
        refFileName = file[parent]["properties"][defnName]["$ref"];
      } else if (file[parent]["allOf"]) {
        for (let j in file[parent]["allOf"]) {
          if (file[parent]["allOf"][j]["properties"]) {
            refFileName =
              file[parent]["allOf"][j]["properties"][defnName]["$ref"];
          }
        }
      } else if (file[parent]["$ref"]) {
        let parentRef = file[parent]["$ref"];
        parentRef = getRefFileContext(parentRef);
        if (parentRef == "LOCAL") {
          refFileName = "#";
        } else {
          refFileName =
            loadedFiles[parentRef]["file"][parent]["properties"][defnName][
              "$ref"
            ];
        }
      } else {
        refFileName = "#";
      }
    } else if (childrenObj[defnName]) {
      refFileName = childrenObj[defnName]["$ref"];
    }
  } else {
    if (file[defnName]["$ref"]) {
      refFileName = file[defnName]["$ref"];
    } else {
      refFileName = "#";
    }
  }

  return refFileName;
}

export function getRefFileContext(refString) {
  if (refString[0] == "#") {
    return "LOCAL";
  } else {
    return refString.slice(0, refString.lastIndexOf("#"));
  }
}

export function getFileNameFromNameRef(nameRef) {}

export function generateUniqueRef(defnName, fileName, parent) {
  let returnRef = "";
  if (parent) {
    returnRef = defnName + "-" + parent + "-" + fileName;
  } else {
    returnRef = defnName + "-" + fileName;
  }
  return returnRef;
}

export function getArrayItemType(arrItemRef, loadedFiles, currentFile) {
  let fileContext = getRefFileContext(arrItemRef);
  let file = null;
  let arrItemDefnName = arrItemRef.slice(arrItemRef.lastIndexOf("/") + 1);
  let arrItemType = null;

  if (fileContext == "LOCAL") {
    file = currentFile;
  } else {
    file = loadedFiles[fileContext];
  }

  if (isTaxonomyElement(file.file, arrItemDefnName)) {
    arrItemType = "Taxonomy Element";
  } else {
    arrItemType = "Object";
  }

  return arrItemType;
}

export function wildcardSearch(searchSubject, searchTerm) {
  if(searchTerm.includes("*")) {

    let searchTermSubstrings = searchTerm.split("*");
    let substringStart = 0;
    
    // searchSubject must contain searchTermSubstrings' elements in order as typed.
    for(let i = 0; i < searchTermSubstrings.length; i++) {
      if(searchTermSubstrings[i] === "") {
        continue;
      }
      if(i === 0 && searchSubject.indexOf(searchTermSubstrings[i]) !== 0) {
        return false;
      }
      substringStart = searchSubject.indexOf(searchTermSubstrings[i], substringStart);
      if(substringStart < 0)
        return false;
      substringStart += searchTermSubstrings[i].length;
    }
    return true;
  }

  return searchSubject.indexOf(searchTerm) == 0;
}

export function getOpenAPITypes() {
  return ['number', 'string', 'integer', 'boolean'];
}

export function allPrimitiveNames() {
  let OpenAPITypes = getOpenAPITypes();
  let ValuePrimitives = OpenAPITypes.map(type => `Value${capitalizeFirstChar(type)}`);
  let ValueArrayPrimitives = OpenAPITypes.map(type => `ValueArray${capitalizeFirstChar(type)}`);
  let nonValuePrimitives = ['Decimals', 'EndTime', 'Precision', 'StartTime', 'Unit'];
  let allPrimitives = new Set(ValuePrimitives.concat(ValueArrayPrimitives).concat(nonValuePrimitives));
  return allPrimitives;
}

export function allTaxonomyElementNames() {
  let OpenAPITypes = getOpenAPITypes();
  let taxonomyElements = OpenAPITypes.map(type => `TaxonomyElement${capitalizeFirstChar(type)}`);
  let taxonomyElementArrays = OpenAPITypes.map(type => `TaxonomyElementArray${capitalizeFirstChar(type)}`);
  let allTaxonomyElements = new Set(taxonomyElements.concat(taxonomyElementArrays));
  return allTaxonomyElements;
}

export function getSampleJSON({ fileName, state, parentTrail }) {
  let exportJSON = {};
  if (parentTrail) {
    let defnName = parentTrail.trail[parentTrail.trail.length - 1];
    exportJSON[defnName] = buildSampleJSON({ defnName, fileName, state });
  } else {
    let fileDefns = state.loadedFiles[fileName].file;
    let defnsToIgnore = new Set([...allPrimitiveNames(), ...allTaxonomyElementNames()]);
    Object.keys(fileDefns).sort().filter(defnName => !defnsToIgnore.has(defnName))
      .forEach(defnName => { exportJSON[defnName] = buildSampleJSON({ defnName, fileName, state, parentTrail }); });
  }
  return exportJSON;
}

export function buildSampleJSON({ defnName, fileName, state }) {
  let sampleJSON = {};
  let defn = state.loadedFiles[fileName].file[defnName];
  let defnNameFromRef = ref => ref.substring(ref.lastIndexOf('/') + 1);
  let fileNameFromRef = ref => ref.substring(0, ref.indexOf('#')) || fileName;
  let recurse = ref => buildSampleJSON({ defnName: defnNameFromRef(ref), fileName: fileNameFromRef(ref), state });
  let addSubDefns = refList => refList.sort().forEach(ref => { sampleJSON[defnNameFromRef(ref)] = recurse(ref); });
  if (defn.allOf) { // taxonomy element or has inheritance
    // a schema definition can only inherit from one other schema definition
    let inherited = defn.allOf.filter(def => def.$ref)[0];
    let isTaxonomyElement = inherited.$ref.includes('TaxonomyElement');
    if (isTaxonomyElement) {
      sampleJSON = defn.allOf[1]['x-ob-sample-value'];
    } else {
      sampleJSON = recurse(inherited.$ref);
      let refLists = defn.allOf.filter(def => !def.$ref).map(def => Object.values(def.properties).map(v => v.$ref));
      refLists.forEach(list => addSubDefns(list));
    }
  } else if (defn.properties) { // no inheritance
    let refList = Object.values(defn.properties).map(v => v.$ref);
    addSubDefns(refList);
  } else if (defn.items) { // array of another schema definition
    sampleJSON = [recurse(defn.items.$ref)];
  } // defn should never be a primitive
  return sampleJSON;
}

// filters list for View Objects
// params:
// el: element name
// arr: vuex ViewObjs arr
export function viewObjFilter(el, arr) {
  if (arr.includes(el)) {
    return el
  } else {
    return null
  }
}


// functions for managing cookies

// create also used for updates
export function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

export function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

export function eraseCookie(name) {
	createCookie(name,"",-1);
}

export function capitalizeFirstChar(str) {
  // capitalize the first character of a string
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

// helper functions for sample value forms in CreateDefinitionForm and EditSampleValue

export function getSampleValueData() {
  return { Decimals: { order: 3, value: '' },
            EndTime: { order: 6, value: '' },
            Precision: { order: 4, value: '' },
            StartTime: { order: 5, value: '' },
            Unit: { order: 2, value: '' },
            Value: { order: 1, value: '' } };
}


export function buildSampleValueObject({ sampleValuePrimitives, selectedOpenAPIType, isOBTaxonomyElementArray }) {
  return Object.entries(sampleValuePrimitives)
    .filter(([_, data]) => data.value)
    .reduce((result, [name, data]) => {
    let value = data.value;
    if (name === 'Value') {
      value = formatSampleValueValue({ value, selectedOpenAPIType, isOBTaxonomyElementArray });
    }
    result[name] = value;
    return result;
  }, {});
}


export function isValidSampleValueForm({ sampleValueFormContext, sampleValuePrimitives, selectedOpenAPIType, selectedOBItemType, OBEnumItemTypeIgnoreMap }) {
  let submissionErrorMsg = '';
  let missingSampleValuePrimitives = Object.entries(sampleValueFormContext)
    .filter(([primitive, context]) => context.isRequired && !sampleValuePrimitives[primitive].value)
    .sort((a, b) => sampleValuePrimitives[a[0]].order - sampleValuePrimitives[b[0]].order)
    .map(([primitive, _]) => primitive);
  if (missingSampleValuePrimitives.length > 0) {
    submissionErrorMsg = `Please enter sample values for these primitives: ${missingSampleValuePrimitives.join(', ')}`
  } else if (!validateByOpenAPIType({ value: sampleValuePrimitives.Value.value, selectedOpenAPIType })) {
    submissionErrorMsg = `Please enter a sample value for Value that is the OpenAPI type of ${capitalizeFirstChar(selectedOpenAPIType)}.`;
  } else if (OBEnumItemTypeIgnoreMap[selectedOBItemType] && !OBEnumItemTypeIgnoreMap[selectedOBItemType].validate(sampleValuePrimitives.Value.value)) {
    submissionErrorMsg = OBEnumItemTypeIgnoreMap[selectedOBItemType].errorMsg;
  }
  return submissionErrorMsg;
}

export function validateByOpenAPIType({ value, selectedOpenAPIType }) {
  let type = selectedOpenAPIType;
  if (type === 'number') {
    return !/^\s*$/.test(value) && !isNaN(value);
  } else if (type === 'string') {
    return typeof value === 'string' && value.length > 0;
  } else if (type === 'boolean') {
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    return typeof value === 'boolean';
  } else if (type === 'integer') {
    return !isNaN(value) && Number.isInteger(parseFloat(value));
  } else {
    return false;
  }
}

export function formatSampleValueValue({ value, selectedOpenAPIType, isOBTaxonomyElementArray }) {
  let type = selectedOpenAPIType;
  if (type === 'boolean') {
    value = value === 'true';
  } else if (type === 'number' || type === 'integer') {
    value = parseFloat(value);
  }
  if (isOBTaxonomyElementArray) {
    value = [value];
  }
  return value;
}

export function validateUUIDItemType(value) {
  return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(value);
}

export function filterItemTypeEnumsOrUnitsByItemTypeGroup({ itemTypeEnumsOrUnitsComputed, selectedItemTypeGroup, allItemTypeGroups }) {
  let itemTypes = itemTypeEnumsOrUnitsComputed;
  if (selectedItemTypeGroup) {
    itemTypes = itemTypes.filter(u => allItemTypeGroups[selectedItemTypeGroup].group.includes(u.enumOrUnitID));
  }
  return itemTypes.map(e => {
    return { value: e.enumOrUnitID, text: `${e.enumOrUnitLabel} (${e.enumOrUnitID})` };
  });
}

export function sampleValueFormContext({ selectedOpenAPIType, selectedOBItemTypeType, isOBTaxonomyElementArray }) {
  return { Decimals: { isArray: false, isRequired: false, show: selectedOpenAPIType === 'number' },
            EndTime: { isArray: false, isRequired: false, show: true },
            Precision: { isArray: false, isRequired: false, show: selectedOpenAPIType === 'number' },
            StartTime: { isArray: false, isRequired: false, show: true },
            Unit: { isArray: false, isRequired: selectedOBItemTypeType === 'units', show: selectedOBItemTypeType === 'units' } ,
            Value: { isArray: isOBTaxonomyElementArray, isRequired: true, show: true } };
}

export function sampleValueValueOptions({ selectedOpenAPIType, selectedOBItemType, selectedOBItemTypeType, OBEnumItemTypeIgnoreMap,
                                          itemTypeEnumsOrUnitsComputed, selectedItemTypeGroup, allItemTypeGroups }) {
  if (selectedOpenAPIType === 'boolean') {
    return [{ value: 'true', text: 'True' },
            { value: 'false', text: 'False' }];
  } else if (selectedOBItemTypeType === 'enums' && !Object.keys(OBEnumItemTypeIgnoreMap).includes(selectedOBItemType)) {
    return filterItemTypeEnumsOrUnitsByItemTypeGroup({ itemTypeEnumsOrUnitsComputed, selectedItemTypeGroup, allItemTypeGroups });
  }
  return [];
}

export function sampleValueUnitOptions({ selectedOBItemTypeType, itemTypeEnumsOrUnitsComputed, selectedItemTypeGroup, allItemTypeGroups }) {
  if (selectedOBItemTypeType === 'units') {
    return filterItemTypeEnumsOrUnitsByItemTypeGroup({ itemTypeEnumsOrUnitsComputed, selectedItemTypeGroup, allItemTypeGroups });
  }
  return [];
}

export function OBEnumItemTypeIgnoreMap() {
  return { UUIDItemType: { validate: validateUUIDItemType, errorMsg: `Please enter a UUID that matches the regex ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$.` } };
}

export function OBItemTypeType({ itemTypeDef }) {
if (itemTypeDef.enums) {
  return 'enums';
} else if (itemTypeDef.units) {
  return 'units';
}
return '';
}

export function buildItemTypeEnumsOrUnitsComputedList({ itemTypeDef, itemTypeType }) {
  return Object.entries(itemTypeDef[itemTypeType] || [])
    .map(([name, def]) => ({ enumOrUnitID: name, enumOrUnitLabel: def.label || '', enumOrUnitDescription: def.description || '' }));
}

// Edit definition form helper functions

export function defnDetails({ defnName, fileName, state }) {
  let defnNameFromRef = ref => ref.substring(ref.lastIndexOf('/') + 1);
  let propertyListStr = defn => Object.keys(defn.properties).sort().join(', ') || 'None';
  let getDocumentation = defn => defn.description || 'Documentation not available.';
  let defnFile = state.loadedFiles[fileName].file;
  let defn = defnFile[defnName];
  let detailData = {};
  detailData.Name = defnName;
  if (defn.allOf) { // taxonomy element or has inheritance
    // a schema definition can only inherit from one other schema definition
    let inherited = defn.allOf.filter(schema => schema.$ref)[0];
    // a schema definition can only have one set of its own properties
    let noninherited = defn.allOf.filter(schema => !schema.$ref)[0];
    detailData.Superclass = defnNameFromRef(inherited.$ref);
    detailData.Documentation = getDocumentation(noninherited);
    detailData.Type = noninherited.type;
    let isTaxonomyElement = detailData.Superclass.includes('TaxonomyElement');
    if (!isTaxonomyElement) {
      detailData.Children = propertyListStr(noninherited);
    }
  } else if (defn.properties) { // no inheritance
    detailData.Documentation = getDocumentation(defn);
    detailData.Type = defn.type;
    detailData.Children = propertyListStr(defn);
  } else if (defn.items) { // array of another schema definition
    detailData.Documentation = getDocumentation(defn);
    detailData.Type = defn.type;
    detailData.Items = defnNameFromRef(defn.items.$ref || defn.items.type);
  } else { // primitive
    detailData.Documentation = getDocumentation(defn);
    detailData.Type = defn.type;
  }
  return Object.entries(detailData).map(([attr, val]) => ({ Attributes: attr, Values: capitalizeFirstChar(val) }));
}

export function findDefnUsages({ defnName, file }) {
  let usages = [];
  let defnNameFromRef = ref => ref.substring(ref.lastIndexOf('/') + 1);
  for (let [name, defn] of Object.entries(file)) {
    if (defn.allOf) { // taxonomy element or has inheritance
      let usedForInheritance = defn.allOf
        .filter(schema => schema.$ref && defnNameFromRef(schema.$ref) === defnName)
        .length > 0;
      let usedAsProperty = defn.allOf
        .filter(schema => Object.keys(schema.properties || {}).includes(defnName))
        .length > 0;
      if (usedForInheritance || usedAsProperty) {
        usages.push(name);
      }
    } else if (defn.properties) { // no inheritance
      let usedAsProperty = Object.keys(defn.properties).includes(defnName);
      if (usedAsProperty) {
        usages.push(name);
      }
    } else if (defn.items) { // array of another schema definition
      let items = defn.items;
      if (items.$ref && defnNameFromRef(items.$ref) === defnName) {
        usages.push(name);
      }
    } else { // primitive
    }
  }
  return usages;
}

