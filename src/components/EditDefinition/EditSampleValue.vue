<!-- 
Component for adding/removing sample value to definitions
-->

<template>
  <div class="editor-function-container">
    <div class="editor-function-body-container">
      <div v-for="[name, data] in Object.entries(sampleValuePrimitives)
                                        .sort((a, b) => a[1].order - b[1].order)
                                        .filter(p => sampleValueFormContext[p[0]].show)">
        {{ `${sampleValueFormContext[name].isArray ? 'Array Item ' : ''}${name}:` }}
          <component
            v-if="name === 'Value'"
            :is="sampleValueValueOptions.length > 0 ? 'b-form-select' : 'b-form-input'"
            v-model="data.value"
            :options="sampleValueValueOptions"
            :state="validateByOpenAPIType(data.value)
              && (OBEnumItemTypeIgnoreMap[selectedOBItemType] ? OBEnumItemTypeIgnoreMap[selectedOBItemType].validate(data.value) : true)" />
          <b-form-select
            v-else-if="name === 'Unit'"
            v-model="data.value"
            :options="sampleValueUnitOptions"
            :state="Boolean(data.value)" />
          <b-form-input
            v-else
            v-model="data.value"
            :state="Boolean(data.value) || !sampleValueFormContext[name].isRequired" />
      </div>
      <div style="color: red">
        {{ submissionErrorMsg }}
      </div>
    </div>
    <div class="editor-function-footer-container">
      <b-button variant="primary" @click="submitEdit" :disabled="hasSubmitted" size="sm">
        <span v-if="!hasSubmitted">Submit Edit</span>
        <span v-else>Edit Submitted!</span>
      </b-button>
      <b-button @click="goPreviousView" size="sm">Back</b-button>
    </div>
  </div>
</template>

<script>
import * as miscUtilities from "../../utils/miscUtilities";

export default {
  data() {
    return {
      hasSubmitted: false,
      submissionErrorMsg: '',
      sampleValuePrimitives: this.setSampleValueData(),
      OBEnumItemTypeIgnoreMap: { UUIDItemType: { validate: this.validateUUIDItemType, errorMsg: `Please enter a UUID that matches the regex ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$.` } }
    };
  },
  methods: {
    submitEdit() {
      if (!this.isValidForm()) {
        return;
      }
      this.$store.commit("addSampleValue", this.buildSampleValueObject());
      this.hasSubmitted = true;
    },
    goPreviousView() {
      this.$store.state.activeEditingView = "EditDefinitionFormDisabled";
    },
    filterItemTypeEnumsOrUnitsByItemTypeGroup() {
      let itemTypes = this.itemTypeEnumsOrUnitsComputed;
      if (this.selectedItemTypeGroup) {
        itemTypes = itemTypes.filter(u => this.allItemTypeGroups[this.selectedItemTypeGroup].group.includes(u.enumOrUnitID));
      }
      return itemTypes.map(e => {
        return { value: e.enumOrUnitID, text: `${e.enumOrUnitLabel} (${e.enumOrUnitID})` };
      });
    },
    isValidForm() {
      this.submissionErrorMsg = '';
      let missingSampleValuePrimitives = Object.entries(this.sampleValueFormContext)
        .filter(([primitive, context]) => context.isRequired && !this.sampleValuePrimitives[primitive].value)
        .sort((a, b) => this.sampleValuePrimitives[a[0]].order - this.sampleValuePrimitives[b[0]].order)
        .map(([primitive, _]) => primitive);
      if (missingSampleValuePrimitives.length > 0) {
        this.submissionErrorMsg = `Please enter sample values for these primitives: ${missingSampleValuePrimitives.join(', ')}`
      } else if (!this.validateByOpenAPIType(this.sampleValuePrimitives.Value.value)) {
        this.submissionErrorMsg = `Please enter a sample value for Value that is the OpenAPI type of ${miscUtilities.capitalizeFirstChar(this.selectedOpenAPIType)}.`;
      } else if (this.OBEnumItemTypeIgnoreMap[this.selectedOBItemType] && !this.OBEnumItemTypeIgnoreMap[this.selectedOBItemType].validate(this.sampleValuePrimitives.Value.value)) {
        this.submissionErrorMsg = this.OBEnumItemTypeIgnoreMap[this.selectedOBItemType].errorMsg;
      }
      return this.submissionErrorMsg === '';
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
    getSampleValueData() {
      return { Decimals: { order: 3, value: '' },
               EndTime: { order: 6, value: '' },
               Precision: { order: 4, value: '' },
               StartTime: { order: 5, value: '' },
               Unit: { order: 2, value: '' },
               Value: { order: 1, value: '' } };
    },
    setSampleValueData() {
      let savedSampleValueData = this.$store.state.nodeOBSampleValue;
      let formSampleValueData = this.getSampleValueData();
      Object.entries(savedSampleValueData).forEach(([name, value]) => (formSampleValueData[name].value = value));
      return formSampleValueData;
    },
    validateByOpenAPIType(value) {
      let type = this.selectedOpenAPIType;
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      if (type === 'number') {
        return !/^\s*$/.test(value) && !isNaN(value);
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
    validateUUIDItemType(value) {
      return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(value);
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
    sampleValueFormContext() {
      return { Decimals: { isArray: false, isRequired: false, show: this.selectedOpenAPIType === 'number' },
               EndTime: { isArray: false, isRequired: false, show: true },
               Precision: { isArray: false, isRequired: false, show: this.selectedOpenAPIType === 'number' },
               StartTime: { isArray: false, isRequired: false, show: true },
               Unit: { isArray: false, isRequired: this.selectedOBItemTypeType === 'units', show: this.selectedOBItemTypeType === 'units' } ,
               Value: { isArray: this.isOBTaxonomyElementArray, isRequired: true, show: true } };
    },
    sampleValueValueOptions() {
      if (this.selectedOpenAPIType === 'boolean') {
        return [{ value: 'true', text: 'True' },
                { value: 'false', text: 'False' }];
      } else if (this.selectedOBItemTypeType === 'enums' && !Object.keys(this.OBEnumItemTypeIgnoreMap).includes(this.selectedOBItemType)) {
        return this.filterItemTypeEnumsOrUnitsByItemTypeGroup();
      }
      return [];
    },
    sampleValueUnitOptions() {
      if (this.selectedOBItemTypeType === 'units') {
        return this.filterItemTypeEnumsOrUnitsByItemTypeGroup();
      }
      return [];
    },
    allItemTypes() {
      return this.$store.state.loadedFiles[this.selectedFileName]["item_types"];
    },
    allItemTypeGroups() {
      return this.$store.state.loadedFiles[this.selectedFileName]["item_type_groups"];
    },
    itemTypeEnumsOrUnitsComputed() {
      return Object.entries(this.selectedOBItemTypeDef[this.selectedOBItemTypeType])
        .map(([name, def]) => { return { enumOrUnitID: name, enumOrUnitLabel: def.label || '', enumOrUnitDescription: def.description || '' }; });
    },
    selectedOpenAPIType() {
      return this.selectedOBPrimitiveValueType.split(`Value${this.isOBTaxonomyElementArray ? 'Array' : ''}`)[1].toLowerCase();
    },
    selectedOBPrimitiveValueType() {
      return this.$store.state.nodeOBPrimitiveValueType;
    },
    selectedOBItemType() {
      return this.$store.state.nodeOBType;
    },
    selectedOBItemTypeDef() {
      return this.allItemTypes[this.selectedOBItemType];
    },
    selectedOBItemTypeType() {
      if (this.selectedOBItemTypeDef.enums) {
        return 'enums';
      } else if (this.selectedOBItemTypeDef.units) {
        return 'units';
      }
      return '';
    },
    selectedFileName() {
      return this.$store.state.selectedFileName;
    },
    selectedNodeName() {
      return this.$store.state.nodeName;
    },
    selectedNodeDef() {
      return this.$store.state.loadedFiles[this.selectedFileName].file[this.selectedNodeName];
    },
    isOBTaxonomyElementArray() {
      return this.selectedOBPrimitiveValueType.includes('Array');
    },
    selectedItemTypeGroup() {
      return this.$store.state.nodeOBItemTypeGroupName;
    }
  }
};
</script>

<style>
.editor-function-container {
  display: grid;
  height: 100%;
  grid-template-rows: 1fr 50px;
}

.editor-function-body-container {
  padding-top: 9px;
  overflow-y: auto;
  grid-row: 1 / 2;
  padding-left: 15px;
  padding-right: 15px;
}

.editor-function-footer-container {
  grid-row: 2 / 3;
  display: flex;
  justify-content: center;
  align-items: center;
  border: #d3d3d3 solid 1px;
}
</style>
