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
          :selectable="!validationMsg"
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
    <div class="edit-item-types-container" v-if="form">
    <b-card class="form-b-card-padding">
      <span tabindex="0" id="remove-item-type-button" class="d-inline-block" style="float: right;">
        <b-button size="sm" :disabled="disableRemoveItemType" variant="danger"
          @click="removeItemType">Remove Item Type</b-button>
      </span>
      <b-tooltip v-if="disableRemoveItemType" target="remove-item-type-button" placement="bottom">
        Cannot remove this item type because it is used by an OB Element.
      </b-tooltip>
      <br>
      <b-form @submit="onSubmit">
        <b-form-group
          label="Item Type Name:"
          label-for="input-edit-item-type-item-type-description"
        >
          <b-form-input
            id="input-edit-item-type-item-type-description"
            v-model="form.itemTypeName"
            :disabled="submitted"
            :state="Boolean(form.itemTypeName)"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label="Description:"
          label-for="input-edit-item-type-item-type-description"
        >
          <b-form-textarea
            id="input-edit-item-type-item-type-description"
            v-model="form.defn.itemTypeDescription"
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
            v-model="form.defn.itemTypeType"
            :options="itemTypeTypes"
            :disabled="submitted"
          ></b-form-select>
        </b-form-group>

        <b-table
          striped
          sticky-header
          no-border-collapse
          :fields="getTableFields()"
          :items="form.defn.itemTypeEnumsOrUnits"
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
                <b-form-input :id="`row-details-${data.label}`" v-model="row.item[key]" />
              </b-col>
            </b-row>
            <b-button size="sm" :disabled="submitted" @click="removeEnumOrUnit(row.item)" variant="danger">Remove</b-button>
            </b-card>
          </template>
        </b-table>
        <div class="center-items-container">
          <b-button size="sm"  :disabled="submitted" @click="addEnumOrUnit" variant="primary">Add New</b-button>
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
        <span v-if="!submitted">Submit</span>
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
      .map(([itemTypeName, defn]) => ({ itemTypeName, defn: this.populateForm(itemTypeName, defn) }));
    Object.values(miscUtilities.getAllTaxonomyElements(this.$store.state.currentFile.file))
      .map(defn => defn.allOf[1]["x-ob-item-type"])
      .forEach(itemType => this.itemTypesInUse.add(itemType));
  },
  data() {
    return {
      itemTypeToEdit: "",
      allItemTypes: [],
      itemTypesInUse: new Set(),
      form: null,
      itemTypeTypes: [
        { text: "", value: "" },
        { text: "Units", value: "units" },
        { text: "Enums", value: "enums" }
      ],
      enumOrUnitFields: {
        enumOrUnitID: { label: 'ID', editable: false, thStyle: { width: "150px" } },
        enumOrUnitLabel: { label: 'Label', editable: true, thStyle: { width: "150px" } },
        enumOrUnitDescription: { label: 'Description', editable: true }
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
    onSubmit(event) {
      event.preventDefault();
      this.submitted = true;
      this.validationMsg = this.validateItemTypes();
      if (this.validationMsg) {
        return;
      }
      this.$store.commit("setItemTypes", this.allItemTypes);
    },
    validateItemTypes() {
      // all item type names are nonempty
      if (this.itemTypeNameSet.has('')) {
        return "All item types must have nonempty names.";
      }
      if (this.allItemTypes.length !== this.itemTypeNameSet.size) {
        return "All item types must have unique names.";
      }
      return "";
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
      this.validationMsg = this.validateItemTypes();
      if (this.validationMsg) {
        return;
      }
      let newItemType = { itemTypeName: "", defn: this.populateForm("", { description: "" }) };
      this.allItemTypes.push(newItemType);
      this.form = newItemType;
    },
    addEnumOrUnit() {
      this.form.itemTypeEnumsOrUnits.push({ enumOrUnitID: "", enumOrUnitLabel: "", enumOrUnitDescription: "" });
    },
    removeItemType() {
      this.allItemTypes = this.allItemTypes.filter(i => i.itemTypeName !== this.form.itemTypeName);
      this.form = null;
      this.validationMsg = "";
    },
    removeEnumOrUnit(rowItem) {
      this.form.itemTypeEnumsOrUnits = this.form.itemTypeEnumsOrUnits.filter(item => item.enumOrUnitID !== rowItem.enumOrUnitID);
    },
    populateForm(itemTypeName, itemTypeDefn) {
      let form = { initialItemTypeName: itemTypeName, itemTypeDescription: itemTypeDefn.description };

      let itemTypeType = '';
      if (itemTypeDefn.enums) {
        itemTypeType = 'enums';
      } else if (itemTypeDefn.units) {
        itemTypeType = 'units';
      }
      form.itemTypeType = itemTypeType;

      form.itemTypeEnumsOrUnits = Object.entries(itemTypeDefn[itemTypeType] || [])
        .map(([id, { label, description }]) => ({
          enumOrUnitID: id,
          enumOrUnitLabel: label,
          enumOrUnitDescription: description
        }));
      return form;
    },
    setEnumUnitEditForm(rowItem) {
      this.validationMsg = this.validateItemTypes();
      if (this.validationMsg) {
        return;
      }
      this.form = this.allItemTypes.filter(i => i.itemTypeName === rowItem.item_type)[0];
    }
  },
  computed: {
    itemTypeNameSet() {
      return new Set(this.allItemTypes.map(i => i.itemTypeName));
    },
    disableRemoveItemType() {
      let itemTypeIsUsed = [
        this.form.itemTypeName,
        this.form.defn.initialItemTypeName // in case the user changes the name then tries to delete
      ].some(n => this.itemTypesInUse.has(n));
      return this.submitted || itemTypeIsUsed;
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
  padding: 0.5em
}

</style>

