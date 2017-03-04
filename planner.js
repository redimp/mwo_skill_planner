"use strict";

document.addEventListener("DOMContentLoaded", function() {

  let maxSkillNodes = 91;

  let SkillTree = (function() {

    var activeTreeName = treeSource[0].name;
    let skillTrees = buildSkillTrees(treeSource);

    function buildSkillTrees(treeSource) {
      var skillTrees = [];
      for (let treeDef of treeSource) {
        var skillTree = {}
        skillTree.name = treeDef.name;
        skillTree.nodes = [];
        for (let nodeDef of treeDef.nodes) {
          skillTree.nodes.push(new Node(nodeDef.name,
                                        nodeDef.attribute,
                                        nodeDef.value,
                                        nodeNameToId(nodeDef.name),
                                        nodeDef.leftChildId,
                                        nodeDef.centerChildId,
                                        nodeDef.rightChildId
                              ));
        }
        skillTrees.push(skillTree);
      }
      return skillTrees;
    }

    function setActiveTreeName(newName) {
      activeTreeName = newName;
    }

    function getActiveTreeName() {
      return activeTreeName;
    }

    function getTrees() {
      return skillTrees;
    }

    function getTree(treeName) {
      if (treeName == undefined) {
        return getTree(activeTreeName);
      } else {
        for (let tree of skillTrees) {
          if (tree.name == treeName) {
            return tree;
          }
        }
      }
    }

    function getNode(nodeId) {
      for (let tree of skillTrees) {
        for (let node of tree.nodes) {
          if (node.id == nodeId) {
            return node;
          }
        }
      }
    }

    function toggleNodeSelection(node) {
      node.toggleSelection();
    }

    function getNodeCount(treeName) {
      var nodeCount = 0;
      if (treeName != undefined) {
        return getTree(treeName).nodes.length;
      } else {
        for (let tree of skillTrees) {
          nodeCount = getNodeCount(tree.name);
        }
      }
      return nodeCount;
    }

    function nodesSelected(treeName) {
      var selectedCount = 0;
      if (treeName != undefined) {
        for (let node of getTree(treeName).nodes) {
          if (node.selected) {
            selectedCount++;
          }
        }
      } else {
        for (let skillTree of skillTrees) {
          selectedCount = selectedCount + nodesSelected(skillTree.name);
        }
      }
      return selectedCount;
    }

    function childrenOf(node) {
      var childNodes = [];
      pushIfDefined(childNodes, getNode(node.leftChildId));
      pushIfDefined(childNodes, getNode(node.centerChildId));
      pushIfDefined(childNodes, getNode(node.rightChildId));
      return childNodes;
    }

    function parentsOf(node) {
      var parentNodes = [];
      for (let tree of skillTrees) {
        for (let potentialParent of tree.nodes) {
          if (potentialParent.leftChildId == node.id || potentialParent.centerChildId == node.id || potentialParent.rightChildId == node.id) {
            parentNodes.push(potentialParent);
          }
        }
      }
      return parentNodes;
    }

    function pushIfDefined(collection, node) {
      if (node !== undefined) {
        collection.push(node);
      }
    }

    // public interface
    return {
      getActiveTreeName: getActiveTreeName,
      setActiveTreeName: setActiveTreeName,
      getTrees: getTrees,
      getNode: getNode,
      getNodeCount: getNodeCount,
      nodesSelected: nodesSelected,
      parentsOf: parentsOf,
      childrenOf: childrenOf
    }

  })();

  function Node(newName, newAttribute, newAttributeValue, newId, newLeftChildId, newCenterChildId, newRightCenterChildId) {
    var selected = false;

    this.name = newName;
    this.attribute = newAttribute;
    this.attributeValue = newAttributeValue;
    this.id = newId;

    this.leftChildId = newLeftChildId,
    this.centerChildId = newCenterChildId,
    this.rightChildId = newRightCenterChildId,
    this.parents = function() {
      return SkillTree.parentsOf(this);
    };
    this.children = function() {
      return SkillTree.childrenOf(this);
    };

    this.selected = selected;
    this.toggleSelection = function() {
      nodeSelectionChanged(this);
    };

  }

  function buildUI(trees) {
    trees.forEach(function(tree, index) {
      buildTab(tree, index);
      buildTreeDisplay(tree);
    });
    updateNodeCounters();
    document.getElementById('node-total').textContent = maxSkillNodes;
    document.getElementById(trees[0].name.toLowerCase() + '-tab').click();
  }

  buildUI(SkillTree.getTrees());

  function buildTab(tree, index) {
    let topOffset = 50;
    let tabElement = document.createElement("div");
    tabElement.id = tree.name.toLowerCase() + '-tab';
    tabElement.classList.add("tab");
    tabElement.style.top = (40 * index) + 50 + "px";
    tabElement.style.left = 0;
    tabElement.textContent = tree.name;

    let counterElement = document.createElement("div");
    counterElement.id = tree.name.toLowerCase() + '-tab-counter';
    counterElement.classList.add("tab-counter");
    counterElement.textContent = '0 / ' + SkillTree.getNodeCount(tree.name);
    tabElement.appendChild(counterElement);

    tabElement.addEventListener("click", function() {
      document.querySelectorAll('.tab').forEach(function (el) {
        el.classList.remove('selected');
      });
      tabElement.classList.add('selected');
      changeSkillTree(tree.name);
    });
    document.getElementById("left-sidebar").appendChild(tabElement);
  }

  function buildTreeDisplay(tree) {
    let treeElement = document.createElement("div");
    treeElement.id = treeNameToId(tree.name);
    treeElement.classList.add('skill-tree');
    treeElement.classList.add('hide');
    document.getElementById("graph-view").appendChild(treeElement);

    // need to do something here to sort the node array.  Probably search it each time you add a node
    // and add the children of that node to a queue to be the next loaded

    let xOffset = 55;
    let yOffset = 30;
    var leftmostNodeElement = 0;
    var rightmostNodeElement = 0;

    for (let node of tree.nodes) {
      let nodeElement = document.createElement("div");
      nodeElement.classList.add("graph-node");
      nodeElement.id = node.id;
      nodeElement.textContent = node.name;

      // the first element in nodes is the root node, so it starts available
      if (node == tree.nodes[0])
        nodeElement.classList.add("available");
      else {
        nodeElement.classList.add("unavailable");
      }

      let parent = node.parents()[0];
      if (parent != undefined) {
        let relativeChildPostiion = getRelativeChildPosition(parent, node.id);
        let parentElement = document.getElementById(parent.id);
        let parentTop = dimensionAsNumber(parentElement.style.top);
        let parentLeft = dimensionAsNumber(parentElement.style.left);
        if (relativeChildPostiion == 'left') {
          nodeElement.style.top = parentTop + yOffset + 'px';
          nodeElement.style.left = parentLeft - xOffset + 'px';
        } else if (relativeChildPostiion == 'right') {
          nodeElement.style.top = parentTop + yOffset + 'px';
          nodeElement.style.left = parentLeft + xOffset + 'px';
        } else {
          nodeElement.style.top = parentTop + (yOffset * 2) + 'px';
          nodeElement.style.left = parentLeft + 'px';
        }
      } else {
        nodeElement.style.top = '25px';
        nodeElement.style.left = '26px';
      }

      let leftPosition = dimensionAsNumber(nodeElement.style.left);
      if (leftPosition < leftmostNodeElement) {
        leftmostNodeElement = leftPosition;
      }
      if (leftPosition > rightmostNodeElement) {
        rightmostNodeElement = leftPosition;
      }

      treeElement.appendChild(nodeElement);
      nodeElement.addEventListener("click", function() {
        nodeSelectionChanged(node);
      });
    }

    let nodeWidth = 52; // width of a graph node, per planner.css
    let padding = 25; // 'padding' here rather than in css because 'absolute' positioning of the
                      // node elements throws off alignment of css padding
    treeElement.style.width = rightmostNodeElement - leftmostNodeElement + nodeWidth + (padding * 2) + 'px';
    document.getElementById(treeNameToId(tree.name)).querySelectorAll('.graph-node').forEach(function (el) {
      let newLeft = dimensionAsNumber(el.style.left) + (-leftmostNodeElement) + padding + 'px';
      el.style.left = newLeft;
    });

  }

  function getRelativeChildPosition(parent, childId) {
    if (parent.leftChildId == childId) {
      return 'left';
    } else if (parent.centerChildId == childId) {
      return 'center';
    } else if (parent.rightChildId == childId) {
      return 'right';
    }
    return 'child not found'
  }

  function nodeSelectionChanged(node) {
    if (node.selected) {
      if (safeToDeselect(node)) {
        node.selected = false;
        if (nodeAvailableForSelection(node)) {
          setNodeColorBasedOnSelectionStatus(node, "available");
        } else {
          setNodeColorBasedOnSelectionStatus(node, "unavailable");
        }
      }
    } else {
      if (nodeAvailableForSelection(node) && (SkillTree.nodesSelected() < maxSkillNodes)) {
        node.selected = true;
        setNodeColorBasedOnSelectionStatus(node, "selected");
      }
    }
    // update children
    for (let child of node.children()) {
      if (child.selected) {
        setNodeColorBasedOnSelectionStatus(child, "selected");
      } else if (nodeAvailableForSelection(child)) {
        setNodeColorBasedOnSelectionStatus(child, "available");
      } else {
        setNodeColorBasedOnSelectionStatus(child, "unavailable");
      }
    }
    updateNodeCounters();
  }

  function nodeAvailableForSelection(node) {
    var parentIsSelected = false;
    for (let parent of node.parents()) {
      parentIsSelected = parent.selected || parentIsSelected;
    }
    parentIsSelected = parentIsSelected || (node.parents().length === 0);
    return parentIsSelected;
  }

  function safeToDeselect(node) {
    var safeToDeselect = true;
    for (let child of node.children()) {
      if (child.selected) {
        // Set node in question to deselected to see if the chlid is still elegible for selection
        // based on other parents.  We"ll set it back to selected after we"re done with that check.
        node.selected = false;
        safeToDeselect = nodeAvailableForSelection(child) && safeToDeselect;
        node.selected = true;
      }
    }
    return safeToDeselect;
  }

  function setNodeColorBasedOnSelectionStatus(node, selectionStatus) {
    let nodeElement = document.getElementById(node.id);
    removeNodeClasses(nodeElement);
    nodeElement.classList.add(selectionStatus);
  }

  function updateNodeCounters() {
    document.getElementById('node-selection-counter').textContent = SkillTree.nodesSelected();
    let activeTree = SkillTree.getActiveTreeName();
    let activeTabCounter = document.getElementById(activeTree.toLowerCase() + '-tab-counter');
    let nodesSelected = SkillTree.nodesSelected(activeTree);
    let nodesTotal = SkillTree.getNodeCount(activeTree);
    activeTabCounter.textContent = nodesSelected + ' / ' + nodesTotal;
  }

  function changeSkillTree(treeName) {
    SkillTree.setActiveTreeName(treeName);
    document.querySelectorAll('.skill-tree').forEach(function (el) {
      el.classList.add('hide');
    });
    document.getElementById(treeNameToId(treeName)).classList.remove('hide');
  }

  function treeNameToId(treeName) {
    return treeName.replace(/ /g, "_").toLowerCase() + '-skill-tree';
  }

  // strips the 'px' off the end of a CSS dimension, returns the number value
  function dimensionAsNumber(dimension) {
    return parseInt(dimension.slice(0, -2));
  }

  function removeNodeClasses(nodeElement) {
    nodeElement.classList.remove("selected");
    nodeElement.classList.remove("available");
    nodeElement.classList.remove("unavailable");
  }

  function nodeNameToId(nodeName) {
    return nodeName.replace(/ /g, "-").toLowerCase();
  }

});
