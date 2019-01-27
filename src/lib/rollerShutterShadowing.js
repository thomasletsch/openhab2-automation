'use strict';

se.importPreset("RuleSupport");
se.importPreset("RuleSimple");
se.importPreset("RuleFactories");

var mainPath = '/etc/openhab2/automation/jsr223/';

load(mainPath + 'jslib/helper.js');
load(mainPath + 'jslib/JSRule.js');
load(mainPath + 'jslib/triggersAndConditions.js');

var LocalTime = Java.type("org.joda.time.LocalTime");
var SwitchItem = Java.type("org.eclipse.smarthome.core.library.items.SwitchItem");
var GroupItem = Java.type("org.eclipse.smarthome.core.items.GroupItem");

logger.info("Loading rollerShutterShadowing library");

var sunRiseItemName = "LocalSun_Rise_StartTime";
var sunSetItemName = "LocalSun_Set_StartTime";
var automationGroupName = "AutomationSwitches";

var start0DegreeSouth = new LocalTime(9, 0);  // 9:00 in the morning
var start90DegreeSouth = new LocalTime(12, 0);  // 12:00 mid day
var end0DegreeSouth = new LocalTime(15, 0);
var end90DegreeSouth = new LocalTime(19, 0);

if (getItem(automationGroupName) === null) {
    logger.info(automationGroupName + " group does not exist - creating it.");
    var automationGroup = new GroupItem(automationGroupName);
    automationGroup.setLabel("Group for automation switches.");
    automationGroup.setLabel("Group for automation switches.");
    ir.add(automationGroup);
}

var createRollerShutterShadowing = function (rollerShutterItemName, temperatureItemName, temperatureThreshold, shadowedItemState) {
    logger.info("Creating roller shutter shadowing rule for " + rollerShutterItemName +
        " for shadowing when temperature of " + temperatureItemName + " is higher than " + temperatureThreshold);
    var automationSwitchItemName = getOrCreateAutomationSwitchItem(rollerShutterItemName);

    createAutomationCheckRule(rollerShutterItemName, automationSwitchItemName);

    JSRule({
        uid: "RollerShutterShadowingRule_" + rollerShutterItemName,
        name: "RollerShutterShadowingRule_" + rollerShutterItemName,
        description: "Control the shadowing of roller shutter " + rollerShutterItemName +
        " for shadowing when temperature of " + temperatureItemName + " is higher than " + temperatureThreshold,
        execute: function (module, input) {
            logger.info("RollerShutterShadowRule: input " + input + " module " + module);

            if (ir.getItem(automationSwitchItemName).state === new OnOffType("OFF")) {
                logger.info("Automation turned off!");
                return;
            }

            var data = getTriggeredData(input);
            var rollerShutterItem = ir.getItem(rollerShutterItemName);

            logger.debug("Now: " + now);
            var sunRiseItem = ir.getItem(sunRiseItemName);
            logger.debug("Sun rise: " + sunRiseItem.state);
            var sunRiseTime = new Date(sunRiseItem.state);
            logger.debug("Sun rise date: " + sunRiseTime);

            var sunSetItem = ir.getItem(sunSetItemName);
            logger.debug("Sun set: " + sunSetItem.state);
            var sunSetTime = new Date(sunSetItem.state);
            logger.debug("Sun set date: " + sunSetTime);
            var newTemperature = data.receivedState;

            if (now < sunRiseTime) {
                logger.info("Before sun rise");
                return;
            }

            if (now > sunSetTime) {
                logger.info("After sun set");
                return;
            }

            if (rollerShutterItem.state.intValue() === shadowedItemState) {
                logger.info("Already shadowed");
                return;
            }

            if (newTemperature <= temperatureThreshold) {
                logger.info("Temperature under or equal to threshold");
                return;
            }

            logger.info(rollerShutterItem);
            if (newTemperature > temperatureThreshold) {
                logger.info("Sending shadow update to item " + rollerShutterItemName + "... ");
                sendCommand(rollerShutterItem, shadowedItemState);
                disableAutomationCheck(rollerShutterItemName);
                setTimeout(function () {
                    enableAutomationCheck(rollerShutterItemName);
                }, 60000);
            }
        },
        triggers: [
            new ItemStateUpdateTrigger(temperatureItemName, null, "Updated" + temperatureItemName)
        ]
    });
};

function enableAutomationCheck(rollerShutterItemName) {
    var uid = "RollerShutterAutomationStopRule_" + rollerShutterItemName;
    rules.setEnabled(uid, true);
}

function disableAutomationCheck(rollerShutterItemName) {
    var uid = "RollerShutterAutomationStopRule_" + rollerShutterItemName;
    rules.setEnabled(uid, false);
}

function createAutomationCheckRule(rollerShutterItemName, automationSwitchItemName) {
    JSRule({
        uid: "RollerShutterAutomationStopRule_" + rollerShutterItemName,
        name: "RollerShutterAutomationStopRule_" + rollerShutterItemName,
        description: "Stops the automation rules of roller shutter " + rollerShutterItemName,
        execute: function (module, input) {
            logger.info("RollerShutterAutomationStopRule: input " + input + " module " + module);

            if (getItem(automationSwitchItemName).state === new OnOffType("OFF")) {
                logger.info("Automation already turned off!");
                return;
            }

            logger.info("Sending automation OFF to item " + automationSwitchItemName + "... ");
            sendCommand(getItem(automationSwitchItemName), "OFF");
        },
        triggers: [
            new ItemStateUpdateTrigger(rollerShutterItemName, null, "Updated" + rollerShutterItemName)
        ]
    });
}

function getOrCreateAutomationSwitchItem(rollerShutterItemName) {
    var automationSwitchItemName = rollerShutterItemName + "_Automation";
    if (getItem(automationSwitchItemName) === null) {
        logger.info(automationSwitchItemName + " does not exist - creating it.");
        logger.info("You can use the " + automationSwitchItemName + " item to enable / disable automation support on item " + rollerShutterItemName);
        var automationSwitchItem = new SwitchItem(automationSwitchItemName);
        automationSwitchItem.setLabel("Automation Switch for item " + rollerShutterItemName);
        automationSwitchItem.setCategory("AutomationSwitch");
        automationSwitchItem.addGroupName(automationGroupName);
        ir.add(automationSwitchItem);
        postUpdate(automationSwitchItem, "ON");
    }
    return automationSwitchItemName;
}
