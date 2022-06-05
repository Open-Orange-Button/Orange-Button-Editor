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
            :state="miscUtils.validateByOpenAPIType({ value:data.value, selectedOpenAPIType })
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
      OBEnumItemTypeIgnoreMap: { UUIDItemType: { validate: miscUtilities.validateUUIDItemType, errorMsg: `Please enter a UUID that matches the regex ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$.` } },
      miscUtils: miscUtilities
    };
  },
  methods: {
    submitEdit() {
      if (!this.isValidForm()) {
        return;
      }
      let sampleValueJSON = miscUtilities.buildSampleValueObject({
        sampleValuePrimitives: this.sampleValuePrimitives,
        selectedOpenAPIType: this.selectedOpenAPIType,
        isOBTaxonomyElementArray: this.isOBTaxonomyElementArray });
      this.$store.commit("addSampleValue", sampleValueJSON);
      this.hasSubmitted = true;
    },
    goPreviousView() {
      this.$store.state.activeEditingView = "EditDefinitionFormDisabled";
    },
    isValidForm() {
      this.submissionErrorMsg = miscUtilities.isValidSampleValueForm({
        sampleValueFormContext: this.sampleValueFormContext,
        sampleValuePrimitives: this.sampleValuePrimitives,
        selectedOpenAPIType: this.selectedOpenAPIType,
        selectedOBItemType: this.selectedOBItemType,
        OBEnumItemTypeIgnoreMap: this.OBEnumItemTypeIgnoreMap });
      return this.submissionErrorMsg === '';
    },
    setSampleValueData() {
      let savedSampleValueData = this.$store.state.nodeOBSampleValue;
      let formSampleValueData = miscUtilities.getSampleValueData();
      Object.entries(savedSampleValueData).forEach(([name, value]) => (formSampleValueData[name].value = value));
      return formSampleValueData;
    }
  },
  computed: {
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
    allItemTypes() {
      return this.$store.state.loadedFiles[this.selectedFileName]["item_types"];
    },
    allItemTypeGroups() {
      return this.$store.state.loadedFiles[this.selectedFileName]["item_type_groups"];
    },
    itemTypeEnumsOrUnitsComputed() {
      if (this.selectedOBItemTypeType) { // some item types have neither enums nor units
        return Object.entries(this.selectedOBItemTypeDef[this.selectedOBItemTypeType])
          .map(([name, def]) => { return { enumOrUnitID: name, enumOrUnitLabel: def.label || '', enumOrUnitDescription: def.description || '' }; });
        }
      return [];
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
