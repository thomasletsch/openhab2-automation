'use strict';

var mainPath = '/etc/openhab2/automation/jsr223/';

load(mainPath + 'jslib/helper.js');
load(mainPath + 'jslib/JSRule.js');
load(mainPath + 'jslib/triggersAndConditions.js');

logger.info("Loading rollerShutterControl library");

var createSwitchRollershutterControl = function (switchItemName, rollerShutterItemName, workingItemName) {
    logger.info("Creating roller shutter control rule for " + rollerShutterItemName + " with switch " + switchItemName + " and working " + workingItemName);
    JSRule({
        uid: "RollerShutterRule_" + switchItemName,
        name: "RollerShutterRule_" + switchItemName,
        description: "Control the roller shutter " + rollerShutterItemName + " with the rocket switch " + switchItemName,
        execute: function (module, input) {
            logger.info("RollerShutterRule::execute " + __LINE__ + " input " + input + " module " + module);
            var data = getTriggeredData(input);
            var event = data.receivedCommand;
            var item = ir.getItem(data.itemName);
            var working = false;
            if (workingItemName !== null && workingItemName !== undefined) {
                var workingItem = ir.getItem(workingItemName);
                if (!isUninitialized(workingItem)) {
                    working = (
                        (workingItem !== null) &&
                        !(workingItem.state instanceof UnDefType) &&
                        (workingItem.state.toString() === "ON"));
                }
            }
            logger.info(item);
            var command = String(data.receivedCommand);
            logger.info("command: \"" + command + "\"" + " type " + typeof data.receivedCommand);
            var resultingCommand = "OFF";
            if (working) {
                logger.info("Still working => stopping");
                resultingCommand = "STOP";
            } else if (command === "ON") {
                logger.info("sending DOWN");
                resultingCommand = "DOWN";
            } else if (command === "OFF") {
                logger.info("sending UP");
                resultingCommand = "UP";
            }
            logger.info("Sending command " + resultingCommand);
            sendCommand(ir.getItem(rollerShutterItemName), resultingCommand);
        },
        triggers: [
            new CommandEventTrigger(switchItemName, null, "Updated" + switchItemName)
        ]
    });
};
