<template>
  <div class="ob-editor-container">
    <div class="element-selector-body" ref="treeContainer">
      <div class="file-load-tabs">
        <b-card no-body class="rounded-0" id="no-body-card">
          <b-tabs
            v-model="$store.state.currentTabIndexFileEditor"
            card
            id="start-tabs"
          >
            <template v-slot:tabs-end>
              <b-nav-item @click="showAddFileModal = true" href="#">
                <b>+</b>
              </b-nav-item>
            </template>
            <template v-slot:empty>
              <div class="text-center text-muted">
                There are no open files<br />
                Import a new file using the <b>+</b> button above.
              </div>
            </template>
            <b-tab
              v-for="(item, index) in fileTabs"
              :key="'dyn-tab-' + index"
              :title="item.fileName"
            >
              <template v-slot:title>
                <strong>{{ item.fileName }}</strong>
                <span @click="$bvModal.show('modal-close-file-warning')">
                  <v-icon name="times" id="tab-close" />
                </span>
              </template>
              <span v-if="$store.state.currentFile">
                <div class="tree-search">
                  <div v-if="$store.state.viewerMode == 'Edit Mode'">
                    <b-form-input
                      class="tree-search-bar"
                      v-model="treeSearchTerm"
                      placeholder="Search element names... (wildcard: * )"
                    />
                    <div class="tree-search-options">
                      <span>Search Options: </span>
                      <span>
                        <b-form-checkbox
                          v-model="searchDefnUsages"
                        >Find Definition Usages</b-form-checkbox>
                      </span>
                      <span>
                        <v-icon name="info-circle" scale="1" id="search-defn-usages-tooltip" />
                        <b-tooltip target="search-defn-usages-tooltip" triggers="focus hover" placement="right">
                          <div v-html="('Finds all instances where a searched defintion is used.<br>' +
                                        'Example: Search term <b>CapacityAC</b> finds <b>PVSystem</b> because <b>CapacityAC</b> is a field of <b>PVSystem</b>.<br>')" />
                        </b-tooltip>
                      </span>
                      (<span>
                        <b-form-checkbox
                          v-model="searchDefnUsagesNested"
                          :disabled="!searchDefnUsages"
                        >Include Nested Usage</b-form-checkbox>
                       </span>
                       <v-icon name="info-circle" scale="1" style="margin-top: 0.28em" id="search-defn-usages-include-nested-tooltip" />
                       <b-tooltip target="search-defn-usages-include-nested-tooltip" triggers="focus hover" placement="right">
                         <div v-html="('Finds all instances where a searched defintion is used <b>indirectly</b>.<br>' +
                                       'Example: Search term <b>CapacityAC</b> finds <b>Job</b> because <b>CapacityAC</b> is a field of <b>PVSystem</b> and <b>PVSystems</b> is a field of <b>Job</b>.')" />
                       </b-tooltip>)
                    </div>
                  </div>
                </div>
                <span :key="$store.state.refreshKey">
                  <span v-for="arr in sortedObjects">
                    <!-- obj node -->
                    <UploadOBTree
                      v-if="arr.nodeType == 'Object'"
                      :name="arr.key"
                      :children="arr.childDef.properties"
                      :depth="0"
                      :expandAllObjects="expandAllObjects"
                      :nodeDescription="arr.childDef.description"
                      :isObj="true"
                      parent_name="root"
                      :parent_trail="defnRefParentTrailStart(arr.key, item.fileName)"
                      type="object"
                      :ref="defnRef(arr.key, item.fileName)"
                      :nameRef="defnRef(arr.key, item.fileName)"
                      :file="computedFile"
                      :isTaxonomyElement="false"
                      :referenceFile="arr.referenceFile"
                      :isLocal="arr.isLocal"
                      :viewObj="arr.isViewObj"
                      :isTopLevel="true"
                      :topLevelExpand="true"
                    ></UploadOBTree>

                    <UploadOBTree
                      v-else-if="arr.nodeType == 'Array'"
                      :name="arr.key"
                      :children="getArrayItemAsChildren(arr.referenceFile, arr.arr_item, arr.key)"
                      :depth="0"
                      :expandAllObjects="expandAllObjects"
                      :nodeDescription="arr.childDef.description"
                      :isObj="false"
                      parent_name="root"
                      :parent_trail="defnRefParentTrailStart(arr.key, item.fileName)"
                      type="array"
                      :ref="defnRef(arr.key, item.fileName)"
                      :nameRef="defnRef(arr.key, item.fileName)"
                      :file="computedFile"
                      :isArray="true"
                      :arrayItemRef="arr.arr_item['$ref'] || arr.arr_item['type']"
                      :arrayItemType="getArrItemType(arr.arr_item)"
                      :referenceFile="arr.referenceFile"
                      :isLocal="arr.isLocal"
                      :viewObj="false"
                      :isTopLevel="true"
                      :topLevelExpand="true"
                    ></UploadOBTree>

                    <!-- taxonomy element -->
                    <UploadOBTree
                      v-else-if="arr.nodeType == 'TaxonomyElement'"
                      :isObj="false"
                      :name="arr.key"
                      :children="subClassChildren(arr.referenceFile, arr.superClass_lst, arr.subClass_obj, arr.key)"
                      :depth="0"
                      :expandAllObjects="expandAllObjects"
                      :nodeDescription="getNodeDescription(arr.subClass_obj)"
                      parent_name="root"
                      :parent_trail="defnRefParentTrailStart(arr.key, item.fileName)"
                      type="object"
                      :ref="defnRef(arr.key, item.fileName)"
                      :nameRef="defnRef(arr.key, item.fileName)"
                      :file="computedFile"
                      :isTaxonomyElement="true"
                      :referenceFile="arr.referenceFile"
                      :isLocal="arr.isLocal"
                      :viewObj="false"
                      :isTopLevel="true"
                    >
                    </UploadOBTree>

                    <!-- allOf Obj -->
                    <UploadOBTree
                      v-else-if="arr.nodeType == 'ObjWithInherit'"
                      :name="arr.key"
                      :children="subClassChildren(arr.referenceFile, arr.superClass_lst, arr.subClass_obj, arr.key)"
                      :depth="0"
                      :expandAllObjects="expandAllObjects"
                      :nodeDescription="getNodeDescription(arr.subClass_obj)"
                      :isObj="true"
                      parent_name="root"
                      :parent_trail="defnRefParentTrailStart(arr.key, item.fileName)"
                      type="object"
                      :ref="defnRef(arr.key, item.fileName)"
                      :nameRef="defnRef(arr.key, item.fileName)"
                      :file="computedFile"
                      :isTaxonomyElement="false"
                      :referenceFile="arr.referenceFile"
                      :isLocal="arr.isLocal"
                      :viewObj="false"
                      :isTopLevel="true"
                    ></UploadOBTree>

                    <UploadOBTree
                      v-else
                      :isObj="false"
                      :name="arr.key"
                      :depth="0"
                      :expandAllObjects="expandAllObjects"
                      :nodeDescription="getNodeDescription(arr.childDef)"
                      parent_name="root"
                      :parent_trail="defnRefParentTrailStart(arr.key, item.fileName)"
                      :type=arr.nodeType
                      :ref="defnRef(arr.key, item.fileName)"
                      :nameRef="defnRef(arr.key, item.fileName)"
                      :file="computedFile"
                      :isTaxonomyElement="false"
                      :referenceFile="arr.referenceFile"
                      :isLocal="arr.isLocal"
                      :viewObj="false"
                      :isTopLevel="true"
                    >
                    </UploadOBTree>
                  </span>
                </span>
                <div class="load-more-btn-container">
                  <b-button @click="loadMore" v-if="showLoadMore"
                    >Load more</b-button
                  >
                </div>
              </span>
            </b-tab>
          </b-tabs>
        </b-card>
        <div id="modal-container">
          <b-modal id="modal-center" v-model="showAddFileModal">
            <template v-slot:modal-header>
              <div id="modal-header-">
                <h5 id="modal-header-inline">Load Schema</h5>
                <v-icon
                  name="info-circle"
                  id="info-circle-"
                  v-b-popover.hover.right="
                    'Choose an OB OpenAPI Definition File from your own system. '
                  "
                />
              </div>
            </template>
            <template v-slot:modal-footer>
              <div class="w-100">
                <b-button
                  variant="primary"
                  class="float-right"
                  @click="loadFileFromFileSystem"
                  :disabled="!file"
                  v-if="tabIndexFileUpload == 0"
                >
                  Open
                </b-button>
                <b-button
                  variant="primary"
                  class="float-right"
                  @click="createFile"
                  v-if="tabIndexFileUpload == 1"
                >
                  Create
                </b-button>
                <b-button
                  variant="danger"
                  class="float-right"
                  @click="cancelLoadModal"
                >
                  Cancel
                </b-button>
              </div>
            </template>
            <div id="modal-tabs-container">
              <b-tabs
                content-class="mt-3"
                id="modal-tabs"
                no-fade
                v-model="tabIndexFileUpload"
              >
                <div id="modal-tabs-inside">
                  <b-tab title="From Local" active>
                    <div class="tab-container">
                      <div id="file-selector-container">
                        <b-form-file
                          v-model="file"
                          :state="Boolean(file)"
                          placeholder="Choose your OpenAPI Schema File..."
                          v-if="!file"
                        ></b-form-file>
                        <span id="selected-file-txt" v-else>
                          Selected file:
                          <strong>
                            {{ file ? file.name : "" }}
                          </strong>
                        </span>
                        <br />
                        <span id="unSelectFile-btn" v-if="file">
                          <b-button @click="unSelectFile">
                            Unselect File
                          </b-button>
                        </span>
                      </div>
                      <div style="padding: 0.8em">
                        The latest version of the OB OpenAPI Taxonomy is available on
                        <a :href="GitHubTaxonomyUser" target="_blank">
                          <b>GitHub</b>
                        </a>.
                        View it in the OB Editor using these links:
                        <li v-for="obj in latestTaxonomyViewObjLinks" style="padding-left: 1em; padding-right: 1em">
                          <a :href="editorViewLink(obj.parameter)" target="_blank">
                            <b>{{ obj.name }}</b>
                          </a>
                        </li>
                        Note: To enter view mode or edit mode, click the eye or pencil icon in the top-right corner.
                      </div>
                      <div class="error-container">
                        <b-alert
                          id="file-duplicate-error"
                          v-model="fileAlreadyOpened"
                          variant="danger"
                          dismissible
                        >
                          File already opened. Cannot open the same file twice.
                        </b-alert>
                        <b-alert
                          id="missing-ref-error"
                          v-model="showMissingRefsErr"
                          variant="danger"
                          dismissible
                        >
                          <p>
                            Missing references:
                            <strong>{{ missingRefsRequired }}</strong
                            ><br />
                            Load in missing files first to load this file in.
                          </p>
                        </b-alert>
                      </div>
                    </div>
                  </b-tab>
                  <b-tab title="Create New File">
                    <div id="new-file-form">
                      <b-form-group
                        id="new-file-input-group-1"
                        label="Definition file title:"
                        label-for="new-file-input-1"
                      >
                        <b-form-input
                          id="new-file-input-1"
                          v-model="newFileForm.fileTitle"
                          placeholder="Enter title for your new definition file"
                        ></b-form-input>
                      </b-form-group>

                      <b-form-group
                        id="new-file-input-group-2"
                        label="Definition File Description:"
                        label-for="new-file-input-2"
                      >
                        <b-form-input
                          id="new-file-input-2"
                          v-model="newFileForm.fileDescription"
                          placeholder="Enter description for your new definition file"
                        ></b-form-input>
                      </b-form-group>

                      <b-form-group
                        id="new-file-input-group-3"
                        label="Definition Filename:"
                        label-for="new-file-input-3"
                      >
                        <b-form-input
                          id="new-file-input-3"
                          v-model="newFileForm.fileName"
                          placeholder="Enter filename for your new definition file."
                        ></b-form-input>
                      </b-form-group>
                    </div>
                  </b-tab>
                </div>
              </b-tabs>
            </div>
          </b-modal>
        </div>
      </div>
    </div>
    <div class="element-selector-footer">
      <b-button variant="primary" size="sm" @click="toggleExpandAll" :disabled="!$store.state.currentFile" v-if="$store.state.viewerMode == 'Edit Mode'">
        <span v-if="expandAllObjects">
          Collapse All
        </span>
        <span v-else-if="!expandAllObjects">
          Expand All
        </span>
      </b-button>

      <b-button variant="primary" size="sm" @click="showCreateDefinitionForm" :disabled="!$store.state.currentFile" v-if="$store.state.viewerMode == 'Edit Mode'">
        Create New Definition
      </b-button>

      <b-button variant="primary" size="sm" @click="showLoadInDefinitionForm" :disabled="!$store.state.currentFile" v-if="$store.state.viewerMode == 'Edit Mode'">
        Load In Definition
      </b-button>

      <b-button variant="primary" size="sm" @click="showEditItemTypesMain" v-if="$store.state.viewerMode == 'Edit Mode'" :disabled="!$store.state.currentFile">Item Types Editor</b-button>
    </div>
    <div class="element-editor-header">
      <div class="editor-header">
        <h4 v-if="$store.state.activeEditorView == 'DetailedNodeView'">Detailed View</h4>
        <h4 v-if="$store.state.activeEditorView == 'EditDefinition'">
          Edit <strong>{{ $store.state.isSelected }}</strong>
        </h4>
        <h4 v-if="$store.state.activeEditorView == 'CreateDefinitionForm'">
          Create Definition
        </h4>
        <h4 v-if="$store.state.activeEditorView == 'LoadInDefinition'">Load In Definition</h4>
        <h4 v-if="$store.state.activeEditorView == 'EditItemTypesMain'">
          <h4 v-if="!$store.state.activeItemTypesView">Item Types Editor</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'ViewAllItemTypes'">View All Item Types</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'CreateItemType'">Create Item Type</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'EditItemType'">Edit Item Type</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'CreateItemTypeGroup'">Create Item Type Group</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'EditItemTypeGroup'">Edit Item Type Group</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'DeleteItemTypeGroup'">Delete Item Type Group</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'ViewAllItemTypeGroups'">View All Item Type Groups</h4>
          <h4 v-else-if="$store.state.activeItemTypesView == 'DeleteItemType'">Delete Item Type</h4>
        </h4>
      </div>
      <div class="download-button-container">
        <b-button
          variant="primary"
          v-b-modal.export-modal
          @click="exportModalOpened('sampleJSON')"
          :disabled="!$store.state.currentFile"
          size="sm"
          v-if="$store.state.viewerMode == 'Edit Mode'"
          >Create Sample JSON</b-button
        >
        <b-button
          variant="primary"
          v-b-modal.export-modal
          @click="exportModalOpened('taxonomy')"
          :disabled="!$store.state.currentFile"
          size="sm"
          v-if="$store.state.viewerMode == 'Edit Mode'"
          >Save As</b-button
        >
      </div>
    </div>
    <div class="element-editor-body">
      <!-- <DetailedNodeView v-if="$store.state.showDetailedView" />
      <EditDefinition v-if="$store.state.showEditNodeView" />
      <CreateDefinitionForm v-show="$store.state.showCreateDefinitionForm" />
      <LoadInDefinition v-if="$store.state.showLoadInDefinitionForm" /> -->
      <component :is="$store.state.activeEditorView"></component>
    </div>

    <!-- Modals -->
    <div class="element-editor-footer"></div>
    <ExportFormModal />
    <span id="modal-container">
      <b-modal id="modal-close-file-warning">
        <template v-slot:modal-title>
          Close File?
        </template>
        <template v-slot:modal-footer>
          <div class="w-100">
            <b-button
              class="float-right"
              variant="primary"
              @click="closeTabWarning()"
              >OK</b-button
            >
            <b-button
              class="float-right"
              @click="$bvModal.hide('modal-close-file-warning')"
              >Cancel</b-button
            >
          </div>
        </template>
        <template v-slot:default>
          Are you sure you want to close the file? Any changes not exported will
          not be saved. Make sure this file is not being referenced in another
          loaded files or it may cause errors.
        </template>
      </b-modal>
    </span>
  </div>
</template>

<script>
import UploadOBTree from "../components/UploadOBTree.vue";
import DetailedNodeView from "../components/DetailedNodeView.vue";
import CreateDefinitionForm from "../components/forms/CreateDefinitionForm.vue";
import ExportFormModal from "../components/forms/ExportFormModal";
import LoadInDefinition from "../components/EditDefinition/LoadInDefinition";
import EditDefinition from "../components/EditDefinition/EditDefinition";
import EditItemTypesMain from "../components/ItemTypes/EditItemTypesMain"
import * as miscUtilities from "../utils/miscUtilities";
import * as JSONEditor from "../utils/JSONEditor.js";
import newFileTemplate from "../assets/OB-OpenAPI-New-File-Template.json";
import FileSaver from "file-saver";
import { version } from "process";

export default {
  components: {
    UploadOBTree,
    DetailedNodeView,
    CreateDefinitionForm,
    ExportFormModal,
    EditDefinition,
    LoadInDefinition,
    EditItemTypesMain
  },
  data() {
    return {
      file: null,
      expandAllObjects: true,
      detailedView: true,
      editorView: false,
      allNodesFlat: [],
      numOfElem: 50,
      showLoadMore: false,
      filteredCount: 0,
      tabs: [],
      tabCounter: 0,
      showAddFileModal: false,
      tabIndexFileUpload: null,
      tabIndexEditorView: null,
      readOnly: false,
      selectedIndex: null,
      selectedDependencyFileName: null,
      selectedDependencyInfo: null,
      fileAlreadyOpened: false,
      currentTabIndex: null,
      newFileForm: {
        fileTitle: "",
        fileDescription: "",
        fileName: ""
      },
      missingRefsRequired: [],
      showMissingRefsErr: false,
      treeSearchTerm: "",
      GitHubTaxonomyUser: "https://github.com/Open-Orange-Button/Orange-Button-Taxonomy/blob/main/Master-OB-OpenAPI.json",
      GitHubTaxonomyRaw: "https://raw.githubusercontent.com/Open-Orange-Button/Orange-Button-Taxonomy/main/Master-OB-OpenAPI.json",
      latestTaxonomyViewObjLinks: [{ name: "Project", parameter: "Project"}, { name: "Site", parameter: "Site"}, { name: "All Definitions", parameter: "all"}],
      searchDefnUsages: false,
      searchDefnUsagesNested: false
    };
  },
  mounted() {
    this.processURLParameters(this.$route.query);
  },
  methods: {
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
    fileToJSON() {
      if (this.file) {
        let reader = new FileReader();
        reader.readAsText(this.file);
        reader.onload = () => {
          this.$store.commit("updateOriginalJSONFile", reader.result);
        };

        reader.onerror = function() {
          console.log(reader.error);
        };
      }
    },
    createFile() {
      let json = newFileTemplate;
      let defnFileTitle = this.newFileForm.fileTitle || "Placeholder Title";
      let defnFileDescription = this.newFileForm.fileDescription || "Placeholder Description";
      let defnFileName = this.newFileForm.fileName || "0B-OpenAPI-DefnFile.json";
      json["info"]["title"] = defnFileTitle;
      json["info"]["description"] = defnFileDescription;
      this.loadFileFromJSON(json, defnFileName);
    },
    fromSuperClass(childNode) {
      return Boolean(childNode["fromSuperClass"]);
    },
    exportFile() {
      this.$store.commit("exportFile");
    },
    showCreateDefinitionForm() {
      this.$store.commit("selectNone")
      this.$store.commit("showCreateDefinitionForm");
      this.$store.commit("refreshCreateDefnInputs", true);
    },
    showLoadInDefinitionForm() {
      this.$store.commit("selectNone")
      this.$store.commit("showLoadInDefinitionForm");
    },
    showEditItemTypesMain() {
      this.$store.commit("selectNone")
      this.$store.commit("showNoItemTypesViews")
      this.$store.commit("showEditItemTypesMain");
    },
    toggleExpandAll() {
      this.expandAllObjects = !this.expandAllObjects;
    },
    objectRef(nodeName, fileName) {
      return fileName + "-" + nodeName + "-root";
    },
    setExportFile(fileToExportType) {
      let fileToExport = null;
      let exportModalHeader = "";
      if (fileToExportType === "taxonomy") {
        fileToExport = this.$store.state.currentFile.fullFileForExport;
        exportModalHeader = "Save as...";
      } else if (fileToExportType === "sampleJSON") {
        fileToExport = miscUtilities.getSampleJSON({ fileName: this.$store.state.currentFile.fileName, state: this.$store.state });
        exportModalHeader = "Create Sample JSON";
      }
      this.$store.commit("setFileToExport", {
        fileToExport: fileToExport,
        fileToExportName: this.$store.state.currentFile.fileName,
        exportModalHeader: exportModalHeader
      });
    },
    exportModalOpened(fileToExportType) {
      this.setExportFile(fileToExportType);
      this.$store.commit("setShowExportModal", true);
    },
    // returns object containing all children of the superClass and subClass with no duplicates, while labeling objects/elements that are inherited for signifying
    subClassChildren(file, superClassRef, subClassObj, key) {
      return miscUtilities.getSuperClassChildren(
        file,
        superClassRef,
        subClassObj,
        null,
        key,
        this.$store.state.loadedFiles
      );
    },
    getArrayItemAsChildren(file, arrayItem, key) {
      if (this.isTaxonomyElementArray(arrayItem)) {
        return {};
      } else {
        return miscUtilities.getArrayItemAsChildren(
          file,
          arrayItem["$ref"],
          key,
          this.$store.state.loadedFiles
        );
      }
    },

    loadMore() {
      this.numOfElem += 50;
      if (this.numOfElem + 1 >= this.filteredCount) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }
    },
    unSelectFile() {
      this.file = null;
      this.showMissingRefsErr = false;
      this.fileAlreadyOpened = false;
    },
    loadFileFromJSON(json, fileName) {
      let refsRequired = [];
      this.missingRefsRequired = [];
      this.showMissingRefsErr = false;
      let file_obj = { fileName };
      let itemTypes = json["x-ob-item-types"];
      let itemTypeGroups = json["x-ob-item-type-groups"];

      file_obj["fullFileForExport"] = json;
      file_obj["file"] = json.components.schemas;
      file_obj["item_types"] = itemTypes || {}
      file_obj["item_type_groups"] = itemTypeGroups || {};

      this.tryLoadFile(file_obj);
    },
    isFileOpen(fileName) {
      return this.$store.state.fileTabs.some(file => file.fileName === fileName);
    },
    tryLoadFile(file_obj) {
      if (this.isFileOpen(file_obj.fileName)) {
        this.fileAlreadyOpened = true;
      } else {
        this.showAddFileModal = false;
        this.$store.commit("loadFile", file_obj);
      }
    },
    loadFileFromFileSystem() {
      let reader = new FileReader();
      reader.readAsText(this.file);
      reader.onload = () => this.loadFileFromJSON(JSON.parse(reader.result), this.file.name);
    },
    cancelLoadModal() {
      this.showAddFileModal = false;
    },
    closeTabWarning() {
      this.closeTab(this.$store.state.currentTabIndexFileEditor);
      this.$bvModal.hide("modal-close-file-warning");
    },
    closeTab(x) {
      this.$store.commit("removeFile", this.$store.state.currentFile.fileName);
      this.$store.state.currentFile = null;
      this.$store.state.fileTabs.splice(x, 1);
      this.$store.state.currentFile = this.$store.state.fileTabs[
        this.$store.state.currentTabIndexFileEditor
      ];
      if (this.$store.state.currentFile)
        this.$store.state.selectedFileName = this.$store.state.currentFile["fileName"]
    },
    getNodeDescription(nodeObj) {
      return nodeObj["description"];
    },
    loadDependencyFile() {
      let check_duplicate_file = false;
      let file_obj = this.file;
      for (let i in this.$store.state.fileTabs) {
        if (this.$store.state.fileTabs[i].fileName == file_obj.fileName) {
          check_duplicate_file = true;
        }
      }

      if (check_duplicate_file) {
        this.fileAlreadyOpened = true;
      } else {
        this.$store.state.fileTabs.push(file_obj);
        this.showAddFileModal = false;
      }
    },
    defnRef(nodeName, fileName) {
      let defnRef =
        "root" + "-" + miscUtilities.generateUniqueRef(nodeName, fileName);
      return defnRef;
    },
    defnRefParentTrailStart(nodeName, fileName) {
      return { trail: [nodeName], fileName};
    },
    isViewObj(el) {
      return this.$store.state.viewObjs.includes(el);
    },
    isTaxonomyElementArray(arrItem) {
      return !arrItem["$ref"] && miscUtilities.getOpenAPITypes().includes(arrItem["type"]);
    },
    processURLParameters(query) {
      this.$store.commit('clearEditorView');

      if (!query["view"]) {
        this.$store.commit('changeViewerMode', 'Edit Mode');
        return;
      }

      let viewObjs = query["view"].split(',');

      if (viewObjs.includes('all')) {
        this.$store.commit('changeViewerMode', 'Edit Mode');
      } else {
        query["view"].split(',').forEach(obj => this.$store.commit("addViewObj", { el: obj, mode: "init" }));
      }

      let url = this.GitHubTaxonomyRaw;
      let fileName = url.substring(url.lastIndexOf('/') + 1);
      this.newFileForm.fileTitle = fileName;
      this.newFileForm.fileName = fileName;

      fetch(url).then(res => res.json())
        .then(json => this.loadFileFromJSON(json, fileName));
    },
    editorViewLink(objName) {
      let currentURL = window.location.href;
      if (currentURL.indexOf("?") > 0) {
        currentURL = currentURL.substring(0, currentURL.indexOf("?"));
      }
      return `${currentURL}?view=${objName}`;
    }
  },
  watch: {
    treeSearchTerm() {
        this.$store.commit('reRenderList')
        this.$store.commit('clearEditorView')
    },
    tabIndexFileUpload() {
      this.selectedIndex = null;
      this.selectedDependencyFileName = null;
      this.selectedDependencyInfo = null;
      this.file = null;
      this.newFileForm.fileTitle = null;
      this.newFileForm.fileDescription = null;
      this.newFileForm.fileName = null;
    },
    "$store.state.currentTabIndexFileEditor"() {
      this.$store.state.currentFile = this.$store.state.fileTabs[
        this.$store.state.currentTabIndexFileEditor
      ];

      if (this.$store.state.currentFile)
        this.$store.state.selectedFileName = this.$store.state.currentFile["fileName"]

      this.$store.commit('showNoView')

      this.$store.state.isSelected = null;
      this.$store.state.nameRef = null;
    },
    file() {
      this.fileToJSON();
    },
    "$store.state.selectDefinitionNode"() {
      let yCoord = 0;
      let notRoot = false;
      let firstHyphenIndex = 0;
      let secondHyphenIndex = 0;
      let nameRefOfRoot = "";

      if (!this.$store.state.nameRef.includes("root-")) {
        notRoot = true;
        firstHyphenIndex = this.$store.state.nameRef.indexOf("-");
        secondHyphenIndex = this.$store.state.nameRef.indexOf(
          "-",
          firstHyphenIndex + 1
        );
        nameRefOfRoot =
          "root-" +
          this.$store.state.nameRef.slice(0, firstHyphenIndex + 1) +
          this.$store.state.nameRef.slice(secondHyphenIndex + 1);
      }

      if (this.$store.state.selectDefinitionNode == true && notRoot) {
        if (
          this.$store.state.selectDefinitionNode == true &&
          this.$store.state.nodeType != "object"
        ) {
          yCoord = this.$refs[nameRefOfRoot][0].$el.offsetTop;

          this.$refs.treeContainer.scrollTop = yCoord - 200;
          this.$store.commit("toggleSelectDefinitionNode");
          this.$store.state.nameRef = nameRefOfRoot;
        } else if (
          this.$store.state.selectDefinitionNode == true &&
          this.$store.state.nodeType == "object"
        ) {
          yCoord = this.$refs[nameRefOfRoot][0].$el.offsetTop;

          this.$refs.treeContainer.scrollTop = yCoord - 200;
          this.$store.state.nameRef = nameRefOfRoot;
          this.$store.commit("toggleSelectDefinitionNode");
        }
        this.$store.state.nodeParent = "root";
      }
    },
    "$store.state.inSTDTab"() {
      this.numOfElem = 50;
      this.$store.state.treeSearchTerm = "";
      this.$store.state.nameRef = "";
      this.$store.commit("showNoView")
    },
    showAddFileModal() {
      this.file = null;
      this.fileAlreadyOpened = false;
      this.showMissingRefsErr = false;
    },
    tabIndex() {
      this.readOnly = false;
      this.file = null;
      this.selectedIndex = null;
      this.selectedDependencyInfo = null;
      this.selectedDependencyFileName = null;
    },
    file() {
      if (this.file) {
        // console.log(this.file.name)
      } else {
        // console.log(this.file)
      }
    },
    selectedIndex() {
      this.readOnly = false;
    },
    filteredCount() {
      this.numOfElem = 50;
      if (this.numOfElem + 1 >= this.filteredCount) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }
    }
  },
  computed: {
    fileTabs() {
      return this.$store.state.fileTabs;
    },
    sortedObjects() {
      let obj_map = {}; 
      let el_map = {};
      let arr_map = {};
      let arr_item = "";
      let immutable_map= {};
      let superClass_lst = [];
      let subClass_obj = {};
      let immutable_OB = [
        "Value",
        "Unit",
        "Decimals",
        "Precision",
        "TaxonomyElementString",
        "TaxonomyElementNumber",
        "TaxonomyElementInteger",
        "TaxonomyElementBoolean",
        "TaxonomyElementArray"
      ];
      let nodeType = "";
      let defnRef = "";
      let refFileContext = "LOCAL";
      let isLocal = true;

      let isTaxonomyElement = false;

      //file parameter is the local file
      //referenceFile is the reference file
      let referenceFile = this.$store.state.currentFile.file;

      if (referenceFile) {
        Object.keys(referenceFile).forEach(key => {
          isTaxonomyElement = false;
          isLocal = true;
          superClass_lst = [];
          referenceFile = this.$store.state.currentFile.file;
          let isViewObj = this.isViewObj(key)

          defnRef = miscUtilities.getDefnRef(
            referenceFile,
            key,
            null,
            this.$store.state.loadedFiles
          );

          refFileContext = miscUtilities.getRefFileContext(defnRef);

          if (refFileContext != "LOCAL") {
            referenceFile = this.$store.state.loadedFiles[refFileContext][
              "file"
            ];
            isLocal = false;
          }

          let childDef = referenceFile[key];

          if (childDef["type"] == "object") {
            nodeType = "Object";
            obj_map[key] = {
              key,
              childDef,
              nodeType,
              referenceFile,
              isLocal,
              isViewObj
            };
          } else if (childDef["allOf"]) {
            for (let superclass of childDef["allOf"]) {
              if (superclass["$ref"]) {
                superClass_lst.push(superclass["$ref"]);
              } else {
                subClass_obj = superclass;
              }
            }
            nodeType = "";

            // check if TaxonomyElement, if it only has 1 ref and that ref includes TaxonomyElement in string
            let isTaxonomyElement = superClass_lst.length === 1 && superClass_lst[0].includes("TaxonomyElement");

            let data = {
              key,
              subClass_obj,
              nodeType,
              superClass_lst,
              referenceFile,
              isLocal
            };

            if (isTaxonomyElement) {
              data.nodeType = "TaxonomyElement";
              el_map[key] = data;
            } else {
              data.nodeType = "ObjWithInherit";
              obj_map[key] = data;
            }
          } else if (childDef["type"] == "array" && childDef["items"]) {
            nodeType = "Array";
            arr_item = childDef["items"];
            arr_map[key] = {
              key,
              childDef,
              nodeType,
              referenceFile,
              isLocal,
              arr_item
            };
          } else {
            immutable_map[key] = {
              key,
              childDef,
              nodeType: miscUtilities.capitalizeFirstChar(childDef["type"]),
              referenceFile,
              isLocal
            };
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

        let allDefnMaps = [obj_map, el_map, immutable_map, arr_map];
        let allDefnKeys = allDefnMaps.map(Object.keys).flat();
        let filterByWildcard = k => miscUtilities.wildcardSearch(k.toLowerCase(), this.treeSearchTerm.toLowerCase());
        let filterByViewObj = k => miscUtilities.viewObjFilter(k.toLowerCase(), this.$store.state.viewObjs);
        let defnFilter = this.$store.state.viewerMode === 'Edit Mode' ? filterByWildcard : filterByViewObj;
        let defnsToShowKeys = new Set([...allDefnKeys.filter(defnFilter)]);
        if (this.searchDefnUsages) {
          let file = this.$store.state.loadedFiles[this.$store.state.selectedFileName].file;
          let usages = miscUtilities.findDefnUsages({ defnNameSet: defnsToShowKeys, file });
          usages.forEach(k => defnsToShowKeys.add(k));
          if (this.searchDefnUsagesNested) {
            while (usages.size > 0) {
              usages = miscUtilities.findDefnUsages({ defnNameSet: usages, file });
              usages.forEach(k => defnsToShowKeys.add(k));
            }
          }
        }
        let getDefnsInMap = defnMap => [...defnsToShowKeys].map(k => defnMap[k]).filter(Boolean);
        let defnsToShow = allDefnMaps.map(getDefnsInMap);
        defnsToShow.forEach(defns => defns.sort(sortByKey));
        defnsToShow = defnsToShow.flat();
        this.filteredCount = defnsToShow.length;
        return defnsToShow.slice(0, this.numOfElem);
      }
    },
    computedFile() {
      return this.$store.state.currentFile;
    }
  }
};
</script>

<style>
.ob-editor-container {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1.17fr;
  grid-template-rows: 54px 1fr 50px;
  background-color: #f7f7f7;
}

.element-selector-body {
  grid-column: 1 / 2;
  grid-row: 1 / span 2;
  border: #d3d3d3 solid 1px;
  overflow-y: auto;
  overflow-x: auto;
  display: grid;
  background-color: white;
}

.enable-scroll {
}

.element-selector-footer {
  grid-column: 1 / 2;
  grid-row: 3 /4;
  border: #d3d3d3 solid 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.element-editor-header {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  border-top: #d3d3d3 solid 1px;
  border-right: #d3d3d3 solid 1px;
  border-left: #d3d3d3 solid 1px;
  padding-left: 15px;
  display: grid;
  grid-template-columns: .3fr .7fr;
}

.editor-header {
  display: flex;
  justify-content: left;
  align-items: center;
  grid-column: 1 / span 2;
  grid-row: 1 / 2;
  padding-top: 5px;
}

.download-button-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  padding-bottom: 4px;
  padding-top: 4px;
  padding-right: 15px;
}

.element-editor-body {
  grid-column: 2 / 3;
  grid-row: 2 / span 2;
  border: #d3d3d3 solid 1px;
  overflow-y: auto;
}

.element-editor-footer {
  grid-column: 2 / 3;
  grid-row: 3 /4;
  /* border: #d3d3d3 solid 1px; */
}

.btn {
  margin-left: 5px;
}

.tabs-selector {
  min-height: 100%;
}

.tree-search {
  padding-left: 0.5em;
  padding-right: 1em;
  width: 559px;
}

.tree-search-options {
  display: flex;
  margin-top: -0.5em;
  margin-bottom: 0.5em;
}

div.tree-search-options > span {
  padding-right: 0.15em;
}

.file-tabs {
}

.load-more-btn-container {
  margin-top: 5px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.modal-tabs-container {
}

#modal-center___BV_modal_body_ {
  padding: 0px;
}

#modal-center___BV_modal_header_ {
  border-bottom: none;
}

#modal-tabs-inside {
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 10px;
  height: 300px;
}

#modal-header- {
}

#modal-header-inline {
  display: inline-block;
}

#info-circle- {
  margin-left: 6px;
  margin-bottom: 5px;
  height: 18px;
  width: 18px;
}

.was-validated .custom-file-input:invalid ~ .custom-file-label,
.custom-file-input.is-invalid ~ .custom-file-label {
  border-color: #dee2e6 !important;
}

#selected-file-txt {
  display: flex;
  justify-content: center;
  align-items: center;
}

#readonly-checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
}

.database-selector-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.database-selector-list {
  grid-column: 1 / 2;
  border: 1px solid black;
  margin: 10px;
  margin-top: 0px;
  height: 280px;
}

.database-selector-list-information {
  grid-column: 2 / 3;
}

#db-in-list {
  list-style: none;
  border-bottom: 1px solid black;
}

#db-in-list {
  padding-left: 5px;
}

#file-duplicate-error {
  margin-top: 0px;
}

#missing-ref-error {
  margin-top: 0px;
}

.alert {
  margin-bottom: 0px !important;
}

.tab-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.tab-pane {
  height: 100%;
}

#unSelectFile-btn {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-header {
  border-radius: 0px !important;
}

#no-body-card {
  border: none;
}

#tab-close {
  margin-bottom: 1px;
  margin-left: 6px;
  border-radius: 50%;
  height: 18px;
  width: 18px;
  padding: 2px;
}

#tab-close:hover {
  background-color: #dbdbdc;
}

.card-body {
  padding: 0px !important;
  padding-top: 5px !important;
}

#new-file-form {
  padding: 5px 25px 10px 25px;
}

.tree-search-bar {
  margin-top: 5px;
  margin-bottom: 10px;
}

.load-more-btn-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.nav-tabs .nav-link {
  border: 1px solid #e6e9ec !important;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-item.show .nav-link {
  color: #495057 !important;
  background-color: #fff !important;
  border-color: #d3d3d3 #d3d3d3 #fff !important;
}

button {
  z-index: 9999999;
}
</style>
