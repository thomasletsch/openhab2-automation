'use strict';
se.importPreset("RuleSupport");
se.importPreset("RuleFactories");

if(HashSet == undefined)var HashSet = Java.type("java.util.HashSet");
if(Visibility == undefined)var Visibility = Java.type("org.eclipse.smarthome.automation.Visibility");
if(TriggerHandler == undefined)var TriggerHandler = Java.type("org.eclipse.smarthome.automation.handler.TriggerHandler");
if(Trigger == undefined)var Trigger = Java.type("org.eclipse.smarthome.automation.Trigger");


// ### ChangedEventTrigger ###
var ItemStateChangeTrigger = function(itemName, oldState, newState, triggerName){
    return new Trigger( getTrName(triggerName), "core.ItemStateChangeTrigger", new Configuration({
        "itemName": itemName,
        "state": newState,
        "oldState": oldState
    }));
}
var ChangedEventTrigger = ItemStateChangeTrigger; 


// ### UpdatedEventTrigger ###
var ItemStateUpdateTrigger = function(itemName, state, triggerName){
    return new Trigger( getTrName(triggerName), "core.ItemStateUpdateTrigger", new Configuration({
        "itemName": itemName,
        "state": state
    }));
}
var UpdatedEventTrigger = ItemStateUpdateTrigger; 


// ### CommandEventTrigger ###
var ItemCommandTrigger = function(itemName, command, triggerName){
	//logWarn("#### CommandEventTrigger "+__LINE__, triggerName);
    return new Trigger( getTrName(triggerName), "core.ItemCommandTrigger", new Configuration({
        "itemName": itemName,
        "command": command
    }));
}
var CommandEventTrigger = ItemCommandTrigger; 

// ### TimerTrigger ###
//!!!!!!!! timer.GenericCronTrigger !!!!!!!!!!!!!
var GenericCronTrigger = function(expression, triggerName){
    return new Trigger( getTrName(triggerName), "timer.GenericCronTrigger", new Configuration({
        "cronExpression": expression
    }));
}
var TimerTrigger = GenericCronTrigger; 


// ### stateCondition ###
var ItemStateCondition = function(itemName, state, condName){
    return new Condition( getTrName(condName), "core.ItemStateCondition", new Configuration({
        "itemName": itemName,
        "operator": "=",
        "state": state
    }));
}
var stateCondition = ItemStateCondition; 

// ### GenericCompareCondition ###
var GenericCompareCondition = function(itemName, state, operator, condName){
    return new Condition( getTrName(condName), "core.GenericCompareCondition", new Configuration({
        "itemName": itemName,
        "operator": operator,// matches, ==, <, >, =<, =>
        "state": state
    }));
}
//compareCondition("itemName", OFF, "==", "condNameOfCompareCondition")
var compareCondition = GenericCompareCondition; 



var getTrName = function(trn){
	return trn == undefined || trn == null || trn == "" ? uuid.randomUUID() : trn;
}
