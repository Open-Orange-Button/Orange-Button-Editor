<template>
  <div class="ob-tree-container">
    <div
      class="node-wrapper"
      @click="toggleSelect"
      :style="isSelected ? 'background-color: #89CFF0;' : ''"
    >
      <div class="element-div" :style="indent">
        <span @click="toggleExpandDefn">
          <span v-if="isObj">
            <v-icon
              v-if="expandDefn"
              name="minus-square"
              class="icon-expandable clickable"
            />
            <v-icon
              v-if="!expandDefn"
              name="plus-square"
              class="icon-expandable clickable"
              style="cursor: pointer"
            />
          </span>

          <span v-if="isTaxonomyElement">
            <v-icon
              name="circle"
              class="taxonomy-element-icon-expandable clickable"
              style="cursor: pointer"
            />
          </span>

          <span v-if="isArray && arrayItemType == 'Object'">
            <v-icon
              v-if="expandDefn"
              name="minus-square"
              class="icon-expandable clickable"
            />
            <v-icon
              v-if="!expandDefn"
              name="plus-square"
              class="icon-expandable clickable"
              style="cursor: pointer"
            />
          </span>

          <span v-if="isArray && arrayItemType == 'Taxonomy Element'">
            <v-icon
              name="circle"
              class="taxonomy-element-icon-expandable clickable"
              style="cursor: pointer"
            />
          </span>
        </span>

        <span
          :class="{
            subClassSignifier: subClassedNode,
            importedNodeSignifier: importedNode
          }"
        >
          <span v-if="isArray">
            {{ shortenName + " " }}[ {{ arrayItemNameFromRef }} ]
          </span>
          <span v-else>
            {{ shortenName }}
          </span>
        </span>
        <span class="primary-view-icon" v-if="(isObj || isArray) && $store.state.viewerMode == 'Edit Mode' && isTopLevel && isSelected">
            <span @click=addViewObj(name)>
              <v-icon
                name="plus"
                style="cursor: pointer"
                v-if="!viewObjFinal"
              />
            </span>
            <v-icon
              name="regular/eye"
              style="cursor: pointer"
              v-if="viewObjFinal"
            />             
        </span>
        <span class="primary-view-icon" v-if="$store.state.viewerMode == 'View Mode' && viewObjFinal && isTopLevel && isSelected" @click=removeViewObj(name)>
            <v-icon
              name="times"
              style="cursor: pointer; color:red"
            />        
        </span>
      </div>
    </div>

    <span v-if="children">
      <span v-for="(arr, index) in sortedObjects">
        <!-- object -->
        <UploadOBTree
          v-if="expandDefn && arr.nodeType == 'Object'"
          :name="arr.key"
          :children="arr.childDef.properties"
          :depth="depth + 1"
          :nodeDescription="arr.childDef.description"
          :isObj="true"
          :parent_name="name"
          :parentOBPrimitiveValueType="OBPrimitiveValueType"
          :parent_trail="defnRefParentTrail(arr.key, parent_trail)"
          type="object"
          :ref="defnRef(arr.key, file.fileName)"
          :nameRef="defnRef(arr.key, file.fileName)"
          :file="file"
          :isTaxonomyElement="false"
          :subClassedNode="arr.fromSuperClass"
          :referenceFile="arr.referenceFile"
          :isLocal="arr.isLocal"
          :viewObj="false"
          :isTopLevel="false"
        ></UploadOBTree>

        <!-- array -->

        <UploadOBTree
          v-else-if="expandDefn && arr.nodeType == 'Array'"
          :name="arr.key"
          :children="getArrayItemAsChildren(arr.referenceFile, arr.arr_item, arr.key)"
          :depth="depth + 1"
          :expandAllObjects="expandAllObjects"
          :nodeDescription="arr.childDef.description"
          :isObj="false"
          :parent_name="name"
          :parentOBPrimitiveValueType="OBPrimitiveValueType"
          :parent_trail="defnRefParentTrail(arr.key, parent_trail)"
          type="array"
          :ref="defnRef(arr.key, file.fileName)"
          :nameRef="defnRef(arr.key, file.fileName)"
          :file="file"
          :isArray="true"
          :arrayItemRef="arr.arr_item['$ref'] || arr.arr_item['type']"
          :arrayItemType="getArrItemType(arr.arr_item)"
          :referenceFile="arr.referenceFile"
          :subClassedNode="arr.fromSuperClass"
          :isLocal="arr.isLocal"
          :viewObj="false"
          :isTopLevel="false"
        ></UploadOBTree>

        <!-- taxonomy element -->
        <UploadOBTree
          v-else-if="expandDefn && arr.nodeType == 'TaxonomyElement'"
          :isObj="false"
          :name="arr.key"
          :children="subClassChildren(file.file, arr.superClass_lst, arr.subClass_obj, arr.referenceFile)"
          :depth="depth + 1"
          :nodeDescription="getNodeDescription(arr.subClass_obj)"
          :parent_name="name"
          :parentOBPrimitiveValueType="OBPrimitiveValueType"
          :parent_trail="defnRefParentTrail(arr.key, parent_trail)"
          type="element"
          :ref="defnRef(arr.key, file.fileName)"
          :nameRef="defnRef(arr.key, file.fileName)"
          :file="file"
          :isTaxonomyElement="true"
          :subClassedNode="arr.fromSuperClass"
          :referenceFile="arr.referenceFile"
          :isLocal="arr.isLocal"
          :isArrayItem="isArray"
          :viewObj="false"
          :isTopLevel="false"
        >
        </UploadOBTree>

        <!-- allOf Obj -->
        <UploadOBTree
          v-else-if="expandDefn && arr.nodeType == 'ObjWithInherit'"
          :name="arr.key"
          :children="subClassChildren(file.file, arr.superClass_lst, arr.subClass_obj, arr.referenceFile)"
          :depth="depth + 1"
          :nodeDescription="getNodeDescription(arr.subClass_obj)"
          :isObj="true"
          :parent_name="name"
          :parentOBPrimitiveValueType="OBPrimitiveValueType"
          :parent_trail="defnRefParentTrail(arr.key, parent_trail)"
          type="object"
          :ref="defnRef(arr.key, file.fileName)"
          :nameRef="defnRef(arr.key, file.fileName)"
          :file="file"
          :isTaxonomyElement="false"
          :subClassedNode="arr.fromSuperClass"
          :referenceFile="arr.referenceFile"
          :isLocal="arr.isLocal"
          :isArrayItem="isArray"
          :viewObj="false"
          :isTopLevel="false"
        ></UploadOBTree>

        <!-- for primitives -->
        <UploadOBTree
          v-else-if="expandDefn && !['ObjWithInherit', 'TaxonomyElement', 'Object'].includes(arr.nodeType)"
          :isObj="false"
          :name="arr.key"
          :depth="depth + 1"
          :nodeDescription="getNodeDescription(arr.childDef)"
          :parent_name="name"
          :parentOBPrimitiveValueType="OBPrimitiveValueType"
          :parent_trail="defnRefParentTrail(arr.key, parent_trail)"
          type="element"
          :ref="defnRef(arr.key, file.fileName)"
          :nameRef="defnRef(arr.key, file.fileName)"
          :file="file"
          :isTaxonomyElement="false"
          :subClassedNode="arr.fromSuperClass"
          :referenceFile="arr.referenceFile"
          :isLocal="arr.isLocal"
          :isArrayItem="isArray"
          :viewObj="false"
          :isTopLevel="false"
        >
        </UploadOBTree>
      </span>
    </span>
  </div>
</template>

<script>
import * as miscUtilities from "../utils/miscUtilities";

export default {
  props: [
    "name",
    "children",
    "depth",
    "expandAllObjects",
    "parent_name",
    "parentOBPrimitiveValueType",
    "nodeDescription",
    "isObj",
    "parent_trail",
    "type",
    "nameRef",
    "subClassedNode",
    "importedNode",
    "file",
    "isTaxonomyElement",
    "referenceFile",
    "isLocal",
    "isArray",
    "arrayItemRef",
    "arrayItemType",
    "viewObj",
    "isTopLevel",
    "topLevelExpand"
  ],
  name: "UploadOBTree",
  data() {
    return {
      expandObject: true,
      expandArray: true,
      expandElement: false,
      isObject: Boolean(this.children),
      OBPrimitiveValueType: "",
      sortedObjLen: null,
      expandDefn: false,
      viewObjFinal: false
    };
  },
  created() {
    if (this.topLevelExpand) {
      this.expandDefn = true;
    }
    if (this.isTaxonomyElement || (this.isArray && !this.topLevelExpand)) {
      this.expandDefn = false;
    }
    // needed because we cannot mutate prop viewObj
    if (this.viewObj) {
      this.viewObjFinal = true
    }

  },
  computed: {
    arrayItemNameFromRef() {
      if (miscUtilities.getOpenAPITypes().includes(this.arrayItemRef)) {
        return miscUtilities.capitalizeFirstChar(this.arrayItemRef);
      }
      return this.arrayItemRef.slice(this.arrayItemRef.lastIndexOf("/") + 1);
    },
    shortenName() {
      if (this.name.length > 54) {
        return this.name.slice(0, 54).concat("...");
      } else {
        return this.name;
      }
    },
    indent() {
      return { "padding-left": `${this.depth * 50}px` };
    },
    modalNodeID() {
      return "modal-add-child-" + this.$store.state.nodeCount;
    },
    isSelected() {
      return this.$store.state.nameRef == this.nameRef;
    },
    toolTipID() {
      return "tooltip-id-" + this.name + "-" + this.parent_name;
    },
    sortedObjects() {
      let obj_lst = [];
      let obj_lst_SC = [];
      let el_lst = [];
      let el_lst_SC = [];
      let superClass_lst = [];
      let subClass_obj = {};
      let immutable_OB = [
        "Value",
        "Unit",
        "Decimals",
        "Precision",
        "TaxonomyElement"
      ];
      let nodeType = "";
      let immutable_lst = [];
      let immutable_lst_SC = [];
      let fromSuperClass = false;
      let defnRef = "";
      let defnRefTrail = "";
      let isLocal = true;
      let refFileContext = "LOCAL";
      let isTaxonomyElement = false;

      let arr_lst = [];
      let arr_item = "";

      let referenceFile = this.file;

      if (this.children) {
        Object.keys(this.children).forEach(key => {
          isLocal = true;
          referenceFile = this.referenceFile;
          refFileContext = "LOCAL";

          let translatedKey = key;
          if (key === "Value") {
            // 'Value' needs to be translated to 'Value<OpenAPIType>'
            let valueRef = this.children["Value"]["$ref"];
            translatedKey = valueRef.substring(valueRef.lastIndexOf("/") + 1);
            // Extract the type of the Value primitive. Note 'value' has one 'e'.
            this.OBPrimitiveValueType = translatedKey;
          }
          let childDef = referenceFile[translatedKey];

          if (!this.children[key]["referenceFile"]) {
            defnRef = miscUtilities.getDefnRef(
              referenceFile,
              key,
              this.name,
              this.$store.state.loadedFiles,
              this.children
            );
            refFileContext = miscUtilities.getRefFileContext(defnRef);
            if (refFileContext != "LOCAL") {
              referenceFile = this.$store.state.loadedFiles[refFileContext][
                "file"
              ];
              isLocal = false;
            }
          } else {
            referenceFile = this.children[key]["referenceFile"];
            refFileContext = miscUtilities.getRefFileContext(
              this.children[key]["$ref"]
            );

            if (!childDef || refFileContext != "LOCAL") {
              referenceFile = this.$store.state.loadedFiles[refFileContext][
                "file"
              ];
              isLocal = false;
            }

          }

          fromSuperClass = false;
          superClass_lst = [];
          if ("fromSuperClass" in this.children[key]) {
            fromSuperClass = true;
          }

          if ("type" in childDef && childDef["type"] == "object") {
            nodeType = "Object";
            let data = {
                key,
                childDef,
                fromSuperClass,
                nodeType,
                referenceFile,
                isLocal
              };
            if (fromSuperClass) {
              obj_lst_SC.push(data);
            } else {
              obj_lst.push(data);
            }
          } else if ("allOf" in childDef) {
            for (let superclass of childDef["allOf"]) {
              if (superclass["$ref"]) {
                superClass_lst.push(superclass["$ref"]);
              } else {
                subClass_obj = superclass;
              }
            }

            nodeType = false;

            let isTaxonomyElement = superClass_lst.some(sc => sc.includes("#/components/schemas/TaxonomyElement"));

            let data = {
              key,
              subClass_obj,
              fromSuperClass,
              nodeType,
              superClass_lst,
              referenceFile,
              isLocal
            };

            if (isTaxonomyElement) {
              data.nodeType = "TaxonomyElement";
              if (fromSuperClass) {
                el_lst_SC.push(data);
              } else {
                el_lst.push(data);
              }
            } else {
              data.nodeType = "ObjWithInherit";
              if (fromSuperClass) {
                obj_lst_SC.push(data);
              } else {
                obj_lst.push(data);
              }
            }
          } else if ("type" in childDef && childDef["type"] == "array" && childDef["items"]) {
            nodeType = "Array";
            arr_item = childDef["items"];
            arr_lst.push({
              key,
              childDef,
              nodeType,
              referenceFile,
              isLocal,
              arr_item,
              fromSuperClass
            });
          } else {
            immutable_lst.push({
              key,
              childDef,
              fromSuperClass,
              referenceFile,
              isLocal
            });
          }
        });
        let sortByKey = (a, b) => {
          if (a.key < b.key) {
            return -1;
          } else if (a.key > b.key) {
            return 1;
          }
          return 0;
        }
        obj_lst.sort(sortByKey);
        obj_lst_SC.sort(sortByKey);

        el_lst.sort(sortByKey);
        el_lst_SC.sort(sortByKey);

        immutable_lst.sort(sortByKey);

        let retArr = el_lst
          .concat(el_lst_SC)
          .concat(obj_lst)
          .concat(obj_lst_SC)
          .concat(arr_lst)
          .concat(immutable_lst);
        this.sortedObjLen = retArr.length;
        
        return retArr;
      }
    }
  },
  methods: {
    toggleExpandDefn() {
      this.expandDefn = !this.expandDefn;
    },
    getArrayItemAsChildren(file, arrItem, key) {
      if (this.isTaxonomyElementArray(arrItem)) {
        return {};
      } else {
        return miscUtilities.getArrayItemAsChildren(
          file,
          arrItem["$ref"],
          key,
          this.$store.state.loadedFiles
        );
      }
    },
    getArrItemType(arrItem) {
      if (this.isTaxonomyElementArray(arrItem)) {
        return arrItem["type"];
      } else {
        return miscUtilities.getArrayItemType(
          arrItem["$ref"],
          this.$store.state.loadedFiles,
          this.$store.state.currentFile
        );
      }
    },
    toggleSelect() {
      this.$store.commit("toggleSelectDefinitionNode");
      this.$store.commit("showView", { viewType: "Editor", viewName: "DetailedNodeView" });

      if (this.$store.state.activeEditorView !== "DetailedNodeView") {
        return;
      }

      this.$store.commit({
        type: "selectNode",
        nodeName: this.name,
        nodeParent: this.parent_name,
        nodeParentTrail: this.parent_trail,
        nodeType: this.type,
        OBPrimitiveValueType: this.OBPrimitiveValueType,
        parentOBPrimitiveValueType: this.parentOBPrimitiveValueType,
        nameRef: this.nameRef,
        nodeDescription: this.nodeDescription,
        isSubClassedNode: this.subClassedNode,
        isTaxonomyElement: this.isTaxonomyElement,
        selectedFileName: this.file.fileName,
        referenceFile: this.referenceFile,
        isLocal: this.isLocal
      });
    },
    objectRef(nodeName, fileName) {
      return fileName + "-" + nodeName;
    },

    isNodeObject(child_name) {
      if (this.file.file[child_name]) {
        if (
          (this.file.file[child_name]["type"] == "object" ||
            this.file.file[child_name]["allOf"]) &&
          !miscUtilities.isTaxonomyElement(file.file, child_name)
        ) {
          return true;
        } else {
          return false;
        }
      }
    },

    //returns children object from referenced (no unreferenced objects will be found, because this is below top level)
    returnNodeChildren(child_name, child_obj) {
      let temp_child_obj = {};

      let superClass_lst = [];
      if (this.file.file[child_name]["properties"]) {
        temp_child_obj = JSON.parse(
          JSON.stringify(this.file.file[child_name]["properties"])
        );
        if (child_obj["fromSuperClass"]) {
          Object.keys(temp_child_obj).forEach(key => {
            temp_child_obj[key].fromSuperClass = true;
          });
        }

        return temp_child_obj;
      } else {
        // return children merging superClassed objects / elements with obj's children
        // child_name is the name of the object, just need to return merge of children + superclass children
        for (let i in this.file.file[child_name]["allOf"]) {
          if (this.file.file[child_name]["allOf"][i]["properties"]) {
            temp_child_obj = JSON.parse(
              JSON.stringify(
                this.file.file[child_name]["allOf"][i]["properties"]
              )
            );
            if (child_obj["fromSuperClass"]) {
              Object.keys(temp_child_obj).forEach(key => {
                temp_child_obj[key].fromSuperClass = true;
              });
            }
          } else {
            superClass_lst.push(this.file.file[child_name]["allOf"][i]["$ref"]);
          }
        }
        return {
          ...temp_child_obj,
          ...miscUtilities.getSuperClassChildren(
            this.file.file,
            superClass_lst,
            temp_child_obj
          )
        };
      }
    },
    fromSuperClass(childNode) {
      if (childNode["fromSuperClass"]) {
        return true;
      } else {
        return false;
      }
    },
    getNodeDescription(nodeObj) {
      return nodeObj["description"];
    },
    subClassChildren(file, superClassRef, subClassObj, referenceFile) {
      if (referenceFile) {
        return miscUtilities.getSuperClassChildren(
          referenceFile,
          superClassRef,
          subClassObj,
          referenceFile,
          null,
          this.$store.state.loadedFiles
        );
      } else {
        return miscUtilities.getSuperClassChildren(
          file,
          superClassRef,
          subClassObj,
          referenceFile,
          null,
          this.$store.state.loadedFiles
        );
      }
    },
    defnRef(nodeName, fileName) {
      let defnRef = miscUtilities.generateUniqueRef(
        nodeName,
        fileName,
        this.name
      );
      return defnRef;
    },
    defnRefParentTrail(nodeName, parent_trail) {
      return { trail: [...parent_trail.trail, nodeName], fileName: parent_trail.fileName };
    },
    addViewObj(el) {
      this.viewObjFinal = true
      this.$store.commit("addViewObj", {
        'el': el,
        'mode': 'create_cookie'
      });
    },
    removeViewObj(el) {
      this.viewObjFinal = false
      this.$store.commit("removeViewObj", {
        'el': el,
        'mode': 'create_cookie'
      });
      this.$store.commit("reRenderList")
    },
    isTaxonomyElementArray(arrItem) {
      return !arrItem["$ref"] && miscUtilities.getOpenAPITypes().includes(arrItem["type"]);
    }
  },
  watch: {
    expandAllObjects() {
      if (this.expandAllObjects == true) {
        this.expandDefn = true;
      } else {
        this.expandDefn = false;
      }
    }
  }
};
</script>

<style>
.checkbox-s {
  margin-left: 8px;
}

.icon-expandable {
  margin-bottom: 3px;
}

.taxonomy-element-icon-expandable {
  margin-bottom: 3px;
  padding: 6px;
}

.options {
  display: inline-flex;
  justify-content: space-between;
  width: 46px;
  padding-left: 9px;
  bottom: -6px;
  visibility: hidden;
}

.element-div:hover .options {
  visibility: visible;
}

.element-div {
  margin-bottom: -8px;
  margin-left: 15px;
}

.element-div:focus {
  color: red;
}

.clickable {
  cursor: pointer;
}

.node-wrapper {
  border-bottom: #d3d3d3 solid 1px;
  height: 25px;
}

.subClassSignifier {
  font-style: italic;
}

.importedNodeSignifier {
  font-style: italic;
  font-weight: bold;
}

.primary-view-icon {
  display:block;
  padding-right: 125px;
  float: right;
}

/* .node-wrapper:hover .primary-view-icon { 
  display: block;
} */
</style>
