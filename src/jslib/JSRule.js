'use strict';

se.importPreset("RuleSupport");
se.importPreset("RuleSimple");
se.importPreset("RuleFactories");
se.importPreset("default");

load(mainPath + 'jslib/helper.js');
load(mainPath + 'jslib/triggersAndConditions.js');

//Simplifies spelling for rules.
(function(context) {
  'use strict';
  
	context.JSRule = function(obj) {
		//logInfo("################  JSRule Line: "+__LINE__+"  #################");
		var uid = obj.uid;
		if(!uid) {
            uid = uuid.randomUUID()
		}
		var rule = new SimpleRule(){
			execute: obj.execute,
			uid: uid,
			UID: uid,
		};
		var triggers = obj.triggers ? obj.triggers : obj.getEventTrigger();

		if(obj.description){
			rule.setDescription(obj.description);
		}
		if(obj.name){
			rule.setName(obj.name);
		}
		
		//1. Register rule here
		if(triggers && triggers.length > 0){
			rule.setTriggers(triggers);
			automationManager.addRule(rule);
		}
		
		//2. OR second option, to add Rules in rulefile. Is not needed.
		return rule;
	};
  
})(this);
