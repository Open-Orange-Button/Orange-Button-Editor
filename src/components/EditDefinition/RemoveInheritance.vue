<!-- 
Component for removing inheritance from objects
-->

<template>
  <div class="editor-function-container">
    <div class="editor-function-body-container">
      <p>Choose superclass to remove from object:</p>
      <div class="superclass-list">
        <li
          v-for="(superClassName, index) in superClassList"
          class="superclass-in-list"
          @click="superClassToRemove(index, superClassName)"
          :class="{ 'selected-superclass': index == selectedIndex }"
        >
          {{ superClassName }}
        </li>
      </div>
      <br />
      <b-table
        :items="defnDetails"
        id="add-member-detail-table"
        ref="add-member-detail-table"
        v-if="selectedSuperClass"
      ></b-table>
    </div>
    <div class="editor-function-footer-container">
      <b-button
        variant="primary"
        @click="removeSuperClass"
        :disabled="emptySuperClassList"
        size="sm"
      >
        Remove
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
      searchTerm: "",
      selectedIndex: null,
      selectedSuperClass: "",
      definitionsInSuperClass: [],
      selectedElementDetails: [],
      emptySuperClassList: true,
      selectedSuperClassRefFile: ""
    };
  },
  methods: {
    superClassToRemove(index, superClassName) {
      this.selectedIndex = index;
      this.selectedSuperClass = superClassName;

      for (let i in this.$store.state.currentFile.file[
        this.$store.state.isSelected
      ]["allOf"]) {
        if (
          this.$store.state.currentFile.file[this.$store.state.isSelected][
            "allOf"
          ][i]["$ref"]
        ) {
          if (
            this.$store.state.currentFile.file[this.$store.state.isSelected][
              "allOf"
            ][i]["$ref"].includes(this.selectedSuperClass)
          ) {
            this.selectedSuperClassRefFile = this.$store.state.currentFile.fileName
            // this.selectedSuperClassRefFile = miscUtilities.getRefFileContext(
            //   this.$store.state.currentFile.file[this.$store.state.isSelected][
            //     "allOf"
            //   ][i]["$ref"]
            // );
          }
        }
      }
    },
    removeSuperClass() {
      this.$store.commit("removeSuperClass", this.selectedSuperClass);
      this.selectedSuperClass = "";
    },
    goPreviousView() {
      this.$store.state.activeEditingView = "EditDefinitionFormDisabled";
    }
  },
  computed: {
    superClassList() {
      let superClassList = [];
      if (this.$store.state.isSelected) {
        for (let i in this.$store.state.currentFile.file[
          this.$store.state.isSelected
        ]["allOf"]) {
          if (
            this.$store.state.currentFile.file[this.$store.state.isSelected][
              "allOf"
            ][i]["$ref"]
          ) {
            superClassList.push(
              this.$store.state.currentFile.file[this.$store.state.isSelected][
                "allOf"
              ][i]["$ref"].slice(
                this.$store.state.currentFile.file[
                  this.$store.state.isSelected
                ]["allOf"][i]["$ref"].lastIndexOf("/") + 1
              )
            );
          }
        }

        if (superClassList.length == 0) {
          this.emptySuperClassList = true;
        } else {
          this.emptySuperClassList = false;
        }

        return superClassList.sort();
      }
    },
    defnDetails() {
      return miscUtilities.defnDetails({
        defnName: this.selectedSuperClass,
        fileName: this.selectedSuperClassRefFile,
        state: this.$store.state });
    }
  }
};
</script>

<style>
.superclass-list {
  height: 250px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid black;
  margin-bottom: 4px;
}

.superclass-in-list {
  list-style: none;
  border-bottom: 1px solid black;
}

.selected-superclass {
  background-color: #89cff0;
}

.submit-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.remove-superclass-container {
  padding-left: 15px;
  padding-right: 15px;
}
</style>
