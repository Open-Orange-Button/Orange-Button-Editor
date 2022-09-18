<template>
  <div class="edit-item-types-container">
    <b-card class="form-b-card-padding" style="padding-top: 0em; margin-bottom: 1em">
      <b-form-group
        label="Select an Item Type"
        label-for="input-item-type-search"
      >
        <b-form-input
          id="input-item-type-search"
          v-model="itemTypeSearchFilter"
          type="search"
          placeholder="Search item types..."
        />
        <b-table
          striped
          sticky-header
          no-border-collapse
          :selectable="!submitted && !validationMsg"
          :filter="itemTypeSearchFilter"
          select-mode="single"
          @row-clicked="setItemTypeForm"
          :items="allItemTypes
                    .map(({ itemTypeName, defn }) => ({ item_type: itemTypeName, description: defn.itemTypeDescription }))
                    .sort(({ item_type: a }, { item_type: b }) => a.localeCompare(b))">
        </b-table>
        <div class="center-items-container">
          <b-button size="sm" :disabled="submitted" @click="addItemType" variant="primary" style="z-index: 0">Add New Item Type</b-button>
        </div>
      </b-form-group>
    </b-card>
    <h6 v-if="validationMsg" style="color: red">{{ validationMsg }}</h6>
    <div class="edit-item-types-container" v-if="itemTypeForm">
    <b-card class="form-b-card-padding">
      <span tabindex="0" id="remove-item-type-button" class="d-inline-block" style="float: right;">
        <b-button size="sm" :disabled="disableRemoveItemType" variant="danger"
          @click="setDeletionModalInfo('item type', itemTypeForm.itemTypeName, removeItemType)">Remove Item Type</b-button>
      </span>
      <b-tooltip v-if="disableRemoveItemType" target="remove-item-type-button" placement="bottom">
        Cannot remove this item type because it is used by an OB Element.
      </b-tooltip>
      <br>
      <b-form>
        <b-form-group
          label="Item Type Name:"
          label-for="input-edit-item-type-item-type-description"
        >
          <b-form-input
            id="input-edit-item-type-item-type-description"
            v-model="itemTypeForm.itemTypeName"
            :disabled="submitted"
            :state="!Boolean(validateItemTypeName())"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label="Description:"
          label-for="input-edit-item-type-item-type-description"
        >
          <b-form-textarea
            id="input-edit-item-type-item-type-description"
            v-model="itemTypeForm.defn.itemTypeDescription"
            rows="3"
            max-rows="6"
            :disabled="submitted"
          ></b-form-textarea>
        </b-form-group>

        <b-form-group
          id="input-group-item-type-type"
          label="Type:"
          label-for="input-item-type-type"
        >
          <b-form-select
            id="input-item-type-type"
            v-model="itemTypeForm.defn.itemTypeType"
            :options="itemTypeTypes"
            :disabled="submitted"
          ></b-form-select>
        </b-form-group>

        <b-table
          striped
          sticky-header
          no-border-collapse
          :fields="getTableFields()"
          :items="itemTypeForm.defn.itemTypeEnumsOrUnits"
          id="edit-item-type-create-enums-or-units-table"
          class="item-type-table"
          ref="edit-item-type-create-enums-or-units-table-ref"
        >
          <template #cell(actions)="row">
            <b-button size="sm" :disabled="submitted" @click="row.toggleDetails">{{ row.detailsShowing ? "Close" : "Edit" }}</b-button>
          </template>
          <template #row-details="row">
            <b-card class="form-b-card-padding">
            <b-row v-for="[key, data] in Object.entries(enumOrUnitFields)"
              :key="key">
              <b-col>
                <label :for="`row-details-${data.label}`">{{ data.label }}:</label>
              </b-col>
              <b-col>
                <b-form-input :id="`row-details-${data.label}`" v-model="row.item[key]" :state="data.validator ? !Boolean(data.validator()) : true"/>
              </b-col>
            </b-row>
            <b-button size="sm" :disabled="submitted" variant="danger"
              @click="setDeletionModalInfo(formattedItemTypeType.toLowerCase(), row.item.enumOrUnitID, () => removeEnumOrUnit(row.item))">Remove</b-button>
            </b-card>
          </template>
        </b-table>
        <div class="center-items-container" v-if="itemTypeForm.defn.itemTypeType">
          <b-button size="sm"  :disabled="submitted" @click="addEnumOrUnit" variant="primary">Add New {{ formattedItemTypeType }} </b-button>
        </div>
      </b-form>
    </b-card>
    </div>
    <br>
    <div class="center-items-container">
      <b-button
        type="submit"
        variant="primary"
        :disabled="submitted"
      >
        <span v-if="!submitted" @click="onSubmit">Submit</span>
        <span v-else>Submitted!</span>
      </b-button>
    </div>
    <br>
    <div class="center-items-container">
      <b-button variant="danger" @click="exitView" size="sm">Back</b-button>
    </div>
  <b-modal id="deletion-modal" title="Are you sure?"
    v-model="deletionModalInfo.showModal"
    @ok="deletionModalInfo.actionOnConfirm"
  >
    The {{ deletionModalInfo.typeOfItem }} "{{ deletionModalInfo.nameOfItem }}" will be deleted.
  </b-modal>
  <b-modal id="validation-error-modal" title="Validation error"
    v-model="showValidationModal"
  >
    {{ validationMsg }}
  </b-modal>
  </div>
</template>

<script>
import * as miscUtilities from '../../utils/miscUtilities';
export default {
  created() {
    let state = this.$store.state;
    this.allItemTypes = Object.entries(state.loadedFiles[state.selectedFileName].item_types)
      .map(([itemTypeName, defn]) => ({ itemTypeName, defn: this.loadItemType(itemTypeName, defn) }));
    this.itemTypesInUse = new Set(Object.entries(this.$store.state.currentFile.file)
      .filter(([_, defn]) => miscUtilities.isTaxonomyElement(defn))
      .map(([_, defn]) => defn.allOf[1]["x-ob-item-type"]));
  },
  data() {
    return {
      itemTypeToEdit: "",
      allItemTypes: [],
      itemTypesInUse: new Set(),
      itemTypeForm: null,
      itemTypeTypes: [
        { text: "", value: "" },
        { text: "Units", value: "units" },
        { text: "Enums", value: "enums" }
      ],
      enumOrUnitFields: {
        enumOrUnitID: { label: 'ID', editable: false, thStyle: { width: "150px" }, validator: this.validateAllEnumOrUnitIDs },
        enumOrUnitLabel: { label: 'Label', editable: true, thStyle: { width: "150px" }, validator: this.validateAllEnumOrUnitLabels },
        enumOrUnitDescription: { label: 'Description', editable: true, validator: null }
      },
      enumOrUnitToAddForm: {
        enumOrUnitID: "",
        enumOrUnitLabel: "",
        enumOrUnitDescription: ""
      },
      submitted: false,
      itemTypeSearchFilter: "",
      validItemTypes: false,
      showValidationModal: false,
      itemTypeValidators: [ // in order of importance
        this.validateItemTypeName
      ],
      enumOrUnitValidators: [ // in order of importance
        this.validateAllEnumOrUnitIDs,
        this.validateAllEnumOrUnitLabels
      ],
      deletionModalInfo: {
        typeOfItem: "", nameOfItem: "", actionOnConfirm: x => x, showModal: false
      }
    };
  },
  methods: {
    onSubmit() {
      if (this.validationMsg) {
        this.showValidationModal = true;
        return;
      }
      this.submitted = true;
      this.$store.commit("setItemTypes", this.allItemTypes);
    },
    isUpperCaseK8sCamelCase(str) {
      return /^[0-9A-Z][a-z0-9_]*([A-Z]+[a-z0-9_]*)*$/.test(str);
    },
    validateItemTypeName() {
      if (this.itemTypeNameCounts[""]) {
        return "An item type must have a nonempty name.";
      }
      let duplicateItemTypeNames = Object.entries(this.itemTypeNameCounts).filter(([_, count]) => count > 1)
        .map(([name, _]) => name);
      if (duplicateItemTypeNames.length) {
        return `An item type named '${duplicateItemTypeNames[0]}' already exists.`;
      }
      let badCaseConventionItemTypeNames = Object.keys(this.itemTypeNameCounts).filter(k => !this.isUpperCaseK8sCamelCase(k));
      if (badCaseConventionItemTypeNames.length) {
        return `The item type name '${badCaseConventionItemTypeNames[0]}' must follow the upper camel case convention with all-caps acronyms.`;
      }
    },
    validateAllEnumOrUnitIDs() {
      let itemTypeType = this.itemTypeForm.defn.itemTypeType;
      let itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits;
      let sentenceStart = itemTypeType === "enums" ? "An enum" : "A unit";
      if (this.enumOrUnitIDCounts[""]) {
        return `${sentenceStart} of an item type must have a nonempty ID.`;
      }
      let duplicateIDs = Object.entries(this.enumOrUnitIDCounts).filter(([_, count]) => count > 1)
        .map(([id, _]) => id);
      if (duplicateIDs.length) {
        return `${sentenceStart} with ID '${duplicateIDs[0]}' already exists for this item type.`
      }
      if (itemTypeType === "enums") {
        let badCaseConventionIDs = Object.keys(this.enumOrUnitIDCounts).filter(k => !this.isUpperCaseK8sCamelCase(k));
        if (badCaseConventionIDs.length) {
          return `The enum '${badCaseConventionIDs[0]}' must follow the upper camel case convention with all-caps acronyms.`;
        }
      }
      return "";
    },
    validateAllEnumOrUnitLabels() {
      let itemTypeType = this.itemTypeForm.defn.itemTypeType;
      let itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits;
      let sentenceStart = itemTypeType === "enums" ? "An enum" : "A unit";
      // allowing empty labels for now
      // if (this.enumOrUnitLabelCounts[""]) {
      //   return `${sentenceStart} of an item type must have a nonempty label.`;
      // }
      let duplicateLabels = Object.entries(this.enumOrUnitLabelCounts).filter(([_, count]) => count > 1)
        .map(([label, _]) => label);
      if (duplicateLabels.length) {
        return `${sentenceStart} with label '${duplicateLabels[0]}' already exists for this item type.`
      }
      return "";
    },
    exitView() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: null });
    },
    getTableFields() {
      let tableFields = Object.entries(this.enumOrUnitFields).map(([key, { label, thStyle }]) => ({ key, label, thStyle }));
      tableFields.push({ key: "actions", label: "Actions", thStyle: { width: "150px" } });
      return tableFields;
    },
    addItemType() {
      if (this.validationMsg) {
        this.showValidationModal = true;
        return;
      }
      let newItemType = { itemTypeName: "", defn: this.loadItemType("", { description: "" }) };
      this.allItemTypes.push(newItemType);
      this.itemTypeForm = newItemType;
    },
    addEnumOrUnit() {
      // check validators in order of importance, and return the first error message
      if (this.validationMsg) {
        this.showValidationModal = true;
        return;
      }
      this.itemTypeForm.defn.itemTypeEnumsOrUnits.push({ enumOrUnitID: "", enumOrUnitLabel: "", enumOrUnitDescription: "" });
    },
    removeItemType() {
      this.allItemTypes = this.allItemTypes.filter(i => i.itemTypeName !== this.itemTypeForm.itemTypeName);
      this.itemTypeForm = null;
    },
    removeEnumOrUnit(rowItem) {
      this.itemTypeForm.defn.itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits.filter(item => item.enumOrUnitID !== rowItem.enumOrUnitID);
    },
    setDeletionModalInfo(typeOfItem, nameOfItem, actionOnConfirm) {
      this.deletionModalInfo = { typeOfItem, nameOfItem, actionOnConfirm, showModal: true };
    },
    loadItemType(itemTypeName, itemTypeDefn) {
      let data = { initialItemTypeName: itemTypeName, itemTypeDescription: itemTypeDefn.description };

      let itemTypeType = '';
      if (itemTypeDefn.enums) {
        itemTypeType = 'enums';
      } else if (itemTypeDefn.units) {
        itemTypeType = 'units';
      }
      data.itemTypeType = itemTypeType;

      data.itemTypeEnumsOrUnits = Object.entries(itemTypeDefn[itemTypeType] || [])
        .map(([id, { label, description }]) => ({
          enumOrUnitID: id,
          enumOrUnitLabel: label,
          enumOrUnitDescription: description
        }));
      return data;
    },
    setItemTypeForm(rowItem) {
      if (this.validationMsg) {
        this.showValidationModal = true;
        return;
      }
      this.itemTypeForm = this.allItemTypes.filter(i => i.itemTypeName === rowItem.item_type)[0];
    },
    arrItemAppearanceCount(arr) {
      return arr.reduce((counts, item) => {
        if (!counts[item]) {
          counts[item] = 0;
        }
        counts[item] += 1;
        return counts;
      }, {});
    }
  },
  computed: {
    disableRemoveItemType() {
      let itemTypeIsUsed = [
        this.itemTypeForm.itemTypeName,
        this.itemTypeForm.defn.initialItemTypeName // in case the user changes the name then tries to delete
      ].some(n => this.itemTypesInUse.has(n));
      return this.submitted || itemTypeIsUsed;
    },
    allEnumOrUnitIDs() {
      let itemTypeType = this.itemTypeForm.defn.itemTypeType;
      let itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits;
      return itemTypeEnumsOrUnits.map(i => i.enumOrUnitID);
    },
    allEnumOrUnitLabels() {
      let itemTypeType = this.itemTypeForm.defn.itemTypeType;
      let itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits;
      return itemTypeEnumsOrUnits.map(i => i.enumOrUnitLabel);
    },
    itemTypeNameCounts() {
      return this.arrItemAppearanceCount(this.allItemTypes.map(i => i.itemTypeName));
    },
    enumOrUnitIDCounts() {
      return this.arrItemAppearanceCount(this.allEnumOrUnitIDs);
    },
    enumOrUnitLabelCounts() {
      return this.arrItemAppearanceCount(this.allEnumOrUnitLabels);
    },
    formattedItemTypeType() {
      return miscUtilities.capitalizeFirstChar(this.itemTypeForm.defn.itemTypeType.slice(0, -1)) 
    },
    validationMsg() {
      if (!this.itemTypeForm) {
        return "";
      }
      let validators = [
        ...this.itemTypeValidators,
        ...this.enumOrUnitValidators
      ];
      let msgs = validators.map(f => f()).filter(m => m);
      return msgs ? msgs[0] : "";
    }
  }
};
</script>

<style>
.center-items-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.edit-item-type-create-enums-or-units-table {
  word-break: break-word;
}

.form-b-card-padding {
  padding: 0.5em;
}
</style>

