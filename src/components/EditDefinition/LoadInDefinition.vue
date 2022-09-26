<template>
  <div id="load-in-defn-edit-view-container">
    <div id="load-in-defn-container">
      <div>Select document:</div>
      <b-form-select
        v-model="selectedFile"
        :options="getLoadedFiles"
        :select-size="4"
        id="select-form-files"
      ></b-form-select>
      <b-form-group
        id="node-selector-input-label"
        label="Search for definition:"
        label-for="node-selector-input"
      >
        <b-form-input
          v-model="searchTerm"
          placeholder="Search for definition... (wildcard: *)"
        ></b-form-input>
      </b-form-group>
      <div>Select definition to load in:</div>
      <div id="load-in-defn-file-defns-container">
        <span v-if="selectedFile">
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
        id="loadInDefnDetailsTable"
        ref="loadInDefnDetailTable"
        v-if="selectedDefnName"
      ></b-table>
    </div>
    <div id="load-in-defn-footer">
      <span id="edit-form-buttons">
        <b-button
          @click="loadInDefinition"
          :disabled="!selectedDefnName"
          size="sm"
          variant="primary"
          >{{ loadInText }}</b-button
        >
        <b-button @click="exitView" size="sm">Back</b-button>
      </span>
      <span id="load-in-alert-container">
        <b-alert
          id="load-in-success-alert"
          v-model="dismissCountDown"
          dismissible
          fade
          variant="success"
        >
          Success
        </b-alert>
      </span>
    </div>

  </div>
</template>

<script>
import * as miscUtilities from "../../utils/miscUtilities";

export default {
  data() {
    return {
      selectedFile: null,
      selectedDefnIndex: null,
      selectedDefnName: null,
      searchTerm: "",
      dismissCountDown: 0,
      dismissSecs: 2,
      loadInText: "Load In"
    };
  },
  methods: {
    exitView() {
      this.$store.commit("showView", { viewType: "Editor", viewName: null });
    },
    selectDefn(index, name) {
      this.selectedDefnIndex = index;
      this.selectedDefnName = name;
    },
    loadInDefinition() {
      this.$store.commit({
        type: "loadInDefinition",
        defnFile: this.selectedFile,
        defnName: this.selectedDefnName
      })
      this.loadInText = 'Load in another'
      this.showAlert()
    },
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown
    },
    showAlert() {
      this.dismissCountDown = this.dismissSecs
    }    
  },
  computed: {
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
    fileElements() {
      let fileElements = Object.keys(
        this.$store.state.loadedFiles[this.selectedFile]["file"]
      );

      return fileElements
        .filter(node => {
          return miscUtilities.wildcardSearch(node.toLowerCase(), this.searchTerm.toLowerCase());
        })
        .sort();
    },
    defnDetails() {
      return miscUtilities.defnDetails({
        defnName: this.selectedDefnName,
        fileName: this.selectedFile,
        state: this.$store.state });
    }
  },
  watch: {
    "$store.state.showLoadInDefinitionForm"() {
      this.selectedFile = null;
      this.selectedDefnIndex = null;
      this.selectedDefnName = null;
    },
    selectedFile() {
      this.searchTerm = "";
      this.selectedDefnIndex = null;
      this.selectedDefnName = null;
    }
  }
};
</script>

<style>
#load-in-defn-edit-view-container {
  display: grid;
  height: 100%;
  grid-template-rows: 1fr 50px;
}

#load-in-defn-container {
  padding-top: 9px;
  overflow-y: auto;
  grid-row: 1 / 2;
  padding-left: 15px;
  padding-right: 15px;
}

#load-in-defn-file-defns-container {
  height: 250px;
  overflow-y: auto;
  background-color: white;
  border-top: 1px solid black;
  border-left: 1px solid black;
  border-right: 1px solid black;
  margin-bottom: 4px;
}

#defn-from-file {
  list-style: none;
  border-bottom: 1px solid black;
}

#select-form-files {
  margin-bottom: 10px;
}

#load-in-defn-footer {
  grid-row: 2 / 3;
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr;
  border: #d3d3d3 solid 1px;
}

#edit-form-buttons {
  grid-column: 2 / 3;
  display: flex;
  justify-content: center;
  align-items: center;
}

#load-in-alert-container {
  grid-column: 3 / 4;
  display: flex;
  justify-content: center
}

#load-in-success-alert {
  max-height: 40px;
}
</style>
