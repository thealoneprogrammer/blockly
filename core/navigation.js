/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2019 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('Blockly.Navigation');

/**
 * The cursor for keyboard navigation.
 * @type Blockly.Cursor
 * @private
 */
Blockly.Navigation.cursor_ = null;

/**
 * The current selected category if the toolbox is open or
 * last selected category if focus is on a different element.
 * @type ?Blockly.Toolbox.TreeNode
 * @private
 */
Blockly.Navigation.currentCategory_ = null;

/**
 * The current selected block in the flyout.
 * @type ?Blockly.Block
 * @private
 */
Blockly.Navigation.flyoutBlock_ = null;

/**
 * The selected connection used for inserting a block.
 * @type ?Blockly.Connection
 * @private
 */
Blockly.Navigation.insertionConnection_ = null;

/**
 * State indicating focus is currently on the flyout.
 */
Blockly.Navigation.STATE_FLYOUT = 1;

/**
 * State indicating focus is currently on the workspace.
 */
Blockly.Navigation.STATE_WS = 2;

/**
 * State indicating focus is currently on the toolbox.
 */
Blockly.Navigation.STATE_TOOLBOX = 3;

/**
 * The current state the user is in.
 * @private
 */
Blockly.Navigation.currentState_ = null;

/************************/
/** Toolbox Navigation **/
/************************/

/**
 * Set the state to the toolbox state and the current category as the first
 * category.
 */
Blockly.Navigation.focusToolbox = function() {
  Blockly.Navigation.resetFlyout();
  Blockly.Navigation.currentState_ = Blockly.Navigation.STATE_TOOLBOX;
  var workspace = Blockly.getMainWorkspace();
  var toolbox = workspace.getToolbox();
  if (workspace && !Blockly.Navigation.currentCategory_) {
    Blockly.Navigation.currentCategory_ = toolbox.tree_.firstChild_;
  }
  toolbox.tree_.setSelectedItem(Blockly.Navigation.currentCategory_);
};

/**
 * Select the next category.
 * Taken from closure/goog/ui/tree/basenode.js
 */
Blockly.Navigation.nextCategory = function() {
  if (!Blockly.Navigation.currentCategory_) {return;}
  var curCategory = Blockly.Navigation.currentCategory_;
  var nextNode = curCategory.getNextShownNode();

  if (nextNode) {
    nextNode.select();
    Blockly.Navigation.currentCategory_ = nextNode;
  }
};

/**
 * Select the previous category.
 * Taken from closure/goog/ui/tree/basenode.js
 */
Blockly.Navigation.previousCategory = function() {
  if (!Blockly.Navigation.currentCategory_) {return;}
  var curCategory = Blockly.Navigation.currentCategory_;
  var previousNode = curCategory.getPreviousShownNode();

  if (previousNode) {
    previousNode.select();
    Blockly.Navigation.currentCategory_ = previousNode;
  }
};

/**
 * Go to child category if there is a nested category.
 * Taken from closure/goog/ui/tree/basenode.js
 */
Blockly.Navigation.inCategory = function() {
  if (!Blockly.Navigation.currentCategory_) {return;}
  var curCategory = Blockly.Navigation.currentCategory_;

  if (curCategory.hasChildren()) {
    if (!curCategory.getExpanded()) {
      curCategory.setExpanded(true);
    } else {
      curCategory.getFirstChild().select();
      Blockly.Navigation.currentCategory_ = curCategory.getFirstChild();
    }
  } else {
    Blockly.Navigation.focusFlyout();
  }
};

/**
 * Go to parent category if we are in a child category.
 * Taken from closure/goog/ui/tree/basenode.js
 */
Blockly.Navigation.outCategory = function() {
  if (!Blockly.Navigation.currentCategory_) {return;}
  var curCategory = Blockly.Navigation.currentCategory_;

  if (curCategory.hasChildren() && curCategory.getExpanded() && curCategory.isUserCollapsible_) {
    curCategory.setExpanded(false);
  } else {
    var parent = curCategory.getParent();
    var tree = curCategory.getTree();
    if (parent && (tree.getShowRootNode() || parent != tree)) {
      parent.select();
      Blockly.Navigation.currentCategory_ = parent;
    }
  }
};

/***********************/
/** Flyout Navigation **/
/***********************/

/**
 * Change focus to the flyout.
 */
Blockly.Navigation.focusFlyout = function() {
  Blockly.Navigation.currentState_ = Blockly.Navigation.STATE_FLYOUT;
  var workspace = Blockly.getMainWorkspace();
  var toolbox = workspace.getToolbox();
  var cursor = Blockly.Navigation.cursor_;
  var topBlock;
  if (toolbox.flyout_ && toolbox.flyout_.getWorkspace()) {
    var topBlocks = toolbox.flyout_.getWorkspace().getTopBlocks();
    if (topBlocks.length > 0) {
      topBlock = topBlocks[0];
      Blockly.Navigation.flyoutBlock_ = topBlock;
      cursor.setLocation(Blockly.Navigation.flyoutBlock_);
    }
  }
};

/**
 * Select the next block in the flyout.
 */
Blockly.Navigation.selectNextBlockInFlyout = function() {
  if (!Blockly.Navigation.flyoutBlock_){return;}
  var blocks = Blockly.Navigation.getFlyoutBlocks_();
  var curBlock = Blockly.Navigation.flyoutBlock_;
  var curIdx = blocks.indexOf(curBlock);
  var cursor = Blockly.Navigation.cursor_;
  var nextBlock;

  if (curIdx > -1 && blocks[++curIdx]) {
    nextBlock = blocks[curIdx];
  }

  if (nextBlock) {
    Blockly.Navigation.flyoutBlock_ = nextBlock;
    cursor.setLocation(Blockly.Navigation.flyoutBlock_);
  }
};

/**
 * Select the previous block in the flyout.
 */
Blockly.Navigation.selectPreviousBlockInFlyout = function() {
  if (!Blockly.Navigation.flyoutBlock_) {return;}
  var blocks = Blockly.Navigation.getFlyoutBlocks_();
  var curBlock = Blockly.Navigation.flyoutBlock_;
  var curIdx = blocks.indexOf(curBlock);
  var cursor = Blockly.Navigation.cursor_;
  var prevBlock;

  if (curIdx > -1 && blocks[--curIdx]) {
    prevBlock = blocks[curIdx];
  }

  if (prevBlock) {
    Blockly.Navigation.flyoutBlock_ = prevBlock;
    cursor.setLocation(Blockly.Navigation.flyoutBlock_);
  }
};

/**
 * Get a list of all blocks in the flyout.
 * @return {!Array<Blockly.BlockSvg>} List of blocks in the flyout.
 */
Blockly.Navigation.getFlyoutBlocks_ = function() {
  var workspace = Blockly.getMainWorkspace();
  var toolbox = workspace.getToolbox();
  var topBlocks = [];
  if (toolbox.flyout_ && toolbox.flyout_.getWorkspace()) {
    topBlocks = toolbox.flyout_.getWorkspace().getTopBlocks();
  }
  return topBlocks;
};

/**
 * If there is a marked connection try connecting the block from the flyout to
 * that connection. If no connection has been marked then inserting will place
 * it on the workspace.
 */
Blockly.Navigation.insertFromFlyout = function() {
  var cursor = Blockly.Navigation.cursor_;
  var flyoutBlock = Blockly.Navigation.flyoutBlock_;
  var connection = Blockly.Navigation.insertionConnection_;
  var workspace = Blockly.getMainWorkspace();
  var toolbox = workspace.getToolbox();
  var flyout = toolbox.flyout_;

  if (flyout && flyout.isVisible()) {
    var newBlock = flyout.createBlock(flyoutBlock);
    Blockly.Navigation.insertBlock(newBlock, connection);
    Blockly.Navigation.focusWorkspace();
    var previousConnection = newBlock.previousConnection;
    var outputConnection = newBlock.outputConnection;
    var connection = previousConnection ? previousConnection : outputConnection;
    //TODO: This will have to be fixed when we add in a block that does not have
    //a previous or output connection
    cursor.setLocation(connection);
  }
};

/**
 * Reset flyout information.
 */
Blockly.Navigation.resetFlyout = function() {
  var cursor = Blockly.Navigation.cursor_;
  Blockly.Navigation.flyoutBlock_ = null;
  cursor.hide();
};

/************/
/** Modify **/
/************/

/**
 * Finds the best connection.
 * @param {!Blockly.Block} block The block to be connected.
 * @param {!Blockly.Connection} connection The connection to connect to.
 * @return {Blockly.Connection} blockConnection The best connection we can
 * determine for the block.
 */
Blockly.Navigation.findBestConnection = function(block, connection) {
  var blockConnection;
  if (!block || !connection) {return;}
  if (connection.type === Blockly.PREVIOUS_STATEMENT) {
    blockConnection = block.nextConnection;
  } else if (connection.type === Blockly.NEXT_STATEMENT) {
    blockConnection = block.previousConnection;
  } else if (connection.type === Blockly.INPUT_VALUE) {
    blockConnection = block.outputConnection;
  } else if (connection.type === Blockly.OUTPUT_VALUE) {
    //select the first input that has a connection
    for (var i = 0; i < block.inputList.length; i++) {
      var connection = block.inputList[i].connection;
      if (connection.type === Blockly.INPUT_VALUE) {
        blockConnection = connection;
        break;
      }
    }
  }
  return blockConnection;
};

/**
 * Finds the best connection on a block and connects it to the given connection.
 * @param {!Blockly.Block} block The selected blcok.
 * @param {!Blockly.Connection} connection The connection on the workspace.
 */
Blockly.Navigation.insertBlock = function(block, connection) {
  var bestConnection = Blockly.Navigation.findBestConnection(block, connection);

  if (bestConnection) {
    try {
      if (connection.type == Blockly.PREVIOUS_STATEMENT
        && connection.targetBlock()) {
        var previousBlock = connection.targetBlock();
        block.previousConnection.connect(previousBlock.nextConnection);
      }
      connection.connect(bestConnection);
    }
    catch (Error) {
      console.warn('The connection block is not the right type');
    }
  }
};

/**
 * Tries to connect the current location of the cursor and the insertion
 * connection.
 */
Blockly.Navigation.insertBlockFromWs = function() {
  var targetConnection = Blockly.Navigation.insertionConnection_;
  var sourceConnection = Blockly.Navigation.cursor_.getLocation();
  try {
    sourceConnection.connect(targetConnection);
  } catch (Error) {
    console.warn('The connection block is not the right type');
  }
};

/*************************/
/** Keyboard Navigation **/
/*************************/

/**
 * Sets the cursor to the previous or output connection of the selected block
 * on the workspace.
 */
Blockly.Navigation.focusWorkspace = function() {
  var cursor = Blockly.Navigation.cursor_;
  Blockly.Navigation.resetFlyout();
  Blockly.Navigation.currentState_ = Blockly.Navigation.STATE_WS;
  Blockly.keyboardAccessibilityMode_ = true;
  if (Blockly.selected) {
    var previousConnection = Blockly.selected.previousConnection;
    var outputConnection = Blockly.selected.outputConnection;
    //TODO: This still needs to work with blocks that have neither previous
    //or output connection.
    var connection = previousConnection ? previousConnection : outputConnection;
    cursor.setLocation(connection);
  }
};

/**
 * Move the cursor to the next connection, field or block. This skips
 * connections of type next because previous and next connection look the same
 * when the cursor is going through a stack of blocks.
 */
Blockly.Navigation.keyboardNext = function() {
  var cursor = Blockly.Navigation.cursor_;
  cursor.next();
  if (cursor.getLocationType() === cursor.types.NEXT) {
    cursor.next();
  }
};

/**
 * Move the cursor down the AST.
 */
Blockly.Navigation.keyboardIn = function() {
  var cursor = Blockly.Navigation.cursor_;
  cursor.in();
  if (cursor.getLocationType() === cursor.types.OUTPUT) {
    cursor.next();
  }
};

/**
 * Move the cursor to the previous connection, field or block.
 */
Blockly.Navigation.keyboardPrev = function() {
  var cursor = Blockly.Navigation.cursor_;
  var location = cursor.prev();
  var locationType = cursor.getLocationType();
  if (location && locationType === cursor.types.NEXT) {
    cursor.prev();
  }
};

/**
 * Move the cursor up the AST.
 */
Blockly.Navigation.keyboardOut = function() {
  var cursor = Blockly.Navigation.cursor_;
  cursor.out();
};

/**
 * Mark the current location of the cursor.
 */
Blockly.Navigation.markConnection = function() {
  Blockly.Navigation.insertionConnection_ =
    Blockly.Navigation.cursor_.getLocation();
};

/**
 * Handles hitting the enter key on the workspace.
 */
Blockly.Navigation.handleEnterForWS = function() {
  var cursor = Blockly.Navigation.cursor_;
  var location = cursor.getLocation();
  if (cursor.getLocationType() === cursor.types.FIELD) {
    location.showEditor_();
  } else {
    Blockly.Navigation.markConnection();
  }
};

/**********************/
/** Helper Functions **/
/**********************/


/**
 * TODO: Revisit keycodes before releasing
 * Handler for all the keyboard navigation events.
 * @param {Event} e The keyboard event.
 */
Blockly.Navigation.navigate = function(e) {
  var curState = Blockly.Navigation.currentState_;
  if (e.keyCode === goog.events.KeyCodes.T) {
    Blockly.Navigation.focusToolbox();
    console.log('T: Focus Toolbox');
  } else if (curState === Blockly.Navigation.STATE_FLYOUT) {
    Blockly.Navigation.flyoutKeyHandler(e);
  } else if (curState === Blockly.Navigation.STATE_WS) {
    Blockly.Navigation.workspaceKeyHandler(e);
  } else if (curState === Blockly.Navigation.STATE_TOOLBOX) {
    Blockly.Navigation.toolboxKeyHandler(e);
  } else {
    console.log('we have a problem.');
  }
};

/**
 * Handles all keyboard events when the user is focused on the flyout.
 * @param {Event} e The keyboard event.
 */
Blockly.Navigation.flyoutKeyHandler = function(e) {
  if (e.keyCode === goog.events.KeyCodes.W) {
    Blockly.Navigation.selectPreviousBlockInFlyout();
    console.log('W: Flyout : Previous');
  } else if (e.keyCode === goog.events.KeyCodes.A) {
    Blockly.Navigation.focusToolbox();
    console.log('A: Flyout : Go To Toolbox');
  } else if (e.keyCode === goog.events.KeyCodes.S) {
    Blockly.Navigation.selectNextBlockInFlyout();
    console.log('S: Flyout : Next');
  } else if (e.keyCode === goog.events.KeyCodes.ENTER) {
    Blockly.Navigation.insertFromFlyout();
    console.log('Enter: Flyout : Select');
  }
};

/**
 * Handles all keyboard events when the user is focused on the toolbox.
 * @param {Event} e The keyboard event.
 */
Blockly.Navigation.toolboxKeyHandler = function(e) {
  if (e.keyCode === goog.events.KeyCodes.W) {
    Blockly.Navigation.previousCategory();
    console.log('W: Toolbox : Previous');
  } else if (e.keyCode === goog.events.KeyCodes.A) {
    Blockly.Navigation.outCategory();
    console.log('A: Toolbox : Out');
  } else if (e.keyCode === goog.events.KeyCodes.S) {
    Blockly.Navigation.nextCategory();
    console.log('S: Toolbox : Next');
  } else if (e.keyCode === goog.events.KeyCodes.D) {
    Blockly.Navigation.inCategory();
    console.log('D: Toolbox : Go to flyout');
  } else if (e.keyCode === goog.events.KeyCodes.ENTER) {
    //TODO: focus on flyout OR open if the category is nested
  }
};

/**
 * Handles all keyboard events when the user is focused on the workspace.
 * @param {Event} e The keyboard event.
 */
Blockly.Navigation.workspaceKeyHandler = function(e) {
  if (e.keyCode === goog.events.KeyCodes.W) {
    Blockly.Navigation.keyboardOut();
    console.log('W: Workspace : Out');
  } else if (e.keyCode === goog.events.KeyCodes.A) {
    Blockly.Navigation.keyboardPrev();
    console.log('S: Workspace : Previous');
  } else if (e.keyCode === goog.events.KeyCodes.S) {
    Blockly.Navigation.keyboardIn();
    console.log('S: Workspace : In');
  } else if (e.keyCode === goog.events.KeyCodes.D) {
    Blockly.Navigation.keyboardNext();
    console.log('S: Workspace : Next');
  } else if (e.keyCode === goog.events.KeyCodes.I) {
    Blockly.Navigation.insertBlockFromWs();
    console.log('I: Workspace : Insert/Connect Blocks');
  } else if (e.keyCode === goog.events.KeyCodes.ENTER) {
    Blockly.Navigation.handleEnterForWS();
    console.log('Enter: Workspace : Mark Connection');
  }
};

/**
 * Enable accessibility mode.
 */
Blockly.Navigation.enableKeyboardAccessibility = function() {
  Blockly.keyboardAccessibilityMode_ = true;
};

/**
 * Disable accessibility mode.
 */
Blockly.Navigation.disableKeyboardAccessibility = function() {
  Blockly.keyboardAccessibilityMode_ = false;
};