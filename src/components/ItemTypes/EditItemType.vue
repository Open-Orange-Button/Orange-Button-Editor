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
          @row-clicked="setEnumUnitEditForm"
          :items="allItemTypes
                    .map(({ itemTypeName, defn }) => ({ item_type: itemTypeName, description: defn.itemTypeDescription }))
                    .sort(({ item_type: a }, { item_type: b }) => a.localeCompare(b))">
        </b-table>
        <div class="center-items-container">
          <b-button size="sm" :disabled="submitted" @click="addItemType" variant="primary">Add New Item Type</b-button>
        </div>
      </b-form-group>
    </b-card>
    <h6 v-if="validationMsg" style="color: red">{{ validationMsg }}</h6>
    <div class="edit-item-types-container" v-if="itemTypeForm">
    <b-card class="form-b-card-padding">
      <span tabindex="0" id="remove-item-type-button" class="d-inline-block" style="float: right;">
        <b-button size="sm" :disabled="disableRemoveItemType" variant="danger"
          @click="removeItemType">Remove Item Type</b-button>
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
                <b-form-input :id="`row-details-${data.label}`" v-model="row.item[key]" :state="data.validator ? data.validator(row.item[key]) : true"/>
              </b-col>
            </b-row>
            <b-button size="sm" :disabled="submitted" @click="removeEnumOrUnit(row.item)" variant="danger">Remove</b-button>
            </b-card>
          </template>
        </b-table>
        <div class="center-items-container" v-if="itemTypeForm.defn.itemTypeType">
          <b-button size="sm"  :disabled="submitted" @click="addEnumOrUnit" variant="primary">Add New {{ miscUtils.capitalizeFirstChar(itemTypeForm.defn.itemTypeType.slice(0, -1)) }} </b-button>
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
  </div>
</template>

<script>
import * as miscUtilities from '../../utils/miscUtilities';
export default {
  created() {
    let state = this.$store.state;
    this.allItemTypes = Object.entries(state.loadedFiles[state.selectedFileName].item_types)
      .map(([itemTypeName, defn]) => ({ itemTypeName, defn: this.loadItemType(itemTypeName, defn) }));
    this.itemTypesInUse = new Set(Object.values(miscUtilities.getAllTaxonomyElements(this.$store.state.currentFile.file))
      .map(defn => defn.allOf[1]["x-ob-item-type"]));
  },
  data() {
    return {
      miscUtils: miscUtilities,
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
        enumOrUnitID: { label: 'ID', editable: false, thStyle: { width: "150px" }, validator: this.validateEnumOrUnitID },
        enumOrUnitLabel: { label: 'Label', editable: true, thStyle: { width: "150px" }, validator: this.validateEnumOrUnitLabel },
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
      validationMsg: ""
    };
  },
  methods: {
    onSubmit() {
      this.validationMsg = this.validateItemTypeForm();
      if (this.validationMsg) {
        return;
      }
      this.submitted = true;
      this.$store.commit("setItemTypes", this.allItemTypes);
    },
    validateItemTypeForm() {
      if (!this.itemTypeForm) {
        return "";
      }
      let validators = [
        this.validateItemTypeName,
        this.validateAllEnumOrUnitIDs,
        this.validateAllEnumOrUnitLabels
      ];
      let msgs = validators.map(f => f()).filter(m => m);
      return msgs ? msgs[0] : "";
    },
    validateItemTypeName() {
      if (this.itemTypeNameSet.has("")) {
        return "All item types must have nonempty names.";
      }
      if (this.allItemTypes.length !== this.itemTypeNameSet.size) {
        return "All item types must have unique names.";
      }
    },
    validateAllEnumOrUnitIDs() {
      let itemTypeType = this.itemTypeForm.defn.itemTypeType;
      let itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits;
      if (this.enumOrUnitIDCounts[""]) {
        return `All ${itemTypeType} of an item type must have nonempty IDs.`;
      }
      if (Object.values(this.enumOrUnitIDCounts).every(c => c === 1)) {
        return `All ${itemTypeType} of an item type must have unique IDs.`;
      }
      return "";
    },
    validateAllEnumOrUnitLabels() {
      let itemTypeType = this.itemTypeForm.defn.itemTypeType;
      let itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits;
      if (this.enumOrUnitLabelCounts[""]) {
        return `All ${itemTypeType} of an item type must have nonempty IDs.`;
      }
      if (Object.values(this.enumOrUnitLabelCounts).every(c => c === 1)) {
        return `All ${itemTypeType} of an item type must have unique IDs.`;
      }
      return "";
    },
    validateEnumOrUnitID(id) {
      let nonemptyID = Boolean(id);
      let uniqueID = Boolean(this.enumOrUnitIDCounts[id]) && this.enumOrUnitIDCounts[id] === 1;
      return nonemptyID && uniqueID;
    },
    validateEnumOrUnitLabel(label) {
      let nonemptyLabel = Boolean(label);
      let uniqueLabel = Boolean(this.enumOrUnitLabelCounts[label]) && this.enumOrUnitLabelCounts[label] === 1;
      return nonemptyLabel && uniqueLabel;
    },
    exitView() {
      this.$store.commit("showNoItemTypesViews");
    },
    getTableFields() {
      let tableFields = Object.entries(this.enumOrUnitFields).map(([key, { label, thStyle }]) => ({ key, label, thStyle }));
      tableFields.push({ key: "actions", label: "Actions", thStyle: { width: "150px" } });
      return tableFields;
    },
    addItemType() {
      this.validationMsg = this.validateItemTypeForm();
      if (this.validationMsg) {
        return;
      }
      let newItemType = { itemTypeName: "", defn: this.loadItemType("", { description: "" }) };
      this.allItemTypes.push(newItemType);
      this.itemTypeForm = newItemType;
    },
    addEnumOrUnit() {
      this.validationMsg = this.validateAllEnumOrUnitIDs();
      if (this.validationMsg) {
        return;
      }
      this.itemTypeForm.defn.itemTypeEnumsOrUnits.push({ enumOrUnitID: "", enumOrUnitLabel: "", enumOrUnitDescription: "" });
    },
    removeItemType() {
      this.allItemTypes = this.allItemTypes.filter(i => i.itemTypeName !== this.itemTypeForm.itemTypeName);
      this.itemTypeForm = null;
      this.validationMsg = "";
    },
    removeEnumOrUnit(rowItem) {
      this.itemTypeForm.defn.itemTypeEnumsOrUnits = this.itemTypeForm.defn.itemTypeEnumsOrUnits.filter(item => item.enumOrUnitID !== rowItem.enumOrUnitID);
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
    setEnumUnitEditForm(rowItem) {
      this.validationMsg = this.validateItemTypeForm();
      if (this.validationMsg) {
        return;
      }
      this.itemTypeForm = this.allItemTypes.filter(i => i.itemTypeName === rowItem.item_type)[0];
    },
    arrItemAppearanceCount(arr) {
      return arr.reduce((counts, item) => {
        if (!arr[item]) {
          arr[item] = 0;
        }
        arr[item] += 1;
        return arr;
      }, {});
    }
  },
  computed: {
    itemTypeNameSet() {
      return new Set(this.allItemTypes.map(i => i.itemTypeName));
    },
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
    enumOrUnitIDCounts() {
      return this.arrItemAppearanceCount(this.allEnumOrUnitIDs);
    },
    enumOrUnitLabelCounts() {
      return this.arrItemAppearanceCount(this.allEnumOrUnitLabels);
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

