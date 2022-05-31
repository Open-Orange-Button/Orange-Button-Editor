<template>
  <div class="create-element-container">
    <b-form>
      <b-form-group
        id="node-type-input-group"
        label="OB Definition type:"
        label-for="node-type-input"
      >
        <b-row>
        <b-col>
          <b-form-select
            id="node-type-input"
            v-model="definitionType"
            :options="OBDataTypes"
            :disabled="!preSubmit"
            :state="Boolean(definitionType)"
            @change="formatForm"
          ></b-form-select>
        </b-col>
        <b-col sm="auto">
          <v-icon name="info-circle" scale="1.5" id="info-tooltip-target" />
          <b-tooltip target="info-tooltip-target" triggers="click hover" placement="right">
            <b>{{ definitionType ? definitionType + ": " : "" }}</b><span v-html="OBDataTypeInfo[definitionType]" />
          </b-tooltip>
        </b-col>
        </b-row>
      </b-form-group>
      <b-form-group
          label="OpenAPI Element Type"
          label-for="node-openapi-element-type-input"
          v-if="definitionType === OBTaxonomyElementDisplayName"
        >
        <b-form-select
          id="node-openapi-element-type-input"
          v-model="selectedOpenAPIType"
          :options="OpenAPITypeOptions"
          :disabled="!preSubmit"
          :state="Boolean(selectedOpenAPIType)"
          @change="formatForm"
        ></b-form-select>
        <b-form-checkbox
          v-model="isOBTaxonomyElementArray"
          :disabled="!preSubmit"
        >Array</b-form-checkbox>
      </b-form-group>
      <b-form-group
        id="node-name-input-group"
        label="Definition name:"
        label-for="node-name-input"
      >
        <b-form-input
          id="node-name-input"
          v-model="definitionName"
          :disabled="!preSubmit"
          :state="Boolean(definitionName)"
        ></b-form-input>
      </b-form-group>
      <b-form-group
        id="node-description-input-group"
        label="Definition description:"
        label-for="node-description-input"
      >
        <b-form-input
          id="node-description-input"
          v-model="definitionDescription"
          :disabled="!preSubmit"
          :state="Boolean(definitionDescription)"
        ></b-form-input>
      </b-form-group>

      <b-form-group
        id="node-usage-tips-input-group"
        label="Usage tips:"
        label-for="node-usage-tips-input"
      >
        <b-form-input
          id="node-usage-tips-input"
          v-model="selectedOBUsageTips"
          :disabled="!preSubmit"
        ></b-form-input>
      </b-form-group>

      <b-form-group
        id="node-item-type-input-group"
        label="OB Item Type:"
        label-for="node-item-type-input"
        v-if="definitionType === OBTaxonomyElementDisplayName"
      >
        <b-form-select
          id="node-item-type-input"
          v-model="selectedOBItemType"
          :options="allItemTypesComputed"
          :disabled="!preSubmit"
          :state="Boolean(selectedOBItemType)"
          @change="formatForm"
        ></b-form-select>
      </b-form-group>

      <b-form-group
        label="Item Type Group:"
        label-for="create-def-item-type-group-input"
        v-if="selectedOBItemType"
      >
        <b-form-select
          id="create-def-item-type-group-input"
          v-model="selectedItemTypeGroup"
          :options="allPossibleItemTypeGroups"
          :disabled="!preSubmit"
        ></b-form-select>
      </b-form-group>

      <b-form-group
        id="node-sample-value-input-group"
        v-if="definitionType === OBTaxonomyElementDisplayName"
      >
        <b-form-checkbox
          v-model="addSampleValue"
          :disabled="!preSubmit"
        >Add Sample Value
        </b-form-checkbox>
        <div v-if="addSampleValue">
          <div v-for="[name, data] in Object.entries(sampleValuePrimitives)
                                            .sort((a, b) => a[1].order - b[1].order)
                                            .filter(p => sampleValueFormContext[p[0]].show)">
            {{ `${sampleValueFormContext[name].isArray ? 'Array Item ' : ''}${name}:` }}
              <component
                v-if="name === 'Value'"
                :is="sampleValueValueOptions.length > 0 ? 'b-form-select' : 'b-form-input'"
                v-model="data.value"
                :options="sampleValueValueOptions"
                :state="validateByOpenAPIType(data.value)"
                :disabled="!preSubmit" />
              <b-form-select
                v-else-if="name === 'Unit'"
                v-model="data.value"
                :options="sampleValueUnitOptions"
                :state="Boolean(data.value)"
                :disabled="!preSubmit" />
              <b-form-input
                v-else
                v-model="data.value"
                :state="Boolean(data.value) || !sampleValueFormContext[name].isRequired"
                :disabled="!preSubmit" />
          </div>
        </div>
      </b-form-group>

      <!-- <div class="enum-or-unit-table-container" v-if="selectedOBItemTypeType">              
        <b-table 
            @row-selected="onRowSelected" 
            selectable 
            select-mode="single"
            :fields="returnEnumOrUnitFields(selectedOBItemTypeType)" 
            :items="itemTypeEnumsOrUnitsComputed" 
            class="item-type-table"
        >
        </b-table>
      </div> -->

      <span v-if="definitionType == 'OB Object Array'">
        <div>Choose array item:</div>
        <div>Select document to choose array item from:</div>
        <b-form-select
          v-model="selectedFileName"
          :options="getLoadedFiles"
          :select-size="4"
          id="select-form-files"
        ></b-form-select>
        <br />
        <div>Select definition to use as array item:</div>
        <b-form-input
            class="array-item-search-bar"
            v-model="arrayItemSearchTerm"
            placeholder="Search item names... (wildcard: * )"
          >
          </b-form-input>
        <div class="file-elements-list">
          <span v-if="selectedFileName">
            <li
              v-for="(name, index) in fileElements"
              id="defn-from-file"
              @click="selectDefn(index, name)"
              :class="{ 'selected-node': index == selectedDefnIndex }"
            >
              {{ name }}
            </li>
          </span>
        </div>
        <b-table
          :items="defnDetails"
          id="add-member-detail-table"
          ref="add-member-detail-table"
          v-if="selectedDefnName"
        ></b-table>
      </span>

      <span id="edit-form-buttons">
        <b-button v-if="preSubmit" type="submit" @click.prevent="createElement"
          >Create</b-button
        >
        <b-button v-if="preSubmit" @click="exitView">Cancel</b-button>
      </span>
    </b-form>
    <b-modal
      id="modal-create-node"
      title="Attention"
      ref="create-modal-warning"
      centered
      no-stacking
      v-model="submissionError"
    >
      <p>
        {{ submissionErrorMsg }}
      </p>
    </b-modal>
  </div>
</template>

<script>
import * as miscUtilities from "../../utils/miscUtilities";

export default {
  created() {
    this.allItemTypes = this.$store.state.loadedFiles[this.$store.state.selectedFileName]["item_types"]
    this.allItemTypeGroups = this.$store.state.loadedFiles[this.$store.state.selectedFileName]["item_type_groups"]
  },
  data() {
    return {
      allItemTypes: null,
      selectedOBItemTypeType: null,
      selectedOBItemTypeDescription: null,
      selectedOBItemTypeEnumsOrUnits: [],
      selectedItemTypeGroup: '',
      possibleItemTypeGroups: [],
      definitionName: null,
      definitionType: "",
      definitionDescription: null,
      preSubmit: true,
      submissionError: false,
      submissionErrorMsg: "",
      OBTaxonomyElementDisplayName: "OB Element",
      arrayItemSearchTerm: "",
      selectedFileName: null,
      selectedDefnIndex: null,
      selectedDefnName: null,

      selectedOpenAPIType: null,
      isOBTaxonomyElementArray: false,
      selectedOBItemType: null,
      selectedOBUsageTips: "",
      selectedOBSampleValue: null,
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
      addSampleValue: false,
      sampleValuePrimitives: this.getSampleValueData()
    };
  },
  methods: {
    validateSampleValueJSON() {
      try {
        JSON.parse(this.selectedOBSampleValue);
        return true;
      } catch(error) {
        return false;
      }
    },
    onRowSelected(items) {
        this.selectedEnumOrUnit = items
    },    
    exitView() {
      this.definitionName = null;
      this.definitionType = null;
      this.definitionDescription = null;
      this.selectedOBItemType = null;
      this.preSubmit = true;
      this.$store.commit("showNoView");
    },
    validateForm() {
      if(!this.definitionType) {
        this.submissionErrorMsg = "Please select a definition type.";
        return false;
      } else if(!this.definitionName) {
        this.submissionErrorMsg = "Please enter a definition name.";
        return false;
      } else if(!this.definitionDescription) {
        this.submissionErrorMsg = "Please enter a definition description.";
        return false;
      } else if(this.definitionType === "OB Object Array" && (!this.selectedFileName || !this.selectedDefnName)) {
        this.submissionErrorMsg = "Please select a file and an array item.";
        return false;
      } else if(this.definitionType === this.OBTaxonomyElementDisplayName && (!this.selectedOBItemType || !this.selectedOpenAPIType)) {
        if (!this.selectedOBItemType) {
          this.submissionErrorMsg = "Please select an OB Item Type."
        } else if (!this.selectedOpenAPIType) {
          this.submissionErrorMsg = "Please select an OpenAPI Element Type";
        }
        return false;
      }
      // else if(!this.selectedOBSampleValue || !this.validateSampleValueJSON()) {
      //   this.submissionErrorMsg = "Invalid SampleValue JSON."
      //   return;
      // }

      if (this.addSampleValue) {
        let missingSampleValuePrimitives = Object.entries(this.sampleValueFormContext)
          .filter(([primitive, context]) => context.isRequired && !this.sampleValuePrimitives[primitive].value)
          .sort((a, b) => this.sampleValuePrimitives[a[0]].order - this.sampleValuePrimitives[b[0]].order)
          .map(([primitive, _]) => primitive);
        if (missingSampleValuePrimitives.length > 0) {
          this.submissionErrorMsg = `Please enter sample values for these primitives: ${missingSampleValuePrimitives.join(', ')}`
          return false;
        }
        if (!this.validateByOpenAPIType(this.sampleValuePrimitives.Value.value)) {
          this.submissionErrorMsg = `Please enter a sample value for Value that is the OpenAPI type of ${miscUtilities.capitalizeFirstChar(this.selectedOpenAPIType)}.`;
          return false;
        }
      }

      return true;
    },
    createElement() {
      if (!this.validateForm()) {
        this.submissionError = true;
        return;
      }
      let payload = {
        definitionName: this.definitionName,
        definitionType: this.definitionType,
        definitionDescription: this.definitionDescription,
        arrayItemDefnName: this.selectedDefnName,
        arrayItemFileName: this.selectedFileName,
        OBItemType: this.selectedOBItemType,
        OBItemTypeGroup: this.selectedItemTypeGroup,
        OpenAPIType: miscUtilities.capitalizeFirstChar(this.selectedOpenAPIType),
        isOBTaxonomyElementArray: this.isOBTaxonomyElementArray,
        OBUsageTips: this.selectedOBUsageTips,
        OBSampleValue: this.buildSampleValueObject()
      };
      this.preSubmit = false;

      this.$store.commit("createDefinition", payload);
    },
    selectDefn(index, definitionName) {
      this.selectedDefnIndex = index;
      this.selectedDefnName = definitionName;
      this.showErrorInfinite = false;
      this.showErrorConflict = false;
    },
    returnEnumOrUnitFields(itemTypeType) {
      if (itemTypeType == 'units') {
          return this.unitFields
      } else if (itemTypeType == 'enums') {
          return this.enumFields
      }
    },
    findPossibleItemTypeGroups() {
      for (let i in this.allItemTypeGroups) {
        if (this.allItemTypeGroups[i]['type'].includes(this.selectedOBItemType)) {
          this.possibleItemTypeGroups.push(i)
        }
      }
      this.possibleItemTypeGroups.push({value: '', text: 'None'})
    },
    formatForm() {
      this.sampleValuePrimitives = this.getSampleValueData();
    },
    getSampleValueData() {
      return { Decimals: { order: 3, value: '' }, 
               EndTime: { order: 6, value: '' },
               Precision: { order: 4, value: '' },
               StartTime: { order: 5, value: '' },
               Unit: { order: 2, value: '' },
               Value: { order: 1, value: '' } };
    },
    buildSampleValueObject() {
      return Object.entries(this.sampleValuePrimitives)
        .filter(([_, data]) => data.value)
        .reduce((result, [name, data]) => {
        let value = data.value;
        if (name === 'Value') {
          value = this.formatSampleValueValue(value);
        }
        result[name] = value;
        return result;
      }, {});
    },
    validateByOpenAPIType(value) {
      let type = this.selectedOpenAPIType;
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      if (type === 'number') {
        return !isNaN(value);
      } else if (type === 'string') {
        return typeof value === 'string' && value.length > 0;
      } else if (type === 'boolean') {
        return typeof value === 'boolean';
      } else if (type === 'integer') {
        return !isNaN(value) && Number.isInteger(parseFloat(value));
      } else {
        return false;
      }
    },
    formatSampleValueValue(value) {
      let type = this.selectedOpenAPIType;
      if (type === 'boolean') {
        value = value === 'true';
      } else if (type === 'number' || type === 'integer') {
        value = parseFloat(value);
      }
      if (this.isOBTaxonomyElementArray) {
        value = [value];
      }
      return value;
    }
  },
  computed: {
    OBDataTypes() {
      return [
        this.OBTaxonomyElementDisplayName,
        "OB Object",
        "OB Object Array"
      ];
    },
    OBDataTypeInfo() {
      let info = {
        "": "Select a definition type to view more information.",
        "OB Object": ("an object whose fields are other OB objects or elements.<br>" +
                      "These fields are added to the object after it is defined."),
        "OB Object Array": ("an array whose items are an OB object or element.<br>" +
                            "The array item is chosen when the array is defined.")
      };
      info[this.OBTaxonomyElementDisplayName] = ("an object whose fields are primitives.<br>" + //: Value, Units, StartTime, EndTime, Decimals, and Precision.<br>" +
                                                 "All primitives are strings except Value which is one of these OpenAPI types: boolean, integer, number, string, or array.<br>" +
                                                 "To define Value as an array, choose one of the other four types and check the 'Array' checkbox.");
      return info;
    },
    allItemTypesComputed() {
      let ret_arr = []
      let itemTypeName = ''
      for (let i in this.allItemTypes) {
          itemTypeName = i
          ret_arr.push(itemTypeName)
      }

      return ret_arr.sort()
    },
    fileElements() {
      if (this.selectedFileName) {
        let fileElements = Object.keys(
          this.$store.state.loadedFiles[this.selectedFileName]["file"]
        ).sort();

        return fileElements
          .filter(node => {
            return miscUtilities.wildcardSearch(node.toLowerCase(), this.arrayItemSearchTerm.toLowerCase());
          });
      }
    },
    getLoadedFiles() {
      let optionsArr = [];
      for (let i in this.$store.state.loadedFiles) {
        optionsArr.push({
          value: i,
          text: i
        });
      }
      return optionsArr;
    },
    defnDetails() {
      let temp_ret_obj = null;

      let defnName = this.selectedDefnName;
      let defnType = "";
      let defnDescrip = "Documentation not available";
      let defnEnum = "";
      let temp_superClassList = [];
      let temp_superClassListStr = "";
      let defnObjChildren = "";
      let typeOfDefn = null;

      let defnFile = this.$store.state.loadedFiles[this.selectedFileName][
        "file"
      ];

      if (defnFile[defnName]["allOf"]) {
        if (miscUtilities.isTaxonomyElement(defnFile, defnName)) {
          typeOfDefn = "TaxonomyElement";
        } else {
          typeOfDefn = "ObjWithInherit";
        }
        for (let i in defnFile[defnName]["allOf"]) {
          if (defnFile[defnName]["allOf"][i]["$ref"]) {
            temp_superClassList.push(
              defnFile[defnName]["allOf"][i]["$ref"].slice(
                defnFile[defnName]["allOf"][i]["$ref"].lastIndexOf("/") + 1
              )
            );
          } else {
            if (defnFile[defnName]["allOf"][i]["description"]) {
              defnDescrip = defnFile[defnName]["allOf"][i]["description"];
            }
            if (defnFile[defnName]["allOf"][i]["type"]) {
              defnType = defnFile[defnName]["allOf"][i]["type"];
            }
            if (defnFile[defnName]["allOf"][i]["enum"]) {
              defnEnum = defnFile[defnName]["allOf"][i]["enum"];
            }

            if (typeOfDefn == "ObjWithInherit") {
              if (defnFile[defnName]["allOf"][i]["properties"]) {
                defnObjChildren = Object.keys(defnFile[defnName]["properties"]);
              }
            }
          }
        }
      } else if (defnFile[defnName]["properties"]) {
        typeOfDefn = "Obj";
        if (defnFile[defnName]["type"]) {
          defnType = defnFile[defnName]["type"];
        }

        if (defnFile[defnName]["properties"]["description"]) {
          defnDescrip = defnFile[defnName]["properties"]["description"];
        }

        defnObjChildren = Object.keys(defnFile[defnName]["properties"]);
      } else {
        typeOfDefn = "Elem";
        if (defnFile[defnName]["description"]) {
          defnDescrip = defnFile[defnName]["description"];
        }

        if (defnFile[defnName]["type"]) {
          defnType = defnFile[defnName]["type"];
        }

        if (defnFile[defnName]["enum"]) {
          defnEnum = defnFile[defnName]["enum"];
        }
      }
      if (temp_superClassList.length == 0) {
        temp_superClassListStr = "None";
      } else {
        temp_superClassListStr = temp_superClassList.join(", ");
      }

      if (!defnEnum) {
        defnEnum = "None";
      } else {
        defnEnum = defnEnum.join(", ");
      }

      if (defnObjChildren) {
        defnObjChildren = defnObjChildren.join(", ");
      } else {
        defnObjChildren = "None";
      }

      if (typeOfDefn == "ObjWithInherit") {
        temp_ret_obj = [
          { Attributes: "Name", Values: defnName },
          { Attributes: "Type", Values: defnType },
          { Attributes: "Documentation", Values: defnDescrip },
          { Attributes: "Superclasses", Values: temp_superClassListStr },
          { Attributes: "Children", Values: defnObjChildren }
        ];
      } else if (typeOfDefn == "TaxonomyElement") {
        temp_ret_obj = [
          { Attributes: "Name", Values: defnName },
          { Attributes: "Type", Values: defnType },
          { Attributes: "Documentation", Values: defnDescrip },
          { Attributes: "Superclasses", Values: temp_superClassListStr }
        ];
      } else if (typeOfDefn == "Obj") {
        temp_ret_obj = [
          { Attributes: "Name", Values: defnName },
          { Attributes: "Type", Values: defnType },
          { Attributes: "Documentation", Values: defnDescrip },
          { Attributes: "Children", Values: defnObjChildren }
        ];
      } else if (typeOfDefn == "Elem") {
        temp_ret_obj = [
          { Attributes: "Name", Values: defnName },
          { Attributes: "Type", Values: defnType },
          { Attributes: "Enumeration", Values: defnEnum },
          { Attributes: "Documentation", Values: defnDescrip }
        ];
      }

      let arr = temp_ret_obj;

      return arr;
    },
    itemTypeEnumsOrUnitsComputed() {
      return this.selectedOBItemTypeEnumsOrUnits
    },
    allPossibleItemTypeGroups() {
      return this.possibleItemTypeGroups
    },
    sampleValueFormContext() {
      let OpenAPINumberTypes = ['number', 'integer'];
      return { Decimals: { isArray: false, isRequired: false, show: OpenAPINumberTypes.includes(this.selectedOpenAPIType) },
               EndTime: { isArray: false, isRequired: false, show: true },
               Precision: { isArray: false, isRequired: false, show: OpenAPINumberTypes.includes(this.selectedOpenAPIType) },
               StartTime: { isArray: false, isRequired: false, show: true },
               Unit: { isArray: false, isRequired: this.selectedOBItemTypeType === 'units', show: this.selectedOBItemTypeType === 'units' } ,
               Value: { isArray: this.isOBTaxonomyElementArray, isRequired: true, show: true } };
    },
    sampleValueValueOptions() {
      if (this.selectedOpenAPIType === 'boolean') {
        return [{ value: 'true', text: 'True' },
                { value: 'false', text: 'False' }];
      } else if (this.selectedOBItemTypeType === 'enums') {
        return this.itemTypeEnumsOrUnitsComputed.map(e => {
          return { value: e.enumOrUnitID, text: `${e.enumOrUnitLabel} (${e.enumOrUnitID})` };
        });
      }
      return [];

    },
    sampleValueUnitOptions() {
      if (this.selectedOBItemTypeType === 'units') {
        return this.itemTypeEnumsOrUnitsComputed.map(u => {
          return { value: u.enumOrUnitID, text: `${u.enumOrUnitLabel} (${u.enumOrUnitID})` };
        });
      }
      return [];
    },
    OpenAPITypeOptions() {
      return miscUtilities.getOpenAPITypes().sort()
        .map(type => { return { value: type, text: miscUtilities.capitalizeFirstChar(type) }; });
    }
  },
  watch: {
    "$store.state.showCreateDefinitionForm"() {
      this.definitionName = null;
      this.definitionType = null;
      this.definitionDescription = null;
      this.selectedOBItemType = null;
      this.selectedFileName = null;
      this.selectedDefnIndex = null;
      this.selectedDefnName = null;
      this.selectedOBUsageTips = "";
      this.selectedOBSampleValue = JSON.stringify({"Decimals":"","EndTime":"","Precision":"","StartTime":"","Unit":"","Value":""}, null, 2);
    },
    "$store.state.isSelected"() {
      this.definitionType = null;
      this.definitionName = null;
      this.definitionDescription = null;
      this.selectedOBUsageTips = "";
      this.selectedOBSampleValue = JSON.stringify({"Decimals":"","EndTime":"","Precision":"","StartTime":"","Unit":"","Value":""}, null, 2);
      if (!this.preSubmit) {
        this.preSubmit = true;
      }
    },
    "$store.state.refreshCreateDefn"() {
      if (this.$store.state.refreshCreateDefn == true) {
        this.definitionType = null;
        this.definitionName = null;
        this.definitionDescription = null;
        this.selectedOBItemType = null;
        this.selectedFileName = null;
        this.selectedDefnIndex = null;
        this.selectedDefnName = null;
        this.selectedOBUsageTips = "";
        this.selectedOBSampleValue = JSON.stringify({"Decimals":"","EndTime":"","Precision":"","StartTime":"","Unit":"","Value":""}, null, 2);
        if (!this.preSubmit) {
          this.preSubmit = true;
        }
        this.$store.commit("refreshCreateDefnInputs", false);
      }
    },
    selectedFileName() {
      this.selectedDefnIndex = null;
      this.selectedDefnName = null;
      this.searchTerm = "";
    },
    selectedOBItemType() {
      if (this.selectedOBItemType) {
        this.selectedOBItemTypeType = ''
        this.selectedOBItemTypeDescription = ''
        this.selectedOBItemTypeEnumsOrUnits = []

        let enumOrUnitID = ''
        let enumOrUnitLabel = ''
        let enumOrUnitDescription = ''

        let currentItemTypeObj = this.allItemTypes[this.selectedOBItemType]
        this.findPossibleItemTypeGroups()
        if ("description" in currentItemTypeObj)
            this.selectedOBItemTypeDescription = currentItemTypeObj["description"]

          // refactor: repeated code
        if ("enums" in currentItemTypeObj) {
          this.selectedOBItemTypeType = 'enums'
          for (let i in currentItemTypeObj['enums']) {
            enumOrUnitID = i
            if ('label' in currentItemTypeObj['enums'][i]) {
                enumOrUnitLabel = currentItemTypeObj['enums'][i]['label']
            } else {
                enumOrUnitLabel = ''
            }

            if ('description' in currentItemTypeObj['enums'][i]) {
                enumOrUnitDescription = currentItemTypeObj['enums'][i]['description']
            } else {
                enumOrUnitDescription = ''
            }                        

            this.selectedOBItemTypeEnumsOrUnits.push({
                'enumOrUnitID': enumOrUnitID,
                'enumOrUnitLabel': enumOrUnitLabel,
                'enumOrUnitDescription': enumOrUnitDescription
            })
          }
        } else if ("units" in currentItemTypeObj) {
          this.selectedOBItemTypeType = 'units' 
          for (let i in currentItemTypeObj['units']) {
            enumOrUnitID = i
            if ('label' in currentItemTypeObj['units'][i]) {
                enumOrUnitLabel = currentItemTypeObj['units'][i]['label']
            } else {
                enumOrUnitLabel = ''
            }

            if ('description' in currentItemTypeObj['units'][i]) {
                enumOrUnitDescription = currentItemTypeObj['units'][i]['description']
            } else {
                enumOrUnitDescription = ''
            }     

            this.selectedOBItemTypeEnumsOrUnits.push({
                'enumOrUnitID': enumOrUnitID,
                'enumOrUnitLabel': enumOrUnitLabel,
                'enumOrUnitDescription': enumOrUnitDescription
            })
          }
        }
      }
    }
  }
};
</script>

<style>
#edit-form-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
}

.create-element-container {
  padding-left: 15px;
  padding-right: 15px;
}

.array-item-search-bar {
  margin-top: 5px;
  margin-bottom: 10px;
}

div.tooltip-inner {
  text-align: left;
}

</style>
