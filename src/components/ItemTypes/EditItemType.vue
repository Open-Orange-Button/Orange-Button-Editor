<template>
  <div class="edit-item-types-container">
    <b-form-group
      label="Choose Item Type to Edit:"
      label-for="input-edit-item-type-select-item-type"
    >
      <b-form-select
        id="input-edit-item-type-select-item-type"
        v-model="itemTypeToEdit"
        :options="Object.keys(allItemTypes).sort()"
        @change="populateForm"
      ></b-form-select>
    </b-form-group>
    <div class="edit-item-types-container" v-if="itemTypeToEdit">
      <b-form @submit="onSubmit">
        <b-form-group
          label="Item Type Name:"
          label-for="input-edit-item-type-item-type-name"
        >
          <b-form-input
            id="input-edit-item-type-item-type-name"
            v-model="form.itemTypeName"
            required
            disabled
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label="Description:"
          label-for="input-edit-item-type-item-type-description"
        >
          <b-form-textarea
            id="input-edit-item-type-item-type-description"
            v-model="form.itemTypeDescription"
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
            v-model="form.itemTypeType"
            :options="itemTypeTypes"
            :disabled="submitted"
          ></b-form-select>
        </b-form-group>

        <div class="enum-or-unit-table-container" v-if="form.itemTypeType">
          <b-table
            :fields="getTableFields()"
            :items="this.form.itemTypeEnumsOrUnits"
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
            <b-button size="sm"  :disabled="submitted" click="addEnumOrUnit" variant="primary">Add New</b-button>
          </div>
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
export default {
  created() {
    let state = this.$store.state;
    this.allItemTypes = state.loadedFiles[state.selectedFileName].item_types;
  },
  data() {
    return {
      itemTypeToEdit: "",
      allItemTypes: [],
      form: {
        itemTypeName: "",
        itemTypeType: "",
        itemTypeDescription: "",
        itemTypeEnumsOrUnits: []
      },
      itemTypeTypes: [
        { text: "", value: "" },
        { text: "Units", value: "units" },
        { text: "Enums", value: "enums" }
      ],
      enumOrUnitFields: {
        enumOrUnitID: { label: 'ID', editable: false },
        enumOrUnitLabel: { label: 'Label', editable: true },
        enumOrUnitDescription: { label: 'Description', editable: true }
      },
      enumOrUnitToAddForm: {
        enumOrUnitID: "",
        enumOrUnitLabel: "",
        enumOrUnitDescription: ""
      },
      submitted: false
    };
  },
  methods: {
    onSubmit(event) {
      event.preventDefault();
      let payload = {
        itemTypeName: this.form.itemTypeName,
        itemTypeType: this.form.itemTypeType,
        itemTypeDescription: this.form.itemTypeDescription,
        itemTypeEnumsOrUnits: this.form.itemTypeEnumsOrUnits
      };
      this.submitted = true;
      this.$store.commit("setItemTypeDefn", payload);
    },
    exitView() {
      this.$store.commit("showNoItemTypesViews");
    },
    getTableFields() {
      let tableFields = Object.entries(this.enumOrUnitFields).map(([key, { label }]) => ({ key, label }));
      tableFields.push({ key: "actions", label: "Actions" });
      return tableFields;
    },
    addEnumOrUnit() {
      this.form.itemTypeEnumsOrUnits.push({ enumOrUnitID: "", enumOrUnitLabel: "", enumOrUnitDescription: "" });
    },
    removeEnumOrUnit(rowItem) {
      this.form.itemTypeEnumsOrUnits = this.form.itemTypeEnumsOrUnits.filter(item => item.enumOrUnitID !== rowItem.enumOrUnitID);
    },
    populateForm() {
      this.submitted = false;
      let currentItemTypeObj = this.allItemTypes[this.itemTypeToEdit];
      this.form.itemTypeName = this.itemTypeToEdit;
      this.form.itemTypeDescription = currentItemTypeObj.description;
      let itemTypeType = '';
      if (currentItemTypeObj.enums) {
        itemTypeType = 'enums';
      } else if (currentItemTypeObj.units) {
        itemTypeType = 'units';
      }

      this.form.itemTypeType = itemTypeType;

      if (!itemTypeType) {
        return;
      }

      this.form.itemTypeEnumsOrUnits = Object.keys(currentItemTypeObj[itemTypeType])
        .map(k => ({
          enumOrUnitID: k,
          enumOrUnitLabel: currentItemTypeObj[itemTypeType][k].label,
          enumOrUnitDescription: currentItemTypeObj[itemTypeType][k].description
        }));
    }
  }
};
</script>

<style>
.edit-item-type-create-enums-or-units-table {
  word-break: break-word;
}
</style>

