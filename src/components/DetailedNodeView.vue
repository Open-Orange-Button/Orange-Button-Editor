<template>
  <div class="detailed-view-container">
    <span v-if="$store.state.isSelected">
      <b-table :fields="fields" :items="defnDetails" class="detailsTable" ref="nodeDetailTable">
        <template #cell(values)="row">
            <div class="unit-row-value">
                {{ row.item.Values }}
            </div>
            <b-button class="unit-row-expand-details" 
              size="sm" 
              @click="row.toggleDetails" 
              v-if="row.item.Attributes == 'OB Item Type' && ItemTypeType && !nodeOBItemTypeGroupName">
              <div v-if="ItemTypeType == 'units'">
                {{ 'View Units' }}
              </div>
              <div v-else-if="ItemTypeType == 'enums'">
                {{ 'View Enums' }}
              </div>
            </b-button>

            <b-badge v-else-if="row.item.Attributes == 'OB Item Type' && !ItemTypeType">
              {{ 'No units/enums'}}
            </b-badge>
            <b-button class="unit-row-expand-details" 
              size="sm" 
              @click="row.toggleDetails" 
              v-if="row.item.Attributes == 'OB Item Type Group' && ItemTypeType && nodeOBItemTypeGroupName">
              <div v-if="ItemTypeType == 'units'">
                {{ 'View Units' }}
              </div>
              <div v-else-if="ItemTypeType == 'enums'">
                {{ 'View Enums' }}
              </div>
            </b-button>
            <b-badge v-else-if="row.item.Attributes == 'OB Item Type Group' && !ItemTypeType">
              {{ 'No units/enums'}}
            </b-badge>            
        </template>

        <template #row-details="row">
          <div v-if="!nodeOBItemTypeGroupName">
            <b-card id="unit-row-expand-details-card">
                <b-table :fields="returnItemTypeEnumsOrUnitsFields" :items="itemTypeEnumsOrUnitsDetails"></b-table>
                <div class="hide-unit-table-btn">
                  <b-button size="sm" class="unit-table-hide-btn" @click="row.toggleDetails">Hide</b-button>
                </div>
            </b-card>
          </div>

          <div v-else>
            <b-card id="item-type-group-details-card">
                <b-table :fields="returnItemTypeEnumsOrUnitsFields" :items="itemTypeGroupEnumsOrUnitsDetails"></b-table>
                <div class="hide-unit-table-btn">
                  <b-button size="sm" class="unit-table-hide-btn" @click="row.toggleDetails">Hide</b-button>
                </div>
            </b-card>              
          </div>
        </template>
      </b-table>
      <div class="detailed-view-buttons">
        <span v-if="$store.state.inOASTab">
          <b-button
            v-if="$store.state.nodeParent == 'root' && $store.state.viewerMode == 'Edit Mode'"
            variant="primary"
            size="sm"
            @click="showEditNodeView"
            :disabled="!$store.state.defnIsLocal"
          >Edit definition</b-button>
          <b-button
            v-else-if="$store.state.nodeParent != 'root' && $store.state.viewerMode == 'Edit Mode'"
            variant="primary"
            size="sm"
            v-b-modal.modal-edit-node
            :disabled="!$store.state.defnIsLocal"
          >Edit definition</b-button>
          <b-button variant="primary" size="sm" @click="exportSampleJSON" v-if="$store.state.nodeParent == 'root'
                                                                                  && !miscUtilitiesVueHandle.allPrimitiveNames().add('Value').has($store.state.nodeName)
                                                                                  && $store.state.viewerMode == 'Edit Mode'">
            Create Sample JSON
          </b-button>
          <b-button v-b-modal.modal-delete-node variant="danger" size="sm" v-if="$store.state.viewerMode == 'Edit Mode'">
            <span v-if="$store.state.nodeParent == 'root'">Delete</span>
            <span v-else>Remove</span>
          </b-button>
        </span>
      </div>
    </span>
    <div class="error-container">
      <span v-if="showError">
        <p id="error-msg">Can't remove inherited objects, remove inheritance instead</p>
      </span>
    </div>

    <b-modal
      id="modal-delete-node"
      :title="deleteWarningTitle"
      ref="delete-modal"
      centered
      no-stacking
      @ok="deleteNode($store.state.isSelected)"
    >
      <span v-html="deleteWarning"></span>
    </b-modal>
    <b-modal
      id="modal-edit-node"
      title="Edit member?"
      ref="edit-modal-warning"
      centered
      no-stacking
      @ok="showEditNodeView()"
    >
      <p>
        This {{ $store.state.nodeType }} is a member and cannot be edited.
        <br />Would you like to edit the definition?
      </p>
    </b-modal>
  </div>
</template>

<script>
import FileSaver from "file-saver";
import * as miscUtilities from "../utils/miscUtilities";
export default {
  data() {
    return {
      nodeDetails: null,
      defnName: "",
      showError: false,
      fields: ["Attributes", "Values"],
      unitFields: [
          { key: "enumOrUnitID", label: "Unit ID", thStyle: { width: "150px" } }, 
          { key: "enumOrUnitLabel", label: "Unit Label", thStyle: { width: "150px" } },
          { key: "enumOrUnitDescription", label: "Unit Description"}
      ],
      enumFields: [
          { key: "enumOrUnitID", label: "Enum ID", thStyle: { width: "150px" } }, 
          { key: "enumOrUnitLabel", label: "Enum Label", thStyle: { width: "150px" } },
          { key: "enumOrUnitDescription", label: "Enum Description"}
      ],
      refreshFields: true,
      nodeEnumsOrUnitsObj: null,
      ItemTypeType: null,
      nodeOBItemTypeGroupName: '',
      nodeOBItemTypeGroupGroupObj: {},
      miscUtilitiesVueHandle: miscUtilities
    };
  },
  methods: {
    exportSampleJSON() {
      let fileName = this.$store.state.currentFile.fileName; 
      let parentTrail = this.$store.state.nodeParentTrail;
      let name = this.$store.state.nodeName;
      this.$store.commit("setFileToExport", {
        fileToExport: miscUtilities.getSampleJSON({ fileName, state: this.$store.state, parentTrail }),
        fileToExportName: name + " from " + fileName,
        exportModalHeader: "Create Sample JSON of " + name
      });
      this.$store.commit("setShowExportModal", true);
    },
    deleteNode(nodeName) {
      if (this.$store.state.isSubClassedNode) {
        this.showError = true;
      } else {
        this.$store.commit("clearEditorView");
        this.$store.commit({
          type: "deleteNode",
          nodeName: nodeName,
          currentFile: this.$store.state.currentFile.file,
          parent: this.$store.state.nodeParent,
          nodeType: this.$store.state.nodeType
        });
        this.$store.commit("selectNone");
      }
    },
    showEditNodeView() {
      this.$store.commit("showView", { viewType: "Editor", viewName: "EditDefinition", selectDefinitionNode: true });
    }
  },
  watch: {
    "$store.state.isSelected"() {
      this.showError = false;
    }
  },
  computed: {
    deleteWarning() {
      if (
        this.$store.state.nodeType == "element" &&
        this.$store.state.nodeParent == "root" &&
        this.$store.state.isSelected != null
      ) {
        return (
          "Are you sure you want to delete the definition: " +
          this.$store.state.isSelected.bold() +
          "?" +
          "\nThis is the " +
          "definition".bold() +
          " element, deleting this will remove every instance of the element in the file"
        );
      } else if (
        this.$store.state.nodeType == "object" &&
        this.$store.state.nodeParent == "root" &&
        this.$store.state.isSelected != null
      ) {
        return (
          "Are you sure you want to delete the definition: " +
          this.$store.state.isSelected.bold() +
          "?" +
          "\nThis is the " +
          "definition".bold() +
          " object, deleting this will remove every instance of the element in the file"
        );
      } else if (this.$store.state.isSelected != null) {
        return (
          "Are you sure you want to delete " +
          this.$store.state.isSelected.bold() +
          "?" +
          "\nThis will remove the " +
          "member ".bold() +
          this.$store.state.nodeType +
          ": " +
          this.$store.state.isSelected.bold() +
          " from the object: " +
          this.$store.state.nodeParent.bold() +
          ", but will not delete the definition."
        );
      }
    },
    deleteWarningTitle() {
      if (this.$store.state.nodeParent == "root") {
        return "Delete " + this.$store.state.nodeType;
      } else {
        return "Remove " + this.$store.state.nodeType;
      }
    },
    defnDetails() {
      let temp_defn_name = this.defnName;
      let temp_doc = this.$store.state.nodeDescription;
      let temp_superClassList = [];
      let temp_superClassListStr = "";
      let temp_ret_obj = null;
      let arrayItemName = null;
      let defnOBType = this.$store.state.nodeOBType;
      let defnOBUsageTips = this.$store.state.nodeOBUsageTips;
      let defnOBSampleValue = this.$store.state.nodeOBSampleValue;
      this.nodeEnumsOrUnitsObj = this.$store.state.nodeEnumsOrUnitsObj

      let tmpItemTypeGroupName = this.$store.state.nodeOBItemTypeGroupName
      this.nodeOBItemTypeGroupName = this.$store.state.nodeOBItemTypeGroupName
      this.nodeOBItemTypeGroupGroupObj = this.$store.state.nodeOBItemTypeGroupObj
      let tmpItemTypeGroupGroupObj = this.$store.state.nodeOBItemTypeGroupObj

      this.refreshFields = !this.refreshFields;

      if (this.nodeEnumsOrUnitsObj) {
        if (this.nodeEnumsOrUnitsObj['units']) {
          this.ItemTypeType = 'units'
        } else if (this.nodeEnumsOrUnitsObj['enums']) {
          this.ItemTypeType = 'enums'
        } else {
          this.ItemTypeType = null
        }
      }

      if (!tmpItemTypeGroupName) {
        tmpItemTypeGroupName = "None"
      }

      if (!temp_doc) {
        temp_doc = "Documentation not available";
      }

      if (!defnOBType) {
        defnOBType = "None";
      }

      if (!defnOBUsageTips) {
        defnOBUsageTips = "None";
      }

      if (!defnOBSampleValue) {
        defnOBSampleValue = "None";
      }

      let defnDoc = this.$store.state.selectedDefnRefFile;
      let selected = this.$store.state.isSelected;
      if (selected === "Value") {
        // 'Value' needs to be translated to 'Value<OpenAPIType>'
        selected = this.$store.state.nodeParentOBPrimitiveValueType;
      }
      let selectedDef = defnDoc[selected];

      if (selectedDef["allOf"]) {
        for (let i in selectedDef["allOf"]) {
          if (selectedDef["allOf"][i]["$ref"]) {
            temp_superClassList.push(
              selectedDef["allOf"][i]["$ref"].slice(
                selectedDef["allOf"][i][
                  "$ref"
                ].lastIndexOf("/") + 1
              )
            );
          }
        }
      }
      if (temp_superClassList.length == 0) {
        temp_superClassListStr = "None";
      } else {
        temp_superClassListStr = temp_superClassList.join(", ");
      }

      if (
        (selectedDef["type"] == "object" || selectedDef["allOf"]) &&
          !this.$store.state.isTaxonomyElement) {
        temp_ret_obj = [
          { Attributes: "Name", Values: this.$store.state.nodeName },
          { Attributes: "Documentation", Values: temp_doc },
          { Attributes: "Type", Values: this.$store.state.nodeType },
          { Attributes: "Superclasses", Values: temp_superClassListStr },
          { Attributes: "Usage Tips", Values: defnOBUsageTips }
        ];
      } else if (this.$store.state.isTaxonomyElement) {
        temp_ret_obj = [
          { Attributes: "Name", Values: this.$store.state.nodeName },
          { Attributes: "Documentation", Values: temp_doc },
          { Attributes: "Type", Values: this.$store.state.nodeType },
          { Attributes: "OB Item Type", Values: defnOBType },
          { Attributes: "OB Item Type Group", Values: tmpItemTypeGroupName},
          { Attributes: "Superclasses", Values: temp_superClassListStr },
          { Attributes: "Usage Tips", Values: defnOBUsageTips },
          { Attributes: "Sample", Values: defnOBSampleValue }
        ];
      } else if (selectedDef["type"] == "array") {
        let arrayItem = selectedDef["items"];
        let arrayItemName;
        if (arrayItem["type"]) {
          arrayItemName = miscUtilities.capitalizeFirstChar(arrayItem["type"]);
        } else {
          arrayItemName = arrayItem["$ref"].slice(selectedDef["items"]["$ref"].lastIndexOf("/") + 1);
        }

        temp_ret_obj = [
          { Attributes: "Name", Values: this.$store.state.nodeName },
          { Attributes: "Type", Values: this.$store.state.nodeType },
          { Attributes: "Array Item", Values: arrayItemName },
          { Attributes: "Usage Tips", Values: defnOBUsageTips }
        ];
      } else { // primitives
        temp_ret_obj = [
          { Attributes: "Name", Values: this.$store.state.nodeName },
          { Attributes: "Type", Values: selectedDef["type"] },
          { Attributes: "Documentation", Values: temp_doc },
          { Attributes: "Usage Tips", Values: defnOBUsageTips }
        ];
      }
      let temp_ret_obj_type_attribute = temp_ret_obj.filter(obj => obj["Attributes"] === "Type")[0];
      temp_ret_obj_type_attribute["Values"] = miscUtilities.capitalizeFirstChar(temp_ret_obj_type_attribute["Values"]);
      let arr = temp_ret_obj;

      return arr;
    },
    itemTypeEnumsOrUnitsDetails() {
      let defn = this.nodeEnumsOrUnitsObj;
      if (!defn) {
        return [];
      }
      let itemTypeType = defn.enums ? "enums" : "units";
      return Object.entries(defn[itemTypeType]).map(([id, { label, description }]) => ({
        enumOrUnitID: id,
        enumOrUnitLabel: label,
        enumOrUnitDescription: description
      }));
    },
    itemTypeGroupEnumsOrUnitsDetails() {
      let defn = this.nodeOBItemTypeGroupGroupObj;
      if (!defn) {
        return [];
      }
      let group = new Set(defn.group);
      return this.itemTypeEnumsOrUnitsDetails.filter(({ enumOrUnitID }) => group.has(enumOrUnitID));
    },
    returnItemTypeEnumsOrUnitsFields() {
       return this.ItemTypeType == "enums" ? this.enumFields : this.unitFields;
    }
  }
};
</script>

<style>
.detailsTable {
  background-color: white;
}

.detailed-view-buttons {
  height: 50px;
  background-color: white;
  margin-top: -16px;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

#error-msg {
  color: red;
  font-weight: bold;
}

.table.b-table.b-table-stacked > tbody > tr > [data-label]::before {
  float: none !important;
}

.detailed-view-container {
  padding-left: 15px;
  padding-right: 15px;
}

.unit-row-value {
  display: inline-block;

}

.unit-row-expand-details {
  display: inline-block;
  margin-left: 15px !important;
}

.detailed-view-container .badge {
  margin-left: 15px;
}

.hide-unit-table-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}
</style>
