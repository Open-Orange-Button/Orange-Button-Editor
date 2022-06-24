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
        v-if="definitionType === OBTaxonomyElementDisplayName && selectedOpenAPIType"
      >
        <b-form-select
          id="node-item-type-input"
          v-model="selectedOBItemType"
          :options="itemTypeOptions"
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
                :state="miscUtils.validateByOpenAPIType({ value: data.value, selectedOpenAPIType })
                  && (OBEnumItemTypeIgnoreMap[selectedOBItemType] ? OBEnumItemTypeIgnoreMap[selectedOBItemType].validate(data.value) : true)"
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
      miscUtils: miscUtilities,
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
      sampleValuePrimitives: miscUtilities.getSampleValueData(),
      OBEnumItemTypeIgnoreMap: miscUtilities.OBEnumItemTypeIgnoreMap()
    };
  },
  methods: {
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

      if (this.addSampleValue) {
        this.submissionErrorMsg = miscUtilities.isValidSampleValueForm({
          sampleValueFormContext: this.sampleValueFormContext,
          sampleValuePrimitives: this.sampleValuePrimitives,
          selectedOpenAPIType: this.selectedOpenAPIType,
          selectedOBItemType: this.selectedOBItemType,
          OBEnumItemTypeIgnoreMap: this.OBEnumItemTypeIgnoreMap });
        if (this.submissionErrorMsg) {
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
      let sampleValueJSON = {};
      if (this.addSampleValue) {
        sampleValueJSON = miscUtilities.buildSampleValueObject({
          sampleValuePrimitives: this.sampleValuePrimitives,
          selectedOpenAPIType: this.selectedOpenAPIType,
          isOBTaxonomyElementArray: this.isOBTaxonomyElementArray });
      }
      let payload = {
        definitionName: this.definitionName,
        definitionType: this.definitionType,
        definitionDescription: this.definitionDescription,
        arrayItemDefnName: this.selectedDefnName,
        arrayItemFileName: this.selectedFileName,
        OBItemType: this.selectedOBItemType,
        OBItemTypeGroup: this.selectedItemTypeGroup,
        OpenAPIType: this.selectedOpenAPIType ? miscUtilities.capitalizeFirstChar(this.selectedOpenAPIType) : '',
        isOBTaxonomyElementArray: this.isOBTaxonomyElementArray,
        OBUsageTips: this.selectedOBUsageTips,
        OBSampleValue: sampleValueJSON
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
      this.possibleItemTypeGroups = Object.entries(this.allItemTypeGroups)
        .filter(([_, defn]) => defn.type.includes(this.selectedOBItemType))
        .map(([name, _]) => name);
      this.possibleItemTypeGroups.push({value: '', text: 'None'})
    },
    formatForm() {
      this.sampleValuePrimitives = miscUtilities.getSampleValueData();
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
    itemTypeOptions() {
      let forBooleanOpenAPIType = ([name, _]) => name === 'BooleanItemType';
      let forStringOpenAPIType =  ([_, def]) => !def.units;
      let forNumericOpenAPIType = ([_, def]) => !def.enums;
      let forOpenAPIType;
      if (this.selectedOpenAPIType === 'boolean') {
        forOpenAPIType = forBooleanOpenAPIType;
      } else if (this.selectedOpenAPIType === 'string') {
        forOpenAPIType = forStringOpenAPIType;
      } else if (['integer', 'number'].includes(this.selectedOpenAPIType)) {
        forOpenAPIType = forNumericOpenAPIType;
      }
      return Object.entries(this.allItemTypes).filter(forOpenAPIType)
        .map(([name, _]) => name).sort();
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
      return miscUtilities.defnDetails({
        defnName: this.selectedDefnName,
        fileName: this.selectedFileName,
        state: this.$store.state });
    },
    itemTypeEnumsOrUnitsComputed() {
      return this.selectedOBItemTypeEnumsOrUnits
    },
    allPossibleItemTypeGroups() {
      return this.possibleItemTypeGroups
    },
    sampleValueFormContext() {
      return miscUtilities.sampleValueFormContext({
        selectedOpenAPIType: this.selectedOpenAPIType,
        selectedOBItemTypeType: this.selectedOBItemTypeType,
        isOBTaxonomyElementArray: this.isOBTaxonomyElementArray });
    },
    sampleValueValueOptions() {
      return miscUtilities.sampleValueValueOptions({
        selectedOpenAPIType: this.selectedOpenAPIType,
        selectedOBItemType: this.selectedOBItemType,
        selectedOBItemTypeType: this.selectedOBItemTypeType,
        OBEnumItemTypeIgnoreMap: this.OBEnumItemTypeIgnoreMap,
        itemTypeEnumsOrUnitsComputed: this.itemTypeEnumsOrUnitsComputed,
        selectedItemTypeGroup: this.selectedItemTypeGroup,
        allItemTypeGroups: this.allItemTypeGroups });
    },
    sampleValueUnitOptions() {
      return miscUtilities.sampleValueUnitOptions({
        selectedOBItemTypeType: this.selectedOBItemTypeType,
        itemTypeEnumsOrUnitsComputed: this.itemTypeEnumsOrUnitsComputed,
        selectedItemTypeGroup: this.selectedItemTypeGroup,
        allItemTypeGroups: this.allItemTypeGroups });
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
    },
    "$store.state.isSelected"() {
      this.definitionType = null;
      this.definitionName = null;
      this.definitionDescription = null;
      this.selectedOBUsageTips = "";
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
        let selectedOBItemTypeDef = this.allItemTypes[this.selectedOBItemType];
        this.selectedOBItemTypeType = miscUtilities.OBItemTypeType({ itemTypeDef: selectedOBItemTypeDef });
        this.selectedOBItemTypeDescription = selectedOBItemTypeDef.description;
        this.selectedOBItemTypeEnumsOrUnits = miscUtilities.buildItemTypeEnumsOrUnitsComputedList({ itemTypeDef: selectedOBItemTypeDef, itemTypeType: this.selectedOBItemTypeType });
        this.findPossibleItemTypeGroups();
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
