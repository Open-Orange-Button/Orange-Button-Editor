<template>
  <div class="edit-item-types-container">
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
        sticky-header
        no-border-collapse
        :selectable="!validationMsg"
        :filter="itemTypeSearchFilter"
        select-mode="single"
        @row-clicked="setEnumUnitEditForm"
        :items="allItemTypes
                  .map(({ itemTypeName, defn }) => ({ item_type: itemTypeName, description: defn.itemTypeDescription, actions: '' }))
                  .sort(({ item_type: a }, { item_type: b }) => a.localeCompare(b))">
      <template #cell(actions)="row">
        <b-button size="sm" :disabled="submitted" @click="removeItemType(row.item)" variant="danger">Remove</b-button>
      </template>
      </b-table>
      <div class="center-items-container">
        <b-button size="sm"  :disabled="submitted" @click="addItemType" variant="primary">Add New Item Type</b-button>
      </div>
    </b-form-group>
    <h6 v-if="validationMsg" style="color: red">{{ validationMsg }}</h6>
    <div class="edit-item-types-container" v-if="form">
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
            <b-button size="sm" :disabled="submitted" @click="removeEnumOrUnit(row.item)" variant="danger">Remove</b-button>
          </template>
          <template #row-details="row">
            <b-row v-for="[key, data] in Object.entries(enumOrUnitFields)">
              <b-col>
                <label :for="`row-details-${data.label}`">{{ data.label }}:</label>
              </b-col>
              <b-col>
                <b-form-input :id="`row-details-${data.label}`" v-model="row.item[key]" />
              </b-col>
            </b-row>
          </template>
        </b-table>
        <div class="center-items-container">
          <b-button size="sm"  :disabled="submitted" @click="addEnumOrUnit" variant="primary">Add New</b-button>
        </div>

        <div class="line-break"></div>

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
      </b-form>
    </div>
    <div class="line-break"></div>
    <div class="center-items-container">
      <b-button variant="danger" @click="exitView" size="sm">Back</b-button>
    </div>
  </div>
</template>

<script>
import getAllTaxonomyElements from '../../utils/miscUtilities';
export default {
  created() {
    let state = this.$store.state;
    this.allItemTypes = Object.entries(state.loadedFiles[state.selectedFileName].item_types)
      .map(([itemTypeName, defn]) => ({ itemTypeName, defn: this.populateForm(itemTypeName, defn) }));
  },
  data() {
    return {
      itemTypeToEdit: "",
      allItemTypes: [],
      usedItemTypes: new Set(),
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
      let newItemType = { itemTypeName: "", defn: this.populateForm("", { description: "" }) };
      this.allItemTypes.push(newItemType);
      this.form = newItemType;
    },
    addEnumOrUnit() {
      this.form.itemTypeEnumsOrUnits.push({ enumOrUnitID: "", enumOrUnitLabel: "", enumOrUnitDescription: "" });
    },
    removeItemType(rowItem) {
      this.allItemTypes = this.allItemTypes.filter(i => i.itemTypeName !== rowItem.item_type);
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
    }
  }
};
</script>

<style>
.edit-item-type-create-enums-or-units-table {
  word-break: break-word;
}
</style>

