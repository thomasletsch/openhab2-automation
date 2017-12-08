# OpenHAB 2 Rules
Some example automation Rules for OpenHAB 2 build with JavaScript.

Uses parts from https://github.com/lewie/openhab2-javascript

Be aware that all this is in an experimental stage. Even the rule engine used is still experimental :-). 

## Prerequisites
This rule needs OpenHAB 2.0 and higher.

You have to enable the experimental rule engine (http://docs.openhab.org/configuration/rules-ng.html). 

### Copy Lewie Libs
We use our own copy from the JS libs from https://github.com/lewie/openhab2-javascript.
Please copy all files under `src/jslib` into `openhab2/automation/jsr223/jslib`. 
Create directories if needed. Adjust the `mainPath` entries as needed.

## Roller Shutter Control
This scripts lets you create a rule for controlling a roller shutter with a switch.

### Ease of use
To use it, copy the `lib/rollershutterControl.js` to your openhab installation into `openhab2/automation/jsr223/lib`. 

To activate the rule for a switch and shutter, create a `.js` file with the following content:
    
    'use strict';
    
    se.importPreset("RuleSupport");
    se.importPreset("RuleSimple");
    se.importPreset("RuleFactories");
    
    var mainPath = '/etc/openhab2/automation/jsr223/';
    
    load(mainPath + 'lib/rollerShutterControl.js');
    
    logger.info("Starting rule RollerShutterRule");
    
    createSwitchRollershutterControl("KitchenUG_Blinds_Switch", "KitchenUG_Blinds", "KitchenUG_Blinds_Working");
    
This example will set up a rule to control the `KitchenUG_Blinds` with the switch `KitchenUG_Blinds_Switch`. The working item name is optional. See next chapter for details.
Adjust the `mainPath` to the path of your `jsr223` directory.

### Working Support
E.g. the homematic roller shutter can signal when they are still "working". This script supports this setting and can stop the roller shutter when a button is pressed and the roller shutter is still working (running).

## Underfloor Heating Control
This script is an automatic heating control system for underfloor heating valves. 

It does not require any additional scripting, it just relies on groups.
If the groups do not exist, they get created on first startup.

### Groups
- Rooms: A Room is a place which has its own heating. Entries in this group are groups themselves (we call them a room / room group) and get evaluated if they are heating candidates.

- Temperature: Every temperature sensor used for heating control must be in this group and in the according room group for which the temperature is measured. Mandatory item for a room to have heating.

- HeatingValve: The actual valve to control must be in this group and in the room group. It is assumed that this is a switch. Mandatory item for a room to have heating. 

- HeatingSetpoint: The target temperature for each room is a number item in this group and in the room group. If it does not exist, it gets created on first startup.

- HeatingLog: To protocol the times when heating is on for a room, we also use an additional number item which gets a "1" when heating is ON and a "0" when its off. If it does not exist, it gets created on first startup. To protocol the heating, this Group should be persisted.

### Example
Groups: Rooms, Temperature, HeatingValve, HeatingSetpoint, HeatingLog, LivingRoom

Items:
- LivingRoomTemp, groups: Temperature, LivingRoom
- LivingRoomValve, groups: HeatingValves, LivingRoom
- LivingRoomTargetTemp, groups: HeatingSetpoint, LivingRoom

The heating log item will get created automatically...

### Heating Rule evaluation
The rule for each room gets triggered on Temperature item change and on HeatingSetpoint item change. 

The algorithm is still very simple:

If the setpoint temperature is higher than the actual temperature, the heating valve is turned ON. If the setpoint temperature is lower than the heating is turned OFF.

### Known Problems
On openhab 2.1.0 the heating rule gets errors on first startup (it doesn't find the `itemRegistry` etc.). It seems the script is running too early. 
If such errors occure, wait until the server is started totally and than just trigger the script again (by touch the file or edit a blank space in it)  
