'use strict';

se.importPreset("RuleSupport");
se.importPreset("RuleSimple");
se.importPreset("RuleFactories");

var OPENHAB_CONF = Java.type("java.lang.System").getenv("OPENHAB_CONF");

load(OPENHAB_CONF + '/automation/jsr223/jslib/helper.js');
load(OPENHAB_CONF + '/automation/jsr223/jslib/JSRule.js');
load(OPENHAB_CONF + '/automation/jsr223/jslib/triggersAndConditions.js');

var NumberItem = Java.type("org.eclipse.smarthome.core.library.items.NumberItem");
var GroupItem = Java.type("org.eclipse.smarthome.core.items.GroupItem");
var logger = Java.type("org.slf4j.LoggerFactory").getLogger("org.eclipse.smarthome.automation.module.script.rulesupport.internal.shared.SimpleRule");

logger.info("Starting rule HeatingRule");

var roomGroup = "Rooms";
var temperatureGroup = "Temperature";
var setpointGroup = "HeatingSetpoint";
var valveGroup = "HeatingValve";
var logGroup = "HeatingLog";

var createHeatingRule = function (roomConfig) {
    logger.debug('Room Config:' + JSON.stringify(currentRoomConfig));
    var roomName = roomConfig.roomItem.name;
    var temperatureItemName = roomConfig.temperatureItem.name;
    logger.info("Creating heating control rule for " + roomName +
        " with temperature " + temperatureItemName +
        " and set point " + roomConfig.setpointItem.name +
        " and valve " + roomConfig.valveItem.name);
    JSRule({
        uid: "HeatingRule_" + roomName,
        name: "HeatingRule_" + roomName,
        description: "Control the Heating in room " + roomName + " with the temperature sensor " + temperatureItemName,
        execute: function (module, input) {
            logger.debug("Executing HeatingRule");
            logger.debug("Get item " + roomConfig.temperatureItem.name);
            var temperatureItem = itemRegistry.getItem(roomConfig.temperatureItem.name);
            logger.debug("Temperature item " + temperatureItem);
            var newTemperature = temperatureItem.state;
            logger.debug("newTemperature: " + newTemperature);
            var setpointItem = itemRegistry.getItem(roomConfig.setpointItem.name);
            var setpointState = setpointItem.state;
            var valveItem = itemRegistry.getItem(roomConfig.valveItem.name);
            var valveState = false;
            if (!isUninitialized(valveItem)) {
                valveState = (
                    (valveItem !== null) &&
                    !(valveItem.state instanceof UnDefType) &&
                    (valveItem.state.toString() === "ON"));
            }
            logger.debug("Setpoint: " + setpointState);
            if (isUninitialized(roomConfig.setpointItem.name)) {
                logger.info("Setpoint for room " + roomName + " not defined => no heating!");
            } else if (newTemperature < setpointState && !valveState) {
                logger.info("Turning heating in room " + roomName + " ON");
                sendCommand(valveItem, "ON");
                postUpdate(itemRegistry.getItem(roomConfig.logItem.name), 1);
            } else if (newTemperature > setpointState && valveState) {
                logger.info("Turning heating in room " + roomName + " OFF");
                sendCommand(valveItem, "OFF");
                postUpdate(itemRegistry.getItem(roomConfig.logItem.name), 0);
            }
        },
        triggers: [
            new UpdatedEventTrigger(temperatureItemName, null, "Updated" + temperatureItemName),
            new UpdatedEventTrigger(roomConfig.setpointItem.name, null, "Updated" + roomConfig.setpointItem.name)
        ]
    });
};

if (getItem(roomGroup) === null) {
    logger.info(roomGroup + " group does not exist - creating it.");
    logger.info("You have to create a group item for each of your room and put it into the " + roomGroup + " group.");
    roomGroup = new GroupItem(roomGroup);
    itemRegistry.add(roomGroup);
}
if (getItem(temperatureGroup) === null) {
    logger.info(temperatureGroup + " group does not exist - creating it.");
    logger.info("You have to put the temperature sensor for each room with heating into this group.");
    var createdGroup = new GroupItem(temperatureGroup);
    itemRegistry.add(createdGroup);
}
if (getItem(setpointGroup) === null) {
    logger.info(setpointGroup + " group does not exist - creating it.");
    logger.info("You have to create a new Item with type number for each room with heating and put it into this room. " +
        "It will be the temperature setpoint to put the target temperature for this room.");
    var createdGroup = new GroupItem(setpointGroup);
    itemRegistry.add(createdGroup);
}
if (getItem(valveGroup) === null) {
    logger.info(valveGroup + " group does not exist - creating it.");
    logger.info("You have to put the valve for each room with heating into this group.");
    var createdGroup = new GroupItem(valveGroup);
    itemRegistry.add(createdGroup);
}
if (getItem(logGroup) === null) {
    logger.info(logGroup + " group does not exist - creating it.");
    logger.info("To log heating ON and OFF times and chart them you have to put one item for each room with heating into this group.");
    var createdGroup = new GroupItem(logGroup);
    itemRegistry.add(createdGroup);
}
var roomGroupItem = itemRegistry.getItem(roomGroup);
logger.info("RoomGroup: " + roomGroupItem);
var rooms = roomGroupItem.getMembers();
logger.debug("RoomGroup Members: " + rooms);
var roomsArray = rooms.toArray();
for (var roomsIdx in roomsArray) {
    var actualRoom = roomsArray[roomsIdx];
    logger.info("Room: " + actualRoom);
    var actualRoomItems = actualRoom.getMembers();

    var currentRoomConfig = {};
    currentRoomConfig.roomItem = copyItem(actualRoom);
    actualRoomItems.forEach(function (item) {
        logger.debug("Item: " + item.getName());
        var groups = item.getGroupNames();
        logger.debug("Groups: " + groups);
        if (groups.contains(setpointGroup)) {
            logger.info("Setpoint detected!");
            currentRoomConfig.setpointItem = copyItem(item);
        } else if (groups.contains(temperatureGroup)) {
            logger.info("Temperature detected!");
            currentRoomConfig.temperatureItem = copyItem(item);
        } else if (groups.contains(valveGroup)) {
            logger.info("Valve detected!");
            currentRoomConfig.valveItem = copyItem(item);
        } else if (groups.contains(logGroup)) {
            logger.info("Log detected!");
            currentRoomConfig.logItem = copyItem(item);
        }
    });
    if (currentRoomConfig.valveItem !== undefined && currentRoomConfig.temperatureItem !== undefined) {
        logger.info("Room " + currentRoomConfig.roomItem.name + " has heating.");
        if (currentRoomConfig.setpointItem === undefined) {
            logger.info("Room " + currentRoomConfig.roomItem.name + " has no setpoint. Creating one...");
            var item = new NumberItem(currentRoomConfig.roomItem.name + "_Heating_" + "Setpoint");
            item.addGroupName(currentRoomConfig.roomItem.name);
            item.addGroupName(setpointGroup);
            itemRegistry.add(item);
            currentRoomConfig.setpointItem = copyItem(item);
        }
        if (currentRoomConfig.logItem === undefined) {
            logger.info("Room " + currentRoomConfig.roomItem.name + " has no log item. Creating one...");
            var item = new NumberItem(currentRoomConfig.roomItem.name + "_Heating_" + "Log");
            item.addGroupName(currentRoomConfig.roomItem.name);
            item.addGroupName(logGroup);
            itemRegistry.add(item);
            currentRoomConfig.logItem = copyItem(item);
            postUpdate(currentRoomConfig.logItem, currentRoomConfig.valveItem.state === "ON" ? 1 : 0);
        }
        createHeatingRule(currentRoomConfig)
    }
}

/**
 * We copy the major attributes to have them easily accessible. We need the item as well to post updates etc.
 */
function copyItem(item) {
    return {
        name: item.getName(),
        groups: item.getGroupNames(),
        state: item.state,
    }
}
