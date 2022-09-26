<template>
    <div id="item-types-container">
        <component :is="$store.state.activeItemTypesView"></component>
        <div id="edit-item-types-main-container" v-if="!$store.state.activeItemTypesView">
            <div id="edit-item-types-btn-grp">
              <h3>Item Types</h3>
                <b-button @click="viewViewAllItemTypes" size="sm">View All Item Types</b-button>
                <b-button @click="viewEditItemType" size="sm">Edit Item Types</b-button>
              <h3>Item Type Groups</h3>
                <b-button @click="viewViewAllItemTypeGroups" size="sm">View All Item Type Groups</b-button>
                <b-button @click="viewCreateItemTypeGroup" size="sm">Create Item Type Group</b-button>
                <b-button @click="viewEditItemTypeGroup" size="sm">Edit Item Type Group</b-button>
                <b-button @click="viewDeleteItemTypeGroup" size="sm">Delete Item Type Group</b-button>
                <b-button variant="danger" @click="exitView" size="sm">Back</b-button>
            </div>
        </div>
    </div>
</template>

<script>
import CreateItemTypeGroup from "@/components/ItemTypes/CreateItemTypeGroup"
import EditItemType from "@/components/ItemTypes/EditItemType"
import EditItemTypeGroup from "@/components/ItemTypes/EditItemTypeGroup"
import ViewAllItemTypes from "@/components/ItemTypes/ViewAllItemTypes"
import ViewAllItemTypeGroups from "@/components/ItemTypes/ViewAllItemTypeGroups"
import DeleteItemTypeGroup from "@/components/ItemTypes/DeleteItemTypeGroup"

export default {
  components: {
    CreateItemTypeGroup,
    EditItemType,
    EditItemTypeGroup,
    ViewAllItemTypes,
    ViewAllItemTypeGroups,
    DeleteItemTypeGroup
  },
  data() {
    return {
    }
  },
  methods: {
    exitView() {
      this.$store.commit("showView", { viewType: "Editor", viewName: null });
    },
    viewViewAllItemTypes() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: "ViewAllItemTypes" });
    },
    viewViewAllItemTypeGroups() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: "ViewAllItemTypeGroups" });
    },
    viewCreateItemTypeGroup() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: "CreateItemTypeGroup" });
    },
    viewEditItemType() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: "EditItemType" });
    },
    viewEditItemTypeGroup() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: "EditItemTypeGroup" });
    },
    viewDeleteItemTypeGroup() {
      this.$store.commit("showView", { viewType: "ItemType", viewName: "DeleteItemTypeGroup" });
    }
  },
  beforeDestroy() {
    this.$store.commit("showView", { viewType: "ItemType", viewName: null });
  }
}
</script>

<style>
#edit-item-types-main-container {
    display: flex;
    justify-content: center;
}

#edit-item-types-main-container .btn {
    margin-bottom: 25px;
}

#edit-item-types-btn-grp {
    display: flex;
    flex-direction: column;
    height: 100%;
}

#item-types-container {
    padding: 7px 15px 7px 15px;
}
</style>
